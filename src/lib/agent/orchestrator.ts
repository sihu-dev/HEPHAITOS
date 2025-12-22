// ============================================
// Trading Agent Orchestrator
// End-to-End Pipeline: Natural Language → Trading
// ============================================

import type {
  ParsedIntent,
  GeneratedStrategy,
  AgentResponse,
  AgentAction,
  AgentState,
  AgentStatus,
  ConversationContext,
  ConversationMessage,
  BacktestSummary,
} from './types'
import type { Strategy } from '@/types'
import type { BacktestResult } from '@/lib/backtest/types'
import { IntentParser, createIntentParser } from './intent-parser'
import { StrategyBuilder, createStrategyBuilder } from './strategy-builder'
import { RESPONSE_TEMPLATES, formatPrompt } from './prompts'
import { generateId } from '@/lib/utils'

// ============================================
// Types
// ============================================

export interface OrchestratorConfig {
  useAI?: boolean
  aiEndpoint?: string
  aiApiKey?: string
  onStateChange?: (status: AgentStatus) => void
  onResponse?: (response: AgentResponse) => void
}

type OrchestratorCallback = (event: OrchestratorEvent) => void

interface OrchestratorEvent {
  type: 'state_change' | 'response' | 'error' | 'strategy_created' | 'backtest_complete'
  data: unknown
  timestamp: Date
}

// ============================================
// Trading Agent Orchestrator
// ============================================

export class TradingAgentOrchestrator {
  private parser: IntentParser
  private builder: StrategyBuilder
  private config: OrchestratorConfig
  private state: AgentState = 'idle'
  private context: ConversationContext
  private callbacks: OrchestratorCallback[] = []
  private pendingConfirmation: {
    action: AgentAction
    callback: (confirmed: boolean) => void
  } | null = null

  constructor(config: OrchestratorConfig = {}) {
    this.config = config
    this.parser = createIntentParser({
      useAI: config.useAI,
      aiEndpoint: config.aiEndpoint,
      aiApiKey: config.aiApiKey,
    })
    this.builder = createStrategyBuilder()
    this.context = {
      messages: [],
      currentStrategy: null,
      activePosition: false,
      lastBacktestResult: null,
    }
  }

  // ============================================
  // Public API
  // ============================================

  /**
   * Process user input and return response
   */
  async process(userInput: string): Promise<AgentResponse> {
    this.setState('parsing')
    this.addMessage('user', userInput)

    try {
      // 1. Parse intent
      const intent = await this.parser.parse(userInput)

      // 2. Handle based on intent type
      const response = await this.handleIntent(intent)

      // 3. Add response to conversation
      this.addMessage('assistant', response.message, intent)

      this.setState('idle')
      this.emit('response', response)

      return response
    } catch (error) {
      this.setState('idle')
      const errorResponse = this.createErrorResponse(error)
      this.addMessage('assistant', errorResponse.message)
      return errorResponse
    }
  }

  /**
   * Confirm pending action
   */
  async confirm(confirmed: boolean): Promise<AgentResponse | null> {
    if (!this.pendingConfirmation) {
      return null
    }

    const { action, callback } = this.pendingConfirmation
    this.pendingConfirmation = null

    callback(confirmed)

    if (confirmed) {
      return this.executeAction(action)
    } else {
      return {
        message: '작업이 취소되었습니다.',
        intent: { type: 'UNKNOWN', confidence: 1, entities: { symbols: [], prices: [], percentages: [], indicators: [], timeframes: [], conditions: [], actions: [] }, rawText: '', timestamp: new Date() },
        action: { type: 'NONE' },
      }
    }
  }

  /**
   * Get current context
   */
  getContext(): ConversationContext {
    return { ...this.context }
  }

  /**
   * Get current status
   */
  getStatus(): AgentStatus {
    return {
      state: this.state,
    }
  }

  /**
   * Subscribe to events
   */
  onEvent(callback: OrchestratorCallback): () => void {
    this.callbacks.push(callback)
    return () => {
      const index = this.callbacks.indexOf(callback)
      if (index > -1) this.callbacks.splice(index, 1)
    }
  }

  /**
   * Reset conversation context
   */
  reset(): void {
    this.context = {
      messages: [],
      currentStrategy: null,
      activePosition: false,
      lastBacktestResult: null,
    }
    this.pendingConfirmation = null
    this.state = 'idle'
  }

  // ============================================
  // Intent Handlers
  // ============================================

