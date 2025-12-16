// ============================================
// Trading Agent Module Exports
// 자연어 → 트레이딩 전략 변환 파이프라인
// ============================================

// Types
export type {
  // Intent Types
  IntentType,
  ParsedIntent,

  // Entity Types
  ExtractedEntities,
  SymbolEntity,
  PriceEntity,
  PercentageEntity,
  IndicatorEntity,
  ConditionEntity,
  ConditionOperator,
  TimeframeEntity,
  ActionEntity,

  // Conversation Types
  ConversationContext,
  ConversationMessage,
  BacktestSummary,

  // Response Types
  AgentResponse,
  AgentAction,
  BacktestRequest,

  // Generated Strategy Types
  GeneratedStrategy,
  ValidationResult,
  ValidationError,
  ValidationWarning,

  // Agent State
  AgentState,
  AgentStatus,
} from './types'

// Intent Parser
export { IntentParser, createIntentParser } from './intent-parser'

// Strategy Builder
export { StrategyBuilder, createStrategyBuilder } from './strategy-builder'

// Orchestrator (Main Pipeline)
export {
  TradingAgentOrchestrator,
  createTradingAgent,
  type OrchestratorConfig,
} from './orchestrator'

// Prompts (for customization)
export {
  SYSTEM_PROMPT_INTENT_PARSER,
  SYSTEM_PROMPT_STRATEGY_BUILDER,
  SYSTEM_PROMPT_RESPONSE_GENERATOR,
  INTENT_PARSER_TEMPLATE,
  STRATEGY_BUILDER_TEMPLATE,
  PARSING_EXAMPLES,
  RESPONSE_TEMPLATES,
  formatPrompt,
  buildFewShotPrompt,
} from './prompts'
