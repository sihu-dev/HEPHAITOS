// ============================================
// Binance Broker Adapter
// UnifiedBroker 인터페이스 구현 (글로벌 암호화폐)
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
  OrderType as BrokerOrderType,
  Quote,
  QuoteCallback,
  OrderCallback,
} from '../types'
import type { OrderType as ExchangeOrderType } from '@/lib/exchange/types'
import { binance, binanceTestnet, BinanceExchange } from '@/lib/exchange/binance'

/**
 * Binance Broker Adapter
 * - 글로벌 최대 암호화폐 거래소
 * - Spot, Futures, Margin 지원
 * - Testnet(Paper Trading) 지원
 */
export class BinanceBroker implements UnifiedBroker {
  readonly brokerId: BrokerId = 'binance'
  readonly brokerName = 'Binance'

  private exchange: BinanceExchange
  private credentials: BrokerCredentials | null = null
  private connected = false
  private quoteCallbacks: Map<string, QuoteCallback[]> = new Map()
  private orderCallbacks: OrderCallback[] = []
  private orderSymbolMap: Map<string, string> = new Map() // orderId -> symbol mapping

  constructor(testnet: boolean = false) {
    this.exchange = testnet ? binanceTestnet : binance
  }

  // ============================================
  // Connection Management
  // ============================================

  async connect(credentials: BrokerCredentials): Promise<ConnectionResult> {
    try {
      this.credentials = credentials

      // Set credentials on exchange
      this.exchange.setCredentials({
        apiKey: credentials.apiKey,
        secretKey: credentials.apiSecret,
      })

      // Validate credentials
      const isValid = await this.exchange.validateCredentials()

      if (!isValid) {
        return {
          success: false,
          message: 'Invalid API credentials',
        }
      }

      this.connected = true

      // Get initial balance
      const balance = await this.getBalance()

      return {
        success: true,
        message: 'Connected to Binance',
        balance,
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
      }
    }
  }

  async disconnect(): Promise<void> {
    this.exchange.disconnect()
    this.connected = false
    this.credentials = null
    this.quoteCallbacks.clear()
    this.orderCallbacks = []
  }

  isConnected(): boolean {
    return this.connected
  }

  async refreshToken(): Promise<boolean> {
    // Binance API keys don't expire
    return this.connected
  }

  // ============================================
  // Account Information
  // ============================================

  async getBalance(): Promise<Balance> {
    if (!this.connected) throw new Error('Not connected')

    const accountBalance = await this.exchange.getBalance()
    const usdtBalance = accountBalance.balances.find(b => b.currency === 'USDT')

    return {
      totalAssets: accountBalance.totalValue,
      cash: usdtBalance?.available || 0,
      stocksValue: accountBalance.totalValue - (usdtBalance?.available || 0),
      totalProfit: 0, // Would need historical data
      profitRate: 0,
      buyingPower: usdtBalance?.available || 0,
      currency: 'USDT',
    }
  }

  async getHoldings(): Promise<Holding[]> {
    if (!this.connected) throw new Error('Not connected')

    const accountBalance = await this.exchange.getBalance()

    return accountBalance.balances
      .filter(b => b.currency !== 'USDT' && b.total > 0)
      .map(b => ({
        stockCode: `${b.currency}/USDT`,
        stockName: b.currency,
        market: 'CRYPTO' as const,
        quantity: b.total,
        avgPrice: 0, // Would need trade history
        currentPrice: 0, // Would need ticker data
        profit: 0,
        profitRate: 0,
        value: b.total, // Would need to multiply by current price
      }))
  }

  async getOrders(status?: OrderStatus): Promise<Order[]> {
    if (!this.connected) throw new Error('Not connected')

    const openOrders = await this.exchange.getOpenOrders()

    const orders = openOrders.map(o => {
      // Store symbol mapping for cancel
      this.orderSymbolMap.set(o.id, o.symbol)

      return {
        orderId: o.id,
        stockCode: o.symbol,
        stockName: o.symbol.replace('/USDT', ''),
        side: o.side,
        type: this.mapExchangeOrderType(o.type),
        quantity: o.quantity,
        filledQuantity: o.filledQuantity || 0,
        price: o.price,
        avgFilledPrice: o.avgFillPrice || o.price,
        status: this.mapExchangeOrderStatus(o.status),
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
      }
    })

    if (status) {
      return orders.filter(o => o.status === status)
    }
    return orders
  }

