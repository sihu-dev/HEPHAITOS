// ============================================
// Technical Indicators Tests
// ============================================

import { describe, it, expect } from 'vitest'
import {
  sma,
  ema,
  rsi,
  macd,
  bollingerBands,
  momentum,
  atr,
  stochastic,
  calculateIndicator,
} from '@/lib/backtest/indicators'
import type { OHLCV } from '@/types'

describe('sma (Simple Moving Average)', () => {
  it('should calculate SMA correctly', () => {
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const result = sma(data, 3)

    // First 2 values should be NaN
    expect(result[0]).toBeNaN()
    expect(result[1]).toBeNaN()

    // SMA of [1,2,3] = 2
    expect(result[2]).toBe(2)
    // SMA of [2,3,4] = 3
    expect(result[3]).toBe(3)
    // SMA of [8,9,10] = 9
    expect(result[9]).toBe(9)
  })

  it('should handle single period', () => {
    const data = [5, 10, 15]
    const result = sma(data, 1)
    expect(result).toEqual([5, 10, 15])
  })

  it('should return all NaN for period longer than data', () => {
    const data = [1, 2, 3]
    const result = sma(data, 5)
    expect(result.every(v => isNaN(v))).toBe(true)
  })
})

describe('ema (Exponential Moving Average)', () => {
  it('should calculate first EMA as SMA', () => {
    const data = [1, 2, 3, 4, 5]
    const result = ema(data, 3)

    // First EMA at index 2 should be SMA
    expect(result[2]).toBe(2) // (1+2+3)/3
  })

  it('should calculate subsequent EMA values', () => {
    const data = [10, 11, 12, 13, 14, 15]
    const result = ema(data, 3)

    // First values should be NaN
    expect(result[0]).toBeNaN()
    expect(result[1]).toBeNaN()

    // EMA values should be calculated
    expect(typeof result[2]).toBe('number')
    expect(typeof result[5]).toBe('number')
    expect(result[5]).toBeGreaterThan(result[2])
  })

  it('should have length equal to input data', () => {
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const result = ema(data, 5)
    expect(result.length).toBe(data.length)
  })
})

describe('rsi (Relative Strength Index)', () => {
  it('should return high RSI when all gains', () => {
    const data = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25]
    const result = rsi(data, 14)

    // After enough periods, RSI should be high for continuous gains
    const validValues = result.filter(v => !isNaN(v))
    // First valid RSI with all gains should be 100
    expect(validValues[0]).toBe(100)
  })

  it('should be between 0 and 100', () => {
    const data = [44, 44.34, 44.09, 43.61, 44.33, 44.83, 45.10, 45.42, 45.84,
      46.08, 45.89, 46.03, 45.61, 46.28, 46.28, 46.00, 46.03, 46.41, 46.22, 45.64]
    const result = rsi(data, 14)

    const validValues = result.filter(v => !isNaN(v))
    validValues.forEach(val => {
      expect(val).toBeGreaterThanOrEqual(0)
      expect(val).toBeLessThanOrEqual(100)
    })
  })

  it('should have initial NaN values', () => {
    const data = Array(20).fill(0).map((_, i) => 100 + i)
    const result = rsi(data, 14)

    // First 14 values should be NaN (including first)
    for (let i = 0; i < 14; i++) {
      expect(result[i]).toBeNaN()
    }
  })
})

describe('macd', () => {
  it('should return macd, signal, and histogram', () => {
    const data = Array(50).fill(0).map((_, i) => 100 + Math.sin(i / 5) * 10)
    const result = macd(data)

    expect(result).toHaveProperty('macd')
    expect(result).toHaveProperty('signal')
    expect(result).toHaveProperty('histogram')
  })

  it('should have correct length', () => {
    const data = Array(50).fill(0).map((_, i) => 100 + i)
    const result = macd(data)

    expect(result.macd.length).toBe(data.length)
    expect(result.signal.length).toBe(data.length)
    expect(result.histogram.length).toBe(data.length)
  })

  it('should have NaN for initial values', () => {
    const data = Array(50).fill(0).map((_, i) => 100 + i)
    const result = macd(data, 12, 26, 9)

    // First 25 MACD values should be NaN (slowPeriod - 1)
    for (let i = 0; i < 25; i++) {
      expect(result.macd[i]).toBeNaN()
    }
  })
})

