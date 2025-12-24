// ============================================
// Risk Profiler Unit Tests
// Updated to match @/lib/agent/risk-profiler API
// ============================================

import { describe, it, expect, beforeEach } from 'vitest'
import { RiskProfiler, riskProfiler, type UserRiskProfile } from '@/lib/agent/risk-profiler'

describe('RiskProfiler', () => {
  let profiler: RiskProfiler

  beforeEach(() => {
    profiler = new RiskProfiler()
  })

  describe('getVolatility', () => {
    it('should return known symbol volatility', () => {
      const vol = profiler.getVolatility('BTC/USDT')
      expect(vol.symbol).toBe('BTC/USDT')
      expect(vol.dailyVolatility).toBeGreaterThan(0)
    })

    it('should return default crypto volatility for unknown crypto symbol', () => {
      const vol = profiler.getVolatility('UNKNOWN/USDT')
      expect(vol.symbol).toBe('DEFAULT_CRYPTO')
    })

    it('should return default stock volatility for stock symbol', () => {
      const vol = profiler.getVolatility('MSFT')
      expect(vol.symbol).toBe('DEFAULT_STOCK')
    })
  })

  describe('calculateOptimalStopLoss', () => {
    it('should calculate conservative stop loss for BTC', () => {
      const profile: UserRiskProfile = { level: 'conservative' }
      const stopLoss = profiler.calculateOptimalStopLoss('BTC/USDT', profile, '1d')

      // Conservative max is 3%
      expect(stopLoss).toBeLessThanOrEqual(3.0)
      expect(stopLoss).toBeGreaterThan(0)
    })

    it('should calculate moderate stop loss for BTC', () => {
      const profile: UserRiskProfile = { level: 'moderate' }
      const stopLoss = profiler.calculateOptimalStopLoss('BTC/USDT', profile, '1d')

      // Moderate max is 5%
      expect(stopLoss).toBeLessThanOrEqual(5.0)
      expect(stopLoss).toBeGreaterThan(0)
    })

    it('should calculate aggressive stop loss for BTC', () => {
      const profile: UserRiskProfile = { level: 'aggressive' }
      const stopLoss = profiler.calculateOptimalStopLoss('BTC/USDT', profile, '1d')

      // Aggressive max is 8%
      expect(stopLoss).toBeLessThanOrEqual(8.0)
      expect(stopLoss).toBeGreaterThan(0)
    })

    it('should calculate very aggressive stop loss', () => {
      const profile: UserRiskProfile = { level: 'very_aggressive' }
      const stopLoss = profiler.calculateOptimalStopLoss('BTC/USDT', profile, '1d')

      // Very aggressive max is 12%
      expect(stopLoss).toBeLessThanOrEqual(12.0)
      expect(stopLoss).toBeGreaterThan(0)
    })

    it('should respect preferredStopLoss override', () => {
      const profile: UserRiskProfile = {
        level: 'aggressive',
        preferredStopLoss: 2.0,
      }
      const stopLoss = profiler.calculateOptimalStopLoss('BTC/USDT', profile, '1d')

      // Should use preferred value (capped at max)
      expect(stopLoss).toBeLessThanOrEqual(2.0)
    })

    it('should handle different timeframes', () => {
      const profile: UserRiskProfile = { level: 'moderate' }

      const daily = profiler.calculateOptimalStopLoss('BTC/USDT', profile, '1d')
      const weekly = profiler.calculateOptimalStopLoss('BTC/USDT', profile, '1w')

      // Weekly volatility is higher, so stop loss should be higher (but capped)
      expect(weekly).toBeGreaterThanOrEqual(daily)
    })
  })

  describe('calculateDynamicRisk', () => {
    it('should return all risk parameters', () => {
      const profile: UserRiskProfile = { level: 'moderate' }
      const risk = profiler.calculateDynamicRisk('BTC/USDT', profile, '1d')

      expect(risk).toHaveProperty('stopLoss')
      expect(risk).toHaveProperty('takeProfit')
      expect(risk).toHaveProperty('positionSize')
      expect(risk).toHaveProperty('maxLeverage')
    })

    it('should calculate take profit based on risk/reward ratio', () => {
      const profile: UserRiskProfile = { level: 'moderate' }
      const risk = profiler.calculateDynamicRisk('BTC/USDT', profile, '1d')

      // Moderate has 2.5:1 ratio
      expect(risk.takeProfit).toBeGreaterThan(risk.stopLoss)
    })

    it('should return conservative position size for conservative profile', () => {
      const profile: UserRiskProfile = { level: 'conservative' }
      const risk = profiler.calculateDynamicRisk('BTC/USDT', profile)

      expect(risk.positionSize).toBe(10)
      expect(risk.maxLeverage).toBe(1)
    })

    it('should return aggressive parameters for aggressive profile', () => {
      const profile: UserRiskProfile = { level: 'aggressive' }
      const risk = profiler.calculateDynamicRisk('BTC/USDT', profile)

      expect(risk.positionSize).toBe(30)
      expect(risk.maxLeverage).toBe(3)
    })

    it('should use user-specified maxPositionSize', () => {
      const profile: UserRiskProfile = { level: 'moderate', maxPositionSize: 15 }
      const risk = profiler.calculateDynamicRisk('BTC/USDT', profile)

      expect(risk.positionSize).toBe(15)
    })
  })

  describe('validateStrategyRisk', () => {
    it('should validate safe strategy as valid', () => {
      const result = profiler.validateStrategyRisk({
        symbol: 'BTC/USDT',
        stopLoss: 3,
        takeProfit: 9,
        positionSize: 10,
        leverage: 1,
        userProfile: { level: 'conservative' },
      })

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should warn when no stop loss is set', () => {
      const result = profiler.validateStrategyRisk({
        symbol: 'BTC/USDT',
        positionSize: 10,
      })

      expect(result.warnings.some(w => w.includes('손절가'))).toBe(true)
      expect(result.suggestions.length).toBeGreaterThan(0)
    })

    it('should error when stop loss exceeds max for risk level', () => {
      const result = profiler.validateStrategyRisk({
        symbol: 'BTC/USDT',
        stopLoss: 10,
        userProfile: { level: 'conservative' },
      })

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('손절가'))).toBe(true)
    })

    it('should warn when risk/reward ratio is poor', () => {
      const result = profiler.validateStrategyRisk({
        symbol: 'BTC/USDT',
        stopLoss: 5,
        takeProfit: 5, // 1:1 ratio
      })

      expect(result.warnings.some(w => w.includes('손익비'))).toBe(true)
    })

    it('should error on excessive leverage', () => {
      const result = profiler.validateStrategyRisk({
        symbol: 'BTC/USDT',
        stopLoss: 5,
        leverage: 10,
        userProfile: { level: 'moderate' },
      })

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('레버리지'))).toBe(true)
    })

    it('should error on excessive position size', () => {
      const result = profiler.validateStrategyRisk({
        symbol: 'BTC/USDT',
        stopLoss: 5,
        positionSize: 60,
      })

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('포지션') || e.includes('집중'))).toBe(true)
    })
  })

  describe('getRecommendedRisk', () => {
    it('should return recommended parameters', () => {
      const risk = profiler.getRecommendedRisk('BTC/USDT')

      expect(risk.stopLoss).toBeGreaterThan(0)
      expect(risk.takeProfit).toBeGreaterThan(0)
      expect(risk.positionSize).toBeGreaterThan(0)
      expect(risk.maxLeverage).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Singleton export', () => {
    it('should export singleton instance', () => {
      expect(riskProfiler).toBeInstanceOf(RiskProfiler)
    })
  })
})
