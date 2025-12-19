/**
 * @hephaitos/core - Position Repository Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryPositionRepository,
  createPositionRepository,
  type IPositionRepository,
} from '../repositories/position-repository.js';
import type { IPosition } from '@hephaitos/types';

describe('InMemoryPositionRepository', () => {
  let repository: IPositionRepository;

  const createMockPosition = (overrides: Partial<IPosition> = {}): IPosition => ({
    id: `position-${crypto.randomUUID()}`,
    symbol: 'AAPL',
    side: 'buy',
    quantity: 100,
    entryPrice: 150.0,
    currentPrice: 155.0,
    unrealizedPnL: 500,
    unrealizedPnLPercent: 3.33,
    status: 'open',
    enteredAt: new Date().toISOString(),
    ...overrides,
  });

  beforeEach(() => {
    repository = createPositionRepository();
  });

  describe('save', () => {
    it('should save a position successfully', async () => {
      const mockPosition = createMockPosition();
      const result = await repository.save(mockPosition);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(mockPosition.id);
      expect(result.data?.symbol).toBe('AAPL');
      expect(result.metadata?.timestamp).toBeDefined();
      expect(result.metadata?.duration_ms).toBeGreaterThanOrEqual(0);
    });

    it('should overwrite existing position with same id', async () => {
      const positionId = 'fixed-position-id';
      const position1 = createMockPosition({ id: positionId, quantity: 100 });
      const position2 = createMockPosition({ id: positionId, quantity: 200 });

      await repository.save(position1);
      await repository.save(position2);

      const result = await repository.getById(positionId);

      expect(result.success).toBe(true);
      expect(result.data?.quantity).toBe(200);
    });
  });

  describe('getById', () => {
    it('should return position when found', async () => {
      const mockPosition = createMockPosition();
      await repository.save(mockPosition);

      const result = await repository.getById(mockPosition.id);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(mockPosition.id);
      expect(result.data?.symbol).toBe('AAPL');
      expect(result.data?.entryPrice).toBe(150.0);
    });

    it('should return null when position not found', async () => {
      const result = await repository.getById('non-existent-id');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe('getOpenBySymbol', () => {
    it('should return open position for symbol', async () => {
      const openPosition = createMockPosition({ symbol: 'TSLA', status: 'open' });
      await repository.save(openPosition);

      const result = await repository.getOpenBySymbol('TSLA');

      expect(result.success).toBe(true);
      expect(result.data?.symbol).toBe('TSLA');
      expect(result.data?.status).toBe('open');
    });

    it('should return null when no open position for symbol', async () => {
      const closedPosition = createMockPosition({
        symbol: 'GOOGL',
        status: 'closed',
        closedAt: new Date().toISOString(),
        exitPrice: 160.0,
      });
      await repository.save(closedPosition);

      const result = await repository.getOpenBySymbol('GOOGL');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('should return null when symbol does not exist', async () => {
      const result = await repository.getOpenBySymbol('NVDA');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('should find correct open position among multiple', async () => {
      await repository.save(createMockPosition({ symbol: 'AAPL', status: 'closed' }));
      await repository.save(createMockPosition({ symbol: 'AAPL', status: 'closed' }));
      const openPosition = createMockPosition({ symbol: 'AAPL', status: 'open' });
      await repository.save(openPosition);

      const result = await repository.getOpenBySymbol('AAPL');

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(openPosition.id);
      expect(result.data?.status).toBe('open');
    });
  });

  describe('listByStrategy', () => {
    it('should return positions with pagination', async () => {
      for (let i = 0; i < 5; i++) {
        await repository.save(createMockPosition());
      }

      const result = await repository.listByStrategy('strategy-123', { page: 1, limit: 3 });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(result.pagination?.total).toBe(5);
      expect(result.pagination?.hasMore).toBe(true);
      expect(result.pagination?.page).toBe(1);
      expect(result.pagination?.limit).toBe(3);
    });

    it('should return empty array when no positions exist', async () => {
      const result = await repository.listByStrategy('strategy-123', { page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
      expect(result.pagination?.total).toBe(0);
      expect(result.pagination?.hasMore).toBe(false);
    });

    it('should handle second page correctly', async () => {
      for (let i = 0; i < 5; i++) {
        await repository.save(createMockPosition());
      }

      const result = await repository.listByStrategy('strategy-123', { page: 2, limit: 3 });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.pagination?.hasMore).toBe(false);
    });

    it('should sort positions by enteredAt descending', async () => {
      const pos1 = createMockPosition({ enteredAt: '2024-01-01T00:00:00Z' });
      const pos2 = createMockPosition({ enteredAt: '2024-06-01T00:00:00Z' });
      const pos3 = createMockPosition({ enteredAt: '2024-12-01T00:00:00Z' });

      await repository.save(pos1);
      await repository.save(pos2);
      await repository.save(pos3);

      const result = await repository.listByStrategy('strategy-123', { page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data![0].id).toBe(pos3.id);
      expect(result.data![1].id).toBe(pos2.id);
      expect(result.data![2].id).toBe(pos1.id);
    });
  });

  describe('listOpen', () => {
    it('should filter to only open positions', async () => {
      await repository.save(createMockPosition({ status: 'open' }));
      await repository.save(createMockPosition({ status: 'open' }));
      await repository.save(createMockPosition({ status: 'closed' }));
      await repository.save(createMockPosition({ status: 'closed' }));

      const result = await repository.listOpen({ page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data!.every(p => p.status === 'open')).toBe(true);
    });

    it('should return empty array when no open positions', async () => {
      await repository.save(createMockPosition({ status: 'closed' }));

      const result = await repository.listOpen({ page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });

    it('should paginate open positions correctly', async () => {
      for (let i = 0; i < 5; i++) {
        await repository.save(createMockPosition({ status: 'open' }));
      }

      const result = await repository.listOpen({ page: 1, limit: 2 });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.pagination?.total).toBe(5);
      expect(result.pagination?.hasMore).toBe(true);
    });

    it('should sort open positions by enteredAt descending', async () => {
      const pos1 = createMockPosition({ status: 'open', enteredAt: '2024-01-01T00:00:00Z' });
      const pos2 = createMockPosition({ status: 'open', enteredAt: '2024-12-01T00:00:00Z' });

      await repository.save(pos1);
      await repository.save(pos2);

      const result = await repository.listOpen({ page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data![0].id).toBe(pos2.id);
      expect(result.data![1].id).toBe(pos1.id);
    });
  });

  describe('update', () => {
    it('should update position properties', async () => {
      const mockPosition = createMockPosition({
        currentPrice: 150.0,
        unrealizedPnL: 0,
      });
      await repository.save(mockPosition);

      const result = await repository.update(mockPosition.id, {
        currentPrice: 160.0,
        unrealizedPnL: 1000,
        unrealizedPnLPercent: 6.67,
      });

      expect(result.success).toBe(true);
      expect(result.data?.currentPrice).toBe(160.0);
      expect(result.data?.unrealizedPnL).toBe(1000);
      expect(result.data?.unrealizedPnLPercent).toBe(6.67);
    });

    it('should close a position', async () => {
      const mockPosition = createMockPosition({ status: 'open' });
      await repository.save(mockPosition);

      const closedAt = new Date().toISOString();
      const result = await repository.update(mockPosition.id, {
        status: 'closed',
        closedAt,
        exitPrice: 165.0,
      });

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('closed');
      expect(result.data?.closedAt).toBe(closedAt);
      expect(result.data?.exitPrice).toBe(165.0);
    });

    it('should return error when position not found', async () => {
      const result = await repository.update('non-existent-id', { currentPrice: 160.0 });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Position not found');
    });

    it('should preserve unchanged fields', async () => {
      const mockPosition = createMockPosition({
        symbol: 'NVDA',
        quantity: 50,
        entryPrice: 500.0,
      });
      await repository.save(mockPosition);

      const result = await repository.update(mockPosition.id, { currentPrice: 550.0 });

      expect(result.success).toBe(true);
      expect(result.data?.symbol).toBe('NVDA');
      expect(result.data?.quantity).toBe(50);
      expect(result.data?.entryPrice).toBe(500.0);
    });
  });

  describe('delete', () => {
    it('should delete existing position', async () => {
      const mockPosition = createMockPosition();
      await repository.save(mockPosition);

      const deleteResult = await repository.delete(mockPosition.id);
      const getResult = await repository.getById(mockPosition.id);

      expect(deleteResult.success).toBe(true);
      expect(deleteResult.data).toBe(true);
      expect(getResult.data).toBeNull();
    });

    it('should return false when deleting non-existent position', async () => {
      const result = await repository.delete('non-existent-id');

      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
    });
  });

  describe('factory function', () => {
    it('should create a new repository instance', () => {
      const repo = createPositionRepository();
      expect(repo).toBeInstanceOf(InMemoryPositionRepository);
    });
  });

  describe('position sides', () => {
    it('should handle long positions', async () => {
      const longPosition = createMockPosition({ side: 'buy' });
      const result = await repository.save(longPosition);

      expect(result.success).toBe(true);
      expect(result.data?.side).toBe('buy');
    });

    it('should handle short positions', async () => {
      const shortPosition = createMockPosition({ side: 'sell' });
      const result = await repository.save(shortPosition);

      expect(result.success).toBe(true);
      expect(result.data?.side).toBe('sell');
    });
  });

  describe('pnl calculations', () => {
    it('should handle positive unrealized PnL', async () => {
      const profitPosition = createMockPosition({
        entryPrice: 100.0,
        currentPrice: 110.0,
        unrealizedPnL: 1000,
        unrealizedPnLPercent: 10,
      });
      const result = await repository.save(profitPosition);

      expect(result.success).toBe(true);
      expect(result.data?.unrealizedPnL).toBe(1000);
      expect(result.data?.unrealizedPnLPercent).toBe(10);
    });

    it('should handle negative unrealized PnL', async () => {
      const lossPosition = createMockPosition({
        entryPrice: 100.0,
        currentPrice: 90.0,
        unrealizedPnL: -1000,
        unrealizedPnLPercent: -10,
      });
      const result = await repository.save(lossPosition);

      expect(result.success).toBe(true);
      expect(result.data?.unrealizedPnL).toBe(-1000);
      expect(result.data?.unrealizedPnLPercent).toBe(-10);
    });
  });
});
