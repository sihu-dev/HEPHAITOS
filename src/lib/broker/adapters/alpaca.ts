// ============================================
// Alpaca Broker Adapter
// 해외주식 트레이딩 - 가장 쉬운 연동 (1분)
// https://alpaca.markets
// ============================================

import type {
  UnifiedBroker,
  BrokerId,
  BrokerCredentials,
  ConnectionResult,
  Balance,
  Holding,
  Order,
  OrderRequest,
  OrderResult,
  OrderStatus,
  Quote,
  QuoteCallback,
  OrderCallback,
} from '../types'

/**
 * Alpaca API 응답 타입
 */
interface AlpacaAccount {
  id: string
  account_number: string
  status: string
  currency: string
  cash: string
  portfolio_value: string
  buying_power: string
  equity: string
  last_equity: string
  long_market_value: string
  short_market_value: string
}

interface AlpacaPosition {
  asset_id: string
  symbol: string
  exchange: string
  asset_class: string
  qty: string
  avg_entry_price: string
  side: string
  market_value: string
  cost_basis: string
  unrealized_pl: string
  unrealized_plpc: string
  current_price: string
}

interface AlpacaOrder {
  id: string
  client_order_id: string
  created_at: string
  updated_at: string
  submitted_at: string
  filled_at: string | null
  expired_at: string | null
  canceled_at: string | null
  failed_at: string | null
  replaced_at: string | null
  asset_id: string
  symbol: string
  asset_class: string
  qty: string
  filled_qty: string
  type: string
  side: string
  time_in_force: string
  limit_price: string | null
  stop_price: string | null
  filled_avg_price: string | null
  status: string
}

interface AlpacaQuote {
  symbol: string
  latestTrade: {
    p: number  // price
    s: number  // size
    t: string  // timestamp
  }
  latestQuote: {
    ap: number // ask price
    bp: number // bid price
    as: number // ask size
    bs: number // bid size
  }
  minuteBar: {
    o: number  // open
    h: number  // high
    l: number  // low
    c: number  // close
    v: number  // volume
    t: string  // timestamp
  }
  dailyBar: {
    o: number
    h: number
    l: number
    c: number
    v: number
    t: string
  }
  prevDailyBar: {
    c: number
  }
}

/**
 * Alpaca Unified Broker 구현
 */
export class AlpacaBroker implements UnifiedBroker {
  readonly brokerId: BrokerId = 'alpaca'
  readonly brokerName = 'Alpaca'

  private baseUrl: string
  private dataUrl = 'https://data.alpaca.markets'
  private credentials: BrokerCredentials | null = null
  private wsConnection: WebSocket | null = null
  private quoteCallbacks = new Map<string, Set<QuoteCallback>>()
  private orderCallbacks = new Set<OrderCallback>()

  constructor() {
    // Paper trading by default
    this.baseUrl = 'https://paper-api.alpaca.markets'
  }

  // ============================================
  // Authentication
  // ============================================

