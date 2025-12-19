// ============================================
// Strategy Parser
// 사용자 전략 설정을 실행 가능한 조건으로 변환
// ============================================

import type { OHLCV } from './types'

// ============================================
// Types
// ============================================

export interface StrategyCondition {
  type: 'indicator' | 'price' | 'time' | 'volume' | 'crossover'
  indicator?: string
  indicator2?: string // crossover용
  operator: '>' | '<' | '>=' | '<=' | '==' | 'crosses_above' | 'crosses_below'
  value?: number | string
  period?: number
  period2?: number
  description?: string
}

export interface IndicatorConfig {
  type: string
  period?: number
  params?: Record<string, number>
}

export interface RiskManagement {
  stopLossPercent?: number
  takeProfitPercent?: number
  trailingStopPercent?: number
  maxPositionSize?: number
  maxDrawdown?: number
}

export interface ParsedStrategy {
  name: string
  entryLong: CompiledCondition[]
  entryShort: CompiledCondition[]
  exitLong: CompiledCondition[]
  exitShort: CompiledCondition[]
  riskManagement: RiskManagement
  indicators: Map<string, IndicatorConfig>
}

export interface CompiledCondition {
  evaluate: (context: EvaluationContext) => boolean
  description: string
}

export interface EvaluationContext {
  candle: OHLCV
  index: number
  data: OHLCV[]
  indicators: Map<string, number[]>
  position?: {
    side: 'long' | 'short'
    entryPrice: number
    currentPnlPercent: number
  }
}

// ============================================
// Indicator Calculator
// ============================================

export class IndicatorCalculator {
  private cache = new Map<string, number[]>()

  /**
   * SMA (Simple Moving Average)
   */
  calculateSMA(data: number[], period: number): number[] {
    const key = `sma_${period}`
    if (this.cache.has(key)) return this.cache.get(key)!

    const result: number[] = []
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        result.push(NaN)
      } else {
        const slice = data.slice(i - period + 1, i + 1)
        result.push(slice.reduce((a, b) => a + b, 0) / period)
      }
    }
    this.cache.set(key, result)
    return result
  }

  /**
   * EMA (Exponential Moving Average)
   */
  calculateEMA(data: number[], period: number): number[] {
    const key = `ema_${period}`
    if (this.cache.has(key)) return this.cache.get(key)!

    const multiplier = 2 / (period + 1)
    const result: number[] = []
    let ema = data[0]

    for (let i = 0; i < data.length; i++) {
      if (i === 0) {
        result.push(data[0])
      } else {
        ema = (data[i] - ema) * multiplier + ema
        result.push(ema)
      }
    }
    this.cache.set(key, result)
    return result
  }

  /**
   * RSI (Relative Strength Index)
   */
  calculateRSI(data: number[], period: number = 14): number[] {
    const key = `rsi_${period}`
    if (this.cache.has(key)) return this.cache.get(key)!

    const result: number[] = []
    const gains: number[] = []
    const losses: number[] = []

    for (let i = 0; i < data.length; i++) {
      if (i === 0) {
        result.push(NaN)
        continue
      }

      const change = data[i] - data[i - 1]
      gains.push(change > 0 ? change : 0)
      losses.push(change < 0 ? Math.abs(change) : 0)

      if (i < period) {
        result.push(NaN)
        continue
      }

      const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period
      const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period

      if (avgLoss === 0) {
        result.push(100)
      } else {
        const rs = avgGain / avgLoss
        result.push(100 - 100 / (1 + rs))
      }
    }
    this.cache.set(key, result)
    return result
  }

  /**
   * MACD
   */
  calculateMACD(
    data: number[],
    fastPeriod: number = 12,
    slowPeriod: number = 26,
    signalPeriod: number = 9
  ): { macd: number[]; signal: number[]; histogram: number[] } {
    const fastEMA = this.calculateEMA(data, fastPeriod)
    const slowEMA = this.calculateEMA(data, slowPeriod)

    const macdLine: number[] = []
    for (let i = 0; i < data.length; i++) {
      macdLine.push(fastEMA[i] - slowEMA[i])
    }

    const signalLine = this.calculateEMA(macdLine, signalPeriod)
    const histogram: number[] = []
    for (let i = 0; i < data.length; i++) {
      histogram.push(macdLine[i] - signalLine[i])
    }

    return { macd: macdLine, signal: signalLine, histogram }
  }

  /**
   * Bollinger Bands
   */
  calculateBollingerBands(
    data: number[],
    period: number = 20,
    stdDev: number = 2
  ): { upper: number[]; middle: number[]; lower: number[] } {
    const middle = this.calculateSMA(data, period)
    const upper: number[] = []
    const lower: number[] = []

    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        upper.push(NaN)
        lower.push(NaN)
        continue
      }

      const slice = data.slice(i - period + 1, i + 1)
      const mean = middle[i]
      const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period
      const std = Math.sqrt(variance)

      upper.push(mean + stdDev * std)
      lower.push(mean - stdDev * std)
    }

    return { upper, middle, lower }
  }

  /**
   * ATR (Average True Range)
   */
  calculateATR(data: OHLCV[], period: number = 14): number[] {
    const trueRanges: number[] = []

    for (let i = 0; i < data.length; i++) {
      if (i === 0) {
        trueRanges.push(data[i].high - data[i].low)
        continue
      }

      const tr = Math.max(
        data[i].high - data[i].low,
        Math.abs(data[i].high - data[i - 1].close),
        Math.abs(data[i].low - data[i - 1].close)
      )
      trueRanges.push(tr)
    }

    return this.calculateSMA(trueRanges, period)
  }

  /**
   * Stochastic Oscillator
   */
  calculateStochastic(
    data: OHLCV[],
    kPeriod: number = 14,
    dPeriod: number = 3
  ): { k: number[]; d: number[] } {
    const kValues: number[] = []

    for (let i = 0; i < data.length; i++) {
      if (i < kPeriod - 1) {
        kValues.push(NaN)
        continue
      }

      const slice = data.slice(i - kPeriod + 1, i + 1)
      const lowest = Math.min(...slice.map(d => d.low))
      const highest = Math.max(...slice.map(d => d.high))

      if (highest === lowest) {
        kValues.push(50)
      } else {
        kValues.push(((data[i].close - lowest) / (highest - lowest)) * 100)
      }
    }

    const dValues = this.calculateSMA(kValues.filter(v => !isNaN(v)), dPeriod)
    // Pad with NaN for alignment
    const paddedD: number[] = new Array(kPeriod - 1 + dPeriod - 1).fill(NaN)
    paddedD.push(...dValues)

    return { k: kValues, d: paddedD }
  }

  /**
   * 캐시 클리어
   */
  clearCache(): void {
    this.cache.clear()
  }
}

