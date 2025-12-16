// ============================================
// Toss Payments API Provider
// 한국 결제 게이트웨이 Integration
// ============================================

import { requireTossConfig } from '@/lib/config/env'

// ============================================
// Types
// ============================================

export interface TossConfig {
  clientKey: string // 클라이언트 키 (프론트엔드용)
  secretKey: string // 시크릿 키 (서버용)
  isTest?: boolean // 테스트 모드 여부
}

export interface PaymentRequest {
  orderId: string // 주문 ID (고유값)
  amount: number // 결제 금액
  orderName: string // 주문명 (예: "HEPHAITOS Pro 월간 구독")
  customerName?: string
  customerEmail?: string
  customerMobilePhone?: string
  successUrl: string // 결제 성공 리다이렉트 URL
  failUrl: string // 결제 실패 리다이렉트 URL
}

export interface PaymentResponse {
  paymentKey: string
  orderId: string
  orderName: string
  status: PaymentStatus
  requestedAt: Date
  approvedAt?: Date
  method: PaymentMethod
  totalAmount: number
  balanceAmount: number
  suppliedAmount: number
  vat: number
  receipt?: {
    url: string
  }
  card?: CardInfo
  virtualAccount?: VirtualAccountInfo
  transfer?: TransferInfo
  mobilePhone?: MobilePhoneInfo
  easyPay?: EasyPayInfo
}

export type PaymentStatus =
  | 'READY' // 결제 생성
  | 'IN_PROGRESS' // 결제 진행 중
  | 'WAITING_FOR_DEPOSIT' // 입금 대기 (가상계좌)
  | 'DONE' // 결제 완료
  | 'CANCELED' // 결제 취소
  | 'PARTIAL_CANCELED' // 부분 취소
  | 'ABORTED' // 결제 승인 실패
  | 'EXPIRED' // 결제 만료

export type PaymentMethod =
  | '카드'
  | '가상계좌'
  | '간편결제'
  | '휴대폰'
  | '계좌이체'
  | '문화상품권'
  | '도서문화상품권'
  | '게임문화상품권'

export interface CardInfo {
  issuerCode: string
  acquirerCode: string
  number: string
  installmentPlanMonths: number
  isInterestFree: boolean
  interestPayer?: 'BUYER' | 'CARD_COMPANY' | 'MERCHANT'
  approveNo: string
  useCardPoint: boolean
  cardType: '신용' | '체크' | '기프트' | '미확인'
  ownerType: '개인' | '법인' | '미확인'
  acquireStatus: 'READY' | 'REQUESTED' | 'COMPLETED' | 'CANCEL_REQUESTED' | 'CANCELED'
  receiptUrl?: string
}

export interface VirtualAccountInfo {
  accountType: '일반' | '고정'
  accountNumber: string
  bankCode: string
  customerName: string
  dueDate: string
  refundStatus: 'NONE' | 'PENDING' | 'FAILED' | 'PARTIAL_FAILED' | 'COMPLETED'
  expired: boolean
  settlementStatus: 'INCOMPLETED' | 'COMPLETED'
  refundReceiveAccount?: {
    bankCode: string
    accountNumber: string
    holderName: string
  }
}

export interface TransferInfo {
  bankCode: string
  settlementStatus: 'INCOMPLETED' | 'COMPLETED'
}

export interface MobilePhoneInfo {
  customerMobilePhone: string
  settlementStatus: 'INCOMPLETED' | 'COMPLETED'
  receiptUrl?: string
}

export interface EasyPayInfo {
  provider: string
  amount: number
  discountAmount: number
}

export interface CancelRequest {
  paymentKey: string
  cancelReason: string
  cancelAmount?: number // 부분 취소시 필요
  refundReceiveAccount?: {
    bank: string
    accountNumber: string
    holderName: string
  }
}

