// ============================================
// Toss Payments Integration
// 토스페이먼츠 결제 연동
// ============================================

/**
 * HEPHAITOS 가격 정책 (헌법 준수)
 *
 * | Plan       | 월 가격    | 연간 가격      | 주요 기능                              |
 * |------------|-----------|---------------|---------------------------------------|
 * | Free       | ₩0        | -             | 기초 3모듈, 백테스트 10회/월           |
 * | Starter    | ₩9,900    | ₩99,000       | 전체 교육, 백테스트 100회/월           |
 * | Pro        | ₩29,900   | ₩299,000      | FORGE 무제한, 실시간 데이터, 고급 분석  |
 * | Team       | ₩199,000  | ₩1,990,000    | 5인 팀, 관리자 대시보드, 우선 지원      |
 */

// ============================================
// Types
// ============================================

export type PlanType = 'free' | 'starter' | 'pro' | 'team'
export type BillingCycle = 'monthly' | 'yearly'
export type PaymentMethod = 'card' | 'transfer' | 'phone'
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded'

export interface PricingPlan {
  id: PlanType
  name: string
  nameKr: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  features: string[]
  limits: {
    backtestPerMonth: number | 'unlimited'
    liveStrategies: number | 'unlimited'
    dataAccess: 'basic' | 'realtime' | 'premium'
    support: 'community' | 'email' | 'priority'
  }
  highlighted?: boolean
}

export interface PaymentRequest {
  orderId: string
  amount: number
  orderName: string
  customerName: string
  customerEmail: string
  planId: PlanType
  billingCycle: BillingCycle
  successUrl: string
  failUrl: string
}

export interface PaymentResult {
  paymentKey: string
  orderId: string
  amount: number
  status: PaymentStatus
  approvedAt?: string
  method?: PaymentMethod
  card?: {
    company: string
    number: string
    installmentPlanMonths: number
  }
  receipt?: {
    url: string
  }
}

export interface Subscription {
  id: string
  userId: string
  planId: PlanType
  billingCycle: BillingCycle
  status: 'active' | 'cancelled' | 'expired' | 'past_due'
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  paymentMethod?: PaymentMethod
  lastPaymentAt?: Date
  nextPaymentAt?: Date
}

// ============================================
// Pricing Plans (헌법 기반)
// ============================================

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    nameKr: '무료',
    description: '투자의 첫 걸음',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      '기초 교육 3개 모듈',
      '백테스트 10회/월',
      '커뮤니티 접근',
      '기본 차트 분석',
    ],
    limits: {
      backtestPerMonth: 10,
      liveStrategies: 1,
      dataAccess: 'basic',
      support: 'community',
    },
  },
  {
    id: 'starter',
    name: 'Starter',
    nameKr: '스타터',
    description: '본격적인 시작',
    monthlyPrice: 9900,
    yearlyPrice: 99000,
    features: [
      '전체 교육 콘텐츠',
      '백테스트 100회/월',
      '기본 전략 템플릿',
      '이메일 지원',
      '수료증 발급',
    ],
    limits: {
      backtestPerMonth: 100,
      liveStrategies: 3,
      dataAccess: 'basic',
      support: 'email',
    },
    highlighted: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    nameKr: '프로',
    description: '전문가를 위한',
    monthlyPrice: 29900,
    yearlyPrice: 299000,
    features: [
      '모든 Starter 기능',
      'FORGE 무제한 사용',
      '실시간 데이터 접근',
      '고급 분석 도구',
      '전략 엔진 무제한',
      '프리미엄 템플릿',
      '우선 지원',
    ],
    limits: {
      backtestPerMonth: 'unlimited',
      liveStrategies: 'unlimited',
      dataAccess: 'realtime',
      support: 'priority',
    },
  },
  {
    id: 'team',
    name: 'Team',
    nameKr: '팀',
    description: '조직을 위한',
    monthlyPrice: 199000,
    yearlyPrice: 1990000,
    features: [
      '모든 Pro 기능',
      '5인 팀 계정',
      '관리자 대시보드',
      '팀 전략 공유',
      '전용 계정 매니저',
      'API 접근',
      'SLA 보장',
    ],
    limits: {
      backtestPerMonth: 'unlimited',
      liveStrategies: 'unlimited',
      dataAccess: 'premium',
      support: 'priority',
    },
  },
]

// ============================================
// Add-ons (헌법 기반)
// ============================================

export const ADD_ONS = [
  {
    id: 'korea_realtime',
    name: '한국 주식 실시간 데이터',
    price: 9900,
    period: 'monthly',
  },
  {
    id: 'us_stocks',
    name: '미국 주식 데이터',
    price: 19900,
    period: 'monthly',
  },
  {
    id: 'crypto_data',
    name: '크립토 데이터',
    price: 14900,
    period: 'monthly',
  },
  {
    id: 'mentoring_30min',
    name: '1:1 멘토링 30분',
    price: 30000,
    period: 'once',
  },
]

// ============================================
// Toss Payments Client
// ============================================

export class TossPaymentsClient {
  private clientKey: string
  private secretKey: string
  private baseUrl = 'https://api.tosspayments.com/v1'