// ============================================
// Strategy Parser
// ============================================

export class StrategyParser {
  private calculator = new IndicatorCalculator()

  /**
   * 전략 설정을 파싱하여 실행 가능한 조건으로 변환
   */
  parse(strategyConfig: {
    name?: string
    entryConditions?: StrategyCondition[]
    exitConditions?: StrategyCondition[]
    riskManagement?: RiskManagement
    indicators?: IndicatorConfig[]
  }): ParsedStrategy {
    const indicators = new Map<string, IndicatorConfig>()

    // 지표 설정 등록
    if (strategyConfig.indicators) {
      for (const ind of strategyConfig.indicators) {
        indicators.set(`${ind.type}_${ind.period || 'default'}`, ind)
      }
    }

    // 진입/청산 조건 컴파일
    const entryLong = this.compileConditions(
      strategyConfig.entryConditions?.filter(c => !c.description?.includes('short')) || [],
      'entry_long'
    )

    const entryShort = this.compileConditions(
      strategyConfig.entryConditions?.filter(c => c.description?.includes('short')) || [],
      'entry_short'
    )

    const exitLong = this.compileConditions(
      strategyConfig.exitConditions?.filter(c => !c.description?.includes('short')) || [],
      'exit_long'
    )

    const exitShort = this.compileConditions(
      strategyConfig.exitConditions?.filter(c => c.description?.includes('short')) || [],
      'exit_short'
    )

    return {
      name: strategyConfig.name || 'Unnamed Strategy',
      entryLong,
      entryShort,
      exitLong,
      exitShort,
      riskManagement: strategyConfig.riskManagement || {},
      indicators,
    }
  }

  /**
   * 조건 배열을 컴파일
   */
  private compileConditions(
    conditions: StrategyCondition[],
    _type: string
  ): CompiledCondition[] {
    return conditions.map(condition => this.compileCondition(condition))
  }

  /**
   * 단일 조건을 컴파일
   */
  private compileCondition(condition: StrategyCondition): CompiledCondition {
    const description = condition.description || `${condition.indicator} ${condition.operator} ${condition.value}`

    switch (condition.type) {
      case 'indicator':
        return this.compileIndicatorCondition(condition, description)

      case 'crossover':
        return this.compileCrossoverCondition(condition, description)

      case 'price':
        return this.compilePriceCondition(condition, description)

      case 'volume':
        return this.compileVolumeCondition(condition, description)

      default:
        return {
          evaluate: () => false,
          description: `Unknown condition type: ${condition.type}`,
        }
    }
  }

