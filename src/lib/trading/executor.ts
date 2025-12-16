// ============================================
// Trade Executor - Live Trading Engine (Enhanced 2026)
//
// Integrations:
// - UnifiedBroker: 7 broker support with connection pooling
// - Legal Compliance: Investment advice prohibition enforcement
// - Risk Profiler: Volatility-based dynamic risk calculation
//
// Benchmarks:
// - QuantConnect: Institutional-grade trade execution
// - Grok: Real-time monitoring and health checks
// - TradingView: Risk/reward ratio management
// ============================================

import type { Signal, SignalType, RiskConfig } from '@/lib/backtest/types'
import type {
  IExchange,
  Order,
  OrderRequest,
  OrderType,
  OrderSide,
  Ticker,
  AccountBalance
} from '@/lib/exchange/types'
import type { UnifiedBroker, BrokerId } from '../broker/types'
import type { Strategy } from '@/types'
import { brokerManager } from '../broker'
import { LegalCompliance } from '../agent/legal-compliance'
import { riskProfiler, type UserRiskProfile } from '../agent/risk-profiler'
import { logger, errorMetrics } from './logger'

// ============================================
// Types
// ============================================

export type ExecutorStatus = 'idle' | 'running' | 'paused' | 'stopped' | 'error'

export interface ExecutorConfig {
  // Enhanced 2026: Added userId, brokerId, userProfile
  userId: string
  brokerId: BrokerId
  userProfile?: UserRiskProfile

  strategy: Strategy
  exchange: IExchange
  symbol: string
  maxPositionSize: number // Percentage of portfolio (0-100)
  enableLive: boolean // Safety flag - must be true to place real orders
  paperTrading?: boolean // Simulate orders without real execution
  riskConfig?: RiskConfig
}

export interface Position {
  id: string
  symbol: string
  side: 'long' | 'short'
  entryPrice: number
  quantity: number
  currentPrice: number
  unrealizedPnl: number
  unrealizedPnlPercent: number
  stopLoss?: number
  takeProfit?: number
  openedAt: Date
  orderId: string
}

export interface ExecutorState {
  status: ExecutorStatus
  position: Position | null
  balance: AccountBalance | null
  lastSignal: Signal | null
  lastTicker: Ticker | null
  totalTrades: number
  totalPnl: number
  errors: ExecutorError[]
}

export interface ExecutorError {
  timestamp: Date
  code: string
  message: string
  details?: Record<string, unknown>
}

export interface TradeResult {
  success: boolean
  order?: Order
  error?: ExecutorError
}

type ExecutorEventType = 'signal' | 'order' | 'position' | 'error' | 'status'

interface ExecutorEvent {
  type: ExecutorEventType
  data: unknown
  timestamp: Date
}

type ExecutorCallback = (event: ExecutorEvent) => void

// ============================================
// Trade Executor Class
// ============================================

export class TradeExecutor {
  private config: ExecutorConfig
  private state: ExecutorState
  private callbacks: ExecutorCallback[] = []
  private tickerInterval: NodeJS.Timeout | null = null
  private readonly TICKER_INTERVAL = 1000 // 1 second

  // 🆕 2026: Race condition protection for position management
  private positionLock: Promise<void> = Promise.resolve()

  constructor(config: ExecutorConfig) {
    this.config = config
    this.state = {
      status: 'idle',
      position: null,
      balance: null,
      lastSignal: null,
      lastTicker: null,
      totalTrades: 0,
      totalPnl: 0,
      errors: [],
    }
  }

  // ============================================
  // Lifecycle Methods
  // ============================================