export interface CancelResponse {
  paymentKey: string
  orderId: string
  status: PaymentStatus
  cancels: Array<{
    cancelAmount: number
    cancelReason: string
    taxFreeAmount: number
    taxExemptionAmount: number
    refundableAmount: number
    easyPayDiscountAmount: number
    canceledAt: Date
    transactionKey: string
    receiptKey?: string
  }>
}

// ============================================
// Billing (정기결제) Types
// ============================================

export interface BillingKeyRequest {
  customerKey: string // 고객 고유 ID
  cardNumber: string
  cardExpirationYear: string
  cardExpirationMonth: string
  cardPassword: string // 앞 2자리
  customerIdentityNumber: string // 생년월일 6자리 또는 사업자번호 10자리
  customerName?: string
  customerEmail?: string
}

export interface BillingKeyResponse {
  billingKey: string
  customerKey: string
  method: '카드'
  cardCompany: string
  cardNumber: string
  authenticatedAt: Date
}

export interface BillingPaymentRequest {
  billingKey: string
  customerKey: string
  amount: number
  orderId: string
  orderName: string
  customerEmail?: string
  customerName?: string
  taxFreeAmount?: number
}

// ============================================
// Subscription Plan Types
// ============================================

export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number
  interval: 'monthly' | 'yearly'
  features: string[]
  trialDays?: number
}

export interface Subscription {
  id: string
  customerId: string
  planId: string
  billingKey: string
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  currentPeriodStart: Date
  currentPeriodEnd: Date
  canceledAt?: Date
  createdAt: Date
}

// ============================================
// Toss Payments Provider
// ============================================

class TossPaymentsProvider {
  private config: TossConfig | null = null
  private baseUrl: string = 'https://api.tosspayments.com'

  // ============================================
  // Configuration
  // ============================================

  configure(config: TossConfig) {
    this.config = config
  }

  /**
   * 환경변수에서 자동 설정 (lazy initialization)
   */
  configureFromEnv(): void {
    const envConfig = requireTossConfig()
    this.configure({
      clientKey: envConfig.clientKey,
      secretKey: envConfig.secretKey,
      isTest: envConfig.isTest,
    })
  }

  private ensureConfig(): TossConfig {
    if (!this.config) {
      // 환경변수에서 자동 설정 시도
      try {
        this.configureFromEnv()
      } catch {
        throw new Error('Toss Payments not configured. Call configure() first or set TOSS_CLIENT_KEY and TOSS_SECRET_KEY.')
      }
    }
    return this.config!
  }

  private getAuthHeader(): string {
    const config = this.ensureConfig()
    const credentials = Buffer.from(`${config.secretKey}:`).toString('base64')
    return `Basic ${credentials}`
  }

