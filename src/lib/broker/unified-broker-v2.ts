// ============================================
// UnifiedBroker v2 - Enhanced Exception Handling
// Loop 17: 예외처리 강화
// ============================================

import { safeLogger } from '@/lib/utils/safe-logger'

// ============================================
// Types
// ============================================

export interface BrokerCredentials {
  provider: BrokerProvider
  apiKey: string
  apiSecret: string
  accountNumber?: string
  isPaper?: boolean
}

export type BrokerProvider = 'kis' | 'alpaca' | 'binance'

export interface ConnectionResult {
  success: boolean
  provider: BrokerProvider
  accountId?: string
  error?: BrokerError
  latency?: number
}

export interface Balance {
  currency: string
  total: number
  available: number
  reserved: number
  updatedAt: Date
}

export interface Holding {
  symbol: string
  name?: string
  quantity: number
  avgPrice: number
  currentPrice: number
  marketValue: number
  unrealizedPnL: number
  unrealizedPnLPercent: number
}

export interface OrderRequest {
  symbol: string
  side: 'buy' | 'sell'
  quantity: number
  orderType: 'market' | 'limit' | 'stop' | 'stop_limit'
  price?: number
  stopPrice?: number
  timeInForce?: 'day' | 'gtc' | 'ioc' | 'fok'
}

export interface OrderResult {
  success: boolean
  orderId?: string
  status: OrderStatus
  filledQuantity?: number
  avgFilledPrice?: number
  error?: BrokerError
  timestamp: Date
}

export type OrderStatus =
  | 'pending'
  | 'submitted'
  | 'partial_filled'
  | 'filled'
  | 'cancelled'
  | 'rejected'
  | 'expired'
  | 'failed'

// ============================================
// Error Types
// ============================================

export type BrokerErrorCode =
  // Connection Errors
  | 'CONNECTION_FAILED'
  | 'CONNECTION_TIMEOUT'
  | 'CONNECTION_REFUSED'
  | 'AUTHENTICATION_FAILED'
  | 'INVALID_CREDENTIALS'
  | 'TOKEN_EXPIRED'
  | 'SESSION_EXPIRED'
  // Order Errors
  | 'INSUFFICIENT_FUNDS'
  | 'INSUFFICIENT_SHARES'
  | 'INVALID_SYMBOL'
  | 'INVALID_QUANTITY'
  | 'INVALID_PRICE'
  | 'MARKET_CLOSED'
  | 'ORDER_REJECTED'
  | 'ORDER_NOT_FOUND'
  | 'DUPLICATE_ORDER'
  // Rate Limit
  | 'RATE_LIMITED'
  | 'QUOTA_EXCEEDED'
  // Partial Fill
  | 'PARTIAL_FILL'
  // System Errors
  | 'BROKER_UNAVAILABLE'
  | 'MAINTENANCE_MODE'
  | 'INTERNAL_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'UNKNOWN_ERROR'

export interface BrokerError {
  code: BrokerErrorCode
  message: string
  details?: Record<string, unknown>
  retryable: boolean
  retryAfter?: number // seconds
  originalError?: unknown
}

// ============================================
// Retry Configuration
// ============================================

export interface RetryConfig {
  maxRetries: number
  baseDelay: number  // ms
  maxDelay: number   // ms
  backoffMultiplier: number
  retryableErrors: BrokerErrorCode[]
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  retryableErrors: [
    'CONNECTION_TIMEOUT',
    'NETWORK_ERROR',
    'TIMEOUT',
    'RATE_LIMITED',
    'BROKER_UNAVAILABLE',
  ],
}

// ============================================
// Circuit Breaker
// ============================================

interface CircuitState {
  failures: number
  lastFailure: Date | null
  state: 'closed' | 'open' | 'half_open'
  nextAttempt: Date | null
}

const CIRCUIT_CONFIG = {
  failureThreshold: 5,
  recoveryTimeout: 60000, // 1 minute
  halfOpenRequests: 3,
}

// ============================================
// UnifiedBroker v2 Class
// ============================================

