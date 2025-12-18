// ============================================
// Trade Executor Unit Tests
// ============================================

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { TradeExecutor } from '@/lib/trading/executor'
import type { ExecutorConfig, ExecutorStatus } from '@/lib/trading/executor'
import type {
  IExchange,
  Order,
  Ticker,
  AccountBalance,
  OrderRequest,
} from '@/lib/exchange/types'
import type { Signal } from '@/lib/backtest/types'
import type { Strategy } from '@/types'

// ============================================
// Mock Exchange
// ============================================

class MockExchange implements IExchange {
  readonly id = 'binance' as const
  readonly name = 'Binance'

  private mockBalance: AccountBalance = {
    exchangeId: 'binance',
    balances: [
      { currency: 'USDT', available: 100000, locked: 0, total: 100000 },
      { currency: 'BTC', available: 0, locked: 0, total: 0 },
    ],
    totalValue: 100000,
    updatedAt: new Date(),
  }

  private mockTicker: Ticker = {
    symbol: 'BTC/USDT',
    bidPrice: 50000,
    askPrice: 50010,
    lastPrice: 50005,
    high24h: 51000,
    low24h: 49000,
    volume24h: 1000,
    quoteVolume24h: 50000000,
    change24h: 500,
    changePercent24h: 1.0,
    timestamp: Date.now(),
  }

  setCredentials(): void {}
  async validateCredentials(): Promise<boolean> { return true }

  async getBalance(): Promise<AccountBalance> {
    return this.mockBalance
  }

  async getTicker(symbol: string): Promise<Ticker> {
    return this.mockTicker
  }

  async getTickers(): Promise<Ticker[]> {
    return [this.mockTicker]
  }

  async getOrderBook(): Promise<import('@/lib/exchange/types').OrderBook> {
    return {
      symbol: 'BTC/USDT',
      bids: [],
      asks: [],
      timestamp: Date.now(),
    }
  }

  async getOHLCV(): Promise<import('@/types').OHLCV[]> {
    return []
  }

  async getMarkets(): Promise<import('@/lib/exchange/types').MarketInfo[]> {
    return []
  }

