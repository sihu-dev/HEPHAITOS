// ============================================
// Celebrity Portfolio Mirroring
// 유명인 포트폴리오 추적 및 미러링 (실제 API 연동)
// ============================================

import { generateId } from '@/lib/utils'
import { safeLogger } from '@/lib/utils/safe-logger'
import {
  secClient,
  congressClient,
  arkClient,
  FAMOUS_INVESTOR_CIKS,
  type SEC13FHolding,
  type CongressTrade,
} from './api-sources'

// ============================================
// Types
// ============================================

export interface CelebrityProfile {
  id: string
  name: string
  nameKr: string
  type: 'politician' | 'investor' | 'fund_manager' | 'influencer'
  description: string
  imageUrl?: string
  dataSource: 'sec_13f' | 'congress_disclosure' | 'public_filing' | 'manual'
  updateFrequency: 'realtime' | '45days' | 'quarterly' | 'manual'
}

export interface CelebrityPortfolio {
  celebrityId: string
  holdings: PortfolioHolding[]
  performance: PortfolioPerformance
  lastUpdated: Date
  nextUpdateExpected?: Date
}

export interface PortfolioHolding {
  symbol: string
  name: string
  shares: number
  weight: number // Percentage of portfolio
  currentPrice: number
  currentValue: number
  changePercent: number
  sector?: string
}

export interface PortfolioPerformance {
  ytd: number
  oneMonth: number
  threeMonth: number
  oneYear: number
  threeYear?: number
  sharpeRatio?: number
  maxDrawdown?: number
}

export interface TradeActivity {
  id: string
  celebrityId: string
  symbol: string
  name: string
  action: 'buy' | 'sell'
  shares: number
  price: number
  value: number
  date: Date
  reportedDate: Date
  reasoning?: string
}

export interface MirrorConfig {
  userId: string
  celebrityId: string
  investmentAmount: number
  autoMirror: boolean
  minTradeValue?: number
  excludeSymbols?: string[]
  notifyOnTrade: boolean
}

// ============================================
// Celebrity Data
// ============================================

const CELEBRITIES: CelebrityProfile[] = [
  // US Politicians
  {
    id: 'nancy_pelosi',
    name: 'Nancy Pelosi',
    nameKr: '낸시 펠로시',
    type: 'politician',
    description: '전 미국 하원의장, 2024년 수익률 73%',
    dataSource: 'congress_disclosure',
    updateFrequency: '45days',
  },
  {
    id: 'dan_crenshaw',
    name: 'Dan Crenshaw',
    nameKr: '댄 크렌쇼',
    type: 'politician',
    description: '미국 하원의원, 공화당',
    dataSource: 'congress_disclosure',
    updateFrequency: '45days',
  },

  // Legendary Investors
  {
    id: 'warren_buffett',
    name: 'Warren Buffett',
    nameKr: '워렌 버핏',
    type: 'investor',
    description: '버크셔 해서웨이 회장, 오마하의 현인',
    dataSource: 'sec_13f',
    updateFrequency: 'quarterly',
  },
  {
    id: 'michael_burry',
    name: 'Michael Burry',
    nameKr: '마이클 버리',
    type: 'investor',
    description: 'Scion Asset Management, 빅쇼트',
    dataSource: 'sec_13f',
    updateFrequency: 'quarterly',
  },
  {
    id: 'cathie_wood',
    name: 'Cathie Wood',
    nameKr: '캐시 우드',
    type: 'fund_manager',
    description: 'ARK Invest CEO, 혁신기업 투자',
    dataSource: 'public_filing',
    updateFrequency: 'realtime',
  },

  // Korean Investors (mock)
  {
    id: 'john_lee',
    name: 'John Lee',
    nameKr: '존리',
    type: 'fund_manager',
    description: '메리츠자산운용, 장기투자 전도사',
    dataSource: 'manual',
    updateFrequency: 'manual',
  },
]

