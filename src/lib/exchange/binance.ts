// ============================================
// Binance Exchange Implementation
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
import { safeLogger } from '@/lib/utils/safe-logger';

// Binance API Response Types
interface BinanceTicker {
  symbol: string
  lastPrice: string
  bidPrice: string
  askPrice: string
  highPrice: string
  lowPrice: string
  volume: string
  quoteVolume: string
  priceChange: string
  priceChangePercent: string
  closeTime: number
}

interface BinanceOrderBook {
  lastUpdateId: number
  bids: [string, string][]
  asks: [string, string][]
}

interface BinanceOrder {
  orderId: number
  clientOrderId: string
  symbol: string
  side: 'BUY' | 'SELL'
  type: string
  status: string
  price: string
  origQty: string
  executedQty: string
  cummulativeQuoteQty: string
  time: number
  updateTime: number
}

interface BinanceBalance {
  asset: string
  free: string
  locked: string
}

interface BinanceKline {
  0: number    // Open time
  1: string    // Open
  2: string    // High
  3: string    // Low
  4: string    // Close
  5: string    // Volume
  6: number    // Close time
  7: string    // Quote asset volume
  8: number    // Number of trades
  9: string    // Taker buy base asset volume
  10: string   // Taker buy quote asset volume
  11: string   // Ignore
}

interface BinanceSymbolInfo {
  symbol: string
  status: string
  baseAsset: string
  quoteAsset: string
  baseAssetPrecision: number
  quoteAssetPrecision: number
  filters: BinanceFilter[]
}

interface BinanceFilter {
  filterType: string
  minPrice?: string
  maxPrice?: string
  tickSize?: string
  minQty?: string
  maxQty?: string
  stepSize?: string
  minNotional?: string
}

export class BinanceExchange extends BaseExchange {
  readonly id: ExchangeId = 'binance'
  readonly name = 'Binance'
  private wsSubscriptions: Map<string, WSSubscription> = new Map()

  constructor(testnet: boolean = false) {
    super({
      id: 'binance',
      name: 'Binance',
      baseUrl: 'https://api.binance.com',
      wsUrl: 'wss://stream.binance.com:9443/ws',
      testnet: {
        baseUrl: 'https://testnet.binance.vision',
        wsUrl: 'wss://testnet.binance.vision/ws',
      },
      rateLimit: {
        requestsPerSecond: 10,
        requestsPerMinute: 1200,
      },
      features: {
        spot: true,
        futures: true,
        margin: true,
        websocket: true,
        sandbox: true,
      },
    }, testnet)
  }

  // Authentication
  async validateCredentials(): Promise<boolean> {
    if (!this.credentials) return false

    const response = await this.request<{ canTrade: boolean }>(
      'GET',
      '/api/v3/account',
      { timestamp: Date.now() },
      undefined,
      true
    )

    return response.success
  }

