// ============================================
// Webhook Retry Worker (BullMQ)
// Loop 14: 웹훅 재처리 시스템
// ============================================

import { Worker, Queue } from 'bullmq'
import { Redis } from 'ioredis'
import { createClient } from '@supabase/supabase-js'
import { safeLogger } from '@/lib/utils/safe-logger';

const redis = new Redis(process.env.UPSTASH_REDIS_URL!, {
  maxRetriesPerRequest: null,
})

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Webhook 재처리 큐
 */
export const webhookQueue = new Queue('webhook-retry', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 10000, // 10초부터 시작
    },
  },
})

/**
 * Webhook 재처리 Worker
 */
export const webhookWorker = new Worker(
  'webhook-retry',
  async (job) => {
    const { eventId } = job.data

    safeLogger.info(`[Webhook Worker] Processing event ${eventId}`)

    // 1. 이벤트 조회
    const { data: event, error } = await supabaseAdmin
      .from('payment_webhook_events')
      .select('*')
      .eq('event_id', eventId)
      .single()

    if (error || !event) {
      safeLogger.error(`[Webhook Worker] Event ${eventId} not found`)
      throw new Error('EVENT_NOT_FOUND')
    }

    // 이미 처리됨
    if (event.process_status === 'processed') {
      safeLogger.info(`[Webhook Worker] Event ${eventId} already processed`)
      return { status: 'already_processed' }
    }

    const { orderId, status, paymentKey, totalAmount } = event.payload

    // 결제 성공 이벤트만 처리
    if (status !== 'DONE') {
      await supabaseAdmin
        .from('payment_webhook_events')
        .update({ process_status: 'ignored' })
        .eq('event_id', eventId)
      return { status: 'ignored' }
    }

    try {
      // 크레딧 지급 시도
      const { error: rpcError } = await supabaseAdmin.rpc('grant_credits_for_paid_order', {
        p_order_id: orderId,
        p_payment_key: paymentKey,
        p_paid_amount: totalAmount,
        p_raw: event.payload,
      })

      if (rpcError) {
        // 이미 지급된 경우는 OK
        if (rpcError.message.includes('paid')) {
          await supabaseAdmin
            .from('payment_webhook_events')
            .update({ process_status: 'processed', processed_at: new Date().toISOString() })
            .eq('event_id', eventId)
          return { status: 'already_paid' }
        }

        throw rpcError
      }

      // 성공
      await supabaseAdmin
        .from('payment_webhook_events')
        .update({ process_status: 'processed', processed_at: new Date().toISOString() })
        .eq('event_id', eventId)

      safeLogger.info(`[Webhook Worker] Event ${eventId} processed successfully`)
      return { status: 'success' }
    } catch (error) {
      safeLogger.error(`[Webhook Worker] Event ${eventId} processing failed:`, error)

      await supabaseAdmin
        .from('payment_webhook_events')
        .update({
          process_status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('event_id', eventId)

      throw error
    }
  },
  {
    connection: redis,
    concurrency: 3,
  }
)

/**
 * Worker 이벤트 핸들러
 */
webhookWorker.on('completed', (job) => {
  safeLogger.info(`[Webhook Worker] Job ${job.id} completed:`, job.returnvalue)
})

webhookWorker.on('failed', (job, err) => {
  safeLogger.error(`[Webhook Worker] Job ${job?.id} failed:`, err.message)
})

/**
 * 실패한 웹훅 이벤트 재처리 (Cron)
 */
export async function retryFailedWebhookEvents(): Promise<void> {
  const { data: failedEvents } = await supabaseAdmin
    .from('payment_webhook_events')
    .select('event_id')
    .eq('process_status', 'failed')
    .limit(10)

  if (!failedEvents || failedEvents.length === 0) {
    safeLogger.info('[Webhook Retry] No failed events to retry')
    return
  }

  safeLogger.info(`[Webhook Retry] Retrying ${failedEvents.length} failed events`)

  for (const event of failedEvents) {
    await webhookQueue.add('retry-event', { eventId: event.event_id })
  }
}

/**
 * Graceful shutdown
 */
process.on('SIGTERM', async () => {
  safeLogger.info('[Webhook Worker] Shutting down gracefully...')
  await webhookWorker.close()
  process.exit(0)
})
