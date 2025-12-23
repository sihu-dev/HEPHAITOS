// ============================================
// HEPHAITOS Type Definitions
// ============================================

// ============================================
// Utility Types
// ============================================

/** Make selected properties required */
export type RequiredProps<T, K extends keyof T> = T & Required<Pick<T, K>>

/** Make selected properties optional */
export type OptionalProps<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/** Extract non-nullable type */
export type NonNullable<T> = T extends null | undefined ? never : T

/** Deep partial - makes all nested properties optional */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/** Brand type for nominal typing */
export type Brand<K, T> = K & { __brand: T }

/** Branded ID types for type safety */
export type UserId = Brand<string, 'UserId'>
export type StrategyId = Brand<string, 'StrategyId'>
export type TradeId = Brand<string, 'TradeId'>
export type PositionId = Brand<string, 'PositionId'>

// ============================================
// User & Auth Types
// ============================================
export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  plan: 'free' | 'pro' | 'enterprise'
  createdAt: Date
  updatedAt: Date
}

// Strategy Types
export type IndicatorType = 'price' | 'sma' | 'ema' | 'rsi' | 'macd' | 'bollinger' | 'atr' | 'volume' | 'vwap'
export type StrategyStatus = 'draft' | 'backtesting' | 'ready' | 'running' | 'paused' | 'stopped'

export interface Strategy {
  id: string
  userId: string
  name: string
  description?: string
  status: StrategyStatus
  config: StrategyConfig
  performance?: StrategyPerformance
  createdAt: Date
  updatedAt: Date
}

export interface StrategyConfig {
  symbols: string[]
  timeframe: Timeframe
  entryConditions: Condition[]
  exitConditions: Condition[]
  riskManagement: RiskManagement
  allocation: number // % of portfolio
}

export type Timeframe = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w'

export interface Condition {
  id: string
  indicator: string
  operator: ConditionOperator
  value: number | string
  params?: Record<string, number | string>
}

export type ConditionOperator =
  | 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq'
  | 'crosses_above' | 'crosses_below'

export interface RiskManagement {
  stopLoss?: number // %
  takeProfit?: number // %
  trailingStop?: number // %
  maxDrawdown?: number // %
  maxPositionSize?: number // %
  maxOpenPositions?: number
}

// Performance Types
export interface StrategyPerformance {
  totalReturn: number
  winRate: number
  sharpeRatio: number
  maxDrawdown: number
  totalTrades: number
  winningTrades: number
  losingTrades: number
  avgWin: number
  avgLoss: number
  profitFactor: number
}

// Trade Types
export type TradeType = 'buy' | 'sell'
export type TradeStatus = 'pending' | 'filled' | 'partial' | 'cancelled' | 'rejected' | 'failed'

export interface Trade {
  id: string
  strategyId: string
  symbol: string
  type: TradeType
  status: TradeStatus
  price: number
  amount: number
  total: number
  fee?: number
  pnl?: number
  pnlPercent?: number
  executedAt?: Date
  createdAt: Date
}

// Portfolio Types
export interface Portfolio {
  totalValue: number
  cashBalance: number
  investedValue: number
  totalPnl: number
  totalPnlPercent: number
  positions: Position[]
}

export interface Position {
  symbol: string
  amount: number
  avgPrice: number
  currentPrice: number
  value: number
  pnl: number
  pnlPercent: number
}

// Backtest Types
export interface BacktestConfig {
  strategyId: string
  startDate: Date
  endDate: Date
  initialCapital: number
  commission?: number
  slippage?: number
}

export interface BacktestResult {
  id: string
  strategyId: string
  config: BacktestConfig
  performance: StrategyPerformance
  equityCurve: EquityPoint[]
  trades: Trade[]
  createdAt: Date
}

export interface EquityPoint {
  date: Date
  value: number
  drawdown: number
}

// Market Data Types
export interface MarketData {
  symbol: string
  price: number
  change24h: number
  volume24h: number
  high24h: number
  low24h: number
  marketCap?: number
}

export interface OHLCV {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

// Node Builder Types (for visual strategy builder)
export type NodeType =
  | 'trigger'
  | 'condition'
  | 'indicator'
  | 'action'
  | 'filter'
  | 'risk'

export interface StrategyNode {
  id: string
  type: NodeType
  label: string
  data: Record<string, unknown>
  position: { x: number; y: number }
}

export interface StrategyEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
}

export interface StrategyGraph {
  nodes: StrategyNode[]
  edges: StrategyEdge[]
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: ApiError
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Exchange Types
export type ExchangeId = 'binance' | 'upbit' | 'bithumb' | 'coinbase'

export interface ExchangeConnection {
  id: string
  userId: string
  exchange: ExchangeId
  apiKey: string
  isActive: boolean
  permissions: ExchangePermission[]
  createdAt: Date
}

export type ExchangePermission = 'read' | 'trade' | 'withdraw'

// Notification Types
export type NotificationType = 'signal' | 'trade' | 'alert' | 'system'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  data?: Record<string, unknown>
  createdAt: Date
}

// ============================================
// Form Input Types
// ============================================

/** Strategy creation input */
export interface CreateStrategyInput {
  name: string
  description?: string
  symbols: string[]
  timeframe: Timeframe
}

/** Strategy update input */
export interface UpdateStrategyInput {
  name?: string
  description?: string
  status?: StrategyStatus
  config?: Partial<StrategyConfig>
}

/** Trade creation input */
export interface CreateTradeInput {
  strategyId: string
  symbol: string
  type: TradeType
  amount: number
  price?: number
}

// ============================================
// WebSocket Event Types
// ============================================

export type WebSocketEventType =
  | 'ticker'
  | 'orderbook'
  | 'trade'
  | 'kline'
  | 'depth'

export interface WebSocketMessage<T = unknown> {
  type: WebSocketEventType
  symbol: string
  data: T
  timestamp: number
}

export interface TickerData {
  symbol: string
  price: number
  priceChange: number
  priceChangePercent: number
  volume: number
  high: number
  low: number
}

export interface OrderBookData {
  symbol: string
  bids: [number, number][] // [price, quantity]
  asks: [number, number][]
  timestamp: number
}

export interface KlineData {
  symbol: string
  interval: Timeframe
  open: number
  high: number
  low: number
  close: number
  volume: number
  openTime: number
  closeTime: number
}

// ============================================
// Component Props Types
// ============================================

/** Common component props */
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

/** Loading state props */
export interface LoadingProps {
  isLoading: boolean
  loadingText?: string
}

/** Error state props */
export interface ErrorProps {
  error: Error | null
  onRetry?: () => void
}

/** Pagination props */
export interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

// ============================================
// Store State Types
// ============================================

/** Generic async state */
export interface AsyncState<T> {
  data: T | null
  isLoading: boolean
  error: string | null
}

/** Strategy store state */
export interface StrategyStoreState {
  strategies: Strategy[]
  selectedStrategy: Strategy | null
  isLoading: boolean
  error: string | null
}

/** Portfolio store state */
export interface PortfolioStoreState {
  portfolio: Portfolio | null
  trades: Trade[]
  marketData: MarketData[]
  isLoading: boolean
  error: string | null
}