  /**
   * Start the executor (Enhanced 2026: Legal Compliance + Risk Profiler + Structured Logging)
   */
  async start(): Promise<void> {
    if (this.state.status === 'running') {
      logger.warn('TradeExecutor', 'Executor already running', {
        symbol: this.config.symbol,
        userId: this.config.userId
      })
      return
    }

    try {
      // Validate configuration
      this.validateConfig()

      logger.info('TradeExecutor', 'Starting executor', {
        symbol: this.config.symbol,
        userId: this.config.userId,
        mode: this.config.paperTrading ? 'PAPER' : 'LIVE',
        riskProfile: this.config.userProfile?.level || 'moderate'
      })

      // 🆕 Legal Compliance Check (2026 Enhancement)
      const compliance = LegalCompliance.assessStrategyRisk({
        stopLoss: this.config.riskConfig?.stopLossPercent,
        leverage: undefined, // TODO: Add leverage support
        positionSize: this.config.maxPositionSize,
        indicators: [], // TODO: Extract from strategy
      })

      if (compliance.level === 'extreme') {
        const error = new Error(
          `전략 위험도가 EXTREME입니다. 실행할 수 없습니다. ${compliance.warnings.join(', ')}`
        )
        this.handleError('EXTREME_RISK', error)
        throw error
      }

      if (compliance.warnings.length > 0) {
        logger.warn('TradeExecutor', 'Risk warnings detected', {
          level: compliance.level,
          warnings: compliance.warnings,
          symbol: this.config.symbol
        })
      }

      // 🆕 Connect to UnifiedBroker (2026 Enhancement)
      if (this.config.userId && this.config.brokerId) {
        const brokerResult = await brokerManager.getBroker(
          this.config.userId,
          this.config.brokerId
        )

        if (brokerResult) {
          logger.info('TradeExecutor', 'Connected to UnifiedBroker', {
            brokerId: this.config.brokerId,
            userId: this.config.userId
          })
        }
      }

      // Fetch initial balance
      this.state.balance = await this.config.exchange.getBalance()

      logger.info('TradeExecutor', 'Initial balance fetched', {
        totalValue: this.state.balance.totalValue,
        symbol: this.config.symbol
      })

      // Start ticker updates
      this.startTickerUpdates()

      this.state.status = 'running'
      this.emit('status', { status: 'running' })

      logger.info('TradeExecutor', '✅ Executor started successfully', {
        symbol: this.config.symbol,
        mode: this.config.paperTrading ? 'PAPER' : 'LIVE',
        riskLevel: this.config.userProfile?.level || 'moderate',
        maxPositionSize: this.config.maxPositionSize
      })
    } catch (error) {
      this.handleError('START_FAILED', error)
      throw error
    }
  }

  /**
   * Stop the executor
   */
  async stop(): Promise<void> {
    this.stopTickerUpdates()
    this.state.status = 'stopped'
    this.emit('status', { status: 'stopped' })

    logger.info('TradeExecutor', 'Executor stopped', {
      symbol: this.config.symbol,
      userId: this.config.userId,
      totalTrades: this.state.totalTrades,
      totalPnl: this.state.totalPnl
    })
  }

  /**
   * Pause the executor (keeps monitoring but doesn't trade)
   */
  pause(): void {
    this.state.status = 'paused'
    this.emit('status', { status: 'paused' })
  }

  /**
   * Resume the executor
   */
  resume(): void {
    if (this.state.status === 'paused') {
      this.state.status = 'running'
      this.emit('status', { status: 'running' })
    }
  }

  // ============================================
  // Signal Processing
  // ============================================

  /**
   * Process a trading signal
   */
  async processSignal(signal: Signal): Promise<TradeResult | null> {
    this.state.lastSignal = signal
    this.emit('signal', signal)

    // Don't trade if not running
    if (this.state.status !== 'running') {
      return null
    }

    // Don't trade if live trading is disabled
    if (!this.config.enableLive && !this.config.paperTrading) {
      logger.debug('TradeExecutor', 'Live trading disabled, signal ignored', {
        signalType: signal.type,
        symbol: this.config.symbol
      })
      return null
    }

    try {
      switch (signal.type) {
        case 'entry_long':
          return await this.openPosition('long', signal)
        case 'entry_short':
          return await this.openPosition('short', signal)
        case 'exit_long':
        case 'exit_short':
          return await this.closePosition(signal)
        default:
          return null
      }
    } catch (error) {
      this.handleError('SIGNAL_PROCESSING_FAILED', error)
      return {
        success: false,
        error: this.createError('SIGNAL_PROCESSING_FAILED', error),
      }
    }
  }

  // ============================================
  // Position Management
  // ============================================