  async connect(credentials: BrokerCredentials): Promise<ConnectionResult> {
    try {
      this.credentials = credentials

      // 실전/모의 구분
      this.baseUrl = credentials.accountType === 'real'
        ? 'https://api.alpaca.markets'
        : 'https://paper-api.alpaca.markets'

      // 계좌 정보 조회로 연결 확인
      const res = await this.request<AlpacaAccount>('/v2/account')

      if (res.status !== 'ACTIVE') {
        return {
          success: false,
          message: '계좌가 활성화되지 않았습니다',
          error: `Account status: ${res.status}`,
        }
      }

      const balance = this.parseBalance(res)

      return {
        success: true,
        message: 'Alpaca 연결 성공',
        balance,
      }
    } catch (error) {
      console.error('[AlpacaBroker] Connect failed:', error)
      return {
        success: false,
        message: '연결 실패',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async disconnect(): Promise<void> {
    this.credentials = null
    if (this.wsConnection) {
      this.wsConnection.close()
      this.wsConnection = null
    }
    this.quoteCallbacks.clear()
    this.orderCallbacks.clear()
  }

  isConnected(): boolean {
    return this.credentials !== null
  }

  async refreshToken(): Promise<boolean> {
    // Alpaca API Key는 만료되지 않음
    return this.isConnected()
  }

  // ============================================
  // Account Queries
  // ============================================

  async getBalance(): Promise<Balance> {
    const res = await this.request<AlpacaAccount>('/v2/account')
    return this.parseBalance(res)
  }

  private parseBalance(account: AlpacaAccount): Balance {
    const cash = parseFloat(account.cash) || 0
    const equity = parseFloat(account.equity) || 0
    const lastEquity = parseFloat(account.last_equity) || 0
    const portfolioValue = parseFloat(account.portfolio_value) || 0
    const longMarketValue = parseFloat(account.long_market_value) || 0

    return {
      totalAssets: portfolioValue,
      cash,
      stocksValue: longMarketValue,
      totalProfit: equity - lastEquity,
      profitRate: lastEquity > 0 ? ((equity - lastEquity) / lastEquity) * 100 : 0,
      buyingPower: parseFloat(account.buying_power) || 0,
      currency: account.currency || 'USD',
    }
  }

  async getHoldings(): Promise<Holding[]> {
    const positions = await this.request<AlpacaPosition[]>('/v2/positions')

    return positions.map((pos) => ({
      stockCode: pos.symbol,
      stockName: pos.symbol, // Alpaca doesn't return name
      market: pos.exchange === 'NASDAQ' ? 'NASDAQ' as const : 'NYSE' as const,
      quantity: parseFloat(pos.qty) || 0,
      avgPrice: parseFloat(pos.avg_entry_price) || 0,
      currentPrice: parseFloat(pos.current_price) || 0,
      profit: parseFloat(pos.unrealized_pl) || 0,
      profitRate: parseFloat(pos.unrealized_plpc) * 100 || 0,
      value: parseFloat(pos.market_value) || 0,
    }))
  }

  async getOrders(status?: OrderStatus): Promise<Order[]> {
    const params = new URLSearchParams()
    if (status) {
      const alpacaStatus = this.toAlpacaStatus(status)
      if (alpacaStatus) params.set('status', alpacaStatus)
    }

    const orders = await this.request<AlpacaOrder[]>(`/v2/orders?${params.toString()}`)
    return orders.map((o) => this.parseOrder(o))
  }

  async getOrderHistory(days: number = 30): Promise<Order[]> {
    const after = new Date()
    after.setDate(after.getDate() - days)

    const orders = await this.request<AlpacaOrder[]>(
      `/v2/orders?status=all&after=${after.toISOString()}`
    )
    return orders.map((o) => this.parseOrder(o))
  }

  private parseOrder(order: AlpacaOrder): Order {
    return {
      orderId: order.id,
      stockCode: order.symbol,
      stockName: order.symbol,
      side: order.side as 'buy' | 'sell',
      type: order.type as 'market' | 'limit' | 'stop' | 'stop_limit',
      quantity: parseFloat(order.qty) || 0,
      filledQuantity: parseFloat(order.filled_qty) || 0,
      price: parseFloat(order.limit_price || '0') || 0,
      avgFilledPrice: order.filled_avg_price ? parseFloat(order.filled_avg_price) : undefined,
      status: this.fromAlpacaStatus(order.status),
      createdAt: new Date(order.created_at),
      updatedAt: new Date(order.updated_at),
    }
  }

  // ============================================
  // Order Execution
  // ============================================

  async submitOrder(request: OrderRequest): Promise<OrderResult> {
    try {
      const body: Record<string, string | number> = {
        symbol: request.stockCode,
        qty: request.quantity,
        side: request.side,
        type: request.type,
        time_in_force: 'day',
      }

      if (request.type === 'limit' && request.price) {
        body.limit_price = request.price
      }

      if ((request.type === 'stop' || request.type === 'stop_limit') && request.stopPrice) {
        body.stop_price = request.stopPrice
      }

      const order = await this.request<AlpacaOrder>('/v2/orders', 'POST', body)

      return {
        success: true,
        orderId: order.id,
        message: `${request.side === 'buy' ? 'Buy' : 'Sell'} order submitted`,
      }
    } catch (error) {
      return {
        success: false,
        message: 'Order failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async cancelOrder(orderId: string): Promise<OrderResult> {
    try {
      await this.request(`/v2/orders/${orderId}`, 'DELETE')
      return {
        success: true,
        message: 'Order cancelled',
      }
    } catch (error) {
      return {
        success: false,
        message: 'Cancel failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async modifyOrder(orderId: string, newPrice: number, newQuantity?: number): Promise<OrderResult> {
    try {
      const body: Record<string, string | number> = {
        limit_price: newPrice,
      }
      if (newQuantity) {
        body.qty = newQuantity
      }

      const order = await this.request<AlpacaOrder>(
        `/v2/orders/${orderId}`,
        'PATCH',
        body
      )

      return {
        success: true,
        orderId: order.id,
        message: 'Order modified',
      }
    } catch (error) {
      return {
        success: false,
        message: 'Modify failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // ============================================
  // Convenience Methods
  // ============================================

  async buy(stockCode: string, quantity: number, price?: number): Promise<OrderResult> {
    return this.submitOrder({
      stockCode,
      side: 'buy',
      type: price ? 'limit' : 'market',
      quantity,
      price,
    })
  }

  async sell(stockCode: string, quantity: number, price?: number): Promise<OrderResult> {
    return this.submitOrder({
      stockCode,
      side: 'sell',
      type: price ? 'limit' : 'market',
      quantity,
      price,
    })
  }

  async cancelAllOrders(): Promise<OrderResult[]> {
    try {
      await this.request('/v2/orders', 'DELETE')
      return [{ success: true, message: 'All orders cancelled' }]
    } catch (error) {
      return [{
        success: false,
        message: 'Cancel all failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }]
    }
  }

  async closeAllPositions(): Promise<OrderResult[]> {
    try {
      await this.request('/v2/positions', 'DELETE')
      return [{ success: true, message: 'All positions closed' }]
    } catch (error) {
      return [{
        success: false,
        message: 'Close all failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }]
    }
  }

  // ============================================
  // Real-time Data
  // ============================================

  subscribeQuote(stockCode: string, callback: QuoteCallback): () => void {
    if (!this.quoteCallbacks.has(stockCode)) {
      this.quoteCallbacks.set(stockCode, new Set())
      this.connectWebSocket(stockCode)
    }
    this.quoteCallbacks.get(stockCode)!.add(callback)

    return () => {
      const callbacks = this.quoteCallbacks.get(stockCode)
      if (callbacks) {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          this.quoteCallbacks.delete(stockCode)
        }
      }
    }
  }

  private connectWebSocket(symbol: string): void {
    // TODO: Implement Alpaca WebSocket connection
    console.log(`[AlpacaBroker] WebSocket subscription for ${symbol}`)
  }

  subscribeOrders(callback: OrderCallback): () => void {
    this.orderCallbacks.add(callback)
    return () => {
      this.orderCallbacks.delete(callback)
    }
  }

  // ============================================
  // Market Data
  // ============================================

  async getQuote(stockCode: string): Promise<Quote> {
    const res = await this.dataRequest<{ [key: string]: AlpacaQuote }>(
      `/v2/stocks/${stockCode}/snapshot`
    )

    const snapshot = res[stockCode]
    const prevClose = snapshot.prevDailyBar?.c || snapshot.dailyBar?.o || 0
    const currentPrice = snapshot.latestTrade?.p || snapshot.minuteBar?.c || 0

    return {
      stockCode,
      stockName: stockCode,
      currentPrice,
      change: currentPrice - prevClose,
      changeRate: prevClose > 0 ? ((currentPrice - prevClose) / prevClose) * 100 : 0,
      open: snapshot.dailyBar?.o || 0,
      high: snapshot.dailyBar?.h || 0,
      low: snapshot.dailyBar?.l || 0,
      volume: snapshot.dailyBar?.v || 0,
      timestamp: new Date(snapshot.latestTrade?.t || Date.now()),
    }
  }

  async searchStock(keyword: string): Promise<Array<{ code: string; name: string; market: string }>> {
    // Alpaca doesn't have a stock search API, return popular stocks
    const popularStocks = [
      { code: 'AAPL', name: 'Apple Inc.', market: 'NASDAQ' },
      { code: 'MSFT', name: 'Microsoft Corporation', market: 'NASDAQ' },
      { code: 'GOOGL', name: 'Alphabet Inc.', market: 'NASDAQ' },
      { code: 'AMZN', name: 'Amazon.com Inc.', market: 'NASDAQ' },
      { code: 'NVDA', name: 'NVIDIA Corporation', market: 'NASDAQ' },
      { code: 'META', name: 'Meta Platforms Inc.', market: 'NASDAQ' },
      { code: 'TSLA', name: 'Tesla Inc.', market: 'NASDAQ' },
      { code: 'JPM', name: 'JPMorgan Chase & Co.', market: 'NYSE' },
      { code: 'V', name: 'Visa Inc.', market: 'NYSE' },
      { code: 'JNJ', name: 'Johnson & Johnson', market: 'NYSE' },
    ]

    const kw = keyword.toUpperCase()
    return popularStocks.filter(
      (s) => s.code.includes(kw) || s.name.toUpperCase().includes(kw)
    )
  }

  // ============================================
  // Private Helpers
  // ============================================

  private async request<T>(
    path: string,
    method: 'GET' | 'POST' | 'DELETE' | 'PATCH' = 'GET',
    body?: Record<string, unknown>
  ): Promise<T> {
    if (!this.credentials) {
      throw new Error('Not connected to Alpaca')
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'APCA-API-KEY-ID': this.credentials.apiKey,
        'APCA-API-SECRET-KEY': this.credentials.apiSecret,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!res.ok) {
      const error = await res.text()
      throw new Error(`Alpaca API Error: ${res.status} - ${error}`)
    }

    // DELETE requests may return empty body
    if (method === 'DELETE') {
      return {} as T
    }

    return res.json()
  }

  private async dataRequest<T>(path: string): Promise<T> {
    if (!this.credentials) {
      throw new Error('Not connected to Alpaca')
    }

    const res = await fetch(`${this.dataUrl}${path}`, {
      headers: {
        'APCA-API-KEY-ID': this.credentials.apiKey,
        'APCA-API-SECRET-KEY': this.credentials.apiSecret,
      },
    })

    if (!res.ok) {
      const error = await res.text()
      throw new Error(`Alpaca Data API Error: ${res.status} - ${error}`)
    }

    return res.json()
  }

  private toAlpacaStatus(status: OrderStatus): string | null {
    const map: Record<OrderStatus, string | null> = {
      pending: 'new',
      submitted: 'accepted',
      partial: 'partially_filled',
      filled: 'filled',
      cancelled: 'canceled',
      rejected: 'rejected',
    }
    return map[status]
  }

  private fromAlpacaStatus(status: string): OrderStatus {
    const map: Record<string, OrderStatus> = {
      new: 'pending',
      accepted: 'submitted',
      pending_new: 'pending',
      accepted_for_bidding: 'submitted',
      partially_filled: 'partial',
      filled: 'filled',
      canceled: 'cancelled',
      expired: 'cancelled',
      rejected: 'rejected',
      pending_cancel: 'pending',
      pending_replace: 'pending',
      replaced: 'submitted',
      done_for_day: 'filled',
    }
    return map[status] || 'pending'
  }
}

/**
 * Alpaca Broker 팩토리 함수
 */
export function createAlpacaBroker(): AlpacaBroker {
  return new AlpacaBroker()
}
