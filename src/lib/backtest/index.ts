// ============================================
// Backtest Module Exports (Enhanced 2026)
// ============================================

// Engine (Enhanced 2026: Legal Compliance, Risk Profiler, Structured Logging)
export { BacktestEngine, createBacktestEngine } from './engine'

// 🆕 Advanced Metrics (2026: Kelly, VAR, Ulcer Index, etc.)
export {
  calculateAdvancedMetrics,
  AdvancedMetricsCalculator,
  type AdvancedMetrics,
} from './advanced-metrics'

// Types
export type {
  BacktestConfig,
  BacktestResult,
  BacktestMetrics,
  BacktestTrade,
  PortfolioSnapshot,
  Signal,
  SignalType,
  IndicatorType,
  IndicatorConfig,
  IndicatorResult,
  Condition,
  ConditionOperator,
  OrderType,
  BacktestOrder,
  RiskConfig,
  BacktestProgress,
  BacktestProgressCallback,
} from './types'

// Indicators
export {
  sma,
  ema,
  rsi,
  macd,
  bollingerBands,
  atr,
  stochastic,
  momentum,
  calculateIndicator,
} from './indicators'