  /**
   * 지표 기반 조건 컴파일
   */
  private compileIndicatorCondition(
    condition: StrategyCondition,
    description: string
  ): CompiledCondition {
    return {
      evaluate: (ctx: EvaluationContext) => {
        const indicatorKey = `${condition.indicator}_${condition.period || 14}`
        const values = ctx.indicators.get(indicatorKey)
        if (!values || ctx.index >= values.length) return false

        const currentValue = values[ctx.index]
        if (isNaN(currentValue)) return false

        const targetValue = typeof condition.value === 'number'
          ? condition.value
          : parseFloat(String(condition.value))

        return this.compareValues(currentValue, condition.operator, targetValue)
      },
      description,
    }
  }

  /**
   * 크로스오버 조건 컴파일
   */
  private compileCrossoverCondition(
    condition: StrategyCondition,
    description: string
  ): CompiledCondition {
    return {
      evaluate: (ctx: EvaluationContext) => {
        const key1 = `${condition.indicator}_${condition.period || 10}`
        const key2 = `${condition.indicator2}_${condition.period2 || 20}`

        const values1 = ctx.indicators.get(key1)
        const values2 = ctx.indicators.get(key2)

        if (!values1 || !values2 || ctx.index < 1) return false

        const curr1 = values1[ctx.index]
        const curr2 = values2[ctx.index]
        const prev1 = values1[ctx.index - 1]
        const prev2 = values2[ctx.index - 1]

        if ([curr1, curr2, prev1, prev2].some(v => isNaN(v))) return false

        if (condition.operator === 'crosses_above') {
          return prev1 <= prev2 && curr1 > curr2
        } else if (condition.operator === 'crosses_below') {
          return prev1 >= prev2 && curr1 < curr2
        }

        return false
      },
      description,
    }
  }

  /**
   * 가격 기반 조건 컴파일
   */
  private compilePriceCondition(
    condition: StrategyCondition,
    description: string
  ): CompiledCondition {
    return {
      evaluate: (ctx: EvaluationContext) => {
        const price = ctx.candle.close
        const targetValue = typeof condition.value === 'number'
          ? condition.value
          : parseFloat(String(condition.value))

        return this.compareValues(price, condition.operator, targetValue)
      },
      description,
    }
  }

  /**
   * 거래량 기반 조건 컴파일
   */
  private compileVolumeCondition(
    condition: StrategyCondition,
    description: string
  ): CompiledCondition {
    return {
      evaluate: (ctx: EvaluationContext) => {
        const volume = ctx.candle.volume
        const targetValue = typeof condition.value === 'number'
          ? condition.value
          : parseFloat(String(condition.value))

        return this.compareValues(volume, condition.operator, targetValue)
      },
      description,
    }
  }

  /**
   * 값 비교
   */
  private compareValues(
    current: number,
    operator: StrategyCondition['operator'],
    target: number
  ): boolean {
    switch (operator) {
      case '>': return current > target
      case '<': return current < target
      case '>=': return current >= target
      case '<=': return current <= target
      case '==': return Math.abs(current - target) < 0.0001
      default: return false
    }
  }

  /**
   * 지표 값 계산 (전체 데이터)
   */
  calculateIndicators(data: OHLCV[], indicators: Map<string, IndicatorConfig>): Map<string, number[]> {
    this.calculator.clearCache()
    const result = new Map<string, number[]>()
    const closes = data.map(d => d.close)

    for (const [key, config] of indicators) {
      switch (config.type.toUpperCase()) {
        case 'SMA':
          result.set(key, this.calculator.calculateSMA(closes, config.period || 20))
          break
        case 'EMA':
          result.set(key, this.calculator.calculateEMA(closes, config.period || 20))
          break
        case 'RSI':
          result.set(key, this.calculator.calculateRSI(closes, config.period || 14))
          break
        case 'MACD': {
          const macd = this.calculator.calculateMACD(closes)
          result.set(`MACD_line`, macd.macd)
          result.set(`MACD_signal`, macd.signal)
          result.set(`MACD_histogram`, macd.histogram)
          break
        }
        case 'BB':
        case 'BOLLINGER': {
          const bb = this.calculator.calculateBollingerBands(closes, config.period || 20)
          result.set(`BB_upper`, bb.upper)
          result.set(`BB_middle`, bb.middle)
          result.set(`BB_lower`, bb.lower)
          break
        }
        case 'ATR':
          result.set(key, this.calculator.calculateATR(data, config.period || 14))
          break
        case 'STOCH': {
          const stoch = this.calculator.calculateStochastic(data, config.period || 14)
          result.set(`STOCH_k`, stoch.k)
          result.set(`STOCH_d`, stoch.d)
          break
        }
      }
    }

    return result
  }
}

// 싱글톤 export
export const strategyParser = new StrategyParser()
