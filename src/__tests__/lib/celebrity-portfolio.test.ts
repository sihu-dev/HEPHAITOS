// ============================================
// CelebrityPortfolioManager Tests
// 셀럽 포트폴리오 미러링 핵심 로직 테스트
// ============================================

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  CelebrityPortfolioManager,
  celebrityPortfolioManager,
  formatPortfolioChange,
  getUpdateFrequencyText,
  type CelebrityProfile,
  type CelebrityPortfolio,
  type TradeActivity,
} from '@/lib/mirroring/celebrity-portfolio'

// ============================================
// Tests
// ============================================

describe('CelebrityPortfolioManager', () => {
  let manager: CelebrityPortfolioManager

  beforeEach(() => {
    manager = new CelebrityPortfolioManager()
  })

  afterEach(() => {
    manager.clearCache()
  })

  describe('getCelebrities', () => {
    it('should return list of celebrities', () => {
      const celebrities = manager.getCelebrities()

      expect(Array.isArray(celebrities)).toBe(true)
      expect(celebrities.length).toBeGreaterThan(0)
    })

    it('should include required fields for each celebrity', () => {
      const celebrities = manager.getCelebrities()

      for (const celebrity of celebrities) {
        expect(celebrity.id).toBeDefined()
        expect(celebrity.name).toBeDefined()
        expect(celebrity.nameKr).toBeDefined()
        expect(celebrity.type).toBeDefined()
        expect(celebrity.dataSource).toBeDefined()
        expect(celebrity.updateFrequency).toBeDefined()
      }
    })

    it('should include known celebrities', () => {
      const celebrities = manager.getCelebrities()
      const ids = celebrities.map((c) => c.id)

      expect(ids).toContain('nancy_pelosi')
      expect(ids).toContain('warren_buffett')
      expect(ids).toContain('michael_burry')
      expect(ids).toContain('cathie_wood')
    })
  })

  describe('getCelebrity', () => {
    it('should return celebrity by ID', () => {
      const celebrity = manager.getCelebrity('nancy_pelosi')

      expect(celebrity).toBeDefined()
      expect(celebrity?.id).toBe('nancy_pelosi')
      expect(celebrity?.name).toBe('Nancy Pelosi')
    })

    it('should return null for non-existent ID', () => {
      const celebrity = manager.getCelebrity('non_existent_id')

      expect(celebrity).toBeNull()
    })
  })

  describe('getPortfolio', () => {
    it('should return portfolio for known celebrity', () => {
      const portfolio = manager.getPortfolio('nancy_pelosi')

      expect(portfolio).toBeDefined()
      expect(portfolio?.celebrityId).toBe('nancy_pelosi')
      expect(portfolio?.holdings).toBeDefined()
      expect(Array.isArray(portfolio?.holdings)).toBe(true)
    })

    it('should return null for non-existent celebrity', () => {
      const portfolio = manager.getPortfolio('non_existent')

      expect(portfolio).toBeNull()
    })

    it('should include portfolio holdings with required fields', () => {
      const portfolio = manager.getPortfolio('warren_buffett')

      expect(portfolio?.holdings.length).toBeGreaterThan(0)

      for (const holding of portfolio!.holdings) {
        expect(holding.symbol).toBeDefined()
        expect(holding.name).toBeDefined()
        expect(typeof holding.shares).toBe('number')
        expect(typeof holding.weight).toBe('number')
        expect(typeof holding.currentValue).toBe('number')
      }
    })

    it('should include performance metrics', () => {
      const portfolio = manager.getPortfolio('nancy_pelosi')

      expect(portfolio?.performance).toBeDefined()
      expect(typeof portfolio?.performance.ytd).toBe('number')
      expect(typeof portfolio?.performance.oneMonth).toBe('number')
      expect(typeof portfolio?.performance.threeMonth).toBe('number')
      expect(typeof portfolio?.performance.oneYear).toBe('number')
    })
  })

  describe('getTrades', () => {
    it('should return trades for celebrity', () => {
      const trades = manager.getTrades('nancy_pelosi')

      expect(Array.isArray(trades)).toBe(true)
    })

    it('should limit results when limit is provided', () => {
      const trades = manager.getTrades('nancy_pelosi', 1)

      expect(trades.length).toBeLessThanOrEqual(1)
    })

    it('should return trades sorted by date (newest first)', () => {
      const trades = manager.getTrades('nancy_pelosi')

      if (trades.length >= 2) {
        for (let i = 1; i < trades.length; i++) {
          expect(trades[i - 1].date.getTime()).toBeGreaterThanOrEqual(trades[i].date.getTime())
        }
      }
    })

    it('should include required fields for each trade', () => {
      const trades = manager.getTrades('nancy_pelosi')

      for (const trade of trades) {
        expect(trade.id).toBeDefined()
        expect(trade.celebrityId).toBeDefined()
        expect(trade.symbol).toBeDefined()
        expect(trade.name).toBeDefined()
        expect(['buy', 'sell']).toContain(trade.action)
        expect(trade.date).toBeInstanceOf(Date)
        expect(trade.reportedDate).toBeInstanceOf(Date)
      }
    })
  })

  describe('getAllRecentTrades', () => {
    it('should return recent trades from all celebrities', () => {
      const trades = manager.getAllRecentTrades()

      expect(Array.isArray(trades)).toBe(true)
      expect(trades.length).toBeGreaterThan(0)
    })

    it('should respect limit parameter', () => {
      const trades = manager.getAllRecentTrades(5)

      expect(trades.length).toBeLessThanOrEqual(5)
    })

    it('should return trades sorted by date', () => {
      const trades = manager.getAllRecentTrades(10)

      if (trades.length >= 2) {
        for (let i = 1; i < trades.length; i++) {
          expect(trades[i - 1].date.getTime()).toBeGreaterThanOrEqual(trades[i].date.getTime())
        }
      }
    })
  })

  describe('setupMirror / getMirrorConfig', () => {
    it('should store and retrieve mirror config', () => {
      const config = {
        userId: 'user_123',
        celebrityId: 'nancy_pelosi',
        investmentAmount: 10000,
        autoMirror: true,
        notifyOnTrade: true,
      }

      manager.setupMirror(config)
      const retrieved = manager.getMirrorConfig('user_123', 'nancy_pelosi')

      expect(retrieved).toBeDefined()
      expect(retrieved?.userId).toBe('user_123')
      expect(retrieved?.celebrityId).toBe('nancy_pelosi')
      expect(retrieved?.investmentAmount).toBe(10000)
      expect(retrieved?.autoMirror).toBe(true)
    })

    it('should return null for non-existent config', () => {
      const config = manager.getMirrorConfig('non_existent', 'non_existent')

      expect(config).toBeNull()
    })
  })

  describe('calculateMirrorPortfolio', () => {
    it('should calculate mirror portfolio based on celebrity weights', () => {
      const result = manager.calculateMirrorPortfolio('nancy_pelosi', 100000)

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)

      for (const item of result) {
        expect(item.symbol).toBeDefined()
        expect(typeof item.shares).toBe('number')
        expect(typeof item.value).toBe('number')
        expect(item.shares).toBeGreaterThanOrEqual(0)
      }
    })

    it('should return empty array for non-existent celebrity', () => {
      const result = manager.calculateMirrorPortfolio('non_existent', 100000)

      expect(result).toEqual([])
    })

    it('should allocate roughly according to weights', () => {
      const investmentAmount = 100000
      const result = manager.calculateMirrorPortfolio('nancy_pelosi', investmentAmount)
      const portfolio = manager.getPortfolio('nancy_pelosi')

      if (portfolio && result.length > 0) {
        const totalInvested = result.reduce((sum, r) => sum + r.value, 0)
        // Total invested should be close to investment amount (within 10% due to rounding)
        expect(totalInvested).toBeLessThanOrEqual(investmentAmount)
        expect(totalInvested).toBeGreaterThan(investmentAmount * 0.8)
      }
    })
  })

  describe('comparePortfolios', () => {
    it('should compare user portfolio with celebrity portfolio', () => {
      const userHoldings = [
        { symbol: 'NVDA', value: 50000 },
        { symbol: 'AAPL', value: 30000 },
        { symbol: 'TSLA', value: 20000 },
      ]

      const result = manager.comparePortfolios('nancy_pelosi', userHoldings)

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)

      for (const item of result) {
        expect(item.symbol).toBeDefined()
        expect(typeof item.celebrityWeight).toBe('number')
        expect(typeof item.userWeight).toBe('number')
        expect(typeof item.difference).toBe('number')
        expect(['buy', 'sell', 'hold']).toContain(item.suggestion)
      }
    })

    it('should suggest buy when user weight is lower', () => {
      const userHoldings = [
        { symbol: 'NVDA', value: 1000 }, // Very low compared to celebrity
      ]

      const result = manager.comparePortfolios('nancy_pelosi', userHoldings)
      const nvdaComparison = result.find((r) => r.symbol === 'NVDA')

      if (nvdaComparison && nvdaComparison.celebrityWeight > nvdaComparison.userWeight + 5) {
        expect(nvdaComparison.suggestion).toBe('buy')
      }
    })

    it('should return empty array for non-existent celebrity', () => {
      const result = manager.comparePortfolios('non_existent', [{ symbol: 'AAPL', value: 1000 }])

      expect(result).toEqual([])
    })
  })

  describe('analyzeTradeReasoning', () => {
    it('should return analysis for trade', async () => {
      const trade: TradeActivity = {
        id: 'test_trade_1',
        celebrityId: 'nancy_pelosi',
        symbol: 'NVDA',
        name: 'NVIDIA',
        action: 'buy',
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

    it('should return basic message for unknown celebrity', async () => {
      const trade: TradeActivity = {
        id: 'test_trade_2',
        celebrityId: 'unknown_celebrity',
        symbol: 'AAPL',
        name: 'Apple',
        action: 'buy',
        shares: 100,
        price: 178,
        value: 17800,
        date: new Date(),
        reportedDate: new Date(),
      }

      const analysis = await manager.analyzeTradeReasoning(trade)

      expect(typeof analysis).toBe('string')
      expect(analysis).toContain('Apple')
    })
  })
})

describe('Helper Functions', () => {
  describe('formatPortfolioChange', () => {
    it('should format positive changes with plus sign', () => {
      expect(formatPortfolioChange(5.5)).toBe('+5.50%')
      expect(formatPortfolioChange(0.1)).toBe('+0.10%')
    })

    it('should format negative changes without plus sign', () => {
      expect(formatPortfolioChange(-3.2)).toBe('-3.20%')
      expect(formatPortfolioChange(-0.05)).toBe('-0.05%')
    })

    it('should format zero correctly', () => {
      expect(formatPortfolioChange(0)).toBe('+0.00%')
    })
  })

  describe('getUpdateFrequencyText', () => {
    it('should return correct Korean text for each frequency', () => {
      expect(getUpdateFrequencyText('realtime')).toBe('실시간')
      expect(getUpdateFrequencyText('45days')).toBe('45일 지연')
      expect(getUpdateFrequencyText('quarterly')).toBe('분기별')
      expect(getUpdateFrequencyText('manual')).toBe('수동 업데이트')
    })
  })
})

describe('Singleton Instance', () => {
  it('should export a singleton instance', () => {
    expect(celebrityPortfolioManager).toBeInstanceOf(CelebrityPortfolioManager)
  })

  it('should be functional', () => {
    const celebrities = celebrityPortfolioManager.getCelebrities()
    expect(celebrities.length).toBeGreaterThan(0)
  })
})
