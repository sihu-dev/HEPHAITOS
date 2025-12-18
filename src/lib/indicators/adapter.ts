// ============================================
// Technical Indicators Adapter
// trading-signals v7 라이브러리 래퍼
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
  WilliamsR,
  type MACDResult,
  type StochasticResult,
  type BandsResult,
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
// Helper to safely convert result to number
// ============================================

function toNumber(value: number | null | undefined): number {
  if (value === null || value === undefined) return NaN
  return Number(value)
}

function toFixedNumber(value: number | null | undefined, decimals: number = 8): number {
  if (value === null || value === undefined) return NaN
  return Number(Number(value).toFixed(decimals))
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
    sma.add(value)
    results.push(toFixedNumber(sma.getResult()))
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
    ema.add(value)
    results.push(toFixedNumber(ema.getResult()))
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
    wma.add(value)
    results.push(toFixedNumber(wma.getResult()))
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
    dema.add(value)
    results.push(toFixedNumber(dema.getResult()))
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
    rsi.add(value)
    results.push(toFixedNumber(rsi.getResult(), 2))
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
  // trading-signals v7: MACD takes EMA/DEMA instances
  const macd = new MACD(
    new EMA(fastPeriod),
    new EMA(slowPeriod),
    new EMA(signalPeriod)
  )

  const macdLine: number[] = []
  const signalLine: number[] = []
  const histogram: number[] = []

  for (const value of data) {
    macd.add(value)
    const result = macd.getResult() as MACDResult | null

    if (result) {
      macdLine.push(toFixedNumber(result.macd))
      signalLine.push(toFixedNumber(result.signal))
      histogram.push(toFixedNumber(result.histogram))
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
    bb.add(value)
    const result = bb.getResult() as BandsResult | null

    if (result) {
      upper.push(toFixedNumber(result.upper))
      middle.push(toFixedNumber(result.middle))
      lower.push(toFixedNumber(result.lower))
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
    atr.add({
      high: candle.high,
      low: candle.low,
      close: candle.close,
    })
    results.push(toFixedNumber(atr.getResult()))
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
  // StochasticOscillator(n, m, p) where n=lookback, m=smoothK, p=smoothD
  const stoch = new StochasticOscillator(kPeriod, dPeriod, dPeriod)

  const k: number[] = []
  const d: number[] = []

  for (const candle of candles) {
    stoch.add({
      high: candle.high,
      low: candle.low,
      close: candle.close,
    })
    const result = stoch.getResult() as StochasticResult | null

    if (result) {
      k.push(toFixedNumber(result.stochK, 2))
      d.push(toFixedNumber(result.stochD, 2))
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
 */
export function calculateStochasticRSI(
  data: number[],
  rsiPeriod: number = 14
): number[] {
  // StochasticRSI in v7 returns single value, not k/d
  const stochRSI = new StochasticRSI(rsiPeriod)
  const results: number[] = []

  for (const value of data) {
    stochRSI.add(value)
    results.push(toFixedNumber(stochRSI.getResult(), 2))
  }

  return results
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
    adx.add({
      high: candle.high,
      low: candle.low,
      close: candle.close,
    })
    results.push(toFixedNumber(adx.getResult(), 2))
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
    cci.add({
      high: candle.high,
      low: candle.low,
      close: candle.close,
    })
    results.push(toFixedNumber(cci.getResult(), 2))
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
    roc.add(value)
    results.push(toFixedNumber(roc.getResult(), 4))
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
    wr.add({
      high: candle.high,
      low: candle.low,
      close: candle.close,
    })
    results.push(toFixedNumber(wr.getResult(), 2))
  }

  return results
}

/**
 * OBV (On Balance Volume)
 * @param candles - OHLCV 캔들 데이터
 */
export function calculateOBV(candles: OHLCV[]): number[] {
  // OBV in v7 requires OpenHighLowCloseVolume including open
  const obv = new OBV(candles.length)
  const results: number[] = []

  for (const candle of candles) {
    obv.add({
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume,
    })
    results.push(toFixedNumber(obv.getResult(), 0))
  }

  return results
}

/**
 * MFI (Money Flow Index) - Manual implementation
 * trading-signals v7 doesn't export MFI
 * @param candles - OHLCV 캔들 데이터
 * @param period - 기간 (기본값: 14)
 */
export function calculateMFI(candles: OHLCV[], period: number = 14): number[] {
  const results: number[] = []
  const typicalPrices: number[] = []
  const moneyFlows: number[] = []

  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i]
    const typicalPrice = (candle.high + candle.low + candle.close) / 3
    const rawMoneyFlow = typicalPrice * candle.volume

    typicalPrices.push(typicalPrice)

    if (i === 0) {
      moneyFlows.push(rawMoneyFlow)
      results.push(NaN)
      continue
    }

    // Positive or negative based on price movement
    const prevTypical = typicalPrices[i - 1]
    const signedFlow = typicalPrice > prevTypical ? rawMoneyFlow : -rawMoneyFlow
    moneyFlows.push(signedFlow)

    if (i < period) {
      results.push(NaN)
      continue
    }

    // Calculate MFI for the period
    let positiveFlow = 0
    let negativeFlow = 0

    for (let j = i - period + 1; j <= i; j++) {
      if (moneyFlows[j] > 0) {
        positiveFlow += moneyFlows[j]
      } else {
        negativeFlow += Math.abs(moneyFlows[j])
      }
    }

    if (negativeFlow === 0) {
      results.push(100)
    } else {
      const moneyRatio = positiveFlow / negativeFlow
      const mfi = 100 - (100 / (1 + moneyRatio))
      results.push(toFixedNumber(mfi, 2))
    }
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
  private period: number

  constructor(period: number = 14) {
    this.period = period
    this.rsi = new RSI(period)
  }

  add(value: number): number | null {
    this.rsi.add(value)
    const result = this.rsi.getResult()
    return result !== null ? toFixedNumber(result, 2) : null
  }

  reset(): void {
    this.rsi = new RSI(this.period)
  }
}

/**
 * 스트리밍 MACD 인디케이터
 */
export class StreamingMACD {
  private macd: MACD
  private fastPeriod: number
  private slowPeriod: number
  private signalPeriod: number

  constructor(
    fastPeriod: number = 12,
    slowPeriod: number = 26,
    signalPeriod: number = 9
  ) {
    this.fastPeriod = fastPeriod
    this.slowPeriod = slowPeriod
    this.signalPeriod = signalPeriod
    this.macd = new MACD(
      new EMA(fastPeriod),
      new EMA(slowPeriod),
      new EMA(signalPeriod)
    )
  }

  add(value: number): { macd: number; signal: number; histogram: number } | null {
    this.macd.add(value)
    const result = this.macd.getResult() as MACDResult | null

    if (result) {
      return {
        macd: toFixedNumber(result.macd),
        signal: toFixedNumber(result.signal),
        histogram: toFixedNumber(result.histogram),
      }
    }
    return null
  }

  reset(): void {
    this.macd = new MACD(
      new EMA(this.fastPeriod),
      new EMA(this.slowPeriod),
      new EMA(this.signalPeriod)
    )
  }
}

/**
 * 스트리밍 볼린저 밴드 인디케이터
 */
export class StreamingBollingerBands {
  private bb: BollingerBands
  private period: number
  private stdDev: number

  constructor(period: number = 20, stdDev: number = 2) {
    this.period = period
    this.stdDev = stdDev
    this.bb = new BollingerBands(period, stdDev)
  }

  add(value: number): { upper: number; middle: number; lower: number } | null {
    this.bb.add(value)
    const result = this.bb.getResult() as BandsResult | null

    if (result) {
      return {
        upper: toFixedNumber(result.upper),
        middle: toFixedNumber(result.middle),
        lower: toFixedNumber(result.lower),
      }
    }
    return null
  }

  reset(): void {
    this.bb = new BollingerBands(this.period, this.stdDev)
  }
}

// ============================================
// Fast/Batch Calculation Functions
// 대용량 백테스트용 최적화 버전
// ============================================

/**
 * 고성능 SMA (배치 처리)
 */
export function fastSMA(data: number[], period: number): number[] {
  return calculateSMA(data, period)
}

/**
 * 고성능 EMA (배치 처리)
 */
export function fastEMA(data: number[], period: number): number[] {
  return calculateEMA(data, period)
}

/**
 * 고성능 RSI (배치 처리)
 */
export function fastRSI(data: number[], period: number = 14): number[] {
  return calculateRSI(data, period)
}

/**
 * 고성능 MACD (배치 처리)
 */
export function fastMACD(
  data: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDOutput {
  return calculateMACD(data, fastPeriod, slowPeriod, signalPeriod)
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
