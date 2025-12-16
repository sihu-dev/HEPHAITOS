// ============================================
// Technical Indicators Adapter
// trading-signals 라이브러리 래퍼
// 100+ 검증된 지표 제공
// ============================================

import {
  SMA,
  EMA,
  WMA,
  DEMA,
  RSI,
  MACD,
  BollingerBands,
  ATR,
  StochasticRSI,
  StochasticOscillator,
  ADX,
  CCI,
  ROC,
  OBV,
  MFI,
  VWAP,
  WilliamsR,
  FasterSMA,
  FasterEMA,
  FasterRSI,
  FasterMACD,
  type MACDResult,
  type BollingerBandsResult,
  type StochasticResult,
} from 'trading-signals'

import type { OHLCV } from '@/types'

// ============================================
// Types
// ============================================

export interface IndicatorConfig {
  period?: number
  fastPeriod?: number
  slowPeriod?: number
  signalPeriod?: number
  stdDev?: number
  kPeriod?: number
  dPeriod?: number
}

export interface MACDOutput {
  macd: number[]
  signal: number[]
  histogram: number[]
}

export interface BollingerOutput {
  upper: number[]
  middle: number[]
  lower: number[]
}

export interface StochasticOutput {
  k: number[]
  d: number[]
}

// ============================================
// Batch Calculation Functions
// 백테스트용 배치 계산
// ============================================

/**
 * Simple Moving Average (단순 이동평균)
 * @param data - 가격 데이터 배열
 * @param period - 기간 (기본값: 20)
 */
export function calculateSMA(data: number[], period: number = 20): number[] {
  const sma = new SMA(period)
  const results: number[] = []

  for (const value of data) {
    sma.update(value)
    const result = sma.getResult()
    results.push(result ? Number(result.toFixed(8)) : NaN)
  }

  return results
}

/**
 * Exponential Moving Average (지수 이동평균)
 * @param data - 가격 데이터 배열
 * @param period - 기간 (기본값: 20)
 */
export function calculateEMA(data: number[], period: number = 20): number[] {
  const ema = new EMA(period)
  const results: number[] = []

  for (const value of data) {
    ema.update(value)
    const result = ema.getResult()
    results.push(result ? Number(result.toFixed(8)) : NaN)
  }

  return results
}

/**
 * Weighted Moving Average (가중 이동평균)
 * @param data - 가격 데이터 배열
 * @param period - 기간 (기본값: 20)
 */
export function calculateWMA(data: number[], period: number = 20): number[] {
  const wma = new WMA(period)
  const results: number[] = []

  for (const value of data) {
    wma.update(value)
    const result = wma.getResult()
    results.push(result ? Number(result.toFixed(8)) : NaN)
  }

  return results
}

/**
 * Double Exponential Moving Average (이중 지수 이동평균)
 * @param data - 가격 데이터 배열
 * @param period - 기간 (기본값: 20)
 */
export function calculateDEMA(data: number[], period: number = 20): number[] {
  const dema = new DEMA(period)
  const results: number[] = []

  for (const value of data) {
    dema.update(value)
    const result = dema.getResult()
    results.push(result ? Number(result.toFixed(8)) : NaN)
  }

  return results
}

/**
 * Relative Strength Index (상대강도지수)
 * @param data - 가격 데이터 배열
 * @param period - 기간 (기본값: 14)
 */
export function calculateRSI(data: number[], period: number = 14): number[] {
  const rsi = new RSI(period)
  const results: number[] = []

  for (const value of data) {
    rsi.update(value)
    const result = rsi.getResult()
    results.push(result ? Number(result.toFixed(2)) : NaN)
  }

  return results
}

/**
 * MACD (이동평균 수렴/발산)
 * @param data - 가격 데이터 배열
 * @param fastPeriod - 빠른 EMA 기간 (기본값: 12)
 * @param slowPeriod - 느린 EMA 기간 (기본값: 26)
 * @param signalPeriod - 시그널 EMA 기간 (기본값: 9)
 */
