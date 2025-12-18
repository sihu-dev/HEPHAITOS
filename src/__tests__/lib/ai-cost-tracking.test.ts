// ============================================
// AI Cost Tracking Unit Tests
// ============================================

import { describe, it, expect } from 'vitest'
import {
  calculateAICost,
  calculateFeatureCreditCost,
  calculateMargin,
  MODEL_COSTS,
  FEATURE_CREDIT_COSTS,
  type ModelName,
  type FeatureName,
} from '@/lib/ai/cost-tracking'

// ============================================
// Tests
// ============================================

describe('AI Cost Tracking', () => {
  describe('MODEL_COSTS', () => {
    it('should have cost definitions for all models', () => {
      expect(MODEL_COSTS).toBeDefined()
      expect(Object.keys(MODEL_COSTS).length).toBeGreaterThan(0)
    })

    it('should have input and output costs for each model', () => {
      Object.entries(MODEL_COSTS).forEach(([model, costs]) => {
        expect(costs.input).toBeGreaterThan(0)
        expect(costs.output).toBeGreaterThan(0)
        expect(costs.output).toBeGreaterThanOrEqual(costs.input)
      })
    })

    it('should have OpenAI models', () => {
      expect(MODEL_COSTS['gpt-4-turbo']).toBeDefined()
      expect(MODEL_COSTS['gpt-4']).toBeDefined()
      expect(MODEL_COSTS['gpt-3.5-turbo']).toBeDefined()
    })

    it('should have Anthropic models', () => {
      expect(MODEL_COSTS['claude-opus-4']).toBeDefined()
      expect(MODEL_COSTS['claude-sonnet-4']).toBeDefined()
      expect(MODEL_COSTS['claude-haiku-3']).toBeDefined()
    })

    it('should have Google models', () => {
      expect(MODEL_COSTS['gemini-pro']).toBeDefined()
      expect(MODEL_COSTS['gemini-ultra']).toBeDefined()
    })
  })

  describe('calculateAICost', () => {
    it('should calculate cost for Claude Sonnet 4', () => {
      const cost = calculateAICost('claude-sonnet-4', 1000, 1000)
      // (3 * 1000 / 1000) + (15 * 1000 / 1000) = 3 + 15 = 18 USD
      // 18 * 1300 = 23,400 KRW
      expect(cost).toBe(23400)
    })

    it('should calculate cost for GPT-4 Turbo', () => {
      const cost = calculateAICost('gpt-4-turbo', 1000, 1000)
      // (10 * 1000 / 1000) + (30 * 1000 / 1000) = 10 + 30 = 40 USD
      // 40 * 1300 = 52,000 KRW
      expect(cost).toBe(52000)
    })

    it('should calculate cost for GPT-3.5 Turbo', () => {
      const cost = calculateAICost('gpt-3.5-turbo', 1000, 1000)
      // (0.5 * 1000 / 1000) + (1.5 * 1000 / 1000) = 0.5 + 1.5 = 2 USD
      // 2 * 1300 = 2,600 KRW
      expect(cost).toBe(2600)
    })

    it('should calculate cost for Claude Haiku 3', () => {
      const cost = calculateAICost('claude-haiku-3', 1000, 1000)
      // (0.25 * 1000 / 1000) + (1.25 * 1000 / 1000) = 0.25 + 1.25 = 1.5 USD
      // 1.5 * 1300 = 1,950 KRW
      expect(cost).toBe(1950)
    })

    it('should handle different token counts', () => {
      const cost = calculateAICost('claude-sonnet-4', 2000, 1500)
      // (3 * 2000 / 1000) + (15 * 1500 / 1000) = 6 + 22.5 = 28.5 USD
      // 28.5 * 1300 = 37,050 KRW
      expect(cost).toBe(37050)
    })

    it('should handle zero tokens', () => {
      const cost = calculateAICost('claude-sonnet-4', 0, 0)
      expect(cost).toBe(0)
    })

    it('should handle very small token counts', () => {
      const cost = calculateAICost('claude-sonnet-4', 10, 10)
      // (3 * 10 / 1000) + (15 * 10 / 1000) = 0.03 + 0.15 = 0.18 USD
      // 0.18 * 1300 = 234 KRW
      expect(cost).toBe(234)
    })

    it('should handle large token counts', () => {
      const cost = calculateAICost('claude-sonnet-4', 100000, 50000)
      // (3 * 100000 / 1000) + (15 * 50000 / 1000) = 300 + 750 = 1050 USD
      // 1050 * 1300 = 1,365,000 KRW
      expect(cost).toBe(1365000)
    })

    it('should round to 2 decimal places', () => {
      const cost = calculateAICost('claude-sonnet-4', 333, 333)
      // (3 * 333 / 1000) + (15 * 333 / 1000) = 0.999 + 4.995 = 5.994 USD
      // 5.994 * 1300 = 7792.2 KRW → 7792.2
      expect(cost).toBe(7792.2)
    })
  })

  describe('FEATURE_CREDIT_COSTS', () => {
    it('should have credit costs for all features', () => {
      expect(FEATURE_CREDIT_COSTS).toBeDefined()
      expect(Object.keys(FEATURE_CREDIT_COSTS).length).toBeGreaterThan(0)
    })

    it('should have positive credit costs', () => {
      Object.values(FEATURE_CREDIT_COSTS).forEach((credits) => {
        expect(credits).toBeGreaterThan(0)
      })
    })

    it('should have strategy-generation feature', () => {
      expect(FEATURE_CREDIT_COSTS['strategy-generation']).toBe(10)
    })

    it('should have backtest feature', () => {
      expect(FEATURE_CREDIT_COSTS['backtest']).toBe(3)
    })

    it('should have ai-tutor feature', () => {
      expect(FEATURE_CREDIT_COSTS['ai-tutor']).toBe(1)
    })

    it('should have reasonable credit ranges', () => {
      Object.values(FEATURE_CREDIT_COSTS).forEach((credits) => {
        expect(credits).toBeGreaterThanOrEqual(1)
        expect(credits).toBeLessThanOrEqual(100)
      })
    })
  })

  describe('calculateFeatureCreditCost', () => {
    it('should calculate cost for strategy-generation', () => {
      const cost = calculateFeatureCreditCost('strategy-generation')
      // 10 credits * 82 KRW/credit = 820 KRW
      expect(cost).toBe(820)
    })

    it('should calculate cost for backtest', () => {
      const cost = calculateFeatureCreditCost('backtest')
      // 3 credits * 82 KRW/credit = 246 KRW
      expect(cost).toBe(246)
    })

    it('should calculate cost for ai-tutor', () => {
      const cost = calculateFeatureCreditCost('ai-tutor')
      // 1 credit * 82 KRW/credit = 82 KRW
      expect(cost).toBe(82)
    })

    it('should calculate cost for live-coaching', () => {
      const cost = calculateFeatureCreditCost('live-coaching')
      // 20 credits * 82 KRW/credit = 1640 KRW
      expect(cost).toBe(1640)
    })

    it('should calculate cost for portfolio-analysis', () => {
      const cost = calculateFeatureCreditCost('portfolio-analysis')
      // 5 credits * 82 KRW/credit = 410 KRW
      expect(cost).toBe(410)
    })
  })

  describe('calculateMargin', () => {
    it('should calculate positive margin', () => {
      const margin = calculateMargin('ai-tutor', 50)
      // Revenue: 82 KRW (1 credit)
      // Cost: 50 KRW
      // Margin: 32 KRW
      // Margin %: (32 / 82) * 100 = 39.02%
      expect(margin.revenue).toBe(82)
      expect(margin.cost).toBe(50)
      expect(margin.margin).toBe(32)
      expect(margin.marginPct).toBeCloseTo(39.02, 1)
    })

    it('should calculate negative margin (loss)', () => {
      const margin = calculateMargin('strategy-generation', 1000)
      // Revenue: 820 KRW (10 credits)
      // Cost: 1000 KRW
      // Margin: -180 KRW
      // Margin %: (-180 / 820) * 100 = -21.95%
      expect(margin.revenue).toBe(820)
      expect(margin.cost).toBe(1000)
      expect(margin.margin).toBe(-180)
      expect(margin.marginPct).toBeCloseTo(-21.95, 1)
    })

    it('should calculate zero margin (break-even)', () => {
      const margin = calculateMargin('backtest', 246)
      // Revenue: 246 KRW (3 credits)
      // Cost: 246 KRW
      // Margin: 0 KRW
      // Margin %: 0%
      expect(margin.revenue).toBe(246)
      expect(margin.cost).toBe(246)
      expect(margin.margin).toBe(0)
      expect(margin.marginPct).toBe(0)
    })

    it('should calculate margin for live-coaching', () => {
      const margin = calculateMargin('live-coaching', 500)
      // Revenue: 1640 KRW (20 credits)
      // Cost: 500 KRW
      // Margin: 1140 KRW
      // Margin %: (1140 / 1640) * 100 = 69.51%
      expect(margin.revenue).toBe(1640)
      expect(margin.cost).toBe(500)
      expect(margin.margin).toBe(1140)
      expect(margin.marginPct).toBeCloseTo(69.51, 1)
    })

    it('should handle zero cost', () => {
      const margin = calculateMargin('ai-tutor', 0)
      expect(margin.revenue).toBe(82)
      expect(margin.cost).toBe(0)
      expect(margin.margin).toBe(82)
      expect(margin.marginPct).toBe(100)
    })

    it('should round margin percentage to 2 decimal places', () => {
      const margin = calculateMargin('portfolio-analysis', 123)
      // Revenue: 410 KRW
      // Cost: 123 KRW
      // Margin: 287 KRW
      // Margin %: (287 / 410) * 100 = 70.0%
      expect(margin.marginPct).toBe(70)
    })
  })

  describe('Cost Model Validation', () => {
    it('should have consistent pricing across models', () => {
      // Output cost should always be higher than input cost
      Object.entries(MODEL_COSTS).forEach(([model, costs]) => {
        expect(costs.output).toBeGreaterThan(costs.input)
      })
    })

    it('should have premium models more expensive than economy models', () => {
      const opus = MODEL_COSTS['claude-opus-4']
      const haiku = MODEL_COSTS['claude-haiku-3']

      expect(opus.input).toBeGreaterThan(haiku.input)
      expect(opus.output).toBeGreaterThan(haiku.output)
    })

    it('should have GPT-4 more expensive than GPT-3.5', () => {
      const gpt4 = MODEL_COSTS['gpt-4']
      const gpt35 = MODEL_COSTS['gpt-3.5-turbo']

      expect(gpt4.input).toBeGreaterThan(gpt35.input)
      expect(gpt4.output).toBeGreaterThan(gpt35.output)
    })
  })
})
