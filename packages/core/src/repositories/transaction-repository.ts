/**
 * @hephaitos/core - Transaction Repository
 * L2 (Cells) - 거래 내역 저장소
 */

import type {
  IResult,
  ITransaction,
  ICreateTransactionInput,
  ITransactionFilter,
  ITransactionStats,
  IDailyTransactionSummary,
  TransactionType,
} from '@hephaitos/types';

/**
 * 거래 저장소 인터페이스
 */
export interface ITransactionRepository {
  /** 거래 기록 생성 */
  create(input: ICreateTransactionInput): Promise<IResult<ITransaction>>;

  /** ID로 거래 조회 */
  getById(id: string): Promise<IResult<ITransaction | null>>;

  /** 사용자별 거래 내역 조회 */
  getByUserId(userId: string, filter?: Partial<ITransactionFilter>): Promise<IResult<ITransaction[]>>;

  /** 주문 ID로 거래 조회 */
  getByOrderId(orderId: string): Promise<IResult<ITransaction[]>>;

  /** 포지션 ID로 거래 조회 */
  getByPositionId(positionId: string): Promise<IResult<ITransaction[]>>;

  /** 필터로 거래 조회 */
  getByFilter(filter: ITransactionFilter): Promise<IResult<ITransaction[]>>;

  /** 거래 통계 계산 */
  calculateStats(userId: string, dateRange?: { start: string; end: string }): Promise<IResult<ITransactionStats>>;

  /** 일별 요약 조회 */
  getDailySummary(userId: string, date: string): Promise<IResult<IDailyTransactionSummary | null>>;

  /** 거래 삭제 (관리자용) */
  delete(id: string): Promise<IResult<boolean>>;
}

/**
 * 인메모리 거래 저장소 (개발/테스트용)
 */
export class InMemoryTransactionRepository implements ITransactionRepository {
  private transactions: Map<string, ITransaction> = new Map();

