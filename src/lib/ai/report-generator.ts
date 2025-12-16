// ============================================
// AI Report Generator
// 시장 분석 & 타점 리포트 자동 생성
// ============================================

import type { Strategy } from '@/types'

// ============================================
// Types
// ============================================

export interface MarketReport {
  id: string
  date: string
  summary: MarketSummary
  hotIssues: HotIssue[]
  entryPoints: EntryPoint[]
  createdAt: Date
  mentorId?: string
}

export interface MarketSummary {
  kospiIndex: number
  kospiChange: number
  kosdaqIndex: number
  kosdaqChange: number
  tradingVolume: number
  volumeVsAverage: number
  hotSectors: SectorInfo[]
  foreignNetBuy: number
  institutionNetBuy: number
}

export interface SectorInfo {
  name: string
  changePercent: number
  leadingStock: string
}

export interface HotIssue {
  title: string
  impact: 'positive' | 'negative' | 'neutral'
  affectedSectors: string[]
  reasoning: string
}

export interface EntryPoint {
  stockCode: string
  stockName: string
  currentPrice: number
  confidence: number // 0-100
  signal: 'buy' | 'sell' | 'hold'
  indicators: EntryIndicators
  reasoning: string
  recommendedEntry: { min: number; max: number }
  targetPrice: number
  stopLoss: number
}

export interface EntryIndicators {
  ma20Above: boolean
  volumeSpike: boolean
  rsiOversold: boolean
  macdCross: boolean
  bollingerBreak?: boolean
}

export interface ReportConfig {
  mentorId?: string
  customPrompt?: string
  focusSectors?: string[]
  minConfidence?: number
}

// ============================================
// AI Report Generator Class
// ============================================

export class AIReportGenerator {
  private apiKey: string | null = null
  private apiEndpoint: string = '/api/ai/generate'

  constructor(config?: { apiKey?: string; apiEndpoint?: string }) {
    this.apiKey = config?.apiKey || null
    this.apiEndpoint = config?.apiEndpoint || '/api/ai/generate'
  }

  /**
   * Generate daily market report
   */
  async generateDailyReport(config?: ReportConfig): Promise<MarketReport> {
    const today = new Date().toISOString().split('T')[0]

    // Fetch market data
    const marketData = await this.fetchMarketData()
    const newsData = await this.fetchNewsData()

    // Generate report using AI
    const report = await this.generateWithAI({
      type: 'daily_report',
      marketData,
      newsData,
      config,
    })

    return {
      id: `report_${Date.now()}`,
      date: today,
      summary: report.summary as MarketSummary,
      hotIssues: report.hotIssues as HotIssue[],
      entryPoints: report.entryPoints as EntryPoint[],
      createdAt: new Date(),
      mentorId: config?.mentorId,
    }
  }

  /**
   * Generate entry point analysis for specific stock
   */
  async analyzeEntryPoint(stockCode: string): Promise<EntryPoint> {
    const stockData = await this.fetchStockData(stockCode)
    const indicators = this.calculateIndicators(stockData)

    const analysis = await this.generateWithAI({
      type: 'entry_analysis',
      stockData,
      indicators,
    })

    return {
      stockCode,
      stockName: stockData.name,
      currentPrice: stockData.currentPrice,
      confidence: analysis.confidence as number,
      signal: analysis.signal as 'buy' | 'sell' | 'hold',
      indicators,
      reasoning: analysis.reasoning as string,
      recommendedEntry: analysis.recommendedEntry as { min: number; max: number },
      targetPrice: analysis.targetPrice as number,
      stopLoss: analysis.stopLoss as number,
    }
  }

