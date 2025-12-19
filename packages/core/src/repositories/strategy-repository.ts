/**
 * @hephaitos/core - Strategy Repository
 * L2 (Cells) - 전략 저장소
 */

import type {
  IStrategy,
  ICreateStrategyInput,
  IResult,
  createResult,
  createErrorResult,
} from '@hephaitos/types';

/**
 * 전략 저장소 인터페이스
 */
export interface IStrategyRepository {
  /** 전략 저장 */
  save(strategy: IStrategy): Promise<IResult<IStrategy>>;

  /** 전략 생성 */
  create(input: ICreateStrategyInput): Promise<IResult<IStrategy>>;

  /** ID로 전략 조회 */
  getById(id: string): Promise<IResult<IStrategy | null>>;

  /** 사용자별 전략 목록 */
  list(userId: string): Promise<IResult<IStrategy[]>>;

  /** 전략 업데이트 */
  update(id: string, updates: Partial<IStrategy>): Promise<IResult<IStrategy>>;

  /** 전략 삭제 */
  delete(id: string): Promise<IResult<boolean>>;

  /** 전략 복제 */
  duplicate(id: string, newName: string): Promise<IResult<IStrategy>>;
}

/**
 * In-Memory 전략 저장소 구현
 */
export class InMemoryStrategyRepository implements IStrategyRepository {
  private strategies: Map<string, IStrategy> = new Map();

  async save(strategy: IStrategy): Promise<IResult<IStrategy>> {
    const startTime = Date.now();
    try {
      this.strategies.set(strategy.id, strategy);
      return {
        success: true,
        data: strategy,
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

  async create(input: ICreateStrategyInput): Promise<IResult<IStrategy>> {
    const startTime = Date.now();
    try {
      const strategy: IStrategy = {
        ...input,
        id: crypto.randomUUID(),
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };
      this.strategies.set(strategy.id, strategy);
      return {
        success: true,
        data: strategy,
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

  async getById(id: string): Promise<IResult<IStrategy | null>> {
    const startTime = Date.now();
    try {
      const strategy = this.strategies.get(id) ?? null;
      return {
        success: true,
        data: strategy,
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

  async list(userId: string): Promise<IResult<IStrategy[]>> {
    const startTime = Date.now();
    try {
      const strategies = Array.from(this.strategies.values())
        .filter(s => s.metadata.createdBy === userId);
      return {
        success: true,
        data: strategies,
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

  async update(id: string, updates: Partial<IStrategy>): Promise<IResult<IStrategy>> {
    const startTime = Date.now();
    try {
      const existing = this.strategies.get(id);
      if (!existing) {
        return {
          success: false,
          error: new Error(`Strategy not found: ${id}`),
          metadata: {
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
          },
        };
      }
      const updated: IStrategy = {
        ...existing,
        ...updates,
        metadata: {
          ...existing.metadata,
          updatedAt: new Date().toISOString(),
        },
      };
      this.strategies.set(id, updated);
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
      const deleted = this.strategies.delete(id);
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

  async duplicate(id: string, newName: string): Promise<IResult<IStrategy>> {
    const startTime = Date.now();
    try {
      const original = this.strategies.get(id);
      if (!original) {
        return {
          success: false,
          error: new Error(`Strategy not found: ${id}`),
          metadata: {
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
          },
        };
      }
      const duplicated: IStrategy = {
        ...original,
        id: crypto.randomUUID(),
        name: newName,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };
      this.strategies.set(duplicated.id, duplicated);
      return {
        success: true,
        data: duplicated,
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
 * 전략 저장소 팩토리
 */
export function createStrategyRepository(): IStrategyRepository {
  return new InMemoryStrategyRepository();
}
