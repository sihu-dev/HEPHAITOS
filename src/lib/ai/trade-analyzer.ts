// ============================================
// Trade Analyzer Service
// Claude API를 활용한 거래 분석 서비스
// ============================================

import { safeLogger } from '@/lib/utils/safe-logger'
import type { TradeActivity, CelebrityProfile, PortfolioHolding } from '@/lib/mirroring'
import { callClaude, TRADING_PROMPTS } from './claude-client'

// ============================================
// Types
// ============================================

export interface TradeAnalysisResult {
  summary: string
  background: string
  reasoning: string
  risks: string[]
  recommendation: 'follow' | 'observe' | 'avoid'
  confidence: number
  relatedNews?: string[]
  historicalPattern?: string
}

export interface PortfolioComparisonResult {
  overlapScore: number
  deviations: {
    symbol: string
    celebrityWeight: number
    userWeight: number
    action: 'buy' | 'sell' | 'hold'
    priority: 'high' | 'medium' | 'low'
  }[]
  aiAnalysis: string
  suggestedChanges: {
    symbol: string
    action: 'buy' | 'sell'
    targetWeight: number
    reasoning: string
  }[]
}

export interface MirrorOpportunityAlert {
  celebrity: CelebrityProfile
  trade: TradeActivity
  analysis: TradeAnalysisResult
  urgency: 'immediate' | 'standard' | 'low'
  createdAt: Date
}

// ============================================
// Prompts for Trade Analysis
// ============================================

const TRADE_ANALYSIS_PROMPTS = {
  CELEBRITY_TRADE_DEEP: `당신은 기관투자자 및 유명인 투자 전문 분석가입니다. 거래를 심층 분석해주세요.

분석 형식 (JSON):
{
  "summary": "1-2문장 요약",
  "background": "거래 배경 (시장 상황, 해당 인물의 투자 이력)",
  "reasoning": "거래 이유 추론 (정책, 실적, 업계 동향 기반)",
  "risks": ["리스크 요소 1", "리스크 요소 2"],
  "recommendation": "follow|observe|avoid",
  "confidence": 0-100,
  "historicalPattern": "해당 인물의 과거 유사 거래 패턴"
}

주의:
- 45일 공시 지연으로 인해 이미 가격에 반영되었을 수 있습니다
- 투자 조언이 아닌 교육적 분석임을 명시하세요`,

  PORTFOLIO_MIRROR_ANALYSIS: `당신은 포트폴리오 미러링 전문가입니다. 사용자 포트폴리오와 유명인 포트폴리오를 비교 분석해주세요.

분석 형식 (JSON):
{
  "overlapScore": 0-100,
  "aiAnalysis": "전체 분석 요약",
  "suggestedChanges": [
    {
      "symbol": "종목코드",
      "action": "buy|sell",
      "targetWeight": 목표비중,
      "reasoning": "조정 이유"
    }
  ]
}

주의:
- 투자 조언이 아닌 교육 목적의 비교 분석입니다
- 개인의 투자 성향과 자금 규모를 고려해야 합니다`,

  TRADE_TIMING_ANALYSIS: `당신은 타이밍 분석 전문가입니다. 유명인의 거래 타이밍을 분석해주세요.

분석 항목:
1. 거래 시점의 시장 상황
2. 실적 발표, 배당일, 주요 이벤트와의 관계
3. 기술적 지표 상의 위치
4. 과거 유사 타이밍의 결과

형식: 마크다운`,
}

// ============================================
// Trade Analyzer Class
// ============================================

export class TradeAnalyzer {
  private cache: Map<string, { result: TradeAnalysisResult; timestamp: number }> = new Map()
  private readonly CACHE_TTL = 60 * 60 * 1000 // 1 hour

