/**
 * HEPHAITOS - Portfolio Sync Agent
 * L3 (Tissues) - 포트폴리오 동기화 에이전트
 *
 * 책임:
 * - 다중 거래소 병렬 조회
 * - 잔고 정규화 및 통합
 * - 스냅샷 저장
 * - 변동 감지 및 알림 (TODO)
 */

import type {
  IResult,
  Timestamp,
  ExchangeType,
  IPortfolio,
  IPortfolioSnapshot,
  IAsset,
  IExchangeCredentials,
  ISyncResult,
} from '@hephaitos/types';
// TODO: 아래 core 서비스들은 추후 구현 필요
// import {
//   ExchangeServiceFactory,
//   type IPortfolioRepository,
//   type IExchangeService,
// } from '@hephaitos/core';
import { calculateTotalValue, filterDust, sortByValue } from '@hephaitos/utils';

// ═══════════════════════════════════════════════════════════════════
// Temporary interfaces until core package is fully implemented
// Using IResult wrapper pattern for consistency with original code
// ═══════════════════════════════════════════════════════════════════

interface IPortfolioRepository {
  save(portfolio: IPortfolio): Promise<IResult<IPortfolio>>;
  getById(id: string): Promise<IResult<IPortfolio | null>>;
  getByUserId(userId: string): Promise<IResult<IPortfolio[]>>;
  updateAssets(portfolioId: string, assets: IAsset[], syncedAt: string): Promise<IResult<IPortfolio>>;
  saveSnapshot(snapshot: IPortfolioSnapshot): Promise<IResult<IPortfolioSnapshot>>;
}

interface IExchangeService {
  getBalance(credentials: IExchangeCredentials): Promise<IResult<IAsset[]>>;
}

// Service cache for reusing connections
const serviceCache = new Map<string, IExchangeService>();

const ExchangeServiceFactory = {
  create(_type: ExchangeType, _credentials: IExchangeCredentials): IExchangeService {
    // Mock implementation - returns empty balances
    return {
      async getBalance(_creds: IExchangeCredentials): Promise<IResult<IAsset[]>> {
        return {
          success: true,
          data: [],
          metadata: {
            timestamp: new Date().toISOString(),
            duration_ms: 0,
          },
        };
      },
    };
  },
  getService(type: ExchangeType, credentials?: IExchangeCredentials): IExchangeService {
    const key = credentials ? `${type}-${credentials.api_key}` : type;
    if (!serviceCache.has(key)) {
      serviceCache.set(key, this.create(type, credentials!));
    }
    return serviceCache.get(key)!;
  },
};

/**
 * 에이전트 설정
 */
export interface IPortfolioSyncAgentConfig {
  /** 최소 자산 가치 (USD) - 더스트 필터링 */
  minAssetValueUsd: number;
  /** 동기화 타임아웃 (ms) */
  syncTimeoutMs: number;
  /** 병렬 동기화 최대 수 */
  maxConcurrency: number;
  /** 스냅샷 저장 여부 */
  saveSnapshots: boolean;
}

/**
 * 기본 설정
 */
const DEFAULT_CONFIG: IPortfolioSyncAgentConfig = {
  minAssetValueUsd: 1,
  syncTimeoutMs: 30000,
  maxConcurrency: 5,
  saveSnapshots: true,
};

/**
 * 포트폴리오 동기화 에이전트
 */
export class PortfolioSyncAgent {
  private config: IPortfolioSyncAgentConfig;
  private repository: IPortfolioRepository;

