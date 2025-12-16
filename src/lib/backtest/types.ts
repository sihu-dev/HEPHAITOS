// ============================================
// Backtesting Engine Types
// ============================================

import type { OHLCV, Strategy } from '@/types'

// ============================================
// Core Types
// ============================================

/**
 * Backtest configuration
 * Note: dates are stored as numbers (Unix ms) for consistency with OHLCV data
 */
export interface BacktestConfig {
  strategy: Strategy
  symbol: string
  startDate: number  // Unix timestamp (ms)
  endDate: number    // Unix timestamp (ms)
  initialCapital: number
  commission: number // Percentage (e.g., 0.001 = 0.1%)
  slippage: number // Percentage
  leverage?: number
  marginMode?: 'isolated' | 'cross'
}

/**
 * Individual trade in backtest
 * Note: timestamps are stored as numbers (Unix ms) for consistency with OHLCV data
 */
export interface BacktestTrade {
  id: string
  entryTime: number  // Unix timestamp (ms)
  exitTime: number | null
  entryPrice: number
  exitPrice: number | null
  quantity: number
  side: 'long' | 'short'
  pnl: number
  pnlPercent: number
  commission: number
  slippage: number
  status: 'open' | 'closed' | 'stopped'
  stopLoss?: number
  takeProfit?: number
  entryReason?: string
  exitReason?: string
}

/**
 * Portfolio state at a point in time
 * Note: timestamp is stored as number (Unix ms) for consistency with OHLCV data
 */
export interface PortfolioSnapshot {
  timestamp: number  // Unix timestamp (ms)
  equity: number
  cash: number
  positionValue: number
  unrealizedPnl: number
  realizedPnl: number
  drawdown: number
  drawdownPercent: number
}

/**
 * Performance metrics
 */
export interface BacktestMetrics {
  // Returns
  totalReturn: number
  totalReturnPercent: number
  annualizedReturn: number

  // Risk metrics
  maxDrawdown: number
  maxDrawdownPercent: number
  sharpeRatio: number
  sortinoRatio: number
  calmarRatio: number
  volatility: number // Added: Annualized volatility

  // Trade statistics
  totalTrades: number
  winningTrades: number
  losingTrades: number
  winRate: number
  avgWin: number
  avgLoss: number
  largestWin: number
  largestLoss: number
  avgTradeDuration: number // in hours
  profitFactor: number
  expectancy: number
  maxConsecutiveWins: number // Added: Max consecutive wins
  maxConsecutiveLosses: number // Added: Max consecutive losses
  avgHoldingPeriod: number // Added: Average holding period in hours

  // Other
  tradingDays: number
  averageTradesPerDay: number
}

/**
 * Complete backtest result (Enhanced 2026: Advanced Metrics)
 */
export interface BacktestResult {
  config: BacktestConfig
  metrics: BacktestMetrics
  trades: BacktestTrade[]
  equityCurve: PortfolioSnapshot[]
  startTime: Date
  endTime: Date
  duration: number // ms
  status: 'completed' | 'failed' | 'cancelled'
  error?: string
  advancedMetrics?: import('./advanced-metrics').AdvancedMetrics // 🆕 2026 Enhancement
}

// ============================================
// Signal Types
// ============================================

export type SignalType = 'entry_long' | 'entry_short' | 'exit_long' | 'exit_short' | 'none'

export interface Signal {
  type: SignalType
  price: number
  timestamp: number  // Unix timestamp (ms)
  strength?: number // 0-1
  reason?: string
  confidence?: number // 0-1
}

// ============================================
// Indicator Types
// ============================================

export type IndicatorType =
  | 'sma'
  | 'ema'
  | 'rsi'
  | 'macd'
  | 'bollinger'
  | 'atr'
  | 'volume'
  | 'momentum'
  | 'stochastic'

export interface IndicatorConfig {
  type: IndicatorType
  params: Record<string, number>
}

export interface IndicatorResult {
  type: IndicatorType
  values: number[]
  timestamps: number[]  // Unix timestamps (ms)
  params: Record<string, number>
}

// ============================================
// Condition Types
// ============================================

export type ConditionOperator =
  | 'crosses_above'
  | 'crosses_below'
  | 'greater_than'
  | 'less_than'
  | 'equals'
  | 'between'

export interface Condition {
  left: string // Indicator name or 'price'
  operator: ConditionOperator
  right: string | number
  timeframe?: string
}

// ============================================
// Order Types
// ============================================

export type OrderType = 'market' | 'limit' | 'stop' | 'stop_limit'

export interface BacktestOrder {
  id: string
  type: OrderType
  side: 'buy' | 'sell'
  quantity: number
  price?: number
  stopPrice?: number
  status: 'pending' | 'filled' | 'cancelled' | 'rejected'
  createdAt: Date
  filledAt?: Date
  filledPrice?: number
  filledQuantity?: number
}

// ============================================
// Risk Management Types
// ============================================

export interface RiskConfig {
  maxPositionSize: number // Percentage of portfolio
  maxDrawdown: number // Percentage
  stopLossPercent?: number
  takeProfitPercent?: number
  trailingStopPercent?: number
  maxDailyLoss?: number // Percentage
  maxOpenTrades?: number
}

// ============================================
// Progress Types
// ============================================

export interface BacktestProgress {
  currentBar: number
  totalBars: number
  percent: number
  currentDate: number  // Unix timestamp (ms)
  elapsedTime: number
  estimatedTimeRemaining: number
}

export type BacktestProgressCallback = (progress: BacktestProgress) => void