  /**
   * 셀럽 거래 심층 분석
   */
  async analyzeTradeDeep(
    trade: TradeActivity,
    celebrity: CelebrityProfile,
    additionalContext?: {
      recentNews?: string[]
      marketCondition?: string
      stockPrice?: number
    }
  ): Promise<TradeAnalysisResult> {
    // Check cache
    const cacheKey = `${trade.id}_${celebrity.id}`
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.result
    }

    const prompt = `${TRADE_ANALYSIS_PROMPTS.CELEBRITY_TRADE_DEEP}

거래 정보:
- 투자자: ${celebrity.name} (${celebrity.nameKr})
- 투자자 유형: ${this.getInvestorTypeKr(celebrity.type)}
- 종목: ${trade.name} (${trade.symbol})
- 거래 유형: ${trade.action === 'buy' ? '매수' : '매도'}
- 거래 금액: $${trade.value.toLocaleString()}
- 거래일: ${trade.date.toISOString().split('T')[0]}
- 공시일: ${trade.reportedDate.toISOString().split('T')[0]}

데이터 소스: ${celebrity.dataSource}
업데이트 주기: ${celebrity.updateFrequency}

${additionalContext?.recentNews ? `관련 뉴스:
${additionalContext.recentNews.map((n, i) => `${i + 1}. ${n}`).join('\n')}` : ''}

${additionalContext?.marketCondition ? `시장 상황: ${additionalContext.marketCondition}` : ''}
${additionalContext?.stockPrice ? `현재 주가: $${additionalContext.stockPrice}` : ''}`

