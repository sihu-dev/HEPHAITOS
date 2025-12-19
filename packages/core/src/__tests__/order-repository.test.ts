/**
 * @hephaitos/core - Order Repository Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryOrderRepository,
  createOrderRepository,
  type IOrderRepository,
} from '../repositories/order-repository.js';
import type { IOrder } from '@hephaitos/types';

describe('InMemoryOrderRepository', () => {
  let repository: IOrderRepository;

  const createMockOrder = (overrides: Partial<IOrder> = {}): IOrder => ({
    id: `order-${crypto.randomUUID()}`,
    symbol: 'AAPL',
    side: 'buy',
    type: 'limit',
    quantity: 100,
    price: 150.5,
    filledQuantity: 0,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  });

  beforeEach(() => {
    repository = createOrderRepository();
  });

  describe('save', () => {
    it('should save an order successfully', async () => {
      const mockOrder = createMockOrder();
      const result = await repository.save(mockOrder);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(mockOrder.id);
      expect(result.data?.symbol).toBe('AAPL');
      expect(result.metadata?.timestamp).toBeDefined();
      expect(result.metadata?.duration_ms).toBeGreaterThanOrEqual(0);
    });

    it('should overwrite existing order with same id', async () => {
      const orderId = 'fixed-order-id';
      const order1 = createMockOrder({ id: orderId, quantity: 100 });
      const order2 = createMockOrder({ id: orderId, quantity: 200 });

      await repository.save(order1);
      await repository.save(order2);

      const result = await repository.getById(orderId);

      expect(result.success).toBe(true);
      expect(result.data?.quantity).toBe(200);
    });
  });

  describe('getById', () => {
    it('should return order when found', async () => {
      const mockOrder = createMockOrder();
      await repository.save(mockOrder);

      const result = await repository.getById(mockOrder.id);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(mockOrder.id);
      expect(result.data?.symbol).toBe('AAPL');
      expect(result.data?.side).toBe('buy');
    });

    it('should return null when order not found', async () => {
      const result = await repository.getById('non-existent-id');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe('listByStrategy', () => {
    it('should return orders with pagination', async () => {
      // Save 5 orders
      for (let i = 0; i < 5; i++) {
        await repository.save(createMockOrder());
      }

      const result = await repository.listByStrategy('strategy-123', { page: 1, limit: 3 });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(result.pagination?.total).toBe(5);
      expect(result.pagination?.hasMore).toBe(true);
      expect(result.pagination?.page).toBe(1);
      expect(result.pagination?.limit).toBe(3);
    });

    it('should return empty array when no orders exist', async () => {
      const result = await repository.listByStrategy('strategy-123', { page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
      expect(result.pagination?.total).toBe(0);
      expect(result.pagination?.hasMore).toBe(false);
    });

    it('should handle second page correctly', async () => {
      // Save 5 orders
      for (let i = 0; i < 5; i++) {
        await repository.save(createMockOrder());
      }

      const result = await repository.listByStrategy('strategy-123', { page: 2, limit: 3 });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.pagination?.hasMore).toBe(false);
    });

    it('should sort orders by createdAt descending', async () => {
      const order1 = createMockOrder({ createdAt: '2024-01-01T00:00:00Z' });
      const order2 = createMockOrder({ createdAt: '2024-06-01T00:00:00Z' });
      const order3 = createMockOrder({ createdAt: '2024-12-01T00:00:00Z' });

      await repository.save(order1);
      await repository.save(order2);
      await repository.save(order3);

      const result = await repository.listByStrategy('strategy-123', { page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data![0].id).toBe(order3.id);
      expect(result.data![1].id).toBe(order2.id);
      expect(result.data![2].id).toBe(order1.id);
    });
  });

  describe('listByStatus', () => {
    it('should filter orders by status', async () => {
      await repository.save(createMockOrder({ status: 'pending' }));
      await repository.save(createMockOrder({ status: 'pending' }));
      await repository.save(createMockOrder({ status: 'filled' }));
      await repository.save(createMockOrder({ status: 'cancelled' }));

      const result = await repository.listByStatus('pending', { page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data!.every(o => o.status === 'pending')).toBe(true);
    });

    it('should return empty array when no orders match status', async () => {
      await repository.save(createMockOrder({ status: 'filled' }));

      const result = await repository.listByStatus('cancelled', { page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });

    it('should paginate status-filtered results', async () => {
      for (let i = 0; i < 5; i++) {
        await repository.save(createMockOrder({ status: 'open' }));
      }

      const result = await repository.listByStatus('open', { page: 1, limit: 2 });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.pagination?.total).toBe(5);
      expect(result.pagination?.hasMore).toBe(true);
    });
  });

  describe('update', () => {
    it('should update order properties', async () => {
      const mockOrder = createMockOrder({ status: 'pending', filledQuantity: 0 });
      await repository.save(mockOrder);

      const result = await repository.update(mockOrder.id, {
        status: 'partial',
        filledQuantity: 50,
        avgFillPrice: 151.0,
      });

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('partial');
      expect(result.data?.filledQuantity).toBe(50);
      expect(result.data?.avgFillPrice).toBe(151.0);
    });

    it('should return error when order not found', async () => {
      const result = await repository.update('non-existent-id', { status: 'filled' });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Order not found');
    });

    it('should preserve unchanged fields', async () => {
      const mockOrder = createMockOrder({
        symbol: 'TSLA',
        quantity: 100,
        price: 200.0,
      });
      await repository.save(mockOrder);

      const result = await repository.update(mockOrder.id, { status: 'filled' });

      expect(result.success).toBe(true);
      expect(result.data?.symbol).toBe('TSLA');
      expect(result.data?.quantity).toBe(100);
      expect(result.data?.price).toBe(200.0);
    });
  });

  describe('delete', () => {
    it('should delete existing order', async () => {
      const mockOrder = createMockOrder();
      await repository.save(mockOrder);

      const deleteResult = await repository.delete(mockOrder.id);
      const getResult = await repository.getById(mockOrder.id);

      expect(deleteResult.success).toBe(true);
      expect(deleteResult.data).toBe(true);
      expect(getResult.data).toBeNull();
    });

    it('should return false when deleting non-existent order', async () => {
      const result = await repository.delete('non-existent-id');

      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
    });
  });

  describe('factory function', () => {
    it('should create a new repository instance', () => {
      const repo = createOrderRepository();
      expect(repo).toBeInstanceOf(InMemoryOrderRepository);
    });
  });

  describe('order types', () => {
    it('should handle market orders', async () => {
      const marketOrder = createMockOrder({
        type: 'market',
        price: undefined,
      });
      const result = await repository.save(marketOrder);

      expect(result.success).toBe(true);
      expect(result.data?.type).toBe('market');
      expect(result.data?.price).toBeUndefined();
    });

    it('should handle stop orders', async () => {
      const stopOrder = createMockOrder({
        type: 'stop',
        stopPrice: 145.0,
      });
      const result = await repository.save(stopOrder);

      expect(result.success).toBe(true);
      expect(result.data?.type).toBe('stop');
      expect(result.data?.stopPrice).toBe(145.0);
    });

    it('should handle stop_limit orders', async () => {
      const stopLimitOrder = createMockOrder({
        type: 'stop_limit',
        price: 150.0,
        stopPrice: 145.0,
      });
      const result = await repository.save(stopLimitOrder);

      expect(result.success).toBe(true);
      expect(result.data?.type).toBe('stop_limit');
      expect(result.data?.price).toBe(150.0);
      expect(result.data?.stopPrice).toBe(145.0);
    });
  });

  describe('order sides', () => {
    it('should handle buy orders', async () => {
      const buyOrder = createMockOrder({ side: 'buy' });
      const result = await repository.save(buyOrder);

      expect(result.success).toBe(true);
      expect(result.data?.side).toBe('buy');
    });

    it('should handle sell orders', async () => {
      const sellOrder = createMockOrder({ side: 'sell' });
      const result = await repository.save(sellOrder);

      expect(result.success).toBe(true);
      expect(result.data?.side).toBe('sell');
    });
  });
});
