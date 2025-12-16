// ============================================
// Claude API Provider
// Anthropic Claude를 활용한 AI 서비스
// ============================================

import Anthropic from '@anthropic-ai/sdk'
import { requireClaudeConfig } from '@/lib/config/env'

// ============================================
// Types
// ============================================

export interface StrategyGenerationRequest {
  prompt: string // 자연어 전략 설명
  context?: {
    symbol?: string
    timeframe?: string
    riskLevel?: 'conservative' | 'moderate' | 'aggressive'
  }
}

export interface StrategyGenerationResponse {
  strategyName: string
  description: string
  entryConditions: StrategyCondition[]
  exitConditions: StrategyCondition[]
  riskManagement: RiskManagement
  indicators: IndicatorConfig[]
  code?: string // 생성된 전략 코드
}

export interface StrategyCondition {
  type: 'indicator' | 'price' | 'time' | 'volume'
  indicator?: string
  operator: '>' | '<' | '>=' | '<=' | '==' | 'crosses_above' | 'crosses_below'
  value: number | string
  description: string
}

export interface RiskManagement {
  stopLossPercent: number
  takeProfitPercent: number
  maxPositionSize: number
  maxDrawdown: number
}

export interface IndicatorConfig {
  type: string
  period?: number
  params?: Record<string, number>
}

export interface MarketAnalysisRequest {
  symbol: string
  data: {
    ohlcv: Array<{ open: number; high: number; low: number; close: number; volume: number }>
    indicators?: Record<string, number[]>
  }
  analysisType: 'technical' | 'sentiment' | 'comprehensive'
}

export interface MarketAnalysisResponse {
  summary: string
  trend: 'bullish' | 'bearish' | 'neutral'
  strength: number // 0-100
  keyLevels: {
    support: number[]
    resistance: number[]
  }
  signals: {
    type: 'buy' | 'sell' | 'hold'
    confidence: number
    reasoning: string
  }[]
  recommendations: string[]
}

export interface AITutorRequest {
  question: string
  context?: {
    topic?: string
    userLevel?: 'beginner' | 'intermediate' | 'advanced'
    previousMessages?: Array<{ role: 'user' | 'assistant'; content: string }>
  }
}

export interface AITutorResponse {
  answer: string
  followUpQuestions?: string[]
  relatedTopics?: string[]
  references?: string[]
}

// ============================================
// Claude Client
// ============================================

class ClaudeProvider {
  private client: Anthropic | null = null
  private models = {
    fast: 'claude-sonnet-4-20250514',
    analysis: 'claude-opus-4-20250514',
  }

  /**
   * Lazy initialization with validation
   */
  private getClient(): Anthropic {
    if (!this.client) {
      const { apiKey } = requireClaudeConfig()
      this.client = new Anthropic({ apiKey })
    }
    return this.client
  }

