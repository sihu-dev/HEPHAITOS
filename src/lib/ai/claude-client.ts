// ============================================
// Claude API Client
// 시장 분석 및 자연어 처리
// ============================================

/**
 * Claude API Configuration
 */
export interface ClaudeConfig {
  apiKey: string
  model?: 'claude-sonnet-4-5-20250514' | 'claude-3-5-sonnet-20241022' | 'claude-3-haiku-20240307'
  maxTokens?: number
  temperature?: number
}

/**
 * Claude Message Types
 */
export interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ClaudeResponse {
  id: string
  type: 'message'
  role: 'assistant'
  content: { type: 'text'; text: string }[]
  model: string
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence'
  usage: {
    input_tokens: number
    output_tokens: number
  }
}

// ============================================
// Trading Analysis Prompts
// ============================================

export const TRADING_PROMPTS = {
  MARKET_ANALYSIS: `당신은 전문 시장 분석가입니다. 다음 시장 데이터를 분석하고 한국어로 리포트를 작성해주세요.

분석 항목:
1. 전반적인 시장 동향 (3줄 요약)
2. 주요 섹터별 분석
3. 외국인/기관 수급 분석
4. 오늘의 핫 이슈 (뉴스 기반)
5. 주목해야 할 종목 3개 (근거 포함)

형식: 마크다운으로 작성`,

  ENTRY_POINT_ANALYSIS: `당신은 타점 분석 전문가입니다. 다음 종목의 기술적 분석을 수행하고 진입 타점을 제시해주세요.

분석 지표:
- 이동평균선 (20일, 60일, 120일)
- RSI (14일)
- MACD
- 볼린저밴드
- 거래량 분석

결과 형식 (JSON):
{
  "signal": "buy" | "sell" | "hold",
  "confidence": 0-100,
  "reasoning": "근거 설명",
  "recommendedEntry": { "min": 가격, "max": 가격 },
  "targetPrice": 목표가,
  "stopLoss": 손절가,
  "riskRewardRatio": 비율
}`,

  CELEBRITY_TRADE_ANALYSIS: `당신은 기관/유명인 투자 분석가입니다. 다음 거래를 분석해주세요.

분석 항목:
1. 거래 배경 추론 (왜 이 시점에 이 종목을?)
2. 관련 뉴스/이벤트 연결
3. 해당 인물의 투자 스타일 분석
4. 따라 투자 시 리스크 요소
5. 권장 행동 (따라하기/관망/역방향)

형식: 마크다운으로 작성, 객관적이고 분석적인 톤 유지`,

  STRATEGY_GENERATION: `당신은 퀀트 전략가입니다. 사용자의 자연어 설명을 바탕으로 트레이딩 전략을 생성해주세요.

결과 형식 (JSON):
{
  "name": "전략 이름",
  "description": "전략 설명",
  "symbols": ["심볼 목록"],
  "timeframe": "1m|5m|15m|30m|1h|4h|1d",
  "entryConditions": [
    { "type": "rsi|macd|ma|volume|bollinger", "operator": "less_than|greater_than|cross_above|cross_below", "value": 값 }
  ],
  "exitConditions": [...],
  "riskManagement": {
    "stopLoss": 퍼센트,
    "takeProfit": 퍼센트,
    "maxPositionSize": 퍼센트
  }
}`,

  PORTFOLIO_ADVISOR: `당신은 포트폴리오 어드바이저입니다. 사용자의 현재 포트폴리오와 투자 목표를 분석하고 조언해주세요.

분석 항목:
1. 현재 포트폴리오 진단
2. 섹터별 비중 분석
3. 리스크 평가 (변동성, 집중도)
4. 개선 제안 (구체적인 조정 방안)
5. 참고할 유명인 포트폴리오 추천

형식: 마크다운, 실행 가능한 조언 중심`,
}

// ============================================
// Claude API Client
// ============================================

export class ClaudeClient {
  private apiKey: string
  private model: string
  private maxTokens: number
  private temperature: number
  private baseUrl = 'https://api.anthropic.com/v1'

