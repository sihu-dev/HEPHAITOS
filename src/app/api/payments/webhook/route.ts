// ============================================
// Payment Webhook API
// 토스페이먼츠 웹훅 수신 API
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { getTossPaymentsClient } from '@/lib/payments/toss-payments'
import { verifyWebhookSignature } from '@/lib/api/providers/toss-payments'

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
        console.error('[Webhook] TOSS_WEBHOOK_SECRET not configured in production')
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
      }

      if (!signature) {
        console.warn('[Webhook] Missing signature header')
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
      }

      const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret)
      if (!isValid) {
        console.warn('[Webhook] Invalid signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const payload: WebhookPayload = JSON.parse(rawBody)

    console.log('[Webhook] Received:', {
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
        console.log('[Webhook] Unhandled event type:', payload.eventType)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Webhook] Error:', error)
    // Webhook은 항상 200을 반환해야 재시도를 방지할 수 있음
    return NextResponse.json({ success: false })
  }
}

async function handlePaymentStatusChanged(data: WebhookPayload['data']) {
  if (!data.paymentKey) return

  const client = getTossPaymentsClient()
  const payment = await client.getPayment(data.paymentKey)

  if (!payment) {
    console.warn('[Webhook] Payment not found:', data.paymentKey)
    return
  }

  console.log('[Webhook] Payment status:', {
    orderId: payment.orderId,
    status: payment.status,
  })

  // TODO: 실제 구현 시 여기서 결제 상태에 따른 처리
  // - completed: 구독 활성화
  // - cancelled: 구독 취소
  // - failed: 결제 실패 처리
}

async function handleBillingKeyChanged(data: WebhookPayload['data']) {
  console.log('[Webhook] Billing key changed:', data)
  // TODO: 정기결제 키 상태 변경 처리
}

async function handleDepositCallback(data: WebhookPayload['data']) {
  console.log('[Webhook] Deposit callback:', data)
  // TODO: 가상계좌 입금 완료 처리
}
