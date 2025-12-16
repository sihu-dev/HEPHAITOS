// ============================================
// Backtesting Engine
// Core backtesting logic with Strategy Parser Integration
// ============================================

import type { OHLCV, Strategy } from '@/types'
import type {
  BacktestConfig,
  BacktestResult,
  BacktestMetrics,
  BacktestTrade,
  PortfolioSnapshot,
  Signal,
  SignalType,
  BacktestProgressCallback,
  RiskConfig,
} from './types'
import {
  strategyParser,
  type ParsedStrategy,
  type EvaluationContext,
  type StrategyCondition,
  type IndicatorConfig,
} from './strategy-parser'
import { safeLogger } from '@/lib/utils/safe-logger'
import { logger } from '../trading/logger'
import { LegalCompliance } from '../agent/legal-compliance'
import { riskProfiler, type UserRiskProfile } from '../agent/risk-profiler'
import { calculateAdvancedMetrics, type AdvancedMetrics } from './advanced-metrics'

// ============================================
// Backtest Engine Class
// ============================================

export class BacktestEngine {
  private config: BacktestConfig
  private data: OHLCV[] = []
  private trades: BacktestTrade[] = []
  private equityCurve: PortfolioSnapshot[] = []
  private currentPosition: BacktestTrade | null = null
  private cash: number = 0
  private equity: number = 0
  private peakEquity: number = 0
  private progressCallback?: BacktestProgressCallback

  // Strategy Parser 관련
  private parsedStrategy: ParsedStrategy | null = null
  private indicatorValues: Map<string, number[]> = new Map()
  private useStrategyParser: boolean = false

  // 🆕 2026 Enhancement: Risk Profiler
  private userProfile?: UserRiskProfile

  constructor(config: BacktestConfig, userProfile?: UserRiskProfile) {
    this.config = {
      leverage: 1,
      marginMode: 'isolated',
      ...config,
    }
    this.cash = config.initialCapital
    this.equity = config.initialCapital
    this.peakEquity = config.initialCapital

    // 🆕 2026: Store user risk profile
    this.userProfile = userProfile || { level: 'moderate' }

    // 전략 파서 사용 여부 결정
    this.useStrategyParser = this.hasValidStrategyConfig()
  }

  /**
   * 전략 설정이 파서를 사용할 수 있는지 확인
   */
  private hasValidStrategyConfig(): boolean {
    const strategy = this.config.strategy
    if (!strategy?.config) return false

    const hasEntryConditions = strategy.config.entryConditions?.length > 0
    const hasExitConditions = strategy.config.exitConditions?.length > 0

    return hasEntryConditions || hasExitConditions
  }

  /**
   * 전략 파싱 및 지표 계산 초기화
   */
  private initializeStrategyParser(): void {
    if (!this.useStrategyParser || !this.config.strategy) return

    const strategyConfig = this.config.strategy.config

    // 전략 조건에서 사용하는 지표 추출
    const indicatorConfigs: IndicatorConfig[] = []
    const allConditions = [
      ...(strategyConfig.entryConditions || []),
      ...(strategyConfig.exitConditions || []),
    ]

    // 조건에서 지표 설정 추출
    for (const condition of allConditions) {
      const cond = condition as unknown as StrategyCondition
      if (cond.indicator) {
        indicatorConfigs.push({
          type: cond.indicator.toUpperCase(),
          period: cond.period || 14,
        })
      }
      if (cond.indicator2) {
        indicatorConfigs.push({
          type: cond.indicator2.toUpperCase(),
          period: cond.period2 || 20,
        })
      }
    }

    // 기본 지표 추가 (SMA 10/20 크로스오버용)
    if (indicatorConfigs.length === 0) {
      indicatorConfigs.push(
        { type: 'SMA', period: 10 },
        { type: 'SMA', period: 20 },
        { type: 'RSI', period: 14 }
      )
    }

    // 전략 파싱
    this.parsedStrategy = strategyParser.parse({
      name: this.config.strategy.name,
      entryConditions: strategyConfig.entryConditions as unknown as StrategyCondition[],
      exitConditions: strategyConfig.exitConditions as unknown as StrategyCondition[],
      riskManagement: strategyConfig.riskManagement as RiskConfig,
      indicators: indicatorConfigs,
    })

    // 지표 계산
    const indicatorMap = new Map<string, IndicatorConfig>()
    for (const config of indicatorConfigs) {
      indicatorMap.set(`${config.type}_${config.period || 'default'}`, config)
    }
    this.indicatorValues = strategyParser.calculateIndicators(this.data, indicatorMap)

    safeLogger.info('[BacktestEngine] Strategy parser initialized', {
      strategyName: this.parsedStrategy.name,
      indicatorCount: this.indicatorValues.size,
      entryConditions: this.parsedStrategy.entryLong.length,
      exitConditions: this.parsedStrategy.exitLong.length,
    })
  }

