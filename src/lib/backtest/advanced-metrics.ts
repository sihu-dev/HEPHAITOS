// ============================================
// Advanced Performance Metrics (2026 Quant 2.0)
// Inspired by: QuantConnect, TradingView, Institutional Quant Firms
// ============================================

import type { BacktestTrade, PortfolioSnapshot } from './types'
import { logger } from '../trading/logger'

// ============================================
// Types
// ============================================

export interface AdvancedMetrics {
  // Kelly Criterion
  kellyCriterion: number // Optimal position size (%)
  kellyHalf: number // Conservative Kelly (half Kelly)

  // Risk Metrics
  valueAtRisk95: number // VAR 95% confidence
  valueAtRisk99: number // VAR 99% confidence
  conditionalVaR95: number // CVaR (Expected Shortfall)
  ulcerIndex: number // Investor pain index

  // Performance Metrics
  informationRatio: number // Excess return vs benchmark volatility
  recoveryFactor: number // Net profit / Max drawdown
  payoffRatio: number // Average win / Average loss

  // Trade Quality
  tradeQualityScore: number // 0-100 score
  consecutiveWinRate: number // Avg wins in winning streaks
  consecutiveLossRate: number // Avg losses in losing streaks

  // Risk-Adjusted
  omegaRatio: number // Probability weighted ratio
  gainPainRatio: number // Sum of gains / Sum of pains

  // Market Exposure
  timeInMarket: number // % of time with open position
  avgMarketExposure: number // Average position size when in market
}

// ============================================
// Advanced Metrics Calculator
// ============================================

export class AdvancedMetricsCalculator {
  private trades: BacktestTrade[]
  private equityCurve: PortfolioSnapshot[]
  private initialCapital: number
  private benchmarkReturn: number // Annualized benchmark (e.g., S&P 500)

  constructor(
    trades: BacktestTrade[],
    equityCurve: PortfolioSnapshot[],
    initialCapital: number,
    benchmarkReturn: number = 0.10 // Default 10% annually
  ) {
    this.trades = trades
    this.equityCurve = equityCurve
    this.initialCapital = initialCapital
    this.benchmarkReturn = benchmarkReturn
  }

  /**
   * Calculate all advanced metrics
   */
  calculate(): AdvancedMetrics {
    logger.debug('AdvancedMetricsCalculator', 'Calculating advanced metrics', {
      totalTrades: this.trades.length,
      totalSnapshots: this.equityCurve.length
    })

    const kellyCriterion = this.calculateKellyCriterion()
    const { var95, var99, cvar95 } = this.calculateVaR()
    const ulcerIndex = this.calculateUlcerIndex()
    const informationRatio = this.calculateInformationRatio()
    const recoveryFactor = this.calculateRecoveryFactor()
    const payoffRatio = this.calculatePayoffRatio()
    const tradeQualityScore = this.calculateTradeQualityScore()
    const { winRate, lossRate } = this.calculateConsecutiveRates()
    const omegaRatio = this.calculateOmegaRatio()
    const gainPainRatio = this.calculateGainPainRatio()
    const { timeInMarket, avgExposure } = this.calculateMarketExposure()

    return {
      kellyCriterion,
      kellyHalf: kellyCriterion / 2,
      valueAtRisk95: var95,
      valueAtRisk99: var99,
      conditionalVaR95: cvar95,
      ulcerIndex,
      informationRatio,
      recoveryFactor,
      payoffRatio,
      tradeQualityScore,
      consecutiveWinRate: winRate,
      consecutiveLossRate: lossRate,
      omegaRatio,
      gainPainRatio,
      timeInMarket,
      avgMarketExposure: avgExposure,
    }
  }

  /**
   * Kelly Criterion - Optimal position sizing
   * Kelly % = (Win Rate * Avg Win - Loss Rate * Avg Loss) / Avg Win
   */
  private calculateKellyCriterion(): number {
    const wins = this.trades.filter(t => t.pnl > 0)
    const losses = this.trades.filter(t => t.pnl <= 0)

    if (wins.length === 0 || losses.length === 0 || this.trades.length === 0) {
      return 0
    }

    const winRate = wins.length / this.trades.length
    const lossRate = losses.length / this.trades.length

    const avgWinPercent = wins.reduce((sum, t) => sum + Math.abs(t.pnlPercent), 0) / wins.length
    const avgLossPercent = losses.reduce((sum, t) => sum + Math.abs(t.pnlPercent), 0) / losses.length

    // Guard against division by zero
    if (avgLossPercent === 0) {
      return avgWinPercent > 0 ? 100 : 0
    }

    // Kelly Formula: f* = (p * b - q) / b
    // where p = win rate, q = loss rate, b = win/loss ratio
    const b = avgWinPercent / avgLossPercent

    const kelly = (winRate * b - lossRate) / b

    // Cap at 100% and floor at 0%
    return Math.max(0, Math.min(100, kelly * 100))
  }