  private async handleIntent(intent: ParsedIntent): Promise<AgentResponse> {
    switch (intent.type) {
      case 'STRATEGY_CREATE':
        return this.handleStrategyCreate(intent)

      case 'STRATEGY_MODIFY':
        return this.handleStrategyModify(intent)

      case 'BACKTEST_RUN':
        return this.handleBacktestRun(intent)

      case 'LIVE_START':
        return this.handleLiveStart(intent)

      case 'LIVE_STOP':
        return this.handleLiveStop(intent)

      case 'POSITION_QUERY':
        return this.handlePositionQuery(intent)

      case 'MARKET_ANALYSIS':
        return this.handleMarketAnalysis(intent)

      case 'RISK_ADJUST':
        return this.handleRiskAdjust(intent)

      case 'HELP':
        return this.handleHelp(intent)

      default:
        return this.handleUnknown(intent)
    }
  }

  private async handleStrategyCreate(intent: ParsedIntent): Promise<AgentResponse> {
    this.setState('generating')

    // Build strategy
    const generated = this.builder.build(intent)

    // Store in context
    if (generated.validation.isValid) {
      this.context.currentStrategy = generated.strategy as Strategy
    }

    this.emit('strategy_created', generated)

    // Create response
    const hasWarnings = generated.validation.warnings.length > 0
    const warningsText = hasWarnings
      ? '\n\n⚠️ **주의사항:**\n' + generated.validation.warnings.map(w => `- ${w.message}`).join('\n')
      : ''

    return {
      message: generated.explanation + warningsText,
      intent,
      action: { type: 'CREATE_STRATEGY', strategy: generated },
      suggestions: generated.suggestions,
      requiresConfirmation: false,
    }
  }

  private async handleStrategyModify(intent: ParsedIntent): Promise<AgentResponse> {
    if (!this.context.currentStrategy) {
      return {
        message: '수정할 전략이 없습니다. 먼저 전략을 생성해주세요.',
        intent,
        action: { type: 'NONE' },
        suggestions: ['새 전략을 만들어보세요: "비트코인 RSI 30 이하면 매수"'],
      }
    }

    // Parse modifications from intent
    const entities = intent.entities

    // Apply modifications
    const changes: Partial<Strategy['config']> = {}

    if (entities.percentages.some(p => p.context === 'stop_loss')) {
      const sl = entities.percentages.find(p => p.context === 'stop_loss')
      if (sl) {
        changes.riskManagement = {
          ...this.context.currentStrategy.config.riskManagement,
          stopLoss: sl.value,
        }
      }
    }

    if (entities.percentages.some(p => p.context === 'take_profit')) {
      const tp = entities.percentages.find(p => p.context === 'take_profit')
      if (tp) {
        changes.riskManagement = {
          ...this.context.currentStrategy.config.riskManagement,
          takeProfit: tp.value,
        }
      }
    }

    return {
      message: `전략이 수정되었습니다.\n${JSON.stringify(changes, null, 2)}`,
      intent,
      action: { type: 'MODIFY_STRATEGY', changes },
    }
  }

  private async handleBacktestRun(intent: ParsedIntent): Promise<AgentResponse> {
    if (!this.context.currentStrategy) {
      return {
        message: '백테스트할 전략이 없습니다. 먼저 전략을 생성해주세요.',
        intent,
        action: { type: 'NONE' },
        suggestions: ['전략 예시: "비트코인 RSI 30 이하면 매수, 70 이상이면 매도"'],
      }
    }

    this.setState('executing')

    // Extract backtest parameters
    const symbol = this.context.currentStrategy.config.symbols[0]
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 3) // Default 3 months

    // Check for timeframe entity
    if (intent.entities.timeframes.length > 0) {
      const tf = intent.entities.timeframes[0].original
      if (tf.includes('1') && tf.includes('개월')) {
        startDate.setMonth(endDate.getMonth() - 1)
      } else if (tf.includes('6') && tf.includes('개월')) {
        startDate.setMonth(endDate.getMonth() - 6)
      } else if (tf.includes('1') && tf.includes('년')) {
        startDate.setFullYear(endDate.getFullYear() - 1)
      }
    }

    // Simulate backtest result (실제로는 BacktestEngine 연동)
    const mockResult: BacktestSummary = {
      totalReturn: Math.random() * 40 - 10, // -10% ~ 30%
      winRate: 45 + Math.random() * 20, // 45% ~ 65%
      sharpeRatio: 0.5 + Math.random() * 1.5, // 0.5 ~ 2.0
      maxDrawdown: 5 + Math.random() * 15, // 5% ~ 20%
      totalTrades: Math.floor(20 + Math.random() * 80), // 20 ~ 100
      recommendation: 'moderate',
    }

    // Determine recommendation
    if (mockResult.totalReturn > 15 && mockResult.sharpeRatio > 1.0) {
      mockResult.recommendation = 'good'
    } else if (mockResult.totalReturn < 0 || mockResult.maxDrawdown > 15) {
      mockResult.recommendation = 'poor'
    }

    this.context.lastBacktestResult = mockResult