  constructor(
    repository: IPortfolioRepository,
    config: Partial<IPortfolioSyncAgentConfig> = {}
  ) {
    this.repository = repository;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 단일 포트폴리오 동기화
   *
   * @param portfolio - 동기화할 포트폴리오
   * @param credentials - 거래소 API 자격증명
   * @returns 동기화 결과
   */
  async syncPortfolio(
    portfolio: IPortfolio,
    credentials: IExchangeCredentials
  ): Promise<IResult<ISyncResult>> {
    const startTime = Date.now();
    const syncedAt = new Date().toISOString();

    try {
      // 1. 거래소 서비스 획득
      const service = ExchangeServiceFactory.getService(portfolio.exchange);

      // 2. 잔고 조회
      const balanceResult = await this.fetchBalanceWithTimeout(service, credentials);

      if (!balanceResult.success || !balanceResult.data) {
        // 동기화 실패 - 상태 업데이트
        await this.repository.updateAssets(
          portfolio.id,
          portfolio.assets, // 기존 자산 유지
          syncedAt
        );

        return {
          success: false,
          error: balanceResult.error,
          metadata: {
            timestamp: syncedAt,
            duration_ms: Date.now() - startTime,
          },
        };
      }

      // 3. 자산 정규화 및 필터링
      let assets = balanceResult.data;
      assets = filterDust(assets, this.config.minAssetValueUsd);
      assets = sortByValue(assets);

      const totalValueUsd = calculateTotalValue(assets);

      // 4. 저장소 업데이트
      const updateResult = await this.repository.updateAssets(
        portfolio.id,
        assets,
        syncedAt
      );

      if (!updateResult.success) {
        return {
          success: false,
          error: updateResult.error,
          metadata: {
            timestamp: syncedAt,
            duration_ms: Date.now() - startTime,
          },
        };
      }

      // 5. 스냅샷 저장
      if (this.config.saveSnapshots) {
        await this.saveSnapshot(portfolio.id, assets, totalValueUsd, syncedAt);
      }

      // 6. 결과 반환
      const syncResult: ISyncResult = {
        success: true,
        portfolio_id: portfolio.id,
        synced_at: syncedAt,
        asset_count: assets.length,
        total_value_usd: totalValueUsd,
      };

      return {
        success: true,
        data: syncResult,
        metadata: {
          timestamp: syncedAt,
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp: syncedAt,
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * 사용자의 모든 포트폴리오 동기화
   *
   * @param userId - 사용자 ID
   * @param credentialsMap - 거래소별 자격증명 맵
   * @returns 동기화 결과 배열
   */
  async syncAllPortfolios(
    userId: string,
    credentialsMap: Map<ExchangeType, IExchangeCredentials>
  ): Promise<IResult<ISyncResult[]>> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    try {
      // 1. 사용자 포트폴리오 조회
      const portfoliosResult = await this.repository.getByUserId(userId);

      if (!portfoliosResult.success || !portfoliosResult.data) {
        return {
          success: false,
          error: portfoliosResult.error,
          metadata: {
            timestamp,
            duration_ms: Date.now() - startTime,
          },
        };
      }

      const portfolios = portfoliosResult.data;

      if (portfolios.length === 0) {
        return {
          success: true,
          data: [],
          metadata: {
            timestamp,
            duration_ms: Date.now() - startTime,
          },
        };
      }

      // 2. 병렬 동기화 (동시성 제한)
      const results: ISyncResult[] = [];
      const batches = this.chunkArray(portfolios, this.config.maxConcurrency);

      for (const batch of batches) {
        const batchPromises = batch.map(async (portfolio) => {
          const credentials = credentialsMap.get(portfolio.exchange);

          if (!credentials) {
            return {
              success: false,
              portfolio_id: portfolio.id,
              synced_at: timestamp,
              asset_count: 0,
              total_value_usd: 0,
              error: `No credentials for ${portfolio.exchange}`,
            } as ISyncResult;
          }

          const result = await this.syncPortfolio(portfolio, credentials);
          return result.data ?? {
            success: false,
            portfolio_id: portfolio.id,
            synced_at: timestamp,
            asset_count: 0,
            total_value_usd: 0,
            error: result.error?.message,
          };
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }

      return {
        success: true,
        data: results,
        metadata: {
          timestamp,
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp,
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * 타임아웃 포함 잔고 조회
   */
  private async fetchBalanceWithTimeout(
    service: IExchangeService,
    credentials: IExchangeCredentials
  ): Promise<IResult<IAsset[]>> {
    return Promise.race([
      service.getBalance(credentials),
      new Promise<IResult<IAsset[]>>((_, reject) =>
        setTimeout(
          () => reject(new Error('Sync timeout exceeded')),
          this.config.syncTimeoutMs
        )
      ),
    ]);
  }

  /**
   * 스냅샷 저장
   */
  private async saveSnapshot(
    portfolioId: string,
    assets: IAsset[],
    totalValueUsd: number,
    recordedAt: Timestamp
  ): Promise<void> {
    const snapshot: IPortfolioSnapshot = {
      id: crypto.randomUUID(),
      portfolio_id: portfolioId,
      total_value_usd: totalValueUsd,
      asset_breakdown: assets.map((a) => ({
        symbol: a.symbol,
        amount: a.amount,
        value_usd: a.value_usd,
        percentage: totalValueUsd > 0 ? (a.value_usd / totalValueUsd) * 100 : 0,
      })),
      recorded_at: recordedAt,
    };

    await this.repository.saveSnapshot(snapshot);
  }

  /**
   * 배열 청크 분할
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

/**
 * 에이전트 인스턴스 생성 팩토리
 */
export function createPortfolioSyncAgent(
  repository: IPortfolioRepository,
  config?: Partial<IPortfolioSyncAgentConfig>
): PortfolioSyncAgent {
  return new PortfolioSyncAgent(repository, config);
}