  /**
   * Value at Risk (VaR) - Maximum expected loss at confidence level
   */
  private calculateVaR(): { var95: number; var99: number; cvar95: number } {
    const returns = this.calculateReturns()

    if (returns.length === 0) {
      return { var95: 0, var99: 0, cvar95: 0 }
    }

    // Sort returns ascending (worst to best)
    const sortedReturns = returns.sort((a, b) => a - b)

    // VAR at 95% confidence (5th percentile)
    const idx95 = Math.floor(sortedReturns.length * 0.05)
    const var95 = sortedReturns[idx95] * 100 // Convert to percentage

    // VAR at 99% confidence (1st percentile)
    const idx99 = Math.floor(sortedReturns.length * 0.01)
    const var99 = sortedReturns[idx99] * 100

    // Conditional VaR (CVaR) / Expected Shortfall
    // Average of all returns worse than VaR 95%
    const tailReturns = sortedReturns.slice(0, idx95)
    const cvar95 = tailReturns.length > 0
      ? (tailReturns.reduce((sum, r) => sum + r, 0) / tailReturns.length) * 100
      : var95

    return { var95, var99, cvar95 }
  }

  /**
   * Ulcer Index - Measure of investor pain from drawdowns
   * Lower is better. Accounts for depth and duration of drawdowns.
   */
  private calculateUlcerIndex(): number {
    if (this.equityCurve.length === 0) return 0

    let sumSquaredDrawdowns = 0

    for (const snapshot of this.equityCurve) {
      sumSquaredDrawdowns += Math.pow(snapshot.drawdownPercent, 2)
    }

    const meanSquaredDrawdown = sumSquaredDrawdowns / this.equityCurve.length
    return Math.sqrt(meanSquaredDrawdown)
  }

  /**
   * Information Ratio - Excess return vs benchmark per unit of risk
   */
  private calculateInformationRatio(): number {
    const returns = this.calculateReturns()

    if (returns.length < 2) return 0

    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length
    const annualizedReturn = avgReturn * 252 // Annualize

    const dailyBenchmark = this.benchmarkReturn / 252

    // Tracking error (std dev of excess returns)
    const excessReturns = returns.map(r => r - dailyBenchmark)
    const trackingError = this.standardDeviation(excessReturns) * Math.sqrt(252)

    if (trackingError === 0) return 0

    return (annualizedReturn - this.benchmarkReturn) / trackingError
  }

  /**
   * Recovery Factor - Net Profit / Max Drawdown
   * Higher is better. Shows how well strategy recovers from drawdowns.
   * Returns 0 for losing strategies (netProfit <= 0)
   */
  private calculateRecoveryFactor(): number {
    const finalEquity = this.equityCurve[this.equityCurve.length - 1]?.equity || 0
    const netProfit = finalEquity - this.initialCapital

    // Return 0 for losing strategies
    if (netProfit <= 0) return 0

    let maxDrawdown = 0
    for (const snapshot of this.equityCurve) {
      maxDrawdown = Math.max(maxDrawdown, snapshot.drawdown)
    }

    return maxDrawdown > 0 ? netProfit / maxDrawdown : Infinity
  }

  /**
   * Payoff Ratio - Average Win / Average Loss
   */
  private calculatePayoffRatio(): number {
    const wins = this.trades.filter(t => t.pnl > 0)
    const losses = this.trades.filter(t => t.pnl < 0)

    if (losses.length === 0) return wins.length > 0 ? Infinity : 0

    const avgWin = wins.length > 0
      ? wins.reduce((sum, t) => sum + t.pnl, 0) / wins.length
      : 0

    const avgLoss = Math.abs(
      losses.reduce((sum, t) => sum + t.pnl, 0) / losses.length
    )

    return avgLoss > 0 ? avgWin / avgLoss : 0
  }

  /**
   * Trade Quality Score (0-100)
   * Composite score based on multiple factors
   */
  private calculateTradeQualityScore(): number {
    if (this.trades.length === 0) return 0

    const wins = this.trades.filter(t => t.pnl > 0)
    const winRate = (wins.length / this.trades.length) * 100

    const payoffRatio = this.calculatePayoffRatio()
    const profitFactor = this.calculateProfitFactor()

    // Weighted score
    const winRateScore = Math.min(winRate / 70, 1) * 30 // Max 30 points
    const payoffScore = Math.min(payoffRatio / 2, 1) * 30 // Max 30 points
    const profitFactorScore = Math.min(profitFactor / 2, 1) * 40 // Max 40 points

    return winRateScore + payoffScore + profitFactorScore
  }

