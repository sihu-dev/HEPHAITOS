/**
 * @hephaitos/core - ReportGenerationService Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ReportGenerationService, type IGenerateReportInput } from '../services/report-generation-service.js';
import type { IBacktestResult } from '@hephaitos/types';

describe('ReportGenerationService', () => {
  let service: ReportGenerationService;

  beforeEach(() => {
    service = new ReportGenerationService();
  });

  describe('generate', () => {
    it('should generate daily report', async () => {
      const input: IGenerateReportInput = {
        user_id: 'user-123',
        type: 'daily',
        format: 'json',
        start_date: '2025-12-23',
        end_date: '2025-12-23',
      };

      const result = await service.generate(input);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.id).toBeDefined();
      expect(result.data!.user_id).toBe(input.user_id);
      expect(result.data!.type).toBe('daily');
      expect(result.data!.format).toBe('json');
      expect(result.data!.generated_at).toBeDefined();
    });

    it('should generate weekly report', async () => {
      const input: IGenerateReportInput = {
        user_id: 'user-123',
        type: 'weekly',
        format: 'html',
        start_date: '2025-12-16',
        end_date: '2025-12-23',
      };

      const result = await service.generate(input);

      expect(result.success).toBe(true);
      expect(result.data!.type).toBe('weekly');
      expect(result.data!.format).toBe('html');
    });

    it('should generate monthly report', async () => {
      const input: IGenerateReportInput = {
        user_id: 'user-123',
        type: 'monthly',
        format: 'pdf',
        start_date: '2025-12-01',
        end_date: '2025-12-31',
      };

      const result = await service.generate(input);

      expect(result.success).toBe(true);
      expect(result.data!.type).toBe('monthly');
      expect(result.data!.format).toBe('pdf');
    });

    it('should support different formats', async () => {
      const formats: Array<'json' | 'html' | 'pdf' | 'markdown'> = ['json', 'html', 'pdf', 'markdown'];

      for (const format of formats) {
        const input: IGenerateReportInput = {
          user_id: 'user-123',
          type: 'daily',
          format,
          start_date: '2025-12-23',
          end_date: '2025-12-23',
        };

        const result = await service.generate(input);

        expect(result.success).toBe(true);
        expect(result.data!.format).toBe(format);
      }
    });

    it('should default to json format if not specified', async () => {
      const input: IGenerateReportInput = {
        user_id: 'user-123',
        type: 'daily',
        start_date: '2025-12-23',
        end_date: '2025-12-23',
      };

      const result = await service.generate(input);

      expect(result.success).toBe(true);
      expect(result.data!.format).toBe('json');
    });

    it('should include period information', async () => {
      const input: IGenerateReportInput = {
        user_id: 'user-123',
        type: 'custom',
        format: 'json',
        start_date: '2025-12-01',
        end_date: '2025-12-23',
      };

      const result = await service.generate(input);

      expect(result.success).toBe(true);
      expect(result.data!.period).toBeDefined();
      expect(result.data!.period.start).toBe(input.start_date);
      expect(result.data!.period.end).toBe(input.end_date);
    });

    it('should include metadata', async () => {
      const input: IGenerateReportInput = {
        user_id: 'user-123',
        type: 'daily',
        format: 'json',
        start_date: '2025-12-23',
        end_date: '2025-12-23',
      };

      const result = await service.generate(input);

      expect(result.metadata).toBeDefined();
      expect(result.metadata!.timestamp).toBeDefined();
      expect(result.metadata!.duration_ms).toBeGreaterThanOrEqual(0);
    });
  });

  describe('generateBacktestReport', () => {
    it('should generate backtest report', async () => {
      const backtestResult: IBacktestResult = {
        id: 'backtest-123',
        configId: 'config-123',
        strategyId: 'strategy-123',
        status: 'completed',
        startedAt: '2025-12-01T00:00:00Z',
        completedAt: '2025-12-23T00:00:00Z',
        executionTimeMs: 1000,
        initialCapital: 10000,
        finalCapital: 12000,
        peakCapital: 12500,
        trades: [],
        equityCurve: [],
        drawdowns: [],
        monthlyReturns: [],
        metrics: {
          totalReturn: 20,
          annualizedReturn: 80,
          monthlyReturn: 6.67,
          sharpeRatio: 1.5,
          sortinoRatio: 2.0,
          calmarRatio: 1.2,
          maxDrawdown: -5,
          avgDrawdown: -2,
          maxDrawdownDuration: 10,
          totalTrades: 50,
          winRate: 60,
          profitFactor: 1.8,
          avgWin: 100,
          avgLoss: -50,
          maxWin: 500,
          maxLoss: -200,
          maxConsecutiveWins: 5,
          maxConsecutiveLosses: 3,
          avgHoldingPeriod: 2.5,
          pnlStdDev: 50,
          avgTradeReturn: 2,
          expectancy: 10,
        },
      };

      const result = await service.generateBacktestReport(backtestResult);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.type).toBe('backtest');
      expect(result.data!.format).toBe('json');
      expect(result.data!.metrics).toBe(backtestResult.metrics);
    });

    it('should support different formats for backtest report', async () => {
      const backtestResult: IBacktestResult = {
        id: 'backtest-123',
        configId: 'config-123',
        strategyId: 'strategy-123',
        status: 'completed',
        startedAt: '2025-12-01T00:00:00Z',
        completedAt: '2025-12-23T00:00:00Z',
        initialCapital: 10000,
        finalCapital: 12000,
        peakCapital: 12500,
        trades: [],
        equityCurve: [],
        drawdowns: [],
        monthlyReturns: [],
        metrics: {} as never,
      };

      const result = await service.generateBacktestReport(backtestResult, 'pdf');

      expect(result.success).toBe(true);
      expect(result.data!.format).toBe('pdf');
    });
  });

  describe('generateDailyReport', () => {
    it('should generate daily report for specific date', async () => {
      const userId = 'user-123';
      const date = '2025-12-23';

      const result = await service.generateDailyReport(userId, date);

      expect(result.success).toBe(true);
      expect(result.data!.type).toBe('daily');
      expect(result.data!.user_id).toBe(userId);
    });
  });

  describe('generateWeeklyReport', () => {
    it('should generate weekly report', async () => {
      const userId = 'user-123';
      const weekStart = '2025-12-16';

      const result = await service.generateWeeklyReport(userId, weekStart);

      expect(result.success).toBe(true);
      expect(result.data!.type).toBe('weekly');
      expect(result.data!.user_id).toBe(userId);
    });
  });

  describe('generateMonthlyReport', () => {
    it('should generate monthly report', async () => {
      const userId = 'user-123';
      const month = '2025-12';

      const result = await service.generateMonthlyReport(userId, month);

      expect(result.success).toBe(true);
      expect(result.data!.type).toBe('monthly');
      expect(result.data!.user_id).toBe(userId);
    });
  });

  describe('factory function', () => {
    it('should create service via createReportGenerationService', async () => {
      const { createReportGenerationService } = await import(
        '../services/report-generation-service.js'
      );
      const service = createReportGenerationService();

      const result = await service.generate({
        user_id: 'user-123',
        type: 'daily',
        format: 'json',
        start_date: '2025-12-23',
        end_date: '2025-12-23',
      });

      expect(result.success).toBe(true);
    });
  });
});
