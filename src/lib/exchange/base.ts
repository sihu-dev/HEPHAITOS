// ============================================
// Base Exchange Class
// ============================================

import type {
  ExchangeCredentials,
  ExchangeConfig,
  IExchange,
  Ticker,
  OrderBook,
  Order,
  OrderRequest,
  AccountBalance,
  MarketInfo,
  WSSubscription,
  WSMessage,
  ExchangeResponse,
} from './types'
import type { ExchangeId, OHLCV } from '@/types'

export abstract class BaseExchange implements IExchange {
  abstract readonly id: ExchangeId
  abstract readonly name: string
  protected config: ExchangeConfig
  protected credentials: ExchangeCredentials | null = null
  protected wsCallbacks: ((message: WSMessage) => void)[] = []
  protected ws: WebSocket | null = null
  protected useTestnet: boolean = false

  constructor(config: ExchangeConfig, testnet: boolean = false) {
    this.config = config
    this.useTestnet = testnet
  }

  // Get base URL (production or testnet)
  protected get baseUrl(): string {
    if (this.useTestnet && this.config.testnet) {
      return this.config.testnet.baseUrl
    }
    return this.config.baseUrl
  }

  protected get wsUrl(): string | undefined {
    if (this.useTestnet && this.config.testnet) {
      return this.config.testnet.wsUrl
    }
    return this.config.wsUrl
  }

  // Set API credentials
  setCredentials(credentials: ExchangeCredentials): void {
    this.credentials = credentials
  }

  // Validate credentials by making a test API call
  abstract validateCredentials(): Promise<boolean>

  // Market Data (abstract methods to be implemented by each exchange)
  abstract getTicker(symbol: string): Promise<Ticker>
  abstract getTickers(symbols?: string[]): Promise<Ticker[]>
  abstract getOrderBook(symbol: string, limit?: number): Promise<OrderBook>
  abstract getOHLCV(symbol: string, interval: string, limit?: number): Promise<OHLCV[]>
  abstract getMarkets(): Promise<MarketInfo[]>

  // Trading
  abstract createOrder(order: OrderRequest): Promise<Order>
  abstract cancelOrder(orderId: string, symbol: string): Promise<boolean>
  abstract getOrder(orderId: string, symbol: string): Promise<Order>
  abstract getOpenOrders(symbol?: string): Promise<Order[]>
  abstract getOrderHistory(symbol?: string, limit?: number): Promise<Order[]>

  // Account
  abstract getBalance(): Promise<AccountBalance>

  // WebSocket methods
  abstract subscribe(subscriptions: WSSubscription[]): void
  abstract unsubscribe(subscriptions: WSSubscription[]): void

  onMessage(callback: (message: WSMessage) => void): void {
    this.wsCallbacks.push(callback)
  }

  protected emitMessage(message: WSMessage): void {
    this.wsCallbacks.forEach(callback => callback(message))
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.wsCallbacks = []
  }

  // HTTP Request helper
  protected async request<T>(
    method: 'GET' | 'POST' | 'DELETE' | 'PUT',
    endpoint: string,
    params?: Record<string, string | number | boolean>,
    body?: unknown,
    signed: boolean = false
  ): Promise<ExchangeResponse<T>> {
    try {
      const url = new URL(endpoint, this.baseUrl)

      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.append(key, String(value))
        })
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (signed && this.credentials) {
        this.addAuthHeaders(headers, method, endpoint, params, body)
      }

      const response = await fetch(url.toString(), {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.code || response.status.toString(),
            message: data.msg || data.message || 'Unknown error',
          },
        }
      }

      return {
        success: true,
        data,
        rateLimit: this.extractRateLimit(response.headers),
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error',
        },
      }
    }
  }

  // Add authentication headers (to be implemented by each exchange)
  protected abstract addAuthHeaders(
    headers: Record<string, string>,
    method: string,
    endpoint: string,
    params?: Record<string, string | number | boolean>,
    body?: unknown
  ): void

  // Extract rate limit info from response headers
  protected extractRateLimit(headers: Headers): { remaining: number; resetAt: number } | undefined {
    const remaining = headers.get('X-RateLimit-Remaining')
    const resetAt = headers.get('X-RateLimit-Reset')

    if (remaining && resetAt) {
      return {
        remaining: parseInt(remaining, 10),
        resetAt: parseInt(resetAt, 10),
      }
    }
    return undefined
  }

  // Utility: Format symbol for exchange
  protected abstract formatSymbol(symbol: string): string

  // Utility: Parse symbol from exchange format
  protected abstract parseSymbol(exchangeSymbol: string): string
}