    const recommendationText = {
      good: '✅ 전략이 양호한 성과를 보입니다. 실전 투입을 고려해볼 수 있습니다.',
      moderate: '⚠️ 전략이 보통 수준의 성과를 보입니다. 조건 조정을 고려해보세요.',
      poor: '❌ 전략의 성과가 좋지 않습니다. 전략 수정이 필요합니다.',
    }

    const message = formatPrompt(RESPONSE_TEMPLATES.BACKTEST_RESULT, {
      startDate: startDate.toLocaleDateString('ko-KR'),
      endDate: endDate.toLocaleDateString('ko-KR'),
      initialCapital: '$10,000',
      totalReturn: mockResult.totalReturn.toFixed(2),
      winRate: mockResult.winRate.toFixed(1),
      sharpeRatio: mockResult.sharpeRatio.toFixed(2),
      maxDrawdown: mockResult.maxDrawdown.toFixed(1),
      totalTrades: mockResult.totalTrades.toString(),
      recommendation: recommendationText[mockResult.recommendation],
      suggestions: mockResult.recommendation === 'poor'
        ? '\n💡 손절가 조정, 진입 조건 강화를 고려해보세요.'
        : '',
    })

    this.emit('backtest_complete', mockResult)

    return {
      message,
      intent,
      action: {
        type: 'RUN_BACKTEST',
        config: {
          symbol,
          startDate,
          endDate,
          initialCapital: 10000,
        },
      },
      suggestions: mockResult.recommendation === 'good'
        ? ['실전 투입하시려면 "실전 투입해줘"라고 말씀해주세요.']
        : ['전략 수정: "손절을 3%로 변경해줘"'],
    }
  }

  private async handleLiveStart(intent: ParsedIntent): Promise<AgentResponse> {
    if (!this.context.currentStrategy) {
      return {
        message: '실행할 전략이 없습니다. 먼저 전략을 생성하고 백테스트를 진행해주세요.',
        intent,
        action: { type: 'NONE' },
      }
    }

    // Require confirmation for live trading
    return {
      message: `⚠️ **실거래 시작 확인**

**전략:** ${this.context.currentStrategy.name}
**심볼:** ${this.context.currentStrategy.config.symbols[0]}

실제 자금이 투입됩니다. 시작하시겠습니까?`,
      intent,
      action: { type: 'START_LIVE', strategyId: this.context.currentStrategy.id },
      requiresConfirmation: true,
      confirmationPrompt: '"네" 또는 "아니오"로 답해주세요.',
    }
  }

  private async handleLiveStop(intent: ParsedIntent): Promise<AgentResponse> {
    if (!this.context.activePosition) {
      return {
        message: '현재 실행 중인 전략이 없습니다.',
        intent,
        action: { type: 'NONE' },
      }
    }

    // Check if emergency close
    const isEmergency = intent.entities.actions.some(a => a.type === 'close_all')

    if (isEmergency) {
      return {
        message: '🚨 **긴급 청산 요청**\n\n모든 포지션을 즉시 청산하고 거래를 중단합니다.\n\n진행하시겠습니까?',
        intent,
        action: { type: 'STOP_LIVE', strategyId: this.context.currentStrategy?.id || '' },
        requiresConfirmation: true,
        confirmationPrompt: '"네" 또는 "아니오"로 답해주세요.',
      }
    }

    this.context.activePosition = false

    return {
      message: '거래가 중단되었습니다.',
      intent,
      action: { type: 'STOP_LIVE', strategyId: this.context.currentStrategy?.id || '' },
    }
  }

  private async handlePositionQuery(intent: ParsedIntent): Promise<AgentResponse> {
    // Mock position data
    const hasPosition = this.context.activePosition

    if (!hasPosition) {
      return {
        message: '💼 **현재 포지션**\n\n보유 중인 포지션이 없습니다.',
        intent,
        action: { type: 'SHOW_POSITION' },
      }
    }

    const message = formatPrompt(RESPONSE_TEMPLATES.POSITION_STATUS, {
      positions: '- BTC/USDT: 0.5 BTC @ $42,000 (Long)\n  - 미실현 손익: +$500 (+2.38%)',
      totalValue: '$21,500',
      unrealizedPnl: '+$500',
      unrealizedPnlPercent: '+2.38',
    })

    return {
      message,
      intent,
      action: { type: 'SHOW_POSITION' },
    }
  }

  private async handleMarketAnalysis(intent: ParsedIntent): Promise<AgentResponse> {
    const symbol = intent.entities.symbols[0]?.value || 'BTC/USDT'

    // Mock analysis
    return {
      message: `📊 **${symbol} 시장 분석**

**현재 가격:** $43,250
**24시간 변동:** +2.5%
**거래량:** $28.5B

**기술적 지표:**
- RSI(14): 55 (중립)
- MACD: 양수 (상승 추세)
- 볼린저밴드: 중간 밴드 위

**요약:** 현재 중립적인 상태이며, 단기 상승 모멘텀이 있습니다.`,
      intent,
      action: { type: 'SHOW_ANALYSIS', symbol },
    }
  }

  private async handleRiskAdjust(intent: ParsedIntent): Promise<AgentResponse> {
    const entities = intent.entities

    if (!this.context.currentStrategy) {
      return {
        message: '리스크를 조정할 전략이 없습니다. 먼저 전략을 생성해주세요.',
        intent,
        action: { type: 'NONE' },
      }
    }

    const changes: Partial<Strategy['config']['riskManagement']> = {}
    const messages: string[] = []

    for (const percent of entities.percentages) {
      if (percent.context === 'stop_loss') {
        changes.stopLoss = percent.value
        messages.push(`손절가: ${percent.value}%`)
      }
      if (percent.context === 'take_profit') {
        changes.takeProfit = percent.value
        messages.push(`익절가: ${percent.value}%`)
      }
    }

    return {
      message: `✅ 리스크 설정이 변경되었습니다.\n\n${messages.join('\n')}`,
      intent,
      action: { type: 'ADJUST_RISK', risk: changes },
    }
  }

  private handleHelp(intent: ParsedIntent): AgentResponse {
    return {
      message: RESPONSE_TEMPLATES.HELP,
      intent,
      action: { type: 'NONE' },
    }
  }

  private handleUnknown(intent: ParsedIntent): AgentResponse {
    return {
      message: `죄송합니다. 요청을 이해하지 못했습니다.

**예시:**
- "비트코인 RSI 30 이하면 매수해줘"
- "백테스트 돌려줘"
- "현재 포지션 확인해줘"

도움이 필요하시면 "도움말"이라고 말씀해주세요.`,
      intent,
      action: { type: 'NONE' },
      suggestions: ['도움말 보기', '전략 예시 보기'],
    }
  }

  // ============================================
  // Action Execution
  // ============================================

  private async executeAction(action: AgentAction): Promise<AgentResponse> {
    switch (action.type) {
      case 'START_LIVE': {
        this.context.activePosition = true
        const strategy = this.context.currentStrategy!
        return {
          message: formatPrompt(RESPONSE_TEMPLATES.LIVE_STARTED, {
            strategyName: strategy.name,
            symbol: strategy.config.symbols[0],
            mode: 'Paper Trading (테스트)',
          }),
          intent: { type: 'LIVE_START', confidence: 1, entities: { symbols: [], prices: [], percentages: [], indicators: [], timeframes: [], conditions: [], actions: [] }, rawText: '', timestamp: new Date() },
          action,
        }
      }

      case 'STOP_LIVE':
        this.context.activePosition = false
        return {
          message: '🛑 거래가 중단되었습니다. 모든 포지션이 청산되었습니다.',
          intent: { type: 'LIVE_STOP', confidence: 1, entities: { symbols: [], prices: [], percentages: [], indicators: [], timeframes: [], conditions: [], actions: [] }, rawText: '', timestamp: new Date() },
          action,
        }

      default:
        return {
          message: '작업이 완료되었습니다.',
          intent: { type: 'UNKNOWN', confidence: 1, entities: { symbols: [], prices: [], percentages: [], indicators: [], timeframes: [], conditions: [], actions: [] }, rawText: '', timestamp: new Date() },
          action,
        }
    }
  }

  // ============================================
  // Utilities
  // ============================================

  private setState(state: AgentState): void {
    this.state = state
    this.config.onStateChange?.({ state })
    this.emit('state_change', { state })
  }

  private addMessage(role: ConversationMessage['role'], content: string, intent?: ParsedIntent): void {
    this.context.messages.push({
      id: generateId('msg'),
      role,
      content,
      timestamp: new Date(),
      intent,
    })
  }

  private createErrorResponse(error: unknown): AgentResponse {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'

    return {
      message: formatPrompt(RESPONSE_TEMPLATES.ERROR, {
        errorMessage,
        suggestion: '다시 시도하거나 "도움말"을 입력해주세요.',
      }),
      intent: { type: 'UNKNOWN', confidence: 0, entities: { symbols: [], prices: [], percentages: [], indicators: [], timeframes: [], conditions: [], actions: [] }, rawText: '', timestamp: new Date() },
      action: { type: 'NONE' },
    }
  }

  private emit(type: OrchestratorEvent['type'], data: unknown): void {
    const event: OrchestratorEvent = { type, data, timestamp: new Date() }
    this.callbacks.forEach(cb => cb(event))
  }
}

// ============================================
// Factory Function
// ============================================

export function createTradingAgent(config?: OrchestratorConfig): TradingAgentOrchestrator {
  return new TradingAgentOrchestrator(config)
}
