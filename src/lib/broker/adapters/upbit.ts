// ============================================
// Upbit Broker Adapter
// UnifiedBroker 인터페이스 구현 (한국 암호화폐)
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
import { upbit, UpbitExchange } from '@/lib/exchange/upbit'

/**
 * Upbit Broker Adapter
 * - 한국 최대 암호화폐 거래소
 * - KRW 마켓 지원
 * - 원화 직접 거래 가능
 */
export class UpbitBroker implements UnifiedBroker {
  readonly brokerId: BrokerId = 'upbit'
  readonly brokerName = 'Upbit (업비트)'

  private exchange: UpbitExchange = upbit
  private credentials: BrokerCredentials | null = null
  private connected = false
  private quoteCallbacks: Map<string, QuoteCallback[]> = new Map()
  private orderCallbacks: OrderCallback[] = []
  private orderSymbolMap: Map<string, string> = new Map() // orderId -> symbol mapping

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
          message: '유효하지 않은 API 키입니다',
        }
      }

      this.connected = true

      // Get initial balance
      const balance = await this.getBalance()

      return {
        success: true,
        message: '업비트에 연결되었습니다',
        balance,
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : '연결 실패',
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
    // Upbit uses JWT, credentials don't expire
    return this.connected
  }

  // ============================================
  // Account Information
  // ============================================

  async getBalance(): Promise<Balance> {
    if (!this.connected) throw new Error('연결되지 않았습니다')

    const accountBalance = await this.exchange.getBalance()
    const krwBalance = accountBalance.balances.find(b => b.currency === 'KRW')

    return {
      totalAssets: accountBalance.totalValue,
      cash: krwBalance?.available || 0,
      stocksValue: accountBalance.totalValue - (krwBalance?.available || 0),
      totalProfit: 0,
      profitRate: 0,
      buyingPower: krwBalance?.available || 0,
      currency: 'KRW',
    }
  }

  async getHoldings(): Promise<Holding[]> {
    if (!this.connected) throw new Error('연결되지 않았습니다')

    const accountBalance = await this.exchange.getBalance()

    return accountBalance.balances
      .filter(b => b.currency !== 'KRW' && b.total > 0)
      .map(b => ({
        stockCode: `KRW-${b.currency}`,
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
    if (!this.connected) throw new Error('연결되지 않았습니다')

    const openOrders = await this.exchange.getOpenOrders()

    const orders = openOrders.map(o => {
      // Store symbol mapping for cancel
      this.orderSymbolMap.set(o.id, o.symbol)

      return {
        orderId: o.id,
        stockCode: o.symbol,
        stockName: o.symbol.replace('KRW-', ''),
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
    if (!this.connected) throw new Error('연결되지 않았습니다')

    const limit = days ? days * 10 : 100
    const orders = await this.exchange.getOrderHistory(undefined, limit)

    return orders.map(o => ({
      orderId: o.id,
      stockCode: o.symbol,
      stockName: o.symbol.replace('KRW-', ''),
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
    if (!this.connected) throw new Error('연결되지 않았습니다')

    try {
      const order = await this.exchange.createOrder({
        symbol: request.stockCode,
        side: request.side,
        type: this.mapBrokerOrderType(request.type),
        quantity: request.quantity,
        price: request.price,
      })

      // Store symbol mapping
      this.orderSymbolMap.set(order.id, request.stockCode)

      return {
        success: true,
        orderId: order.id,
        message: `주문 완료: ${order.id}`,
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : '주문 실패',
      }
    }
  }

  async cancelOrder(orderId: string): Promise<OrderResult> {
    if (!this.connected) throw new Error('연결되지 않았습니다')

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
        message: success ? '주문이 취소되었습니다' : '취소 실패',
      }
    } catch (error) {
      return {
        success: false,
        orderId,
        message: error instanceof Error ? error.message : '취소 실패',
      }
    }
  }

  async modifyOrder(
    orderId: string,
    newPrice: number,
    newQuantity?: number
  ): Promise<OrderResult> {
    // Upbit doesn't support order modification, cancel and re-create
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
    if (!this.connected) throw new Error('연결되지 않았습니다')

    const openOrders = await this.getOrders()
    const results: OrderResult[] = []

    for (const order of openOrders) {
      const result = await this.cancelOrder(order.orderId)
      results.push(result)
    }

    return results
  }

  async closeAllPositions(): Promise<OrderResult[]> {
    if (!this.connected) throw new Error('연결되지 않았습니다')

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
          highPrice?: number
          lowPrice?: number
          openPrice?: number
          volume24h: number
          priceChange24h?: number
        }
        const quote: Quote = {
          stockCode: msg.symbol,
          stockName: msg.symbol.replace('KRW-', ''),
          currentPrice: data.lastPrice,
          change: data.priceChange24h || 0,
          changeRate: data.openPrice ? ((data.lastPrice - data.openPrice) / data.openPrice) * 100 : 0,
          high: data.highPrice || data.lastPrice,
          low: data.lowPrice || data.lastPrice,
          open: data.openPrice || data.lastPrice,
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
      stockName: ticker.symbol.replace('KRW-', ''),
      currentPrice: ticker.lastPrice,
      change: ticker.change24h || 0,
      changeRate: ticker.changePercent24h || 0,
      high: ticker.high24h || ticker.lastPrice,
      low: ticker.low24h || ticker.lastPrice,
      open: ticker.lastPrice - (ticker.change24h || 0),
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

export function createUpbitBroker(): UpbitBroker {
  return new UpbitBroker()
}