    try {
      const response = await callClaude(prompt, {
        systemPrompt: '당신은 기관투자자 분석 전문가입니다. JSON 형식으로 응답해주세요.',
        maxTokens: 2048,
      })

      const result = this.parseAnalysisResult(response)

      // Cache result
      this.cache.set(cacheKey, { result, timestamp: Date.now() })

      safeLogger.info('[TradeAnalyzer] Analysis completed', {
        tradeId: trade.id,
        celebrityId: celebrity.id,
        recommendation: result.recommendation,
      })

      return result
    } catch (error) {
      safeLogger.error('[TradeAnalyzer] Analysis failed', { error, tradeId: trade.id })

      // Return default result on error
      return {
        summary: `${celebrity.nameKr}의 ${trade.name} ${trade.action === 'buy' ? '매수' : '매도'} 거래입니다.`,
        background: '분석을 수행할 수 없습니다.',
        reasoning: trade.reasoning || '거래 이유 정보 없음',
        risks: ['45일 공시 지연으로 이미 가격 반영 가능', 'API 에러로 상세 분석 불가'],
        recommendation: 'observe',
        confidence: 30,
      }
    }
  }

  /**
   * 포트폴리오 미러링 분석
   */
  async analyzePortfolioMirror(
    userPortfolio: PortfolioHolding[],
    celebrityPortfolio: PortfolioHolding[],
    celebrity: CelebrityProfile,
    investmentAmount: number
  ): Promise<PortfolioComparisonResult> {
    const userTotal = userPortfolio.reduce((sum, h) => sum + h.currentValue, 0)
    const celebrityTotal = celebrityPortfolio.reduce((sum, h) => sum + h.currentValue, 0)

    // Calculate deviations
    const deviations: PortfolioComparisonResult['deviations'] = []
    const allSymbols = new Set([
      ...userPortfolio.map((h) => h.symbol),
      ...celebrityPortfolio.map((h) => h.symbol),
    ])

    for (const symbol of allSymbols) {
      const userHolding = userPortfolio.find((h) => h.symbol === symbol)
      const celHolding = celebrityPortfolio.find((h) => h.symbol === symbol)

      const userWeight = userHolding ? (userHolding.currentValue / userTotal) * 100 : 0
      const celWeight = celHolding ? celHolding.weight : 0
      const diff = celWeight - userWeight

      let action: 'buy' | 'sell' | 'hold' = 'hold'
      let priority: 'high' | 'medium' | 'low' = 'low'

      if (diff > 10) {
        action = 'buy'
        priority = 'high'
      } else if (diff > 5) {
        action = 'buy'
        priority = 'medium'
      } else if (diff < -10) {
        action = 'sell'
        priority = 'high'
      } else if (diff < -5) {
        action = 'sell'
        priority = 'medium'
      }

      if (action !== 'hold') {
        deviations.push({
          symbol,
          celebrityWeight: celWeight,
          userWeight,
          action,
          priority,
        })
      }
    }

    // Calculate overlap score
    const overlapScore = 100 - (deviations.filter((d) => d.priority === 'high').length * 20)

    // Get AI analysis
    const prompt = `${TRADE_ANALYSIS_PROMPTS.PORTFOLIO_MIRROR_ANALYSIS}

셀럽: ${celebrity.name} (${celebrity.nameKr})
투자자 유형: ${this.getInvestorTypeKr(celebrity.type)}

셀럽 포트폴리오 (상위 5개):
${celebrityPortfolio.slice(0, 5).map((h) => `- ${h.symbol}: ${h.weight.toFixed(1)}%`).join('\n')}

사용자 포트폴리오:
${userPortfolio.map((h) => `- ${h.symbol}: ${((h.currentValue / userTotal) * 100).toFixed(1)}%`).join('\n')}

투자 가능 금액: $${investmentAmount.toLocaleString()}`

    try {
      const response = await callClaude(prompt, { maxTokens: 1024 })
      const parsed = this.parseJSON(response)

      // Type-safe extraction
      const parsedOverlapScore = typeof parsed.overlapScore === 'number' ? parsed.overlapScore : overlapScore
      const parsedAiAnalysis = typeof parsed.aiAnalysis === 'string' ? parsed.aiAnalysis : '포트폴리오 비교 분석을 수행했습니다.'
      const defaultChanges = deviations
        .filter((d) => d.priority !== 'low')
        .map((d) => ({
          symbol: d.symbol,
          action: d.action as 'buy' | 'sell',
          targetWeight: d.celebrityWeight,
          reasoning: `${d.action === 'buy' ? '비중 증가' : '비중 감소'} 권장`,
        }))
      const parsedChanges = Array.isArray(parsed.suggestedChanges) ? parsed.suggestedChanges as typeof defaultChanges : defaultChanges

      return {
        overlapScore: parsedOverlapScore,
        deviations,
        aiAnalysis: parsedAiAnalysis,
        suggestedChanges: parsedChanges,
      }
    } catch (error) {
      safeLogger.error('[TradeAnalyzer] Portfolio analysis failed', { error })

      return {
        overlapScore,
        deviations,
        aiAnalysis: '상세 분석을 수행할 수 없습니다.',
        suggestedChanges: [],
      }
    }
  }

  /**
   * 거래 타이밍 분석
   */
  async analyzeTradeTimingMarkdown(
    trade: TradeActivity,
    celebrity: CelebrityProfile,
    marketData?: {
      priceAtTrade?: number
      currentPrice?: number
      marketTrend?: 'bull' | 'bear' | 'sideways'
      upcomingEvents?: string[]
    }
  ): Promise<string> {
    const prompt = `${TRADE_ANALYSIS_PROMPTS.TRADE_TIMING_ANALYSIS}

거래 정보:
- 투자자: ${celebrity.name} (${celebrity.nameKr})
- 종목: ${trade.name} (${trade.symbol})
- 거래: ${trade.action === 'buy' ? '매수' : '매도'}
- 거래일: ${trade.date.toISOString().split('T')[0]}

${marketData?.priceAtTrade ? `거래 시점 주가: $${marketData.priceAtTrade}` : ''}
${marketData?.currentPrice ? `현재 주가: $${marketData.currentPrice}` : ''}
${marketData?.marketTrend ? `시장 추세: ${marketData.marketTrend === 'bull' ? '상승' : marketData.marketTrend === 'bear' ? '하락' : '횡보'}` : ''}
${marketData?.upcomingEvents?.length ? `다가오는 이벤트: ${marketData.upcomingEvents.join(', ')}` : ''}`

    try {
      return await callClaude(prompt, { maxTokens: 1024 })
    } catch (error) {
      safeLogger.error('[TradeAnalyzer] Timing analysis failed', { error })
      return `## ${trade.name} 타이밍 분석\n\n분석을 수행할 수 없습니다.`
    }
  }

  /**
   * 미러 기회 알림 생성
   */
  async generateMirrorAlert(
    trade: TradeActivity,
    celebrity: CelebrityProfile
  ): Promise<MirrorOpportunityAlert> {
    const analysis = await this.analyzeTradeDeep(trade, celebrity)

    // Determine urgency based on confidence and recommendation
    let urgency: MirrorOpportunityAlert['urgency'] = 'standard'
    if (analysis.confidence >= 80 && analysis.recommendation === 'follow') {
      urgency = 'immediate'
    } else if (analysis.confidence < 50 || analysis.recommendation === 'avoid') {
      urgency = 'low'
    }

    return {
      celebrity,
      trade,
      analysis,
      urgency,
      createdAt: new Date(),
    }
  }

  /**
   * 캐시 클리어
   */
  clearCache(): void {
    this.cache.clear()
  }

  // ============================================
  // Private Helpers
  // ============================================

  private getInvestorTypeKr(type: CelebrityProfile['type']): string {
    const types: Record<CelebrityProfile['type'], string> = {
      politician: '정치인',
      investor: '투자자',
      fund_manager: '펀드 매니저',
      influencer: '인플루언서',
    }
    return types[type]
  }

  private parseAnalysisResult(response: string): TradeAnalysisResult {
    const parsed = this.parseJSON(response)

    // Type-safe extraction helpers
    const getString = (value: unknown, fallback: string): string =>
      typeof value === 'string' ? value : fallback
    const getNumber = (value: unknown, fallback: number): number =>
      typeof value === 'number' ? value : fallback
    const getStringArray = (value: unknown, fallback: string[]): string[] =>
      Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : fallback
    const getRecommendation = (value: unknown): 'follow' | 'observe' | 'avoid' => {
      if (value === 'follow' || value === 'observe' || value === 'avoid') return value
      return 'observe'
    }

    return {
      summary: getString(parsed.summary, '분석 요약 없음'),
      background: getString(parsed.background, '배경 정보 없음'),
      reasoning: getString(parsed.reasoning, '추론 정보 없음'),
      risks: getStringArray(parsed.risks, ['정보 없음']),
      recommendation: getRecommendation(parsed.recommendation),
      confidence: getNumber(parsed.confidence, 50),
      relatedNews: Array.isArray(parsed.relatedNews) ? parsed.relatedNews.filter((v): v is string => typeof v === 'string') : undefined,
      historicalPattern: typeof parsed.historicalPattern === 'string' ? parsed.historicalPattern : undefined,
    }
  }

  private parseJSON(response: string): Record<string, unknown> {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch {
      // Parsing failed
    }
    return {}
  }
}

// ============================================
// Singleton Instance
// ============================================

export const tradeAnalyzer = new TradeAnalyzer()

// ============================================
// Helper Functions
// ============================================

export function formatAnalysisResult(result: TradeAnalysisResult): string {
  const recommendationText = {
    follow: '따라 투자 고려',
    observe: '관망 권장',
    avoid: '회피 권장',
  }

  return `## 거래 분석 결과

### 요약
${result.summary}

### 배경
${result.background}

### 추론
${result.reasoning}

### 리스크 요소
${result.risks.map((r) => `- ${r}`).join('\n')}

### 권장 행동
**${recommendationText[result.recommendation]}** (신뢰도: ${result.confidence}%)

${result.historicalPattern ? `### 과거 패턴\n${result.historicalPattern}` : ''}

---
*이 분석은 교육 목적으로만 제공되며, 투자 조언이 아닙니다.*`
}