  private mapExchangeOrderType(type: ExchangeOrderType): BrokerOrderType {
    switch (type) {
      case 'market': return 'market'
      case 'limit': return 'limit'
      case 'stop_limit': return 'stop_limit'
      case 'stop_market': return 'stop'
      default: return 'market'
    }
  }

  private mapBrokerOrderType(type: BrokerOrderType): ExchangeOrderType {
    switch (type) {
      case 'market': return 'market'
      case 'limit': return 'limit'
      case 'stop_limit': return 'stop_limit'
      case 'stop': return 'stop_market'
      default: return 'market'
    }
  }

  private mapExchangeOrderStatus(status: string): OrderStatus {
    switch (status) {
      case 'open': return 'pending'
      case 'filled': return 'filled'
      case 'partially_filled': return 'partial'
      case 'cancelled': return 'cancelled'
      case 'expired': return 'cancelled'
      case 'rejected': return 'rejected'
      default: return 'pending'
    }
  }

  async getOrderHistory(days?: number): Promise<Order[]> {
    if (!this.connected) throw new Error('Not connected')

    const limit = days ? days * 10 : 100 // Rough estimate
    const orders = await this.exchange.getOrderHistory(undefined, limit)

    return orders.map(o => ({
      orderId: o.id,
      stockCode: o.symbol,
      stockName: o.symbol.replace('/USDT', ''),
      side: o.side,
      type: this.mapExchangeOrderType(o.type),
      quantity: o.quantity,
      filledQuantity: o.filledQuantity || 0,
      price: o.price,
      avgFilledPrice: o.avgFillPrice || o.price,
      status: this.mapExchangeOrderStatus(o.status),
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    }))
  }

  // ============================================
  // Order Management
  // ============================================

  async submitOrder(request: OrderRequest): Promise<OrderResult> {
    if (!this.connected) throw new Error('Not connected')

    try {
      const order = await this.exchange.createOrder({
        symbol: request.stockCode,
        side: request.side,
        type: this.mapBrokerOrderType(request.type),
        quantity: request.quantity,
        price: request.price,
        stopPrice: request.stopPrice,
      })

      // Store symbol mapping
      this.orderSymbolMap.set(order.id, request.stockCode)

      return {
        success: true,
        orderId: order.id,
        message: `Order placed: ${order.id}`,
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Order failed',
      }
    }
  }

  async cancelOrder(orderId: string): Promise<OrderResult> {
    if (!this.connected) throw new Error('Not connected')

    try {
      // Get symbol from mapping or fetch orders
      let symbol = this.orderSymbolMap.get(orderId)
      if (!symbol) {
        const orders = await this.getOrders()
        const order = orders.find(o => o.orderId === orderId)
        symbol = order?.stockCode
      }

      if (!symbol) {
        return {
          success: false,
          orderId,
          message: 'Symbol not found for order',
        }
      }

      const success = await this.exchange.cancelOrder(orderId, symbol)

      return {
        success,
        orderId,
        message: success ? 'Order cancelled' : 'Cancel failed',
      }
    } catch (error) {
      return {
        success: false,
        orderId,
        message: error instanceof Error ? error.message : 'Cancel failed',
      }
    }
  }

  async modifyOrder(
    orderId: string,
    newPrice: number,
    newQuantity?: number
  ): Promise<OrderResult> {
    // Binance doesn't support order modification, cancel and re-create
    const orders = await this.getOrders()
    const existingOrder = orders.find(o => o.orderId === orderId)

    if (!existingOrder) {
      return {
        success: false,
        message: 'Order not found',
      }
    }

    const cancelResult = await this.cancelOrder(orderId)
    if (!cancelResult.success) {
      return cancelResult
    }

    return this.submitOrder({
      stockCode: existingOrder.stockCode,
      side: existingOrder.side,
      type: existingOrder.type,
      quantity: newQuantity || existingOrder.quantity,
      price: newPrice,
    })
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
    if (!this.connected) throw new Error('Not connected')

    const openOrders = await this.getOrders()
    const results: OrderResult[] = []

    for (const order of openOrders) {
      const result = await this.cancelOrder(order.orderId)
      results.push(result)
    }

    return results
  }

