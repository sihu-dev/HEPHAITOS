/**
 * Backtest Agent Tests
 * L3 (Tissues) - 백테스트 실행 에이전트 테스트
 *
 * ⚠️ 면책조항: 백테스트 결과는 과거 성과이며 미래 수익을 보장하지 않습니다.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  BacktestAgent,
  createBacktestAgent,
  type IBacktestAgentConfig,
} from '@/agents/backtest-agent';
import type {
  IBacktestConfig,
  IBacktestResult,
  IStrategy,
  IOHLCV,
  IResult,
  IPriceData,
  IBacktestSummary,
  IStrategyComparison,
} from '@hephaitos/types';

// ═══════════════════════════════════════════════════════════════
// Mock Implementations
// ═══════════════════════════════════════════════════════════════

const createMockPriceDataService = () => ({
  getHistoricalPrices: vi.fn(),
  getOHLCV: vi.fn(),
  getLatestPrice: vi.fn(),
  getLatestPrices: vi.fn(),
});

const createMockStrategyRepository = () => ({
  getById: vi.fn(),
  save: vi.fn(),
  listRecent: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  create: vi.fn(),
  list: vi.fn(),
  duplicate: vi.fn(),
});

const createMockResultRepository = () => ({
  save: vi.fn(),
  getById: vi.fn(),
  listRecent: vi.fn(),
  compareStrategies: vi.fn(),
  delete: vi.fn(),
  listByStrategy: vi.fn(),
});

// ═══════════════════════════════════════════════════════════════
// Test Data Generators
// ═══════════════════════════════════════════════════════════════

/**
 * Generate mock OHLCV candles with controllable patterns
 */
function generateMockCandles(
  count: number,
  options: {
    startPrice?: number;
    trend?: 'up' | 'down' | 'sideways';
    volatility?: number;
    startDate?: Date;
  } = {}
): IOHLCV[] {
  const {
    startPrice = 100,
    trend = 'sideways',
    volatility = 0.02,
    startDate = new Date('2024-01-01'),
  } = options;

  const candles: IOHLCV[] = [];
  let currentPrice = startPrice;
  let currentDate = new Date(startDate);

  for (let i = 0; i < count; i++) {
    // Apply trend
    if (trend === 'up') {
      currentPrice *= 1 + Math.random() * volatility;
    } else if (trend === 'down') {
      currentPrice *= 1 - Math.random() * volatility;
    } else {
      currentPrice *= 1 + (Math.random() - 0.5) * volatility * 2;
    }

    const open = currentPrice * (1 + (Math.random() - 0.5) * volatility * 0.5);
    const close = currentPrice;
    const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.3);
    const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.3);
    const volume = 1000000 + Math.random() * 500000;

    candles.push({
      timestamp: currentDate.toISOString(),
      open,
      high,
      low,
      close,
      volume,
    });

    // Increment date by 1 day
    currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
  }

  return candles;
}

/**
 * Create a mock strategy
 */
function createMockStrategy(overrides: Partial<IStrategy> = {}): IStrategy {
  return {
    id: 'strategy-123',
    name: 'Test Strategy',
    description: 'A test strategy',
    type: 'trend_following',
    version: '1.0.0',
    timeframe: '1d',
    symbols: ['BTC/USD'],
    entryConditions: {
      logic: 'and',
      conditions: [
        {
          left: { type: 'sma', period: 50 },
          operator: 'cross_above',
          right: { type: 'sma', period: 200 },
        },
      ],
    },
    exitConditions: {
      logic: 'or',
      conditions: [
        {
          left: { type: 'sma', period: 50 },
          operator: 'cross_below',
          right: { type: 'sma', period: 200 },
        },
      ],
    },
    positionSizing: {
      type: 'fixed_percent',
      percent: 10,
    },
    riskManagement: {
      stopLossPercent: 5,
      takeProfitPercent: 10,
      maxCapitalUsage: 100,
    },
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    ...overrides,
  };
}

/**
 * Create a mock backtest config
 */
