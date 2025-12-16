/**
 * Risk Profiler Module
 *
 * Quant 2.0 Dynamic Risk Management
 * Based on:
 * - Symbol volatility (historical data)
 * - User risk profile
 * - Market conditions
 *
 * Inspired by QuantConnect & TradingView risk management
 */

// ============================================
// Types
// ============================================

export type RiskLevel = 'conservative' | 'moderate' | 'aggressive' | 'very_aggressive'

export interface UserRiskProfile {
  level: RiskLevel
  maxDrawdown?: number // 최대 낙폭 허용치 (%)
  maxPositionSize?: number // 최대 포지션 크기 (%)
  preferredStopLoss?: number // 선호 손절 비율 (%)
}

export interface SymbolVolatility {
  symbol: string
  dailyVolatility: number // ATR% or Standard Deviation
  weeklyVolatility: number
  monthlyVolatility: number
}

export interface DynamicRiskParams {
  stopLoss: number
  takeProfit: number
  positionSize: number
  maxLeverage: number
}

// ============================================
// Volatility Database (Simulated)
// TODO: Replace with real-time API (CoinGecko, Alpha Vantage, etc.)
// ============================================

const VOLATILITY_DB: Record<string, SymbolVolatility> = {
  'BTC/USDT': {
    symbol: 'BTC/USDT',
    dailyVolatility: 3.5,
    weeklyVolatility: 8.2,
    monthlyVolatility: 15.6,
  },
  'ETH/USDT': {
    symbol: 'ETH/USDT',
    dailyVolatility: 4.2,
    weeklyVolatility: 10.1,
    monthlyVolatility: 18.9,
  },
  'BNB/USDT': {
    symbol: 'BNB/USDT',
    dailyVolatility: 5.1,
    weeklyVolatility: 12.3,
    monthlyVolatility: 22.4,
  },
  'SOL/USDT': {
    symbol: 'SOL/USDT',
    dailyVolatility: 6.8,
    weeklyVolatility: 15.7,
    monthlyVolatility: 28.3,
  },
  'DOGE/USDT': {
    symbol: 'DOGE/USDT',
    dailyVolatility: 8.2,
    weeklyVolatility: 18.5,
    monthlyVolatility: 35.2,
  },
  // Default for unknown symbols (crypto average)
  'DEFAULT_CRYPTO': {
    symbol: 'DEFAULT_CRYPTO',
    dailyVolatility: 7.0,
    weeklyVolatility: 16.0,
    monthlyVolatility: 30.0,
  },
  // US Stocks (lower volatility)
  'SPY': {
    symbol: 'SPY',
    dailyVolatility: 0.8,
    weeklyVolatility: 1.8,
    monthlyVolatility: 3.5,
  },
  'AAPL': {
    symbol: 'AAPL',
    dailyVolatility: 1.2,
    weeklyVolatility: 2.8,
    monthlyVolatility: 5.2,
  },
  'DEFAULT_STOCK': {
    symbol: 'DEFAULT_STOCK',
    dailyVolatility: 1.5,
    weeklyVolatility: 3.5,
    monthlyVolatility: 7.0,
  },
}

// ============================================
// Risk Level Configurations
// ============================================

const RISK_LEVEL_CONFIG: Record<
  RiskLevel,
  {
    maxStopLoss: number
    stopLossMultiplier: number
    takeProfitRatio: number // TP/SL ratio
    maxPositionSize: number
    maxLeverage: number
  }
> = {
  conservative: {
    maxStopLoss: 3,
    stopLossMultiplier: 1.0,
    takeProfitRatio: 3.0, // 3:1 reward/risk
    maxPositionSize: 10,
    maxLeverage: 1,
  },
  moderate: {
    maxStopLoss: 5,
    stopLossMultiplier: 1.2,
    takeProfitRatio: 2.5,
    maxPositionSize: 20,
    maxLeverage: 2,
  },
  aggressive: {
    maxStopLoss: 8,
    stopLossMultiplier: 1.5,
    takeProfitRatio: 2.0,
    maxPositionSize: 30,
    maxLeverage: 3,
  },
  very_aggressive: {
    maxStopLoss: 12,
    stopLossMultiplier: 2.0,
    takeProfitRatio: 1.5,
    maxPositionSize: 50,
    maxLeverage: 5,
  },
}

// ============================================
// Risk Profiler Class
// ============================================

export class RiskProfiler {
  /**
   * Get symbol volatility (Quant 2.0: data-driven approach)
   */
  getVolatility(symbol: string): SymbolVolatility {
    // Try exact match
    if (VOLATILITY_DB[symbol]) {
      return VOLATILITY_DB[symbol]
    }

    // Determine asset class
    if (symbol.includes('USDT') || symbol.includes('BUSD')) {
      return VOLATILITY_DB['DEFAULT_CRYPTO']
    } else {
      return VOLATILITY_DB['DEFAULT_STOCK']
    }
  }

