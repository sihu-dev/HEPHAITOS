// ============================================
// Risk Profiler Unit Tests (2026)
// Updated to match @/lib/agent/risk-profiler API
// ============================================

import { describe, it, expect, beforeEach } from 'vitest'
import { RiskProfiler, type UserRiskProfile } from '@/lib/agent/risk-profiler'

describe('RiskProfiler', () => {
  let profiler: RiskProfiler

  beforeEach(() => {
    profiler = new RiskProfiler()
  })

  describe('calculateOptimalStopLoss', () => {
    it('should calculate conservative stop loss for BTC', () => {
      const profile: UserRiskProfile = { level: 'conservative' }
      const stopLoss = profiler.calculateOptimalStopLoss('BTC/USDT', profile, '1d')

      expect(stopLoss).toBeGreaterThan(0)
      expect(stopLoss).toBeLessThanOrEqual(3.0)
    })

    it('should calculate moderate stop loss for BTC', () => {
      const profile: UserRiskProfile = { level: 'moderate' }
      const stopLoss = profiler.calculateOptimalStopLoss('BTC/USDT', profile, '1d')

      expect(stopLoss).toBeGreaterThan(0)
      expect(stopLoss).toBeLessThanOrEqual(5.0)
    })

    it('should respect preferredStopLoss override', () => {
      const profile: UserRiskProfile = {
        level: 'conservative',
        preferredStopLoss: 2.0,
      }
      const stopLoss = profiler.calculateOptimalStopLoss('BTC/USDT', profile, '1d')

      expect(stopLoss).toBe(2.0)
    })
  })

  describe('calculateDynamicRisk', () => {
    it('should calculate full risk parameters for conservative profile', () => {
      const profile: UserRiskProfile = { level: 'conservative' }
      const risk = profiler.calculateDynamicRisk('BTC/USDT', profile, '1d')

      expect(risk.stopLoss).toBeGreaterThan(0)
      expect(risk.stopLoss).toBeLessThanOrEqual(3)
      expect(risk.takeProfit).toBeGreaterThan(risk.stopLoss)
      expect(risk.positionSize).toBe(10)
      expect(risk.maxLeverage).toBe(1)
    })

    it('should calculate full risk parameters for moderate profile', () => {
      const profile: UserRiskProfile = { level: 'moderate' }
      const risk = profiler.calculateDynamicRisk('BTC/USDT', profile, '1d')

      expect(risk.stopLoss).toBeGreaterThan(0)
      expect(risk.takeProfit).toBeGreaterThan(risk.stopLoss)
      expect(risk.positionSize).toBe(20)
      expect(risk.maxLeverage).toBe(2)
    })

    it('should have correct risk/reward ratio for conservative (3:1)', () => {
      const profile: UserRiskProfile = { level: 'conservative' }
      const risk = profiler.calculateDynamicRisk('BTC/USDT', profile, '1d')

      const ratio = risk.takeProfit / risk.stopLoss
      expect(ratio).toBeCloseTo(3.0, 0)
    })
  })

  describe('validateStrategyRisk', () => {
    it('should validate safe strategy', () => {
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

    it('should detect stop loss exceeding profile limit', () => {
      const result = profiler.validateStrategyRisk({
        symbol: 'BTC/USDT',
        stopLoss: 10,
        positionSize: 10,
        userProfile: { level: 'conservative' },
      })

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.includes('손절가'))).toBe(true)
    })
  })

  describe('getRecommendedRisk', () => {
    it('should provide recommended risk for conservative trader', () => {
      const risk = profiler.getRecommendedRisk('BTC/USDT', { level: 'conservative' })

      expect(risk.stopLoss).toBeLessThanOrEqual(3)
      expect(risk.positionSize).toBe(10)
      expect(risk.maxLeverage).toBe(1)
    })
  })
})