  // ============================================
  // Public API
  // ============================================

  /**
   * Set historical data for backtesting
   */
  setData(data: OHLCV[]): void {
    // Filter data by date range
    this.data = data.filter(
      (candle) =>
        candle.timestamp >= this.config.startDate &&
        candle.timestamp <= this.config.endDate
    )
  }

  /**
   * Set progress callback
   */
  onProgress(callback: BacktestProgressCallback): void {
    this.progressCallback = callback
  }

  /**
   * Run backtest (Enhanced 2026: Legal Compliance + Structured Logging)
   */
  async run(): Promise<BacktestResult> {
    const startTime = Date.now()

    logger.info('BacktestEngine', 'Starting backtest', {
      strategyName: this.config.strategy.name,
      symbol: this.config.symbol,
      startDate: this.config.startDate,
      endDate: this.config.endDate,
      initialCapital: this.config.initialCapital,
      riskProfile: this.userProfile?.level
    })

    if (this.data.length === 0) {
      logger.error('BacktestEngine', 'No data available for backtest')
      return this.createFailedResult('No data available for backtest', startTime)
    }

    try {
      // 🆕 Legal Compliance Check (2026)
      const riskConfig = this.config.strategy.config.riskManagement as RiskConfig | undefined
      const compliance = LegalCompliance.assessStrategyRisk({
        stopLoss: riskConfig?.stopLossPercent,
        leverage: this.config.leverage,
        positionSize: 95, // Using 95% of capital
        indicators: []
      })

      if (compliance.level === 'extreme') {
        logger.critical('BacktestEngine', 'Strategy has EXTREME risk level', undefined, {
          warnings: compliance.warnings,
          strategyName: this.config.strategy.name
        })
        return this.createFailedResult(
          `Strategy risk level is EXTREME: ${compliance.warnings.join(', ')}`,
          startTime
        )
      }

      if (compliance.warnings.length > 0) {
        logger.warn('BacktestEngine', 'Strategy risk warnings', {
          level: compliance.level,
          warnings: compliance.warnings
        })
      }

      // Initialize strategy parser if using custom strategy
      if (this.useStrategyParser) {
        this.initializeStrategyParser()
      }

      logger.info('BacktestEngine', 'Running simulation', {
        totalBars: this.data.length,
        useStrategyParser: this.useStrategyParser
      })

      // Run simulation
      await this.simulate()

      // Close any open position at end
      if (this.currentPosition) {
        this.closePosition(
          this.data[this.data.length - 1],
          'backtest_end'
        )
      }

      // Calculate metrics
      const metrics = this.calculateMetrics()

      // 🆕 Calculate advanced metrics (2026)
      const advancedMetrics = calculateAdvancedMetrics(
        this.trades,
        this.equityCurve,
        this.config.initialCapital,
        0.10 // Default benchmark: 10% annually (S&P 500 average)
      )

      const duration = Date.now() - startTime

      logger.info('BacktestEngine', '✅ Backtest completed successfully', {
        totalTrades: metrics.totalTrades,
        winRate: metrics.winRate.toFixed(2) + '%',
        totalReturn: metrics.totalReturnPercent.toFixed(2) + '%',
        sharpeRatio: metrics.sharpeRatio.toFixed(2),
        maxDrawdown: metrics.maxDrawdownPercent.toFixed(2) + '%',
        kellyCriterion: advancedMetrics.kellyCriterion.toFixed(2) + '%',
        tradeQualityScore: advancedMetrics.tradeQualityScore.toFixed(1),
        duration: `${(duration / 1000).toFixed(2)}s`
      })

      return {
        config: this.config,
        metrics,
        trades: this.trades,
        equityCurve: this.equityCurve,
        startTime: new Date(startTime),
        endTime: new Date(),
        duration,
        status: 'completed',
        advancedMetrics, // 🆕 Include advanced metrics
      }
    } catch (error) {
      logger.error('BacktestEngine', 'Backtest failed', error instanceof Error ? error : undefined, {
        strategyName: this.config.strategy.name
      })

      return this.createFailedResult(
        error instanceof Error ? error.message : 'Unknown error',
        startTime
      )
    }
  }

