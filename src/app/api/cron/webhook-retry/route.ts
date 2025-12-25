// ============================================
// Webhook Retry Cron Job
// GPT V1 피드백: DLQ 재시도 처리
// Vercel Cron: 매 분 실행
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { notifyDLQItem } from '@/lib/notifications/slack'
import { safeLogger } from '@/lib/utils/safe-logger'
import { withRateLimit } from '@/lib/api/middleware/rate-limit'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Vercel Cron 인증
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return false

  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    safeLogger.warn('[Cron] CRON_SECRET not configured')
    return false
  }

  return authHeader === `Bearer ${cronSecret}`
}

async function GETHandler(request: NextRequest) {
  // 개발 환경에서는 인증 스킵
  if (process.env.NODE_ENV === 'production' && !verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  let processed = 0
  let failed = 0
  let movedToDLQ = 0

  try {
    // 재시도 대기 중인 웹훅 조회
    const { data: pendingRetries, error: fetchError } = await supabase.rpc(
      'get_pending_webhook_retries',
      { p_limit: 10 }
    )

    if (fetchError) {
      safeLogger.error('[Cron] Failed to fetch pending retries', { error: fetchError })
      return NextResponse.json(
        { error: 'Failed to fetch pending retries' },
        { status: 500 }
      )
    }

    if (!pendingRetries || pendingRetries.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending retries',
        processed: 0,
      })
    }

    // 각 웹훅 재처리
    for (const retry of pendingRetries) {
      try {
        // 웹훅 이벤트 조회
        const { data: webhookEvent, error: eventError } = await supabase
          .from('webhook_events')
          .select('*')
          .eq('event_id', retry.event_id)
          .single()

        if (eventError || !webhookEvent) {
          safeLogger.error('[Cron] Webhook event not found', { eventId: retry.event_id })
          failed++
          continue
        }

        // 실제 웹훅 처리
        const processResult = await processWebhookRetry(webhookEvent)

        if (processResult.success) {
          // 성공 시 재시도 기록 업데이트
          await supabase
            .from('webhook_retries')
            .update({
              status: 'resolved',
              resolved_at: new Date().toISOString(),
            })
            .eq('id', retry.id)

          // 웹훅 이벤트 상태 업데이트
          await supabase
            .from('webhook_events')
            .update({ status: 'processed' })
            .eq('event_id', retry.event_id)

          processed++
        } else {
          // 실패 시 다음 재시도 스케줄 또는 DLQ 이동
          const { error: scheduleError } = await supabase.rpc(
            'schedule_webhook_retry',
            {
              p_event_id: retry.event_id,
              p_error: processResult.error || 'Unknown error',
            }
          )

          if (scheduleError) {
            // DLQ로 이동됨
            movedToDLQ++

            // Slack 알림 전송
            await notifyDLQItem({
              eventId: retry.event_id,
              orderId: webhookEvent.order_id || 'unknown',
              error: processResult.error || 'Unknown error',
              failureCount: retry.retry_count + 1,
              provider: webhookEvent.provider || 'unknown',
            })
          }

          failed++
        }
      } catch (err) {
        safeLogger.error('[Cron] Error processing retry', {
          eventId: retry.event_id,
          error: err,
        })
        failed++
      }
    }

    const duration = Date.now() - startTime

    safeLogger.info('[Cron] Webhook retry completed', {
      processed,
      failed,
      movedToDLQ,
      duration,
    })

    return NextResponse.json({
      success: true,
      processed,
      failed,
      movedToDLQ,
      duration,
    })
  } catch (error) {
    safeLogger.error('[Cron] Webhook retry job failed', { error })
    return NextResponse.json(
      { error: 'Cron job failed', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}

/**
 * 웹훅 재처리 로직
 */
async function processWebhookRetry(
  webhookEvent: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const provider = webhookEvent.provider as string

  try {
    if (provider === 'toss') {
      // Toss 결제 확인 재시도
      const payload = webhookEvent.payload as Record<string, unknown>
      const paymentKey = payload?.paymentKey as string

      if (!paymentKey) {
        return { success: false, error: 'Missing paymentKey' }
      }

      // Toss API 호출로 결제 상태 확인
      const secretKey = process.env.TOSS_SECRET_KEY
      if (!secretKey) {
        return { success: false, error: 'Missing TOSS_SECRET_KEY' }
      }

      const authString = Buffer.from(secretKey + ':').toString('base64')

      const tossResponse = await fetch(
        `https://api.tosspayments.com/v1/payments/${paymentKey}`,
        {
          headers: {
            Authorization: `Basic ${authString}`,
          },
        }
      )

      if (!tossResponse.ok) {
        return { success: false, error: `Toss API error: ${tossResponse.status}` }
      }

      const payment = await tossResponse.json()

      if (payment.status === 'DONE') {
        // 크레딧 지급
        const orderId = payment.orderId
        const amount = payment.totalAmount

        const { error: grantError } = await supabase.rpc('grant_credits_for_paid_order', {
          p_order_id: orderId,
          p_payment_key: paymentKey,
          p_paid_amount: amount,
          p_raw: payment,
        })

        if (grantError) {
          // 이미 지급된 경우 (멱등성)
          if (grantError.message?.includes('paid') || grantError.message?.includes('already')) {
            return { success: true }
          }
          return { success: false, error: `Grant credits failed: ${grantError.message}` }
        }

        return { success: true }
      }

      return { success: false, error: `Payment status: ${payment.status}` }
    }

    // 다른 provider 처리
    return { success: false, error: `Unknown provider: ${provider}` }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Vercel Cron 설정
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export const GET = withRateLimit(GETHandler, { category: 'api' })
