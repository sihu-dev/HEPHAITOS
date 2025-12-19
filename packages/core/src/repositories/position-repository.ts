/**
 * @hephaitos/core - Position Repository
 * L2 (Cells) - 포지션 저장소
 */

import type { IPosition, IResult, IPaginatedResult } from '@hephaitos/types';

/**
 * 포지션 저장소 인터페이스
 */
export interface IPositionRepository {
  /** 포지션 저장 */
  save(position: IPosition): Promise<IResult<IPosition>>;

  /** ID로 포지션 조회 */
  getById(id: string): Promise<IResult<IPosition | null>>;

  /** 심볼로 열린 포지션 조회 */
  getOpenBySymbol(symbol: string): Promise<IResult<IPosition | null>>;

  /** 전략별 포지션 목록 */
  listByStrategy(
    strategyId: string,
    pagination?: { page: number; limit: number }
  ): Promise<IPaginatedResult<IPosition>>;

  /** 열린 포지션 목록 */
  listOpen(pagination?: { page: number; limit: number }): Promise<IPaginatedResult<IPosition>>;

  /** 포지션 업데이트 */
  update(id: string, updates: Partial<IPosition>): Promise<IResult<IPosition>>;

  /** 포지션 삭제 */
  delete(id: string): Promise<IResult<boolean>>;
}

/**
 * In-Memory 포지션 저장소 구현
 */
export class InMemoryPositionRepository implements IPositionRepository {
  private positions: Map<string, IPosition> = new Map();

  async save(position: IPosition): Promise<IResult<IPosition>> {
    const startTime = Date.now();
    try {
      this.positions.set(position.id, position);
      return {
        success: true,
        data: position,
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

  async getById(id: string): Promise<IResult<IPosition | null>> {
    const startTime = Date.now();
    try {
      const position = this.positions.get(id) ?? null;
      return {
        success: true,
        data: position,
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

  async getOpenBySymbol(symbol: string): Promise<IResult<IPosition | null>> {
    const startTime = Date.now();
    try {
      const position = Array.from(this.positions.values())
        .find(p => p.symbol === symbol && p.status === 'open') ?? null;
      return {
        success: true,
        data: position,
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
  ): Promise<IPaginatedResult<IPosition>> {
    const startTime = Date.now();
    try {
      // Note: strategyId filtering would require extending IPosition type
      const filtered = Array.from(this.positions.values())
        .sort((a, b) => new Date(b.enteredAt).getTime() - new Date(a.enteredAt).getTime());

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

  async listOpen(
    pagination: { page: number; limit: number } = { page: 1, limit: 10 }
  ): Promise<IPaginatedResult<IPosition>> {
    const startTime = Date.now();
    try {
      const filtered = Array.from(this.positions.values())
        .filter(p => p.status === 'open')
        .sort((a, b) => new Date(b.enteredAt).getTime() - new Date(a.enteredAt).getTime());

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

  async update(id: string, updates: Partial<IPosition>): Promise<IResult<IPosition>> {
    const startTime = Date.now();
    try {
      const existing = this.positions.get(id);
      if (!existing) {
        return {
          success: false,
          error: new Error(`Position not found: ${id}`),
          metadata: {
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
          },
        };
      }
      const updated: IPosition = { ...existing, ...updates };
      this.positions.set(id, updated);
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
      const deleted = this.positions.delete(id);
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
 * 포지션 저장소 팩토리
 */
export function createPositionRepository(): IPositionRepository {
  return new InMemoryPositionRepository();
}
