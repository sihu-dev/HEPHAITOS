/**
 * @hephaitos/core - Portfolio Repository
 * L2 (Cells) - 포트폴리오 저장소
 */

import type {
  IPortfolio,
  IPortfolioSnapshot,
  ICreatePortfolioInput,
  IAsset,
  IResult,
} from '@hephaitos/types';

/**
 * 포트폴리오 저장소 인터페이스
 */
export interface IPortfolioRepository {
  /** 포트폴리오 저장 */
  save(portfolio: IPortfolio): Promise<IResult<IPortfolio>>;

  /** 포트폴리오 생성 */
  create(input: ICreatePortfolioInput): Promise<IResult<IPortfolio>>;

  /** ID로 포트폴리오 조회 */
  getById(id: string): Promise<IResult<IPortfolio | null>>;

  /** 사용자별 포트폴리오 목록 */
  getByUserId(userId: string): Promise<IResult<IPortfolio[]>>;

  /** 포트폴리오 업데이트 */
  update(id: string, updates: Partial<IPortfolio>): Promise<IResult<IPortfolio>>;

  /** 포트폴리오 삭제 */
  delete(id: string): Promise<IResult<boolean>>;

  /** 자산 업데이트 (동기화 시 사용) */
  updateAssets(portfolioId: string, assets: IAsset[], syncedAt: string): Promise<IResult<IPortfolio>>;

  /** 스냅샷 저장 */
  saveSnapshot(snapshot: IPortfolioSnapshot): Promise<IResult<IPortfolioSnapshot>>;
}

/**
 * In-Memory 포트폴리오 저장소 구현
 */
export class InMemoryPortfolioRepository implements IPortfolioRepository {
  private portfolios: Map<string, IPortfolio> = new Map();
  private snapshots: Map<string, IPortfolioSnapshot> = new Map();

  async save(portfolio: IPortfolio): Promise<IResult<IPortfolio>> {
    const startTime = Date.now();
    try {
      this.portfolios.set(portfolio.id, portfolio);
      return {
        success: true,
        data: portfolio,
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

  async create(input: ICreatePortfolioInput): Promise<IResult<IPortfolio>> {
    const startTime = Date.now();
    try {
      const now = new Date().toISOString();
      const portfolio: IPortfolio = {
        id: crypto.randomUUID(),
        user_id: input.user_id,
        exchange: input.exchange,
        name: input.name,
        assets: [],
        total_value_usd: 0,
        created_at: now,
        synced_at: now,
        sync_status: 'idle',
      };
      this.portfolios.set(portfolio.id, portfolio);
      return {
        success: true,
        data: portfolio,
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

  async getById(id: string): Promise<IResult<IPortfolio | null>> {
    const startTime = Date.now();
    try {
      const portfolio = this.portfolios.get(id) || null;
      return {
        success: true,
        data: portfolio,
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

  async getByUserId(userId: string): Promise<IResult<IPortfolio[]>> {
    const startTime = Date.now();
    try {
      const portfolios = Array.from(this.portfolios.values()).filter(
        p => p.user_id === userId
      );
      return {
        success: true,
        data: portfolios,
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

  async update(id: string, updates: Partial<IPortfolio>): Promise<IResult<IPortfolio>> {
    const startTime = Date.now();
    try {
      const existing = this.portfolios.get(id);
      if (!existing) {
        return {
          success: false,
          error: new Error(`Portfolio not found: ${id}`),
          metadata: {
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
          },
        };
      }

      const updated: IPortfolio = {
        ...existing,
        ...updates,
      };
      this.portfolios.set(id, updated);

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
      const existed = this.portfolios.has(id);
      this.portfolios.delete(id);
      return {
        success: true,
        data: existed,
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

  async updateAssets(
    portfolioId: string,
    assets: IAsset[],
    syncedAt: string
  ): Promise<IResult<IPortfolio>> {
    const startTime = Date.now();
    try {
      const existing = this.portfolios.get(portfolioId);
      if (!existing) {
        return {
          success: false,
          error: new Error(`Portfolio not found: ${portfolioId}`),
          metadata: {
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
          },
        };
      }

      // 총 가치 계산
      const totalValue = assets.reduce((sum, asset) => sum + asset.value_usd, 0);

      const updated: IPortfolio = {
        ...existing,
        assets,
        total_value_usd: totalValue,
        synced_at: syncedAt,
        sync_status: 'success',
      };
      this.portfolios.set(portfolioId, updated);

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

  async saveSnapshot(snapshot: IPortfolioSnapshot): Promise<IResult<IPortfolioSnapshot>> {
    const startTime = Date.now();
    try {
      this.snapshots.set(snapshot.id, snapshot);
      return {
        success: true,
        data: snapshot,
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
 * 팩토리 함수 - In-Memory 구현 생성
 */
export function createPortfolioRepository(): IPortfolioRepository {
  return new InMemoryPortfolioRepository();
}
