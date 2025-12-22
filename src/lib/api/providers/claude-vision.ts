// ============================================
// Claude Vision API Provider
// Anthropic Claude Vision을 활용한 차트 이미지 분석
// ============================================

import Anthropic from '@anthropic-ai/sdk'
import { requireClaudeConfig } from '@/lib/config/env'

// ============================================
// Types
// ============================================

export interface ChartAnalysisRequest {
  chartImageBase64: string
  symbol: string
  timeframe?: string
  question?: string
}

export interface ChartAnalysisResponse {
  trend: 'uptrend' | 'downtrend' | 'sideways'
  strength: number // 0-100
  support: number[]
  resistance: number[]
  patterns: CandlePattern[]
  recommendation: {
    action: 'buy' | 'sell' | 'hold' | 'wait'
    reasoning: string
    confidence: number // 0-100
  }
  volume_analysis: string
  risk_level: 'low' | 'medium' | 'high'
  disclaimer: string
}

export interface CandlePattern {
  name: string // "doji", "hammer", "engulfing", "shooting_star", etc.
  type: 'bullish' | 'bearish' | 'neutral'
  description: string
  confidence: number // 0-100
}

// ============================================
// Claude Vision Provider
// ============================================

class ClaudeVisionProvider {
  private client: Anthropic | null = null
  private model = 'claude-sonnet-4-20250514'

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
      console.error(`[Claude Vision] Failed to parse JSON response for ${errorContext}:`, text.slice(0, 200))
      throw new Error(`Failed to parse ${errorContext} response - no JSON found`)
    }
    try {
      return JSON.parse(jsonMatch[0]) as T
    } catch (parseError) {
      console.error(`[Claude Vision] JSON parse error for ${errorContext}:`, parseError)
      throw new Error(`Failed to parse ${errorContext} response - invalid JSON`)
    }
  }

  // ============================================
  // Chart Image Analysis
  // ============================================

  async analyzeChartImage(request: ChartAnalysisRequest): Promise<ChartAnalysisResponse> {
    const defaultQuestion = "이 차트를 분석하여 매매 타이밍을 알려주세요"
    const question = request.question || defaultQuestion

    const systemPrompt = `당신은 HEPHAITOS의 차트 분석 AI입니다.
제공된 트레이딩 차트 이미지를 분석하여 전문적인 기술적 분석을 제공합니다.

응답 형식 (JSON):
{
  "trend": "uptrend|downtrend|sideways",
  "strength": 75,
  "support": [100.0, 95.0],
  "resistance": [110.0, 115.0],
  "patterns": [
    {
      "name": "doji",
      "type": "neutral",
      "description": "도지 캔들 패턴이 나타났습니다",
      "confidence": 80
    }
  ],
  "recommendation": {
    "action": "buy|sell|hold|wait",
    "reasoning": "근거 설명",
    "confidence": 70
  },
  "volume_analysis": "거래량 분석 내용",
  "risk_level": "low|medium|high",
  "disclaimer": "이 분석은 교육 목적으로만 제공되며, 투자 조언이 아닙니다. 과거 성과는 미래 수익을 보장하지 않습니다."
}

분석 항목:
1. 추세 (Trend): 상승/하락/횡보 추세 식별
2. 추세 강도 (Strength): 0-100 점수
3. 지지선 (Support): 주요 지지 가격대 (최대 3개)
4. 저항선 (Resistance): 주요 저항 가격대 (최대 3개)
5. 캔들 패턴 (Patterns): 도지, 해머, 엔걸핑, 샛별, 역망치 등
6. 거래량 분석 (Volume): 거래량 패턴 분석
7. 매매 추천 (Recommendation): buy/sell/hold/wait
8. 리스크 수준 (Risk Level): low/medium/high

중요 규칙 (법률 준수):
1. 항상 "~할 수 있습니다", "~로 판단됩니다" 표현 사용
2. "참고용", "교육 목적" 명시
3. 투자 조언 표현 절대 금지 ("사세요", "팔세요" 금지)
4. 면책조항 필수 포함
5. 리스크 경고 포함`

    const userPrompt = `${question}

종목: ${request.symbol}
${request.timeframe ? `타임프레임: ${request.timeframe}` : ''}

주요 분석 항목:
1. 추세선 (상승/하락/횡보)
2. 지지/저항선 (구체적인 가격 수준)
3. 캔들 패턴 (도지, 해머, 엔걸핑, 샛별 등)
4. 거래량 분석
5. 매매 타이밍 (진입/청산 추천)

법률 준수 필수:
- "~할 수 있습니다", "참고용" 표현만 사용
- 투자 조언 금지
- 면책조항 포함

위 항목들을 분석하여 JSON 형식으로 응답해주세요.`

    const response = await this.getClient().messages.create({
      model: this.model,
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: request.chartImageBase64,
            },
          },
          {
            type: 'text',
            text: userPrompt,
          }
        ]
      }],
      system: systemPrompt,
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude Vision API')
    }

    const analysis = this.parseJsonResponse<ChartAnalysisResponse>(content.text, 'chart analysis')

    // 법률 준수: 면책조항이 없으면 추가
    if (!analysis.disclaimer) {
      analysis.disclaimer = "이 분석은 교육 목적으로만 제공되며, 투자 조언이 아닙니다. 과거 성과는 미래 수익을 보장하지 않습니다."
    }

    return analysis
  }

  // ============================================
  // Pattern Recognition (패턴 인식)
  // ============================================

  async recognizePatterns(chartImageBase64: string): Promise<CandlePattern[]> {
    const systemPrompt = `당신은 캔들 패턴 전문가입니다.
차트 이미지에서 캔들 패턴을 인식하여 JSON 배열로 반환합니다.

응답 형식:
[
  {
    "name": "doji",
    "type": "neutral",
    "description": "도지 캔들이 나타났습니다",
    "confidence": 85
  }
]

인식 가능한 패턴:
- 도지 (doji)
- 해머 (hammer)
- 역망치 (inverted_hammer)
- 엔걸핑 (engulfing)
- 샛별 (shooting_star)
- 잠자리 (dragonfly)
- 비석 (gravestone)
- 십자선 (spinning_top)`

    const response = await this.getClient().messages.create({
      model: this.model,
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: chartImageBase64,
            },
          },
          {
            type: 'text',
            text: '차트에서 캔들 패턴을 인식하여 JSON 배열로 반환해주세요.',
          }
        ]
      }],
      system: systemPrompt,
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    return this.parseJsonResponse<CandlePattern[]>(content.text, 'pattern recognition')
  }

  // ============================================
  // Support/Resistance Detection
  // ============================================

  async detectLevels(chartImageBase64: string): Promise<{ support: number[]; resistance: number[] }> {
    const systemPrompt = `당신은 지지/저항선 분석 전문가입니다.
차트 이미지에서 주요 지지선과 저항선을 식별합니다.

응답 형식 (JSON):
{
  "support": [100.0, 95.0, 90.0],
  "resistance": [110.0, 115.0, 120.0]
}

각 배열은 강한 순서로 정렬되며, 최대 3개까지 반환합니다.`

    const response = await this.getClient().messages.create({
      model: this.model,
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: chartImageBase64,
            },
          },
          {
            type: 'text',
            text: '차트에서 주요 지지선과 저항선을 식별하여 JSON으로 반환해주세요.',
          }
        ]
      }],
      system: systemPrompt,
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    return this.parseJsonResponse<{ support: number[]; resistance: number[] }>(
      content.text,
      'level detection'
    )
  }
}

// ============================================
// Singleton Export
// ============================================

export const claudeVisionProvider = new ClaudeVisionProvider()
export default claudeVisionProvider