  async closeAllPositions(): Promise<OrderResult[]> {
    if (!this.connected) throw new Error('Not connected')

    const holdings = await this.getHoldings()
    const results: OrderResult[] = []

    for (const holding of holdings) {
      if (holding.quantity > 0) {
        const result = await this.sell(holding.stockCode, holding.quantity)
        results.push(result)
      }
    }

    return results
  }

  // ============================================
  // Real-time Data
  // ============================================

  subscribeQuote(stockCode: string, callback: QuoteCallback): () => void {
    const callbacks = this.quoteCallbacks.get(stockCode) || []
    callbacks.push(callback)
    this.quoteCallbacks.set(stockCode, callbacks)

    // Subscribe to exchange WebSocket
    this.exchange.subscribe([{ type: 'ticker', symbol: stockCode }])
    this.exchange.onMessage((msg) => {
      if (msg.type === 'ticker' && msg.symbol === stockCode) {
        const data = msg.data as {
          lastPrice: number
          bidPrice: number
          askPrice: number
          highPrice: number
          lowPrice: number
          openPrice: number
          volume24h: number
        }
        const quote: Quote = {
          stockCode: msg.symbol,
          stockName: msg.symbol.replace('/USDT', ''),
          currentPrice: data.lastPrice,
          change: data.lastPrice - data.openPrice,
          changeRate: ((data.lastPrice - data.openPrice) / data.openPrice) * 100,
          high: data.highPrice,
          low: data.lowPrice,
          open: data.openPrice,
          volume: data.volume24h,
          timestamp: new Date(msg.timestamp),
        }
        callbacks.forEach(cb => cb(quote))
      }
    })

    return () => {
      const remaining = this.quoteCallbacks.get(stockCode)?.filter(cb => cb !== callback) || []
      if (remaining.length === 0) {
        this.quoteCallbacks.delete(stockCode)
        this.exchange.unsubscribe([{ type: 'ticker', symbol: stockCode }])
      } else {
        this.quoteCallbacks.set(stockCode, remaining)
      }
    }
  }

  subscribeOrders(callback: OrderCallback): () => void {
    this.orderCallbacks.push(callback)

    return () => {
      this.orderCallbacks = this.orderCallbacks.filter(cb => cb !== callback)
    }
  }

  // ============================================
  // Market Data
  // ============================================

  async getQuote(stockCode: string): Promise<Quote> {
    const ticker = await this.exchange.getTicker(stockCode)

    return {
      stockCode: ticker.symbol,
      stockName: ticker.symbol.replace('/USDT', ''),
      currentPrice: ticker.lastPrice,
      change: ticker.change24h,
      changeRate: ticker.changePercent24h,
      high: ticker.high24h,
      low: ticker.low24h,
      open: ticker.lastPrice - ticker.change24h,
      volume: ticker.volume24h,
      timestamp: new Date(ticker.timestamp),
    }
  }

  async searchStock(keyword: string): Promise<Array<{ code: string; name: string; market: string }>> {
    const markets = await this.exchange.getMarkets()

    return markets
      .filter(m =>
        m.symbol.toLowerCase().includes(keyword.toLowerCase()) ||
        m.baseAsset.toLowerCase().includes(keyword.toLowerCase())
      )
      .slice(0, 20)
      .map(m => ({
        code: m.symbol,
        name: `${m.baseAsset}/${m.quoteAsset}`,
        market: 'CRYPTO',
      }))
  }
}

// ============================================
// Factory Functions
// ============================================

export function createBinanceBroker(testnet: boolean = false): BinanceBroker {
  return new BinanceBroker(testnet)
}