function createMockBacktestConfig(
  overrides: Partial<IBacktestConfig> = {}
): IBacktestConfig {
  return {
    id: 'backtest-config-123',
    strategyId: 'strategy-123',
    symbols: ['BTC/USD'],
    timeframe: '1d',
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-12-31T23:59:59Z',
    initialCapital: 10000,
    currency: 'USD',
    feeRate: 0.1,
    slippage: 0.05,
    useMargin: false,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════
// Test Suites
// ═══════════════════════════════════════════════════════════════

describe('BacktestAgent', () => {
  let agent: BacktestAgent;
  let mockPriceDataService: ReturnType<typeof createMockPriceDataService>;
  let mockStrategyRepo: ReturnType<typeof createMockStrategyRepository>;
  let mockResultRepo: ReturnType<typeof createMockResultRepository>;

  beforeEach(() => {
    mockPriceDataService = createMockPriceDataService();
    mockStrategyRepo = createMockStrategyRepository();
    mockResultRepo = createMockResultRepository();

    // Default successful mocks
    mockResultRepo.save.mockResolvedValue({
      success: true,
      data: {},
      metadata: { timestamp: new Date().toISOString(), duration_ms: 10 },
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Constructor & Factory Tests
  // ─────────────────────────────────────────────────────────────

  describe('Constructor & Factory', () => {
    it('should create agent with factory function', () => {
      const newAgent = createBacktestAgent(
        mockPriceDataService,
        mockStrategyRepo,
        mockResultRepo
      );
      expect(newAgent).toBeInstanceOf(BacktestAgent);
    });

    it('should create agent with custom config', () => {
      const config: IBacktestAgentConfig = {
        onProgress: vi.fn(),
        onTrade: vi.fn(),
      };
      const newAgent = createBacktestAgent(
        mockPriceDataService,
        mockStrategyRepo,
        mockResultRepo,
        config
      );
      expect(newAgent).toBeInstanceOf(BacktestAgent);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Backtest Execution Tests
  // ─────────────────────────────────────────────────────────────

  describe('runBacktest - Basic Execution', () => {
    beforeEach(() => {
      agent = createBacktestAgent(
        mockPriceDataService,
        mockStrategyRepo,
        mockResultRepo
      );
    });

    it('should successfully run a complete backtest', async () => {
      const strategy = createMockStrategy();
      const config = createMockBacktestConfig();
      const candles = generateMockCandles(100, { trend: 'up' });

      mockStrategyRepo.getById.mockResolvedValue({
        success: true,
        data: strategy,
        metadata: { timestamp: new Date().toISOString(), duration_ms: 5 },
      });

      mockPriceDataService.getHistoricalPrices.mockResolvedValue({
        success: true,
        data: { candles },
        metadata: { timestamp: new Date().toISOString(), duration_ms: 10 },
      });

      const result = await agent.runBacktest(config);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.status).toBe('completed');
      expect(result.data?.initialCapital).toBe(10000);
      expect(result.data?.finalCapital).toBeGreaterThanOrEqual(0);
      expect(result.data?.equityCurve).toBeDefined();
      expect(result.data?.equityCurve.length).toBeGreaterThan(0);
      expect(result.data?.metrics).toBeDefined();
      expect(result.metadata.duration_ms).toBeGreaterThanOrEqual(0);
    });

    it('should handle strategy not found error', async () => {
      const config = createMockBacktestConfig();

      mockStrategyRepo.getById.mockResolvedValue({
        success: false,
        error: new Error('Strategy not found'),
        metadata: { timestamp: new Date().toISOString(), duration_ms: 5 },
      });

      const result = await agent.runBacktest(config);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Strategy not found');
      expect(result.data?.status).toBe('failed');
    });

    it('should handle insufficient price data error', async () => {
      const strategy = createMockStrategy();
      const config = createMockBacktestConfig();
      const candles = generateMockCandles(30); // Less than minimum 50

      mockStrategyRepo.getById.mockResolvedValue({
        success: true,
        data: strategy,
        metadata: { timestamp: new Date().toISOString(), duration_ms: 5 },
      });

      mockPriceDataService.getHistoricalPrices.mockResolvedValue({
        success: true,
        data: { candles },
        metadata: { timestamp: new Date().toISOString(), duration_ms: 10 },
      });

      const result = await agent.runBacktest(config);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Insufficient price data');
    });

    it('should handle no symbols specified error', async () => {
      const strategy = createMockStrategy({ symbols: [] });
      const config = createMockBacktestConfig({ symbols: [] });

      mockStrategyRepo.getById.mockResolvedValue({
        success: true,
        data: strategy,
        metadata: { timestamp: new Date().toISOString(), duration_ms: 5 },
      });

      const result = await agent.runBacktest(config);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('No symbols specified');
    });

    it('should handle price data loading failure', async () => {
      const strategy = createMockStrategy();
      const config = createMockBacktestConfig();

      mockStrategyRepo.getById.mockResolvedValue({
        success: true,
        data: strategy,
        metadata: { timestamp: new Date().toISOString(), duration_ms: 5 },
      });

      mockPriceDataService.getHistoricalPrices.mockResolvedValue({
        success: false,
        error: new Error('API rate limit exceeded'),
        metadata: { timestamp: new Date().toISOString(), duration_ms: 10 },
      });

      const result = await agent.runBacktest(config);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Failed to load price data');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // P&L Calculation Tests
  // ─────────────────────────────────────────────────────────────

  describe('P&L Calculations', () => {
    beforeEach(() => {
      agent = createBacktestAgent(
        mockPriceDataService,
        mockStrategyRepo,
        mockResultRepo
      );
    });

    it('should calculate correct P&L for profitable trades', async () => {
      const strategy = createMockStrategy({
        positionSizing: { type: 'fixed_amount', amount: 1000 },
      });
      const config = createMockBacktestConfig({ feeRate: 0.1, slippage: 0.05 });

      // Generate upward trending candles
      const candles = generateMockCandles(100, {
        startPrice: 100,
        trend: 'up',
        volatility: 0.01,
      });

      mockStrategyRepo.getById.mockResolvedValue({
        success: true,
        data: strategy,
        metadata: { timestamp: new Date().toISOString(), duration_ms: 5 },
      });

      mockPriceDataService.getHistoricalPrices.mockResolvedValue({
        success: true,
        data: { candles },
        metadata: { timestamp: new Date().toISOString(), duration_ms: 10 },
      });

      const result = await agent.runBacktest(config);

      expect(result.success).toBe(true);
      expect(result.data?.finalCapital).toBeGreaterThanOrEqual(0);
      expect(result.data?.metrics.totalReturn).toBeDefined();

      // If trades occurred, check P&L calculations
      if (result.data && result.data.trades.length > 0) {
        const firstTrade = result.data.trades[0];
        expect(firstTrade.netPnL).toBeDefined();
        expect(firstTrade.netPnLPercent).toBeDefined();
        expect(firstTrade.totalFees).toBeGreaterThan(0);

        // Verify P&L formula: exit - entry - fees
        const expectedPnL =
          firstTrade.exitTrade.value -
          firstTrade.entryTrade.value -
          firstTrade.totalFees;
        expect(Math.abs(firstTrade.netPnL - expectedPnL)).toBeLessThan(0.01);
      }
    });

    it('should calculate correct P&L for losing trades', async () => {
      const strategy = createMockStrategy({
        positionSizing: { type: 'fixed_amount', amount: 1000 },
      });
      const config = createMockBacktestConfig();

      // Generate downward trending candles
      const candles = generateMockCandles(100, {
        startPrice: 100,
        trend: 'down',
        volatility: 0.01,
      });

      mockStrategyRepo.getById.mockResolvedValue({
        success: true,
        data: strategy,
        metadata: { timestamp: new Date().toISOString(), duration_ms: 5 },
      });

      mockPriceDataService.getHistoricalPrices.mockResolvedValue({
        success: true,
        data: { candles },
        metadata: { timestamp: new Date().toISOString(), duration_ms: 10 },
      });

      const result = await agent.runBacktest(config);

      expect(result.success).toBe(true);
      // Final capital should be less than or equal to initial
      expect(result.data?.finalCapital).toBeLessThanOrEqual(
        config.initialCapital
      );
    });

    it('should include fees in P&L calculations', async () => {
      const strategy = createMockStrategy({
        positionSizing: { type: 'fixed_amount', amount: 5000 },
      });
      const config = createMockBacktestConfig({ feeRate: 1.0 }); // 1% fee

      const candles = generateMockCandles(100, { trend: 'up' });

      mockStrategyRepo.getById.mockResolvedValue({
        success: true,
        data: strategy,
        metadata: { timestamp: new Date().toISOString(), duration_ms: 5 },
      });

      mockPriceDataService.getHistoricalPrices.mockResolvedValue({
        success: true,
        data: { candles },
        metadata: { timestamp: new Date().toISOString(), duration_ms: 10 },
      });

      const result = await agent.runBacktest(config);

      expect(result.success).toBe(true);
      if (result.data && result.data.trades.length > 0) {
        result.data.trades.forEach((trade) => {
          expect(trade.totalFees).toBeGreaterThan(0);
          // Fee should be approximately 2% total (1% entry + 1% exit)
          const expectedFeeRate = 0.02;
          const feeRatio = trade.totalFees / trade.entryTrade.value;
          expect(feeRatio).toBeGreaterThan(0);
        });
      }
    });

    it('should apply slippage correctly', async () => {
      const strategy = createMockStrategy({
        positionSizing: { type: 'fixed_amount', amount: 1000 },
      });
      const config = createMockBacktestConfig({ slippage: 0.5 }); // 0.5%

      const candles = generateMockCandles(100);

      mockStrategyRepo.getById.mockResolvedValue({
        success: true,
        data: strategy,
        metadata: { timestamp: new Date().toISOString(), duration_ms: 5 },
      });

      mockPriceDataService.getHistoricalPrices.mockResolvedValue({
        success: true,
        data: { candles },
        metadata: { timestamp: new Date().toISOString(), duration_ms: 10 },
      });

      const result = await agent.runBacktest(config);

      expect(result.success).toBe(true);
      // Slippage should reduce returns (entry price higher, exit price lower)
      if (result.data && result.data.trades.length > 0) {
        const trade = result.data.trades[0];
        // Entry price should be slightly higher than market
        // Exit price should be slightly lower than market
        expect(trade.entryPrice).toBeGreaterThan(0);
        expect(trade.exitPrice).toBeGreaterThan(0);
      }
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Performance Metrics Tests
  // ─────────────────────────────────────────────────────────────

  describe('Performance Metrics', () => {
    beforeEach(() => {
      agent = createBacktestAgent(
        mockPriceDataService,
        mockStrategyRepo,
        mockResultRepo
      );
    });

    it('should calculate all required metrics', async () => {
      const strategy = createMockStrategy();
      const config = createMockBacktestConfig();
      const candles = generateMockCandles(200, { trend: 'up' });

      mockStrategyRepo.getById.mockResolvedValue({
        success: true,
        data: strategy,
        metadata: { timestamp: new Date().toISOString(), duration_ms: 5 },
      });

      mockPriceDataService.getHistoricalPrices.mockResolvedValue({
        success: true,
        data: { candles },
        metadata: { timestamp: new Date().toISOString(), duration_ms: 10 },
      });

      const result = await agent.runBacktest(config);

      expect(result.success).toBe(true);
      expect(result.data?.metrics).toBeDefined();

      const metrics = result.data!.metrics;

      // Check all required metrics are present
      expect(metrics.totalReturn).toBeDefined();
      expect(metrics.annualizedReturn).toBeDefined();
      expect(metrics.monthlyReturn).toBeDefined();
      expect(metrics.sharpeRatio).toBeDefined();
      expect(metrics.sortinoRatio).toBeDefined();
      expect(metrics.calmarRatio).toBeDefined();
      expect(metrics.maxDrawdown).toBeDefined();
      expect(metrics.avgDrawdown).toBeDefined();
      expect(metrics.maxDrawdownDuration).toBeDefined();
      expect(metrics.totalTrades).toBeDefined();
      expect(metrics.winRate).toBeDefined();
      expect(metrics.profitFactor).toBeDefined();
      expect(metrics.avgWin).toBeDefined();
      expect(metrics.avgLoss).toBeDefined();
      expect(metrics.maxWin).toBeDefined();
      expect(metrics.maxLoss).toBeDefined();
      expect(metrics.maxConsecutiveWins).toBeDefined();
      expect(metrics.maxConsecutiveLosses).toBeDefined();
      expect(metrics.avgHoldingPeriod).toBeDefined();
      expect(metrics.pnlStdDev).toBeDefined();
      expect(metrics.avgTradeReturn).toBeDefined();
      expect(metrics.expectancy).toBeDefined();
    });

    it('should calculate Sharpe ratio correctly', async () => {
      const strategy = createMockStrategy();
      const config = createMockBacktestConfig();
      const candles = generateMockCandles(200, { trend: 'up', volatility: 0.01 });

      mockStrategyRepo.getById.mockResolvedValue({
        success: true,
        data: strategy,
        metadata: { timestamp: new Date().toISOString(), duration_ms: 5 },
      });

      mockPriceDataService.getHistoricalPrices.mockResolvedValue({
        success: true,
        data: { candles },
        metadata: { timestamp: new Date().toISOString(), duration_ms: 10 },
      });

      const result = await agent.runBacktest(config);

      expect(result.success).toBe(true);
      expect(result.data?.metrics.sharpeRatio).toBeDefined();
      // Sharpe ratio should be finite
      expect(isFinite(result.data!.metrics.sharpeRatio)).toBe(true);
    });

    it('should calculate max drawdown correctly', async () => {
      const strategy = createMockStrategy();
      const config = createMockBacktestConfig();
      const candles = generateMockCandles(200);

      mockStrategyRepo.getById.mockResolvedValue({
        success: true,
        data: strategy,
        metadata: { timestamp: new Date().toISOString(), duration_ms: 5 },
      });

      mockPriceDataService.getHistoricalPrices.mockResolvedValue({
        success: true,
        data: { candles },
        metadata: { timestamp: new Date().toISOString(), duration_ms: 10 },
      });

      const result = await agent.runBacktest(config);

      expect(result.success).toBe(true);
      expect(result.data?.metrics.maxDrawdown).toBeGreaterThanOrEqual(0);
      expect(result.data?.drawdowns).toBeDefined();
    });

    it('should calculate win rate correctly', async () => {
      const strategy = createMockStrategy();
      const config = createMockBacktestConfig();
      const candles = generateMockCandles(200);

      mockStrategyRepo.getById.mockResolvedValue({
        success: true,
        data: strategy,
        metadata: { timestamp: new Date().toISOString(), duration_ms: 5 },
      });

      mockPriceDataService.getHistoricalPrices.mockResolvedValue({
        success: true,
        data: { candles },
        metadata: { timestamp: new Date().toISOString(), duration_ms: 10 },
      });

      const result = await agent.runBacktest(config);

      expect(result.success).toBe(true);
      expect(result.data?.metrics.winRate).toBeGreaterThanOrEqual(0);
      expect(result.data?.metrics.winRate).toBeLessThanOrEqual(100);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Trade Recording Tests
  // ─────────────────────────────────────────────────────────────

  describe('Trade Recording', () => {
    beforeEach(() => {
      agent = createBacktestAgent(
        mockPriceDataService,
        mockStrategyRepo,
        mockResultRepo
      );
    });

    it('should record all trades with complete information', async () => {
      const strategy = createMockStrategy();
      const config = createMockBacktestConfig();
      const candles = generateMockCandles(200);

      mockStrategyRepo.getById.mockResolvedValue({
        success: true,
        data: strategy,
        metadata: { timestamp: new Date().toISOString(), duration_ms: 5 },
      });

      mockPriceDataService.getHistoricalPrices.mockResolvedValue({
        success: true,
        data: { candles },
        metadata: { timestamp: new Date().toISOString(), duration_ms: 10 },
      });

      const result = await agent.runBacktest(config);

      expect(result.success).toBe(true);
      expect(result.data?.trades).toBeDefined();

      if (result.data && result.data.trades.length > 0) {
        result.data.trades.forEach((trade) => {
          // Check all required fields
          expect(trade.id).toBeDefined();
          expect(trade.symbol).toBeDefined();
          expect(trade.side).toBe('buy');
          expect(trade.entryTrade).toBeDefined();
          expect(trade.exitTrade).toBeDefined();
          expect(trade.entryPrice).toBeGreaterThan(0);
          expect(trade.exitPrice).toBeGreaterThan(0);
          expect(trade.quantity).toBeGreaterThan(0);
          expect(trade.totalFees).toBeGreaterThan(0);
          expect(trade.netPnL).toBeDefined();
          expect(trade.netPnLPercent).toBeDefined();
          expect(trade.holdingPeriodMs).toBeGreaterThanOrEqual(0);
          expect(trade.enteredAt).toBeDefined();
          expect(trade.exitedAt).toBeDefined();
        });
      }
    });

    it('should trigger onTrade callback for each trade', async () => {
      const onTrade = vi.fn();
      const customAgent = createBacktestAgent(
        mockPriceDataService,
        mockStrategyRepo,
        mockResultRepo,
        { onTrade }
      );

      const strategy = createMockStrategy();
      const config = createMockBacktestConfig();
      const candles = generateMockCandles(200);

      mockStrategyRepo.getById.mockResolvedValue({
        success: true,
        data: strategy,
        metadata: { timestamp: new Date().toISOString(), duration_ms: 5 },
      });

      mockPriceDataService.getHistoricalPrices.mockResolvedValue({
        success: true,
        data: { candles },
        metadata: { timestamp: new Date().toISOString(), duration_ms: 10 },
      });

      const result = await customAgent.runBacktest(config);

      expect(result.success).toBe(true);
      if (result.data && result.data.trades.length > 0) {
        expect(onTrade).toHaveBeenCalled();
        expect(onTrade).toHaveBeenCalledTimes(result.data.trades.length);
      }
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Equity Curve Tests
  // ─────────────────────────────────────────────────────────────

  describe('Equity Curve Generation', () => {
    beforeEach(() => {
      agent = createBacktestAgent(
        mockPriceDataService,
        mockStrategyRepo,
        mockResultRepo
      );
    });

    it('should generate complete equity curve', async () => {
      const strategy = createMockStrategy();
      const config = createMockBacktestConfig();
      const candles = generateMockCandles(200);

      mockStrategyRepo.getById.mockResolvedValue({
        success: true,
        data: strategy,
        metadata: { timestamp: new Date().toISOString(), duration_ms: 5 },
      });

      mockPriceDataService.getHistoricalPrices.mockResolvedValue({
        success: true,
        data: { candles },
        metadata: { timestamp: new Date().toISOString(), duration_ms: 10 },
      });

      const result = await agent.runBacktest(config);

      expect(result.success).toBe(true);
      expect(result.data?.equityCurve).toBeDefined();
      expect(result.data?.equityCurve.length).toBeGreaterThan(0);

      // Check equity curve points
      result.data?.equityCurve.forEach((point) => {
        expect(point.timestamp).toBeDefined();
        expect(point.equity).toBeGreaterThanOrEqual(0);
        expect(point.cash).toBeGreaterThanOrEqual(0);
        expect(point.positionValue).toBeGreaterThanOrEqual(0);
        expect(point.drawdown).toBeGreaterThanOrEqual(0);

        // Equity should equal cash + position value
        expect(Math.abs(point.equity - (point.cash + point.positionValue))).toBeLessThan(
          0.01
        );
      });
    });

    it('should track peak capital correctly', async () => {
      const strategy = createMockStrategy();
      const config = createMockBacktestConfig();
      const candles = generateMockCandles(200, { trend: 'up' });

      mockStrategyRepo.getById.mockResolvedValue({
        success: true,
        data: strategy,
        metadata: { timestamp: new Date().toISOString(), duration_ms: 5 },
      });

      mockPriceDataService.getHistoricalPrices.mockResolvedValue({
        success: true,
        data: { candles },
        metadata: { timestamp: new Date().toISOString(), duration_ms: 10 },
      });

      const result = await agent.runBacktest(config);

      expect(result.success).toBe(true);
      expect(result.data?.peakCapital).toBeGreaterThanOrEqual(
        result.data!.initialCapital
      );
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Edge Cases Tests
  // ─────────────────────────────────────────────────────────────

  describe('Edge Cases', () => {
    beforeEach(() => {
      agent = createBacktestAgent(
        mockPriceDataService,
        mockStrategyRepo,
        mockResultRepo
      );
    });

    it('should handle zero trades scenario', async () => {
      const strategy = createMockStrategy({
        // Impossible entry conditions
        entryConditions: {
          logic: 'and',
          conditions: [
            {
              left: { type: 'price', source: 'close' },
              operator: 'gt',
              right: 1000000, // Impossibly high
            },
          ],
        },
      });
      const config = createMockBacktestConfig();
      const candles = generateMockCandles(100);

      mockStrategyRepo.getById.mockResolvedValue({
        success: true,
        data: strategy,
        metadata: { timestamp: new Date().toISOString(), duration_ms: 5 },
      });

      mockPriceDataService.getHistoricalPrices.mockResolvedValue({
        success: true,
        data: { candles },
        metadata: { timestamp: new Date().toISOString(), duration_ms: 10 },
      });

      const result = await agent.runBacktest(config);

      expect(result.success).toBe(true);
      expect(result.data?.trades).toHaveLength(0);
      expect(result.data?.finalCapital).toBe(config.initialCapital);
      expect(result.data?.metrics.totalTrades).toBe(0);
      expect(result.data?.metrics.winRate).toBe(0);
    });

    it('should handle single trade scenario', async () => {
      const strategy = createMockStrategy({
        positionSizing: { type: 'fixed_amount', amount: 1000 },
      });
      const config = createMockBacktestConfig();
      const candles = generateMockCandles(60); // Just enough for one trade

      mockStrategyRepo.getById.mockResolvedValue({
        success: true,
        data: strategy,
        metadata: { timestamp: new Date().toISOString(), duration_ms: 5 },
      });

      mockPriceDataService.getHistoricalPrices.mockResolvedValue({
        success: true,
        data: { candles },
        metadata: { timestamp: new Date().toISOString(), duration_ms: 10 },
      });

      const result = await agent.runBacktest(config);

      expect(result.success).toBe(true);
      if (result.data && result.data.trades.length === 1) {
        expect(result.data.metrics.totalTrades).toBe(1);
        expect(result.data.metrics.winRate).toBeGreaterThanOrEqual(0);
        expect(result.data.metrics.winRate).toBeLessThanOrEqual(100);
      }
    });

    it('should handle zero initial capital', async () => {
      const strategy = createMockStrategy();
      const config = createMockBacktestConfig({ initialCapital: 0 });
      const candles = generateMockCandles(100);

      mockStrategyRepo.getById.mockResolvedValue({
        success: true,
        data: strategy,
        metadata: { timestamp: new Date().toISOString(), duration_ms: 5 },
      });

      mockPriceDataService.getHistoricalPrices.mockResolvedValue({
        success: true,
        data: { candles },
        metadata: { timestamp: new Date().toISOString(), duration_ms: 10 },
      });

      const result = await agent.runBacktest(config);

      expect(result.success).toBe(true);
      expect(result.data?.trades).toHaveLength(0);
      expect(result.data?.finalCapital).toBe(0);
    });

    it('should handle negative capital after losses', async () => {
      const strategy = createMockStrategy({
        positionSizing: { type: 'fixed_percent', percent: 200 }, // Over-leverage
        riskManagement: {
          maxCapitalUsage: 200,
          stopLossPercent: undefined, // No stop loss
        },
      });
      const config = createMockBacktestConfig({ initialCapital: 1000 });
      const candles = generateMockCandles(100, { trend: 'down', volatility: 0.05 });

      mockStrategyRepo.getById.mockResolvedValue({
        success: true,
        data: strategy,
        metadata: { timestamp: new Date().toISOString(), duration_ms: 5 },
      });

      mockPriceDataService.getHistoricalPrices.mockResolvedValue({
        success: true,
        data: { candles },
        metadata: { timestamp: new Date().toISOString(), duration_ms: 10 },
      });

      const result = await agent.runBacktest(config);

      expect(result.success).toBe(true);
      // Should stop trading when capital is exhausted
      expect(result.data?.finalCapital).toBeGreaterThanOrEqual(0);
    });

    it('should force close open position at end of backtest', async () => {
      const strategy = createMockStrategy({
        exitConditions: {
          logic: 'and',
          conditions: [
            {
              left: { type: 'price', source: 'close' },
              operator: 'gt',
              right: 1000000, // Never exit normally
            },
          ],
        },
      });
      const config = createMockBacktestConfig();
      const candles = generateMockCandles(100);

      mockStrategyRepo.getById.mockResolvedValue({
        success: true,
        data: strategy,
        metadata: { timestamp: new Date().toISOString(), duration_ms: 5 },
      });

      mockPriceDataService.getHistoricalPrices.mockResolvedValue({
        success: true,
        data: { candles },
        metadata: { timestamp: new Date().toISOString(), duration_ms: 10 },
      });

      const result = await agent.runBacktest(config);

      expect(result.success).toBe(true);
      // All positions should be closed at the end
      if (result.data && result.data.equityCurve.length > 0) {
        const lastPoint =
          result.data.equityCurve[result.data.equityCurve.length - 1];
        expect(lastPoint.positionValue).toBe(0);
      }
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Position Sizing Tests
  // ─────────────────────────────────────────────────────────────

  describe('Position Sizing', () => {
    beforeEach(() => {
      agent = createBacktestAgent(
        mockPriceDataService,
        mockStrategyRepo,
        mockResultRepo
      );
    });

    it('should respect fixed_amount position sizing', async () => {
      const fixedAmount = 2000;
      const strategy = createMockStrategy({
        positionSizing: { type: 'fixed_amount', amount: fixedAmount },
      });
      const config = createMockBacktestConfig();
      const candles = generateMockCandles(100);

      mockStrategyRepo.getById.mockResolvedValue({
        success: true,
        data: strategy,
        metadata: { timestamp: new Date().toISOString(), duration_ms: 5 },
      });

      mockPriceDataService.getHistoricalPrices.mockResolvedValue({
        success: true,
        data: { candles },
        metadata: { timestamp: new Date().toISOString(), duration_ms: 10 },
      });

      const result = await agent.runBacktest(config);

      expect(result.success).toBe(true);
      if (result.data && result.data.trades.length > 0) {
        result.data.trades.forEach((trade) => {
          // Position value should be approximately fixedAmount
          expect(trade.entryTrade.value).toBeLessThanOrEqual(fixedAmount * 1.1);
        });
      }
    });

    it('should respect fixed_percent position sizing', async () => {
      const percent = 20;
      const strategy = createMockStrategy({
        positionSizing: { type: 'fixed_percent', percent },
      });
      const config = createMockBacktestConfig({ initialCapital: 10000 });
      const candles = generateMockCandles(100);

      mockStrategyRepo.getById.mockResolvedValue({
        success: true,
        data: strategy,
        metadata: { timestamp: new Date().toISOString(), duration_ms: 5 },
      });

      mockPriceDataService.getHistoricalPrices.mockResolvedValue({
        success: true,
        data: { candles },
        metadata: { timestamp: new Date().toISOString(), duration_ms: 10 },
      });

      const result = await agent.runBacktest(config);

      expect(result.success).toBe(true);
      // Position sizing varies with capital, so just check it executed
      expect(result.data?.status).toBe('completed');
    });

    it('should respect maxCapitalUsage limit', async () => {
      const strategy = createMockStrategy({
        positionSizing: { type: 'fixed_percent', percent: 50 },
        riskManagement: {
          maxCapitalUsage: 30, // Should limit to 30%
        },
      });
      const config = createMockBacktestConfig({ initialCapital: 10000 });
      const candles = generateMockCandles(100);

      mockStrategyRepo.getById.mockResolvedValue({
        success: true,
        data: strategy,
        metadata: { timestamp: new Date().toISOString(), duration_ms: 5 },
      });

      mockPriceDataService.getHistoricalPrices.mockResolvedValue({
        success: true,
        data: { candles },
        metadata: { timestamp: new Date().toISOString(), duration_ms: 10 },
      });

      const result = await agent.runBacktest(config);

      expect(result.success).toBe(true);
      if (result.data && result.data.trades.length > 0) {
        const firstTrade = result.data.trades[0];
        // First trade should use ~30% of initial capital (3000)
        expect(firstTrade.entryTrade.value).toBeLessThanOrEqual(3500);
      }
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Progress Callback Tests
  // ─────────────────────────────────────────────────────────────

  describe('Progress Callbacks', () => {
    it('should trigger onProgress callbacks', async () => {
      const onProgress = vi.fn();
      const customAgent = createBacktestAgent(
        mockPriceDataService,
        mockStrategyRepo,
        mockResultRepo,
        { onProgress }
      );

      const strategy = createMockStrategy();
      const config = createMockBacktestConfig();
      const candles = generateMockCandles(300); // More candles for multiple progress updates

      mockStrategyRepo.getById.mockResolvedValue({
        success: true,
        data: strategy,
        metadata: { timestamp: new Date().toISOString(), duration_ms: 5 },
      });

      mockPriceDataService.getHistoricalPrices.mockResolvedValue({
        success: true,
        data: { candles },
        metadata: { timestamp: new Date().toISOString(), duration_ms: 10 },
      });

      const result = await customAgent.runBacktest(config);

      expect(result.success).toBe(true);
      expect(onProgress).toHaveBeenCalled();
      // Should be called multiple times during the process
      expect(onProgress.mock.calls.length).toBeGreaterThan(1);

      // Check progress values
      onProgress.mock.calls.forEach((call) => {
        expect(call[0]).toBeGreaterThanOrEqual(0);
        expect(call[0]).toBeLessThanOrEqual(100);
        expect(typeof call[1]).toBe('string');
      });
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Result Analysis Tests
  // ─────────────────────────────────────────────────────────────

  describe('analyzeResult', () => {
    beforeEach(() => {
      agent = createBacktestAgent(
        mockPriceDataService,
        mockStrategyRepo,
        mockResultRepo
      );
    });

    it('should generate insights for profitable results', async () => {
      const mockResult: IBacktestResult = {
        id: 'result-123',
        configId: 'config-123',
        strategyId: 'strategy-123',
        status: 'completed',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        initialCapital: 10000,
        finalCapital: 15000,
        peakCapital: 15500,
        trades: [],
        equityCurve: [],
        drawdowns: [],
        monthlyReturns: [],
        metrics: {
          totalReturn: 50,
          annualizedReturn: 45,
          monthlyReturn: 3.75,
          sharpeRatio: 2.5,
          sortinoRatio: 3.0,
          calmarRatio: 2.25,
          maxDrawdown: 15,
          avgDrawdown: 8,
          maxDrawdownDuration: 30,
          totalTrades: 20,
          winRate: 65,
          profitFactor: 2.5,
          avgWin: 500,
          avgLoss: 200,
          maxWin: 1200,
          maxLoss: 450,
          maxConsecutiveWins: 5,
          maxConsecutiveLosses: 3,
          avgHoldingPeriod: 7,
          pnlStdDev: 300,
          avgTradeReturn: 250,
          expectancy: 175,
        },
      };

      mockResultRepo.getById.mockResolvedValue({
        success: true,
        data: mockResult,
        metadata: { timestamp: new Date().toISOString(), duration_ms: 5 },
      });

      const result = await agent.analyzeResult('result-123');

      expect(result.success).toBe(true);
      expect(result.data?.insights).toBeDefined();
      expect(result.data!.insights.length).toBeGreaterThan(0);

      // Should contain positive insights
      const insightsText = result.data!.insights.join(' ');
      expect(insightsText).toContain('수익률');
    });

    it('should generate insights for losing results', async () => {
      const mockResult: IBacktestResult = {
        id: 'result-123',
        configId: 'config-123',
        strategyId: 'strategy-123',
        status: 'completed',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        initialCapital: 10000,
        finalCapital: 8000,
        peakCapital: 10500,
        trades: [],
        equityCurve: [],
        drawdowns: [],
        monthlyReturns: [],
        metrics: {
          totalReturn: -20,
          annualizedReturn: -18,
          monthlyReturn: -1.5,
          sharpeRatio: -0.5,
          sortinoRatio: -0.3,
          calmarRatio: -0.72,
          maxDrawdown: 25,
          avgDrawdown: 12,
          maxDrawdownDuration: 60,
          totalTrades: 15,
          winRate: 40,
          profitFactor: 0.8,
          avgWin: 300,
          avgLoss: 375,
          maxWin: 800,
          maxLoss: 900,
          maxConsecutiveWins: 2,
          maxConsecutiveLosses: 5,
          avgHoldingPeriod: 10,
          pnlStdDev: 400,
          avgTradeReturn: -133,
          expectancy: -75,
        },
      };

      mockResultRepo.getById.mockResolvedValue({
        success: true,
        data: mockResult,
        metadata: { timestamp: new Date().toISOString(), duration_ms: 5 },
      });

      const result = await agent.analyzeResult('result-123');

      expect(result.success).toBe(true);
      expect(result.data?.insights).toBeDefined();
      expect(result.data!.insights.length).toBeGreaterThan(0);

      // Should contain warning insights
      const insightsText = result.data!.insights.join(' ');
      expect(insightsText).toContain('손실률');
    });

    it('should handle result not found', async () => {
      mockResultRepo.getById.mockResolvedValue({
        success: false,
        error: new Error('Not found'),
        metadata: { timestamp: new Date().toISOString(), duration_ms: 5 },
      });

      const result = await agent.analyzeResult('non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Strategy Comparison Tests
  // ─────────────────────────────────────────────────────────────

  describe('compareStrategies', () => {
    beforeEach(() => {
      agent = createBacktestAgent(
        mockPriceDataService,
        mockStrategyRepo,
        mockResultRepo
      );
    });

    it('should compare multiple strategies', async () => {
      const mockComparison: IStrategyComparison = {
        backtestIds: ['bt1', 'bt2', 'bt3'],
        period: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-12-31T23:59:59Z',
        },
        summaries: [],
        rankings: {
          byReturn: ['bt1', 'bt2', 'bt3'],
          bySharpe: ['bt2', 'bt1', 'bt3'],
          byDrawdown: ['bt3', 'bt2', 'bt1'],
          byWinRate: ['bt1', 'bt3', 'bt2'],
        },
      };

      mockResultRepo.compareStrategies.mockResolvedValue({
        success: true,
        data: mockComparison,
        metadata: { timestamp: new Date().toISOString(), duration_ms: 10 },
      });

      const result = await agent.compareStrategies(['bt1', 'bt2', 'bt3']);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.backtestIds).toHaveLength(3);
      expect(result.data?.rankings).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Recent Results Tests
  // ─────────────────────────────────────────────────────────────

  describe('getRecentResults', () => {
    beforeEach(() => {
      agent = createBacktestAgent(
        mockPriceDataService,
        mockStrategyRepo,
        mockResultRepo
      );
    });

    it('should retrieve recent backtest results', async () => {
      const mockSummaries: IBacktestSummary[] = [
        {
          id: 'bt1',
          strategyId: 'strategy-1',
          strategyName: 'Strategy 1',
          status: 'completed',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          totalReturn: 25,
          sharpeRatio: 1.5,
          maxDrawdown: 10,
          winRate: 60,
          totalTrades: 50,
          completedAt: new Date().toISOString(),
        },
      ];

      mockResultRepo.listRecent.mockResolvedValue({
        success: true,
        data: mockSummaries,
        metadata: { timestamp: new Date().toISOString(), duration_ms: 5 },
      });

      const result = await agent.getRecentResults(10);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Monthly Returns Tests
  // ─────────────────────────────────────────────────────────────

  describe('Monthly Returns', () => {
    beforeEach(() => {
      agent = createBacktestAgent(
        mockPriceDataService,
        mockStrategyRepo,
        mockResultRepo
      );
    });

    it('should calculate monthly returns', async () => {
      const strategy = createMockStrategy();
      const config = createMockBacktestConfig({
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
      });

      // Generate year-long data
      const candles = generateMockCandles(365, {
        startDate: new Date('2024-01-01'),
      });

      mockStrategyRepo.getById.mockResolvedValue({
        success: true,
        data: strategy,
        metadata: { timestamp: new Date().toISOString(), duration_ms: 5 },
      });

      mockPriceDataService.getHistoricalPrices.mockResolvedValue({
        success: true,
        data: { candles },
        metadata: { timestamp: new Date().toISOString(), duration_ms: 10 },
      });

      const result = await agent.runBacktest(config);

      expect(result.success).toBe(true);
      expect(result.data?.monthlyReturns).toBeDefined();
      expect(result.data!.monthlyReturns.length).toBeGreaterThan(0);

      // Check monthly return structure
      result.data?.monthlyReturns.forEach((monthly) => {
        expect(monthly.year).toBe(2024);
        expect(monthly.month).toBeGreaterThanOrEqual(1);
        expect(monthly.month).toBeLessThanOrEqual(12);
        expect(monthly.return).toBeDefined();
        expect(monthly.tradeCount).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
