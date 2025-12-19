/**
 * @hephaitos/core - Backtest Result Repository Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryBacktestResultRepository,
  createBacktestResultRepository,
  type IBacktestResultRepository,
} from '../repositories/backtest-result-repository.js';
import type { IBacktestResult } from '@hephaitos/types';

describe('InMemoryBacktestResultRepository', () => {
  let repository: IBacktestResultRepository;

  const createMockResult = (overrides: Partial<IBacktestResult> = {}): IBacktestResult => ({
    id: `backtest-${crypto.randomUUID()}`,
    configId: 'config-123',
    strategyId: 'strategy-123',
    status: 'completed',
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    initialCapital: 100000,
    finalCapital: 115500,
    peakCapital: 120000,
    trades: [],
    equityCurve: [],
    drawdowns: [],
    monthlyReturns: [],
    metrics: {
      totalReturn: 15.5,
      annualizedReturn: 18.2,
      monthlyReturn: 1.5,
      sharpeRatio: 1.8,
      sortinoRatio: 2.1,
      calmarRatio: 2.2,
      maxDrawdown: -8.2,
      avgDrawdown: -3.5,
      maxDrawdownDuration: 15,
      totalTrades: 42,
      winRate: 65,
      profitFactor: 1.65,
      avgWin: 2.5,
      avgLoss: -1.2,
      maxWin: 8.5,
      maxLoss: -3.2,
      maxConsecutiveWins: 7,
      maxConsecutiveLosses: 3,
      avgHoldingPeriod: 5,
      pnlStdDev: 12.5,
      avgTradeReturn: 0.35,
      expectancy: 0.45,
    },
    ...overrides,
  });

  beforeEach(() => {
    repository = createBacktestResultRepository();
  });

  describe('save', () => {
    it('should save a backtest result', async () => {
      const mockResult = createMockResult();
      const result = await repository.save(mockResult);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(mockResult.id);
      expect(result.metadata?.timestamp).toBeDefined();
    });
  });

  describe('getById', () => {
    it('should return result when found', async () => {
      const mockResult = createMockResult();
      await repository.save(mockResult);

      const result = await repository.getById(mockResult.id);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(mockResult.id);
      expect(result.data?.metrics.totalReturn).toBe(15.5);
    });

    it('should return null when not found', async () => {
      const result = await repository.getById('non-existent-id');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe('listByStrategy', () => {
    it('should return results for a strategy with pagination', async () => {
      const strategyId = 'strategy-abc';

      for (let i = 0; i < 5; i++) {
        await repository.save(createMockResult({ strategyId }));
      }
      await repository.save(createMockResult({ strategyId: 'other-strategy' }));

      const result = await repository.listByStrategy(strategyId, { page: 1, limit: 3 });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(result.pagination?.total).toBe(5);
      expect(result.pagination?.hasMore).toBe(true);
    });

    it('should return empty array when no results', async () => {
      const result = await repository.listByStrategy('no-results', { page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
      expect(result.pagination?.total).toBe(0);
    });
  });

  describe('listRecent', () => {
    it('should return recent results sorted by date', async () => {
      const result1 = createMockResult({ startedAt: '2024-01-01T00:00:00Z' });
      const result2 = createMockResult({ startedAt: '2024-06-01T00:00:00Z' });
      const result3 = createMockResult({ startedAt: '2024-12-01T00:00:00Z' });

      await repository.save(result1);
      await repository.save(result2);
      await repository.save(result3);

      const result = await repository.listRecent(2);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data![0].id).toBe(result3.id);
      expect(result.data![1].id).toBe(result2.id);
    });
  });

  describe('delete', () => {
    it('should delete existing result', async () => {
      const mockResult = createMockResult();
      await repository.save(mockResult);

      const deleteResult = await repository.delete(mockResult.id);
      const getResult = await repository.getById(mockResult.id);

      expect(deleteResult.success).toBe(true);
      expect(deleteResult.data).toBe(true);
      expect(getResult.data).toBeNull();
    });

    it('should return false when deleting non-existent result', async () => {
      const result = await repository.delete('non-existent');

      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
    });
  });

  describe('compareStrategies', () => {
    it('should compare multiple backtest results', async () => {
      const baseMetrics = createMockResult().metrics;
      const result1 = createMockResult({
        id: 'bt-1',
        metrics: { ...baseMetrics, totalReturn: 20, sharpeRatio: 2.0 },
      });
      const result2 = createMockResult({
        id: 'bt-2',
        metrics: { ...baseMetrics, totalReturn: 15, sharpeRatio: 1.5 },
      });
      const result3 = createMockResult({
        id: 'bt-3',
        metrics: { ...baseMetrics, totalReturn: 25, sharpeRatio: 1.8 },
      });

      await repository.save(result1);
      await repository.save(result2);
      await repository.save(result3);

      const result = await repository.compareStrategies(['bt-1', 'bt-2', 'bt-3']);

      expect(result.success).toBe(true);
      expect(result.data?.summaries).toHaveLength(3);
      expect(result.data?.rankings.byReturn[0]).toBe('bt-3');
      expect(result.data?.rankings.bySharpe[0]).toBe('bt-1');
    });

    it('should return error when no results found', async () => {
      const result = await repository.compareStrategies(['non-existent']);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('No backtest results found');
    });
  });

  describe('factory function', () => {
    it('should create a new repository instance', () => {
      const repo = createBacktestResultRepository();
      expect(repo).toBeInstanceOf(InMemoryBacktestResultRepository);
    });
  });
});
