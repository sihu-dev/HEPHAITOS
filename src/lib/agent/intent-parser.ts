// ============================================
// Intent Parser
// Natural Language → Structured Intent
// ============================================

import type {
  ParsedIntent,
  IntentType,
  ExtractedEntities,
  SymbolEntity,
  PriceEntity,
  PercentageEntity,
  IndicatorEntity,
  TimeframeEntity,
  ConditionEntity,
  ActionEntity,
  ConditionOperator,
} from './types'
import type { IndicatorType } from '@/lib/backtest/types'
import type { Timeframe } from '@/types'
import { PARSING_EXAMPLES, buildFewShotPrompt, SYSTEM_PROMPT_INTENT_PARSER } from './prompts'
import { safeLogger } from '@/lib/utils/safe-logger';

// ============================================
// Constants - Korean to English Mappings
// ============================================

const SYMBOL_MAP: Record<string, string> = {
  // Korean
  '비트코인': 'BTC',
  '비트': 'BTC',
  '이더리움': 'ETH',
  '이더': 'ETH',
  '리플': 'XRP',
  '솔라나': 'SOL',
  '도지코인': 'DOGE',
  '도지': 'DOGE',
  // English (lowercase)
  'bitcoin': 'BTC',
  'ethereum': 'ETH',
  'ripple': 'XRP',
  'solana': 'SOL',
  'dogecoin': 'DOGE',
}

const INDICATOR_MAP: Record<string, IndicatorType> = {
  'rsi': 'rsi',
  '상대강도지수': 'rsi',
  'macd': 'macd',
  '이평선': 'sma',
  '이동평균선': 'sma',
  '단순이동평균': 'sma',
  'sma': 'sma',
  '지수이동평균': 'ema',
  'ema': 'ema',
  '볼린저': 'bollinger',
  '볼린저밴드': 'bollinger',
  '볼밴': 'bollinger',
  'bollinger': 'bollinger',
  'bb': 'bollinger',
  '스토캐스틱': 'stochastic',
  'stochastic': 'stochastic',
  '모멘텀': 'momentum',
  'momentum': 'momentum',
  'atr': 'atr',
}

const TIMEFRAME_MAP: Record<string, Timeframe> = {
  '1분': '1m',
  '5분': '5m',
  '15분': '15m',
  '30분': '30m',
  '1시간': '1h',
  '4시간': '4h',
  '일봉': '1d',
  '1일': '1d',
  '주봉': '1w',
  '1주': '1w',
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '30m': '30m',
  '1h': '1h',
  '4h': '4h',
  '1d': '1d',
  '1w': '1w',
}

const OPERATOR_PATTERNS: { pattern: RegExp; operator: ConditionOperator }[] = [
  { pattern: /상향\s*돌파|골든\s*크로스|위로\s*뚫|올라가면/i, operator: 'crosses_above' },
  { pattern: /하향\s*돌파|데드\s*크로스|아래로\s*뚫|내려가면/i, operator: 'crosses_below' },
  { pattern: /이상|넘으면|초과|위|높으면/i, operator: 'greater_than' },
  { pattern: /이하|미만|아래|밑으로|낮으면/i, operator: 'less_than' },
  { pattern: /같으면|되면|도달/i, operator: 'equals' },
  { pattern: /사이|범위/i, operator: 'between' },
]

const INTENT_KEYWORDS: Record<IntentType, string[]> = {
  STRATEGY_CREATE: ['전략', '만들어', '생성', '매수', '매도', '사줘', '팔아', '설정'],
  STRATEGY_MODIFY: ['수정', '변경', '바꿔', '조정'],
  BACKTEST_RUN: ['백테스트', '테스트', '시뮬레이션', '돌려'],
  LIVE_START: ['실전', '라이브', '시작', '투입', '실행'],
  LIVE_STOP: ['중단', '중지', '멈춰', '청산', '스탑'],
  POSITION_QUERY: ['포지션', '현재', '상태', '잔고', '어때'],
  MARKET_ANALYSIS: ['분석', '시장', '전망', '예측', '어떻게'],
  RISK_ADJUST: ['리스크', '손절', '익절', '한도', '위험'],
  HELP: ['도움', '도움말', '사용법', '어떻게', '뭐', 'help'],
  UNKNOWN: [],
}

// ============================================
// Intent Parser Class
// ============================================

export class IntentParser {
  private useAI: boolean
  private aiEndpoint?: string
  private aiApiKey?: string

  constructor(options: { useAI?: boolean; aiEndpoint?: string; aiApiKey?: string } = {}) {
    this.useAI = options.useAI ?? false
    this.aiEndpoint = options.aiEndpoint
    this.aiApiKey = options.aiApiKey
  }

  /**
   * Parse user input into structured intent
   */
  async parse(input: string): Promise<ParsedIntent> {
    const normalizedInput = this.normalizeInput(input)

    // Try AI parsing if available
    if (this.useAI && this.aiEndpoint && this.aiApiKey) {
      try {
        return await this.parseWithAI(normalizedInput)
      } catch (error) {
        safeLogger.warn('[IntentParser] AI parsing failed, falling back to rules:', error)
      }
    }

    // Rule-based parsing
    return this.parseWithRules(normalizedInput)
  }