// Mock portfolio data
const MOCK_PORTFOLIOS: Record<string, CelebrityPortfolio> = {
  nancy_pelosi: {
    celebrityId: 'nancy_pelosi',
    holdings: [
      { symbol: 'NVDA', name: 'NVIDIA', shares: 500, weight: 25.3, currentPrice: 875, currentValue: 437500, changePercent: 8.5, sector: 'Technology' },
      { symbol: 'AAPL', name: 'Apple', shares: 1000, weight: 20.1, currentPrice: 178, currentValue: 178000, changePercent: 2.3, sector: 'Technology' },
      { symbol: 'MSFT', name: 'Microsoft', shares: 400, weight: 18.2, currentPrice: 410, currentValue: 164000, changePercent: 5.1, sector: 'Technology' },
      { symbol: 'GOOGL', name: 'Alphabet', shares: 600, weight: 12.4, currentPrice: 142, currentValue: 85200, changePercent: -1.2, sector: 'Technology' },
      { symbol: 'META', name: 'Meta', shares: 300, weight: 10.8, currentPrice: 520, currentValue: 156000, changePercent: 12.4, sector: 'Technology' },
    ],
    performance: { ytd: 73, oneMonth: 8.5, threeMonth: 22.1, oneYear: 85.3, sharpeRatio: 2.1, maxDrawdown: -8.5 },
    lastUpdated: new Date(),
    nextUpdateExpected: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
  },
  warren_buffett: {
    celebrityId: 'warren_buffett',
    holdings: [
      { symbol: 'AAPL', name: 'Apple', shares: 905000000, weight: 42.8, currentPrice: 178, currentValue: 161090000000, changePercent: 2.3, sector: 'Technology' },
      { symbol: 'BAC', name: 'Bank of America', shares: 1032000000, weight: 10.1, currentPrice: 34, currentValue: 35088000000, changePercent: -3.2, sector: 'Financials' },
      { symbol: 'AXP', name: 'American Express', shares: 151610000, weight: 8.5, currentPrice: 230, currentValue: 34870300000, changePercent: 5.8, sector: 'Financials' },
      { symbol: 'CVX', name: 'Chevron', shares: 126093000, weight: 5.8, currentPrice: 152, currentValue: 19166136000, changePercent: -1.5, sector: 'Energy' },
      { symbol: 'KO', name: 'Coca-Cola', shares: 400000000, weight: 5.5, currentPrice: 62, currentValue: 24800000000, changePercent: 1.2, sector: 'Consumer' },
    ],
    performance: { ytd: 12.5, oneMonth: 2.1, threeMonth: 5.8, oneYear: 18.2, threeYear: 45.6, sharpeRatio: 1.5, maxDrawdown: -12.3 },
    lastUpdated: new Date(),
    nextUpdateExpected: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  },
  michael_burry: {
    celebrityId: 'michael_burry',
    holdings: [
      { symbol: 'BABA', name: 'Alibaba', shares: 50000, weight: 15.2, currentPrice: 78, currentValue: 3900000, changePercent: -5.3, sector: 'Technology' },
      { symbol: 'JD', name: 'JD.com', shares: 100000, weight: 12.8, currentPrice: 28, currentValue: 2800000, changePercent: -8.1, sector: 'Consumer' },
      { symbol: 'GEO', name: 'GEO Group', shares: 500000, weight: 10.5, currentPrice: 15, currentValue: 7500000, changePercent: 22.4, sector: 'REIT' },
    ],
    performance: { ytd: -8.2, oneMonth: -3.5, threeMonth: 5.2, oneYear: -12.1, sharpeRatio: 0.8, maxDrawdown: -25.6 },
    lastUpdated: new Date(),
    nextUpdateExpected: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  },
  cathie_wood: {
    celebrityId: 'cathie_wood',
    holdings: [
      { symbol: 'TSLA', name: 'Tesla', shares: 2500000, weight: 12.5, currentPrice: 250, currentValue: 625000000, changePercent: 15.3, sector: 'Auto' },
      { symbol: 'COIN', name: 'Coinbase', shares: 3000000, weight: 8.2, currentPrice: 180, currentValue: 540000000, changePercent: 45.2, sector: 'Fintech' },
      { symbol: 'ROKU', name: 'Roku', shares: 4000000, weight: 6.8, currentPrice: 85, currentValue: 340000000, changePercent: -12.1, sector: 'Technology' },
      { symbol: 'PATH', name: 'UiPath', shares: 8000000, weight: 5.5, currentPrice: 18, currentValue: 144000000, changePercent: -8.5, sector: 'Technology' },
      { symbol: 'PLTR', name: 'Palantir', shares: 5000000, weight: 5.2, currentPrice: 22, currentValue: 110000000, changePercent: 35.8, sector: 'Technology' },
    ],
    performance: { ytd: 45.2, oneMonth: 12.3, threeMonth: 28.5, oneYear: 62.1, sharpeRatio: 1.8, maxDrawdown: -35.2 },
    lastUpdated: new Date(),
    nextUpdateExpected: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
  },
}