export function calculateMACD(
  data: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDOutput {
  const macd = new MACD({
    indicator: EMA,
    shortInterval: fastPeriod,
    longInterval: slowPeriod,
    signalInterval: signalPeriod,
  })

  const macdLine: number[] = []
  const signalLine: number[] = []
  const histogram: number[] = []

  for (const value of data) {
    macd.update(value)
    const result = macd.getResult() as MACDResult | undefined

    if (result) {
      macdLine.push(Number(result.macd.toFixed(8)))
      signalLine.push(Number(result.signal.toFixed(8)))
      histogram.push(Number(result.histogram.toFixed(8)))
    } else {
      macdLine.push(NaN)
      signalLine.push(NaN)
      histogram.push(NaN)
    }
  }

  return { macd: macdLine, signal: signalLine, histogram }
}

/**
 * Bollinger Bands (볼린저 밴드)
 * @param data - 가격 데이터 배열
 * @param period - 기간 (기본값: 20)
 * @param stdDev - 표준편차 배수 (기본값: 2)
 */
export function calculateBollingerBands(
  data: number[],
  period: number = 20,
  stdDev: number = 2
): BollingerOutput {
  const bb = new BollingerBands(period, stdDev)

  const upper: number[] = []
  const middle: number[] = []
  const lower: number[] = []

  for (const value of data) {
    bb.update(value)
    const result = bb.getResult() as BollingerBandsResult | undefined

    if (result) {
      upper.push(Number(result.upper.toFixed(8)))
      middle.push(Number(result.middle.toFixed(8)))
      lower.push(Number(result.lower.toFixed(8)))
    } else {
      upper.push(NaN)
      middle.push(NaN)
      lower.push(NaN)
    }
  }

  return { upper, middle, lower }
}

/**
 * Average True Range (평균 실질 범위)
 * @param candles - OHLCV 캔들 데이터
 * @param period - 기간 (기본값: 14)
 */
export function calculateATR(candles: OHLCV[], period: number = 14): number[] {
  const atr = new ATR(period)
  const results: number[] = []

  for (const candle of candles) {
    atr.update({
      high: candle.high,
      low: candle.low,
      close: candle.close,
    })
    const result = atr.getResult()
    results.push(result ? Number(result.toFixed(8)) : NaN)
  }

  return results
}

/**
 * Stochastic Oscillator (스토캐스틱)
 * @param candles - OHLCV 캔들 데이터
 * @param kPeriod - %K 기간 (기본값: 14)
 * @param dPeriod - %D 기간 (기본값: 3)
 */
export function calculateStochastic(
  candles: OHLCV[],
  kPeriod: number = 14,
  dPeriod: number = 3
): StochasticOutput {
  const stoch = new StochasticOscillator(kPeriod, dPeriod)

  const k: number[] = []
  const d: number[] = []

  for (const candle of candles) {
    stoch.update({
      high: candle.high,
      low: candle.low,
      close: candle.close,
    })
    const result = stoch.getResult() as StochasticResult | undefined

    if (result) {
      k.push(Number(result.stochK.toFixed(2)))
      d.push(Number(result.stochD.toFixed(2)))
    } else {
      k.push(NaN)
      d.push(NaN)
    }
  }

  return { k, d }
}

/**
 * Stochastic RSI (스토캐스틱 RSI)
 * @param data - 가격 데이터 배열
 * @param rsiPeriod - RSI 기간 (기본값: 14)
 * @param stochPeriod - 스토캐스틱 기간 (기본값: 14)
 * @param kPeriod - %K 기간 (기본값: 3)
 * @param dPeriod - %D 기간 (기본값: 3)
 */
export function calculateStochasticRSI(
  data: number[],
  rsiPeriod: number = 14,
  stochPeriod: number = 14,
  kPeriod: number = 3,
  dPeriod: number = 3
): StochasticOutput {
  const stochRSI = new StochasticRSI(rsiPeriod, stochPeriod, kPeriod, dPeriod)

  const k: number[] = []
  const d: number[] = []

  for (const value of data) {
    stochRSI.update(value)
    const result = stochRSI.getResult() as StochasticResult | undefined

    if (result) {
      k.push(Number(result.stochK.toFixed(2)))
      d.push(Number(result.stochD.toFixed(2)))
    } else {
      k.push(NaN)
      d.push(NaN)
    }
  }

  return { k, d }
}

/**
 * ADX (Average Directional Index)
 * @param candles - OHLCV 캔들 데이터
 * @param period - 기간 (기본값: 14)
 */
export function calculateADX(candles: OHLCV[], period: number = 14): number[] {
  const adx = new ADX(period)
  const results: number[] = []

  for (const candle of candles) {
    adx.update({
      high: candle.high,
      low: candle.low,
      close: candle.close,
    })
    const result = adx.getResult()
    results.push(result ? Number(result.toFixed(2)) : NaN)
  }

  return results
}

/**
 * CCI (Commodity Channel Index)
 * @param candles - OHLCV 캔들 데이터
 * @param period - 기간 (기본값: 20)
 */
export function calculateCCI(candles: OHLCV[], period: number = 20): number[] {
  const cci = new CCI(period)
  const results: number[] = []

  for (const candle of candles) {
    cci.update({
      high: candle.high,
      low: candle.low,
      close: candle.close,
    })
    const result = cci.getResult()
    results.push(result ? Number(result.toFixed(2)) : NaN)
  }

  return results
}

/**
 * ROC (Rate of Change)
 * @param data - 가격 데이터 배열
 * @param period - 기간 (기본값: 10)
 */
export function calculateROC(data: number[], period: number = 10): number[] {
  const roc = new ROC(period)
  const results: number[] = []

  for (const value of data) {
    roc.update(value)
    const result = roc.getResult()
    results.push(result ? Number(result.toFixed(4)) : NaN)
  }

  return results
}

/**
 * Williams %R
 * @param candles - OHLCV 캔들 데이터
 * @param period - 기간 (기본값: 14)
 */
export function calculateWilliamsR(candles: OHLCV[], period: number = 14): number[] {
  const wr = new WilliamsR(period)
  const results: number[] = []

  for (const candle of candles) {
    wr.update({
      high: candle.high,
      low: candle.low,
      close: candle.close,
    })
    const result = wr.getResult()
    results.push(result ? Number(result.toFixed(2)) : NaN)
  }

  return results
}

/**
 * OBV (On Balance Volume)
 * @param candles - OHLCV 캔들 데이터
 */
export function calculateOBV(candles: OHLCV[]): number[] {
  const obv = new OBV()
  const results: number[] = []

  for (const candle of candles) {
    obv.update({
      close: candle.close,
      volume: candle.volume,
    })
    const result = obv.getResult()
    results.push(result ? Number(result.toFixed(0)) : NaN)
  }

  return results
}

/**
 * MFI (Money Flow Index)
 * @param candles - OHLCV 캔들 데이터
 * @param period - 기간 (기본값: 14)
 */
export function calculateMFI(candles: OHLCV[], period: number = 14): number[] {
  const mfi = new MFI(period)
  const results: number[] = []

  for (const candle of candles) {
    mfi.update({
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume,
    })
    const result = mfi.getResult()
    results.push(result ? Number(result.toFixed(2)) : NaN)
  }

  return results
}

// ============================================
// Streaming Indicator Classes
// 실시간 업데이트용
// ============================================

/**
 * 스트리밍 RSI 인디케이터
 */
export class StreamingRSI {
  private rsi: RSI

  constructor(period: number = 14) {
    this.rsi = new RSI(period)
  }

  update(value: number): number | null {
    this.rsi.update(value)
    const result = this.rsi.getResult()
    return result ? Number(result.toFixed(2)) : null
  }

  reset(): void {
    this.rsi = new RSI(this.rsi['interval'])
  }
}

/**
 * 스트리밍 MACD 인디케이터
 */
export class StreamingMACD {
  private macd: MACD

  constructor(
    fastPeriod: number = 12,
    slowPeriod: number = 26,
    signalPeriod: number = 9
  ) {
    this.macd = new MACD({
      indicator: EMA,
      shortInterval: fastPeriod,
      longInterval: slowPeriod,
      signalInterval: signalPeriod,
    })
  }

  update(value: number): { macd: number; signal: number; histogram: number } | null {
    this.macd.update(value)
    const result = this.macd.getResult() as MACDResult | undefined

    if (result) {
      return {
        macd: Number(result.macd.toFixed(8)),
        signal: Number(result.signal.toFixed(8)),
        histogram: Number(result.histogram.toFixed(8)),
      }
    }
    return null
  }
}

/**
 * 스트리밍 볼린저 밴드 인디케이터
 */
export class StreamingBollingerBands {
  private bb: BollingerBands

  constructor(period: number = 20, stdDev: number = 2) {
    this.bb = new BollingerBands(period, stdDev)
  }

  update(value: number): { upper: number; middle: number; lower: number } | null {
    this.bb.update(value)
    const result = this.bb.getResult() as BollingerBandsResult | undefined

    if (result) {
      return {
        upper: Number(result.upper.toFixed(8)),
        middle: Number(result.middle.toFixed(8)),
        lower: Number(result.lower.toFixed(8)),
      }
    }
    return null
  }
}

// ============================================
// Faster Variants (고성능)
// 대용량 백테스트용
// ============================================

/**
 * 고성능 SMA (숫자 배열 직접 반환)
 */
export function fastSMA(data: number[], period: number): number[] {
  const sma = new FasterSMA(period)
  return data.map((value) => {
    sma.update(value)
    return sma.getResult() ?? NaN
  })
}

/**
 * 고성능 EMA
 */
export function fastEMA(data: number[], period: number): number[] {
  const ema = new FasterEMA(period)
  return data.map((value) => {
    ema.update(value)
    return ema.getResult() ?? NaN
  })
}

/**
 * 고성능 RSI
 */
export function fastRSI(data: number[], period: number = 14): number[] {
  const rsi = new FasterRSI(period)
  return data.map((value) => {
    rsi.update(value)
    return rsi.getResult() ?? NaN
  })
}

/**
 * 고성능 MACD
 */
export function fastMACD(
  data: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDOutput {
  const macd = new FasterMACD(
    new FasterEMA(fastPeriod),
    new FasterEMA(slowPeriod),
    new FasterEMA(signalPeriod)
  )

  const macdLine: number[] = []
  const signalLine: number[] = []
  const histogram: number[] = []

  for (const value of data) {
    macd.update(value)
    const result = macd.getResult()

    if (result) {
      macdLine.push(result.macd)
      signalLine.push(result.signal)
      histogram.push(result.histogram)
    } else {
      macdLine.push(NaN)
      signalLine.push(NaN)
      histogram.push(NaN)
    }
  }

  return { macd: macdLine, signal: signalLine, histogram }
}

// ============================================
// Utility Functions
// ============================================

/**
 * 크로스오버 감지
 */
export function detectCrossover(
  fastLine: number[],
  slowLine: number[],
  index: number
): 'golden' | 'death' | null {
  if (index < 1) return null

  const prevFast = fastLine[index - 1]
  const prevSlow = slowLine[index - 1]
  const currFast = fastLine[index]
  const currSlow = slowLine[index]

  if (isNaN(prevFast) || isNaN(prevSlow) || isNaN(currFast) || isNaN(currSlow)) {
    return null
  }

  // Golden Cross: 빠른선이 느린선을 상향 돌파
  if (prevFast <= prevSlow && currFast > currSlow) {
    return 'golden'
  }

  // Death Cross: 빠른선이 느린선을 하향 돌파
  if (prevFast >= prevSlow && currFast < currSlow) {
    return 'death'
  }

  return null
}

/**
 * RSI 과매수/과매도 신호
 */
export function detectRSISignal(
  rsiValues: number[],
  index: number,
  overbought: number = 70,
  oversold: number = 30
): 'overbought' | 'oversold' | null {
  const value = rsiValues[index]
  if (isNaN(value)) return null

  if (value >= overbought) return 'overbought'
  if (value <= oversold) return 'oversold'
  return null
}

/**
 * 볼린저 밴드 신호
 */
export function detectBollingerSignal(
  price: number,
  bands: { upper: number; middle: number; lower: number }
): 'above_upper' | 'below_lower' | 'within' {
  if (price > bands.upper) return 'above_upper'
  if (price < bands.lower) return 'below_lower'
  return 'within'
}
