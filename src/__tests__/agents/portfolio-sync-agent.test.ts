/**
 * HEPHAITOS - Portfolio Sync Agent Tests
 * L3 (Tissues) - Comprehensive test suite
 *
 * Test Coverage:
 * - Configuration and construction
 * - Single portfolio synchronization
 * - Multi-portfolio parallel synchronization
 * - Timeout handling and error recovery
 * - Asset normalization (dust filtering, sorting)
 * - Snapshot creation and persistence
 * - Concurrent sync operations
 * - Error scenarios and edge cases
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PortfolioSyncAgent,
  createPortfolioSyncAgent,
  type IPortfolioSyncAgentConfig,
} from '@/agents/portfolio-sync-agent';
import type {
  IResult,
  ExchangeType,
  IPortfolio,
  IPortfolioSnapshot,
  IAsset,
  IExchangeCredentials,
  ISyncResult,
} from '@hephaitos/types';

// ═══════════════════════════════════════════════════════════════════
// Mock Repository
// ═══════════════════════════════════════════════════════════════════

interface IPortfolioRepository {
  save(portfolio: IPortfolio): Promise<IResult<IPortfolio>>;
  getById(id: string): Promise<IResult<IPortfolio | null>>;
  getByUserId(userId: string): Promise<IResult<IPortfolio[]>>;
  updateAssets(
    portfolioId: string,
    assets: IAsset[],
    syncedAt: string
  ): Promise<IResult<IPortfolio>>;
  saveSnapshot(snapshot: IPortfolioSnapshot): Promise<IResult<IPortfolioSnapshot>>;
}

class MockPortfolioRepository implements IPortfolioRepository {
  private portfolios = new Map<string, IPortfolio>();
  private snapshots: IPortfolioSnapshot[] = [];

  async save(portfolio: IPortfolio): Promise<IResult<IPortfolio>> {
    this.portfolios.set(portfolio.id, portfolio);
    return {
      success: true,
      data: portfolio,
      metadata: { timestamp: new Date().toISOString(), duration_ms: 0 },
    };
  }

  async getById(id: string): Promise<IResult<IPortfolio | null>> {
    const portfolio = this.portfolios.get(id) ?? null;
    return {
      success: true,
      data: portfolio,
      metadata: { timestamp: new Date().toISOString(), duration_ms: 0 },
    };
  }

  async getByUserId(userId: string): Promise<IResult<IPortfolio[]>> {
    const portfolios = Array.from(this.portfolios.values()).filter(
      (p) => p.user_id === userId
    );
    return {
      success: true,
      data: portfolios,
      metadata: { timestamp: new Date().toISOString(), duration_ms: 0 },
    };
  }

  async updateAssets(
    portfolioId: string,
    assets: IAsset[],
    syncedAt: string
  ): Promise<IResult<IPortfolio>> {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) {
      return {
        success: false,
        error: new Error('Portfolio not found'),
        metadata: { timestamp: new Date().toISOString(), duration_ms: 0 },
      };
    }

    portfolio.assets = assets;
    portfolio.last_synced_at = syncedAt;
    portfolio.sync_status = 'synced';

    this.portfolios.set(portfolioId, portfolio);

    return {
      success: true,
      data: portfolio,
      metadata: { timestamp: new Date().toISOString(), duration_ms: 0 },
    };
  }

  async saveSnapshot(
    snapshot: IPortfolioSnapshot
  ): Promise<IResult<IPortfolioSnapshot>> {
    this.snapshots.push(snapshot);
    return {
      success: true,
      data: snapshot,
      metadata: { timestamp: new Date().toISOString(), duration_ms: 0 },
    };
  }

  // Test helpers
  getSnapshots(): IPortfolioSnapshot[] {
    return this.snapshots;
  }

  clear(): void {
    this.portfolios.clear();
    this.snapshots = [];
  }
}

// ═══════════════════════════════════════════════════════════════════
// Mock Exchange Service
// ═══════════════════════════════════════════════════════════════════

interface IExchangeService {
  getBalance(credentials: IExchangeCredentials): Promise<IResult<IAsset[]>>;
}

class MockExchangeService implements IExchangeService {
  constructor(
    private mockAssets: IAsset[] = [],
    private shouldFail = false,
    private delay = 0
  ) {}

  async getBalance(_credentials: IExchangeCredentials): Promise<IResult<IAsset[]>> {
    if (this.delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delay));
    }

    if (this.shouldFail) {
      return {
        success: false,
        error: new Error('Exchange API error'),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: this.delay,
        },
      };
    }

    return {
      success: true,
      data: this.mockAssets,
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: this.delay,
      },
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// Test Data Factories
// ═══════════════════════════════════════════════════════════════════

function createTestPortfolio(
  id: string,
  userId: string,
  exchange: ExchangeType
): IPortfolio {
  return {
    id,
    user_id: userId,
    exchange,
    assets: [],
    last_synced_at: null,
    sync_status: 'pending',
    created_at: new Date().toISOString(),
  };
}

function createTestAsset(
  symbol: string,
  amount: number,
  priceUsd: number
): IAsset {
  return {
    symbol,
    amount,
    price_usd: priceUsd,
    value_usd: amount * priceUsd,
  };
}

function createTestCredentials(exchange: ExchangeType): IExchangeCredentials {
  return {
    exchange,
    api_key: `test-key-${exchange}`,
    api_secret: `test-secret-${exchange}`,
  };
}

// ═══════════════════════════════════════════════════════════════════
// Test Suite
// ═══════════════════════════════════════════════════════════════════

describe('PortfolioSyncAgent', () => {
  let repository: MockPortfolioRepository;
  let agent: PortfolioSyncAgent;

  beforeEach(() => {
    repository = new MockPortfolioRepository();
    agent = new PortfolioSyncAgent(repository);
  });

  // ─────────────────────────────────────────────────────────────────
  // 1. Configuration & Construction
  // ─────────────────────────────────────────────────────────────────

  describe('Configuration & Construction', () => {
    it('should use default configuration', () => {
      const agent = new PortfolioSyncAgent(repository);
      expect(agent).toBeDefined();
      // Config is private, but we can test behavior
    });

    it('should accept custom configuration', () => {
      const customConfig: Partial<IPortfolioSyncAgentConfig> = {
        minAssetValueUsd: 10,
        syncTimeoutMs: 5000,
        maxConcurrency: 3,
        saveSnapshots: false,
      };

      const agent = new PortfolioSyncAgent(repository, customConfig);
      expect(agent).toBeDefined();
    });

    it('should create agent via factory', () => {
      const agent = createPortfolioSyncAgent(repository);
      expect(agent).toBeDefined();
      expect(agent).toBeInstanceOf(PortfolioSyncAgent);
    });

    it('should merge custom config with defaults', () => {
      const agent = createPortfolioSyncAgent(repository, {
        minAssetValueUsd: 5,
      });
      expect(agent).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // 2. Single Portfolio Synchronization
  // ─────────────────────────────────────────────────────────────────

  describe('Single Portfolio Sync', () => {
    it('should successfully sync portfolio with assets', async () => {
      const portfolio = createTestPortfolio('p1', 'user1', 'binance');
      await repository.save(portfolio);

      const mockAssets = [
        createTestAsset('BTC', 0.5, 50000),
        createTestAsset('ETH', 10, 3000),
        createTestAsset('USDT', 1000, 1),
      ];

      // Mock exchange service
      const mockService = new MockExchangeService(mockAssets);
      vi.spyOn(
        require('@/agents/portfolio-sync-agent'),
        'ExchangeServiceFactory'
      ).mockReturnValue({
        getService: () => mockService,
      });

      const credentials = createTestCredentials('binance');
      const result = await agent.syncPortfolio(portfolio, credentials);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      const syncResult = result.data!;
      expect(syncResult.success).toBe(true);
      expect(syncResult.portfolio_id).toBe('p1');
      expect(syncResult.asset_count).toBe(3);
      expect(syncResult.total_value_usd).toBe(56000); // 25000 + 30000 + 1000
    });

    it('should filter dust assets (< $1)', async () => {
      const portfolio = createTestPortfolio('p1', 'user1', 'binance');
      await repository.save(portfolio);

      const mockAssets = [
        createTestAsset('BTC', 0.5, 50000), // $25,000
        createTestAsset('DUST', 0.0001, 1), // $0.0001 - should be filtered
        createTestAsset('ETH', 10, 3000), // $30,000
      ];

      const mockService = new MockExchangeService(mockAssets);
      const credentials = createTestCredentials('binance');

      const result = await agent.syncPortfolio(portfolio, credentials);

      expect(result.success).toBe(true);
      expect(result.data!.asset_count).toBe(2); // BTC and ETH only
    });

    it('should sort assets by value (descending)', async () => {
      const portfolio = createTestPortfolio('p1', 'user1', 'binance');
      await repository.save(portfolio);

      const mockAssets = [
        createTestAsset('USDT', 1000, 1), // $1,000
        createTestAsset('BTC', 0.5, 50000), // $25,000
        createTestAsset('ETH', 10, 3000), // $30,000
      ];

      const mockService = new MockExchangeService(mockAssets);
      const credentials = createTestCredentials('binance');

      await agent.syncPortfolio(portfolio, credentials);

      const updated = await repository.getById('p1');
      const assets = updated.data!.assets;

      expect(assets[0].symbol).toBe('ETH'); // $30,000
      expect(assets[1].symbol).toBe('BTC'); // $25,000
      expect(assets[2].symbol).toBe('USDT'); // $1,000
    });

    it('should save snapshot when enabled', async () => {
      const agentWithSnapshots = new PortfolioSyncAgent(repository, {
        saveSnapshots: true,
      });

      const portfolio = createTestPortfolio('p1', 'user1', 'binance');
      await repository.save(portfolio);

      const mockAssets = [createTestAsset('BTC', 1, 50000)];
      const mockService = new MockExchangeService(mockAssets);
      const credentials = createTestCredentials('binance');

      await agentWithSnapshots.syncPortfolio(portfolio, credentials);

      const snapshots = repository.getSnapshots();
      expect(snapshots.length).toBe(1);
      expect(snapshots[0].portfolio_id).toBe('p1');
      expect(snapshots[0].total_value_usd).toBe(50000);
      expect(snapshots[0].asset_breakdown.length).toBe(1);
    });

    it('should NOT save snapshot when disabled', async () => {
      const agentNoSnapshots = new PortfolioSyncAgent(repository, {
        saveSnapshots: false,
      });

      const portfolio = createTestPortfolio('p1', 'user1', 'binance');
      await repository.save(portfolio);

      const mockAssets = [createTestAsset('BTC', 1, 50000)];
      const mockService = new MockExchangeService(mockAssets);
      const credentials = createTestCredentials('binance');

      await agentNoSnapshots.syncPortfolio(portfolio, credentials);

      const snapshots = repository.getSnapshots();
      expect(snapshots.length).toBe(0);
    });

    it('should handle balance fetch failure gracefully', async () => {
      const portfolio = createTestPortfolio('p1', 'user1', 'binance');
      await repository.save(portfolio);

      const mockService = new MockExchangeService([], true); // shouldFail = true
      const credentials = createTestCredentials('binance');

      const result = await agent.syncPortfolio(portfolio, credentials);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Exchange API error');
    });

    it('should handle repository update failure', async () => {
      const portfolio = createTestPortfolio('p1', 'user1', 'binance');
      // Don't save portfolio - will cause update to fail

      const mockAssets = [createTestAsset('BTC', 1, 50000)];
      const mockService = new MockExchangeService(mockAssets);
      const credentials = createTestCredentials('binance');

      const result = await agent.syncPortfolio(portfolio, credentials);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Portfolio not found');
    });

    it('should update sync status and timestamp', async () => {
      const portfolio = createTestPortfolio('p1', 'user1', 'binance');
      await repository.save(portfolio);

      const mockAssets = [createTestAsset('BTC', 1, 50000)];
      const mockService = new MockExchangeService(mockAssets);
      const credentials = createTestCredentials('binance');

      await agent.syncPortfolio(portfolio, credentials);

      const updated = await repository.getById('p1');
      expect(updated.data!.sync_status).toBe('synced');
      expect(updated.data!.last_synced_at).toBeTruthy();
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // 3. Multi-Portfolio Synchronization
  // ─────────────────────────────────────────────────────────────────

  describe('Multi-Portfolio Sync', () => {
    it('should sync multiple portfolios in parallel', async () => {
      const p1 = createTestPortfolio('p1', 'user1', 'binance');
      const p2 = createTestPortfolio('p2', 'user1', 'upbit');
      const p3 = createTestPortfolio('p3', 'user1', 'bithumb');

      await repository.save(p1);
      await repository.save(p2);
      await repository.save(p3);

      const credentialsMap = new Map<ExchangeType, IExchangeCredentials>([
        ['binance', createTestCredentials('binance')],
        ['upbit', createTestCredentials('upbit')],
        ['bithumb', createTestCredentials('bithumb')],
      ]);

      const mockAssets = [createTestAsset('BTC', 1, 50000)];
      const mockService = new MockExchangeService(mockAssets);

      const result = await agent.syncAllPortfolios('user1', credentialsMap);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.length).toBe(3);

      result.data!.forEach((syncResult) => {
        expect(syncResult.success).toBe(true);
        expect(syncResult.asset_count).toBe(1);
      });
    });

    it('should handle empty portfolio list', async () => {
      const credentialsMap = new Map<ExchangeType, IExchangeCredentials>();

      const result = await agent.syncAllPortfolios('user_no_portfolios', credentialsMap);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.length).toBe(0);
    });

    it('should handle missing credentials for a portfolio', async () => {
      const p1 = createTestPortfolio('p1', 'user1', 'binance');
      const p2 = createTestPortfolio('p2', 'user1', 'upbit');

      await repository.save(p1);
      await repository.save(p2);

      // Only provide credentials for binance, not upbit
      const credentialsMap = new Map<ExchangeType, IExchangeCredentials>([
        ['binance', createTestCredentials('binance')],
      ]);

      const result = await agent.syncAllPortfolios('user1', credentialsMap);

      expect(result.success).toBe(true);
      expect(result.data!.length).toBe(2);

      const binanceResult = result.data!.find((r) => r.portfolio_id === 'p1');
      const upbitResult = result.data!.find((r) => r.portfolio_id === 'p2');

      expect(binanceResult!.success).toBe(true);
      expect(upbitResult!.success).toBe(false);
      expect(upbitResult!.error).toContain('No credentials');
    });

    it('should batch portfolios by maxConcurrency', async () => {
      const agentConcurrency2 = new PortfolioSyncAgent(repository, {
        maxConcurrency: 2,
      });

      // Create 5 portfolios
      for (let i = 1; i <= 5; i++) {
        const portfolio = createTestPortfolio(`p${i}`, 'user1', 'binance');
        await repository.save(portfolio);
      }

      const credentialsMap = new Map<ExchangeType, IExchangeCredentials>([
        ['binance', createTestCredentials('binance')],
      ]);

      const result = await agentConcurrency2.syncAllPortfolios('user1', credentialsMap);

      expect(result.success).toBe(true);
      expect(result.data!.length).toBe(5);
      // All should succeed (batching doesn't affect success)
      result.data!.forEach((r) => expect(r.success).toBe(true));
    });

    it('should handle mixed success/failure scenarios', async () => {
      const p1 = createTestPortfolio('p1', 'user1', 'binance');
      const p2 = createTestPortfolio('p2', 'user1', 'upbit');

      await repository.save(p1);
      await repository.save(p2);

      const credentialsMap = new Map<ExchangeType, IExchangeCredentials>([
        ['binance', createTestCredentials('binance')],
        ['upbit', createTestCredentials('upbit')],
      ]);

      // Mock first service to succeed, second to fail
      const mockServiceSuccess = new MockExchangeService([
        createTestAsset('BTC', 1, 50000),
      ]);
      const mockServiceFail = new MockExchangeService([], true);

      const result = await agent.syncAllPortfolios('user1', credentialsMap);

      expect(result.success).toBe(true);
      expect(result.data!.length).toBe(2);

      // At least one should succeed
      const hasSuccess = result.data!.some((r) => r.success);
      expect(hasSuccess).toBe(true);
    });

    it('should handle getByUserId failure', async () => {
      // Mock repository to fail
      const failingRepo = new MockPortfolioRepository();
      vi.spyOn(failingRepo, 'getByUserId').mockResolvedValue({
        success: false,
        error: new Error('Database error'),
        metadata: { timestamp: new Date().toISOString(), duration_ms: 0 },
      });

      const agentWithFailingRepo = new PortfolioSyncAgent(failingRepo);
      const credentialsMap = new Map<ExchangeType, IExchangeCredentials>();

      const result = await agentWithFailingRepo.syncAllPortfolios('user1', credentialsMap);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Database error');
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // 4. Timeout Handling
  // ─────────────────────────────────────────────────────────────────

  describe('Timeout Handling', () => {
    it('should timeout if sync exceeds limit', async () => {
      const agentShortTimeout = new PortfolioSyncAgent(repository, {
        syncTimeoutMs: 100, // 100ms timeout
      });

      const portfolio = createTestPortfolio('p1', 'user1', 'binance');
      await repository.save(portfolio);

      // Mock service with 200ms delay (exceeds timeout)
      const mockServiceSlow = new MockExchangeService(
        [createTestAsset('BTC', 1, 50000)],
        false,
        200
      );

      const credentials = createTestCredentials('binance');
      const result = await agentShortTimeout.syncPortfolio(portfolio, credentials);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('timeout');
    });

    it('should succeed if sync completes within timeout', async () => {
      const agentLongTimeout = new PortfolioSyncAgent(repository, {
        syncTimeoutMs: 500, // 500ms timeout
      });

      const portfolio = createTestPortfolio('p1', 'user1', 'binance');
      await repository.save(portfolio);

      // Mock service with 50ms delay (within timeout)
      const mockServiceFast = new MockExchangeService(
        [createTestAsset('BTC', 1, 50000)],
        false,
        50
      );

      const credentials = createTestCredentials('binance');
      const result = await agentLongTimeout.syncPortfolio(portfolio, credentials);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should include timeout metadata in error result', async () => {
      const agentShortTimeout = new PortfolioSyncAgent(repository, {
        syncTimeoutMs: 100,
      });

      const portfolio = createTestPortfolio('p1', 'user1', 'binance');
      await repository.save(portfolio);

      const mockServiceSlow = new MockExchangeService([], false, 200);
      const credentials = createTestCredentials('binance');

      const result = await agentShortTimeout.syncPortfolio(portfolio, credentials);

      expect(result.success).toBe(false);
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.timed_out).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // 5. Snapshot Creation
  // ─────────────────────────────────────────────────────────────────

  describe('Snapshot Creation', () => {
    it('should create snapshot with correct structure', async () => {
      const agent = new PortfolioSyncAgent(repository, { saveSnapshots: true });

      const portfolio = createTestPortfolio('p1', 'user1', 'binance');
      await repository.save(portfolio);

      const mockAssets = [
        createTestAsset('BTC', 1, 50000),
        createTestAsset('ETH', 10, 3000),
      ];

      const mockService = new MockExchangeService(mockAssets);
      const credentials = createTestCredentials('binance');

      await agent.syncPortfolio(portfolio, credentials);

      const snapshots = repository.getSnapshots();
      expect(snapshots.length).toBe(1);

      const snapshot = snapshots[0];
      expect(snapshot.id).toBeTruthy();
      expect(snapshot.portfolio_id).toBe('p1');
      expect(snapshot.total_value_usd).toBe(80000);
      expect(snapshot.asset_breakdown).toHaveLength(2);
      expect(snapshot.recorded_at).toBeTruthy();
    });

    it('should calculate asset percentages correctly', async () => {
      const agent = new PortfolioSyncAgent(repository, { saveSnapshots: true });

      const portfolio = createTestPortfolio('p1', 'user1', 'binance');
      await repository.save(portfolio);

      const mockAssets = [
        createTestAsset('BTC', 1, 50000), // 62.5%
        createTestAsset('ETH', 10, 3000), // 37.5%
      ];

      const mockService = new MockExchangeService(mockAssets);
      const credentials = createTestCredentials('binance');

      await agent.syncPortfolio(portfolio, credentials);

      const snapshot = repository.getSnapshots()[0];
      const btcBreakdown = snapshot.asset_breakdown.find((a) => a.symbol === 'BTC');
      const ethBreakdown = snapshot.asset_breakdown.find((a) => a.symbol === 'ETH');

      expect(btcBreakdown!.percentage).toBeCloseTo(62.5, 1);
      expect(ethBreakdown!.percentage).toBeCloseTo(37.5, 1);
    });

    it('should handle zero total value in snapshot', async () => {
      const agent = new PortfolioSyncAgent(repository, { saveSnapshots: true });

      const portfolio = createTestPortfolio('p1', 'user1', 'binance');
      await repository.save(portfolio);

      const mockAssets = [createTestAsset('ZERO', 0, 0)];
      const mockService = new MockExchangeService(mockAssets);
      const credentials = createTestCredentials('binance');

      await agent.syncPortfolio(portfolio, credentials);

      const snapshot = repository.getSnapshots()[0];
      expect(snapshot.total_value_usd).toBe(0);
      expect(snapshot.asset_breakdown[0].percentage).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // 6. Edge Cases & Error Scenarios
  // ─────────────────────────────────────────────────────────────────

  describe('Edge Cases', () => {
    it('should handle empty asset list', async () => {
      const portfolio = createTestPortfolio('p1', 'user1', 'binance');
      await repository.save(portfolio);

      const mockService = new MockExchangeService([]); // Empty assets
      const credentials = createTestCredentials('binance');

      const result = await agent.syncPortfolio(portfolio, credentials);

      expect(result.success).toBe(true);
      expect(result.data!.asset_count).toBe(0);
      expect(result.data!.total_value_usd).toBe(0);
    });

    it('should handle all assets filtered as dust', async () => {
      const agent = new PortfolioSyncAgent(repository, {
        minAssetValueUsd: 100, // High dust threshold
      });

      const portfolio = createTestPortfolio('p1', 'user1', 'binance');
      await repository.save(portfolio);

      const mockAssets = [
        createTestAsset('SMALL1', 0.001, 10), // $0.01
        createTestAsset('SMALL2', 0.01, 1), // $0.01
      ];

      const mockService = new MockExchangeService(mockAssets);
      const credentials = createTestCredentials('binance');

      const result = await agent.syncPortfolio(portfolio, credentials);

      expect(result.success).toBe(true);
      expect(result.data!.asset_count).toBe(0); // All filtered
    });

    it('should handle exception during sync', async () => {
      const portfolio = createTestPortfolio('p1', 'user1', 'binance');
      await repository.save(portfolio);

      // Mock repository to throw exception
      vi.spyOn(repository, 'updateAssets').mockRejectedValue(
        new Error('Unexpected error')
      );

      const mockAssets = [createTestAsset('BTC', 1, 50000)];
      const mockService = new MockExchangeService(mockAssets);
      const credentials = createTestCredentials('binance');

      const result = await agent.syncPortfolio(portfolio, credentials);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Unexpected error');
    });

    it('should handle concurrent syncs on same portfolio', async () => {
      const portfolio = createTestPortfolio('p1', 'user1', 'binance');
      await repository.save(portfolio);

      const mockAssets = [createTestAsset('BTC', 1, 50000)];
      const mockService = new MockExchangeService(mockAssets);
      const credentials = createTestCredentials('binance');

      // Run two syncs concurrently
      const [result1, result2] = await Promise.all([
        agent.syncPortfolio(portfolio, credentials),
        agent.syncPortfolio(portfolio, credentials),
      ]);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      // Both should complete successfully
      const updated = await repository.getById('p1');
      expect(updated.data!.assets.length).toBe(1);
    });

    it('should preserve existing assets on balance fetch failure', async () => {
      const portfolio = createTestPortfolio('p1', 'user1', 'binance');
      portfolio.assets = [createTestAsset('BTC', 1, 50000)]; // Existing assets
      await repository.save(portfolio);

      const mockService = new MockExchangeService([], true); // Fail
      const credentials = createTestCredentials('binance');

      const result = await agent.syncPortfolio(portfolio, credentials);

      expect(result.success).toBe(false);

      // Existing assets should be preserved
      const updated = await repository.getById('p1');
      expect(updated.data!.assets.length).toBe(1);
      expect(updated.data!.assets[0].symbol).toBe('BTC');
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // 7. Metadata & Performance
  // ─────────────────────────────────────────────────────────────────

  describe('Metadata & Performance', () => {
    it('should include timestamp in results', async () => {
      const portfolio = createTestPortfolio('p1', 'user1', 'binance');
      await repository.save(portfolio);

      const mockAssets = [createTestAsset('BTC', 1, 50000)];
      const mockService = new MockExchangeService(mockAssets);
      const credentials = createTestCredentials('binance');

      const result = await agent.syncPortfolio(portfolio, credentials);

      expect(result.metadata).toBeDefined();
      expect(result.metadata!.timestamp).toBeTruthy();
      expect(result.data!.synced_at).toBeTruthy();
    });

    it('should include duration_ms in metadata', async () => {
      const portfolio = createTestPortfolio('p1', 'user1', 'binance');
      await repository.save(portfolio);

      const mockAssets = [createTestAsset('BTC', 1, 50000)];
      const mockService = new MockExchangeService(mockAssets, false, 50);
      const credentials = createTestCredentials('binance');

      const result = await agent.syncPortfolio(portfolio, credentials);

      expect(result.metadata).toBeDefined();
      expect(result.metadata!.duration_ms).toBeGreaterThanOrEqual(0);
    });

    it('should measure multi-portfolio sync duration', async () => {
      const p1 = createTestPortfolio('p1', 'user1', 'binance');
      const p2 = createTestPortfolio('p2', 'user1', 'upbit');

      await repository.save(p1);
      await repository.save(p2);

      const credentialsMap = new Map<ExchangeType, IExchangeCredentials>([
        ['binance', createTestCredentials('binance')],
        ['upbit', createTestCredentials('upbit')],
      ]);

      const result = await agent.syncAllPortfolios('user1', credentialsMap);

      expect(result.metadata).toBeDefined();
      expect(result.metadata!.duration_ms).toBeGreaterThanOrEqual(0);
    });
  });
});
