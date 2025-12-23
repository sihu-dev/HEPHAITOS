/**
 * Portfolio Repository Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryPortfolioRepository } from '../repositories/portfolio-repository.js';
import type { IPortfolio, ICreatePortfolioInput, IPortfolioSnapshot } from '@hephaitos/types';

describe('PortfolioRepository', () => {
  let repository: InMemoryPortfolioRepository;

  beforeEach(() => {
    repository = new InMemoryPortfolioRepository();
  });

  describe('create', () => {
    it('should create a new portfolio', async () => {
      const input: ICreatePortfolioInput = {
        user_id: 'user-123',
        exchange: 'binance',
        name: 'My Binance Portfolio',
        api_key: 'test-key',
        api_secret: 'test-secret',
      };

      const result = await repository.create(input);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.user_id).toBe('user-123');
      expect(result.data!.exchange).toBe('binance');
      expect(result.data!.name).toBe('My Binance Portfolio');
      expect(result.data!.assets).toEqual([]);
      expect(result.data!.total_value_usd).toBe(0);
      expect(result.data!.sync_status).toBe('idle');
    });
  });

  describe('save', () => {
    it('should save a portfolio', async () => {
      const portfolio: IPortfolio = {
        id: 'portfolio-1',
        user_id: 'user-123',
        exchange: 'binance',
        name: 'Test Portfolio',
        assets: [],
        total_value_usd: 0,
        created_at: new Date().toISOString(),
        synced_at: new Date().toISOString(),
        sync_status: 'idle',
      };

      const result = await repository.save(portfolio);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(portfolio);
    });
  });

  describe('getById', () => {
    it('should get portfolio by ID', async () => {
      const input: ICreatePortfolioInput = {
        user_id: 'user-123',
        exchange: 'binance',
        name: 'Test',
        api_key: 'key',
        api_secret: 'secret',
      };
      const created = await repository.create(input);
      const id = created.data!.id;

      const result = await repository.getById(id);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.id).toBe(id);
    });

    it('should return null for non-existent ID', async () => {
      const result = await repository.getById('non-existent');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe('getByUserId', () => {
    it('should get portfolios by user ID', async () => {
      const input1: ICreatePortfolioInput = {
        user_id: 'user-123',
        exchange: 'binance',
        name: 'Portfolio 1',
        api_key: 'key1',
        api_secret: 'secret1',
      };
      const input2: ICreatePortfolioInput = {
        user_id: 'user-123',
        exchange: 'upbit',
        name: 'Portfolio 2',
        api_key: 'key2',
        api_secret: 'secret2',
      };

      await repository.create(input1);
      await repository.create(input2);

      const result = await repository.getByUserId('user-123');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data![0].user_id).toBe('user-123');
      expect(result.data![1].user_id).toBe('user-123');
    });
  });

  describe('update', () => {
    it('should update portfolio', async () => {
      const created = await repository.create({
        user_id: 'user-123',
        exchange: 'binance',
        name: 'Original Name',
        api_key: 'key',
        api_secret: 'secret',
      });
      const id = created.data!.id;

      const result = await repository.update(id, {
        name: 'Updated Name',
        sync_status: 'success',
      });

      expect(result.success).toBe(true);
      expect(result.data!.name).toBe('Updated Name');
      expect(result.data!.sync_status).toBe('success');
    });

    it('should return error for non-existent portfolio', async () => {
      const result = await repository.update('non-existent', { name: 'Test' });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('delete', () => {
    it('should delete portfolio', async () => {
      const created = await repository.create({
        user_id: 'user-123',
        exchange: 'binance',
        name: 'To Delete',
        api_key: 'key',
        api_secret: 'secret',
      });
      const id = created.data!.id;

      const result = await repository.delete(id);

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);

      const getResult = await repository.getById(id);
      expect(getResult.data).toBeNull();
    });
  });

  describe('updateAssets', () => {
    it('should update assets and calculate total value', async () => {
      const created = await repository.create({
        user_id: 'user-123',
        exchange: 'binance',
        name: 'Test',
        api_key: 'key',
        api_secret: 'secret',
      });
      const id = created.data!.id;

      const assets = [
        {
          id: 'asset-1',
          symbol: 'BTC',
          name: 'Bitcoin',
          exchange: 'binance' as const,
          quantity: 1,
          avg_buy_price: 50000,
          current_price: 55000,
          value_usd: 55000,
          pnl_usd: 5000,
          pnl_percent: 10,
        },
        {
          id: 'asset-2',
          symbol: 'ETH',
          name: 'Ethereum',
          exchange: 'binance' as const,
          quantity: 10,
          avg_buy_price: 3000,
          current_price: 3500,
          value_usd: 35000,
          pnl_usd: 5000,
          pnl_percent: 16.67,
        },
      ];

      const result = await repository.updateAssets(id, assets, new Date().toISOString());

      expect(result.success).toBe(true);
      expect(result.data!.assets).toHaveLength(2);
      expect(result.data!.total_value_usd).toBe(90000);
      expect(result.data!.sync_status).toBe('success');
    });
  });

  describe('saveSnapshot', () => {
    it('should save portfolio snapshot', async () => {
      const snapshot: IPortfolioSnapshot = {
        id: 'snapshot-1',
        portfolio_id: 'portfolio-1',
        total_value_usd: 100000,
        asset_breakdown: [
          {
            symbol: 'BTC',
            value_usd: 60000,
            percentage: 60,
          },
          {
            symbol: 'ETH',
            value_usd: 40000,
            percentage: 40,
          },
        ],
        recorded_at: new Date().toISOString(),
      };

      const result = await repository.saveSnapshot(snapshot);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(snapshot);
    });
  });
});