// Mock trade activities
const MOCK_TRADES: TradeActivity[] = [
  {
    id: generateId('trade'),
    celebrityId: 'nancy_pelosi',
    symbol: 'NVDA',
    name: 'NVIDIA',
    action: 'buy',
    shares: 50,
    price: 875.32,
    value: 43766,
    date: new Date('2025-12-10'),
    reportedDate: new Date('2025-12-11'),
    reasoning: 'AI Policy Committee 소속, AI 투자 확대 기대',
  },
  {
    id: generateId('trade'),
    celebrityId: 'cathie_wood',
    symbol: 'TSLA',
    name: 'Tesla',
    action: 'buy',
    shares: 100000,
    price: 248.50,
    value: 24850000,
    date: new Date('2025-12-11'),
    reportedDate: new Date('2025-12-11'),
    reasoning: 'FSD 발전 및 로보택시 기대감',
  },
  {
    id: generateId('trade'),
    celebrityId: 'michael_burry',
    symbol: 'NVDA',
    name: 'NVIDIA',
    action: 'sell',
    shares: 35000,
    price: 870.00,
    value: 30450000,
    date: new Date('2025-12-09'),
    reportedDate: new Date('2025-12-10'),
    reasoning: 'AI 버블 경고, 차익실현',
  },
]

// ============================================
// Celebrity Portfolio Manager (API 연동)
// ============================================

export class CelebrityPortfolioManager {
  private mirrorConfigs: Map<string, MirrorConfig> = new Map()
  private portfolioCache: Map<string, { data: CelebrityPortfolio; timestamp: number }> = new Map()
  private tradeCache: Map<string, { data: TradeActivity[]; timestamp: number }> = new Map()
  private readonly CACHE_TTL = 60 * 60 * 1000 // 1 hour

  /**
   * Get all available celebrities
   */
  getCelebrities(): CelebrityProfile[] {
    return CELEBRITIES
  }

  /**
   * Get celebrity by ID
   */
  getCelebrity(celebrityId: string): CelebrityProfile | null {
    return CELEBRITIES.find((c) => c.id === celebrityId) || null
  }

  /**
   * Get portfolio for celebrity (실제 API 호출 + 캐싱)
   */
  async getPortfolioAsync(celebrityId: string): Promise<CelebrityPortfolio | null> {
    // Check cache first
    const cached = this.portfolioCache.get(celebrityId)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data
    }

    const celebrity = this.getCelebrity(celebrityId)
    if (!celebrity) return null

