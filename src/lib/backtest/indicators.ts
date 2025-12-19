// ============================================
// Technical Indicators for Backtesting
// ============================================

import type { OHLCV, IndicatorResult, IndicatorType } from './types'

// ============================================
// Helper Functions
// ============================================

/**
 * Calculate Simple Moving Average
 */
export function sma(data: number[], period: number): number[] {
  const result: number[] = []

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN)
      continue
    }

    let sum = 0
    for (let j = 0; j < period; j++) {
      sum += data[i - j]
    }
    result.push(sum / period)
  }

  return result
}

/**
 * Calculate Exponential Moving Average
 */
export function ema(data: number[], period: number): number[] {
  const result: number[] = []
  const multiplier = 2 / (period + 1)

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN)
      continue
    }

    if (i === period - 1) {
      // First EMA is SMA
      let sum = 0
      for (let j = 0; j < period; j++) {
        sum += data[i - j]
      }
      result.push(sum / period)
      continue
    }

    const prevEma = result[i - 1]
    const currentEma = (data[i] - prevEma) * multiplier + prevEma
    result.push(currentEma)
  }

  return result
}

/**
 * Calculate Relative Strength Index
 */
export function rsi(data: number[], period: number = 14): number[] {
  const result: number[] = []
  const gains: number[] = []
  const losses: number[] = []

  // Calculate price changes
  for (let i = 1; i < data.length; i++) {
    const change = data[i] - data[i - 1]
    gains.push(change > 0 ? change : 0)
    losses.push(change < 0 ? Math.abs(change) : 0)
  }

  // First value is NaN
  result.push(NaN)

  for (let i = 0; i < gains.length; i++) {
    if (i < period - 1) {
      result.push(NaN)
      continue
    }

    let avgGain: number
    let avgLoss: number

    if (i === period - 1) {
      // First RSI calculation uses SMA
      avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period
      avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period
    } else {
      // Subsequent calculations use smoothed average
      const prevAvgGain = (result[i] !== undefined ? (100 - result[i]) : 50) / 100
      const prevAvgLoss = (result[i] !== undefined ? result[i] : 50) / 100
      avgGain = (prevAvgGain * (period - 1) + gains[i]) / period
      avgLoss = (prevAvgLoss * (period - 1) + losses[i]) / period
    }

    if (avgLoss === 0) {
      result.push(100)
    } else {
      const rs = avgGain / avgLoss
      result.push(100 - 100 / (1 + rs))
    }
  }

  return result
}

/**
 * Calculate MACD
 */
export function macd(
  data: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): { macd: number[]; signal: number[]; histogram: number[] } {
  const fastEma = ema(data, fastPeriod)
  const slowEma = ema(data, slowPeriod)

  const macdLine: number[] = []
  for (let i = 0; i < data.length; i++) {
    if (isNaN(fastEma[i]) || isNaN(slowEma[i])) {
      macdLine.push(NaN)
    } else {
      macdLine.push(fastEma[i] - slowEma[i])
    }
  }

  // Calculate signal line (EMA of MACD)
  const validMacd = macdLine.filter((v) => !isNaN(v))
  const signalEma = ema(validMacd, signalPeriod)

  const signalLine: number[] = []
  let signalIndex = 0
  for (let i = 0; i < data.length; i++) {
    if (isNaN(macdLine[i])) {
      signalLine.push(NaN)
    } else {
      signalLine.push(signalEma[signalIndex] || NaN)
      signalIndex++
    }
  }

  // Calculate histogram
  const histogram: number[] = []
  for (let i = 0; i < data.length; i++) {
    if (isNaN(macdLine[i]) || isNaN(signalLine[i])) {
      histogram.push(NaN)
    } else {
      histogram.push(macdLine[i] - signalLine[i])
    }
  }

  return { macd: macdLine, signal: signalLine, histogram }
}

/**
 * Calculate Bollinger Bands
 */
export function bollingerBands(
  data: number[],
  period: number = 20,
  stdDev: number = 2
): { upper: number[]; middle: number[]; lower: number[] } {
  const middle = sma(data, period)
  const upper: number[] = []
  const lower: number[] = []

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      upper.push(NaN)
      lower.push(NaN)
      continue
    }

    // Calculate standard deviation
    const slice = data.slice(i - period + 1, i + 1)
    const mean = middle[i]
    const squaredDiffs = slice.map((v) => Math.pow(v - mean, 2))
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / period
    const std = Math.sqrt(avgSquaredDiff)

    upper.push(mean + stdDev * std)
    lower.push(mean - stdDev * std)
  }

  return { upper, middle, lower }
}

/**
 * Calculate Average True Range
 */
export function atr(candles: OHLCV[], period: number = 14): number[] {
  const trueRanges: number[] = []

  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      trueRanges.push(candles[i].high - candles[i].low)
      continue
    }

    const high = candles[i].high
    const low = candles[i].low
    const prevClose = candles[i - 1].close

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    )
    trueRanges.push(tr)
  }

  // ATR is SMA of True Range
  return sma(trueRanges, period)
}

/**
 * Calculate Stochastic Oscillator
 */
export function stochastic(
  candles: OHLCV[],
  kPeriod: number = 14,
  dPeriod: number = 3
): { k: number[]; d: number[] } {
  const kValues: number[] = []

  for (let i = 0; i < candles.length; i++) {
    if (i < kPeriod - 1) {
      kValues.push(NaN)
      continue
    }

    const slice = candles.slice(i - kPeriod + 1, i + 1)
    const highestHigh = Math.max(...slice.map((c) => c.high))
    const lowestLow = Math.min(...slice.map((c) => c.low))
    const currentClose = candles[i].close

    if (highestHigh === lowestLow) {
      kValues.push(50) // Neutral when no range
    } else {
      const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100
      kValues.push(k)
    }
  }

  // %D is SMA of %K
  const dValues = sma(kValues, dPeriod)

  return { k: kValues, d: dValues }
}

/**
 * Calculate Momentum
 */
export function momentum(data: number[], period: number = 10): number[] {
  const result: number[] = []

  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      result.push(NaN)
      continue
    }
    result.push(data[i] - data[i - period])
  }

  return result
}

// ============================================
// Indicator Factory
// ============================================

export function calculateIndicator(
  type: IndicatorType,
  candles: OHLCV[],
  params: Record<string, number>
): IndicatorResult {
  const closes = candles.map((c) => c.close)
  const timestamps = candles.map((c) => c.timestamp)

  let values: number[] = []

  switch (type) {
    case 'sma':
      values = sma(closes, params.period || 20)
      break
    case 'ema':
      values = ema(closes, params.period || 20)
      break
    case 'rsi':
      values = rsi(closes, params.period || 14)
      break
    case 'macd':
      const macdResult = macd(
        closes,
        params.fastPeriod || 12,
        params.slowPeriod || 26,
        params.signalPeriod || 9
      )
      values = macdResult.macd
      break
    case 'bollinger':
      const bbResult = bollingerBands(
        closes,
        params.period || 20,
        params.stdDev || 2
      )
      values = bbResult.middle
      break
    case 'atr':
      values = atr(candles, params.period || 14)
      break
    case 'stochastic':
      const stochResult = stochastic(
        candles,
        params.kPeriod || 14,
        params.dPeriod || 3
      )
      values = stochResult.k
      break
    case 'momentum':
      values = momentum(closes, params.period || 10)
      break
    case 'volume':
      values = candles.map((c) => c.volume)
      break
    default:
      values = closes
  }

  return {
    type,
    values,
    timestamps,
    params,
  }
}