  // Add Binance auth headers
  protected addAuthHeaders(
    headers: Record<string, string>,
    _method: string,
    _endpoint: string,
    params?: Record<string, string | number | boolean>,
  ): void {
    if (!this.credentials) return

    headers['X-MBX-APIKEY'] = this.credentials.apiKey

    // Add signature to params
    const queryString = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        queryString.append(key, String(value))
      })
    }

    const signature = createHmac('sha256', this.credentials.secretKey)
      .update(queryString.toString())
      .digest('hex')

    queryString.append('signature', signature)
  }

  // Market Data
  async getTicker(symbol: string): Promise<Ticker> {
    const response = await this.request<BinanceTicker>(
      'GET',
      '/api/v3/ticker/24hr',
      { symbol: this.formatSymbol(symbol) }
    )

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get ticker')
    }

    return this.parseTicker(response.data)
  }

  async getTickers(symbols?: string[]): Promise<Ticker[]> {
    const params: Record<string, string> = {}
    if (symbols && symbols.length > 0) {
      params.symbols = JSON.stringify(symbols.map(s => this.formatSymbol(s)))
    }

    const response = await this.request<BinanceTicker[]>(
      'GET',
      '/api/v3/ticker/24hr',
      params
    )

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get tickers')
    }

    return response.data.map(t => this.parseTicker(t))
  }

  async getOrderBook(symbol: string, limit: number = 100): Promise<OrderBook> {
    const response = await this.request<BinanceOrderBook>(
      'GET',
      '/api/v3/depth',
      { symbol: this.formatSymbol(symbol), limit }
    )

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get order book')
    }

    return {
      symbol,
      bids: response.data.bids.map(([price, quantity]) => ({
        price: parseFloat(price),
        quantity: parseFloat(quantity),
      })),
      asks: response.data.asks.map(([price, quantity]) => ({
        price: parseFloat(price),
        quantity: parseFloat(quantity),
      })),
      timestamp: Date.now(),
    }
  }

  async getOHLCV(symbol: string, interval: string, limit: number = 500): Promise<OHLCV[]> {
    const response = await this.request<BinanceKline[]>(
      'GET',
      '/api/v3/klines',
      {
        symbol: this.formatSymbol(symbol),
        interval: this.formatInterval(interval),
        limit,
      }
    )

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get OHLCV')
    }

    return response.data.map(k => ({
      timestamp: k[0],
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
    }))
  }

  async getMarkets(): Promise<MarketInfo[]> {
    const response = await this.request<{ symbols: BinanceSymbolInfo[] }>(
      'GET',
      '/api/v3/exchangeInfo'
    )

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get markets')
    }

    return response.data.symbols.map(s => this.parseMarketInfo(s))
  }

  // Trading
  async createOrder(order: OrderRequest): Promise<Order> {
    const params: Record<string, string | number> = {
      symbol: this.formatSymbol(order.symbol),
      side: order.side.toUpperCase(),
      type: this.formatOrderType(order.type),
      quantity: order.quantity,
      timestamp: Date.now(),
    }

    if (order.price) params.price = order.price
    if (order.stopPrice) params.stopPrice = order.stopPrice
    if (order.timeInForce) params.timeInForce = order.timeInForce
    if (order.clientOrderId) params.newClientOrderId = order.clientOrderId

    const response = await this.request<BinanceOrder>(
      'POST',
      '/api/v3/order',
      params,
      undefined,
      true
    )

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create order')
    }

    return this.parseOrder(response.data)
  }

  async cancelOrder(orderId: string, symbol: string): Promise<boolean> {
    const response = await this.request(
      'DELETE',
      '/api/v3/order',
      {
        symbol: this.formatSymbol(symbol),
        orderId: parseInt(orderId, 10),
        timestamp: Date.now(),
      },
      undefined,
      true
    )

    return response.success
  }

  async getOrder(orderId: string, symbol: string): Promise<Order> {
    const response = await this.request<BinanceOrder>(
      'GET',
      '/api/v3/order',
      {
        symbol: this.formatSymbol(symbol),
        orderId: parseInt(orderId, 10),
        timestamp: Date.now(),
      },
      undefined,
      true
    )

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get order')
    }

    return this.parseOrder(response.data)
  }

  async getOpenOrders(symbol?: string): Promise<Order[]> {
    const params: Record<string, string | number> = { timestamp: Date.now() }
    if (symbol) params.symbol = this.formatSymbol(symbol)

    const response = await this.request<BinanceOrder[]>(
      'GET',
      '/api/v3/openOrders',
      params,
      undefined,
      true
    )

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get open orders')
    }

    return response.data.map(o => this.parseOrder(o))
  }

  async getOrderHistory(symbol?: string, limit: number = 500): Promise<Order[]> {
    const params: Record<string, string | number> = {
      timestamp: Date.now(),
      limit,
    }
    if (symbol) params.symbol = this.formatSymbol(symbol)

    const response = await this.request<BinanceOrder[]>(
      'GET',
      '/api/v3/allOrders',
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
    const response = await this.request<{ balances: BinanceBalance[] }>(
      'GET',
      '/api/v3/account',
      { timestamp: Date.now() },
      undefined,
      true
    )

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get balance')
    }

    const balances: Balance[] = response.data.balances
      .filter(b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
      .map(b => ({
        currency: b.asset,
        available: parseFloat(b.free),
        locked: parseFloat(b.locked),
        total: parseFloat(b.free) + parseFloat(b.locked),
      }))

    // Calculate total value (simplified - would need price data for accurate calculation)
    const totalValue = balances.reduce((sum, b) => sum + b.total, 0)

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
    }

    subscriptions.forEach(sub => {
      const stream = this.getStreamName(sub)
      this.wsSubscriptions.set(stream, sub)
    })

    // Subscribe to streams
    if (this.ws.readyState === WebSocket.OPEN) {
      this.sendSubscribe(subscriptions)
    } else {
      this.ws.onopen = () => this.sendSubscribe(subscriptions)
    }
  }

  unsubscribe(subscriptions: WSSubscription[]): void {
    if (!this.ws) return

    const streams = subscriptions.map(sub => this.getStreamName(sub))
    streams.forEach(stream => this.wsSubscriptions.delete(stream))

    this.ws.send(JSON.stringify({
      method: 'UNSUBSCRIBE',
      params: streams,
      id: Date.now(),
    }))
  }

  private sendSubscribe(subscriptions: WSSubscription[]): void {
    if (!this.ws) return

    const streams = subscriptions.map(sub => this.getStreamName(sub))

    this.ws.send(JSON.stringify({
      method: 'SUBSCRIBE',
      params: streams,
      id: Date.now(),
    }))
  }

  private getStreamName(sub: WSSubscription): string {
    const symbol = sub.symbol?.toLowerCase() || ''
    switch (sub.type) {
      case 'ticker':
        return `${symbol}@ticker`
      case 'orderbook':
        return `${symbol}@depth@100ms`
      case 'trade':
        return `${symbol}@trade`
      case 'kline':
        return `${symbol}@kline_${sub.interval || '1m'}`
      default:
        return symbol
    }
  }

  private handleWSMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data)

      // Handle different stream types
      if (data.e === '24hrTicker') {
        this.emitMessage({
          type: 'ticker',
          symbol: this.parseSymbol(data.s),
          data: this.parseWSTicker(data),
          timestamp: data.E,
        })
      } else if (data.e === 'depthUpdate') {
        this.emitMessage({
          type: 'orderbook',
          symbol: this.parseSymbol(data.s),
          data: {
            bids: data.b.map(([p, q]: [string, string]) => ({
              price: parseFloat(p),
              quantity: parseFloat(q),
            })),
            asks: data.a.map(([p, q]: [string, string]) => ({
              price: parseFloat(p),
              quantity: parseFloat(q),
            })),
          },
          timestamp: data.E,
        })
      } else if (data.e === 'trade') {
        this.emitMessage({
          type: 'trade',
          symbol: this.parseSymbol(data.s),
          data: {
            price: parseFloat(data.p),
            quantity: parseFloat(data.q),
            side: data.m ? 'sell' : 'buy',
          },
          timestamp: data.E,
        })
      } else if (data.e === 'kline') {
        const k = data.k
        this.emitMessage({
          type: 'kline',
          symbol: this.parseSymbol(data.s),
          data: {
            timestamp: k.t,
            open: parseFloat(k.o),
            high: parseFloat(k.h),
            low: parseFloat(k.l),
            close: parseFloat(k.c),
            volume: parseFloat(k.v),
          },
          timestamp: data.E,
        })
      }
    } catch (error) {
      safeLogger.error('Failed to parse WebSocket message:', error)
    }
  }

  private handleWSClose(): void {
    // Reconnect after 5 seconds
    setTimeout(() => {
      if (this.wsSubscriptions.size > 0) {
        this.ws = null
        this.subscribe(Array.from(this.wsSubscriptions.values()))
      }
    }, 5000)
  }

  // Parse helpers
  private parseTicker(data: BinanceTicker): Ticker {
    return {
      symbol: this.parseSymbol(data.symbol),
      lastPrice: parseFloat(data.lastPrice),
      bidPrice: parseFloat(data.bidPrice),
      askPrice: parseFloat(data.askPrice),
      high24h: parseFloat(data.highPrice),
      low24h: parseFloat(data.lowPrice),
      volume24h: parseFloat(data.volume),
      quoteVolume24h: parseFloat(data.quoteVolume),
      change24h: parseFloat(data.priceChange),
      changePercent24h: parseFloat(data.priceChangePercent),
      timestamp: data.closeTime,
    }
  }

  private parseWSTicker(data: Record<string, string>): Ticker {
    return {
      symbol: this.parseSymbol(data.s),
      lastPrice: parseFloat(data.c),
      bidPrice: parseFloat(data.b),
      askPrice: parseFloat(data.a),
      high24h: parseFloat(data.h),
      low24h: parseFloat(data.l),
      volume24h: parseFloat(data.v),
      quoteVolume24h: parseFloat(data.q),
      change24h: parseFloat(data.p),
      changePercent24h: parseFloat(data.P),
      timestamp: parseInt(data.E, 10),
    }
  }

  private parseOrder(data: BinanceOrder): Order {
    return {
      id: data.orderId.toString(),
      clientOrderId: data.clientOrderId,
      symbol: this.parseSymbol(data.symbol),
      side: data.side.toLowerCase() as OrderSide,
      type: this.parseOrderType(data.type),
      status: this.parseOrderStatus(data.status),
      price: parseFloat(data.price),
      quantity: parseFloat(data.origQty),
      filledQuantity: parseFloat(data.executedQty),
      avgFillPrice: parseFloat(data.cummulativeQuoteQty) / parseFloat(data.executedQty) || undefined,
      createdAt: new Date(data.time),
      updatedAt: new Date(data.updateTime),
    }
  }

  private parseMarketInfo(data: BinanceSymbolInfo): MarketInfo {
    const priceFilter = data.filters.find(f => f.filterType === 'PRICE_FILTER')
    const lotSize = data.filters.find(f => f.filterType === 'LOT_SIZE')
    const notional = data.filters.find(f => f.filterType === 'MIN_NOTIONAL' || f.filterType === 'NOTIONAL')

    return {
      symbol: this.parseSymbol(data.symbol),
      baseAsset: data.baseAsset,
      quoteAsset: data.quoteAsset,
      pricePrecision: data.baseAssetPrecision,
      quantityPrecision: data.quoteAssetPrecision,
      minNotional: parseFloat(notional?.minNotional || '0'),
      minQuantity: parseFloat(lotSize?.minQty || '0'),
      maxQuantity: parseFloat(lotSize?.maxQty || '0'),
      tickSize: parseFloat(priceFilter?.tickSize || '0'),
      stepSize: parseFloat(lotSize?.stepSize || '0'),
      status: data.status === 'TRADING' ? 'active' : 'inactive',
    }
  }

  private parseOrderStatus(status: string): OrderStatus {
    const statusMap: Record<string, OrderStatus> = {
      NEW: 'open',
      PARTIALLY_FILLED: 'partially_filled',
      FILLED: 'filled',
      CANCELED: 'cancelled',
      REJECTED: 'rejected',
      EXPIRED: 'expired',
    }
    return statusMap[status] || 'open'
  }

  private parseOrderType(type: string): OrderType {
    const typeMap: Record<string, OrderType> = {
      MARKET: 'market',
      LIMIT: 'limit',
      STOP_LOSS_LIMIT: 'stop_limit',
      STOP_LOSS: 'stop_market',
    }
    return typeMap[type] || 'limit'
  }

  private formatOrderType(type: OrderType): string {
    const typeMap: Record<OrderType, string> = {
      market: 'MARKET',
      limit: 'LIMIT',
      stop_limit: 'STOP_LOSS_LIMIT',
      stop_market: 'STOP_LOSS',
    }
    return typeMap[type]
  }

  protected formatSymbol(symbol: string): string {
    // Convert BTC/USDT to BTCUSDT
    return symbol.replace('/', '').toUpperCase()
  }

  protected parseSymbol(exchangeSymbol: string): string {
    // Convert BTCUSDT to BTC/USDT (simplified - would need market info for accurate parsing)
    const stablecoins = ['USDT', 'USDC', 'BUSD', 'TUSD', 'USD']
    for (const stable of stablecoins) {
      if (exchangeSymbol.endsWith(stable)) {
        return `${exchangeSymbol.slice(0, -stable.length)}/${stable}`
      }
    }
    return exchangeSymbol
  }

  private formatInterval(interval: string): string {
    // Convert our interval format to Binance format
    const intervalMap: Record<string, string> = {
      '1m': '1m',
      '5m': '5m',
      '15m': '15m',
      '30m': '30m',
      '1h': '1h',
      '4h': '4h',
      '1d': '1d',
      '1w': '1w',
    }
    return intervalMap[interval] || interval
  }
}

// Export singleton instance
export const binance = new BinanceExchange()
export const binanceTestnet = new BinanceExchange(true)
