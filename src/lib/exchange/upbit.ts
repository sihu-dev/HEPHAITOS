// ============================================
// Upbit Exchange Implementation (Korean Exchange)
// ============================================

import { createHmac } from 'crypto'
import { BaseExchange } from './base'
import type {
  Ticker,
  OrderBook,
  Order,
  OrderRequest,
  AccountBalance,
  MarketInfo,
  WSSubscription,
  WSMessage,
  OrderStatus,
  OrderSide,
  OrderType,
  Balance,
} from './types'
import type { ExchangeId, OHLCV } from '@/types'
import { v4 as uuidv4 } from 'uuid'

// Upbit API Response Types
interface UpbitTicker {
  market: string
  trade_date: string
  trade_time: string
  trade_timestamp: number
  opening_price: number
  high_price: number
  low_price: number
  trade_price: number
  prev_closing_price: number
  change: 'RISE' | 'EVEN' | 'FALL'
  change_price: number
  change_rate: number
  signed_change_price: number
  signed_change_rate: number
  trade_volume: number
  acc_trade_price: number
  acc_trade_price_24h: number
  acc_trade_volume: number
  acc_trade_volume_24h: number
  highest_52_week_price: number
  lowest_52_week_price: number
  timestamp: number
}

interface UpbitOrderBook {
  market: string
  timestamp: number
  total_ask_size: number
  total_bid_size: number
  orderbook_units: {
    ask_price: number
    bid_price: number
    ask_size: number
    bid_size: number
  }[]
}

interface UpbitOrder {
  uuid: string
  side: 'bid' | 'ask'
  ord_type: 'limit' | 'price' | 'market'
  price: string | null
  state: 'wait' | 'watch' | 'done' | 'cancel'
  market: string
  created_at: string
  volume: string
  remaining_volume: string
  reserved_fee: string
  remaining_fee: string
  paid_fee: string
  locked: string
  executed_volume: string
  trades_count: number
}

interface UpbitAccount {
  currency: string
  balance: string
  locked: string
  avg_buy_price: string
  avg_buy_price_modified: boolean
  unit_currency: string
}

interface UpbitCandle {
  market: string
  candle_date_time_utc: string
  candle_date_time_kst: string
  opening_price: number
  high_price: number
  low_price: number
  trade_price: number
  timestamp: number
  candle_acc_trade_price: number
  candle_acc_trade_volume: number
  unit?: number
}

interface UpbitMarket {
  market: string
  korean_name: string
  english_name: string
  market_warning?: 'NONE' | 'CAUTION'
}

export class UpbitExchange extends BaseExchange {
  readonly id: ExchangeId = 'upbit'
  readonly name = 'Upbit'
  private wsSubscriptions: Map<string, WSSubscription> = new Map()

  constructor() {
    super({
      id: 'upbit',
      name: 'Upbit',
      baseUrl: 'https://api.upbit.com',
      wsUrl: 'wss://api.upbit.com/websocket/v1',
      rateLimit: {
        requestsPerSecond: 10,
        requestsPerMinute: 600,
      },
      features: {
        spot: true,
        futures: false,
        margin: false,
        websocket: true,
        sandbox: false, // Upbit doesn't have testnet
      },
    })
  }

  // Authentication
  async validateCredentials(): Promise<boolean> {
    if (!this.credentials) return false

    const response = await this.request<UpbitAccount[]>(
      'GET',
      '/v1/accounts',
      undefined,
      undefined,
      true
    )

    return response.success
  }