  /**
   * Calculate optimal stop loss based on volatility (Quant 2.0)
   *
   * Formula: StopLoss = Volatility * Multiplier
   * - Conservative: 1.0x volatility
   * - Moderate: 1.2x volatility
   * - Aggressive: 1.5x volatility
   * - Very Aggressive: 2.0x volatility
   */
  calculateOptimalStopLoss(
    symbol: string,
    userProfile: UserRiskProfile = { level: 'moderate' },
    timeframe: '1d' | '1w' | '1M' = '1d'
  ): number {
    const volatility = this.getVolatility(symbol)
    const config = RISK_LEVEL_CONFIG[userProfile.level]

    // Select volatility based on timeframe
    let baseVolatility: number
    switch (timeframe) {
      case '1d':
        baseVolatility = volatility.dailyVolatility
        break
      case '1w':
        baseVolatility = volatility.weeklyVolatility
        break
      case '1M':
        baseVolatility = volatility.monthlyVolatility
        break
      default:
        baseVolatility = volatility.dailyVolatility
    }

    // Calculate stop loss
    let stopLoss = baseVolatility * config.stopLossMultiplier

    // Apply user preference if exists
    if (userProfile.preferredStopLoss) {
      stopLoss = Math.min(stopLoss, userProfile.preferredStopLoss)
    }

    // Cap at max stop loss for risk level
    stopLoss = Math.min(stopLoss, config.maxStopLoss)

    // Round to 1 decimal
    return Math.round(stopLoss * 10) / 10
  }

  /**
   * Calculate dynamic risk parameters (full Quant 2.0 approach)
   */
  calculateDynamicRisk(
    symbol: string,
    userProfile: UserRiskProfile = { level: 'moderate' },
    timeframe: '1d' | '1w' | '1M' = '1d'
  ): DynamicRiskParams {
    const config = RISK_LEVEL_CONFIG[userProfile.level]
    const stopLoss = this.calculateOptimalStopLoss(symbol, userProfile, timeframe)

    // Take profit based on risk/reward ratio
    const takeProfit = stopLoss * config.takeProfitRatio

    // Position size based on risk level
    const positionSize = userProfile.maxPositionSize || config.maxPositionSize

    return {
      stopLoss,
      takeProfit: Math.round(takeProfit * 10) / 10,
      positionSize,
      maxLeverage: config.maxLeverage,
    }
  }

  /**
   * Validate strategy risk (advanced validation)
   */
  validateStrategyRisk(params: {
    symbol: string
    stopLoss?: number
    takeProfit?: number
    positionSize?: number
    leverage?: number
    userProfile?: UserRiskProfile
  }): {
    isValid: boolean
    errors: string[]
    warnings: string[]
    suggestions: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []

    const { symbol, stopLoss, takeProfit, positionSize, leverage } = params
    const userProfile = params.userProfile || { level: 'moderate' }
    const config = RISK_LEVEL_CONFIG[userProfile.level]

    // Validate stop loss
    if (stopLoss) {
      if (stopLoss > config.maxStopLoss) {
        errors.push(
          `손절가 ${stopLoss}%가 ${userProfile.level} 리스크 레벨의 최대값 ${config.maxStopLoss}%를 초과합니다`
        )
      }

      if (stopLoss < 0.5) {
        warnings.push('손절가가 0.5% 미만으로 너무 좁아 빈번한 청산이 발생할 수 있습니다')
      }

      if (stopLoss > 15) {
        errors.push('손절가 15% 초과는 매우 고위험입니다. 더 낮은 값을 권장합니다')
      }
    } else {
      warnings.push('손절가가 설정되지 않았습니다')
      const optimal = this.calculateOptimalStopLoss(symbol, userProfile)
      suggestions.push(`${symbol}의 변동성 기반 권장 손절가: ${optimal}%`)
    }

    // Validate take profit
    if (stopLoss && takeProfit) {
      const ratio = takeProfit / stopLoss
      if (ratio < 1.0) {
        errors.push(`손익비가 ${ratio.toFixed(2)}:1로 손절보다 익절이 작습니다. 최소 1:1 이상을 권장합니다`)
      }

      if (ratio < 1.5) {
        warnings.push(`손익비가 ${ratio.toFixed(2)}:1로 낮습니다. 2:1 이상을 권장합니다`)
      }
    }

    // Validate position size
    if (positionSize) {
      if (positionSize > config.maxPositionSize) {
        errors.push(
          `포지션 크기 ${positionSize}%가 ${userProfile.level} 리스크 레벨의 최대값 ${config.maxPositionSize}%를 초과합니다`
        )
      }

      if (positionSize > 50) {
        errors.push('포지션 크기 50% 초과는 과도한 집중 투자입니다')
      }

      if (positionSize > 20 && positionSize <= 50) {
        warnings.push('포지션 크기가 20%를 초과합니다. 분산 투자를 고려하세요')
      }
    }

    // Validate leverage
    if (leverage) {
      if (leverage > config.maxLeverage) {
        errors.push(
          `레버리지 ${leverage}x가 ${userProfile.level} 리스크 레벨의 최대값 ${config.maxLeverage}x를 초과합니다`
        )
      }

      if (leverage > 5) {
        errors.push('레버리지 5배 초과는 청산 위험이 매우 높습니다')
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    }
  }

  /**
   * Get recommended risk parameters for symbol
   */
  getRecommendedRisk(
    symbol: string,
    userProfile: UserRiskProfile = { level: 'moderate' }
  ): DynamicRiskParams {
    return this.calculateDynamicRisk(symbol, userProfile, '1d')
  }
}

// ============================================
// Export singleton
// ============================================

export const riskProfiler = new RiskProfiler()
export default riskProfiler
