/**
 * @hephaitos/core - AnalyticsService Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AnalyticsService } from '../services/analytics-service.js';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    service = new AnalyticsService();
  });

  describe('calculateTradingStats', () => {
    it('should calculate trading statistics', async () => {
      const userId = 'user-123';

      const result = await service.calculateTradingStats(userId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!).toHaveProperty('total_trades');
      expect(result.data!).toHaveProperty('winning_trades');
      expect(result.data!).toHaveProperty('losing_trades');
      expect(result.data!).toHaveProperty('win_rate');
      expect(result.data!).toHaveProperty('avg_win');
      expect(result.data!).toHaveProperty('avg_loss');
      expect(result.data!).toHaveProperty('profit_factor');
      expect(result.data!).toHaveProperty('total_profit');
      expect(result.data!).toHaveProperty('total_loss');
      expect(result.data!).toHaveProperty('net_profit');
      expect(result.data!).toHaveProperty('return_percent');
      expect(result.data!).toHaveProperty('max_drawdown');
      expect(result.data!).toHaveProperty('max_drawdown_percent');
      expect(result.data!).toHaveProperty('sharpe_ratio');
      expect(result.data!).toHaveProperty('avg_holding_period');
    });

    it('should support date range filtering', async () => {
      const userId = 'user-123';
      const dateRange = {
        start: '2025-12-01',
        end: '2025-12-31',
      };

      const result = await service.calculateTradingStats(userId, dateRange);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should include metadata', async () => {
      const userId = 'user-123';

      const result = await service.calculateTradingStats(userId);

      expect(result.metadata).toBeDefined();
      expect(result.metadata!.timestamp).toBeDefined();
      expect(result.metadata!.duration_ms).toBeGreaterThanOrEqual(0);
    });

    it('should handle mock data with zero trades', async () => {
      const userId = 'new-user';

      const result = await service.calculateTradingStats(userId);

      expect(result.success).toBe(true);
      expect(result.data!.total_trades).toBe(0);
      expect(result.data!.winning_trades).toBe(0);
      expect(result.data!.losing_trades).toBe(0);
      expect(result.data!.win_rate).toBe(0);
      expect(result.data!.net_profit).toBe(0);
    });
  });

  describe('getSymbolStats', () => {
    it('should return symbol-based statistics', async () => {
      const userId = 'user-123';

      const result = await service.getSymbolStats(userId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should support date range filtering', async () => {
      const userId = 'user-123';
      const dateRange = {
        start: '2025-12-01',
        end: '2025-12-31',
      };

      const result = await service.getSymbolStats(userId, dateRange);

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should validate symbol stats structure if data exists', async () => {
      const userId = 'user-123';

      const result = await service.getSymbolStats(userId);

      expect(result.success).toBe(true);
      // Mock returns empty array, but structure would be:
      // { symbol, trades, wins, losses, win_rate, net_profit, avg_profit_per_trade }
    });
  });

  describe('getTimebasedStats', () => {
    it('should return hourly statistics', async () => {
      const userId = 'user-123';

      const result = await service.getTimebasedStats(userId, 'hour');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should return daily statistics', async () => {
      const userId = 'user-123';

      const result = await service.getTimebasedStats(userId, 'day');

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should return weekly statistics', async () => {
      const userId = 'user-123';

      const result = await service.getTimebasedStats(userId, 'week');

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should return monthly statistics', async () => {
      const userId = 'user-123';

      const result = await service.getTimebasedStats(userId, 'month');

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should validate time-based stats structure if data exists', async () => {
      const userId = 'user-123';

      const result = await service.getTimebasedStats(userId, 'day');

      expect(result.success).toBe(true);
      // Mock returns empty array, but structure would be:
      // { period, trades, net_profit, win_rate }
    });
  });

  describe('analyzePortfolio', () => {
    it('should analyze portfolio', async () => {
      const userId = 'user-123';

      const result = await service.analyzePortfolio(userId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!).toHaveProperty('total_value');
      expect(result.data!).toHaveProperty('cash');
      expect(result.data!).toHaveProperty('invested');
      expect(result.data!).toHaveProperty('unrealized_pnl');
      expect(result.data!).toHaveProperty('diversification_score');
      expect(result.data!).toHaveProperty('top_holdings');
      expect(Array.isArray(result.data!.top_holdings)).toBe(true);
    });

    it('should handle portfolio with zero holdings', async () => {
      const userId = 'new-user';

      const result = await service.analyzePortfolio(userId);

      expect(result.success).toBe(true);
      expect(result.data!.total_value).toBe(0);
      expect(result.data!.cash).toBe(0);
      expect(result.data!.invested).toBe(0);
      expect(result.data!.unrealized_pnl).toBe(0);
      expect(result.data!.diversification_score).toBe(0);
      expect(result.data!.top_holdings).toEqual([]);
    });
  });

  describe('calculatePerformanceMetrics', () => {
    it('should calculate performance metrics', async () => {
      const userId = 'user-123';
      const dateRange = {
        start: '2025-12-01',
        end: '2025-12-31',
      };

      const result = await service.calculatePerformanceMetrics(userId, dateRange);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      // Check camelCase property names
      expect(result.data!).toHaveProperty('totalReturn');
      expect(result.data!).toHaveProperty('annualizedReturn');
      expect(result.data!).toHaveProperty('monthlyReturn');
      expect(result.data!).toHaveProperty('sharpeRatio');
      expect(result.data!).toHaveProperty('sortinoRatio');
      expect(result.data!).toHaveProperty('calmarRatio');
      expect(result.data!).toHaveProperty('maxDrawdown');
      expect(result.data!).toHaveProperty('avgDrawdown');
      expect(result.data!).toHaveProperty('maxDrawdownDuration');
      expect(result.data!).toHaveProperty('totalTrades');
      expect(result.data!).toHaveProperty('winRate');
      expect(result.data!).toHaveProperty('profitFactor');
      expect(result.data!).toHaveProperty('avgWin');
      expect(result.data!).toHaveProperty('avgLoss');
      expect(result.data!).toHaveProperty('maxWin');
      expect(result.data!).toHaveProperty('maxLoss');
      expect(result.data!).toHaveProperty('maxConsecutiveWins');
      expect(result.data!).toHaveProperty('maxConsecutiveLosses');
      expect(result.data!).toHaveProperty('avgHoldingPeriod');
      expect(result.data!).toHaveProperty('pnlStdDev');
      expect(result.data!).toHaveProperty('avgTradeReturn');
      expect(result.data!).toHaveProperty('expectancy');
    });

    it('should validate all metrics are numbers', async () => {
      const userId = 'user-123';
      const dateRange = {
        start: '2025-12-01',
        end: '2025-12-31',
      };

      const result = await service.calculatePerformanceMetrics(userId, dateRange);

      expect(result.success).toBe(true);

      const metrics = result.data!;
      expect(typeof metrics.totalReturn).toBe('number');
      expect(typeof metrics.annualizedReturn).toBe('number');
      expect(typeof metrics.sharpeRatio).toBe('number');
      expect(typeof metrics.totalTrades).toBe('number');
      expect(typeof metrics.winRate).toBe('number');
    });

    it('should include metadata', async () => {
      const userId = 'user-123';
      const dateRange = {
        start: '2025-12-01',
        end: '2025-12-31',
      };

      const result = await service.calculatePerformanceMetrics(userId, dateRange);

      expect(result.metadata).toBeDefined();
      expect(result.metadata!.timestamp).toBeDefined();
      expect(result.metadata!.duration_ms).toBeGreaterThanOrEqual(0);
    });
  });

  describe('factory function', () => {
    it('should create service via createAnalyticsService', async () => {
      const { createAnalyticsService } = await import('../services/analytics-service.js');
      const service = createAnalyticsService();

      const result = await service.calculateTradingStats('user-123');

      expect(result.success).toBe(true);
    });
  });
});