  constructor() {
    this.clientKey = process.env.TOSS_CLIENT_KEY || ''
    this.secretKey = process.env.TOSS_SECRET_KEY || ''

    if (!this.clientKey || !this.secretKey) {
      console.warn('[TossPayments] API keys not configured')
    }
  }

  /**
   * Generate order ID
   */
  generateOrderId(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 8)
    return `HEPH_${timestamp}_${random}`.toUpperCase()
  }

  /**
   * Get plan price
   */
  getPlanPrice(planId: PlanType, billingCycle: BillingCycle): number {
    const plan = PRICING_PLANS.find((p) => p.id === planId)
    if (!plan) return 0
    return billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice
  }

  /**
   * Initiate payment (Server-side)
   */
  async initiatePayment(request: PaymentRequest): Promise<{ checkoutUrl: string }> {
    const authString = Buffer.from(`${this.secretKey}:`).toString('base64')

    try {
      const response = await fetch(`${this.baseUrl}/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: request.orderId,
          amount: request.amount,
          orderName: request.orderName,
          successUrl: request.successUrl,
          failUrl: request.failUrl,
          customerName: request.customerName,
          customerEmail: request.customerEmail,
          metadata: {
            planId: request.planId,
            billingCycle: request.billingCycle,
          },
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Payment initiation failed')
      }

      const data = await response.json()
      return { checkoutUrl: data.checkout?.url || '' }
    } catch (error) {
      console.error('[TossPayments] Initiate payment error:', error)
      throw error
    }
  }

  /**
   * Confirm payment (After user completes payment)
   */
  async confirmPayment(
    paymentKey: string,
    orderId: string,
    amount: number
  ): Promise<PaymentResult> {
    const authString = Buffer.from(`${this.secretKey}:`).toString('base64')

    try {
      const response = await fetch(`${this.baseUrl}/payments/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Payment confirmation failed')
      }

      const data = await response.json()
      return {
        paymentKey: data.paymentKey,
        orderId: data.orderId,
        amount: data.totalAmount,
        status: data.status === 'DONE' ? 'completed' : 'failed',
        approvedAt: data.approvedAt,
        method: data.method?.toLowerCase() as PaymentMethod,
        card: data.card
          ? {
              company: data.card.company,
              number: data.card.number,
              installmentPlanMonths: data.card.installmentPlanMonths,
            }
          : undefined,
        receipt: data.receipt ? { url: data.receipt.url } : undefined,
      }
    } catch (error) {
      console.error('[TossPayments] Confirm payment error:', error)
      throw error
    }
  }

  /**
   * Cancel payment
   */
  async cancelPayment(
    paymentKey: string,
    cancelReason: string
  ): Promise<PaymentResult> {
    const authString = Buffer.from(`${this.secretKey}:`).toString('base64')

    try {
      const response = await fetch(
        `${this.baseUrl}/payments/${paymentKey}/cancel`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ cancelReason }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Payment cancellation failed')
      }

      const data = await response.json()
      return {
        paymentKey: data.paymentKey,
        orderId: data.orderId,
        amount: data.totalAmount,
        status: 'cancelled',
      }
    } catch (error) {
      console.error('[TossPayments] Cancel payment error:', error)
      throw error
    }
  }

  /**
   * Get payment details
   */
  async getPayment(paymentKey: string): Promise<PaymentResult | null> {
    const authString = Buffer.from(`${this.secretKey}:`).toString('base64')

    try {
      const response = await fetch(
        `${this.baseUrl}/payments/${paymentKey}`,
        {
          headers: {
            'Authorization': `Basic ${authString}`,
          },
        }
      )

      if (!response.ok) {
        return null
      }

      const data = await response.json()
      return {
        paymentKey: data.paymentKey,
        orderId: data.orderId,
        amount: data.totalAmount,
        status: this.mapStatus(data.status),
        approvedAt: data.approvedAt,
        method: data.method?.toLowerCase() as PaymentMethod,
      }
    } catch (error) {
      console.error('[TossPayments] Get payment error:', error)
      return null
    }
  }

  /**
   * Map Toss status to our status
   */
  private mapStatus(tossStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      DONE: 'completed',
      CANCELED: 'cancelled',
      PARTIAL_CANCELED: 'cancelled',
      ABORTED: 'failed',
      EXPIRED: 'failed',
      WAITING_FOR_DEPOSIT: 'pending',
      IN_PROGRESS: 'pending',
      READY: 'pending',
    }
    return statusMap[tossStatus] || 'pending'
  }
}

// ============================================
// Singleton Instance
// ============================================

let _tossClient: TossPaymentsClient | null = null

export function getTossPaymentsClient(): TossPaymentsClient {
  if (!_tossClient) {
    _tossClient = new TossPaymentsClient()
  }
  return _tossClient
}

// ============================================
// Helper Functions
// ============================================

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(amount)
}

export function getDiscountPercent(plan: PricingPlan): number {
  if (plan.monthlyPrice === 0) return 0
  const yearlyMonthlyEquivalent = plan.yearlyPrice / 12
  return Math.round((1 - yearlyMonthlyEquivalent / plan.monthlyPrice) * 100)
}

export function getPlanById(planId: PlanType): PricingPlan | undefined {
  return PRICING_PLANS.find((p) => p.id === planId)
}