  /**
   * Open a new position (Enhanced 2026: Risk Profiler + Legal Compliance + Race Condition Fix)
   */
  private async openPosition(
    side: 'long' | 'short',
    signal: Signal
  ): Promise<TradeResult> {
    // 🆕 2026: Wait for any pending position operations to complete (prevents race condition)
    await this.positionLock

    // Create new lock for this operation
    let releaseLock: () => void
    this.positionLock = new Promise(resolve => { releaseLock = resolve })

    try {
      // Check if already in position (now protected by lock)
      if (this.state.position) {
        return {
          success: false,
          error: this.createError('POSITION_EXISTS', 'Already in a position'),
        }
      }

    // Calculate position size (2026: Dynamic with Risk Profiler)
    const positionSize = this.calculatePositionSize()
    if (positionSize <= 0) {
      return {
        success: false,
        error: this.createError('INSUFFICIENT_BALANCE', 'Not enough balance'),
      }
    }

    // Get current price
    const ticker = await this.config.exchange.getTicker(this.config.symbol)
    const price = side === 'long' ? ticker.askPrice : ticker.bidPrice

    // Calculate quantity
    const quantity = positionSize / price

    // 🆕 Final Legal Compliance Check before order (2026)
    const positionSizePercent = (positionSize / (this.state.balance?.totalValue || 1)) * 100
    const compliance = LegalCompliance.assessStrategyRisk({
      stopLoss: this.config.riskConfig?.stopLossPercent,
      leverage: undefined,
      positionSize: positionSizePercent,
      indicators: [],
    })

    if (compliance.level === 'extreme') {
      logger.critical('TradeExecutor', 'Blocking EXTREME risk order', undefined, {
        level: compliance.level,
        warnings: compliance.warnings,
        symbol: this.config.symbol,
        positionSize: positionSizePercent,
        userId: this.config.userId
      })
      return {
        success: false,
        error: this.createError('EXTREME_RISK', `Order blocked: ${compliance.warnings[0]}`),
      }
    }

    if (compliance.warnings.length > 0) {
      logger.warn('TradeExecutor', 'Risk warnings before order', {
        level: compliance.level,
        warnings: compliance.warnings,
        symbol: this.config.symbol,
        side
      })
    }

    // Create order request
    const orderRequest: OrderRequest = {
      symbol: this.config.symbol,
      side: side === 'long' ? 'buy' : 'sell',
      type: 'market',
      quantity,
    }

    // Execute order (paper or real)
    const order = await this.executeOrder(orderRequest)
    if (!order) {
      return {
        success: false,
        error: this.createError('ORDER_FAILED', 'Failed to execute order'),
      }
    }

    // 🆕 Calculate stop loss and take profit (2026: Dynamic with Risk Profiler)
    const riskConfig = this.config.riskConfig
    let stopLoss: number | undefined
    let takeProfit: number | undefined

    // Use RiskConfig if provided, otherwise use RiskProfiler defaults
    if (riskConfig?.stopLossPercent) {
      stopLoss = side === 'long'
        ? price * (1 - riskConfig.stopLossPercent / 100)
        : price * (1 + riskConfig.stopLossPercent / 100)
    } else if (this.config.userProfile) {
      // 🆕 Dynamic stop loss from RiskProfiler
      const dynamicStopLoss = riskProfiler.calculateOptimalStopLoss(
        this.config.symbol,
        this.config.userProfile,
        '1d'
      )
      stopLoss = side === 'long'
        ? price * (1 - dynamicStopLoss / 100)
        : price * (1 + dynamicStopLoss / 100)
      logger.debug('TradeExecutor', 'Dynamic stop loss calculated', {
        stopLoss: dynamicStopLoss,
        symbol: this.config.symbol,
        method: 'volatility-based'
      })
    }

    if (riskConfig?.takeProfitPercent) {
      takeProfit = side === 'long'
        ? price * (1 + riskConfig.takeProfitPercent / 100)
        : price * (1 - riskConfig.takeProfitPercent / 100)
    } else if (this.config.userProfile && stopLoss) {
      // 🆕 Dynamic take profit based on risk/reward ratio
      const stopLossPercent = Math.abs((stopLoss - price) / price * 100)
      const riskRewardRatio = this.config.userProfile.level === 'conservative' ? 3 :
                              this.config.userProfile.level === 'moderate' ? 2.5 :
                              this.config.userProfile.level === 'aggressive' ? 2 : 1.5
      const takeProfitPercent = stopLossPercent * riskRewardRatio

      takeProfit = side === 'long'
        ? price * (1 + takeProfitPercent / 100)
        : price * (1 - takeProfitPercent / 100)

      logger.debug('TradeExecutor', 'Dynamic take profit calculated', {
        takeProfit: takeProfitPercent.toFixed(2),
        riskRewardRatio,
        symbol: this.config.symbol
      })
    }

    // Create position
    this.state.position = {
      id: `pos_${Date.now()}`,
      symbol: this.config.symbol,
      side,
      entryPrice: order.avgFillPrice || price,
      quantity: order.filledQuantity,
      currentPrice: price,
      unrealizedPnl: 0,
      unrealizedPnlPercent: 0,
      stopLoss,
      takeProfit,
      openedAt: new Date(),
      orderId: order.id,
    }

    this.state.totalTrades++
    this.emit('position', { action: 'open', position: this.state.position })

    logger.info('TradeExecutor', '✅ Position opened successfully', {
      side,
      quantity: quantity.toFixed(8),
      symbol: this.config.symbol,
      entryPrice: price,
      riskLevel: compliance.level,
      stopLoss: stopLoss?.toFixed(2),
      takeProfit: takeProfit?.toFixed(2),
      orderId: order.id,
      userId: this.config.userId
    })

    return { success: true, order }
    } finally {
      // 🆕 2026: Always release lock to prevent deadlock
      releaseLock!()
    }
  }

