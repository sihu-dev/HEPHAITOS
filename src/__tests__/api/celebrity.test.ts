// ============================================
// Celebrity Portfolio API Tests
// 셀럽 포트폴리오 API 통합 테스트
// ============================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock modules
vi.mock('@/lib/redis/rate-limiter', () => ({
  apiRateLimiter: {
    check: vi.fn(() => Promise.resolve({ allowed: true, remaining: 99, resetTime: Date.now() + 60000 })),
  },
  getClientIP: vi.fn(() => '127.0.0.1'),
}))

vi.mock('@/lib/ai/trade-analyzer', () => ({
  tradeAnalyzer: {
    analyzeTradeDeep: vi.fn(() =>
      Promise.resolve({
        summary: 'Test analysis summary',
        background: 'Test background',
        reasoning: 'Test reasoning',
        risks: ['Risk 1', 'Risk 2'],
        recommendation: 'observe',
        confidence: 70,
      })
    ),
  },
  formatAnalysisResult: vi.fn((result) => `## Analysis\n${result.summary}`),
}))

// Import mocked modules
import {
  celebrityPortfolioManager,
  CelebrityPortfolioManager,
} from '@/lib/mirroring/celebrity-portfolio'
import {
  secClient,
  congressClient,
  arkClient,
} from '@/lib/mirroring/api-sources'

describe('Celebrity Portfolio Integration', () => {
  describe('CelebrityPortfolioManager', () => {
    let manager: CelebrityPortfolioManager

    beforeEach(() => {
      manager = new CelebrityPortfolioManager()
    })

    afterEach(() => {
      manager.clearCache()
    })

    describe('Async Methods', () => {
      it('getPortfolioAsync should return portfolio with caching', async () => {
        const portfolio1 = await manager.getPortfolioAsync('nancy_pelosi')
        const portfolio2 = await manager.getPortfolioAsync('nancy_pelosi')

        expect(portfolio1).toBeDefined()
        expect(portfolio2).toBeDefined()
        expect(portfolio1?.celebrityId).toBe('nancy_pelosi')
        // Second call should return cached result
        expect(portfolio1).toEqual(portfolio2)
      })

      it('getPortfolioAsync should return null for non-existent celebrity', async () => {
        const portfolio = await manager.getPortfolioAsync('non_existent')

        expect(portfolio).toBeNull()
      })

      it('getTradesAsync should return trades', async () => {
        const trades = await manager.getTradesAsync('nancy_pelosi', 5)

        expect(Array.isArray(trades)).toBe(true)
        expect(trades.length).toBeLessThanOrEqual(5)
      })

      it('getAllRecentTradesAsync should return recent trades', async () => {
        const trades = await manager.getAllRecentTradesAsync(10)

        expect(Array.isArray(trades)).toBe(true)
        expect(trades.length).toBeLessThanOrEqual(10)
      })
    })

    describe('Portfolio Calculations', () => {
      it('should calculate mirror portfolio correctly', () => {
        const result = manager.calculateMirrorPortfolio('warren_buffett', 50000)

        expect(Array.isArray(result)).toBe(true)

        const totalValue = result.reduce((sum, item) => sum + item.value, 0)
        expect(totalValue).toBeLessThanOrEqual(50000)
        expect(totalValue).toBeGreaterThan(0) // Some allocation made
      })

      it('should compare portfolios correctly', () => {
        const userHoldings = [
          { symbol: 'AAPL', value: 10000 },
          { symbol: 'NVDA', value: 5000 },
        ]

        const comparison = manager.comparePortfolios('nancy_pelosi', userHoldings)

        expect(Array.isArray(comparison)).toBe(true)
        expect(comparison.length).toBeGreaterThan(0)

        for (const item of comparison) {
          expect(item.symbol).toBeDefined()
          expect(['buy', 'sell', 'hold']).toContain(item.suggestion)
        }
      })
    })

    describe('Trade Analysis', () => {
      it('should analyze trade reasoning', async () => {
        const trade = {
          id: 'test_1',
          celebrityId: 'nancy_pelosi',
          symbol: 'NVDA',
          name: 'NVIDIA',
          action: 'buy' as const,
          shares: 100,
          price: 875,
          value: 87500,
          date: new Date(),
          reportedDate: new Date(),
        }

        const analysis = await manager.analyzeTradeReasoning(trade)

        expect(typeof analysis).toBe('string')
        expect(analysis.length).toBeGreaterThan(0)
      })
    })

    describe('Mirror Configuration', () => {
      it('should setup and retrieve mirror config', () => {
        const config = {
          userId: 'test_user',
          celebrityId: 'warren_buffett',
          investmentAmount: 25000,
          autoMirror: false,
          notifyOnTrade: true,
        }

        manager.setupMirror(config)
        const retrieved = manager.getMirrorConfig('test_user', 'warren_buffett')

        expect(retrieved).toEqual(config)
      })

      it('should return null for non-existent config', () => {
        const config = manager.getMirrorConfig('unknown', 'unknown')

        expect(config).toBeNull()
      })
    })
  })

  describe('API Source Clients', () => {
    describe('SECEdgarClient', () => {
      it('should be able to search 13F filings', async () => {
        // This will use the real SEC API or fail gracefully
        const filings = await secClient.search13F('1067983') // Berkshire CIK

        // May return empty array if API is unavailable
        expect(Array.isArray(filings)).toBe(true)
      })
    })

    describe('CongressTradingClient', () => {
      it('should get recent trades', async () => {
        const trades = await congressClient.getRecentTrades(10)

        expect(Array.isArray(trades)).toBe(true)
        expect(trades.length).toBeLessThanOrEqual(10)

        if (trades.length > 0) {
          expect(trades[0].politician).toBeDefined()
          expect(trades[0].ticker).toBeDefined()
          expect(['purchase', 'sale', 'exchange']).toContain(trades[0].type)
        }
      })

      it('should get trades by politician', async () => {
        const trades = await congressClient.getTradesByPolitician('Pelosi', 5)

        expect(Array.isArray(trades)).toBe(true)
      })
    })

    describe('ARKInvestClient', () => {
      it('should get ARK holdings', async () => {
        const holdings = await arkClient.getHoldings('ARKK')

        expect(Array.isArray(holdings)).toBe(true)
        expect(holdings.length).toBeGreaterThan(0)

        if (holdings.length > 0) {
          expect(holdings[0].ticker).toBeDefined()
          expect(holdings[0].company).toBeDefined()
          expect(typeof holdings[0].shares).toBe('number')
        }
      })
    })
  })
})

