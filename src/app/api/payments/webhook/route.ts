// ============================================
// Payment Webhook API
// 토스페이먼츠 웹훅 수신 API
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getTossPaymentsClient } from '@/lib/payments/toss-payments'
import { verifyWebhookSignature } from '@/lib/api/providers/toss-payments'
import { safeLogger } from '@/lib/utils/safe-logger'

// Supabase Admin Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Webhook event types
type WebhookEventType =
  | 'PAYMENT_STATUS_CHANGED'
  | 'BILLING_KEY_STATUS_CHANGED'
  | 'DEPOSIT_CALLBACK'
  | 'PAYOUT_STATUS_CHANGED'

interface WebhookPayload {
  eventType: WebhookEventType
  createdAt: string
  data: {
    paymentKey?: string
    orderId?: string
    status?: string
    transactionKey?: string
    secret?: string
    billingKey?: string
    customerId?: string
    card?: Record<string, unknown>
  }
}

// Toss status to local status mapping
function mapTossStatusToLocal(tossStatus: string): string {
  const statusMap: Record<string, string> = {
    DONE: 'paid',
    CANCELED: 'cancelled',
    PARTIAL_CANCELED: 'refunded',
    WAITING_FOR_DEPOSIT: 'pending',
    EXPIRED: 'failed',
    ABORTED: 'failed',
  }
  return statusMap[tossStatus] || 'pending'
}

