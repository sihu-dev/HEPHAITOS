// ============================================
// Payment Webhook API
// 토스페이먼츠 웹훅 수신 API
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { getTossPaymentsClient } from '@/lib/payments/toss-payments'
import { verifyWebhookSignature } from '@/lib/api/providers/toss-payments'
import { safeLogger } from '@/lib/utils/safe-logger'

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
  }
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
        safeLogger.warn('[Webhook] Invalid signature', { signatureLength: signature.length })
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
        safeLogger.warn('[Webhook] Unhandled event type', { eventType: payload.eventType })
    }

    safeLogger.info('[Webhook] Processing completed', { eventType: payload.eventType })
    return NextResponse.json({ success: true })
  } catch (error) {
    safeLogger.error('[Webhook] Error processing webhook', { error })
    // Webhook은 항상 200을 반환해야 재시도를 방지할 수 있음
    return NextResponse.json({ success: false })
  }
}

async function handlePaymentStatusChanged(data: WebhookPayload['data']) {
  try {
    if (!data.paymentKey) {
      safeLogger.warn('[Webhook] Missing paymentKey in PAYMENT_STATUS_CHANGED event')
      return
    }

    const client = getTossPaymentsClient()
    const payment = await client.getPayment(data.paymentKey)

    if (!payment) {
      safeLogger.warn('[Webhook] Payment not found', { paymentKey: data.paymentKey })
      return
    }

    safeLogger.info('[Webhook] Payment status changed', {
      orderId: payment.orderId,
      status: payment.status,
      paymentKey: data.paymentKey,
    })

    // TODO: 실제 구현 시 여기서 결제 상태에 따른 처리
    // - completed: 구독 활성화
    // - cancelled: 구독 취소
    // - failed: 결제 실패 처리
    switch (payment.status) {
      case 'completed':
        safeLogger.info('[Webhook] Payment completed - subscription activation needed', {
          orderId: payment.orderId,
        })
        break
      case 'cancelled':
        safeLogger.info('[Webhook] Payment cancelled - subscription cancellation needed', {
          orderId: payment.orderId,
        })
        break
      case 'failed':
        safeLogger.warn('[Webhook] Payment failed', {
          orderId: payment.orderId,
          status: payment.status,
        })
        break
    }
  } catch (error) {
    safeLogger.error('[Webhook] Error handling payment status change', {
      error,
      paymentKey: data.paymentKey,
    })
  }
}

async function handleBillingKeyChanged(data: WebhookPayload['data']) {
  try {
    safeLogger.info('[Webhook] Billing key changed', { data })
    // TODO: 정기결제 키 상태 변경 처리
  } catch (error) {
    safeLogger.error('[Webhook] Error handling billing key change', { error })
  }
}

async function handleDepositCallback(data: WebhookPayload['data']) {
  try {
    safeLogger.info('[Webhook] Deposit callback received', { data })
    // TODO: 가상계좌 입금 완료 처리
  } catch (error) {
    safeLogger.error('[Webhook] Error handling deposit callback', { error })
  }
}
