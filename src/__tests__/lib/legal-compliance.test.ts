// ============================================
// Legal Compliance Unit Tests
// Updated to match @/lib/agent/legal-compliance API
// ============================================

import { describe, it, expect } from 'vitest'
import { LegalCompliance } from '@/lib/agent/legal-compliance'

describe('LegalCompliance', () => {
  describe('assessStrategyRisk', () => {
    it('should assess LOW risk for safe strategy', () => {
      const assessment = LegalCompliance.assessStrategyRisk({
        stopLoss: 3,
        leverage: 1,
        positionSize: 10,
        indicators: ['RSI', 'MACD'],
      })

      expect(assessment.level).toBe('low')
      expect(assessment.warnings).toHaveLength(0)
    })

    it('should assess MEDIUM risk for moderate strategy', () => {
      const assessment = LegalCompliance.assessStrategyRisk({
        stopLoss: 12, // High stop loss adds risk
        leverage: 1,
        positionSize: 10,
        indicators: ['RSI'],
      })

      expect(assessment.level).toBe('medium')
    })

    it('should assess HIGH risk for risky strategy', () => {
      const assessment = LegalCompliance.assessStrategyRisk({
        stopLoss: 15, // Very high
        leverage: 6, // High leverage
        positionSize: 25, // High position
        indicators: ['RSI'],
      })

      expect(['high', 'extreme']).toContain(assessment.level)
    })

    it('should assess risk when no stop loss', () => {
      const assessment = LegalCompliance.assessStrategyRisk({
        stopLoss: undefined,
        leverage: 2,
        positionSize: 20,
        indicators: ['RSI'],
      })

      expect(assessment.factors).toContain('손절가 미설정')
    })

    it('should warn about high leverage (>5x)', () => {
      const assessment = LegalCompliance.assessStrategyRisk({
        stopLoss: 5,
        leverage: 10,
        positionSize: 20,
        indicators: ['RSI'],
      })

      expect(assessment.warnings.some(w => w.includes('레버리지'))).toBe(true)
    })

    it('should warn about high position size', () => {
      const assessment = LegalCompliance.assessStrategyRisk({
        stopLoss: 5,
        leverage: 2,
        positionSize: 25, // > 20%
        indicators: ['RSI'],
      })

      expect(assessment.warnings.some(w => w.includes('포지션') || w.includes('20%'))).toBe(true)
    })

    it('should warn about single indicator dependency', () => {
      const assessment = LegalCompliance.assessStrategyRisk({
        stopLoss: 5,
        leverage: 1,
        positionSize: 10,
        indicators: ['RSI'], // Only one indicator
      })

      expect(assessment.warnings.some(w => w.includes('단일 지표'))).toBe(true)
    })
  })

  describe('validateStrategyPrompt', () => {
    it('should detect forbidden pattern - imperative form', () => {
      const result = LegalCompliance.validateStrategyPrompt('지금 당장 비트코인을 매수하세요')
      expect(result.safe).toBe(false)
      expect(result.blockers.length).toBeGreaterThan(0)
    })

    it('should detect guaranteed returns pattern', () => {
      const result = LegalCompliance.validateStrategyPrompt('이 전략은 수익을 보장합니다')
      expect(result.safe).toBe(false)
    })

    it('should detect certain profit pattern', () => {
      const result = LegalCompliance.validateStrategyPrompt('확실한 수익을 얻을 수 있습니다')
      expect(result.safe).toBe(false)
    })

    it('should allow educational content', () => {
      const result = LegalCompliance.validateStrategyPrompt('RSI 지표를 활용할 수 있습니다')
      expect(result.safe).toBe(true)
    })

    it('should allow historical analysis', () => {
      const result = LegalCompliance.validateStrategyPrompt('과거 성과는 미래를 보장하지 않습니다')
      expect(result.safe).toBe(true)
    })

    it('should allow informational content', () => {
      const result = LegalCompliance.validateStrategyPrompt('이 전략은 교육 목적으로 제공됩니다')
      expect(result.safe).toBe(true)
    })

    it('should detect high risk patterns with warnings', () => {
      const result = LegalCompliance.validateStrategyPrompt('손절 없이 10배 레버리지로 올인합니다')
      expect(result.warnings.length).toBeGreaterThan(0)
    })
  })

  describe('validateAIResponse', () => {
    it('should validate AI response same as strategy prompt', () => {
      const result = LegalCompliance.validateAIResponse('이 종목을 매수하세요')
      expect(result.safe).toBe(false)
    })

    it('should allow safe AI response', () => {
      const result = LegalCompliance.validateAIResponse(
        'RSI가 30 이하일 때 매수 조건을 설정할 수 있습니다.'
      )
      expect(result.safe).toBe(true)
    })
  })

  describe('addDisclaimer', () => {
    it('should add response type disclaimer', () => {
      const content = '이것은 테스트 응답입니다.'
      const result = LegalCompliance.addDisclaimer(content, { type: 'response' })

      expect(result).toContain('면책조항')
      expect(result).toContain('투자 조언이 아닙니다')
    })

    it('should add strategy type disclaimer', () => {
      const content = '전략 설명'
      const result = LegalCompliance.addDisclaimer(content, { type: 'strategy' })

      expect(result).toContain('투자 경고')
      expect(result).toContain('교육 목적')
      expect(result).toContain('과거 성과')
    })

    it('should add report type disclaimer', () => {
      const content = '리포트 내용'
      const result = LegalCompliance.addDisclaimer(content, { type: 'report' })

      expect(result).toContain('면책조항')
      expect(result).toContain('매수/매도를 권유하는 것이 아닙니다')
    })

    it('should add UI type disclaimer', () => {
      const content = ''
      const result = LegalCompliance.addDisclaimer(content, { type: 'ui' })

      expect(result).toContain('교육 및 도구 제공 목적')
    })

    it('should add risk warning when specified', () => {
      const content = '위험한 전략'
      const result = LegalCompliance.addDisclaimer(content, {
        type: 'response',
        includeRiskWarning: true,
      })

      expect(result).toContain('원금 손실 위험')
    })
  })

  describe('SAFE_RESPONSE_TEMPLATES', () => {
    it('should have safe alternative phrases', () => {
      expect(LegalCompliance.SAFE_RESPONSE_TEMPLATES.possibility).toBe('~할 수 있습니다')
      expect(LegalCompliance.SAFE_RESPONSE_TEMPLATES.instead_of_buy).toContain('조건을 설정')
      expect(LegalCompliance.SAFE_RESPONSE_TEMPLATES.instead_of_guarantee).toContain('보장하지 않습니다')
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined values gracefully', () => {
      const assessment = LegalCompliance.assessStrategyRisk({
        stopLoss: undefined,
        leverage: undefined,
        positionSize: undefined,
        indicators: [],
      })

      // Should still return a valid assessment
      expect(['low', 'medium', 'high', 'extreme']).toContain(assessment.level)
    })

    it('should handle empty text for validation', () => {
      const result = LegalCompliance.validateStrategyPrompt('')
      expect(result.safe).toBe(true) // Empty string has no forbidden patterns
    })

    it('should handle risk level edge values', () => {
      const assessment = LegalCompliance.assessStrategyRisk({
        stopLoss: 5,
        leverage: 3,
        positionSize: 30,
        indicators: ['RSI'],
      })

      expect(['low', 'medium', 'high', 'extreme']).toContain(assessment.level)
    })
  })
})
