// ============================================
// Toss Webhook Handler
// Loop 14: 웹훅 이벤트 시스템
// GPT V1 피드백: Dead Letter Queue + Retry 시스템
// ============================================

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHmac } from 'crypto'
import { safeLogger } from '@/lib/utils/safe-logger'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Toss webhook payload type
interface TossWebhookPayload {
  eventId?: string
  orderId: string
  status: string
  paymentKey?: string
  totalAmount?: number
  [key: string]: unknown
}

/**
 * POST /api/payments/webhook/toss
 * 토스페이먼츠 웹훅 수신
 */
export async function POST(req: Request) {
  try {
    const body = await req.text()
    const signature = req.headers.get('toss-signature')

    // 1. 서명 검증
    if (!verifyTossSignature(body, signature)) {
      console.error('[Toss Webhook] Invalid signature')
      return NextResponse.json({ error: 'INVALID_SIGNATURE' }, { status: 401 })
    }

    const payload = JSON.parse(body)
    const eventId = payload.eventId || crypto.randomUUID()
    const orderId = payload.orderId

    console.log(`[Toss Webhook] Received event ${eventId} for order ${orderId}`)

    // 2. 웹훅 이벤트 저장 (멱등성)
    const { error: insertError } = await supabaseAdmin
      .from('payment_webhook_events')
      .insert({
        provider: 'toss',
        event_id: eventId,
        order_id: orderId,
        payload,
        process_status: 'pending',
      })

    if (insertError) {
      // 중복 이벤트 (멱등)
      if (insertError.code === '23505') {
        console.log(`[Toss Webhook] Duplicate event ${eventId}, ignoring`)
        return NextResponse.json({ received: true })
      }

      console.error('[Toss Webhook] Event insert error:', insertError)
      return NextResponse.json({ error: 'EVENT_INSERT_FAILED' }, { status: 500 })
    }

    // 3. 즉시 처리 시도 (동기)
    try {
      await processWebhookEvent(eventId, payload)
    } catch (error) {
      console.error('[Toss Webhook] Processing error:', error)
      // 실패해도 200 반환 (나중에 재처리)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Toss Webhook] POST error:', error)
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}

/**
 * 토스 서명 검증
 */
function verifyTossSignature(body: string, signature: string | null): boolean {
  if (!signature) return false
  if (!process.env.TOSS_WEBHOOK_SECRET) {
    console.warn('[Toss Webhook] TOSS_WEBHOOK_SECRET not set, skipping verification')
    return true // 개발 환경
  }

  const expectedSignature = createHmac('sha256', process.env.TOSS_WEBHOOK_SECRET)
    .update(body)
    .digest('hex')

  return signature === expectedSignature
}

/**
 * 웹훅 이벤트 처리
 */
async function processWebhookEvent(eventId: string, payload: TossWebhookPayload): Promise<void> {
  const { orderId, status, paymentKey, totalAmount } = payload

  // 결제 성공 이벤트만 처리
  if (status !== 'DONE') {
    console.log(`[Toss Webhook] Event ${eventId} status is ${status}, skipping`)
    await supabaseAdmin
      .from('payment_webhook_events')
      .update({ process_status: 'ignored' })
      .eq('event_id', eventId)
    return
  }

  try {
    // Confirm API가 실패했을 때 웹훅으로 보완
    const { error } = await supabaseAdmin.rpc('grant_credits_for_paid_order', {
      p_order_id: orderId,
      p_payment_key: paymentKey,
      p_paid_amount: totalAmount,
      p_raw: payload,
    })

    if (error) {
      // 이미 지급된 경우는 OK (멱등성)
      if (error.message.includes('paid')) {
        console.log(`[Toss Webhook] Order ${orderId} already paid, ignoring`)
        await supabaseAdmin
          .from('payment_webhook_events')
          .update({ process_status: 'processed', processed_at: new Date().toISOString() })
          .eq('event_id', eventId)
        return
      }

      throw error
    }

    // 성공
    await supabaseAdmin
      .from('payment_webhook_events')
      .update({ process_status: 'processed', processed_at: new Date().toISOString() })
      .eq('event_id', eventId)

    console.log(`[Toss Webhook] Event ${eventId} processed successfully`)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    safeLogger.error(`[Toss Webhook] Event ${eventId} processing failed`, { error: errorMessage })

    // 재시도 스케줄링 (exponential backoff, max 3회)
    const { error: scheduleError } = await supabaseAdmin.rpc('schedule_webhook_retry', {
      p_event_id: eventId,
      p_error: errorMessage,
    })

    if (scheduleError) {
      safeLogger.error('[Toss Webhook] Failed to schedule retry', { error: scheduleError })
      // Fallback: 직접 업데이트
      await supabaseAdmin
        .from('payment_webhook_events')
        .update({
          process_status: 'failed',
          error: errorMessage,
        })
        .eq('event_id', eventId)
    }

    throw error
  }
}

// Type for pending webhook retry records
interface PendingWebhookRetry {
  event_id: string
  provider: string
  order_id: string
  payload: TossWebhookPayload
  retry_count: number
}

/**
 * 재시도 대상 웹훅 처리 (Cron Job용)
 * Note: 별도 cron route에서 import하여 사용
 */
async function processRetryQueue(): Promise<{ processed: number; failed: number }> {
  const { data: pendingRetries, error } = await supabaseAdmin.rpc('get_pending_webhook_retries', {
    p_limit: 10,
  })

  if (error || !pendingRetries) {
    safeLogger.error('[Toss Webhook] Failed to get pending retries', { error })
    return { processed: 0, failed: 0 }
  }

  let processed = 0
  let failed = 0

  for (const event of pendingRetries as unknown as PendingWebhookRetry[]) {
    try {
      await processWebhookEvent(event.event_id, event.payload)
      processed++
    } catch {
      failed++
    }
  }

  safeLogger.info('[Toss Webhook] Retry queue processed', { processed, failed })
  return { processed, failed }
}