  private async request<T>(
    method: 'GET' | 'POST',
    endpoint: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        Authorization: this.getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || `Toss API error: ${response.status}`)
    }

    return data
  }

  // ============================================
  // Client Key (프론트엔드용)
  // ============================================

  getClientKey(): string {
    return this.ensureConfig().clientKey
  }

  // ============================================
  // Payment - 단건 결제
  // ============================================

  /**
   * 결제 승인
   * 프론트엔드에서 결제 완료 후 서버에서 호출
   */
  async confirmPayment(
    paymentKey: string,
    orderId: string,
    amount: number
  ): Promise<PaymentResponse> {
    const data = await this.request<Record<string, unknown>>(
      'POST',
      '/v1/payments/confirm',
      { paymentKey, orderId, amount }
    )

    return this.mapPaymentResponse(data)
  }

  /**
   * 결제 조회
   */
  async getPayment(paymentKey: string): Promise<PaymentResponse> {
    const data = await this.request<Record<string, unknown>>(
      'GET',
      `/v1/payments/${paymentKey}`
    )

    return this.mapPaymentResponse(data)
  }

  /**
   * 주문 ID로 결제 조회
   */
  async getPaymentByOrderId(orderId: string): Promise<PaymentResponse> {
    const data = await this.request<Record<string, unknown>>(
      'GET',
      `/v1/payments/orders/${orderId}`
    )

    return this.mapPaymentResponse(data)
  }

  /**
   * 결제 취소
   */
  async cancelPayment(request: CancelRequest): Promise<CancelResponse> {
    const data = await this.request<Record<string, unknown>>(
      'POST',
      `/v1/payments/${request.paymentKey}/cancel`,
      {
        cancelReason: request.cancelReason,
        cancelAmount: request.cancelAmount,
        refundReceiveAccount: request.refundReceiveAccount,
      }
    )

    return {
      paymentKey: data.paymentKey as string,
      orderId: data.orderId as string,
      status: data.status as PaymentStatus,
      cancels: ((data.cancels as Record<string, unknown>[]) || []).map((c) => ({
        cancelAmount: c.cancelAmount as number,
        cancelReason: c.cancelReason as string,
        taxFreeAmount: c.taxFreeAmount as number,
        taxExemptionAmount: c.taxExemptionAmount as number,
        refundableAmount: c.refundableAmount as number,
        easyPayDiscountAmount: c.easyPayDiscountAmount as number,
        canceledAt: new Date(c.canceledAt as string),
        transactionKey: c.transactionKey as string,
        receiptKey: c.receiptKey as string | undefined,
      })),
    }
  }

  // ============================================
  // Billing - 정기결제
  // ============================================

  /**
   * 빌링키 발급 (카드 등록)
   */
  async issueBillingKey(request: BillingKeyRequest): Promise<BillingKeyResponse> {
    const data = await this.request<Record<string, unknown>>(
      'POST',
      '/v1/billing/authorizations/card',
      {
        customerKey: request.customerKey,
        cardNumber: request.cardNumber,
        cardExpirationYear: request.cardExpirationYear,
        cardExpirationMonth: request.cardExpirationMonth,
        cardPassword: request.cardPassword,
        customerIdentityNumber: request.customerIdentityNumber,
        customerName: request.customerName,
        customerEmail: request.customerEmail,
      }
    )

    return {
      billingKey: data.billingKey as string,
      customerKey: data.customerKey as string,
      method: data.method as '카드',
      cardCompany: data.cardCompany as string,
      cardNumber: data.cardNumber as string,
      authenticatedAt: new Date(data.authenticatedAt as string),
    }
  }

  /**
   * 빌링키로 결제 (자동 결제)
   */
  async chargeWithBillingKey(request: BillingPaymentRequest): Promise<PaymentResponse> {
    const data = await this.request<Record<string, unknown>>(
      'POST',
      `/v1/billing/${request.billingKey}`,
      {
        customerKey: request.customerKey,
        amount: request.amount,
        orderId: request.orderId,
        orderName: request.orderName,
        customerEmail: request.customerEmail,
        customerName: request.customerName,
        taxFreeAmount: request.taxFreeAmount,
      }
    )

    return this.mapPaymentResponse(data)
  }

  // ============================================
  // Subscription Management (HEPHAITOS용)
  // ============================================

  /**
   * 구독 플랜 정의
   */
  static readonly SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
    {
      id: 'free',
      name: 'Free',
      description: '무료 체험',
      price: 0,
      interval: 'monthly',
      features: [
        '기본 전략 빌더',
        '백테스트 5회/월',
        '기본 지표',
        '학습 가이드 10회/월',
      ],
    },
    {
      id: 'starter',
      name: 'Starter',
      description: '개인 투자자',
      price: 19900,
      interval: 'monthly',
      features: [
        '모든 Free 기능',
        '무제한 백테스트',
        '모든 지표',
        '학습 가이드 무제한',
        '실시간 알림',
      ],
      trialDays: 7,
    },
    {
      id: 'pro',
      name: 'Pro',
      description: '전문 투자자',
      price: 49900,
      interval: 'monthly',
      features: [
        '모든 Starter 기능',
        '전략 엔진',
        '멘토 채널 접근',
        '프리미엄 데이터',
        '다중 전략 운용',
      ],
      trialDays: 7,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: '기관/팀',
      price: 199000,
      interval: 'monthly',
      features: [
        '모든 Pro 기능',
        '팀 협업 기능',
        'API 접근',
        '전용 서포트',
        '맞춤 교육',
      ],
    },
  ]

  /**
   * 연간 결제 가격 (20% 할인)
   */
  static getYearlyPrice(monthlyPrice: number): number {
    return Math.round(monthlyPrice * 12 * 0.8)
  }

  /**
   * 주문 ID 생성
   */
  static generateOrderId(prefix: string = 'HEPH'): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 8)
    return `${prefix}_${timestamp}_${random}`.toUpperCase()
  }

  // ============================================
  // Helper Methods
  // ============================================

  private mapPaymentResponse(data: Record<string, unknown>): PaymentResponse {
    return {
      paymentKey: data.paymentKey as string,
      orderId: data.orderId as string,
      orderName: data.orderName as string,
      status: data.status as PaymentStatus,
      requestedAt: new Date(data.requestedAt as string),
      approvedAt: data.approvedAt ? new Date(data.approvedAt as string) : undefined,
      method: data.method as PaymentMethod,
      totalAmount: data.totalAmount as number,
      balanceAmount: data.balanceAmount as number,
      suppliedAmount: data.suppliedAmount as number,
      vat: data.vat as number,
      receipt: data.receipt as { url: string } | undefined,
      card: data.card as CardInfo | undefined,
      virtualAccount: data.virtualAccount as VirtualAccountInfo | undefined,
      transfer: data.transfer as TransferInfo | undefined,
      mobilePhone: data.mobilePhone as MobilePhoneInfo | undefined,
      easyPay: data.easyPay as EasyPayInfo | undefined,
    }
  }
}