  /**
   * Generate strategy from natural language
   */
  async generateStrategy(userInput: string): Promise<Partial<Strategy>> {
    const analysis = await this.generateWithAI({
      type: 'strategy_generation',
      userInput,
    })

    const timeframe = ((analysis.timeframe as string) || '1h') as import('@/types').Timeframe

    return {
      name: analysis.name as string | undefined,
      description: analysis.description as string | undefined,
      config: {
        symbols: (analysis.symbols as string[]) || ['BTC/USDT'],
        timeframe,
        entryConditions: [],
        exitConditions: [],
        riskManagement: {
          stopLoss: (analysis.stopLoss as number) || 5,
          takeProfit: (analysis.takeProfit as number) || 10,
          maxDrawdown: 15,
          maxPositionSize: 20,
        },
        allocation: 10,
      },
    }
  }

  // ============================================
  // Private Methods
  // ============================================

  private async fetchMarketData(): Promise<MarketSummary> {
    // TODO: Implement real market data fetching
    // For MVP, return mock data
    return {
      kospiIndex: 2450.32,
      kospiChange: 0.8,
      kosdaqIndex: 820.15,
      kosdaqChange: 1.2,
      tradingVolume: 8.2,
      volumeVsAverage: 120,
      hotSectors: [
        { name: '2차전지', changePercent: 3.2, leadingStock: 'LG에너지솔루션' },
        { name: '반도체', changePercent: 1.8, leadingStock: '삼성전자' },
        { name: 'AI', changePercent: 2.5, leadingStock: '카카오' },
      ],
      foreignNetBuy: 1200,
      institutionNetBuy: 850,
    }
  }

  private async fetchNewsData(): Promise<HotIssue[]> {
    // TODO: Implement real news crawling
    return [
      {
        title: '미국 연준 금리 동결 발표',
        impact: 'positive',
        affectedSectors: ['금융', '부동산', '성장주'],
        reasoning: '금리 동결로 성장주 밸류에이션 부담 완화, 외국인 매수세 유입 예상',
      },
      {
        title: '삼성전자 HBM3E 양산 시작',
        impact: 'positive',
        affectedSectors: ['반도체', 'AI'],
        reasoning: 'HBM3E 양산으로 AI 서버 수요 대응, 반도체 업종 모멘텀',
      },
    ]
  }

  private async fetchStockData(stockCode: string): Promise<{
    name: string
    currentPrice: number
    prices: number[]
    volumes: number[]
  }> {
    // TODO: Implement real stock data fetching
    return {
      name: stockCode === '005930' ? '삼성전자' : stockCode,
      currentPrice: 71200,
      prices: [70000, 70500, 71000, 71200, 70800, 71500, 71200],
      volumes: [1000000, 1200000, 1500000, 1800000, 1100000, 2000000, 1600000],
    }
  }

  private calculateIndicators(stockData: {
    prices: number[]
    volumes: number[]
  }): EntryIndicators {
    const prices = stockData.prices
    const volumes = stockData.volumes
    const currentPrice = prices[prices.length - 1]

    // Calculate MA20
    const ma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, prices.length)
    const ma20Above = currentPrice > ma20

    // Calculate volume spike
    const avgVolume = volumes.slice(0, -1).reduce((a, b) => a + b, 0) / (volumes.length - 1)
    const volumeSpike = volumes[volumes.length - 1] > avgVolume * 1.5

    // Calculate RSI (simplified)
    const gains: number[] = []
    const losses: number[] = []
    for (let i = 1; i < prices.length; i++) {
      const diff = prices[i] - prices[i - 1]
      if (diff > 0) gains.push(diff)
      else losses.push(Math.abs(diff))
    }
    const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / gains.length : 0
    const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
    const rsi = 100 - 100 / (1 + rs)
    const rsiOversold = rsi < 30

    // MACD cross (simplified)
    const ema12 = prices.slice(-12).reduce((a, b) => a + b, 0) / 12
    const ema26 = prices.slice(-26).reduce((a, b) => a + b, 0) / Math.min(26, prices.length)
    const macd = ema12 - ema26
    const macdCross = macd > 0