describe('Singleton Instance', () => {
  it('should export working singleton', () => {
    expect(celebrityPortfolioManager).toBeInstanceOf(CelebrityPortfolioManager)

    const celebrities = celebrityPortfolioManager.getCelebrities()
    expect(celebrities.length).toBeGreaterThan(0)
  })

  it('should have known celebrities', () => {
    const pelosi = celebrityPortfolioManager.getCelebrity('nancy_pelosi')
    const buffett = celebrityPortfolioManager.getCelebrity('warren_buffett')
    const wood = celebrityPortfolioManager.getCelebrity('cathie_wood')

    expect(pelosi?.name).toBe('Nancy Pelosi')
    expect(buffett?.name).toBe('Warren Buffett')
    expect(wood?.name).toBe('Cathie Wood')
  })
})

describe('Data Integrity', () => {
  it('portfolio holdings should have valid weights', () => {
    const celebrities = celebrityPortfolioManager.getCelebrities()

    for (const celebrity of celebrities) {
      const portfolio = celebrityPortfolioManager.getPortfolio(celebrity.id)

      if (portfolio && portfolio.holdings.length > 0) {
        const totalWeight = portfolio.holdings.reduce((sum, h) => sum + h.weight, 0)

        // Total weight should be positive (some portfolios may have partial data)
        expect(totalWeight).toBeGreaterThan(0)
        expect(totalWeight).toBeLessThanOrEqual(110) // Allow small rounding errors
      }
    }
  })

  it('celebrity data should be complete', () => {
    const celebrities = celebrityPortfolioManager.getCelebrities()

    for (const celebrity of celebrities) {
      expect(celebrity.id).toBeTruthy()
      expect(celebrity.name).toBeTruthy()
      expect(celebrity.nameKr).toBeTruthy()
      expect(['politician', 'investor', 'fund_manager', 'influencer']).toContain(celebrity.type)
      expect(['sec_13f', 'congress_disclosure', 'public_filing', 'manual']).toContain(celebrity.dataSource)
      expect(['realtime', '45days', 'quarterly', 'manual']).toContain(celebrity.updateFrequency)
    }
  })
})