// ============================================
// Singleton Export
// ============================================

export const tossPayments = new TossPaymentsProvider()
export default tossPayments

// ============================================
// Webhook Event Types
// ============================================

export interface TossWebhookEvent {
  eventType: 'PAYMENT_STATUS_CHANGED' | 'BILLING_KEY_ISSUED' | 'VIRTUAL_ACCOUNT_DEPOSITED'
  createdAt: Date
  data: PaymentResponse | BillingKeyResponse
}

/**
 * Webhook 시그니처 검증
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secretKey: string
): boolean {
  const crypto = require('crypto')
  const expectedSignature = crypto
    .createHmac('sha256', secretKey)
    .update(payload)
    .digest('base64')

  return signature === expectedSignature
}

// ============================================
// Payment Widget Helper
// ============================================

/**
 * 프론트엔드에서 결제 위젯 초기화
 * @example
 * ```tsx
 * const { clientKey } = await fetch('/api/payments/config').then(r => r.json())
 * const widget = await loadTossPayments(clientKey)
 * widget.requestPayment(...)
 * ```
 */
export function getPaymentWidgetScript(): string {
  return 'https://js.tosspayments.com/v1/payment-widget'
}

export function getTossPaymentsScript(): string {
  return 'https://js.tosspayments.com/v1/payment'
}

// ============================================
// Bank Code Constants
// ============================================

export const BANK_CODES = {
  '경남은행': '39',
  '광주은행': '34',
  '국민은행': '04',
  '기업은행': '03',
  '농협': '11',
  '대구은행': '31',
  '부산은행': '32',
  '산업은행': '02',
  '새마을금고': '45',
  '수협': '07',
  '신한은행': '88',
  '신협': '48',
  '씨티은행': '27',
  '우리은행': '20',
  '우체국': '71',
  '전북은행': '37',
  '제주은행': '35',
  '카카오뱅크': '90',
  '케이뱅크': '89',
  '토스뱅크': '92',
  '하나은행': '81',
  'SC제일은행': '23',
} as const

export type BankCode = keyof typeof BANK_CODES
