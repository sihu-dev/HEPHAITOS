/**
 * @hephaitos/core - Strategy Repository Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryStrategyRepository,
  createStrategyRepository,
  type IStrategyRepository,
} from '../repositories/strategy-repository.js';
import type { IStrategy, ICreateStrategyInput } from '@hephaitos/types';

describe('InMemoryStrategyRepository', () => {
  let repository: IStrategyRepository;

  const mockCreateInput: ICreateStrategyInput = {
    name: 'Test Strategy',
    description: 'A test strategy',
    type: 'momentum',
    version: '1.0.0',
    timeframe: '1d',
    symbols: ['AAPL', 'GOOGL'],
    entryConditions: {
      logic: 'and',
      conditions: [],
    },
    exitConditions: {
      logic: 'and',
      conditions: [],
    },
    positionSizing: {
      type: 'fixed_percent',
      percent: 10,
    },
    riskManagement: {
      stopLossPercent: 5,
      takeProfitPercent: 10,
      maxPositions: 3,
    },
  };

  beforeEach(() => {
    repository = createStrategyRepository();
  });

  describe('create', () => {
    it('should create a new strategy with generated id', async () => {
      const result = await repository.create(mockCreateInput);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBeDefined();
      expect(result.data?.name).toBe('Test Strategy');
      expect(result.metadata?.timestamp).toBeDefined();
      expect(result.metadata?.duration_ms).toBeGreaterThanOrEqual(0);
    });

    it('should set metadata with createdAt and updatedAt', async () => {
      const result = await repository.create(mockCreateInput);

      expect(result.success).toBe(true);
      expect(result.data?.metadata.createdAt).toBeDefined();
      expect(result.data?.metadata.updatedAt).toBeDefined();
    });
  });

  describe('save', () => {
    it('should save an existing strategy', async () => {
      const strategy: IStrategy = {
        ...mockCreateInput,
        id: 'test-id-123',
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      const result = await repository.save(strategy);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('test-id-123');
    });
  });

  describe('getById', () => {
    it('should return strategy when found', async () => {
      const createResult = await repository.create(mockCreateInput);
      const strategyId = createResult.data!.id;

      const result = await repository.getById(strategyId);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(strategyId);
      expect(result.data?.name).toBe('Test Strategy');
    });

    it('should return null when strategy not found', async () => {
      const result = await repository.getById('non-existent-id');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe('list', () => {
    it('should return strategies for a user', async () => {
      // Create strategies with createdBy metadata
      const strategy1: IStrategy = {
        ...mockCreateInput,
        id: 'strat-1',
        name: 'Strategy 1',
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'user-123',
        },
      };
      const strategy2: IStrategy = {
        ...mockCreateInput,
        id: 'strat-2',
        name: 'Strategy 2',
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'user-123',
        },
      };
      const strategy3: IStrategy = {
        ...mockCreateInput,
        id: 'strat-3',
        name: 'Strategy 3',
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'user-456',
        },
      };

      await repository.save(strategy1);
      await repository.save(strategy2);
      await repository.save(strategy3);

      const result = await repository.list('user-123');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it('should return empty array when user has no strategies', async () => {
      const result = await repository.list('non-existent-user');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('update', () => {
    it('should update strategy properties', async () => {
      const createResult = await repository.create(mockCreateInput);
      const strategyId = createResult.data!.id;

      const result = await repository.update(strategyId, {
        name: 'Updated Strategy Name',
        description: 'Updated description',
      });

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Updated Strategy Name');
      expect(result.data?.description).toBe('Updated description');
    });

    it('should update metadata.updatedAt', async () => {
      const createResult = await repository.create(mockCreateInput);
      const strategyId = createResult.data!.id;
      const originalUpdatedAt = createResult.data!.metadata.updatedAt;

      // Small delay to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = await repository.update(strategyId, { name: 'New Name' });

      expect(result.success).toBe(true);
      expect(result.data?.metadata.updatedAt).not.toBe(originalUpdatedAt);
    });

    it('should return error when strategy not found', async () => {
      const result = await repository.update('non-existent-id', { name: 'New Name' });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Strategy not found');
    });
  });

  describe('delete', () => {
    it('should delete existing strategy', async () => {
      const createResult = await repository.create(mockCreateInput);
      const strategyId = createResult.data!.id;

      const deleteResult = await repository.delete(strategyId);
      const getResult = await repository.getById(strategyId);

      expect(deleteResult.success).toBe(true);
      expect(deleteResult.data).toBe(true);
      expect(getResult.data).toBeNull();
    });

    it('should return false when deleting non-existent strategy', async () => {
      const result = await repository.delete('non-existent-id');

      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
    });
  });

  describe('duplicate', () => {
    it('should create a copy with new id and name', async () => {
      const createResult = await repository.create(mockCreateInput);
      const originalId = createResult.data!.id;

      const result = await repository.duplicate(originalId, 'Duplicated Strategy');

      expect(result.success).toBe(true);
      expect(result.data?.id).not.toBe(originalId);
      expect(result.data?.name).toBe('Duplicated Strategy');
      expect(result.data?.type).toBe(mockCreateInput.type);
    });

    it('should return error when original strategy not found', async () => {
      const result = await repository.duplicate('non-existent-id', 'Copy');

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Strategy not found');
    });
  });

  describe('factory function', () => {
    it('should create a new repository instance', () => {
      const repo = createStrategyRepository();
      expect(repo).toBeInstanceOf(InMemoryStrategyRepository);
    });
  });
});