  /**
   * Consecutive Win/Loss Rates
   */
  private calculateConsecutiveRates(): { winRate: number; lossRate: number } {
    const winningStreaks: number[] = []
    const losingStreaks: number[] = []

    let currentWinStreak = 0
    let currentLossStreak = 0

    for (const trade of this.trades) {
      if (trade.pnl > 0) {
        currentWinStreak++
        if (currentLossStreak > 0) {
          losingStreaks.push(currentLossStreak)
          currentLossStreak = 0
        }
      } else {
        currentLossStreak++
        if (currentWinStreak > 0) {
          winningStreaks.push(currentWinStreak)
          currentWinStreak = 0
        }
      }
    }

    // Add final streak
    if (currentWinStreak > 0) winningStreaks.push(currentWinStreak)
    if (currentLossStreak > 0) losingStreaks.push(currentLossStreak)

    const avgWinStreak = winningStreaks.length > 0
      ? winningStreaks.reduce((a, b) => a + b, 0) / winningStreaks.length
      : 0

    const avgLossStreak = losingStreaks.length > 0
      ? losingStreaks.reduce((a, b) => a + b, 0) / losingStreaks.length
      : 0

    return { winRate: avgWinStreak, lossRate: avgLossStreak }
  }

  /**
   * Omega Ratio - Probability weighted ratio of gains vs losses
   */
  private calculateOmegaRatio(threshold: number = 0): number {
    const returns = this.calculateReturns()

    if (returns.length === 0) return 0

    const gains = returns.filter(r => r > threshold).reduce((a, b) => a + (b - threshold), 0)
    const losses = Math.abs(
      returns.filter(r => r < threshold).reduce((a, b) => a + (b - threshold), 0)
    )

    return losses > 0 ? gains / losses : gains > 0 ? Infinity : 0
  }

  /**
   * Gain-Pain Ratio - Sum of gains / Sum of pains
   */
  private calculateGainPainRatio(): number {
    const returns = this.calculateReturns()

    if (returns.length === 0) return 0

    const sumGains = returns.filter(r => r > 0).reduce((a, b) => a + b, 0)
    const sumPains = Math.abs(returns.filter(r => r < 0).reduce((a, b) => a + b, 0))

    return sumPains > 0 ? sumGains / sumPains : sumGains > 0 ? Infinity : 0
  }

  /**
   * Market Exposure Metrics
   */
  private calculateMarketExposure(): { timeInMarket: number; avgExposure: number } {
    if (this.equityCurve.length === 0) {
      return { timeInMarket: 0, avgExposure: 0 }
    }

    let barsInPosition = 0
    let totalExposure = 0

    for (const snapshot of this.equityCurve) {
      if (snapshot.positionValue > 0) {
        barsInPosition++
        totalExposure += snapshot.positionValue / snapshot.equity
      }
    }

    const timeInMarket = (barsInPosition / this.equityCurve.length) * 100
    const avgExposure = barsInPosition > 0 ? (totalExposure / barsInPosition) * 100 : 0

    return { timeInMarket, avgExposure }
  }

  // ============================================
  // Helper Methods
  // ============================================

  private calculateReturns(): number[] {
    const returns: number[] = []

    for (let i = 1; i < this.equityCurve.length; i++) {
      const prevEquity = this.equityCurve[i - 1].equity
      const currEquity = this.equityCurve[i].equity

      if (prevEquity > 0) {
        returns.push((currEquity - prevEquity) / prevEquity)
      }
    }

    return returns
  }

  private standardDeviation(values: number[]): number {
    if (values.length < 2) return 0

    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1)

    return Math.sqrt(variance)
  }

  private calculateProfitFactor(): number {
    const wins = this.trades.filter(t => t.pnl > 0)
    const losses = this.trades.filter(t => t.pnl < 0)

    const grossProfit = wins.reduce((sum, t) => sum + t.pnl, 0)
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0))

    return grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0
  }
}

/**
 * Factory function
 */
export function calculateAdvancedMetrics(
  trades: BacktestTrade[],
  equityCurve: PortfolioSnapshot[],
  initialCapital: number,
  benchmarkReturn?: number
): AdvancedMetrics {
  const calculator = new AdvancedMetricsCalculator(
    trades,
    equityCurve,
    initialCapital,
    benchmarkReturn
  )
  return calculator.calculate()
}