  constructor(config: ClaudeConfig) {
    this.apiKey = config.apiKey
    this.model = config.model || 'claude-sonnet-4-5-20250514'
    this.maxTokens = config.maxTokens || 4096
    this.temperature = config.temperature || 0.7
  }

  /**
   * Send message to Claude
   */
  async chat(
    messages: ClaudeMessage[],
    options?: {
      systemPrompt?: string
      maxTokens?: number
      temperature?: number
    }
  ): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: options?.maxTokens || this.maxTokens,
          temperature: options?.temperature || this.temperature,
          system: options?.systemPrompt || 'You are a helpful trading assistant.',
          messages: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || `API error: ${response.status}`)
      }

      const data: ClaudeResponse = await response.json()
      return data.content[0]?.text || ''
    } catch (error) {
      console.error('[Claude] API call failed:', error)
      throw error
    }
  }

  /**
   * Generate market analysis report
   */
  async analyzeMarket(marketData: {
    kospiIndex: number
    kospiChange: number
    kosdaqIndex: number
    kosdaqChange: number
    tradingVolume: number
    hotSectors: string[]
    foreignNetBuy: number
    institutionNetBuy: number
    topNews: string[]
  }): Promise<string> {
    const prompt = `${TRADING_PROMPTS.MARKET_ANALYSIS}

시장 데이터:
- 코스피: ${marketData.kospiIndex.toLocaleString()} (${marketData.kospiChange > 0 ? '+' : ''}${marketData.kospiChange}%)
- 코스닥: ${marketData.kosdaqIndex.toLocaleString()} (${marketData.kosdaqChange > 0 ? '+' : ''}${marketData.kosdaqChange}%)
- 거래대금: ${marketData.tradingVolume}조원
- 급등 섹터: ${marketData.hotSectors.join(', ')}
- 외국인 순매수: ${marketData.foreignNetBuy}억원
- 기관 순매수: ${marketData.institutionNetBuy}억원

주요 뉴스:
${marketData.topNews.map((n, i) => `${i + 1}. ${n}`).join('\n')}`

    return this.chat([{ role: 'user', content: prompt }])
  }

  /**
   * Analyze entry point for a stock
   */
  async analyzeEntryPoint(stockData: {
    symbol: string
    name: string
    currentPrice: number
    prices: number[]
    volumes: number[]
    indicators?: {
      rsi?: number
      macd?: number
      ma20?: number
      ma60?: number
    }
  }): Promise<{
    signal: 'buy' | 'sell' | 'hold'
    confidence: number
    reasoning: string
    recommendedEntry: { min: number; max: number }
    targetPrice: number
    stopLoss: number
  }> {
    const prompt = `${TRADING_PROMPTS.ENTRY_POINT_ANALYSIS}

종목 정보:
- 심볼: ${stockData.symbol}
- 이름: ${stockData.name}
- 현재가: ${stockData.currentPrice.toLocaleString()}원

최근 가격 (7일): ${stockData.prices.slice(-7).join(', ')}
최근 거래량 (7일): ${stockData.volumes.slice(-7).join(', ')}

${stockData.indicators ? `기술적 지표:
- RSI(14): ${stockData.indicators.rsi || 'N/A'}
- MACD: ${stockData.indicators.macd || 'N/A'}
- 20일 이평선: ${stockData.indicators.ma20?.toLocaleString() || 'N/A'}
- 60일 이평선: ${stockData.indicators.ma60?.toLocaleString() || 'N/A'}` : ''}`

    const response = await this.chat([{ role: 'user', content: prompt }], {
      temperature: 0.3, // Lower temperature for more consistent analysis
    })

    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch {
      // Fallback parsing
    }

    // Default response if parsing fails
    return {
      signal: 'hold',
      confidence: 50,
      reasoning: response,
      recommendedEntry: { min: stockData.currentPrice * 0.98, max: stockData.currentPrice * 1.02 },
      targetPrice: stockData.currentPrice * 1.1,
      stopLoss: stockData.currentPrice * 0.95,
    }
  }

  /**
   * Analyze celebrity trade
   */
  async analyzeCelebrityTrade(tradeData: {
    celebrity: string
    ticker: string
    company: string
    action: 'buy' | 'sell'
    amount: string
    date: string
    recentNews?: string[]
  }): Promise<string> {
    const prompt = `${TRADING_PROMPTS.CELEBRITY_TRADE_ANALYSIS}

거래 정보:
- 투자자: ${tradeData.celebrity}
- 종목: ${tradeData.company} (${tradeData.ticker})
- 거래 유형: ${tradeData.action === 'buy' ? '매수' : '매도'}
- 거래 규모: ${tradeData.amount}
- 거래일: ${tradeData.date}

${tradeData.recentNews ? `관련 뉴스:
${tradeData.recentNews.map((n, i) => `${i + 1}. ${n}`).join('\n')}` : ''}`

    return this.chat([{ role: 'user', content: prompt }])
  }

  /**
   * Generate trading strategy from natural language
   */
  async generateStrategy(userInput: string): Promise<{
    name: string
    description: string
    symbols: string[]
    timeframe: string
    entryConditions: { type: string; operator: string; value: number }[]
    exitConditions: { type: string; operator: string; value: number }[]
    riskManagement: {
      stopLoss: number
      takeProfit: number
      maxPositionSize: number
    }
  }> {
    const prompt = `${TRADING_PROMPTS.STRATEGY_GENERATION}

사용자 요청:
"${userInput}"`

    const response = await this.chat([{ role: 'user', content: prompt }], {
      temperature: 0.5,
    })

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch {
      // Fallback
    }

    // Default strategy
    return {
      name: '자동 생성 전략',
      description: userInput,
      symbols: ['BTC/USDT'],
      timeframe: '1h',
      entryConditions: [{ type: 'rsi', operator: 'less_than', value: 30 }],
      exitConditions: [{ type: 'rsi', operator: 'greater_than', value: 70 }],
      riskManagement: {
        stopLoss: 5,
        takeProfit: 10,
        maxPositionSize: 20,
      },
    }
  }

  /**
   * Get portfolio advice
   */
  async getPortfolioAdvice(portfolio: {
    holdings: { symbol: string; value: number; weight: number }[]
    totalValue: number
    investmentGoal: string
    riskTolerance: 'aggressive' | 'moderate' | 'conservative'
  }): Promise<string> {
    const prompt = `${TRADING_PROMPTS.PORTFOLIO_ADVISOR}

포트폴리오 현황:
- 총 자산: ${portfolio.totalValue.toLocaleString()}원
- 투자 목표: ${portfolio.investmentGoal}
- 위험 성향: ${portfolio.riskTolerance === 'aggressive' ? '공격적' : portfolio.riskTolerance === 'moderate' ? '중립' : '보수적'}

보유 종목:
${portfolio.holdings.map(h => `- ${h.symbol}: ${h.value.toLocaleString()}원 (${h.weight.toFixed(1)}%)`).join('\n')}`

    return this.chat([{ role: 'user', content: prompt }])
  }
}

// ============================================
// Factory & Singleton
// ============================================

let _claudeClient: ClaudeClient | null = null

export function createClaudeClient(config: ClaudeConfig): ClaudeClient {
  return new ClaudeClient(config)
}

export function getClaudeClient(): ClaudeClient | null {
  return _claudeClient
}

export function initClaudeClient(config: ClaudeConfig): ClaudeClient {
  _claudeClient = createClaudeClient(config)
  return _claudeClient
}

// ============================================
// API Route Helper
// ============================================

export async function callClaude(
  prompt: string,
  options?: {
    systemPrompt?: string
    maxTokens?: number
  }
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }

  const client = createClaudeClient({ apiKey })
  return client.chat([{ role: 'user', content: prompt }], options)
}