export async function POST(request: NextRequest) {
  try {
    // Raw body와 signature 추출
    const rawBody = await request.text()
    const signature = request.headers.get('x-toss-signature') || ''
    const webhookSecret = process.env.TOSS_WEBHOOK_SECRET

    // Production 환경에서 시그니처 검증 필수
    if (process.env.NODE_ENV === 'production') {
      if (!webhookSecret) {
        safeLogger.error('[Webhook] TOSS_WEBHOOK_SECRET not configured in production')
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
      }

      if (!signature) {
        safeLogger.warn('[Webhook] Missing signature header')
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
      }

      const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret)
      if (!isValid) {
        safeLogger.warn('[Webhook] Invalid signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const payload: WebhookPayload = JSON.parse(rawBody)

    safeLogger.info('[Webhook] Received', {
      eventType: payload.eventType,
      createdAt: payload.createdAt,
      orderId: payload.data.orderId,
    })

    switch (payload.eventType) {
      case 'PAYMENT_STATUS_CHANGED':
        await handlePaymentStatusChanged(payload.data)
        break

      case 'BILLING_KEY_STATUS_CHANGED':
        await handleBillingKeyChanged(payload.data)
        break

      case 'DEPOSIT_CALLBACK':
        await handleDepositCallback(payload.data)
        break

      default:
        safeLogger.info('[Webhook] Unhandled event type', { eventType: payload.eventType })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    safeLogger.error('[Webhook] Error', { error })
    // Webhook은 항상 200을 반환해야 재시도를 방지할 수 있음
    return NextResponse.json({ success: false })
  }
}

/**
 * 결제 상태 변경 처리
 */
async function handlePaymentStatusChanged(data: WebhookPayload['data']) {
  if (!data.paymentKey) return

  const client = getTossPaymentsClient()
  const payment = await client.getPayment(data.paymentKey)

  if (!payment) {
    safeLogger.warn('[Webhook] Payment not found', { paymentKey: data.paymentKey })
    return
  }

  safeLogger.info('[Webhook] Payment status', {
    orderId: payment.orderId,
    status: payment.status,
  })

  // 1. payment_orders 테이블 업데이트
  const { error: updateError } = await supabaseAdmin
    .from('payment_orders')
    .update({
      status: mapTossStatusToLocal(payment.status),
      payment_key: payment.paymentKey,
      paid_at: payment.approvedAt || null,
      raw: payment,
      updated_at: new Date().toISOString(),
    })
    .eq('order_id', payment.orderId)

  if (updateError) {
    safeLogger.error('[Webhook] Failed to update payment_orders', { error: updateError })
  }

  // 2. 상태별 처리
  switch (payment.status) {
    case 'DONE':
      await handlePaymentCompleted(payment)
      break
    case 'CANCELED':
      await handlePaymentCanceled(payment)
      break
    case 'PARTIAL_CANCELED':
      await handlePartialRefund(payment)
      break
    default:
      safeLogger.info('[Webhook] Unhandled payment status', { status: payment.status })
  }
}

/**
 * 결제 완료 처리 - 크레딧 충전
 */
async function handlePaymentCompleted(payment: {
  orderId: string
  paymentKey: string
  totalAmount: number
  approvedAt?: string
}) {
  safeLogger.info('[Webhook] Processing payment completion', {
    orderId: payment.orderId,
    amount: payment.totalAmount,
  })

  try {
    // RPC로 크레딧 지급
    const { error: rpcError } = await supabaseAdmin.rpc('grant_credits_for_paid_order', {
      p_order_id: payment.orderId,
      p_payment_key: payment.paymentKey,
      p_paid_amount: payment.totalAmount,
      p_raw: payment,
    })

    if (rpcError) {
      // 이미 지급된 경우는 무시
      if (rpcError.message?.includes('paid') || rpcError.message?.includes('already')) {
        safeLogger.info('[Webhook] Credits already granted', { orderId: payment.orderId })
        return
      }
      safeLogger.error('[Webhook] Failed to grant credits', { error: rpcError })
      throw rpcError
    }

    safeLogger.info('[Webhook] Credits granted successfully', { orderId: payment.orderId })
  } catch (error) {
    safeLogger.error('[Webhook] Payment completion failed', { error })
    throw error
  }
}

/**
 * 결제 취소 처리
 */
async function handlePaymentCanceled(payment: {
  orderId: string
  paymentKey: string
  cancels?: Array<{ cancelAmount: number; cancelReason: string }>
}) {
  safeLogger.info('[Webhook] Processing payment cancellation', {
    orderId: payment.orderId,
  })

  const cancelInfo = payment.cancels?.[0]

  // 환불 이력 업데이트
  await supabaseAdmin
    .from('payment_orders')
    .update({
      status: 'cancelled',
      refund_amount: cancelInfo?.cancelAmount,
      refund_reason: cancelInfo?.cancelReason,
      refunded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('order_id', payment.orderId)

  safeLogger.info('[Webhook] Payment cancelled', { orderId: payment.orderId })
}

/**
 * 부분 환불 처리
 */
async function handlePartialRefund(payment: {
  orderId: string
  cancels?: Array<{ cancelAmount: number; cancelReason: string }>
}) {
  safeLogger.info('[Webhook] Processing partial refund', {
    orderId: payment.orderId,
  })

  const totalRefunded = payment.cancels?.reduce((sum, c) => sum + c.cancelAmount, 0) || 0

  await supabaseAdmin
    .from('payment_orders')
    .update({
      status: 'refunded',
      refund_amount: totalRefunded,
      refunded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('order_id', payment.orderId)
}

/**
 * 정기결제 키 상태 변경 처리
 */
async function handleBillingKeyChanged(data: WebhookPayload['data']) {
  if (!data.billingKey || !data.customerId) {
    safeLogger.warn('[Webhook] Missing billingKey or customerId')
    return
  }

  safeLogger.info('[Webhook] Billing key changed', {
    customerId: data.customerId,
    status: data.status,
  })

  // billing_keys 테이블 upsert
  const { error } = await supabaseAdmin
    .from('billing_keys')
    .upsert({
      user_id: data.customerId,
      billing_key: data.billingKey,
      status: data.status || 'READY',
      card_info: data.card || {},
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    })

  if (error) {
    safeLogger.error('[Webhook] Failed to update billing_keys', { error })
  }
}

/**
 * 가상계좌 입금 완료 처리
 */
async function handleDepositCallback(data: WebhookPayload['data']) {
  if (!data.orderId || !data.secret) {
    safeLogger.warn('[Webhook] Missing orderId or secret for deposit')
    return
  }

  safeLogger.info('[Webhook] Deposit callback received', {
    orderId: data.orderId,
    status: data.status,
  })

  // 입금 완료 확인
  if (data.status !== 'DONE') {
    safeLogger.info('[Webhook] Deposit not complete', { status: data.status })
    return
  }

  // 주문 정보 조회
  const { data: order, error: orderError } = await supabaseAdmin
    .from('payment_orders')
    .select('user_id, credits, amount')
    .eq('order_id', data.orderId)
    .single()

  if (orderError || !order) {
    safeLogger.error('[Webhook] Order not found for deposit', { orderId: data.orderId })
    return
  }

  // 주문 상태 업데이트 및 크레딧 지급
  await supabaseAdmin
    .from('payment_orders')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('order_id', data.orderId)

  // 크레딧 지급
  const { error: rpcError } = await supabaseAdmin.rpc('grant_credits_for_paid_order', {
    p_order_id: data.orderId,
    p_payment_key: data.paymentKey || '',
    p_paid_amount: order.amount,
    p_raw: data,
  })

  if (rpcError && !rpcError.message?.includes('already')) {
    safeLogger.error('[Webhook] Failed to grant credits for deposit', { error: rpcError })
  } else {
    safeLogger.info('[Webhook] Deposit processed successfully', { orderId: data.orderId })
  }
}
