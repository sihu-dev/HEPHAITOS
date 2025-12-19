/**
 * @hephaitos/core - Backtest Result Repository
 * L2 (Cells) - 백테스트 결과 저장소
 */

import type {
  IBacktestResult,
  IBacktestSummary,
  IStrategyComparison,
  IResult,
  IPaginatedResult,
} from '@hephaitos/types';

/**
 * 백테스트 결과 저장소 인터페이스
 */
export interface IBacktestResultRepository {
  /** 결과 저장 */
  save(result: IBacktestResult): Promise<IResult<IBacktestResult>>;

  /** 결과 조회 */
  getById(id: string): Promise<IResult<IBacktestResult | null>>;

  /** 전략별 결과 목록 */
  listByStrategy(
    strategyId: string,
    pagination?: { page: number; limit: number }
  ): Promise<IPaginatedResult<IBacktestSummary>>;

  /** 최근 결과 목록 */
  listRecent(limit?: number): Promise<IResult<IBacktestSummary[]>>;

  /** 결과 삭제 */
  delete(id: string): Promise<IResult<boolean>>;

  /** 전략 비교 */
  compareStrategies(backtestIds: string[]): Promise<IResult<IStrategyComparison>>;
}

/**
 * In-Memory 백테스트 결과 저장소 구현
 */
export class InMemoryBacktestResultRepository implements IBacktestResultRepository {
  private results: Map<string, IBacktestResult> = new Map();

  async save(result: IBacktestResult): Promise<IResult<IBacktestResult>> {
    const startTime = Date.now();
    try {
      this.results.set(result.id, result);
      return {
        success: true,
        data: result,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  async getById(id: string): Promise<IResult<IBacktestResult | null>> {
    const startTime = Date.now();
    try {
      const result = this.results.get(id) ?? null;
      return {
        success: true,
        data: result,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  async listByStrategy(
    strategyId: string,
    pagination: { page: number; limit: number } = { page: 1, limit: 10 }
  ): Promise<IPaginatedResult<IBacktestSummary>> {
    const startTime = Date.now();
    try {
      const filtered = Array.from(this.results.values())
        .filter(r => r.strategyId === strategyId)
        .sort((a, b) =>
          new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
        );

      const total = filtered.length;
      const offset = (pagination.page - 1) * pagination.limit;
      const paged = filtered.slice(offset, offset + pagination.limit);

      const summaries: IBacktestSummary[] = paged.map(r => ({
        id: r.id,
        strategyId: r.strategyId,
        strategyName: '', // Would be joined from strategy
        status: r.status,
        startDate: r.startedAt,
        endDate: r.completedAt ?? '',
        totalReturn: r.metrics.totalReturn,
        sharpeRatio: r.metrics.sharpeRatio,
        maxDrawdown: r.metrics.maxDrawdown,
        winRate: r.metrics.winRate,
        totalTrades: r.metrics.totalTrades,
        completedAt: r.completedAt,
      }));

      return {
        success: true,
        data: summaries,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          hasMore: offset + pagination.limit < total,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        data: [],
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: 0,
          hasMore: false,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  async listRecent(limit: number = 10): Promise<IResult<IBacktestSummary[]>> {
    const startTime = Date.now();
    try {
      const sorted = Array.from(this.results.values())
        .sort((a, b) =>
          new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
        )
        .slice(0, limit);

      const summaries: IBacktestSummary[] = sorted.map(r => ({
        id: r.id,
        strategyId: r.strategyId,
        strategyName: '',
        status: r.status,
        startDate: r.startedAt,
        endDate: r.completedAt ?? '',
        totalReturn: r.metrics.totalReturn,
        sharpeRatio: r.metrics.sharpeRatio,
        maxDrawdown: r.metrics.maxDrawdown,
        winRate: r.metrics.winRate,
        totalTrades: r.metrics.totalTrades,
        completedAt: r.completedAt,
      }));

      return {
        success: true,
        data: summaries,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  async delete(id: string): Promise<IResult<boolean>> {
    const startTime = Date.now();
    try {
      const deleted = this.results.delete(id);
      return {
        success: true,
        data: deleted,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  async compareStrategies(backtestIds: string[]): Promise<IResult<IStrategyComparison>> {
    const startTime = Date.now();
    try {
      const results = backtestIds
        .map(id => this.results.get(id))
        .filter((r): r is IBacktestResult => r !== undefined);

      if (results.length === 0) {
        return {
          success: false,
          error: new Error('No backtest results found for comparison'),
          metadata: {
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
          },
        };
      }

      // Convert to summaries
      const summaries: IBacktestSummary[] = results.map(r => ({
        id: r.id,
        strategyId: r.strategyId,
        strategyName: '',
        status: r.status,
        startDate: r.startedAt,
        endDate: r.completedAt ?? '',
        totalReturn: r.metrics.totalReturn,
        sharpeRatio: r.metrics.sharpeRatio,
        maxDrawdown: r.metrics.maxDrawdown,
        winRate: r.metrics.winRate,
        totalTrades: r.metrics.totalTrades,
        completedAt: r.completedAt,
      }));

      // Calculate comparison
      const comparison: IStrategyComparison = {
        backtestIds,
        period: {
          start: results[0]?.startedAt ?? '',
          end: results[0]?.completedAt ?? '',
        },
        summaries,
        rankings: {
          byReturn: [...backtestIds].sort((a, b) => {
            const aRes = this.results.get(a);
            const bRes = this.results.get(b);
            return (bRes?.metrics.totalReturn ?? 0) - (aRes?.metrics.totalReturn ?? 0);
          }),
          bySharpe: [...backtestIds].sort((a, b) => {
            const aRes = this.results.get(a);
            const bRes = this.results.get(b);
            return (bRes?.metrics.sharpeRatio ?? 0) - (aRes?.metrics.sharpeRatio ?? 0);
          }),
          byDrawdown: [...backtestIds].sort((a, b) => {
            const aRes = this.results.get(a);
            const bRes = this.results.get(b);
            return (aRes?.metrics.maxDrawdown ?? 0) - (bRes?.metrics.maxDrawdown ?? 0);
          }),
          byWinRate: [...backtestIds].sort((a, b) => {
            const aRes = this.results.get(a);
            const bRes = this.results.get(b);
            return (bRes?.metrics.winRate ?? 0) - (aRes?.metrics.winRate ?? 0);
          }),
        },
      };

      return {
        success: true,
        data: comparison,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }
}

/**
 * 백테스트 결과 저장소 팩토리
 */
export function createBacktestResultRepository(): IBacktestResultRepository {
  return new InMemoryBacktestResultRepository();
}
