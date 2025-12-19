/**
 * @hephaitos/core - Order Repository
 * L2 (Cells) - 주문 저장소
 */

import type { IOrder, IResult, IPaginatedResult } from '@hephaitos/types';

/**
 * 주문 저장소 인터페이스
 */
export interface IOrderRepository {
  /** 주문 저장 */
  save(order: IOrder): Promise<IResult<IOrder>>;

  /** ID로 주문 조회 */
  getById(id: string): Promise<IResult<IOrder | null>>;

  /** 전략별 주문 목록 */
  listByStrategy(
    strategyId: string,
    pagination?: { page: number; limit: number }
  ): Promise<IPaginatedResult<IOrder>>;

  /** 상태별 주문 목록 */
  listByStatus(
    status: string,
    pagination?: { page: number; limit: number }
  ): Promise<IPaginatedResult<IOrder>>;

  /** 주문 업데이트 */
  update(id: string, updates: Partial<IOrder>): Promise<IResult<IOrder>>;

  /** 주문 삭제 */
  delete(id: string): Promise<IResult<boolean>>;
}

/**
 * In-Memory 주문 저장소 구현
 */
export class InMemoryOrderRepository implements IOrderRepository {
  private orders: Map<string, IOrder> = new Map();

  async save(order: IOrder): Promise<IResult<IOrder>> {
    const startTime = Date.now();
    try {
      this.orders.set(order.id, order);
      return {
        success: true,
        data: order,
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

  async getById(id: string): Promise<IResult<IOrder | null>> {
    const startTime = Date.now();
    try {
      const order = this.orders.get(id) ?? null;
      return {
        success: true,
        data: order,
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
    _strategyId: string,
    pagination: { page: number; limit: number } = { page: 1, limit: 10 }
  ): Promise<IPaginatedResult<IOrder>> {
    const startTime = Date.now();
    try {
      // Note: strategyId filtering would require extending IOrder type
      const filtered = Array.from(this.orders.values())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const total = filtered.length;
      const offset = (pagination.page - 1) * pagination.limit;
      const paged = filtered.slice(offset, offset + pagination.limit);

      return {
        success: true,
        data: paged,
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

  async listByStatus(
    status: string,
    pagination: { page: number; limit: number } = { page: 1, limit: 10 }
  ): Promise<IPaginatedResult<IOrder>> {
    const startTime = Date.now();
    try {
      const filtered = Array.from(this.orders.values())
        .filter(o => o.status === status)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const total = filtered.length;
      const offset = (pagination.page - 1) * pagination.limit;
      const paged = filtered.slice(offset, offset + pagination.limit);

      return {
        success: true,
        data: paged,
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

  async update(id: string, updates: Partial<IOrder>): Promise<IResult<IOrder>> {
    const startTime = Date.now();
    try {
      const existing = this.orders.get(id);
      if (!existing) {
        return {
          success: false,
          error: new Error(`Order not found: ${id}`),
          metadata: {
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
          },
        };
      }
      const updated: IOrder = { ...existing, ...updates };
      this.orders.set(id, updated);
      return {
        success: true,
        data: updated,
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
      const deleted = this.orders.delete(id);
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
}

/**
 * 주문 저장소 팩토리
 */
export function createOrderRepository(): IOrderRepository {
  return new InMemoryOrderRepository();
}