  /**
   * JSON 파싱 헬퍼 (에러 로깅 강화)
   */
  private parseJsonResponse<T>(text: string, errorContext: string): T {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error(`[Claude] Failed to parse JSON response for ${errorContext}:`, text.slice(0, 200))
      throw new Error(`Failed to parse ${errorContext} response - no JSON found`)
    }
    try {
      return JSON.parse(jsonMatch[0]) as T
    } catch (parseError) {
      console.error(`[Claude] JSON parse error for ${errorContext}:`, parseError)
      throw new Error(`Failed to parse ${errorContext} response - invalid JSON`)
    }
  }

  // ============================================
  // Strategy Generation
  // ============================================

  async generateStrategy(request: StrategyGenerationRequest): Promise<StrategyGenerationResponse> {
    const systemPrompt = `당신은 HEPHAITOS의 전략 생성 엔진입니다.
사용자의 자연어 설명을 분석하여 실행 가능한 트레이딩 전략으로 변환합니다.

응답 형식 (JSON):
{
  "strategyName": "전략 이름",
  "description": "전략 설명",
  "entryConditions": [
    {"type": "indicator", "indicator": "RSI", "operator": "<", "value": 30, "description": "RSI가 30 이하일 때"}
  ],
  "exitConditions": [
    {"type": "indicator", "indicator": "RSI", "operator": ">", "value": 70, "description": "RSI가 70 이상일 때"}
  ],
  "riskManagement": {
    "stopLossPercent": 2,
    "takeProfitPercent": 6,
    "maxPositionSize": 10,
    "maxDrawdown": 10
  },
  "indicators": [
    {"type": "RSI", "period": 14}
  ]
}

중요 규칙:
1. 항상 유효한 JSON 형식으로 응답
2. 사용 가능한 지표: SMA, EMA, RSI, MACD, Bollinger, ATR, Stochastic, CCI, ADX
3. 리스크 관리는 보수적으로 설정 (손절 2-5%, 익절 4-15%)
4. 사용자의 리스크 성향을 반영`

    const userPrompt = `전략 요청: "${request.prompt}"
${request.context?.symbol ? `종목: ${request.context.symbol}` : ''}
${request.context?.timeframe ? `타임프레임: ${request.context.timeframe}` : ''}
${request.context?.riskLevel ? `리스크 성향: ${request.context.riskLevel}` : ''}

위 요청을 분석하여 트레이딩 전략을 JSON 형식으로 생성해주세요.`

    const response = await this.getClient().messages.create({
      model: this.models.fast,
      max_tokens: 2048,
      messages: [
        { role: 'user', content: userPrompt }
      ],
      system: systemPrompt,
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    return this.parseJsonResponse<StrategyGenerationResponse>(content.text, 'strategy generation')
  }

  // ============================================
  // Market Analysis
  // ============================================

  async analyzeMarket(request: MarketAnalysisRequest): Promise<MarketAnalysisResponse> {
    const systemPrompt = `당신은 HEPHAITOS의 시장 분석 AI입니다.
제공된 OHLCV 데이터와 지표를 분석하여 전문적인 시장 분석을 제공합니다.

응답 형식 (JSON):
{
  "summary": "시장 요약",
  "trend": "bullish|bearish|neutral",
  "strength": 75,
  "keyLevels": {
    "support": [100.0, 95.0],
    "resistance": [110.0, 115.0]
  },
  "signals": [
    {"type": "buy|sell|hold", "confidence": 80, "reasoning": "근거"}
  ],
  "recommendations": ["추천사항1", "추천사항2"]
}

중요 규칙:
1. 객관적인 기술적 분석에 기반
2. 투자 조언이 아닌 교육적 정보 제공
3. 신뢰도(confidence)는 보수적으로 평가
4. 항상 리스크 경고 포함`

    const recentData = request.data.ohlcv.slice(-20)
    const userPrompt = `${request.symbol} 시장 분석 요청

최근 20일 데이터:
${recentData.map((d, i) => `Day ${i + 1}: O=${d.open} H=${d.high} L=${d.low} C=${d.close} V=${d.volume}`).join('\n')}

${request.data.indicators ? `지표 데이터: ${JSON.stringify(request.data.indicators)}` : ''}

분석 유형: ${request.analysisType}

위 데이터를 분석하여 JSON 형식으로 응답해주세요.`

    const response = await this.getClient().messages.create({
      model: this.models.analysis,
      max_tokens: 2048,
      messages: [
        { role: 'user', content: userPrompt }
      ],
      system: systemPrompt,
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    return this.parseJsonResponse<MarketAnalysisResponse>(content.text, 'market analysis')
  }

  // ============================================
  // AI Tutor
  // ============================================

  async askTutor(request: AITutorRequest): Promise<AITutorResponse> {
    const systemPrompt = `당신은 HEPHAITOS의 AI 투자 튜터입니다.
사용자의 투자 관련 질문에 친절하고 교육적으로 답변합니다.

역할:
1. 투자/트레이딩 개념 설명
2. 기술적 분석 교육
3. 전략 구현 가이드
4. 리스크 관리 조언

중요 규칙:
1. 항상 교육적 관점에서 답변
2. 특정 종목 추천 금지
3. "투자 조언이 아닙니다" 명시
4. 초보자도 이해할 수 있게 설명
5. ${request.context?.userLevel === 'beginner' ? '쉬운 용어 사용' : request.context?.userLevel === 'advanced' ? '전문 용어 사용 가능' : '적절한 수준의 설명'}

응답 형식 (JSON):
{
  "answer": "답변 내용",
  "followUpQuestions": ["후속 질문1", "후속 질문2"],
  "relatedTopics": ["관련 주제1", "관련 주제2"],
  "references": ["참고 자료"]
}`

    const messages: Anthropic.MessageParam[] = []

    // 이전 대화 컨텍스트 추가
    if (request.context?.previousMessages) {
      for (const msg of request.context.previousMessages) {
        messages.push({
          role: msg.role,
          content: msg.content,
        })
      }
    }

    messages.push({
      role: 'user',
      content: request.question,
    })

    const response = await this.getClient().messages.create({
      model: this.models.fast,
      max_tokens: 2048,
      messages,
      system: systemPrompt,
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    // JSON이 아닌 경우 텍스트 응답으로 fallback
    try {
      return this.parseJsonResponse<AITutorResponse>(content.text, 'ai tutor')
    } catch {
      return {
        answer: content.text,
        followUpQuestions: [],
        relatedTopics: [],
      }
    }
  }

  // ============================================
  // Backtest Report
  // ============================================

  async generateBacktestReport(
    strategyName: string,
    metrics: Record<string, number>,
    trades: Array<{ pnl: number; side: string; entryReason?: string }>
  ): Promise<string> {
    const systemPrompt = `당신은 HEPHAITOS의 백테스트 분석가입니다.
백테스트 결과를 분석하여 이해하기 쉬운 리포트를 작성합니다.

리포트 구성:
1. 전략 성과 요약
2. 주요 지표 해석
3. 강점 및 약점
4. 개선 제안
5. 리스크 경고

중요: 과거 성과가 미래 수익을 보장하지 않음을 명시`

    const userPrompt = `백테스트 리포트 생성 요청

전략명: ${strategyName}

주요 지표:
- 총 수익률: ${metrics.totalReturnPercent?.toFixed(2)}%
- 승률: ${metrics.winRate?.toFixed(2)}%
- 샤프 비율: ${metrics.sharpeRatio?.toFixed(2)}
- 최대 낙폭: ${metrics.maxDrawdownPercent?.toFixed(2)}%
- 총 거래 수: ${metrics.totalTrades}

최근 거래 요약:
${trades.slice(-10).map((t, i) => `${i + 1}. ${t.side} - PnL: ${t.pnl.toFixed(2)} (${t.entryReason || 'N/A'})`).join('\n')}

위 데이터를 바탕으로 한국어로 이해하기 쉬운 백테스트 리포트를 작성해주세요.`

    const response = await this.getClient().messages.create({
      model: this.models.fast,
      max_tokens: 2048,
      messages: [
        { role: 'user', content: userPrompt }
      ],
      system: systemPrompt,
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    return content.text
  }
}

// ============================================
// Singleton Export
// ============================================

export const claudeProvider = new ClaudeProvider()
export default claudeProvider