  /**
   * Close current position (Enhanced 2026: Race Condition Fix)
   */
  private async closePosition(signal: Signal): Promise<TradeResult> {
    // 🆕 2026: Wait for any pending position operations to complete (prevents race condition)
    await this.positionLock

    // Create new lock for this operation
    let releaseLock: () => void
    this.positionLock = new Promise(resolve => { releaseLock = resolve })

    try {
      if (!this.state.position) {
        return {
          success: false,
          error: this.createError('NO_POSITION', 'No position to close'),
        }
      }

      const position = this.state.position

    // Create close order
    const orderRequest: OrderRequest = {
      symbol: this.config.symbol,
      side: position.side === 'long' ? 'sell' : 'buy',
      type: 'market',
      quantity: position.quantity,
    }

    // Execute order
    const order = await this.executeOrder(orderRequest)
    if (!order) {
      return {
        success: false,
        error: this.createError('CLOSE_ORDER_FAILED', 'Failed to close position'),
      }
    }

    // Calculate PnL
    const exitPrice = order.avgFillPrice || this.state.lastTicker?.lastPrice || 0
    const pnl = position.side === 'long'
      ? (exitPrice - position.entryPrice) * position.quantity
      : (position.entryPrice - exitPrice) * position.quantity

    this.state.totalPnl += pnl
    this.emit('position', { action: 'close', position, pnl, exitPrice })

    const pnlPercent = ((exitPrice - position.entryPrice) / position.entryPrice * 100) * (position.side === 'long' ? 1 : -1)

    logger.info('TradeExecutor', '📊 Position closed', {
      side: position.side,
      symbol: this.config.symbol,
      entryPrice: position.entryPrice,
      exitPrice,
      pnl: pnl.toFixed(2),
      pnlPercent: pnlPercent.toFixed(2) + '%',
      orderId: order.id,
      userId: this.config.userId,
      profitable: pnl > 0
    })

    // Clear position
    this.state.position = null

    return { success: true, order }
    } finally {
      // 🆕 2026: Always release lock to prevent deadlock
      releaseLock!()
    }
  }

  /**
   * Execute order (paper or real)
   */
  private async executeOrder(request: OrderRequest): Promise<Order | null> {
    if (this.config.paperTrading) {
      // Paper trading - simulate order
      return this.simulateOrder(request)
    }

    // Real order
    try {
      return await this.config.exchange.createOrder(request)
    } catch (error) {
      this.handleError('ORDER_EXECUTION_FAILED', error)
      return null
    }
  }

