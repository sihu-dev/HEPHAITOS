// ============================================
// Trading Agent Types
// Natural Language → Trading Strategy Pipeline
// ============================================

import type { Strategy, StrategyConfig, Timeframe, RiskManagement } from '@/types'
import type { IndicatorType } from '@/lib/backtest/types'

// ============================================
// Intent Types
// ============================================

export type IntentType =
  | 'STRATEGY_CREATE'    // 새 전략 생성
  | 'STRATEGY_MODIFY'    // 기존 전략 수정
  | 'BACKTEST_RUN'       // 백테스트 실행
  | 'LIVE_START'         // 실거래 시작
  | 'LIVE_STOP'          // 실거래 중지
  | 'POSITION_QUERY'     // 포지션 조회
  | 'MARKET_ANALYSIS'    // 시장 분석
  | 'RISK_ADJUST'        // 리스크 조정
  | 'HELP'               // 도움말
  | 'UNKNOWN'            // 알 수 없음

export interface ParsedIntent {
  type: IntentType
  confidence: number
  entities: ExtractedEntities
  rawText: string
  timestamp: Date
}

// ============================================
// Entity Types
// ============================================

export interface ExtractedEntities {
  symbols: SymbolEntity[]
  prices: PriceEntity[]
  percentages: PercentageEntity[]
  indicators: IndicatorEntity[]
  timeframes: TimeframeEntity[]
  conditions: ConditionEntity[]
  actions: ActionEntity[]
}

export interface SymbolEntity {
  value: string           // "BTC/USDT"
  original: string        // "비트코인", "BTC"
  confidence: number
}

export interface PriceEntity {
  value: number
  currency: 'USD' | 'KRW' | 'USDT'
  original: string        // "5만달러", "50000"
  confidence: number
}

export interface PercentageEntity {
  value: number
  original: string        // "5%", "10퍼센트"
  context: 'position_size' | 'stop_loss' | 'take_profit' | 'allocation' | 'unknown'
  confidence: number
}

export interface IndicatorEntity {
  type: IndicatorType
  params: Record<string, number>
  original: string        // "RSI 14", "20일 이평선"
  confidence: number
}

export interface TimeframeEntity {
  value: Timeframe
  original: string        // "1시간", "일봉"
  confidence: number
}

export interface ConditionEntity {
  type: 'entry' | 'exit'
  indicator?: IndicatorEntity
  operator: ConditionOperator
  value: number | string
  original: string
  confidence: number
}

export type ConditionOperator =
  | 'greater_than'      // 이상, 초과
  | 'less_than'         // 이하, 미만
  | 'equals'            // 같음
  | 'crosses_above'     // 상향 돌파
  | 'crosses_below'     // 하향 돌파
  | 'between'           // 사이

export interface ActionEntity {
  type: 'buy' | 'sell' | 'hold' | 'close_all'
  size?: number
  sizeType?: 'percent' | 'fixed' | 'all'
  original: string
  confidence: number
}

// ============================================
// Strategy Generation Types
// ============================================

export interface GeneratedStrategy {
  strategy: Partial<Strategy>
  config: Partial<StrategyConfig>
  validation: ValidationResult
  explanation: string      // 사용자 친화적 설명
  suggestions: string[]    // 개선 제안
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  code: string
  message: string
  field?: string
}

export interface ValidationWarning {
  code: string
  message: string
  suggestion?: string
}

// ============================================
// Conversation Types
// ============================================

export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  intent?: ParsedIntent
  strategy?: GeneratedStrategy
}

export interface ConversationContext {
  messages: ConversationMessage[]
  currentStrategy: Strategy | null
  activePosition: boolean
  lastBacktestResult: BacktestSummary | null
}

export interface BacktestSummary {
  totalReturn: number
  winRate: number
  sharpeRatio: number
  maxDrawdown: number
  totalTrades: number
  recommendation: 'good' | 'moderate' | 'poor'
}

// ============================================
// Agent Response Types
// ============================================

export interface AgentResponse {
  message: string
  intent: ParsedIntent
  action?: AgentAction
  suggestions?: string[]
  requiresConfirmation?: boolean
  confirmationPrompt?: string
}

export type AgentAction =
  | { type: 'CREATE_STRATEGY'; strategy: GeneratedStrategy }
  | { type: 'MODIFY_STRATEGY'; changes: Partial<StrategyConfig> }
  | { type: 'RUN_BACKTEST'; config: BacktestRequest }
  | { type: 'START_LIVE'; strategyId: string }
  | { type: 'STOP_LIVE'; strategyId: string }
  | { type: 'SHOW_POSITION' }
  | { type: 'SHOW_ANALYSIS'; symbol: string }
  | { type: 'ADJUST_RISK'; risk: Partial<RiskManagement> }
  | { type: 'NONE' }

export interface BacktestRequest {
  strategyId?: string
  symbol: string
  startDate: Date
  endDate: Date
  initialCapital: number
}

// ============================================
// Prompt Templates
// ============================================

export interface PromptTemplate {
  name: string
  systemPrompt: string
  userPromptTemplate: string
  outputSchema: Record<string, unknown>
}

// ============================================
// Agent State
// ============================================

export type AgentState = 'idle' | 'parsing' | 'generating' | 'validating' | 'executing' | 'waiting_confirmation'

export interface AgentStatus {
  state: AgentState
  currentTask?: string
  progress?: number
  error?: string
}
