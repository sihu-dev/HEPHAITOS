// ============================================
// Exchange API Types
// ============================================

import type { ExchangeId, OHLCV, MarketData, Trade } from '@/types'

// Exchange Common Types
export interface ExchangeCredentials {
  apiKey: string
  secretKey: string
  passphrase?: string // For exchanges that require it (Coinbase)
}

export interface ExchangeConfig {
  id: ExchangeId
  name: string
  baseUrl: string
  wsUrl?: string
  testnet?: {
    baseUrl: string
    wsUrl?: string
  }
  rateLimit: {
    requestsPerSecond: number
    requestsPerMinute: number
  }
  features: ExchangeFeatures
}

export interface ExchangeFeatures {
  spot: boolean
  futures: boolean
  margin: boolean
  websocket: boolean
  sandbox: boolean
}

// Order Types
export type OrderType = 'market' | 'limit' | 'stop_limit' | 'stop_market'
export type OrderSide = 'buy' | 'sell'
export type OrderStatus = 'open' | 'filled' | 'partially_filled' | 'cancelled' | 'expired' | 'rejected'
export type TimeInForce = 'GTC' | 'IOC' | 'FOK' | 'GTX'

export interface OrderRequest {
  symbol: string
  side: OrderSide
  type: OrderType
  quantity: number
  price?: number
  stopPrice?: number
  timeInForce?: TimeInForce
  clientOrderId?: string
}

export interface Order {
  id: string
  clientOrderId?: string
  symbol: string
  side: OrderSide
  type: OrderType
  status: OrderStatus
  price: number
  quantity: number
  filledQuantity: number
  avgFillPrice?: number
  fee?: number
  feeCurrency?: string
  createdAt: Date
  updatedAt: Date
}

// Balance Types
export interface Balance {
  currency: string
  available: number
  locked: number
  total: number
}

export interface AccountBalance {
  exchangeId: ExchangeId
  balances: Balance[]
  totalValue: number // in USD/KRW
  updatedAt: Date
}

// Ticker Types
export interface Ticker {
  symbol: string
  lastPrice: number
  bidPrice: number
  askPrice: number
  high24h: number
  low24h: number
  volume24h: number
  quoteVolume24h: number
  change24h: number
  changePercent24h: number
  timestamp: number
}

// Order Book Types
export interface OrderBookEntry {
  price: number
  quantity: number
}

export interface OrderBook {
  symbol: string
  bids: OrderBookEntry[]
  asks: OrderBookEntry[]
  timestamp: number
}

// WebSocket Types
export type WSEventType = 'ticker' | 'orderbook' | 'trade' | 'kline' | 'order' | 'balance'

export interface WSMessage {
  type: WSEventType
  symbol?: string
  data: unknown
  timestamp: number
}

export interface WSSubscription {
  type: WSEventType
  symbol?: string
  interval?: string
}

// Exchange Interface
export interface IExchange {
  readonly id: ExchangeId
  readonly name: string

  // Authentication
  setCredentials(credentials: ExchangeCredentials): void
  validateCredentials(): Promise<boolean>

  // Market Data
  getTicker(symbol: string): Promise<Ticker>
  getTickers(symbols?: string[]): Promise<Ticker[]>
  getOrderBook(symbol: string, limit?: number): Promise<OrderBook>
  getOHLCV(symbol: string, interval: string, limit?: number): Promise<OHLCV[]>
  getMarkets(): Promise<MarketInfo[]>

  // Trading
  createOrder(order: OrderRequest): Promise<Order>
  cancelOrder(orderId: string, symbol: string): Promise<boolean>
  getOrder(orderId: string, symbol: string): Promise<Order>
  getOpenOrders(symbol?: string): Promise<Order[]>
  getOrderHistory(symbol?: string, limit?: number): Promise<Order[]>

  // Account
  getBalance(): Promise<AccountBalance>

  // WebSocket
  subscribe(subscriptions: WSSubscription[]): void
  unsubscribe(subscriptions: WSSubscription[]): void
  onMessage(callback: (message: WSMessage) => void): void
  disconnect(): void
}

// Market Info
export interface MarketInfo {
  symbol: string
  baseAsset: string
  quoteAsset: string
  pricePrecision: number
  quantityPrecision: number
  minNotional: number
  minQuantity: number
  maxQuantity: number
  tickSize: number
  stepSize: number
  status: 'active' | 'inactive' | 'halted'
}

// API Response Wrapper
export interface ExchangeResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
  rateLimit?: {
    remaining: number
    resetAt: number
  }
}
