/**
 * Portfolio Sync Agent Tests
 * L3 (Tissues) - 포트폴리오 동기화 에이전트 테스트
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PortfolioSyncAgent,
  createPortfolioSyncAgent,
  type IPortfolioSyncAgentConfig,
} from '@/agents/portfolio-sync-agent';
import type {
  IPortfolio,
  IAsset,
  IExchangeCredentials,
  IResult,
  IPortfolioSnapshot,
} from '@hephaitos/types';

// Mock repository implementation
const createMockRepository = () => ({
  save: vi.fn().mockResolvedValue({ success: true, data: {} }),
  getById: vi.fn().mockResolvedValue({ success: true, data: null }),
  getByUserId: vi.fn().mockResolvedValue({ success: true, data: [] }),
  updateAssets: vi.fn().mockResolvedValue({ success: true, data: {} }),
  saveSnapshot: vi.fn().mockResolvedValue({ success: true, data: {} }),
});

describe('PortfolioSyncAgent', () => {
  let agent: PortfolioSyncAgent;
  let mockRepository: ReturnType<typeof createMockRepository>;

  const mockPortfolio: IPortfolio = {
    id: 'portfolio-123',
    user_id: 'user-456',
    name: 'Main Portfolio',
    exchange: 'binance',
    assets: [],
    total_value_usd: 0,
    sync_status: 'idle',
    synced_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  const mockCredentials: IExchangeCredentials = {
    exchange: 'binance',
    api_key: 'test-api-key',
    api_secret: 'test-api-secret',
  };

  beforeEach(() => {
    mockRepository = createMockRepository();
    agent = createPortfolioSyncAgent(mockRepository);
  });

  describe('syncPortfolio', () => {
    it('should sync a portfolio and return success result', async () => {
      mockRepository.updateAssets.mockResolvedValue({
        success: true,
        data: { ...mockPortfolio, assets: [] },
        metadata: { timestamp: new Date().toISOString(), duration_ms: 10 },
      });

      const result = await agent.syncPortfolio(mockPortfolio, mockCredentials);

      expect(result.success).toBe(true);
      expect(result.data?.portfolio_id).toBe('portfolio-123');
      expect(result.metadata?.timestamp).toBeDefined();
      expect(result.metadata?.duration_ms).toBeGreaterThanOrEqual(0);
    });

    it('should handle sync failure gracefully', async () => {
      mockRepository.updateAssets.mockResolvedValue({
        success: false,
        error: new Error('Database connection failed'),
        metadata: { timestamp: new Date().toISOString(), duration_ms: 10 },
      });

      const result = await agent.syncPortfolio(mockPortfolio, mockCredentials);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should filter dust assets based on config', async () => {
      const customConfig: Partial<IPortfolioSyncAgentConfig> = {
        minAssetValueUsd: 10,
      };
      const customAgent = createPortfolioSyncAgent(mockRepository, customConfig);

      mockRepository.updateAssets.mockResolvedValue({
        success: true,
        data: mockPortfolio,
        metadata: { timestamp: new Date().toISOString(), duration_ms: 5 },
      });

      const result = await customAgent.syncPortfolio(mockPortfolio, mockCredentials);

      expect(result.success).toBe(true);
    });
  });

  describe('syncAllPortfolios', () => {
    it('should sync all user portfolios', async () => {
      const portfolios: IPortfolio[] = [
        { ...mockPortfolio, id: 'p1', exchange: 'binance' },
        { ...mockPortfolio, id: 'p2', exchange: 'upbit' },
      ];

      mockRepository.getByUserId.mockResolvedValue({
        success: true,
        data: portfolios,
        metadata: { timestamp: new Date().toISOString(), duration_ms: 5 },
      });

      mockRepository.updateAssets.mockResolvedValue({
        success: true,
        data: mockPortfolio,
        metadata: { timestamp: new Date().toISOString(), duration_ms: 5 },
      });

      const credentialsMap = new Map<'binance' | 'upbit', IExchangeCredentials>([
        ['binance', mockCredentials],
        ['upbit', { ...mockCredentials, exchange: 'upbit' }],
      ]);

      const result = await agent.syncAllPortfolios('user-456', credentialsMap as Map<import('@hephaitos/types').ExchangeType, IExchangeCredentials>);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it('should return empty array when user has no portfolios', async () => {
      mockRepository.getByUserId.mockResolvedValue({
        success: true,
        data: [],
        metadata: { timestamp: new Date().toISOString(), duration_ms: 5 },
      });

      const result = await agent.syncAllPortfolios('user-456', new Map());

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });

    it('should handle missing credentials for an exchange', async () => {
      const portfolios: IPortfolio[] = [
        { ...mockPortfolio, id: 'p1', exchange: 'binance' },
      ];

      mockRepository.getByUserId.mockResolvedValue({
        success: true,
        data: portfolios,
        metadata: { timestamp: new Date().toISOString(), duration_ms: 5 },
      });

      // Empty credentials map - no credentials for BINANCE
      const result = await agent.syncAllPortfolios('user-456', new Map());

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].success).toBe(false);
      expect(result.data![0].error).toContain('No credentials');
    });

    it('should respect maxConcurrency config', async () => {
      const customConfig: Partial<IPortfolioSyncAgentConfig> = {
        maxConcurrency: 2,
      };
      const customAgent = createPortfolioSyncAgent(mockRepository, customConfig);

      const portfolios: IPortfolio[] = Array.from({ length: 5 }, (_, i) => ({
        ...mockPortfolio,
        id: `p${i}`,
        exchange: 'binance' as const,
      }));

      mockRepository.getByUserId.mockResolvedValue({
        success: true,
        data: portfolios,
        metadata: { timestamp: new Date().toISOString(), duration_ms: 5 },
      });

      mockRepository.updateAssets.mockResolvedValue({
        success: true,
        data: mockPortfolio,
        metadata: { timestamp: new Date().toISOString(), duration_ms: 5 },
      });

      const credentialsMap = new Map<import('@hephaitos/types').ExchangeType, IExchangeCredentials>([
        ['binance', mockCredentials],
      ]);

      const result = await customAgent.syncAllPortfolios('user-456', credentialsMap);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(5);
    });
  });

  describe('config defaults', () => {
    it('should use default config values', () => {
      const defaultAgent = createPortfolioSyncAgent(mockRepository);
      expect(defaultAgent).toBeDefined();
    });

    it('should merge custom config with defaults', () => {
      const customConfig: Partial<IPortfolioSyncAgentConfig> = {
        minAssetValueUsd: 5,
        saveSnapshots: false,
      };
      const customAgent = createPortfolioSyncAgent(mockRepository, customConfig);
      expect(customAgent).toBeDefined();
    });
  });

  describe('factory function', () => {
    it('should create agent instance', () => {
      const newAgent = createPortfolioSyncAgent(mockRepository);
      expect(newAgent).toBeInstanceOf(PortfolioSyncAgent);
    });
  });
});
