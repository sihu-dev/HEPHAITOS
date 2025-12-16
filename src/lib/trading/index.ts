// ============================================
// Trading Module Exports (Enhanced 2026)
// ============================================

// Trade Executor (Enhanced 2026: UnifiedBroker, Legal Compliance, Risk Profiler)
export {
  TradeExecutor,
  createTradeExecutor,
  type ExecutorConfig,
  type ExecutorStatus,
  type ExecutorState,
  type Position,
  type TradeResult,
  type ExecutorError,
} from './executor'

// 🆕 Structured Logger (2026)
export {
  logger,
  errorMetrics,
  TradingLogger,
  ErrorMetricsTracker,
  type LogLevel,
  type LogEntry,
  type LoggerConfig,
  type ErrorMetrics,
} from './logger'

// Crypto / API Key Management
export {
  encrypt,
  decrypt,
  encryptCredentials,
  decryptCredentials,
  CredentialStore,
  credentialStore,
  generateSecurePassword,
  maskApiKey,
  isValidApiKeyFormat,
  secureCompare,
  type EncryptedData,
  type ExchangeCredentials,
  type EncryptedCredentials,
} from './crypto'