    try {
      let portfolio: CelebrityPortfolio | null = null

      switch (celebrity.dataSource) {
        case 'sec_13f':
          portfolio = await this.fetchSEC13FPortfolio(celebrityId)
          break
        case 'congress_disclosure':
          portfolio = await this.fetchCongressPortfolio(celebrityId)
          break
        case 'public_filing':
          portfolio = await this.fetchPublicFilingPortfolio(celebrityId)
          break
        default:
          portfolio = MOCK_PORTFOLIOS[celebrityId] || null
      }

      if (portfolio) {
        this.portfolioCache.set(celebrityId, { data: portfolio, timestamp: Date.now() })
      }

      return portfolio
    } catch (error) {
      safeLogger.error('[CelebrityPortfolio] Failed to fetch portfolio', { celebrityId, error })
      // Fallback to mock data
      return MOCK_PORTFOLIOS[celebrityId] || null
    }
  }

  /**
   * Get portfolio (동기 버전 - Mock 데이터 사용)
   */
  getPortfolio(celebrityId: string): CelebrityPortfolio | null {
    return MOCK_PORTFOLIOS[celebrityId] || null
  }

  /**
   * SEC 13F 데이터에서 포트폴리오 가져오기
   */
  private async fetchSEC13FPortfolio(celebrityId: string): Promise<CelebrityPortfolio | null> {
    const investorInfo = FAMOUS_INVESTOR_CIKS[celebrityId]
    if (!investorInfo) {
      safeLogger.warn('[CelebrityPortfolio] No CIK found for investor', { celebrityId })
      return MOCK_PORTFOLIOS[celebrityId] || null
    }

    try {
      // Get recent filings
      const filings = await secClient.search13F(investorInfo.cik)
      if (filings.length === 0) {
        return MOCK_PORTFOLIOS[celebrityId] || null
      }

      // Get holdings from most recent filing
      const latestFiling = filings[0]
      const holdings = await secClient.get13FHoldings(latestFiling.accessionNumber)

      if (holdings.length === 0) {
        return MOCK_PORTFOLIOS[celebrityId] || null
      }

      // Convert to portfolio format
      const portfolio = this.convertSEC13FToPortfolio(celebrityId, holdings, latestFiling.filingDate)

      safeLogger.info('[CelebrityPortfolio] Fetched SEC 13F portfolio', {
        celebrityId,
        holdingsCount: holdings.length,
        filingDate: latestFiling.filingDate,
      })

      return portfolio
    } catch (error) {
      safeLogger.error('[CelebrityPortfolio] SEC 13F fetch failed', { celebrityId, error })
      return MOCK_PORTFOLIOS[celebrityId] || null
    }
  }

  /**
   * Congress Disclosure 데이터에서 포트폴리오 가져오기
   */
  private async fetchCongressPortfolio(celebrityId: string): Promise<CelebrityPortfolio | null> {
    const celebrity = this.getCelebrity(celebrityId)
    if (!celebrity) return null

    try {
      const trades = await congressClient.getTradesByPolitician(celebrity.name, 50)

      if (trades.length === 0) {
        return MOCK_PORTFOLIOS[celebrityId] || null
      }

      // Convert trades to estimated portfolio
      const portfolio = this.estimatePortfolioFromTrades(celebrityId, trades)

      safeLogger.info('[CelebrityPortfolio] Estimated portfolio from Congress trades', {
        celebrityId,
        tradesCount: trades.length,
      })

      return portfolio
    } catch (error) {
      safeLogger.error('[CelebrityPortfolio] Congress portfolio fetch failed', { celebrityId, error })
      return MOCK_PORTFOLIOS[celebrityId] || null
    }
  }

  /**
   * Public Filing (ARK Invest 등) 데이터에서 포트폴리오 가져오기
   */
  private async fetchPublicFilingPortfolio(celebrityId: string): Promise<CelebrityPortfolio | null> {
    if (celebrityId === 'cathie_wood') {
      try {
        const holdings = await arkClient.getHoldings('ARKK')

        if (holdings.length === 0) {
          return MOCK_PORTFOLIOS[celebrityId] || null
        }

        const portfolioHoldings: PortfolioHolding[] = holdings.map((h) => ({
          symbol: h.ticker,
          name: h.company,
          shares: h.shares,
          weight: h.weight,
          currentPrice: h.marketValue / h.shares,
          currentValue: h.marketValue,
          changePercent: 0, // ARK doesn't provide this in CSV
          sector: 'Technology', // Default
        }))

        safeLogger.info('[CelebrityPortfolio] Fetched ARK holdings', {
          celebrityId,
          holdingsCount: holdings.length,
        })

        return {
          celebrityId,
          holdings: portfolioHoldings.slice(0, 10),
          performance: MOCK_PORTFOLIOS[celebrityId]?.performance || {
            ytd: 0,
            oneMonth: 0,
            threeMonth: 0,
            oneYear: 0,
          },
          lastUpdated: new Date(),
          nextUpdateExpected: new Date(Date.now() + 24 * 60 * 60 * 1000),
        }
      } catch (error) {
        safeLogger.error('[CelebrityPortfolio] ARK fetch failed', { error })
        return MOCK_PORTFOLIOS[celebrityId] || null
      }
    }

    return MOCK_PORTFOLIOS[celebrityId] || null
  }

  /**
   * SEC 13F 홀딩스를 포트폴리오 형식으로 변환
   */
  private convertSEC13FToPortfolio(
    celebrityId: string,
    holdings: SEC13FHolding[],
    filingDate: string
  ): CelebrityPortfolio {
    const totalValue = holdings.reduce((sum, h) => sum + h.value * 1000, 0) // value is in thousands

    const portfolioHoldings: PortfolioHolding[] = holdings
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
      .map((h) => ({
        symbol: h.cusip, // In reality, would need CUSIP → ticker mapping
        name: h.nameOfIssuer,
        shares: h.shares,
        weight: totalValue > 0 ? ((h.value * 1000) / totalValue) * 100 : 0,
        currentPrice: h.shares > 0 ? (h.value * 1000) / h.shares : 0,
        currentValue: h.value * 1000,
        changePercent: 0, // 13F doesn't include this
        sector: this.inferSector(h.nameOfIssuer),
      }))

    return {
      celebrityId,
      holdings: portfolioHoldings,
      performance: MOCK_PORTFOLIOS[celebrityId]?.performance || {
        ytd: 0,
        oneMonth: 0,
        threeMonth: 0,
        oneYear: 0,
      },
      lastUpdated: new Date(filingDate),
      nextUpdateExpected: new Date(new Date(filingDate).getTime() + 90 * 24 * 60 * 60 * 1000),
    }
  }

  /**
   * Congress 거래 내역에서 포트폴리오 추정
   */
  private estimatePortfolioFromTrades(
    celebrityId: string,
    trades: CongressTrade[]
  ): CelebrityPortfolio {
    // Group by ticker and calculate net position
    const positions = new Map<string, { ticker: string; name: string; netValue: number }>()

    for (const trade of trades) {
      const existing = positions.get(trade.ticker) || {
        ticker: trade.ticker,
        name: trade.assetDescription,
        netValue: 0,
      }

      const avgValue = (trade.amountMin + trade.amountMax) / 2
      existing.netValue += trade.type === 'purchase' ? avgValue : -avgValue

      positions.set(trade.ticker, existing)
    }

    // Filter positive positions
    const activePositions = Array.from(positions.values())
      .filter((p) => p.netValue > 0)
      .sort((a, b) => b.netValue - a.netValue)

    const totalValue = activePositions.reduce((sum, p) => sum + p.netValue, 0)

    const holdings: PortfolioHolding[] = activePositions.slice(0, 10).map((p) => ({
      symbol: p.ticker,
      name: p.name,
      shares: 0, // Congress disclosure doesn't provide exact shares
      weight: totalValue > 0 ? (p.netValue / totalValue) * 100 : 0,
      currentPrice: 0,
      currentValue: p.netValue,
      changePercent: 0,
      sector: this.inferSector(p.name),
    }))

    return {
      celebrityId,
      holdings,
      performance: MOCK_PORTFOLIOS[celebrityId]?.performance || {
        ytd: 0,
        oneMonth: 0,
        threeMonth: 0,
        oneYear: 0,
      },
      lastUpdated: new Date(),
      nextUpdateExpected: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    }
  }

  /**
   * 회사명에서 섹터 추론
   */
  private inferSector(companyName: string): string {
    const name = companyName.toLowerCase()
    if (name.includes('apple') || name.includes('microsoft') || name.includes('nvidia') || name.includes('google') || name.includes('meta')) {
      return 'Technology'
    }
    if (name.includes('bank') || name.includes('capital') || name.includes('financial')) {
      return 'Financials'
    }
    if (name.includes('energy') || name.includes('oil') || name.includes('chevron')) {
      return 'Energy'
    }
    if (name.includes('pharma') || name.includes('health') || name.includes('medical')) {
      return 'Healthcare'
    }
    return 'Other'
  }

  /**
   * Get recent trades for celebrity (실제 API + Mock)
   */
  async getTradesAsync(celebrityId: string, limit?: number): Promise<TradeActivity[]> {
    // Check cache first
    const cached = this.tradeCache.get(celebrityId)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return limit ? cached.data.slice(0, limit) : cached.data
    }

    const celebrity = this.getCelebrity(celebrityId)
    if (!celebrity) return []

    try {
      let trades: TradeActivity[] = []

      if (celebrity.dataSource === 'congress_disclosure') {
        const congressTrades = await congressClient.getTradesByPolitician(celebrity.name, 20)
        trades = congressTrades.map((t) => this.convertCongressTrade(celebrityId, t))
      } else {
        // For SEC 13F and others, use mock data (real trades would require comparing filings)
        trades = MOCK_TRADES.filter((t) => t.celebrityId === celebrityId)
      }

      this.tradeCache.set(celebrityId, { data: trades, timestamp: Date.now() })

      return limit ? trades.slice(0, limit) : trades
    } catch (error) {
      safeLogger.error('[CelebrityPortfolio] Failed to fetch trades', { celebrityId, error })
      return this.getTrades(celebrityId, limit)
    }
  }

  /**
   * Get recent trades (동기 버전 - Mock)
   */
  getTrades(celebrityId: string, limit?: number): TradeActivity[] {
    const trades = MOCK_TRADES.filter((t) => t.celebrityId === celebrityId)
      .sort((a, b) => b.date.getTime() - a.date.getTime())

    return limit ? trades.slice(0, limit) : trades
  }

  /**
   * Get all recent trades (실제 API)
   */
  async getAllRecentTradesAsync(limit: number = 10): Promise<TradeActivity[]> {
    try {
      const congressTrades = await congressClient.getRecentTrades(limit * 2)

      const trades: TradeActivity[] = congressTrades.map((t) => {
        const celebrity = CELEBRITIES.find((c) =>
          c.name.toLowerCase().includes(t.politician.toLowerCase().split(' ')[1] || '')
        )
        return this.convertCongressTrade(celebrity?.id || 'unknown', t)
      })

      return trades.slice(0, limit)
    } catch (error) {
      safeLogger.error('[CelebrityPortfolio] Failed to fetch all trades', { error })
      return this.getAllRecentTrades(limit)
    }
  }

  /**
   * Get all recent trades (동기 버전 - Mock)
   */
  getAllRecentTrades(limit: number = 10): TradeActivity[] {
    return MOCK_TRADES.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, limit)
  }

  /**
   * Congress 거래를 TradeActivity로 변환
   */
  private convertCongressTrade(celebrityId: string, trade: CongressTrade): TradeActivity {
    return {
      id: generateId('trade'),
      celebrityId,
      symbol: trade.ticker,
      name: trade.assetDescription,
      action: trade.type === 'purchase' ? 'buy' : 'sell',
      shares: 0, // Congress doesn't disclose exact shares
      price: 0,
      value: (trade.amountMin + trade.amountMax) / 2,
      date: new Date(trade.transactionDate),
      reportedDate: new Date(trade.disclosureDate),
      reasoning: `${trade.owner === 'spouse' ? '배우자' : '본인'} 거래, ${trade.amount}`,
    }
  }

  /**
   * Clear cache (for testing/refresh)
   */
  clearCache(): void {
    this.portfolioCache.clear()
    this.tradeCache.clear()
  }

  /**
   * Configure mirror for user
   */
  setupMirror(config: MirrorConfig): void {
    const key = `${config.userId}_${config.celebrityId}`
    this.mirrorConfigs.set(key, config)
  }

  /**
   * Get mirror config
   */
  getMirrorConfig(userId: string, celebrityId: string): MirrorConfig | null {
    const key = `${userId}_${celebrityId}`
    return this.mirrorConfigs.get(key) || null
  }

  /**
   * Calculate mirror portfolio
   */
  calculateMirrorPortfolio(
    celebrityId: string,
    investmentAmount: number
  ): { symbol: string; shares: number; value: number }[] {
    const portfolio = this.getPortfolio(celebrityId)
    if (!portfolio) return []

    return portfolio.holdings.map((holding) => {
      const allocatedValue = (investmentAmount * holding.weight) / 100
      const shares = Math.floor(allocatedValue / holding.currentPrice)
      return {
        symbol: holding.symbol,
        shares,
        value: shares * holding.currentPrice,
      }
    })
  }

  /**
   * Compare portfolios
   */
  comparePortfolios(
    celebrityId: string,
    userHoldings: { symbol: string; value: number }[]
  ): {
    symbol: string
    celebrityWeight: number
    userWeight: number
    difference: number
    suggestion: 'buy' | 'sell' | 'hold'
  }[] {
    const portfolio = this.getPortfolio(celebrityId)
    if (!portfolio) return []

    const userTotal = userHoldings.reduce((sum, h) => sum + h.value, 0)
    const userWeights = new Map(
      userHoldings.map((h) => [h.symbol, (h.value / userTotal) * 100])
    )

    return portfolio.holdings.map((holding) => {
      const userWeight = userWeights.get(holding.symbol) || 0
      const difference = holding.weight - userWeight

      let suggestion: 'buy' | 'sell' | 'hold' = 'hold'
      if (difference > 5) suggestion = 'buy'
      else if (difference < -5) suggestion = 'sell'

      return {
        symbol: holding.symbol,
        celebrityWeight: holding.weight,
        userWeight,
        difference,
        suggestion,
      }
    })
  }

  /**
   * Analyze trade reasoning with AI (Claude API 연동)
   */
  async analyzeTradeReasoning(trade: TradeActivity): Promise<string> {
    const celebrity = this.getCelebrity(trade.celebrityId)
    if (!celebrity) {
      return `${trade.name}에 대한 ${trade.action === 'buy' ? '매수' : '매도'} 거래입니다.`
    }

    try {
      // Lazy import to avoid circular dependency
      const { tradeAnalyzer, formatAnalysisResult } = await import('@/lib/ai/trade-analyzer')

      const result = await tradeAnalyzer.analyzeTradeDeep(trade, celebrity)
      return formatAnalysisResult(result)
    } catch (error) {
      safeLogger.warn('[CelebrityPortfolio] AI analysis failed, using fallback', { error })

      // Fallback to static analysis
      return this.getFallbackAnalysis(trade, celebrity)
    }
  }

  /**
   * Fallback 분석 (API 실패 시)
   */
  private getFallbackAnalysis(trade: TradeActivity, celebrity: CelebrityProfile): string {
    const typeText = {
      politician: '정치인',
      investor: '투자자',
      fund_manager: '펀드 매니저',
      influencer: '인플루언서',
    }

    return `## 거래 분석: ${trade.name} (${trade.symbol})

### 요약
${celebrity.nameKr}(${typeText[celebrity.type]})의 ${trade.name} ${trade.action === 'buy' ? '매수' : '매도'} 거래입니다.

### 배경
- 데이터 소스: ${celebrity.dataSource}
- 업데이트 주기: ${celebrity.updateFrequency}

### 리스크 요소
- ${celebrity.updateFrequency === '45days' ? '45일 공시 지연으로 이미 가격 반영 가능' : '공시 지연 가능성'}
- 개인 투자 판단 필요

### 권장 행동
**관망 권장** - 추가 분석 필요

---
*이 분석은 교육 목적으로만 제공되며, 투자 조언이 아닙니다.*`
  }
}

// ============================================
// Singleton Instance
// ============================================

export const celebrityPortfolioManager = new CelebrityPortfolioManager()

// ============================================
// Helper Functions
// ============================================

export function formatPortfolioChange(change: number): string {
  const sign = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(2)}%`
}

export function getUpdateFrequencyText(frequency: CelebrityProfile['updateFrequency']): string {
  const texts: Record<CelebrityProfile['updateFrequency'], string> = {
    realtime: '실시간',
    '45days': '45일 지연',
    quarterly: '분기별',
    manual: '수동 업데이트',
  }
  return texts[frequency]
}