  /**
   * Normalize input text
   */
  private normalizeInput(input: string): string {
    return input
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
  }

  /**
   * Parse with AI (LLM)
   */
  private async parseWithAI(input: string): Promise<ParsedIntent> {
    const prompt = buildFewShotPrompt(PARSING_EXAMPLES, input)

    const response = await fetch(this.aiEndpoint!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.aiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT_INTENT_PARSER },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`)
    }

    const data = await response.json()
    const parsed = JSON.parse(data.choices[0].message.content)

    return {
      type: parsed.intent as IntentType,
      confidence: parsed.confidence,
      entities: this.normalizeEntities(parsed.entities),
      rawText: input,
      timestamp: new Date(),
    }
  }

  /**
   * Parse with rules (fallback)
   */
  private parseWithRules(input: string): ParsedIntent {
    const intentType = this.detectIntent(input)
    const entities = this.extractEntities(input)

    // Calculate confidence based on entity extraction quality
    const entityCount = Object.values(entities).flat().length
    const confidence = Math.min(0.5 + entityCount * 0.1, 0.9)

    return {
      type: intentType,
      confidence,
      entities,
      rawText: input,
      timestamp: new Date(),
    }
  }

  /**
   * Detect intent type from keywords
   */
  private detectIntent(input: string): IntentType {
    const scores: Record<IntentType, number> = {
      STRATEGY_CREATE: 0,
      STRATEGY_MODIFY: 0,
      BACKTEST_RUN: 0,
      LIVE_START: 0,
      LIVE_STOP: 0,
      POSITION_QUERY: 0,
      MARKET_ANALYSIS: 0,
      RISK_ADJUST: 0,
      HELP: 0,
      UNKNOWN: 0,
    }

    for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
      for (const keyword of keywords) {
        if (input.includes(keyword)) {
          scores[intent as IntentType]++
        }
      }
    }

    // Special cases
    if (input.match(/rsi|macd|이평선|볼린저|이동평균/) && input.match(/매수|매도|사줘|팔아|사고|팔고/)) {
      scores.STRATEGY_CREATE += 3
    }

    // Check for condition patterns (e.g., "30 이하면", "70 이상이면")
    if (input.match(/\d+\s*(이하|이상|미만|초과|넘으면|밑으로)/) && input.match(/매수|매도/)) {
      scores.STRATEGY_CREATE += 2
    }

    const maxIntent = Object.entries(scores).reduce((a, b) =>
      b[1] > a[1] ? b : a
    )

    return maxIntent[1] > 0 ? maxIntent[0] as IntentType : 'UNKNOWN'
  }

  /**
   * Extract all entities from input
   */
  private extractEntities(input: string): ExtractedEntities {
    return {
      symbols: this.extractSymbols(input),
      prices: this.extractPrices(input),
      percentages: this.extractPercentages(input),
      indicators: this.extractIndicators(input),
      timeframes: this.extractTimeframes(input),
      conditions: this.extractConditions(input),
      actions: this.extractActions(input),
    }
  }

  /**
   * Extract symbol entities
   */
  private extractSymbols(input: string): SymbolEntity[] {
    const symbols: SymbolEntity[] = []

    // Check mapped names
    for (const [name, symbol] of Object.entries(SYMBOL_MAP)) {
      if (input.includes(name.toLowerCase())) {
        symbols.push({
          value: `${symbol}/USDT`,
          original: name,
          confidence: 0.95,
        })
      }
    }

    // Check direct symbols (BTC, ETH, etc.)
    const symbolPattern = /\b(btc|eth|xrp|sol|doge|ada|dot|bnb)\b/gi
    const matches = input.match(symbolPattern)
    if (matches) {
      for (const match of matches) {
        if (!symbols.find(s => s.value.startsWith(match.toUpperCase()))) {
          symbols.push({
            value: `${match.toUpperCase()}/USDT`,
            original: match,
            confidence: 0.98,
          })
        }
      }
    }

    return symbols
  }

  /**
   * Extract price entities
   */
  private extractPrices(input: string): PriceEntity[] {
    const prices: PriceEntity[] = []

    // Korean format: "5만달러", "1억원"
    const koreanPattern = /(\d+(?:\.\d+)?)\s*(만|천|백|억)?\s*(달러|원|usdt)?/gi
    let match
    while ((match = koreanPattern.exec(input)) !== null) {
      let value = parseFloat(match[1])
      if (match[2] === '만') value *= 10000
      if (match[2] === '천') value *= 1000
      if (match[2] === '억') value *= 100000000

      let currency: 'USD' | 'KRW' | 'USDT' = 'USD'
      if (match[3] === '원') currency = 'KRW'
      if (match[3]?.toLowerCase() === 'usdt') currency = 'USDT'

      if (value > 0) {
        prices.push({
          value,
          currency,
          original: match[0],
          confidence: 0.85,
        })
      }
    }

    return prices
  }

  /**
   * Extract percentage entities
   */
  private extractPercentages(input: string): PercentageEntity[] {
    const percentages: PercentageEntity[] = []

    // Pattern: "5%", "10퍼센트", "10 퍼"
    const percentPattern = /(\d+(?:\.\d+)?)\s*(%|퍼센트|퍼)/gi
    let match
    while ((match = percentPattern.exec(input)) !== null) {
      const value = parseFloat(match[1])

      // Determine context
      let context: PercentageEntity['context'] = 'unknown'
      const beforeText = input.substring(Math.max(0, match.index - 20), match.index)

      if (beforeText.match(/손절|스탑|stop/i)) context = 'stop_loss'
      else if (beforeText.match(/익절|목표|target/i)) context = 'take_profit'
      else if (beforeText.match(/매수|매도|포지션/i)) context = 'position_size'
      else if (beforeText.match(/배분|할당/i)) context = 'allocation'

      percentages.push({
        value,
        original: match[0],
        context,
        confidence: 0.9,
      })
    }

    return percentages
  }

  /**
   * Extract indicator entities
   */
  private extractIndicators(input: string): IndicatorEntity[] {
    const indicators: IndicatorEntity[] = []

    for (const [name, type] of Object.entries(INDICATOR_MAP)) {
      const namePattern = new RegExp(`(\\d+)?\\s*${name}\\s*(\\d+)?`, 'gi')
      let match
      while ((match = namePattern.exec(input)) !== null) {
        const period = parseInt(match[1] || match[2] || '0', 10)

        const params: Record<string, number> = {}
        if (period > 0) {
          params.period = period
        } else {
          // Default periods
          switch (type) {
            case 'rsi': params.period = 14; break
            case 'sma': case 'ema': params.period = 20; break
            case 'bollinger': params.period = 20; params.stdDev = 2; break
            case 'stochastic': params.kPeriod = 14; params.dPeriod = 3; break
            case 'atr': params.period = 14; break
          }
        }

        if (!indicators.find(i => i.type === type)) {
          indicators.push({
            type,
            params,
            original: match[0],
            confidence: 0.9,
          })
        }
      }
    }

    return indicators
  }

  /**
   * Extract timeframe entities
   */
  private extractTimeframes(input: string): TimeframeEntity[] {
    const timeframes: TimeframeEntity[] = []

    for (const [name, value] of Object.entries(TIMEFRAME_MAP)) {
      if (input.includes(name.toLowerCase())) {
        timeframes.push({
          value,
          original: name,
          confidence: 0.95,
        })
      }
    }

    return timeframes
  }

  /**
   * Extract condition entities
   */
  private extractConditions(input: string): ConditionEntity[] {
    const conditions: ConditionEntity[] = []

    // Find operator patterns
    for (const { pattern, operator } of OPERATOR_PATTERNS) {
      const match = input.match(pattern)
      if (match) {
        // Find associated number
        const numberMatch = input.match(/(\d+(?:\.\d+)?)/g)
        const value = numberMatch ? parseFloat(numberMatch[0]) : 0

        // Determine if entry or exit
        const isExit = input.match(/청산|매도|팔|exit/i) !== null
        const type = isExit ? 'exit' : 'entry'

        conditions.push({
          type,
          operator,
          value,
          original: match[0],
          confidence: 0.85,
        })
      }
    }

    return conditions
  }

  /**
   * Extract action entities
   */
  private extractActions(input: string): ActionEntity[] {
    const actions: ActionEntity[] = []

    // Buy patterns
    if (input.match(/매수|사줘|사다|롱|buy|long/i)) {
      actions.push({
        type: 'buy',
        original: input.match(/매수|사줘|사다|롱|buy|long/i)![0],
        confidence: 0.95,
      })
    }

    // Sell patterns
    if (input.match(/매도|팔아|숏|sell|short/i)) {
      actions.push({
        type: 'sell',
        original: input.match(/매도|팔아|숏|sell|short/i)![0],
        confidence: 0.95,
      })
    }

    // Close all patterns
    if (input.match(/전부\s*청산|전량\s*청산|모두\s*청산|close\s*all/i)) {
      actions.push({
        type: 'close_all',
        original: input.match(/전부\s*청산|전량\s*청산|모두\s*청산|close\s*all/i)![0],
        confidence: 0.95,
      })
    }

    return actions
  }

  /**
   * Normalize entities from AI response
   */
  private normalizeEntities(entities: Partial<ExtractedEntities>): ExtractedEntities {
    return {
      symbols: entities.symbols || [],
      prices: entities.prices || [],
      percentages: entities.percentages || [],
      indicators: entities.indicators || [],
      timeframes: entities.timeframes || [],
      conditions: entities.conditions || [],
      actions: entities.actions || [],
    }
  }
}

// ============================================
// Factory Function
// ============================================

export function createIntentParser(options?: { useAI?: boolean; aiEndpoint?: string; aiApiKey?: string }): IntentParser {
  return new IntentParser(options)
}