  // Add Upbit auth headers (JWT based)
  protected addAuthHeaders(
    headers: Record<string, string>,
    _method: string,
    _endpoint: string,
    params?: Record<string, string | number | boolean>,
  ): void {
    if (!this.credentials) return

    const payload: Record<string, unknown> = {
      access_key: this.credentials.apiKey,
      nonce: uuidv4(),
      timestamp: Date.now(),
    }

    // Add query hash if params exist
    if (params && Object.keys(params).length > 0) {
      const queryString = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        queryString.append(key, String(value))
      })
      const hash = createHmac('sha512', this.credentials.secretKey)
        .update(queryString.toString())
        .digest('hex')
      payload.query_hash = hash
      payload.query_hash_alg = 'SHA512'
    }

    // Create JWT token
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
    const signature = createHmac('sha256', this.credentials.secretKey)
      .update(`${header}.${body}`)
      .digest('base64url')

    headers['Authorization'] = `Bearer ${header}.${body}.${signature}`
  }

  // Market Data
  async getTicker(symbol: string): Promise<Ticker> {
    const response = await this.request<UpbitTicker[]>(
      'GET',
      '/v1/ticker',
      { markets: this.formatSymbol(symbol) }
    )

    if (!response.success || !response.data || response.data.length === 0) {
      throw new Error(response.error?.message || 'Failed to get ticker')
    }

    return this.parseTicker(response.data[0])
  }

  async getTickers(symbols?: string[]): Promise<Ticker[]> {
    let markets: string

    if (symbols && symbols.length > 0) {
      markets = symbols.map(s => this.formatSymbol(s)).join(',')
    } else {
      // Get all KRW markets if no symbols specified
      const marketsResponse = await this.request<UpbitMarket[]>('GET', '/v1/market/all')
      if (!marketsResponse.success || !marketsResponse.data) {
        throw new Error('Failed to get markets')
      }
      markets = marketsResponse.data
        .filter(m => m.market.startsWith('KRW-'))
        .map(m => m.market)
        .join(',')
    }

    const response = await this.request<UpbitTicker[]>(
      'GET',
      '/v1/ticker',
      { markets }
    )

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get tickers')
    }

    return response.data.map(t => this.parseTicker(t))
  }

  async getOrderBook(symbol: string, limit: number = 15): Promise<OrderBook> {
    const response = await this.request<UpbitOrderBook[]>(
      'GET',
      '/v1/orderbook',
      { markets: this.formatSymbol(symbol), level: Math.min(limit, 15) }
    )

    if (!response.success || !response.data || response.data.length === 0) {
      throw new Error(response.error?.message || 'Failed to get order book')
    }

    const data = response.data[0]

    return {
      symbol,
      bids: data.orderbook_units.map(u => ({
        price: u.bid_price,
        quantity: u.bid_size,
      })),
      asks: data.orderbook_units.map(u => ({
        price: u.ask_price,
        quantity: u.ask_size,
      })),
      timestamp: data.timestamp,
    }
  }

  async getOHLCV(symbol: string, interval: string, limit: number = 200): Promise<OHLCV[]> {
    const { endpoint, unit } = this.getCandelEndpoint(interval)

    const params: Record<string, string | number> = {
      market: this.formatSymbol(symbol),
      count: Math.min(limit, 200),
    }

    if (unit) {
      params.unit = unit
    }

    const response = await this.request<UpbitCandle[]>('GET', endpoint, params)

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get OHLCV')
    }

    return response.data.map(c => ({
      timestamp: c.timestamp,
      open: c.opening_price,
      high: c.high_price,
      low: c.low_price,
      close: c.trade_price,
      volume: c.candle_acc_trade_volume,
    })).reverse() // Upbit returns newest first
  }

  async getMarkets(): Promise<MarketInfo[]> {
    const response = await this.request<UpbitMarket[]>('GET', '/v1/market/all')

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get markets')
    }

    return response.data
      .filter(m => m.market.startsWith('KRW-')) // Only KRW markets
      .map(m => this.parseMarketInfo(m))
  }

  // Trading
  async createOrder(order: OrderRequest): Promise<Order> {
    const params: Record<string, string | number> = {
      market: this.formatSymbol(order.symbol),
      side: order.side === 'buy' ? 'bid' : 'ask',
      ord_type: this.formatOrderType(order.type),
    }

    // Upbit has specific order parameter requirements
    if (order.type === 'limit') {
      params.price = order.price!.toString()
      params.volume = order.quantity.toString()
    } else if (order.type === 'market') {
      if (order.side === 'buy') {
        // For market buy, specify price (total KRW amount)
        params.price = (order.price! * order.quantity).toString()
      } else {
        // For market sell, specify volume
        params.volume = order.quantity.toString()
      }
    }

    const response = await this.request<UpbitOrder>(
      'POST',
      '/v1/orders',
      params,
      undefined,
      true
    )

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create order')
    }

    return this.parseOrder(response.data)
  }

  async cancelOrder(orderId: string, _symbol: string): Promise<boolean> {
    const response = await this.request(
      'DELETE',
      '/v1/order',
      { uuid: orderId },
      undefined,
      true
    )

    return response.success
  }

  async getOrder(orderId: string, _symbol: string): Promise<Order> {
    const response = await this.request<UpbitOrder>(
      'GET',
      '/v1/order',
      { uuid: orderId },
      undefined,
      true
    )

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get order')
    }

    return this.parseOrder(response.data)
  }

  async getOpenOrders(symbol?: string): Promise<Order[]> {
    const params: Record<string, string | number> = {
      state: 'wait',
    }
    if (symbol) params.market = this.formatSymbol(symbol)

    const response = await this.request<UpbitOrder[]>(
      'GET',
      '/v1/orders',
      params,
      undefined,
      true
    )

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get open orders')
    }

    return response.data.map(o => this.parseOrder(o))
  }

  async getOrderHistory(symbol?: string, limit: number = 100): Promise<Order[]> {
    const params: Record<string, string | number> = {
      state: 'done',
      limit,
    }
    if (symbol) params.market = this.formatSymbol(symbol)

    const response = await this.request<UpbitOrder[]>(
      'GET',
      '/v1/orders',
      params,
      undefined,
      true
    )

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get order history')
    }

    return response.data.map(o => this.parseOrder(o))
  }

  // Account
  async getBalance(): Promise<AccountBalance> {
    const response = await this.request<UpbitAccount[]>(
      'GET',
      '/v1/accounts',
      undefined,
      undefined,
      true
    )

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get balance')
    }

    const balances: Balance[] = response.data.map(a => ({
      currency: a.currency,
      available: parseFloat(a.balance),
      locked: parseFloat(a.locked),
      total: parseFloat(a.balance) + parseFloat(a.locked),
    }))

    // Calculate total value in KRW
    const krwBalance = balances.find(b => b.currency === 'KRW')
    let totalValue = krwBalance?.total || 0

    // Add estimated value of other assets (would need price data for accuracy)
    // For now, just return KRW balance

    return {
      exchangeId: this.id,
      balances,
      totalValue,
      updatedAt: new Date(),
    }
  }

  // WebSocket
  subscribe(subscriptions: WSSubscription[]): void {
    if (!this.wsUrl) return

    if (!this.ws) {
      this.ws = new WebSocket(this.wsUrl)
      this.ws.onmessage = (event) => this.handleWSMessage(event)
      this.ws.onclose = () => this.handleWSClose()
      this.ws.onerror = (error) => console.error('Upbit WS Error:', error)
    }

    subscriptions.forEach(sub => {
      const key = `${sub.type}-${sub.symbol || 'all'}`
      this.wsSubscriptions.set(key, sub)
    })

    if (this.ws.readyState === WebSocket.OPEN) {
      this.sendSubscribe(subscriptions)
    } else {
      this.ws.onopen = () => this.sendSubscribe(subscriptions)
    }
  }

  unsubscribe(subscriptions: WSSubscription[]): void {
    subscriptions.forEach(sub => {
      const key = `${sub.type}-${sub.symbol || 'all'}`
      this.wsSubscriptions.delete(key)
    })
    // Upbit requires reconnection to change subscriptions
    if (this.ws) {
      this.ws.close()
      this.ws = null
      if (this.wsSubscriptions.size > 0) {
        this.subscribe(Array.from(this.wsSubscriptions.values()))
      }
    }
  }

  private sendSubscribe(subscriptions: WSSubscription[]): void {
    if (!this.ws) return

    // Group by type
    const tickerSymbols: string[] = []
    const orderbookSymbols: string[] = []
    const tradeSymbols: string[] = []

    subscriptions.forEach(sub => {
      const market = sub.symbol ? this.formatSymbol(sub.symbol) : undefined
      switch (sub.type) {
        case 'ticker':
          if (market) tickerSymbols.push(market)
          break
        case 'orderbook':
          if (market) orderbookSymbols.push(market)
          break
        case 'trade':
          if (market) tradeSymbols.push(market)
          break
      }
    })

    const message: unknown[] = [{ ticket: uuidv4() }]

    if (tickerSymbols.length > 0) {
      message.push({ type: 'ticker', codes: tickerSymbols })
    }
    if (orderbookSymbols.length > 0) {
      message.push({ type: 'orderbook', codes: orderbookSymbols })
    }
    if (tradeSymbols.length > 0) {
      message.push({ type: 'trade', codes: tradeSymbols })
    }

    this.ws.send(JSON.stringify(message))
  }

  private async handleWSMessage(event: MessageEvent): Promise<void> {
    try {
      // Upbit sends binary data
      const text = event.data instanceof Blob
        ? await event.data.text()
        : event.data

      const data = JSON.parse(text)

      switch (data.type) {
        case 'ticker':
          this.emitMessage({
            type: 'ticker',
            symbol: this.parseSymbol(data.code),
            data: {
              lastPrice: data.trade_price,
              bidPrice: data.best_bid_price,
              askPrice: data.best_ask_price,
              high24h: data.high_price,
              low24h: data.low_price,
              volume24h: data.acc_trade_volume_24h,
              change24h: data.signed_change_price,
              changePercent24h: data.signed_change_rate * 100,
            },
            timestamp: data.timestamp,
          })
          break

        case 'orderbook':
          this.emitMessage({
            type: 'orderbook',
            symbol: this.parseSymbol(data.code),
            data: {
              bids: data.orderbook_units.map((u: { bid_price: number; bid_size: number }) => ({
                price: u.bid_price,
                quantity: u.bid_size,
              })),
              asks: data.orderbook_units.map((u: { ask_price: number; ask_size: number }) => ({
                price: u.ask_price,
                quantity: u.ask_size,
              })),
            },
            timestamp: data.timestamp,
          })
          break

        case 'trade':
          this.emitMessage({
            type: 'trade',
            symbol: this.parseSymbol(data.code),
            data: {
              price: data.trade_price,
              quantity: data.trade_volume,
              side: data.ask_bid === 'ASK' ? 'sell' : 'buy',
            },
            timestamp: data.timestamp,
          })
          break
      }
    } catch (error) {
      console.error('Failed to parse Upbit WebSocket message:', error)
    }
  }

  private handleWSClose(): void {
    setTimeout(() => {
      if (this.wsSubscriptions.size > 0) {
        this.ws = null
        this.subscribe(Array.from(this.wsSubscriptions.values()))
      }
    }, 5000)
  }

  // Parse helpers
  private parseTicker(data: UpbitTicker): Ticker {
    return {
      symbol: this.parseSymbol(data.market),
      lastPrice: data.trade_price,
      bidPrice: data.trade_price, // Upbit ticker doesn't include bid/ask
      askPrice: data.trade_price,
      high24h: data.high_price,
      low24h: data.low_price,
      volume24h: data.acc_trade_volume_24h,
      quoteVolume24h: data.acc_trade_price_24h,
      change24h: data.signed_change_price,
      changePercent24h: data.signed_change_rate * 100,
      timestamp: data.timestamp,
    }
  }

  private parseOrder(data: UpbitOrder): Order {
    return {
      id: data.uuid,
      symbol: this.parseSymbol(data.market),
      side: data.side === 'bid' ? 'buy' : 'sell' as OrderSide,
      type: this.parseOrderType(data.ord_type),
      status: this.parseOrderStatus(data.state),
      price: parseFloat(data.price || '0'),
      quantity: parseFloat(data.volume),
      filledQuantity: parseFloat(data.executed_volume),
      fee: parseFloat(data.paid_fee),
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.created_at),
    }
  }

  private parseMarketInfo(data: UpbitMarket): MarketInfo {
    const [quote, base] = data.market.split('-')

    return {
      symbol: this.parseSymbol(data.market),
      baseAsset: base,
      quoteAsset: quote,
      pricePrecision: 0, // Upbit uses integer prices for KRW
      quantityPrecision: 8,
      minNotional: 5000, // 5000 KRW minimum
      minQuantity: 0,
      maxQuantity: 0,
      tickSize: 1,
      stepSize: 0.00000001,
      status: data.market_warning === 'CAUTION' ? 'halted' : 'active',
    }
  }

  private parseOrderStatus(state: string): OrderStatus {
    const statusMap: Record<string, OrderStatus> = {
      wait: 'open',
      watch: 'open',
      done: 'filled',
      cancel: 'cancelled',
    }
    return statusMap[state] || 'open'
  }

  private parseOrderType(type: string): OrderType {
    const typeMap: Record<string, OrderType> = {
      limit: 'limit',
      price: 'market',
      market: 'market',
    }
    return typeMap[type] || 'limit'
  }

  private formatOrderType(type: OrderType): string {
    const typeMap: Record<OrderType, string> = {
      limit: 'limit',
      market: 'market',
      stop_limit: 'limit', // Upbit doesn't support stop orders directly
      stop_market: 'market',
    }
    return typeMap[type]
  }

  protected formatSymbol(symbol: string): string {
    // Convert BTC/KRW to KRW-BTC
    const [base, quote] = symbol.split('/')
    if (quote) {
      return `${quote}-${base}`
    }
    // Already in correct format
    return symbol.toUpperCase()
  }

  protected parseSymbol(exchangeSymbol: string): string {
    // Convert KRW-BTC to BTC/KRW
    const [quote, base] = exchangeSymbol.split('-')
    return `${base}/${quote}`
  }

  private getCandelEndpoint(interval: string): { endpoint: string; unit?: number } {
    switch (interval) {
      case '1m':
        return { endpoint: '/v1/candles/minutes/1' }
      case '5m':
        return { endpoint: '/v1/candles/minutes/5' }
      case '15m':
        return { endpoint: '/v1/candles/minutes/15' }
      case '30m':
        return { endpoint: '/v1/candles/minutes/30' }
      case '1h':
        return { endpoint: '/v1/candles/minutes/60' }
      case '4h':
        return { endpoint: '/v1/candles/minutes/240' }
      case '1d':
        return { endpoint: '/v1/candles/days' }
      case '1w':
        return { endpoint: '/v1/candles/weeks' }
      default:
        return { endpoint: '/v1/candles/minutes/1' }
    }
  }
}

// Export singleton instance
export const upbit = new UpbitExchange()