  // ============================================
  // Simulation Logic
  // ============================================

  private async simulate(): Promise<void> {
    const totalBars = this.data.length
    const startTime = Date.now()

    for (let i = 0; i < totalBars; i++) {
      const candle = this.data[i]

      // Generate signals based on strategy
      const signal = this.evaluateStrategy(candle, i)

      // Process signal
      this.processSignal(signal, candle)

      // Update portfolio snapshot
      this.updateSnapshot(candle)

      // Check risk limits
      this.checkRiskLimits(candle)

      // Report progress
      if (this.progressCallback && i % 100 === 0) {
        const elapsed = Date.now() - startTime
        const rate = (i + 1) / elapsed
        const remaining = (totalBars - i - 1) / rate

        this.progressCallback({
          currentBar: i + 1,
          totalBars,
          percent: ((i + 1) / totalBars) * 100,
          currentDate: candle.timestamp,
          elapsedTime: elapsed,
          estimatedTimeRemaining: remaining,
        })
      }

      // Yield to prevent blocking (for large datasets)
      if (i % 1000 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0))
      }
    }
  }

  /**
   * Evaluate strategy and generate signal
   * Strategy Parser를 사용하여 사용자 정의 조건 평가
   */
  private evaluateStrategy(candle: OHLCV, index: number): Signal {
    // Strategy Parser 사용 시 파싱된 조건으로 평가
    if (this.useStrategyParser && this.parsedStrategy) {
      return this.evaluateWithParser(candle, index)
    }

    // Fallback: 기본 SMA 크로스오버 전략
    return this.evaluateDefaultStrategy(candle, index)
  }

  /**
   * Strategy Parser를 사용한 전략 평가
   */
  private evaluateWithParser(candle: OHLCV, index: number): Signal {
    if (!this.parsedStrategy) {
      return { type: 'none', price: candle.close, timestamp: candle.timestamp }
    }

    // 평가 컨텍스트 생성
    const context: EvaluationContext = {
      candle,
      index,
      data: this.data,
      indicators: this.indicatorValues,
      position: this.currentPosition ? {
        side: this.currentPosition.side,
        entryPrice: this.currentPosition.entryPrice,
        currentPnlPercent: this.calculateCurrentPnlPercent(candle),
      } : undefined,
    }

    let signalType: SignalType = 'none'

    // 포지션이 없을 때: 진입 조건 확인
    if (!this.currentPosition) {
      // Long 진입 조건 평가
      const longEntry = this.parsedStrategy.entryLong.length === 0 ||
        this.parsedStrategy.entryLong.every(cond => cond.evaluate(context))

      // Short 진입 조건 평가
      const shortEntry = this.parsedStrategy.entryShort.length === 0 ||
        this.parsedStrategy.entryShort.every(cond => cond.evaluate(context))

      // 조건이 명시적으로 정의된 경우만 진입
      if (this.parsedStrategy.entryLong.length > 0 && longEntry) {
        signalType = 'entry_long'
      } else if (this.parsedStrategy.entryShort.length > 0 && shortEntry) {
        signalType = 'entry_short'
      }
    }
    // 포지션이 있을 때: 청산 조건 확인
    else {
      if (this.currentPosition.side === 'long') {
        const exitLong = this.parsedStrategy.exitLong.length === 0 ||
          this.parsedStrategy.exitLong.some(cond => cond.evaluate(context))

        if (this.parsedStrategy.exitLong.length > 0 && exitLong) {
          signalType = 'exit_long'
        }
      } else {
        const exitShort = this.parsedStrategy.exitShort.length === 0 ||
          this.parsedStrategy.exitShort.some(cond => cond.evaluate(context))

        if (this.parsedStrategy.exitShort.length > 0 && exitShort) {
          signalType = 'exit_short'
        }
      }
    }

    return {
      type: signalType,
      price: candle.close,
      timestamp: candle.timestamp,
    }
  }

  /**
   * 현재 손익률 계산
   */
  private calculateCurrentPnlPercent(candle: OHLCV): number {
    if (!this.currentPosition) return 0

    const currentPrice = candle.close
    const entryPrice = this.currentPosition.entryPrice

    if (this.currentPosition.side === 'long') {
      return ((currentPrice - entryPrice) / entryPrice) * 100
    } else {
      return ((entryPrice - currentPrice) / entryPrice) * 100
    }
  }

  /**
   * 기본 전략 (SMA 크로스오버) - Fallback용
   */
  private evaluateDefaultStrategy(candle: OHLCV, index: number): Signal {
    const lookback = 50
    if (index < lookback) {
      return { type: 'none', price: candle.close, timestamp: candle.timestamp }
    }

    // Get recent closes
    const closes = this.data.slice(index - lookback, index + 1).map((c) => c.close)

    // Simple 10/20 SMA crossover
    const sma10 = this.calculateSMA(closes.slice(-10), 10)
    const sma20 = this.calculateSMA(closes.slice(-20), 20)
    const prevSma10 = this.calculateSMA(closes.slice(-11, -1), 10)
    const prevSma20 = this.calculateSMA(closes.slice(-21, -1), 20)

    let signalType: SignalType = 'none'

    // Entry signals
    if (!this.currentPosition) {
      if (prevSma10 <= prevSma20 && sma10 > sma20) {
        signalType = 'entry_long'
      } else if (prevSma10 >= prevSma20 && sma10 < sma20) {
        signalType = 'entry_short'
      }
    }
    // Exit signals
    else {
      if (this.currentPosition.side === 'long' && sma10 < sma20) {
        signalType = 'exit_long'
      } else if (this.currentPosition.side === 'short' && sma10 > sma20) {
        signalType = 'exit_short'
      }
    }

    return {
      type: signalType,
      price: candle.close,
      timestamp: candle.timestamp,
    }
  }

  private calculateSMA(data: number[], period: number): number {
    if (data.length < period) return 0
    const slice = data.slice(-period)
    return slice.reduce((a, b) => a + b, 0) / period
  }

  /**
   * Process trading signal
   */
  private processSignal(signal: Signal, candle: OHLCV): void {
    switch (signal.type) {
      case 'entry_long':
        this.openPosition(candle, 'long', signal.reason)
        break
      case 'entry_short':
        this.openPosition(candle, 'short', signal.reason)
        break
      case 'exit_long':
      case 'exit_short':
        if (this.currentPosition) {
          this.closePosition(candle, signal.reason)
        }
        break
    }
  }

  /**
   * Open a new position (Enhanced 2026: Structured Logging)
   */
  private openPosition(
    candle: OHLCV,
    side: 'long' | 'short',
    reason?: string
  ): void {
    if (this.currentPosition) return // Already in position

    // Calculate position size (use 95% of available cash)
    const positionSize = this.cash * 0.95
    const slippage = candle.close * this.config.slippage
    const entryPrice = side === 'long'
      ? candle.close + slippage
      : candle.close - slippage

    const quantity = positionSize / entryPrice
    const commission = positionSize * this.config.commission

    this.currentPosition = {
      id: `trade_${this.trades.length + 1}`,
      entryTime: candle.timestamp,
      exitTime: null,
      entryPrice,
      exitPrice: null,
      quantity,
      side,
      pnl: 0,
      pnlPercent: 0,
      commission,
      slippage: slippage * quantity,
      status: 'open',
      entryReason: reason,
    }

    this.cash -= positionSize + commission

    logger.debug('BacktestEngine', '📈 Position opened', {
      side,
      entryPrice,
      quantity: quantity.toFixed(8),
      positionSize: positionSize.toFixed(2),
      reason: reason || 'strategy_signal',
      timestamp: candle.timestamp
    })
  }

  /**
   * Close current position (Enhanced 2026: Structured Logging)
   */
  private closePosition(candle: OHLCV, reason?: string): void {
    if (!this.currentPosition) return

    const slippage = candle.close * this.config.slippage
    const exitPrice = this.currentPosition.side === 'long'
      ? candle.close - slippage
      : candle.close + slippage

    const positionValue = this.currentPosition.quantity * exitPrice
    const commission = positionValue * this.config.commission

    // Calculate PnL
    const entryValue = this.currentPosition.quantity * this.currentPosition.entryPrice
    const exitValue = positionValue

    let pnl: number
    if (this.currentPosition.side === 'long') {
      pnl = exitValue - entryValue
    } else {
      pnl = entryValue - exitValue
    }

    // Subtract commissions
    pnl -= this.currentPosition.commission + commission

    const pnlPercent = (pnl / entryValue) * 100

    // Update position
    this.currentPosition.exitTime = candle.timestamp
    this.currentPosition.exitPrice = exitPrice
    this.currentPosition.pnl = pnl
    this.currentPosition.pnlPercent = pnlPercent
    this.currentPosition.commission += commission
    this.currentPosition.slippage += slippage * this.currentPosition.quantity
    this.currentPosition.status = 'closed'
    this.currentPosition.exitReason = reason

    logger.debug('BacktestEngine', '📊 Position closed', {
      side: this.currentPosition.side,
      entryPrice: this.currentPosition.entryPrice,
      exitPrice,
      pnl: pnl.toFixed(2),
      pnlPercent: pnlPercent.toFixed(2) + '%',
      reason: reason || 'strategy_signal',
      profitable: pnl > 0,
      timestamp: candle.timestamp
    })

    // Add to trades
    this.trades.push({ ...this.currentPosition })

    // Update cash
    this.cash += positionValue - commission

    // Clear position
    this.currentPosition = null
  }

  /**
   * Update portfolio snapshot
   */
  private updateSnapshot(candle: OHLCV): void {
    let positionValue = 0
    let unrealizedPnl = 0

    if (this.currentPosition) {
      const currentValue = this.currentPosition.quantity * candle.close
      const entryValue = this.currentPosition.quantity * this.currentPosition.entryPrice

      if (this.currentPosition.side === 'long') {
        unrealizedPnl = currentValue - entryValue
      } else {
        unrealizedPnl = entryValue - currentValue
      }
      positionValue = currentValue
    }

    this.equity = this.cash + positionValue
    this.peakEquity = Math.max(this.peakEquity, this.equity)

    const drawdown = this.peakEquity - this.equity
    const drawdownPercent = this.peakEquity > 0 ? (drawdown / this.peakEquity) * 100 : 0

    const realizedPnl = this.trades.reduce((sum, t) => sum + t.pnl, 0)

    this.equityCurve.push({
      timestamp: candle.timestamp,
      equity: this.equity,
      cash: this.cash,
      positionValue,
      unrealizedPnl,
      realizedPnl,
      drawdown,
      drawdownPercent,
    })
  }

  /**
   * Check risk limits
   */
  private checkRiskLimits(candle: OHLCV): void {
    const riskConfig = this.config.strategy.config.riskManagement as RiskConfig | undefined

    if (!riskConfig || !this.currentPosition) return

    // Check stop loss
    if (riskConfig.stopLossPercent) {
      const stopPrice = this.currentPosition.side === 'long'
        ? this.currentPosition.entryPrice * (1 - riskConfig.stopLossPercent / 100)
        : this.currentPosition.entryPrice * (1 + riskConfig.stopLossPercent / 100)

      if (
        (this.currentPosition.side === 'long' && candle.low <= stopPrice) ||
        (this.currentPosition.side === 'short' && candle.high >= stopPrice)
      ) {
        this.closePosition(candle, 'stop_loss')
        return
      }
    }

    // Check take profit
    if (riskConfig.takeProfitPercent) {
      const tpPrice = this.currentPosition.side === 'long'
        ? this.currentPosition.entryPrice * (1 + riskConfig.takeProfitPercent / 100)
        : this.currentPosition.entryPrice * (1 - riskConfig.takeProfitPercent / 100)

      if (
        (this.currentPosition.side === 'long' && candle.high >= tpPrice) ||
        (this.currentPosition.side === 'short' && candle.low <= tpPrice)
      ) {
        this.closePosition(candle, 'take_profit')
        return
      }
    }

    // Check max drawdown
    if (riskConfig.maxDrawdown) {
      const currentDrawdownPercent = this.peakEquity > 0
        ? ((this.peakEquity - this.equity) / this.peakEquity) * 100
        : 0

      if (currentDrawdownPercent >= riskConfig.maxDrawdown) {
        this.closePosition(candle, 'max_drawdown')
      }
    }
  }

  // ============================================
  // Metrics Calculation
  // ============================================

  private calculateMetrics(): BacktestMetrics {
    const initialCapital = this.config.initialCapital
    const finalEquity = this.equity

    // Returns
    const totalReturn = finalEquity - initialCapital
    const totalReturnPercent = (totalReturn / initialCapital) * 100

    // Trading days
    const tradingDays = this.equityCurve.length

    // Annualized return (assuming 252 trading days per year)
    const years = tradingDays / 252
    const annualizedReturn = years > 0
      ? (Math.pow(finalEquity / initialCapital, 1 / years) - 1) * 100
      : 0

    // Drawdown
    let maxDrawdown = 0
    let maxDrawdownPercent = 0
    for (const snapshot of this.equityCurve) {
      maxDrawdown = Math.max(maxDrawdown, snapshot.drawdown)
      maxDrawdownPercent = Math.max(maxDrawdownPercent, snapshot.drawdownPercent)
    }

    // Trade statistics
    const winningTrades = this.trades.filter((t) => t.pnl > 0)
    const losingTrades = this.trades.filter((t) => t.pnl <= 0)
    const totalTrades = this.trades.length

    const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0

    const avgWin = winningTrades.length > 0
      ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length
      : 0

    const avgLoss = losingTrades.length > 0
      ? Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length)
      : 0

    const largestWin = winningTrades.length > 0
      ? Math.max(...winningTrades.map((t) => t.pnl))
      : 0

    const largestLoss = losingTrades.length > 0
      ? Math.abs(Math.min(...losingTrades.map((t) => t.pnl)))
      : 0

    // Profit factor
    const grossProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0)
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0))
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0

    // Expectancy
    const expectancy = totalTrades > 0
      ? (winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLoss
      : 0

    // Average trade duration
    let totalDuration = 0
    for (const trade of this.trades) {
      if (trade.exitTime !== null) {
        totalDuration += trade.exitTime - trade.entryTime
      }
    }
    const avgTradeDuration = totalTrades > 0
      ? totalDuration / totalTrades / (1000 * 60 * 60) // Convert to hours
      : 0

    // Risk-adjusted metrics
    const returns = this.calculateDailyReturns()
    const sharpeRatio = this.calculateSharpeRatio(returns)
    const sortinoRatio = this.calculateSortinoRatio(returns)
    const calmarRatio = maxDrawdownPercent > 0
      ? annualizedReturn / maxDrawdownPercent
      : 0

    // Calculate volatility (annualized standard deviation of returns)
    const volatility = returns.length > 1
      ? Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - (returns.reduce((a, b) => a + b, 0) / returns.length), 2), 0) / (returns.length - 1)) * Math.sqrt(252)
      : 0

    // Calculate max consecutive wins/losses
    let maxConsecutiveWins = 0
    let maxConsecutiveLosses = 0
    let currentWinStreak = 0
    let currentLossStreak = 0

    for (const trade of this.trades) {
      if (trade.pnl > 0) {
        currentWinStreak++
        currentLossStreak = 0
        maxConsecutiveWins = Math.max(maxConsecutiveWins, currentWinStreak)
      } else {
        currentLossStreak++
        currentWinStreak = 0
        maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentLossStreak)
      }
    }

    return {
      totalReturn,
      totalReturnPercent,
      annualizedReturn,
      maxDrawdown,
      maxDrawdownPercent,
      sharpeRatio,
      sortinoRatio,
      calmarRatio,
      volatility,
      totalTrades,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate,
      avgWin,
      avgLoss,
      largestWin,
      largestLoss,
      avgTradeDuration,
      profitFactor,
      expectancy,
      maxConsecutiveWins,
      maxConsecutiveLosses,
      avgHoldingPeriod: avgTradeDuration,
      tradingDays,
      averageTradesPerDay: tradingDays > 0 ? totalTrades / tradingDays : 0,
    }
  }

  private calculateDailyReturns(): number[] {
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

  private calculateSharpeRatio(returns: number[], riskFreeRate: number = 0.02): number {
    if (returns.length < 2) return 0

    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length
    const dailyRiskFree = riskFreeRate / 252

    const excessReturns = returns.map((r) => r - dailyRiskFree)
    const avgExcessReturn = excessReturns.reduce((a, b) => a + b, 0) / excessReturns.length

    const variance = excessReturns.reduce(
      (sum, r) => sum + Math.pow(r - avgExcessReturn, 2),
      0
    ) / (excessReturns.length - 1)

    const stdDev = Math.sqrt(variance)

    if (stdDev === 0) return 0

    // Annualize
    return (avgExcessReturn / stdDev) * Math.sqrt(252)
  }

  private calculateSortinoRatio(returns: number[], riskFreeRate: number = 0.02): number {
    if (returns.length < 2) return 0

    const dailyRiskFree = riskFreeRate / 252
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length

    // Only consider downside deviation
    const negativeReturns = returns.filter((r) => r < dailyRiskFree)
    if (negativeReturns.length === 0) return avgReturn > dailyRiskFree ? Infinity : 0

    const downsideVariance = negativeReturns.reduce(
      (sum, r) => sum + Math.pow(r - dailyRiskFree, 2),
      0
    ) / negativeReturns.length

    const downsideDeviation = Math.sqrt(downsideVariance)

    if (downsideDeviation === 0) return 0

    // Annualize
    return ((avgReturn - dailyRiskFree) / downsideDeviation) * Math.sqrt(252)
  }

  // ============================================
  // Helpers
  // ============================================

  private createFailedResult(error: string, startTime: number): BacktestResult {
    return {
      config: this.config,
      metrics: this.createEmptyMetrics(),
      trades: [],
      equityCurve: [],
      startTime: new Date(startTime),
      endTime: new Date(),
      duration: Date.now() - startTime,
      status: 'failed',
      error,
    }
  }

  private createEmptyMetrics(): BacktestMetrics {
    return {
      totalReturn: 0,
      totalReturnPercent: 0,
      annualizedReturn: 0,
      maxDrawdown: 0,
      maxDrawdownPercent: 0,
      sharpeRatio: 0,
      sortinoRatio: 0,
      calmarRatio: 0,
      volatility: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      avgWin: 0,
      avgLoss: 0,
      largestWin: 0,
      largestLoss: 0,
      avgTradeDuration: 0,
      profitFactor: 0,
      expectancy: 0,
      maxConsecutiveWins: 0,
      maxConsecutiveLosses: 0,
      avgHoldingPeriod: 0,
      tradingDays: 0,
      averageTradesPerDay: 0,
    }
  }
}

// ============================================
// Factory Function (Enhanced 2026: Risk Profiler Support)
// ============================================

export function createBacktestEngine(
  config: BacktestConfig,
  userProfile?: UserRiskProfile
): BacktestEngine {
  return new BacktestEngine(config, userProfile)
}