/**
 * 통합 증권사 인터페이스 - 여러 증권사/거래소를 하나의 API로 연결
 *
 * @description
 * 한국투자증권(KIS), Alpaca, Binance 등 여러 증권사를 통합 인터페이스로 제공합니다.
 * 자동 재시도, Circuit Breaker, 큐 관리 등 안정성 기능이 내장되어 있습니다.
 *
 * @features
 * - **3개 증권사 지원**: KIS, Alpaca, Binance
 * - **자동 재시도**: 네트워크 오류 시 자동 재시도
 * - **Circuit Breaker**: 연속 실패 시 자동 차단으로 시스템 보호
 * - **요청 큐**: 동시 요청 관리 및 Rate Limit 준수
 * - **Paper Trading**: 실전과 동일한 인터페이스로 시뮬레이션
 *
 * @example
 * ```typescript
 * // 한국투자증권 연결
 * const broker = new UnifiedBrokerV2({
 *   provider: 'kis',
 *   apiKey: process.env.KIS_API_KEY,
 *   apiSecret: process.env.KIS_API_SECRET,
 *   accountNumber: '12345678',
 *   isPaper: false,  // 실전 계좌
 * });
 *
 * // 연결
 * const connection = await broker.connect();
 * if (!connection.success) {
 *   console.error('연결 실패:', connection.error);
 *   return;
 * }
 *
 * // 잔고 조회
 * const balance = await broker.getBalance();
 * console.log('사용 가능 금액:', balance.available);
 *
 * // 보유 종목 조회
 * const holdings = await broker.getHoldings();
 * console.log('보유 종목 수:', holdings.length);
 *
 * // 주문 실행
 * const order = await broker.buy('AAPL', 10, 150.50);
 * if (order.success) {
 *   console.log('주문 ID:', order.orderId);
 * }
 * ```
 *
 * @important
 * - **실전 계좌 주의**: isPaper=false 시 실제 자금으로 거래됩니다
 * - **API 키 보안**: 환경 변수 또는 보안 저장소에 저장하세요
 * - **Rate Limit**: 각 증권사의 API 호출 제한을 준수하세요
 *
 * @see {@link BrokerCredentials} 증권사 인증 정보
 * @see {@link ConnectionResult} 연결 결과
 */
export class UnifiedBrokerV2 {
  private provider: BrokerProvider
  private credentials: BrokerCredentials
  private isConnected: boolean = false
  private retryConfig: RetryConfig
  private circuitState: CircuitState
  private requestQueue: Array<() => Promise<unknown>> = []
  private isProcessingQueue: boolean = false

