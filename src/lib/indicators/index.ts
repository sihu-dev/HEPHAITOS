// ============================================
// Technical Indicators Module
// trading-signals 기반 100+ 지표 제공
// ============================================

// Batch Calculations (백테스트용)
export {
  calculateSMA,
  calculateEMA,
  calculateWMA,
  calculateDEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateATR,
  calculateStochastic,
  calculateStochasticRSI,
  calculateADX,
  calculateCCI,
  calculateROC,
  calculateWilliamsR,
  calculateOBV,
  calculateMFI,
} from './adapter'

// Faster Variants (대용량 백테스트용)
export {
  fastSMA,
  fastEMA,
  fastRSI,
  fastMACD,
} from './adapter'

// Streaming Indicators (실시간용)
export {
  StreamingRSI,
  StreamingMACD,
  StreamingBollingerBands,
} from './adapter'

// Utility Functions
export {
  detectCrossover,
  detectRSISignal,
  detectBollingerSignal,
} from './adapter'

// Types
export type {
  IndicatorConfig,
  MACDOutput,
  BollingerOutput,
  StochasticOutput,
} from './adapter'

// ============================================
// Legacy Compatibility
// 기존 lib/backtest/indicators.ts와 호환
// ============================================

import {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateATR,
  calculateStochastic,
} from './adapter'

import type { OHLCV } from '@/types'
import type { IndicatorResult, IndicatorType } from '@/lib/backtest/types'

/**
 * Legacy SMA (기존 API 호환)
 */
export function sma(data: number[], period: number): number[] {
  return calculateSMA(data, period)
}

/**
 * Legacy EMA (기존 API 호환)
 */
export function ema(data: number[], period: number): number[] {
  return calculateEMA(data, period)
}

/**
 * Legacy RSI (기존 API 호환)
 */
export function rsi(data: number[], period: number = 14): number[] {
  return calculateRSI(data, period)
}

/**
 * Legacy MACD (기존 API 호환)
 */
export function macd(
  data: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): { macd: number[]; signal: number[]; histogram: number[] } {
  return calculateMACD(data, fastPeriod, slowPeriod, signalPeriod)
}

/**
 * Legacy Bollinger Bands (기존 API 호환)
 */
export function bollingerBands(
  data: number[],
  period: number = 20,
  stdDev: number = 2
): { upper: number[]; middle: number[]; lower: number[] } {
  return calculateBollingerBands(data, period, stdDev)
}

/**
 * Legacy ATR (기존 API 호환)
 */
export function atr(candles: OHLCV[], period: number = 14): number[] {
  return calculateATR(candles, period)
}

/**
 * Legacy Stochastic (기존 API 호환)
 */
export function stochastic(
  candles: OHLCV[],
  kPeriod: number = 14,
  dPeriod: number = 3
): { k: number[]; d: number[] } {
  return calculateStochastic(candles, kPeriod, dPeriod)
}

/**
 * Momentum (자체 구현 - trading-signals에 없음)
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

/**
 * Legacy Indicator Factory (기존 API 호환)
 */
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
      values = calculateSMA(closes, params.period || 20)
      break
    case 'ema':
      values = calculateEMA(closes, params.period || 20)
      break
    case 'rsi':
      values = calculateRSI(closes, params.period || 14)
      break
    case 'macd':
      const macdResult = calculateMACD(
        closes,
        params.fastPeriod || 12,
        params.slowPeriod || 26,
        params.signalPeriod || 9
      )
      values = macdResult.macd
      break
    case 'bollinger':
      const bbResult = calculateBollingerBands(
        closes,
        params.period || 20,
        params.stdDev || 2
      )
      values = bbResult.middle
      break
    case 'atr':
      values = calculateATR(candles, params.period || 14)
      break
    case 'stochastic':
      const stochResult = calculateStochastic(
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