  /**
   * Simulate order for paper trading
   */
  private simulateOrder(request: OrderRequest): Order {
    const ticker = this.state.lastTicker
    const price = request.side === 'buy'
      ? (ticker?.askPrice || 0)
      : (ticker?.bidPrice || 0)

    return {
      id: `paper_${Date.now()}`,
      symbol: request.symbol,
      side: request.side,
      type: request.type,
      status: 'filled',
      price,
      quantity: request.quantity,
      filledQuantity: request.quantity,
      avgFillPrice: price,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  // ============================================
  // Risk Management
  // ============================================

  /**
   * Check risk limits on price update
   */
  private checkRiskLimits(ticker: Ticker): void {
    if (!this.state.position || this.state.status !== 'running') {
      return
    }

    const position = this.state.position
    const currentPrice = ticker.lastPrice

    // Update position PnL
    position.currentPrice = currentPrice
    position.unrealizedPnl = position.side === 'long'
      ? (currentPrice - position.entryPrice) * position.quantity
      : (position.entryPrice - currentPrice) * position.quantity
    position.unrealizedPnlPercent = (position.unrealizedPnl / (position.entryPrice * position.quantity)) * 100

    // Check stop loss
    if (position.stopLoss) {
      const hitStopLoss = position.side === 'long'
        ? currentPrice <= position.stopLoss
        : currentPrice >= position.stopLoss

      if (hitStopLoss) {
        logger.info('TradeExecutor', '🛑 Stop loss triggered', {
          symbol: this.config.symbol,
          currentPrice,
          stopLoss: position.stopLoss,
          side: position.side,
          unrealizedPnl: position.unrealizedPnl,
          userId: this.config.userId
        })
        this.processSignal({
          type: position.side === 'long' ? 'exit_long' : 'exit_short',
          price: currentPrice,
          timestamp: Date.now(),
          reason: 'stop_loss',
        })
        return
      }
    }

    // Check take profit
    if (position.takeProfit) {
      const hitTakeProfit = position.side === 'long'
        ? currentPrice >= position.takeProfit
        : currentPrice <= position.takeProfit

      if (hitTakeProfit) {
        logger.info('TradeExecutor', '🎯 Take profit triggered', {
          symbol: this.config.symbol,
          currentPrice,
          takeProfit: position.takeProfit,
          side: position.side,
          unrealizedPnl: position.unrealizedPnl,
          userId: this.config.userId
        })
        this.processSignal({
          type: position.side === 'long' ? 'exit_long' : 'exit_short',
          price: currentPrice,
          timestamp: Date.now(),
          reason: 'take_profit',
        })
      }
    }
  }

  // ============================================
  // Utilities
  // ============================================

  /**
   * Calculate position size based on config and balance (Enhanced 2026: Risk Profiler)
   */
  private calculatePositionSize(): number {
    const balance = this.state.balance
    if (!balance) return 0

    const totalValue = balance.totalValue

    // 🆕 Use RiskProfiler for dynamic position sizing (2026)
    let maxPositionPercent = this.config.maxPositionSize

    if (this.config.userProfile) {
      // Get dynamic risk parameters from RiskProfiler
      const dynamicRisk = riskProfiler.calculateDynamicRisk(
        this.config.symbol,
        this.config.userProfile,
        '1d'
      )

      // Use smaller of config or risk profile limit
      maxPositionPercent = Math.min(
        this.config.maxPositionSize,
        dynamicRisk.positionSize
      )

      logger.debug('TradeExecutor', 'Dynamic position size calculated', {
        maxPositionPercent,
        profile: this.config.userProfile.level,
        symbol: this.config.symbol,
        configLimit: this.config.maxPositionSize,
        profileLimit: dynamicRisk.positionSize
      })
    }

    const maxSize = (totalValue * maxPositionPercent) / 100

    // Apply risk config limit if set
    if (this.config.riskConfig?.maxPositionSize) {
      const riskMaxSize = (totalValue * this.config.riskConfig.maxPositionSize) / 100
      return Math.min(maxSize, riskMaxSize)
    }

    return maxSize
  }

  /**
   * Validate configuration
   */
  private validateConfig(): void {
    if (!this.config.exchange) {
      throw new Error('Exchange is required')
    }
    if (!this.config.symbol) {
      throw new Error('Symbol is required')
    }
    if (this.config.maxPositionSize <= 0 || this.config.maxPositionSize > 100) {
      throw new Error('maxPositionSize must be between 0 and 100')
    }
    if (this.config.enableLive && !this.config.paperTrading) {
      logger.warn('TradeExecutor', '⚠️ LIVE TRADING ENABLED - Real money at risk!', {
        symbol: this.config.symbol,
        userId: this.config.userId,
        maxPositionSize: this.config.maxPositionSize
      })
    }
  }

  /**
   * Start ticker update interval
   */
  private startTickerUpdates(): void {
    this.tickerInterval = setInterval(async () => {
      try {
        const ticker = await this.config.exchange.getTicker(this.config.symbol)
        this.state.lastTicker = ticker
        this.checkRiskLimits(ticker)
      } catch (error) {
        logger.error('TradeExecutor', 'Ticker update failed', error instanceof Error ? error : undefined, {
          symbol: this.config.symbol,
          userId: this.config.userId
        })
      }
    }, this.TICKER_INTERVAL)
  }

  /**
   * Stop ticker updates
   */
  private stopTickerUpdates(): void {
    if (this.tickerInterval) {
      clearInterval(this.tickerInterval)
      this.tickerInterval = null
    }
  }

  /**
   * Handle error (Enhanced 2026: Structured Logging + Error Metrics)
   */
  private handleError(code: string, error: unknown): void {
    const executorError = this.createError(code, error)
    this.state.errors.push(executorError)

    // 🆕 Enhanced error classification (2026)
    const criticalErrors = [
      'EXTREME_RISK',
      'ORDER_EXECUTION_FAILED',
      'INSUFFICIENT_BALANCE',
      'START_FAILED'
    ]

    const isCritical = criticalErrors.includes(code)

    const errorData = {
      code,
      symbol: this.config.symbol,
      userId: this.config.userId,
      position: this.state.position ? {
        side: this.state.position.side,
        entryPrice: this.state.position.entryPrice,
        unrealizedPnl: this.state.position.unrealizedPnl
      } : undefined
    }

    if (isCritical) {
      this.state.status = 'error'

      // 🆕 Structured critical error logging
      logger.critical(
        'TradeExecutor',
        `CRITICAL ERROR: ${code}`,
        error instanceof Error ? error : undefined,
        errorData
      )

      // 🆕 Track error metrics
      errorMetrics.track({
        timestamp: new Date(),
        level: 'critical',
        component: 'TradeExecutor',
        message: executorError.message,
        data: { code, ...errorData }
      })
    } else {
      // 🆕 Structured warning logging
      logger.warn(
        'TradeExecutor',
        `Warning: ${code}`,
        errorData
      )

      // 🆕 Track error metrics
      errorMetrics.track({
        timestamp: new Date(),
        level: 'error',
        component: 'TradeExecutor',
        message: executorError.message,
        data: { code, ...errorData }
      })
    }

    this.emit('error', executorError)

    // 🆕 Check if error rate is too high
    if (errorMetrics.isErrorRateHigh()) {
      logger.critical('TradeExecutor', '🚨 Error rate exceeds threshold', undefined, {
        metrics: errorMetrics.getMetrics(),
        symbol: this.config.symbol
      })
    }

    // 🆕 Keep errors list limited to last 100 (memory management)
    if (this.state.errors.length > 100) {
      this.state.errors = this.state.errors.slice(-100)
    }
  }

  /**
   * Create error object
   */
  private createError(code: string, error: unknown): ExecutorError {
    return {
      timestamp: new Date(),
      code,
      message: error instanceof Error ? error.message : String(error),
    }
  }

  /**
   * Emit event to callbacks
   */
  private emit(type: ExecutorEventType, data: unknown): void {
    const event: ExecutorEvent = {
      type,
      data,
      timestamp: new Date(),
    }
    this.callbacks.forEach((cb) => cb(event))
  }

  // ============================================
  // Public API
  // ============================================

  /**
   * Subscribe to events
   */
  onEvent(callback: ExecutorCallback): () => void {
    this.callbacks.push(callback)
    return () => {
      const index = this.callbacks.indexOf(callback)
      if (index > -1) {
        this.callbacks.splice(index, 1)
      }
    }
  }

  /**
   * Get current state
   */
  getState(): ExecutorState {
    return { ...this.state }
  }

  /**
   * Get current position
   */
  getPosition(): Position | null {
    return this.state.position ? { ...this.state.position } : null
  }

  /**
   * Emergency close all positions
   */
  async emergencyClose(): Promise<void> {
    logger.critical('TradeExecutor', '🚨 EMERGENCY CLOSE initiated', undefined, {
      symbol: this.config.symbol,
      userId: this.config.userId,
      hasPosition: !!this.state.position,
      position: this.state.position ? {
        side: this.state.position.side,
        unrealizedPnl: this.state.position.unrealizedPnl
      } : undefined
    })

    if (this.state.position) {
      await this.closePosition({
        type: this.state.position.side === 'long' ? 'exit_long' : 'exit_short',
        price: this.state.lastTicker?.lastPrice || 0,
        timestamp: Date.now(),
        reason: 'emergency_close',
      })
    }

    this.stop()
  }
}

// ============================================
// Factory Function
// ============================================

export function createTradeExecutor(config: ExecutorConfig): TradeExecutor {
  return new TradeExecutor(config)
}
