// ============================================
// Legal Compliance Unit Tests (2026)
// Updated to match @/lib/agent/legal-compliance API
// ============================================

import { describe, it, expect } from 'vitest'
import {
  assessStrategyRisk,
  validateStrategyPrompt,
  addDisclaimer,
} from '@/lib/agent/legal-compliance'

describe('LegalCompliance', () => {
  describe('assessStrategyRisk', () => {
    it('should assess LOW risk for safe strategy', () => {
      const assessment = assessStrategyRisk({
        stopLoss: 3,
        leverage: 1,
        positionSize: 10,
        indicators: ['RSI', 'MACD'],
      })

      expect(assessment.level).toBe('low')
      expect(assessment.warnings).toHaveLength(0)
    })

    it('should assess EXTREME risk when no stop loss with high leverage', () => {
      const assessment = assessStrategyRisk({
        stopLoss: undefined,
        leverage: 10,
        positionSize: 30,
        indicators: [],
      })

      expect(assessment.level).toBe('extreme')
      expect(assessment.factors).toContain('손절가 미설정')
    })

    it('should assess EXTREME risk with high leverage', () => {
      const assessment = assessStrategyRisk({
        stopLoss: undefined,
        leverage: 10,
        positionSize: 30,
        indicators: [],
      })

      expect(assessment.level).toBe('extreme')
      expect(assessment.factors.some((f) => f.includes('레버리지'))).toBe(true)
    })
  })

  describe('validateStrategyPrompt', () => {
    it('should detect forbidden pattern - investment advice', () => {
      const result = validateStrategyPrompt('지금 당장 비트코인을 매수하세요')
      expect(result.safe).toBe(false)
      expect(result.blockers.length).toBeGreaterThan(0)
    })

    it('should detect guaranteed returns', () => {
      const result = validateStrategyPrompt('이 전략은 수익을 보장합니다')
      expect(result.safe).toBe(false)
      expect(result.blockers.some((b) => b.includes('보장'))).toBe(true)
    })

    it('should allow educational content', () => {
      const result = validateStrategyPrompt('RSI 지표를 활용할 수 있습니다')
      expect(result.safe).toBe(true)
      expect(result.blockers).toHaveLength(0)
    })
  })

  describe('addDisclaimer', () => {
    it('should add disclaimer for response type', () => {
      const content = '이것은 트레이딩 전략입니다.'
      const result = addDisclaimer(content, { type: 'response' })

      expect(result).toContain('이것은 트레이딩 전략입니다.')
      expect(result).toContain('면책조항')
      expect(result).toContain('투자 조언이 아닙니다')
    })

    it('should add disclaimer for strategy type', () => {
      const content = 'RSI를 활용한 전략'
      const result = addDisclaimer(content, { type: 'strategy' })

      expect(result).toContain('RSI를 활용한 전략')
      expect(result).toContain('투자 경고')
    })
  })
})