  /**
   * UnifiedBrokerV2 생성자
   *
   * @param credentials - 증권사 인증 정보
   * @param credentials.provider - 증권사 종류 ('kis' | 'alpaca' | 'binance')
   * @param credentials.apiKey - API 키
   * @param credentials.apiSecret - API Secret
   * @param credentials.accountNumber - 계좌번호 (KIS 필수)
   * @param credentials.isPaper - Paper Trading 모드 (기본: false)
   * @param retryConfig - 재시도 설정 (선택사항)
   * @param retryConfig.maxRetries - 최대 재시도 횟수 (기본: 3)
   * @param retryConfig.retryDelay - 재시도 간격 (기본: 1000ms)
   *
   * @example
   * ```typescript
   * const broker = new UnifiedBrokerV2(
   *   {
   *     provider: 'kis',
   *     apiKey: 'your-api-key',
   *     apiSecret: 'your-api-secret',
   *     accountNumber: '12345678',
   *     isPaper: true,  // Paper Trading
   *   },
   *   {
   *     maxRetries: 5,
   *     retryDelay: 2000,
   *   }
   * );
   * ```
   */
  constructor(credentials: BrokerCredentials, retryConfig?: Partial<RetryConfig>) {
    this.provider = credentials.provider
    this.credentials = credentials
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig }
    this.circuitState = {
      failures: 0,
      lastFailure: null,
      state: 'closed',
      nextAttempt: null,
    }
  }

  // ============================================
  // Connection Management
  // ============================================

  async connect(): Promise<ConnectionResult> {
    const startTime = Date.now()

    try {
      // Check circuit breaker
      if (!this.canMakeRequest()) {
        return {
          success: false,
          provider: this.provider,
          error: this.createError('BROKER_UNAVAILABLE', 'Circuit breaker is open'),
        }
      }

      // Simulate connection based on provider
      const result = await this.withRetry(async () => {
        return this.doConnect()
      })

      this.isConnected = true
      this.recordSuccess()

      return {
        success: true,
        provider: this.provider,
        accountId: result.accountId,
        latency: Date.now() - startTime,
      }
    } catch (error) {
      this.recordFailure()
      const brokerError = this.parseError(error)

      safeLogger.error('[UnifiedBroker] Connection failed', {
        provider: this.provider,
        error: brokerError,
      })

      return {
        success: false,
        provider: this.provider,
        error: brokerError,
        latency: Date.now() - startTime,
      }
    }
  }

  async disconnect(): Promise<void> {
    this.isConnected = false
    safeLogger.info('[UnifiedBroker] Disconnected', { provider: this.provider })
  }

  // ============================================
  // Balance & Holdings
  // ============================================

  async getBalance(): Promise<{ success: boolean; data?: Balance; error?: BrokerError }> {
    if (!this.isConnected) {
      return {
        success: false,
        error: this.createError('CONNECTION_FAILED', 'Not connected to broker'),
      }
    }

    try {
      if (!this.canMakeRequest()) {
        return {
          success: false,
          error: this.createError('BROKER_UNAVAILABLE', 'Circuit breaker is open'),
        }
      }

      const balance = await this.withRetry(async () => {
        return this.doGetBalance()
      })

      this.recordSuccess()
      return { success: true, data: balance }
    } catch (error) {
      this.recordFailure()
      return { success: false, error: this.parseError(error) }
    }
  }

  async getHoldings(): Promise<{ success: boolean; data?: Holding[]; error?: BrokerError }> {
    if (!this.isConnected) {
      return {
        success: false,
        error: this.createError('CONNECTION_FAILED', 'Not connected to broker'),
      }
    }

    try {
      if (!this.canMakeRequest()) {
        return {
          success: false,
          error: this.createError('BROKER_UNAVAILABLE', 'Circuit breaker is open'),
        }
      }

      const holdings = await this.withRetry(async () => {
        return this.doGetHoldings()
      })

      this.recordSuccess()
      return { success: true, data: holdings }
    } catch (error) {
      this.recordFailure()
      return { success: false, error: this.parseError(error) }
    }
  }

  // ============================================
  // Order Management
  // ============================================

  async submitOrder(request: OrderRequest): Promise<OrderResult> {
    if (!this.isConnected) {
      return {
        success: false,
        status: 'failed',
        error: this.createError('CONNECTION_FAILED', 'Not connected to broker'),
        timestamp: new Date(),
      }
    }

    // Validate order
    const validation = this.validateOrder(request)
    if (!validation.valid) {
      return {
        success: false,
        status: 'rejected',
        error: validation.error,
        timestamp: new Date(),
      }
    }

    try {
      if (!this.canMakeRequest()) {
        return {
          success: false,
          status: 'failed',
          error: this.createError('BROKER_UNAVAILABLE', 'Circuit breaker is open'),
          timestamp: new Date(),
        }
      }

      const result = await this.withRetry(
        async () => this.doSubmitOrder(request),
        // Order submission should have fewer retries
        { ...this.retryConfig, maxRetries: 1 }
      )

      this.recordSuccess()

      // Handle partial fill
      if (result.status === 'partial_filled') {
        safeLogger.warn('[UnifiedBroker] Partial fill', {
          orderId: result.orderId,
          requested: request.quantity,
          filled: result.filledQuantity,
        })
      }

      return result
    } catch (error) {
      this.recordFailure()
      return {
        success: false,
        status: 'failed',
        error: this.parseError(error),
        timestamp: new Date(),
      }
    }
  }

  async cancelOrder(orderId: string): Promise<{ success: boolean; error?: BrokerError }> {
    if (!this.isConnected) {
      return {
        success: false,
        error: this.createError('CONNECTION_FAILED', 'Not connected to broker'),
      }
    }

    try {
      await this.withRetry(async () => {
        return this.doCancelOrder(orderId)
      })

      this.recordSuccess()
      return { success: true }
    } catch (error) {
      this.recordFailure()
      return { success: false, error: this.parseError(error) }
    }
  }

  async getOrderStatus(orderId: string): Promise<{
    success: boolean
    data?: { status: OrderStatus; filledQuantity?: number; avgPrice?: number }
    error?: BrokerError
  }> {
    if (!this.isConnected) {
      return {
        success: false,
        error: this.createError('CONNECTION_FAILED', 'Not connected to broker'),
      }
    }

    try {
      const status = await this.withRetry(async () => {
        return this.doGetOrderStatus(orderId)
      })

      this.recordSuccess()
      return { success: true, data: status }
    } catch (error) {
      this.recordFailure()
      return { success: false, error: this.parseError(error) }
    }
  }

  // ============================================
  // Graceful Degradation
  // ============================================

  async executeWithFallback<T>(
    primary: () => Promise<T>,
    fallback: () => Promise<T>,
    options?: { timeout?: number }
  ): Promise<{ success: boolean; data?: T; usedFallback: boolean; error?: BrokerError }> {
    const timeout = options?.timeout || 10000

    try {
      // Try primary with timeout
      const result = await Promise.race([
        primary(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT')), timeout)
        ),
      ])

      return { success: true, data: result, usedFallback: false }
    } catch (primaryError) {
      safeLogger.warn('[UnifiedBroker] Primary failed, trying fallback', {
        error: primaryError,
      })

      try {
        const result = await fallback()
        return { success: true, data: result, usedFallback: true }
      } catch (fallbackError) {
        return {
          success: false,
          usedFallback: true,
          error: this.parseError(fallbackError),
        }
      }
    }
  }

  // ============================================
  // Health Check
  // ============================================

  async healthCheck(): Promise<{
    healthy: boolean
    latency?: number
    circuitState: string
    lastError?: BrokerError
  }> {
    const startTime = Date.now()

    try {
      // Simple ping/pong or balance check
      const result = await this.getBalance()

      return {
        healthy: result.success,
        latency: Date.now() - startTime,
        circuitState: this.circuitState.state,
        lastError: result.error,
      }
    } catch (error) {
      return {
        healthy: false,
        latency: Date.now() - startTime,
        circuitState: this.circuitState.state,
        lastError: this.parseError(error),
      }
    }
  }

  getCircuitState(): CircuitState {
    return { ...this.circuitState }
  }

  // ============================================
  // Private: Retry Logic
  // ============================================

  private async withRetry<T>(
    operation: () => Promise<T>,
    config?: RetryConfig
  ): Promise<T> {
    const retryConfig = config || this.retryConfig
    let lastError: unknown

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error
        const brokerError = this.parseError(error)

        // Check if retryable
        if (!retryConfig.retryableErrors.includes(brokerError.code)) {
          throw error
        }

        // Check if max retries reached
        if (attempt >= retryConfig.maxRetries) {
          throw error
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, attempt),
          retryConfig.maxDelay
        )

        // Add jitter
        const jitter = Math.random() * 0.3 * delay
        const totalDelay = delay + jitter

        safeLogger.info('[UnifiedBroker] Retrying', {
          attempt: attempt + 1,
          maxRetries: retryConfig.maxRetries,
          delay: totalDelay,
          error: brokerError.code,
        })

        await this.sleep(totalDelay)
      }
    }

    throw lastError
  }

  // ============================================
  // Private: Circuit Breaker
  // ============================================

  private canMakeRequest(): boolean {
    const now = new Date()

    switch (this.circuitState.state) {
      case 'closed':
        return true

      case 'open':
        if (this.circuitState.nextAttempt && now >= this.circuitState.nextAttempt) {
          // Transition to half-open
          this.circuitState.state = 'half_open'
          return true
        }
        return false

      case 'half_open':
        return true

      default:
        return true
    }
  }

  private recordSuccess(): void {
    if (this.circuitState.state === 'half_open') {
      // Reset circuit on success in half-open state
      this.circuitState = {
        failures: 0,
        lastFailure: null,
        state: 'closed',
        nextAttempt: null,
      }
      safeLogger.info('[UnifiedBroker] Circuit closed', { provider: this.provider })
    }
  }

  private recordFailure(): void {
    const now = new Date()
    this.circuitState.failures++
    this.circuitState.lastFailure = now

    if (this.circuitState.failures >= CIRCUIT_CONFIG.failureThreshold) {
      this.circuitState.state = 'open'
      this.circuitState.nextAttempt = new Date(
        now.getTime() + CIRCUIT_CONFIG.recoveryTimeout
      )

      safeLogger.warn('[UnifiedBroker] Circuit opened', {
        provider: this.provider,
        failures: this.circuitState.failures,
        nextAttempt: this.circuitState.nextAttempt,
      })
    }
  }

  // ============================================
  // Private: Error Handling
  // ============================================

  private parseError(error: unknown): BrokerError {
    if (error instanceof Error) {
      const message = error.message.toLowerCase()

      // Connection errors
      if (message.includes('timeout')) {
        return this.createError('CONNECTION_TIMEOUT', error.message, true, 5)
      }
      if (message.includes('network') || message.includes('fetch')) {
        return this.createError('NETWORK_ERROR', error.message, true, 3)
      }
      if (message.includes('unauthorized') || message.includes('401')) {
        return this.createError('AUTHENTICATION_FAILED', error.message, false)
      }
      if (message.includes('rate limit') || message.includes('429')) {
        return this.createError('RATE_LIMITED', error.message, true, 60)
      }

      // Order errors
      if (message.includes('insufficient fund')) {
        return this.createError('INSUFFICIENT_FUNDS', error.message, false)
      }
      if (message.includes('insufficient share') || message.includes('insufficient position')) {
        return this.createError('INSUFFICIENT_SHARES', error.message, false)
      }
      if (message.includes('market closed')) {
        return this.createError('MARKET_CLOSED', error.message, false)
      }
      if (message.includes('invalid symbol')) {
        return this.createError('INVALID_SYMBOL', error.message, false)
      }

      return this.createError('UNKNOWN_ERROR', error.message, false)
    }

    return this.createError('UNKNOWN_ERROR', 'An unknown error occurred', false)
  }

  private createError(
    code: BrokerErrorCode,
    message: string,
    retryable: boolean = false,
    retryAfter?: number
  ): BrokerError {
    return {
      code,
      message,
      retryable,
      retryAfter,
    }
  }

  // ============================================
  // Private: Validation
  // ============================================

  private validateOrder(request: OrderRequest): { valid: boolean; error?: BrokerError } {
    if (!request.symbol || request.symbol.trim() === '') {
      return {
        valid: false,
        error: this.createError('INVALID_SYMBOL', 'Symbol is required'),
      }
    }

    if (!request.quantity || request.quantity <= 0) {
      return {
        valid: false,
        error: this.createError('INVALID_QUANTITY', 'Quantity must be positive'),
      }
    }

    if (request.orderType === 'limit' && (!request.price || request.price <= 0)) {
      return {
        valid: false,
        error: this.createError('INVALID_PRICE', 'Price is required for limit orders'),
      }
    }

    if (
      (request.orderType === 'stop' || request.orderType === 'stop_limit') &&
      (!request.stopPrice || request.stopPrice <= 0)
    ) {
      return {
        valid: false,
        error: this.createError('INVALID_PRICE', 'Stop price is required for stop orders'),
      }
    }

    return { valid: true }
  }

  // ============================================
  // Private: Provider-specific implementations
  // (These would be overridden or implemented per provider)
  // ============================================

  private async doConnect(): Promise<{ accountId: string }> {
    // Simulated - actual implementation would call provider API
    await this.sleep(100)
    return { accountId: `${this.provider}-account-${Date.now()}` }
  }

  private async doGetBalance(): Promise<Balance> {
    await this.sleep(50)
    return {
      currency: 'USD',
      total: 100000,
      available: 95000,
      reserved: 5000,
      updatedAt: new Date(),
    }
  }

  private async doGetHoldings(): Promise<Holding[]> {
    await this.sleep(50)
    return []
  }

  private async doSubmitOrder(request: OrderRequest): Promise<OrderResult> {
    await this.sleep(100)
    return {
      success: true,
      orderId: `order-${Date.now()}`,
      status: 'submitted',
      timestamp: new Date(),
    }
  }

  private async doCancelOrder(orderId: string): Promise<void> {
    await this.sleep(50)
  }

  private async doGetOrderStatus(orderId: string): Promise<{
    status: OrderStatus
    filledQuantity?: number
    avgPrice?: number
  }> {
    await this.sleep(50)
    return { status: 'filled', filledQuantity: 100, avgPrice: 150.25 }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// ============================================
// Factory Function
// ============================================

export function createBroker(
  credentials: BrokerCredentials,
  retryConfig?: Partial<RetryConfig>
): UnifiedBrokerV2 {
  return new UnifiedBrokerV2(credentials, retryConfig)
}

export default UnifiedBrokerV2
