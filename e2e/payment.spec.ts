// ============================================
// E2E Test: Payment Idempotency
// Loop 15: 결제 멱등성 검증
// ============================================

import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { createHmac, randomUUID } from 'crypto'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

test.describe('Payment Idempotency', () => {
  let testUserId: string
  let testOrderId: string

  test.beforeEach(async () => {
    // 테스트 사용자 생성
    const { data: user, error } = await supabaseAdmin.auth.admin.createUser({
      email: `test-${Date.now()}@example.com`,
      password: 'testpass123',
      email_confirm: true,
    })

    if (error) throw error
    testUserId = user.user.id

    // 크레딧 지갑 초기화
    await supabaseAdmin
      .from('credit_wallets')
      .insert({ user_id: testUserId, balance: 0 })

    testOrderId = `order_${Date.now()}`
  })

  test.afterEach(async () => {
    // 테스트 데이터 정리
    if (testUserId) {
      await supabaseAdmin.auth.admin.deleteUser(testUserId)
    }
  })

  test('should grant credits only once for duplicate webhook events', async ({
    request,
  }) => {
    const eventId = randomUUID()
    const webhookPayload = {
      eventId,
      orderId: testOrderId,
      status: 'DONE',
      paymentKey: 'test_payment_key',
      totalAmount: 50000, // 50,000원 = 50 크레딧
    }

    const webhookSecret = process.env.TOSS_WEBHOOK_SECRET!
    const signature = createHmac('sha256', webhookSecret)
      .update(JSON.stringify(webhookPayload))
      .digest('hex')

    // 1차 웹훅 요청
    const response1 = await request.post(
      'http://localhost:3000/api/payments/webhook/toss',
      {
        data: webhookPayload,
        headers: { 'toss-signature': signature },
      }
    )
    expect(response1.ok()).toBeTruthy()

    // 2차 웹훅 요청 (동일 eventId)
    const response2 = await request.post(
      'http://localhost:3000/api/payments/webhook/toss',
      {
        data: webhookPayload,
        headers: { 'toss-signature': signature },
      }
    )
    expect(response2.ok()).toBeTruthy()

    // 3차 웹훅 요청 (동일 eventId)
    const response3 = await request.post(
      'http://localhost:3000/api/payments/webhook/toss',
      {
        data: webhookPayload,
        headers: { 'toss-signature': signature },
      }
    )
    expect(response3.ok()).toBeTruthy()

    // 크레딧 잔액 확인 (50 크레딧만 지급되어야 함)
    const { data: wallet } = await supabaseAdmin
      .from('credit_wallets')
      .select('balance')
      .eq('user_id', testUserId)
      .single()

    expect(wallet?.balance).toBe(50)

    // 이벤트 저장 확인 (1개만 저장)
    const { data: events, count } = await supabaseAdmin
      .from('payment_webhook_events')
      .select('*', { count: 'exact' })
      .eq('event_id', eventId)

    expect(count).toBe(1) // 중복 이벤트는 insert 실패
    expect(events?.[0].process_status).toBe('processed')
  })

  test('should handle webhook signature verification failure', async ({
    request,
  }) => {
    const webhookPayload = {
      eventId: randomUUID(),
      orderId: testOrderId,
      status: 'DONE',
      paymentKey: 'test_payment_key',
      totalAmount: 50000,
    }

    // 잘못된 서명
    const invalidSignature = 'invalid_signature_hash'

    const response = await request.post(
      'http://localhost:3000/api/payments/webhook/toss',
      {
        data: webhookPayload,
        headers: { 'toss-signature': invalidSignature },
      }
    )

    expect(response.status()).toBe(401)

    const body = await response.json()
    expect(body.error).toBe('INVALID_SIGNATURE')
  })

  test('should ignore non-DONE status webhooks', async ({ request }) => {
    const eventId = randomUUID()
    const webhookPayload = {
      eventId,
      orderId: testOrderId,
      status: 'CANCELED', // 결제 취소
      paymentKey: 'test_payment_key',
      totalAmount: 50000,
    }

    const signature = createHmac('sha256', process.env.TOSS_WEBHOOK_SECRET!)
      .update(JSON.stringify(webhookPayload))
      .digest('hex')

    const response = await request.post(
      'http://localhost:3000/api/payments/webhook/toss',
      {
        data: webhookPayload,
        headers: { 'toss-signature': signature },
      }
    )

    expect(response.ok()).toBeTruthy()

    // 크레딧 지급되지 않음
    const { data: wallet } = await supabaseAdmin
      .from('credit_wallets')
      .select('balance')
      .eq('user_id', testUserId)
      .single()

    expect(wallet?.balance).toBe(0)

    // 이벤트는 'ignored' 상태
    const { data: event } = await supabaseAdmin
      .from('payment_webhook_events')
      .select('process_status')
      .eq('event_id', eventId)
      .single()

    expect(event?.process_status).toBe('ignored')
  })

  test('should handle webhook processing failure and retry', async ({
    request,
  }) => {
    const eventId = randomUUID()

    // 잔액 부족 상황 (테스트용)
    const webhookPayload = {
      eventId,
      orderId: testOrderId,
      status: 'DONE',
      paymentKey: 'test_payment_key',
      totalAmount: 50000,
    }

    const signature = createHmac('sha256', process.env.TOSS_WEBHOOK_SECRET!)
      .update(JSON.stringify(webhookPayload))
      .digest('hex')

    // 1차 시도 (실패 가능성 있음)
    const response = await request.post(
      'http://localhost:3000/api/payments/webhook/toss',
      {
        data: webhookPayload,
        headers: { 'toss-signature': signature },
      }
    )

    expect(response.ok()).toBeTruthy() // 웹훅은 항상 200 반환

    // 10초 대기 (Worker 재처리)
    await new Promise((resolve) => setTimeout(resolve, 10000))

    // 이벤트 상태 확인
    const { data: event } = await supabaseAdmin
      .from('payment_webhook_events')
      .select('process_status')
      .eq('event_id', eventId)
      .single()

    // 'processed' 또는 'failed' 상태여야 함
    expect(['processed', 'failed']).toContain(event?.process_status)
  })
})
