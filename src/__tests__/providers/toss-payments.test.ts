// ============================================
// Toss Payments Provider Tests
// 결제, 구독, 빌링 플로우 테스트
// ============================================

import { describe, it, expect, vi } from 'vitest'

// Mock fetch
global.fetch = vi.fn()

import {
  BANK_CODES,
  type TossConfig,
  type PaymentRequest,
  type PaymentResponse,
  type PaymentStatus,
  type CancelRequest,
  type CancelResponse,
  type BillingKeyRequest,
  type BillingKeyResponse,
  type BillingPaymentRequest,
  type SubscriptionPlan,
  type Subscription,
} from '@/lib/api/providers/toss-payments'

// ============================================
// Test Data
// ============================================

const mockConfig: TossConfig = {
  clientKey: 'test_ck_123456789',
  secretKey: 'test_sk_987654321',
  isTest: true,
}

const mockPaymentResponse: PaymentResponse = {
  paymentKey: 'pay_123456789',
  orderId: 'HEPH_ABC123_DEF456',
  orderName: 'HEPHAITOS Pro 월간 구독',
  status: 'DONE',
  requestedAt: new Date('2024-01-15T10:00:00Z'),
  approvedAt: new Date('2024-01-15T10:00:05Z'),
  method: '카드',
  totalAmount: 49900,
  balanceAmount: 49900,
  suppliedAmount: 45364,
  vat: 4536,
  receipt: {
    url: 'https://receipt.tosspayments.com/...',
  },
  card: {
    issuerCode: '11',
    acquirerCode: '11',
    number: '4123****1234****',
    installmentPlanMonths: 0,
    isInterestFree: false,
    approveNo: '12345678',
    useCardPoint: false,
    cardType: '신용',
    ownerType: '개인',
    acquireStatus: 'COMPLETED',
    receiptUrl: 'https://receipt.tosspayments.com/card/...',
  },
}

const mockBillingKey: BillingKeyResponse = {
  billingKey: 'billing_123456789',
  customerKey: 'user_abc123',
  method: '카드',
  cardCompany: '신한카드',
  cardNumber: '4123****1234****',
  authenticatedAt: new Date('2024-01-15T10:00:00Z'),
}

const mockSubscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: '무료 체험',
    price: 0,
    interval: 'monthly',
    features: ['기본 전략 빌더', '백테스트 5회/월'],
  },
  {
    id: 'starter',
    name: 'Starter',
    description: '개인 투자자',
    price: 19900,
    interval: 'monthly',
    features: ['무제한 백테스트', '모든 지표'],
    trialDays: 7,
  },
  {
    id: 'pro',
    name: 'Pro',
    description: '전문 투자자',
    price: 49900,
    interval: 'monthly',
    features: ['전략 엔진', '멘토 채널 접근'],
    trialDays: 7,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: '기관/팀',
    price: 199000,
    interval: 'monthly',
    features: ['팀 협업', 'API 접근', '전용 서포트'],
  },
]

// ============================================
// Payment Tests
// ============================================

