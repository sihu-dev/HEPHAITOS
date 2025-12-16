// ============================================
// Strategy Parser Tests
// 전략 파서 핵심 로직 테스트
// ============================================

import { describe, it, expect, beforeEach } from 'vitest'
import {
  strategyParser,
  StrategyParser,
  IndicatorCalculator,
  type StrategyCondition,
  type EvaluationContext,
  type IndicatorConfig,
} from '@/lib/backtest/strategy-parser'
import type { OHLCV } from '@/types'

// ============================================
// Test Data
// ============================================

function generateTestOHLCV(count: number): OHLCV[] {
  const data: OHLCV[] = []
  let price = 100

  for (let i = 0; i < count; i++) {
    price = price * (1 + (Math.random() - 0.5) * 0.04)

    data.push({
      timestamp: Date.now() - (count - i) * 60000,
      open: price * (1 - Math.random() * 0.01),
      high: price * (1 + Math.random() * 0.02),
      low: price * (1 - Math.random() * 0.02),
      close: price,
      volume: Math.floor(Math.random() * 1000000),
    })
  }

  return data
}

// ============================================
// Tests
// ============================================

describe('StrategyParser', () => {
  describe('parse', () => {
    it('should parse simple strategy config', () => {
      const result = strategyParser.parse({
        name: 'Test Strategy',
        entryConditions: [
          { type: 'indicator', indicator: 'RSI', operator: '<', value: 30, period: 14 },
        ],
        exitConditions: [
          { type: 'indicator', indicator: 'RSI', operator: '>', value: 70, period: 14 },
        ],
      })

      expect(result).toBeDefined()
      expect(result.name).toBe('Test Strategy')
      expect(result.entryLong.length).toBe(1)
      expect(result.exitLong.length).toBe(1)
    })

    it('should parse strategy with multiple conditions', () => {
      const result = strategyParser.parse({
        name: 'Multi Condition Strategy',
        entryConditions: [
          { type: 'indicator', indicator: 'RSI', operator: '<', value: 30, period: 14 },
          { type: 'price', operator: '>', value: 100 },
        ],
        exitConditions: [
          { type: 'indicator', indicator: 'RSI', operator: '>', value: 70, period: 14 },
          { type: 'price', operator: '>', value: 110 },
        ],
      })

      expect(result.entryLong.length).toBe(2)
      expect(result.exitLong.length).toBe(2)
    })

    it('should parse strategy with risk management', () => {
      const result = strategyParser.parse({
        name: 'Risk Managed Strategy',
        entryConditions: [],
        exitConditions: [],
        riskManagement: {
          stopLossPercent: 5,
          takeProfitPercent: 10,
          maxDrawdown: 20,
        },
      })

      expect(result.riskManagement).toBeDefined()
      expect(result.riskManagement?.stopLossPercent).toBe(5)
      expect(result.riskManagement?.takeProfitPercent).toBe(10)
    })

    it('should parse strategy with indicators config', () => {
      const result = strategyParser.parse({
        name: 'Indicator Strategy',
        entryConditions: [],
        exitConditions: [],
        indicators: [
          { type: 'SMA', period: 20 },
          { type: 'EMA', period: 10 },
          { type: 'RSI', period: 14 },
        ],
      })

      expect(result.indicators?.size).toBe(3)
    })
  })

  describe('calculateIndicators', () => {
    it('should calculate SMA', () => {
      const data = generateTestOHLCV(30)
      const indicators = new Map<string, IndicatorConfig>()
      indicators.set('SMA_10', { type: 'SMA', period: 10 })

      const result = strategyParser.calculateIndicators(data, indicators)

      expect(result.has('SMA_10')).toBe(true)
      expect(result.get('SMA_10')?.length).toBe(data.length)
    })

    it('should calculate EMA', () => {
      const data = generateTestOHLCV(30)
      const indicators = new Map<string, IndicatorConfig>()
      indicators.set('EMA_12', { type: 'EMA', period: 12 })

      const result = strategyParser.calculateIndicators(data, indicators)

      expect(result.has('EMA_12')).toBe(true)
    })

    it('should calculate RSI', () => {
      const data = generateTestOHLCV(30)
      const indicators = new Map<string, IndicatorConfig>()
      indicators.set('RSI_14', { type: 'RSI', period: 14 })

      const result = strategyParser.calculateIndicators(data, indicators)

      expect(result.has('RSI_14')).toBe(true)

      // RSI should be between 0 and 100
      const rsiValues = result.get('RSI_14')!
      for (const value of rsiValues) {
        if (!isNaN(value)) {
          expect(value).toBeGreaterThanOrEqual(0)
          expect(value).toBeLessThanOrEqual(100)
        }
      }
    })

    it('should calculate multiple indicators', () => {
      const data = generateTestOHLCV(50)
      const indicators = new Map<string, IndicatorConfig>()
      indicators.set('SMA_10', { type: 'SMA', period: 10 })
      indicators.set('SMA_20', { type: 'SMA', period: 20 })
      indicators.set('RSI_14', { type: 'RSI', period: 14 })

      const result = strategyParser.calculateIndicators(data, indicators)

      expect(result.size).toBe(3)
      expect(result.has('SMA_10')).toBe(true)
      expect(result.has('SMA_20')).toBe(true)
      expect(result.has('RSI_14')).toBe(true)
    })
  })

  describe('Condition Evaluation', () => {
    it('should evaluate less_than condition for price', () => {
      const parsed = strategyParser.parse({
        name: 'Test',
        entryConditions: [
          { type: 'price', operator: '<', value: 110 },
        ],
        exitConditions: [],
      })

      const data = generateTestOHLCV(10)
      const context: EvaluationContext = {
        candle: { ...data[9], close: 100 },
        index: 9,
        data,
        indicators: new Map(),
      }

      const condition = parsed.entryLong[0]
      expect(condition.evaluate(context)).toBe(true)

      context.candle = { ...data[9], close: 120 }
      expect(condition.evaluate(context)).toBe(false)
    })

    it('should evaluate greater_than condition for price', () => {
      const parsed = strategyParser.parse({
        name: 'Test',
        entryConditions: [
          { type: 'price', operator: '>', value: 90 },
        ],
        exitConditions: [],
      })

      const data = generateTestOHLCV(10)
      const context: EvaluationContext = {
        candle: { ...data[9], close: 100 },
        index: 9,
        data,
        indicators: new Map(),
      }

      expect(parsed.entryLong[0].evaluate(context)).toBe(true)
    })

    it('should evaluate RSI condition with indicator values', () => {
      const parsed = strategyParser.parse({
        name: 'Test',
        entryConditions: [
          { type: 'indicator', indicator: 'RSI', operator: '<', value: 30, period: 14 },
        ],
        exitConditions: [],
      })

      const data = generateTestOHLCV(50)
      const indicators = new Map<string, number[]>()

      // Create RSI values that are oversold
      const rsiValues = new Array(50).fill(0).map((_, i) => i < 40 ? 50 : 25)
      indicators.set('RSI_14', rsiValues)

      const context: EvaluationContext = {
        candle: data[49],
        index: 49,
        data,
        indicators,
      }

      // RSI at index 49 is 25, which is less than 30
      expect(parsed.entryLong[0].evaluate(context)).toBe(true)
    })

    it('should evaluate volume condition', () => {
      const parsed = strategyParser.parse({
        name: 'Test',
        entryConditions: [
          { type: 'volume', operator: '>', value: 1000000 },
        ],
        exitConditions: [],
      })

      const data = generateTestOHLCV(10)
      const context: EvaluationContext = {
        candle: { ...data[9], volume: 2000000 },
        index: 9,
        data,
        indicators: new Map(),
      }

      expect(parsed.entryLong[0].evaluate(context)).toBe(true)
    })
  })

  describe('Complex Strategy Parsing', () => {
    it('should parse SMA crossover strategy', () => {
      const parsed = strategyParser.parse({
        name: 'SMA Crossover',
        entryConditions: [
          {
            type: 'crossover',
            operator: 'crosses_above',
            indicator: 'SMA',
            period: 10,
            indicator2: 'SMA',
            period2: 20,
          },
        ],
        exitConditions: [
          {
            type: 'crossover',
            operator: 'crosses_below',
            indicator: 'SMA',
            period: 10,
            indicator2: 'SMA',
            period2: 20,
          },
        ],
        indicators: [
          { type: 'SMA', period: 10 },
          { type: 'SMA', period: 20 },
        ],
      })

      expect(parsed.name).toBe('SMA Crossover')
      expect(parsed.indicators?.size).toBe(2)
    })

    it('should parse RSI strategy', () => {
      const parsed = strategyParser.parse({
        name: 'RSI Strategy',
        entryConditions: [
          { type: 'indicator', indicator: 'RSI', operator: '<', value: 30, period: 14 },
        ],
        exitConditions: [
          { type: 'indicator', indicator: 'RSI', operator: '>', value: 70, period: 14 },
        ],
        riskManagement: {
          stopLossPercent: 3,
          takeProfitPercent: 6,
          maxDrawdown: 15,
        },
      })

      expect(parsed.entryLong.length).toBe(1)
      expect(parsed.exitLong.length).toBe(1)
      expect(parsed.riskManagement?.stopLossPercent).toBe(3)
    })

    it('should handle empty conditions', () => {
      const parsed = strategyParser.parse({
        name: 'Empty Strategy',
        entryConditions: [],
        exitConditions: [],
      })

      expect(parsed.entryLong.length).toBe(0)
      expect(parsed.exitLong.length).toBe(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle NaN in indicator values', () => {
      const data = generateTestOHLCV(5) // Not enough data for RSI
      const indicators = new Map<string, IndicatorConfig>()
      indicators.set('RSI_14', { type: 'RSI', period: 14 })

      const result = strategyParser.calculateIndicators(data, indicators)
      const rsiValues = result.get('RSI_14')

      // Should have values (possibly NaN for early indices)
      expect(rsiValues).toBeDefined()
    })

    it('should handle missing indicator in context', () => {
      const parsed = strategyParser.parse({
        name: 'Test',
        entryConditions: [
          { type: 'indicator', indicator: 'RSI', operator: '<', value: 30, period: 14 },
        ],
        exitConditions: [],
      })

      const data = generateTestOHLCV(10)
      const context: EvaluationContext = {
        candle: data[9],
        index: 9,
        data,
        indicators: new Map(), // No indicators provided
      }

      // Should not throw, should return false or handle gracefully
      expect(() => parsed.entryLong[0].evaluate(context)).not.toThrow()
    })

    it('should handle zero values correctly', () => {
      const parsed = strategyParser.parse({
        name: 'Test',
        entryConditions: [
          { type: 'price', operator: '>', value: 0 },
        ],
        exitConditions: [],
      })

      const data = generateTestOHLCV(10)
      const context: EvaluationContext = {
        candle: { ...data[9], close: 0.001 },
        index: 9,
        data,
        indicators: new Map(),
      }

      expect(parsed.entryLong[0].evaluate(context)).toBe(true)
    })
  })
})

describe('IndicatorCalculator', () => {
  let calculator: IndicatorCalculator

  beforeEach(() => {
    calculator = new IndicatorCalculator()
  })

  describe('SMA', () => {
    it('should calculate correct SMA values', () => {
      // Create predictable data
      const data: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

      const smaValues = calculator.calculateSMA(data, 5)

      // SMA of last 5 values (6, 7, 8, 9, 10) = 8
      expect(smaValues[9]).toBeCloseTo(8, 2)
      // SMA of (5, 6, 7, 8, 9) = 7
      expect(smaValues[8]).toBeCloseTo(7, 2)
    })

    it('should return NaN for insufficient data', () => {
      const data: number[] = [1, 2, 3, 4, 5]
      const smaValues = calculator.calculateSMA(data, 5)

      expect(isNaN(smaValues[0])).toBe(true)
      expect(isNaN(smaValues[3])).toBe(true)
      expect(smaValues[4]).toBeCloseTo(3, 2)
    })
  })

  describe('EMA', () => {
    it('should calculate EMA values', () => {
      const data: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      const emaValues = calculator.calculateEMA(data, 5)

      expect(emaValues.length).toBe(10)
      // EMA values should be defined
      expect(emaValues[9]).toBeDefined()
      expect(isNaN(emaValues[9])).toBe(false)
    })
  })

  describe('RSI', () => {
    it('should return values between 0 and 100', () => {
      const data = generateTestOHLCV(100).map(d => d.close)
      const rsiValues = calculator.calculateRSI(data, 14)

      for (let i = 14; i < rsiValues.length; i++) {
        if (!isNaN(rsiValues[i])) {
          expect(rsiValues[i]).toBeGreaterThanOrEqual(0)
          expect(rsiValues[i]).toBeLessThanOrEqual(100)
        }
      }
    })

    it('should return 100 when no losses', () => {
      // Consistently increasing prices
      const data: number[] = Array.from({ length: 20 }, (_, i) => 100 + i)
      const rsiValues = calculator.calculateRSI(data, 14)

      // After enough data, RSI should be 100 (no losses)
      expect(rsiValues[rsiValues.length - 1]).toBe(100)
    })
  })

  describe('MACD', () => {
    it('should calculate MACD components', () => {
      const data = generateTestOHLCV(50).map(d => d.close)
      const macd = calculator.calculateMACD(data)

      expect(macd.macd.length).toBe(50)
      expect(macd.signal.length).toBe(50)
      expect(macd.histogram.length).toBe(50)
    })
  })

  describe('Bollinger Bands', () => {
    it('should calculate upper, middle, and lower bands', () => {
      const data = generateTestOHLCV(30).map(d => d.close)
      const bb = calculator.calculateBollingerBands(data, 20, 2)

      expect(bb.upper.length).toBe(30)
      expect(bb.middle.length).toBe(30)
      expect(bb.lower.length).toBe(30)

      // Upper should be greater than middle, middle greater than lower
      for (let i = 19; i < 30; i++) {
        if (!isNaN(bb.upper[i])) {
          expect(bb.upper[i]).toBeGreaterThan(bb.middle[i])
          expect(bb.middle[i]).toBeGreaterThan(bb.lower[i])
        }
      }
    })
  })

  describe('ATR', () => {
    it('should calculate ATR values', () => {
      const data = generateTestOHLCV(30)
      const atrValues = calculator.calculateATR(data, 14)

      expect(atrValues.length).toBe(30)
      // ATR should be positive after enough data
      for (let i = 14; i < atrValues.length; i++) {
        if (!isNaN(atrValues[i])) {
          expect(atrValues[i]).toBeGreaterThan(0)
        }
      }
    })
  })

  describe('Stochastic', () => {
    it('should calculate K and D values', () => {
      const data = generateTestOHLCV(30)
      const stoch = calculator.calculateStochastic(data, 14, 3)

      expect(stoch.k.length).toBe(30)

      // K values should be between 0 and 100
      for (let i = 13; i < stoch.k.length; i++) {
        if (!isNaN(stoch.k[i])) {
          expect(stoch.k[i]).toBeGreaterThanOrEqual(0)
          expect(stoch.k[i]).toBeLessThanOrEqual(100)
        }
      }
    })
  })

  describe('Cache', () => {
    it('should cache indicator values', () => {
      const data: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

      const sma1 = calculator.calculateSMA(data, 5)
      const sma2 = calculator.calculateSMA(data, 5)

      // Should return the same cached array
      expect(sma1).toBe(sma2)
    })

    it('should clear cache', () => {
      const data: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

      const sma1 = calculator.calculateSMA(data, 5)
      calculator.clearCache()
      const sma2 = calculator.calculateSMA(data, 5)

      // Should be different array instances after cache clear
      expect(sma1).not.toBe(sma2)
      // But values should be the same
      expect(sma1).toEqual(sma2)
    })
  })
})

describe('StrategyParser Class', () => {
  it('should be a singleton', () => {
    expect(strategyParser).toBeInstanceOf(StrategyParser)
  })

  it('should create new instance', () => {
    const parser = new StrategyParser()
    expect(parser).toBeInstanceOf(StrategyParser)
  })
})
