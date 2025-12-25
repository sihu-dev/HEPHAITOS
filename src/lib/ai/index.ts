// ============================================
// AI Module Exports
// ============================================

export {
  AIReportGenerator,
  createAIReportGenerator,
  aiReportGenerator,
  type MarketReport,
  type MarketSummary,
  type SectorInfo,
  type HotIssue,
  type EntryPoint,
  type EntryIndicators,
  type ReportConfig,
} from './report-generator'

export {
  ClaudeClient,
  createClaudeClient,
  getClaudeClient,
  initClaudeClient,
  callClaude,
  TRADING_PROMPTS,
  type ClaudeConfig,
  type ClaudeMessage,
  type ClaudeResponse,
} from './claude-client'

export {
  TradeAnalyzer,
  tradeAnalyzer,
  formatAnalysisResult,
  type TradeAnalysisResult,
  type PortfolioComparisonResult,
  type MirrorOpportunityAlert,
} from './trade-analyzer'

export {
  ContextManager,
  getContextManager,
  createContextManager,
  type ContextManagerConfig,
  type PrioritizedData,
  type TokenEstimate,
} from './context-manager'