  async create(input: ICreateTransactionInput): Promise<IResult<ITransaction>> {
    const startTime = Date.now();
    try {
      const now = new Date().toISOString();
      const transaction: ITransaction = {
        id: crypto.randomUUID(),
        ...input,
        executed_at: now,
        created_at: now,
      };

      this.transactions.set(transaction.id, transaction);

      return {
        success: true,
        data: transaction,
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

  async getById(id: string): Promise<IResult<ITransaction | null>> {
    const startTime = Date.now();
    try {
      const transaction = this.transactions.get(id) ?? null;

      return {
        success: true,
        data: transaction,
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

  async getByUserId(userId: string, filter?: Partial<ITransactionFilter>): Promise<IResult<ITransaction[]>> {
    const startTime = Date.now();
    try {
      let transactions = Array.from(this.transactions.values()).filter(
        (t) => t.user_id === userId
      );

      // Apply filters
      if (filter?.types && filter.types.length > 0) {
        transactions = transactions.filter((t) => filter.types!.includes(t.type));
      }

      if (filter?.symbol) {
        transactions = transactions.filter((t) => t.symbol === filter.symbol);
      }

      if (filter?.order_id) {
        transactions = transactions.filter((t) => t.order_id === filter.order_id);
      }

      if (filter?.position_id) {
        transactions = transactions.filter((t) => t.position_id === filter.position_id);
      }

      if (filter?.exchange) {
        transactions = transactions.filter((t) => t.exchange === filter.exchange);
      }

      if (filter?.dateRange) {
        transactions = transactions.filter(
          (t) => t.executed_at >= filter.dateRange!.start && t.executed_at <= filter.dateRange!.end
        );
      }

      // Sort by execution time (newest first)
      transactions.sort((a, b) => b.executed_at.localeCompare(a.executed_at));

      // Pagination
      if (filter?.page !== undefined && filter?.pageSize !== undefined) {
        const start = filter.page * filter.pageSize;
        const end = start + filter.pageSize;
        transactions = transactions.slice(start, end);
      }

      return {
        success: true,
        data: transactions,
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

  async getByOrderId(orderId: string): Promise<IResult<ITransaction[]>> {
    const startTime = Date.now();
    try {
      const transactions = Array.from(this.transactions.values()).filter(
        (t) => t.order_id === orderId
      );

      return {
        success: true,
        data: transactions,
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

  async getByPositionId(positionId: string): Promise<IResult<ITransaction[]>> {
    const startTime = Date.now();
    try {
      const transactions = Array.from(this.transactions.values()).filter(
        (t) => t.position_id === positionId
      );

      return {
        success: true,
        data: transactions,
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

  async getByFilter(filter: ITransactionFilter): Promise<IResult<ITransaction[]>> {
    const startTime = Date.now();
    try {
      let transactions = Array.from(this.transactions.values());

      // Apply all filters
      if (filter.user_id) {
        transactions = transactions.filter((t) => t.user_id === filter.user_id);
      }

      if (filter.types && filter.types.length > 0) {
        transactions = transactions.filter((t) => filter.types!.includes(t.type));
      }

      if (filter.symbol) {
        transactions = transactions.filter((t) => t.symbol === filter.symbol);
      }

      if (filter.order_id) {
        transactions = transactions.filter((t) => t.order_id === filter.order_id);
      }

      if (filter.position_id) {
        transactions = transactions.filter((t) => t.position_id === filter.position_id);
      }

      if (filter.exchange) {
        transactions = transactions.filter((t) => t.exchange === filter.exchange);
      }

      if (filter.dateRange) {
        transactions = transactions.filter(
          (t) => t.executed_at >= filter.dateRange!.start && t.executed_at <= filter.dateRange!.end
        );
      }

      // Sort by execution time
      transactions.sort((a, b) => b.executed_at.localeCompare(a.executed_at));

      // Pagination
      if (filter.page !== undefined && filter.pageSize !== undefined) {
        const start = filter.page * filter.pageSize;
        const end = start + filter.pageSize;
        transactions = transactions.slice(start, end);
      }

      return {
        success: true,
        data: transactions,
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

  async calculateStats(userId: string, dateRange?: { start: string; end: string }): Promise<IResult<ITransactionStats>> {
    const startTime = Date.now();
    try {
      let transactions = Array.from(this.transactions.values()).filter(
        (t) => t.user_id === userId
      );

      if (dateRange) {
        transactions = transactions.filter(
          (t) => t.executed_at >= dateRange.start && t.executed_at <= dateRange.end
        );
      }

      const stats: ITransactionStats = {
        user_id: userId,
        total_count: transactions.length,
        total_volume: transactions.reduce((sum, t) => sum + t.amount, 0),
        total_fees: transactions.reduce((sum, t) => sum + t.fee, 0),
        avg_transaction_amount: 0,
        by_type: {} as Record<TransactionType, { count: number; volume: number }>,
        by_symbol: {},
        period: dateRange ?? { start: '', end: '' },
        calculated_at: new Date().toISOString(),
      };

      stats.avg_transaction_amount = stats.total_count > 0 ? stats.total_volume / stats.total_count : 0;

      // Calculate by_type
      transactions.forEach((t) => {
        if (!stats.by_type[t.type]) {
          stats.by_type[t.type] = { count: 0, volume: 0 };
        }
        stats.by_type[t.type].count++;
        stats.by_type[t.type].volume += t.amount;
      });

      // Calculate by_symbol
      transactions.forEach((t) => {
        if (t.symbol) {
          if (!stats.by_symbol[t.symbol]) {
            stats.by_symbol[t.symbol] = { count: 0, volume: 0 };
          }
          stats.by_symbol[t.symbol].count++;
          stats.by_symbol[t.symbol].volume += t.amount;
        }
      });

      return {
        success: true,
        data: stats,
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

  async getDailySummary(userId: string, date: string): Promise<IResult<IDailyTransactionSummary | null>> {
    const startTime = Date.now();
    try {
      const dayStart = `${date}T00:00:00.000Z`;
      const dayEnd = `${date}T23:59:59.999Z`;

      const transactions = Array.from(this.transactions.values()).filter(
        (t) => t.user_id === userId && t.executed_at >= dayStart && t.executed_at <= dayEnd
      );

      if (transactions.length === 0) {
        return {
          success: true,
          data: null,
          metadata: {
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
          },
        };
      }

      // Calculate net P&L (exclude deposits/withdrawals)
      const tradingTransactions = transactions.filter(
        (t) => t.type !== 'deposit' && t.type !== 'withdrawal'
      );

      const netPnL = tradingTransactions.reduce((sum, t) => {
        if (t.side === 'sell' || t.type === 'position_close') {
          return sum + t.amount - t.fee;
        }
        return sum - t.amount - t.fee;
      }, 0);

      const summary: IDailyTransactionSummary = {
        date,
        user_id: userId,
        transaction_count: transactions.length,
        total_volume: transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0),
        total_fees: transactions.reduce((sum, t) => sum + t.fee, 0),
        net_pnl: netPnL,
        starting_balance: transactions[transactions.length - 1]?.balance_after ?? 0,
        ending_balance: transactions[0]?.balance_after ?? 0,
      };

      return {
        success: true,
        data: summary,
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
      const existed = this.transactions.has(id);

      if (!existed) {
        return {
          success: false,
          error: new Error(`Transaction not found: ${id}`),
          metadata: {
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
          },
        };
      }

      this.transactions.delete(id);

      return {
        success: true,
        data: true,
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
 * 팩토리 함수 - TransactionRepository 생성
 */
export function createTransactionRepository(): ITransactionRepository {
  return new InMemoryTransactionRepository();
}