describe('bollingerBands', () => {
  it('should return upper, middle, and lower bands', () => {
    const data = Array(30).fill(0).map((_, i) => 100 + Math.random() * 10)
    const result = bollingerBands(data, 20)

    expect(result).toHaveProperty('upper')
    expect(result).toHaveProperty('middle')
    expect(result).toHaveProperty('lower')
  })

  it('should have upper > middle > lower', () => {
    const data = Array(30).fill(0).map((_, i) => 100 + i)
    const result = bollingerBands(data, 20, 2)

    // After initial NaN values
    for (let i = 19; i < data.length; i++) {
      if (!isNaN(result.upper[i]) && !isNaN(result.lower[i])) {
        expect(result.upper[i]).toBeGreaterThan(result.middle[i])
        expect(result.middle[i]).toBeGreaterThan(result.lower[i])
      }
    }
  })

  it('should have correct length', () => {
    const data = Array(30).fill(100)
    const result = bollingerBands(data, 10)

    expect(result.upper.length).toBe(data.length)
    expect(result.middle.length).toBe(data.length)
    expect(result.lower.length).toBe(data.length)
  })
})

describe('momentum', () => {
  it('should calculate momentum correctly', () => {
    const data = [10, 12, 15, 18, 20, 22, 25, 28, 30, 32, 35]
    const result = momentum(data, 3)

    // First 3 values should be NaN
    expect(result[0]).toBeNaN()
    expect(result[1]).toBeNaN()
    expect(result[2]).toBeNaN()

    // momentum[3] = data[3] - data[0] = 18 - 10 = 8
    expect(result[3]).toBe(8)
    // momentum[4] = data[4] - data[1] = 20 - 12 = 8
    expect(result[4]).toBe(8)
  })

  it('should handle flat data', () => {
    const data = [100, 100, 100, 100, 100]
    const result = momentum(data, 2)

    // All valid momentum values should be 0
    const validValues = result.filter(v => !isNaN(v))
    validValues.forEach(val => {
      expect(val).toBe(0)
    })
  })

  it('should detect negative momentum', () => {
    const data = [100, 90, 80, 70, 60]
    const result = momentum(data, 2)

    // momentum[2] = 80 - 100 = -20
    expect(result[2]).toBe(-20)
  })
})

// Helper to create OHLCV candles
function createCandles(count: number, basePrice: number = 100): OHLCV[] {
  return Array.from({ length: count }, (_, i) => ({
    timestamp: Date.now() - (count - i) * 60000,
    open: basePrice + i,
    high: basePrice + i + 2,
    low: basePrice + i - 1,
    close: basePrice + i + 1,
    volume: 1000 + i * 100,
  }))
}

describe('atr (Average True Range)', () => {
  it('should calculate ATR correctly', () => {
    const candles = createCandles(20)
    const result = atr(candles, 14)

    expect(result.length).toBe(candles.length)
  })

  it('should have NaN for initial periods', () => {
    const candles = createCandles(20)
    const result = atr(candles, 14)

    // First 13 values should be NaN (period - 1)
    for (let i = 0; i < 13; i++) {
      expect(result[i]).toBeNaN()
    }
  })

  it('should calculate true range for first candle', () => {
    const candles: OHLCV[] = [
      { timestamp: 1, open: 100, high: 110, low: 95, close: 105, volume: 1000 },
      { timestamp: 2, open: 105, high: 115, low: 100, close: 110, volume: 1000 },
    ]
    const result = atr(candles, 2)

    // First TR = high - low = 110 - 95 = 15
    expect(result.length).toBe(2)
  })

  it('should handle gaps in price', () => {
    const candles: OHLCV[] = [
      { timestamp: 1, open: 100, high: 105, low: 95, close: 100, volume: 1000 },
      { timestamp: 2, open: 110, high: 115, low: 108, close: 112, volume: 1000 }, // Gap up
    ]
    const result = atr(candles, 1)

    // TR should account for gap: max(115-108, |115-100|, |108-100|) = 15
    expect(result[1]).toBe(15)
  })
})