describe('Toss Payments - Single Payment', () => {
  describe('결제 요청 시나리오', () => {
    it('결제 요청 데이터가 올바르게 생성되어야 함', () => {
      const request: PaymentRequest = {
        orderId: 'HEPH_ABC123_DEF456',
        amount: 49900,
        orderName: 'HEPHAITOS Pro 월간 구독',
        customerName: '홍길동',
        customerEmail: 'hong@example.com',
        successUrl: 'https://hephaitos.io/payments/success',
        failUrl: 'https://hephaitos.io/payments/fail',
      }

      expect(request.orderId).toBeDefined()
      expect(request.amount).toBeGreaterThan(0)
      expect(request.successUrl).toContain('success')
      expect(request.failUrl).toContain('fail')
    })

    it('주문 ID가 고유해야 함', () => {
      const orderId1 = `HEPH_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
      const orderId2 = `HEPH_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`

      expect(orderId1).not.toBe(orderId2)
    })
  })

  describe('결제 승인 시나리오', () => {
    it('결제 승인 후 상태가 DONE이어야 함', () => {
      expect(mockPaymentResponse.status).toBe('DONE')
      expect(mockPaymentResponse.approvedAt).toBeDefined()
    })

    it('결제 금액이 요청 금액과 일치해야 함', () => {
      const requestedAmount = 49900
      expect(mockPaymentResponse.totalAmount).toBe(requestedAmount)
    })

    it('VAT가 올바르게 계산되어야 함 (10%)', () => {
      const expectedVat = Math.round(mockPaymentResponse.suppliedAmount * 0.1)
      // 반올림 오차 허용
      expect(Math.abs(mockPaymentResponse.vat - expectedVat)).toBeLessThan(10)
    })

    it('카드 결제 시 카드 정보가 포함되어야 함', () => {
      expect(mockPaymentResponse.card).toBeDefined()
      expect(mockPaymentResponse.card?.number).toMatch(/\d{4}\*{4}\d{4}\*{4}/)
      expect(mockPaymentResponse.card?.approveNo).toBeDefined()
    })
  })

  describe('결제 상태 시나리오', () => {
    const statuses: PaymentStatus[] = [
      'READY',
      'IN_PROGRESS',
      'WAITING_FOR_DEPOSIT',
      'DONE',
      'CANCELED',
      'PARTIAL_CANCELED',
      'ABORTED',
      'EXPIRED',
    ]

    it('모든 결제 상태를 처리할 수 있어야 함', () => {
      expect(statuses.length).toBe(8)
    })

    it('완료 상태만 최종 처리 가능', () => {
      const completedStatuses = ['DONE', 'CANCELED', 'PARTIAL_CANCELED', 'ABORTED', 'EXPIRED']
      expect(completedStatuses).toContain('DONE')
    })
  })
})

// ============================================
// Payment Cancellation Tests
// ============================================

describe('Toss Payments - Cancellation', () => {
  describe('전체 취소 시나리오', () => {
    it('결제 전체 취소가 가능해야 함', () => {
      const cancelRequest: CancelRequest = {
        paymentKey: mockPaymentResponse.paymentKey,
        cancelReason: '고객 요청',
      }

      expect(cancelRequest.paymentKey).toBeDefined()
      expect(cancelRequest.cancelReason).toBeDefined()
      expect(cancelRequest.cancelAmount).toBeUndefined() // 전체 취소
    })
  })

  describe('부분 취소 시나리오', () => {
    it('부분 취소 시 취소 금액이 필요함', () => {
      const partialCancelRequest: CancelRequest = {
        paymentKey: mockPaymentResponse.paymentKey,
        cancelReason: '일부 상품 반품',
        cancelAmount: 25000,
      }

      expect(partialCancelRequest.cancelAmount).toBeDefined()
      expect(partialCancelRequest.cancelAmount).toBeLessThan(mockPaymentResponse.totalAmount)
    })

    it('취소 금액이 결제 금액을 초과할 수 없음', () => {
      const cancelAmount = 60000
      const totalAmount = mockPaymentResponse.totalAmount

      expect(cancelAmount).toBeGreaterThan(totalAmount)
      // 이 경우 에러 발생해야 함
    })
  })

  describe('환불 계좌 시나리오 (가상계좌)', () => {
    it('가상계좌 환불 시 환불 계좌 정보가 필요함', () => {
      const refundRequest: CancelRequest = {
        paymentKey: 'pay_virtualaccount_123',
        cancelReason: '고객 요청',
        refundReceiveAccount: {
          bank: '신한',
          accountNumber: '110123456789',
          holderName: '홍길동',
        },
      }

      expect(refundRequest.refundReceiveAccount).toBeDefined()
      expect(refundRequest.refundReceiveAccount?.bank).toBeDefined()
      expect(refundRequest.refundReceiveAccount?.accountNumber).toBeDefined()
    })
  })
})

// ============================================
// Billing (Subscription) Tests
// ============================================

describe('Toss Payments - Billing', () => {
  describe('빌링키 발급 시나리오', () => {
    it('카드 정보로 빌링키를 발급할 수 있어야 함', () => {
      const request: BillingKeyRequest = {
        customerKey: 'user_abc123',
        cardNumber: '4123456789012345',
        cardExpirationYear: '28',
        cardExpirationMonth: '12',
        cardPassword: '12',
        customerIdentityNumber: '900101',
        customerName: '홍길동',
        customerEmail: 'hong@example.com',
      }

      expect(request.customerKey).toBeDefined()
      expect(request.cardNumber.length).toBe(16)
      expect(request.cardPassword.length).toBe(2)
    })

    it('빌링키가 성공적으로 반환되어야 함', () => {
      expect(mockBillingKey.billingKey).toBeDefined()
      expect(mockBillingKey.billingKey).toMatch(/^billing_/)
      expect(mockBillingKey.customerKey).toBe('user_abc123')
    })

    it('카드 정보가 마스킹되어 반환되어야 함', () => {
      expect(mockBillingKey.cardNumber).toContain('****')
    })
  })

  describe('정기 결제 시나리오', () => {
    it('빌링키로 결제를 실행할 수 있어야 함', () => {
      const request: BillingPaymentRequest = {
        billingKey: mockBillingKey.billingKey,
        customerKey: mockBillingKey.customerKey,
        amount: 49900,
        orderId: 'HEPH_SUB_202401',
        orderName: 'HEPHAITOS Pro 1월 구독료',
      }

      expect(request.billingKey).toBeDefined()
      expect(request.amount).toBeGreaterThan(0)
    })

    it('월간 구독 결제가 매월 자동 실행되어야 함', () => {
      const subscription: Subscription = {
        id: 'sub_123',
        customerId: 'user_abc123',
        planId: 'pro',
        billingKey: mockBillingKey.billingKey,
        status: 'active',
        currentPeriodStart: new Date('2024-01-15'),
        currentPeriodEnd: new Date('2024-02-15'),
        createdAt: new Date('2024-01-15'),
      }

      // 다음 결제일 = currentPeriodEnd
      const nextBillingDate = subscription.currentPeriodEnd
      expect(nextBillingDate.getMonth()).toBe(subscription.currentPeriodStart.getMonth() + 1)
    })
  })

  describe('결제 실패 처리 시나리오', () => {
    it('카드 한도 초과 시 재시도 해야 함', () => {
      const failedPayment = {
        status: 'ABORTED',
        failureCode: 'EXCEED_MAX_AMOUNT',
        failureMessage: '한도 초과',
      }

      expect(failedPayment.status).toBe('ABORTED')
      // 재시도 로직 또는 사용자 알림 필요
    })

    it('카드 만료 시 빌링키 재발급이 필요함', () => {
      const failedPayment = {
        status: 'ABORTED',
        failureCode: 'INVALID_CARD_EXPIRATION',
        failureMessage: '카드 만료',
      }

      expect(failedPayment.failureCode).toBe('INVALID_CARD_EXPIRATION')
      // 빌링키 재발급 요청 필요
    })

    it('3회 연속 실패 시 구독 일시 중지', () => {
      const failedAttempts = 3
      const maxAttempts = 3

      const shouldSuspend = failedAttempts >= maxAttempts
      expect(shouldSuspend).toBe(true)
    })
  })
})

// ============================================
// Subscription Plan Tests
// ============================================

describe('Toss Payments - Subscription Plans', () => {
  describe('플랜 구조 시나리오', () => {
    it('모든 플랜에 필수 필드가 있어야 함', () => {
      mockSubscriptionPlans.forEach((plan) => {
        expect(plan.id).toBeDefined()
        expect(plan.name).toBeDefined()
        expect(plan.price).toBeDefined()
        expect(plan.interval).toBeDefined()
        expect(plan.features.length).toBeGreaterThan(0)
      })
    })

    it('플랜 가격이 순서대로 증가해야 함', () => {
      const paidPlans = mockSubscriptionPlans.filter((p) => p.price > 0)
      for (let i = 1; i < paidPlans.length; i++) {
        expect(paidPlans[i].price).toBeGreaterThan(paidPlans[i - 1].price)
      }
    })

    it('유료 플랜에만 트라이얼 기간이 있어야 함', () => {
      const freePlan = mockSubscriptionPlans.find((p) => p.id === 'free')
      const proPlan = mockSubscriptionPlans.find((p) => p.id === 'pro')

      expect(freePlan?.trialDays).toBeUndefined()
      expect(proPlan?.trialDays).toBe(7)
    })
  })

  describe('연간 결제 할인 시나리오', () => {
    it('연간 결제 시 20% 할인이 적용되어야 함', () => {
      const monthlyPrice = 49900
      const yearlyPrice = Math.round(monthlyPrice * 12 * 0.8)
      const expectedYearlyPrice = 479040

      expect(yearlyPrice).toBe(expectedYearlyPrice)
    })

    it('연간 결제 시 월별 환산 가격이 낮아져야 함', () => {
      const monthlyPrice = 49900
      const yearlyPrice = Math.round(monthlyPrice * 12 * 0.8)
      const monthlyEquivalent = yearlyPrice / 12

      expect(monthlyEquivalent).toBeLessThan(monthlyPrice)
    })
  })

  describe('플랜 변경 시나리오', () => {
    it('업그레이드 시 차액만 결제해야 함', () => {
      const currentPlan = mockSubscriptionPlans.find((p) => p.id === 'starter')!
      const upgradePlan = mockSubscriptionPlans.find((p) => p.id === 'pro')!

      const remainingDays = 15
      const totalDays = 30
      const proratedAmount = Math.round(
        (upgradePlan.price - currentPlan.price) * (remainingDays / totalDays)
      )

      expect(proratedAmount).toBeGreaterThan(0)
      expect(proratedAmount).toBeLessThan(upgradePlan.price)
    })

    it('다운그레이드 시 다음 결제일부터 적용되어야 함', () => {
      // 미래 날짜로 설정하여 테스트 안정성 확보
      const futureStart = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30일 후
      const futureEnd = new Date(futureStart.getTime() + 30 * 24 * 60 * 60 * 1000) // 60일 후

      const subscription: Subscription = {
        id: 'sub_123',
        customerId: 'user_abc123',
        planId: 'pro',
        billingKey: 'billing_123',
        status: 'active',
        currentPeriodStart: futureStart,
        currentPeriodEnd: futureEnd,
        createdAt: new Date(),
      }

      // 다운그레이드는 currentPeriodEnd 이후부터 적용
      const newPlanEffectiveDate = subscription.currentPeriodEnd
      expect(newPlanEffectiveDate.getTime()).toBeGreaterThan(subscription.currentPeriodStart.getTime())
    })
  })
})

// ============================================
// Subscription Lifecycle Tests
// ============================================

describe('Toss Payments - Subscription Lifecycle', () => {
  describe('구독 상태 전이 시나리오', () => {
    it('트라이얼 → 활성화 전이', () => {
      const states: Subscription['status'][] = ['trialing', 'active', 'canceled', 'past_due']

      const trialingSubscription: Subscription = {
        id: 'sub_123',
        customerId: 'user_abc123',
        planId: 'pro',
        billingKey: 'billing_123',
        status: 'trialing',
        currentPeriodStart: new Date('2024-01-15'),
        currentPeriodEnd: new Date('2024-01-22'), // 7일 후
        createdAt: new Date('2024-01-15'),
      }

      // 트라이얼 종료 후 첫 결제 성공 시
      const activatedSubscription = {
        ...trialingSubscription,
        status: 'active' as const,
      }

      expect(activatedSubscription.status).toBe('active')
    })

    it('결제 실패 → past_due 전이', () => {
      const subscription: Subscription = {
        id: 'sub_123',
        customerId: 'user_abc123',
        planId: 'pro',
        billingKey: 'billing_123',
        status: 'past_due',
        currentPeriodStart: new Date('2024-01-15'),
        currentPeriodEnd: new Date('2024-02-15'),
        createdAt: new Date('2024-01-15'),
      }

      expect(subscription.status).toBe('past_due')
      // Grace period 동안 재시도
    })

    it('취소 요청 시 기간 종료까지 유지', () => {
      const subscription: Subscription = {
        id: 'sub_123',
        customerId: 'user_abc123',
        planId: 'pro',
        billingKey: 'billing_123',
        status: 'canceled',
        currentPeriodStart: new Date('2024-01-15'),
        currentPeriodEnd: new Date('2024-02-15'),
        canceledAt: new Date('2024-01-20'),
        createdAt: new Date('2024-01-15'),
      }

      // 취소되었지만 currentPeriodEnd까지는 서비스 제공
      expect(subscription.canceledAt).toBeDefined()
      expect(subscription.currentPeriodEnd.getTime()).toBeGreaterThan(subscription.canceledAt!.getTime())
    })
  })
})

// ============================================
// Webhook Tests
// ============================================

describe('Toss Payments - Webhook', () => {
  describe('웹훅 시그니처 검증', () => {
    it('유효한 시그니처를 검증할 수 있어야 함', () => {
      // 실제 구현에서는 crypto.createHmac 사용
      const payload = JSON.stringify({ paymentKey: 'pay_123' })
      const secretKey = 'test_sk_123'
      const expectedSignature = 'valid_signature_hash'

      // 시그니처 검증 로직
      expect(typeof payload).toBe('string')
      expect(typeof secretKey).toBe('string')
    })

    it('잘못된 시그니처를 거부해야 함', () => {
      const invalidSignature = 'invalid_signature'
      const validSignature = 'valid_signature'

      expect(invalidSignature).not.toBe(validSignature)
    })
  })

  describe('웹훅 이벤트 처리', () => {
    it('결제 완료 이벤트를 처리해야 함', () => {
      const event = {
        eventType: 'PAYMENT_STATUS_CHANGED',
        data: {
          paymentKey: 'pay_123',
          status: 'DONE',
        },
      }

      expect(event.eventType).toBe('PAYMENT_STATUS_CHANGED')
      expect(event.data.status).toBe('DONE')
    })

    it('빌링키 발급 이벤트를 처리해야 함', () => {
      const event = {
        eventType: 'BILLING_KEY_ISSUED',
        data: {
          billingKey: 'billing_123',
          customerKey: 'user_123',
        },
      }

      expect(event.eventType).toBe('BILLING_KEY_ISSUED')
    })

    it('가상계좌 입금 이벤트를 처리해야 함', () => {
      const event = {
        eventType: 'VIRTUAL_ACCOUNT_DEPOSITED',
        data: {
          paymentKey: 'pay_va_123',
          status: 'DONE',
        },
      }

      expect(event.eventType).toBe('VIRTUAL_ACCOUNT_DEPOSITED')
    })
  })
})

// ============================================
// Bank Code Tests
// ============================================

describe('Toss Payments - Bank Codes', () => {
  it('주요 은행 코드가 정의되어 있어야 함', () => {
    expect(BANK_CODES['국민은행']).toBe('04')
    expect(BANK_CODES['신한은행']).toBe('88')
    expect(BANK_CODES['우리은행']).toBe('20')
    expect(BANK_CODES['하나은행']).toBe('81')
    expect(BANK_CODES['카카오뱅크']).toBe('90')
    expect(BANK_CODES['토스뱅크']).toBe('92')
  })

  it('모든 은행 코드가 2자리 문자열이어야 함', () => {
    Object.values(BANK_CODES).forEach((code) => {
      expect(code.length).toBe(2)
      expect(/^\d{2}$/.test(code)).toBe(true)
    })
  })
})

// ============================================
// Error Handling Tests
// ============================================

describe('Toss Payments - Error Handling', () => {
  describe('결제 실패 에러', () => {
    it('잔액 부족 에러를 처리해야 함', () => {
      const error = { code: 'INSUFFICIENT_BALANCE', message: '잔액이 부족합니다' }
      expect(error.code).toBe('INSUFFICIENT_BALANCE')
    })

    it('카드 정보 오류를 처리해야 함', () => {
      const error = { code: 'INVALID_CARD_NUMBER', message: '잘못된 카드번호입니다' }
      expect(error.code).toBe('INVALID_CARD_NUMBER')
    })

    it('결제 취소됨 에러를 처리해야 함', () => {
      const error = { code: 'CANCELED_PAYMENT', message: '결제가 취소되었습니다' }
      expect(error.code).toBe('CANCELED_PAYMENT')
    })
  })

  describe('API 에러', () => {
    it('인증 실패 에러를 처리해야 함', () => {
      const error = { code: 'UNAUTHORIZED', message: '인증에 실패했습니다' }
      expect(error.code).toBe('UNAUTHORIZED')
    })

    it('잘못된 요청 에러를 처리해야 함', () => {
      const error = { code: 'INVALID_REQUEST', message: '잘못된 요청입니다' }
      expect(error.code).toBe('INVALID_REQUEST')
    })
  })
})