    return {
      ma20Above,
      volumeSpike,
      rsiOversold,
      macdCross,
    }
  }

  private async generateWithAI(params: {
    type: string
    [key: string]: unknown
  }): Promise<Record<string, unknown>> {
    // If no API key, use rule-based generation
    if (!this.apiKey) {
      return this.generateRuleBased(params)
    }

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
        },
        body: JSON.stringify(params),
      })

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`)
      }

      return response.json()
    } catch (error) {
      console.warn('[AIReportGenerator] AI generation failed, using rules:', error)
      return this.generateRuleBased(params)
    }
  }

  private generateRuleBased(params: { type: string; [key: string]: unknown }): Record<string, unknown> {
    switch (params.type) {
      case 'daily_report':
        return {
          summary: params.marketData,
          hotIssues: params.newsData || [],
          entryPoints: this.generateMockEntryPoints(),
        }

      case 'entry_analysis':
        const indicators = params.indicators as EntryIndicators
        const signalCount = [
          indicators.ma20Above,
          indicators.volumeSpike,
          indicators.rsiOversold,
          indicators.macdCross,
        ].filter(Boolean).length

        return {
          confidence: signalCount * 25,
          signal: signalCount >= 3 ? 'buy' : signalCount >= 2 ? 'hold' : 'sell',
          reasoning: this.buildReasoning(indicators),
          recommendedEntry: { min: 70800, max: 71500 },
          targetPrice: 75000,
          stopLoss: 69000,
        }

      case 'strategy_generation':
        return {
          name: '자동 생성 전략',
          description: `"${params.userInput}" 기반 전략`,
          symbols: ['BTC/USDT'],
          timeframe: '1h',
          entryConditions: [{ type: 'rsi', operator: 'less_than', value: 30 }],
          exitConditions: [{ type: 'rsi', operator: 'greater_than', value: 70 }],
          stopLoss: 5,
          takeProfit: 10,
        }

      default:
        return {}
    }
  }

  private generateMockEntryPoints(): EntryPoint[] {
    return [
      {
        stockCode: '005930',
        stockName: '삼성전자',
        currentPrice: 71200,
        confidence: 82,
        signal: 'buy',
        indicators: {
          ma20Above: true,
          volumeSpike: true,
          rsiOversold: false,
          macdCross: true,
        },
        reasoning:
          '20일 이평선 골든크로스 발생, 거래량 평균 대비 180% 급증, 외국인 3일 연속 순매수',
        recommendedEntry: { min: 70800, max: 71500 },
        targetPrice: 75000,
        stopLoss: 69000,
      },
      {
        stockCode: '373220',
        stockName: 'LG에너지솔루션',
        currentPrice: 420000,
        confidence: 75,
        signal: 'buy',
        indicators: {
          ma20Above: true,
          volumeSpike: false,
          rsiOversold: true,
          macdCross: true,
        },
        reasoning: 'RSI 과매도 구간에서 반등 시도, MACD 골든크로스 임박',
        recommendedEntry: { min: 415000, max: 425000 },
        targetPrice: 450000,
        stopLoss: 400000,
      },
    ]
  }

  private buildReasoning(indicators: EntryIndicators): string {
    const reasons: string[] = []

    if (indicators.ma20Above) reasons.push('20일 이평선 상향 돌파')
    if (indicators.volumeSpike) reasons.push('거래량 급증 (평균 대비 150%+)')
    if (indicators.rsiOversold) reasons.push('RSI 과매도 구간 진입')
    if (indicators.macdCross) reasons.push('MACD 골든크로스')
    if (indicators.bollingerBreak) reasons.push('볼린저밴드 상단 돌파')

    return reasons.length > 0 ? reasons.join(', ') : '특별한 시그널 없음'
  }
}

// ============================================
// Factory Function
// ============================================

export function createAIReportGenerator(config?: {
  apiKey?: string
  apiEndpoint?: string
}): AIReportGenerator {
  return new AIReportGenerator(config)
}

// ============================================
// Singleton Instance
// ============================================

export const aiReportGenerator = new AIReportGenerator()