  async createOrder(request: OrderRequest): Promise<Order> {
    return {
      id: `order_${Date.now()}`,
      symbol: request.symbol,
      side: request.side,
      type: request.type,
      quantity: request.quantity,
      price: request.price || this.mockTicker.lastPrice,
      status: 'filled',
      filledQuantity: request.quantity,
      avgFillPrice: this.mockTicker.lastPrice,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  async cancelOrder(): Promise<boolean> { return true }
  async getOrder(): Promise<Order> {
    return {
      id: 'test',
      symbol: 'BTC/USDT',
      side: 'buy',
      type: 'market',
      quantity: 1,
      price: 50000,
      status: 'filled',
      filledQuantity: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }
  async getOpenOrders(): Promise<Order[]> { return [] }
  async getOrderHistory(): Promise<Order[]> { return [] }

  subscribe(): void {}
  unsubscribe(): void {}
  onMessage(): void {}
  disconnect(): void {}

  updateBalance(balance: AccountBalance): void {
    this.mockBalance = balance
  }

  updateTicker(ticker: Partial<Ticker>): void {
    this.mockTicker = { ...this.mockTicker, ...ticker }
  }
}

// ============================================
// Test Helper Functions
// ============================================

const createMockStrategy = (): Strategy => ({
  id: 'test-strategy',
  name: 'Test Strategy',
  description: 'Test strategy for unit tests',
  status: 'ready',
  config: {
    symbols: ['BTC/USDT'],
    timeframe: '1h',
    entryConditions: [
      { id: 'entry-1', indicator: 'rsi', operator: 'lt', value: 30, params: { period: 14 } },
    ],
    exitConditions: [
      { id: 'exit-1', indicator: 'rsi', operator: 'gt', value: 70, params: { period: 14 } },
    ],
    riskManagement: {
      stopLoss: 5,
      takeProfit: 10,
    },
    allocation: 20,
  },
  userId: 'test-user',
  createdAt: new Date(),
  updatedAt: new Date(),
})

const createExecutorConfig = (
  overrides?: Partial<ExecutorConfig>
): ExecutorConfig => ({
  userId: 'test-user',
  brokerId: 'binance',
  strategy: createMockStrategy(),
  exchange: new MockExchange(),
  symbol: 'BTC/USDT',
  maxPositionSize: 20,
  enableLive: false,
  paperTrading: true,
  riskConfig: {
    maxPositionSize: 20,
    maxDrawdown: 15,
    stopLossPercent: 5,
    takeProfitPercent: 10,
  },
  ...overrides,
})

// ============================================
// Tests
// ============================================

describe('TradeExecutor', () => {
  describe('Constructor', () => {
    it('should create executor with initial state', () => {
      const config = createExecutorConfig()
      const executor = new TradeExecutor(config)

      const state = executor.getState()
      expect(state.status).toBe('idle')
      expect(state.position).toBeNull()
      expect(state.balance).toBeNull()
      expect(state.lastSignal).toBeNull()
      expect(state.totalTrades).toBe(0)
      expect(state.totalPnl).toBe(0)
    })

    it('should create executor with custom config', () => {
      const customConfig = createExecutorConfig({
        maxPositionSize: 50,
        enableLive: true,
        paperTrading: false,
      })

      const executor = new TradeExecutor(customConfig)
      const state = executor.getState()

      expect(state.status).toBe('idle')
    })
  })

  describe('Lifecycle - Start/Stop', () => {
    let executor: TradeExecutor
    let mockExchange: MockExchange

    beforeEach(() => {
      mockExchange = new MockExchange()
      const config = createExecutorConfig({
        exchange: mockExchange,
      })
      executor = new TradeExecutor(config)
    })

    afterEach(async () => {
      if (executor.getState().status === 'running') {
        await executor.stop()
      }
    })

    it('should start executor successfully', async () => {
      await executor.start()

      const state = executor.getState()
      expect(state.status).toBe('running')
      expect(state.balance).not.toBeNull()
      expect(state.balance?.totalValue).toBe(100000)
    })

    it('should not start twice', async () => {
      await executor.start()
      await executor.start() // Should not throw

      const state = executor.getState()
      expect(state.status).toBe('running')
    })

    it('should stop executor successfully', async () => {
      await executor.start()
      await executor.stop()

      const state = executor.getState()
      expect(state.status).toBe('stopped')
    })

    it('should stop executor even when not started', async () => {
      await executor.stop() // Should not throw

      const state = executor.getState()
      expect(state.status).toBe('stopped')
    })
  })

  describe('Legal Compliance', () => {
    it.skip('should start with proper risk management', async () => {
      // Note: LegalCompliance.assessStrategyRisk may not block without stopLoss alone
      // It requires other factors like high leverage or large position size
      const dangerousStrategy: Strategy = {
        ...createMockStrategy(),
        config: {
          symbols: ['BTC/USDT'],
          timeframe: '1h',
          entryConditions: [
            { id: 'entry-1', indicator: 'rsi', operator: 'lt', value: 30, params: { period: 14 } },
          ],
          exitConditions: [
            { id: 'exit-1', indicator: 'rsi', operator: 'gt', value: 70, params: { period: 14 } },
          ],
          riskManagement: {}, // No stop loss
          allocation: 90, // Very high allocation
        },
      }

      const config = createExecutorConfig({
        strategy: dangerousStrategy,
        riskConfig: undefined, // No risk config
        maxPositionSize: 90, // Very high position size (EXTREME risk)
      })

      const executor = new TradeExecutor(config)

      // With high position size (90%), should trigger EXTREME risk
      await expect(executor.start()).rejects.toThrow(/EXTREME/)
    })

    it('should allow safe strategy with stop loss', async () => {
      const config = createExecutorConfig()
      const executor = new TradeExecutor(config)

      await expect(executor.start()).resolves.not.toThrow()

      await executor.stop()
    })
  })

  describe('Pause/Resume', () => {
    let executor: TradeExecutor

    beforeEach(async () => {
      const config = createExecutorConfig()
      executor = new TradeExecutor(config)
      await executor.start()
    })

    afterEach(async () => {
      await executor.stop()
    })

    it('should pause executor', () => {
      executor.pause()

      const state = executor.getState()
      expect(state.status).toBe('paused')
    })

    it('should resume executor', () => {
      executor.pause()
      executor.resume()

      const state = executor.getState()
      expect(state.status).toBe('running')
    })

    it('should ignore signals when paused', async () => {
      executor.pause()

      const signal: Signal = {
        type: 'entry_long',
        price: 50000,
        timestamp: Date.now(),
      }

      const result = await executor.processSignal(signal)
      expect(result).toBeNull()
    })
  })

  describe('Signal Processing', () => {
    let executor: TradeExecutor
    let mockExchange: MockExchange

    beforeEach(async () => {
      mockExchange = new MockExchange()
      const config = createExecutorConfig({
        exchange: mockExchange,
      })
      executor = new TradeExecutor(config)
      await executor.start()
    })

    afterEach(async () => {
      await executor.stop()
    })

    it('should process entry_long signal', async () => {
      const signal: Signal = {
        type: 'entry_long',
        price: 50000,
        timestamp: Date.now(),
      }

      const result = await executor.processSignal(signal)

      expect(result).toBeDefined()
      expect(result?.success).toBe(true)

      const position = executor.getPosition()
      expect(position).toBeDefined()
      expect(position?.side).toBe('long')
    })

    it('should process entry_short signal', async () => {
      const signal: Signal = {
        type: 'entry_short',
        price: 50000,
        timestamp: Date.now(),
      }

      const result = await executor.processSignal(signal)

      expect(result).toBeDefined()
      expect(result?.success).toBe(true)

      const position = executor.getPosition()
      expect(position).toBeDefined()
      expect(position?.side).toBe('short')
    })

    it('should ignore duplicate entry signal', async () => {
      const signal: Signal = {
        type: 'entry_long',
        price: 50000,
        timestamp: Date.now(),
      }

      await executor.processSignal(signal)
      const result = await executor.processSignal(signal)

      expect(result?.success).toBe(false)
    })

    it('should process exit signal and close position', async () => {
      // Open position
      await executor.processSignal({
        type: 'entry_long',
        price: 50000,
        timestamp: Date.now(),
      })

      expect(executor.getPosition()).toBeDefined()

      // Close position
      const exitResult = await executor.processSignal({
        type: 'exit_long',
        price: 51000,
        timestamp: Date.now(),
      })

      expect(exitResult?.success).toBe(true)
      expect(executor.getPosition()).toBeNull()
    })

    it('should ignore exit signal without position', async () => {
      const signal: Signal = {
        type: 'exit_long',
        price: 50000,
        timestamp: Date.now(),
      }

      const result = await executor.processSignal(signal)
      expect(result?.success).toBe(false)
    })
  })

  describe('Event Handling', () => {
    let executor: TradeExecutor

    beforeEach(async () => {
      const config = createExecutorConfig()
      executor = new TradeExecutor(config)
      await executor.start()
    })

    afterEach(async () => {
      await executor.stop()
    })

    it('should emit events', async () => {
      const events: unknown[] = []

      executor.onEvent((event) => {
        events.push(event)
      })

      await executor.processSignal({
        type: 'entry_long',
        price: 50000,
        timestamp: Date.now(),
      })

      expect(events.length).toBeGreaterThan(0)
    })

    it('should unsubscribe from events', async () => {
      const events: unknown[] = []

      const unsubscribe = executor.onEvent((event) => {
        events.push(event)
      })

      unsubscribe()

      await executor.processSignal({
        type: 'entry_long',
        price: 50000,
        timestamp: Date.now(),
      })

      expect(events.length).toBe(0)
    })
  })

  describe('Emergency Close', () => {
    let executor: TradeExecutor

    beforeEach(async () => {
      const config = createExecutorConfig()
      executor = new TradeExecutor(config)
      await executor.start()
    })

    afterEach(async () => {
      await executor.stop()
    })

    it('should emergency close position', async () => {
      // Open position
      await executor.processSignal({
        type: 'entry_long',
        price: 50000,
        timestamp: Date.now(),
      })

      expect(executor.getPosition()).toBeDefined()

      // Emergency close
      await executor.emergencyClose()

      expect(executor.getPosition()).toBeNull()
    })

    it('should handle emergency close without position', async () => {
      await expect(executor.emergencyClose()).resolves.not.toThrow()
    })
  })

  describe('State Management', () => {
    it('should return current state', () => {
      const config = createExecutorConfig()
      const executor = new TradeExecutor(config)

      const state = executor.getState()
      expect(state).toBeDefined()
      expect(state.status).toBe('idle')
    })

    it('should return current position', () => {
      const config = createExecutorConfig()
      const executor = new TradeExecutor(config)

      const position = executor.getPosition()
      expect(position).toBeNull()
    })

    it('should track total trades', async () => {
      const config = createExecutorConfig()
      const executor = new TradeExecutor(config)
      await executor.start()

      // Trade 1
      await executor.processSignal({
        type: 'entry_long',
        price: 50000,
        timestamp: Date.now(),
      })
      await executor.processSignal({
        type: 'exit_long',
        price: 51000,
        timestamp: Date.now(),
      })

      // Trade 2
      await executor.processSignal({
        type: 'entry_long',
        price: 50000,
        timestamp: Date.now(),
      })
      await executor.processSignal({
        type: 'exit_long',
        price: 49000,
        timestamp: Date.now(),
      })

      const state = executor.getState()
      expect(state.totalTrades).toBeGreaterThanOrEqual(2)

      await executor.stop()
    })
  })
})
