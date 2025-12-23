/**
 * @hephaitos/types - HEPHAITOS Types
 * L0 (Atoms) - HEPHAITOS 도메인 타입 통합 export
 */

// Common Types
export {
  type UUID,
  type Timestamp,
  type IResultMetadata,
  type IResult,
  type IPagination,
  type IPaginatedResult,
  createResult,
  createErrorResult,
} from '../common.js';

// Exchange Types
export {
  type ExchangeType,
  type ExchangeFeature,
  type IExchangeConfig,
  EXCHANGE_CONFIGS,
} from './exchange.js';

// Asset Types
export {
  type IAsset,
  type IAssetBalance,
  type IAssetBreakdown,
  createAsset,
} from './asset.js';

// Portfolio Types
export {
  type SyncStatus,
  type IPortfolio,
  type IPortfolioSummary,
  type IPortfolioSnapshot,
  type ICreatePortfolioInput,
  type ISyncResult,
} from './portfolio.js';

// Credentials Types
export {
  type CredentialPermission,
  type IExchangeCredentials,
  type ICredentialValidation,
  type IEncryptedCredentials,
  RECOMMENDED_PERMISSIONS,
} from './credentials.js';

// Strategy Types
export {
  type StrategyType,
  type Timeframe,
  type ComparisonOperator,
  type IndicatorType,
  type IIndicatorConfig,
  type ICondition,
  type IConditionGroup,
  type PositionSizingType,
  type IPositionSizing,
  type IRiskManagement,
  type IStrategy,
  type ICreateStrategyInput,
  STRATEGY_TEMPLATES,
} from './strategy.js';

// Trade Types
export {
  type OrderSide,
  type OrderType,
  type OrderStatus,
  type PositionStatus,
  type IOrder,
  type ITrade,
  type IPosition,
  type IRoundTrip,
  type IOHLCV,
  type IPriceData,
} from './trade.js';

// Backtest Types
export {
  type BacktestStatus,
  type IBacktestConfig,
  type IEquityPoint,
  type IDrawdownRecord,
  type IPerformanceMetrics,
  type IMonthlyReturn,
  type IBacktestResult,
  type IBacktestSummary,
  type IStrategyComparison,
  DEFAULT_BACKTEST_CONFIG,
} from './backtest.js';

// Order Execution Types
export {
  type TimeInForce,
  type IOrderRequest,
  type IStopLossOrder,
  type ITakeProfitOrder,
  type IPartialExit,
  type ExecutionMode,
  type IOrderExecution,
  type IOrderWithMeta,
  type IPositionWithMeta,
  type IPartialExitRecord,
  type PositionSizingMethod,
  type IRiskConfig,
  type IRiskStatus,
  type IOrderHistoryFilter,
  type IExecutionStats,
  DEFAULT_RISK_CONFIG,
  DEFAULT_SIMULATION_CONFIG,
} from './order.js';

// User Types
export {
  type UserRole,
  type UserStatus,
  type IUser,
  type IUserSettings,
  type INotificationSettings,
  type ITradingSettings,
  type ICreateUserInput,
  type IUpdateUserInput,
  type IUserStats,
  DEFAULT_USER_SETTINGS,
} from './user.js';

// Transaction Types
export {
  type TransactionType,
  type ITransaction,
  type ICreateTransactionInput,
  type ITransactionFilter,
  type ITransactionStats,
  type IDailyTransactionSummary,
} from './transaction.js';

// Alert Types
export {
  type AlertType,
  type AlertStatus,
  type AlertPriority,
  type IAlert,
  type ICreateAlertInput,
} from './alert.js';