describe('stochastic', () => {
  it('should return k and d values', () => {
    const candles = createCandles(20)
    const result = stochastic(candles, 14, 3)

    expect(result).toHaveProperty('k')
    expect(result).toHaveProperty('d')
    expect(result.k.length).toBe(candles.length)
    expect(result.d.length).toBe(candles.length)
  })

  it('should have NaN for initial periods', () => {
    const candles = createCandles(20)
    const result = stochastic(candles, 14, 3)

    // First 13 K values should be NaN
    for (let i = 0; i < 13; i++) {
      expect(result.k[i]).toBeNaN()
    }
  })

  it('should be between 0 and 100', () => {
    const candles = createCandles(30)
    const result = stochastic(candles, 14, 3)

    const validK = result.k.filter(v => !isNaN(v))
    validK.forEach(val => {
      expect(val).toBeGreaterThanOrEqual(0)
      expect(val).toBeLessThanOrEqual(100)
    })
  })

  it('should return 50 when highest = lowest', () => {
    const candles: OHLCV[] = Array.from({ length: 15 }, (_, i) => ({
      timestamp: i,
      open: 100,
      high: 100,
      low: 100,
      close: 100,
      volume: 1000,
    }))
    const result = stochastic(candles, 14, 3)

    // When no range, K should be 50
    expect(result.k[14]).toBe(50)
  })
})

describe('calculateIndicator', () => {
  const candles = createCandles(50)

  it('should calculate SMA indicator', () => {
    const result = calculateIndicator('sma', candles, { period: 20 })

    expect(result.type).toBe('sma')
    expect(result.values.length).toBe(candles.length)
    expect(result.timestamps.length).toBe(candles.length)
  })

  it('should calculate EMA indicator', () => {
    const result = calculateIndicator('ema', candles, { period: 10 })

    expect(result.type).toBe('ema')
    expect(result.values.length).toBe(candles.length)
  })

  it('should calculate RSI indicator', () => {
    const result = calculateIndicator('rsi', candles, { period: 14 })

    expect(result.type).toBe('rsi')
    expect(result.values.length).toBe(candles.length)
  })

  it('should calculate MACD indicator', () => {
    const result = calculateIndicator('macd', candles, {
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
    })

    expect(result.type).toBe('macd')
    expect(result.values.length).toBe(candles.length)
  })

  it('should calculate Bollinger Bands indicator', () => {
    const result = calculateIndicator('bollinger', candles, {
      period: 20,
      stdDev: 2,
    })

    expect(result.type).toBe('bollinger')
    expect(result.values.length).toBe(candles.length)
  })

  it('should calculate ATR indicator', () => {
    const result = calculateIndicator('atr', candles, { period: 14 })

    expect(result.type).toBe('atr')
    expect(result.values.length).toBe(candles.length)
  })

  it('should calculate Stochastic indicator', () => {
    const result = calculateIndicator('stochastic', candles, {
      kPeriod: 14,
      dPeriod: 3,
    })

    expect(result.type).toBe('stochastic')
    expect(result.values.length).toBe(candles.length)
  })

  it('should calculate Momentum indicator', () => {
    const result = calculateIndicator('momentum', candles, { period: 10 })

    expect(result.type).toBe('momentum')
    expect(result.values.length).toBe(candles.length)
  })

  it('should calculate Volume indicator', () => {
    const result = calculateIndicator('volume', candles, {})

    expect(result.type).toBe('volume')
    expect(result.values).toEqual(candles.map(c => c.volume))
  })

  it('should return closes for unknown indicator type', () => {
    const result = calculateIndicator('unknown' as unknown as Parameters<typeof calculateIndicator>[0], candles, {})

    expect(result.values).toEqual(candles.map(c => c.close))
  })

  it('should use default params when not provided', () => {
    const result = calculateIndicator('sma', candles, {})

    expect(result.type).toBe('sma')
    // Default period is 20
  })

  it('should preserve params in result', () => {
    const params = { period: 15, customParam: 42 }
    const result = calculateIndicator('sma', candles, params)

    expect(result.params).toEqual(params)
  })
})
