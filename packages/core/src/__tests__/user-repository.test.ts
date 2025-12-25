/**
 * @hephaitos/core - UserRepository Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryUserRepository } from '../repositories/user-repository.js';
import type { ICreateUserInput, IUserSettings, IUserStats } from '@hephaitos/types';

describe('UserRepository', () => {
  let repository: InMemoryUserRepository;

  beforeEach(() => {
    repository = new InMemoryUserRepository();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const input: ICreateUserInput = {
        email: 'test@example.com',
        username: 'testuser',
        full_name: 'Test User',
        role: 'free',
      };

      const result = await repository.create(input);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.email).toBe(input.email);
      expect(result.data!.username).toBe(input.username);
      expect(result.data!.role).toBe('free');
      expect(result.data!.status).toBe('active');
      expect(result.data!.email_verified).toBe(false);
      expect(result.data!.id).toBeDefined();
    });

    it('should auto-create default settings for new user', async () => {
      const input: ICreateUserInput = {
        email: 'test@example.com',
        username: 'testuser',
      };

      const createResult = await repository.create(input);
      const settingsResult = await repository.getSettings(createResult.data!.id);

      expect(settingsResult.success).toBe(true);
      expect(settingsResult.data).toBeDefined();
      expect(settingsResult.data!.language).toBe('ko');
      expect(settingsResult.data!.currency).toBe('KRW');
    });

    it('should auto-create default stats for new user', async () => {
      const input: ICreateUserInput = {
        email: 'test@example.com',
        username: 'testuser',
      };

      const createResult = await repository.create(input);
      const statsResult = await repository.getStats(createResult.data!.id);

      expect(statsResult.success).toBe(true);
      expect(statsResult.data).toBeDefined();
      expect(statsResult.data!.total_trades).toBe(0);
      expect(statsResult.data!.win_rate).toBe(0);
    });

    it('should reject duplicate email', async () => {
      const input: ICreateUserInput = {
        email: 'test@example.com',
        username: 'testuser',
      };

      await repository.create(input);
      const result = await repository.create({
        email: 'test@example.com',
        username: 'anotheruser',
      });

      expect(result.success).toBe(false);
      expect(result.error!.message).toContain('already exists');
    });

    it('should reject duplicate username', async () => {
      const input: ICreateUserInput = {
        email: 'test1@example.com',
        username: 'testuser',
      };

      await repository.create(input);
      const result = await repository.create({
        email: 'test2@example.com',
        username: 'testuser',
      });

      expect(result.success).toBe(false);
      expect(result.error!.message).toContain('already exists');
    });

    it('should use default role if not provided', async () => {
      const input: ICreateUserInput = {
        email: 'test@example.com',
        username: 'testuser',
      };

      const result = await repository.create(input);

      expect(result.data!.role).toBe('free');
    });

    it('should include metadata', async () => {
      const input: ICreateUserInput = {
        email: 'test@example.com',
        username: 'testuser',
      };

      const result = await repository.create(input);

      expect(result.metadata).toBeDefined();
      expect(result.metadata!.timestamp).toBeDefined();
      expect(result.metadata!.duration_ms).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getById', () => {
    it('should get user by id', async () => {
      const input: ICreateUserInput = {
        email: 'test@example.com',
        username: 'testuser',
      };

      const createResult = await repository.create(input);
      const result = await repository.getById(createResult.data!.id);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.id).toBe(createResult.data!.id);
    });

    it('should return null for non-existent user', async () => {
      const result = await repository.getById('non-existent-id');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe('getByEmail', () => {
    it('should get user by email', async () => {
      const input: ICreateUserInput = {
        email: 'test@example.com',
        username: 'testuser',
      };

      await repository.create(input);
      const result = await repository.getByEmail('test@example.com');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.email).toBe('test@example.com');
    });

    it('should return null for non-existent email', async () => {
      const result = await repository.getByEmail('nonexistent@example.com');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe('getByUsername', () => {
    it('should get user by username', async () => {
      const input: ICreateUserInput = {
        email: 'test@example.com',
        username: 'testuser',
      };

      await repository.create(input);
      const result = await repository.getByUsername('testuser');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.username).toBe('testuser');
    });

    it('should return null for non-existent username', async () => {
      const result = await repository.getByUsername('nonexistent');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe('getAll', () => {
    it('should return all users', async () => {
      await repository.create({
        email: 'user1@example.com',
        username: 'user1',
      });
      await repository.create({
        email: 'user2@example.com',
        username: 'user2',
      });

      const result = await repository.getAll();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it('should return empty array when no users', async () => {
      const result = await repository.getAll();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const createResult = await repository.create({
        email: 'test@example.com',
        username: 'testuser',
      });

      const result = await repository.update(createResult.data!.id, {
        full_name: 'Updated Name',
        role: 'pro',
      });

      expect(result.success).toBe(true);
      expect(result.data!.full_name).toBe('Updated Name');
      expect(result.data!.role).toBe('pro');
    });

    it('should update username if not duplicate', async () => {
      const createResult = await repository.create({
        email: 'test@example.com',
        username: 'testuser',
      });

      const result = await repository.update(createResult.data!.id, {
        username: 'newusername',
      });

      expect(result.success).toBe(true);
      expect(result.data!.username).toBe('newusername');
    });

    it('should reject duplicate username on update', async () => {
      await repository.create({
        email: 'user1@example.com',
        username: 'user1',
      });
      const user2 = await repository.create({
        email: 'user2@example.com',
        username: 'user2',
      });

      const result = await repository.update(user2.data!.id, {
        username: 'user1', // Try to use user1's username
      });

      expect(result.success).toBe(false);
      expect(result.error!.message).toContain('already taken');
    });

    it('should return error for non-existent user', async () => {
      const result = await repository.update('non-existent-id', {
        full_name: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error!.message).toContain('not found');
    });

    it('should update timestamp', async () => {
      const createResult = await repository.create({
        email: 'test@example.com',
        username: 'testuser',
      });

      const originalTimestamp = createResult.data!.updated_at;

      // Small delay to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updateResult = await repository.update(createResult.data!.id, {
        full_name: 'Updated',
      });

      expect(updateResult.data!.updated_at).not.toBe(originalTimestamp);
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      const createResult = await repository.create({
        email: 'test@example.com',
        username: 'testuser',
      });

      const deleteResult = await repository.delete(createResult.data!.id);

      expect(deleteResult.success).toBe(true);
      expect(deleteResult.data).toBe(true);

      const getResult = await repository.getById(createResult.data!.id);
      expect(getResult.data).toBeNull();
    });

    it('should delete user settings and stats', async () => {
      const createResult = await repository.create({
        email: 'test@example.com',
        username: 'testuser',
      });

      await repository.delete(createResult.data!.id);

      const settingsResult = await repository.getSettings(createResult.data!.id);
      expect(settingsResult.data).toBeNull();

      const statsResult = await repository.getStats(createResult.data!.id);
      expect(statsResult.data).toBeNull();
    });

    it('should return error for non-existent user', async () => {
      const result = await repository.delete('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error!.message).toContain('not found');
    });
  });

  describe('saveSettings', () => {
    it('should save user settings', async () => {
      const createResult = await repository.create({
        email: 'test@example.com',
        username: 'testuser',
      });

      const settings: IUserSettings = {
        user_id: createResult.data!.id,
        language: 'en',
        timezone: 'America/New_York',
        currency: 'USD',
        notifications: {
          email_enabled: false,
          push_enabled: false,
          order_fills: false,
          price_alerts: false,
          daily_reports: false,
          weekly_reports: false,
        },
        trading: {
          default_execution_mode: 'live',
          require_order_confirmation: false,
          auto_stop_loss: true,
          auto_take_profit: true,
          show_risk_warnings: false,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = await repository.saveSettings(settings);

      expect(result.success).toBe(true);
      expect(result.data!.language).toBe('en');
      expect(result.data!.currency).toBe('USD');
    });

    it('should update existing settings', async () => {
      const createResult = await repository.create({
        email: 'test@example.com',
        username: 'testuser',
      });

      const existingSettings = await repository.getSettings(createResult.data!.id);

      const updated: IUserSettings = {
        ...existingSettings.data!,
        language: 'en',
      };

      const result = await repository.saveSettings(updated);

      expect(result.success).toBe(true);
      expect(result.data!.language).toBe('en');
    });
  });

  describe('getSettings', () => {
    it('should get user settings', async () => {
      const createResult = await repository.create({
        email: 'test@example.com',
        username: 'testuser',
      });

      const result = await repository.getSettings(createResult.data!.id);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.user_id).toBe(createResult.data!.id);
    });

    it('should return null for non-existent settings', async () => {
      const result = await repository.getSettings('non-existent-id');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe('saveStats', () => {
    it('should save user stats', async () => {
      const createResult = await repository.create({
        email: 'test@example.com',
        username: 'testuser',
      });

      const stats: IUserStats = {
        user_id: createResult.data!.id,
        total_trades: 100,
        winning_trades: 60,
        losing_trades: 40,
        win_rate: 60,
        total_profit: 5000,
        total_loss: 2000,
        net_profit: 3000,
        max_drawdown: 500,
        sharpe_ratio: 1.5,
        active_strategies: 3,
        active_positions: 2,
        calculated_at: new Date().toISOString(),
      };

      const result = await repository.saveStats(stats);

      expect(result.success).toBe(true);
      expect(result.data!.total_trades).toBe(100);
      expect(result.data!.win_rate).toBe(60);
      expect(result.data!.net_profit).toBe(3000);
    });
  });

  describe('getStats', () => {
    it('should get user stats', async () => {
      const createResult = await repository.create({
        email: 'test@example.com',
        username: 'testuser',
      });

      const result = await repository.getStats(createResult.data!.id);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.user_id).toBe(createResult.data!.id);
      expect(result.data!.total_trades).toBe(0); // Default
    });

    it('should return null for non-existent stats', async () => {
      const result = await repository.getStats('non-existent-id');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login time', async () => {
      const createResult = await repository.create({
        email: 'test@example.com',
        username: 'testuser',
      });

      const result = await repository.updateLastLogin(createResult.data!.id);

      expect(result.success).toBe(true);

      const getResult = await repository.getById(createResult.data!.id);
      expect(getResult.data!.last_login_at).toBeDefined();
    });

    it('should return error for non-existent user', async () => {
      const result = await repository.updateLastLogin('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error!.message).toContain('not found');
    });
  });

  describe('factory function', () => {
    it('should create repository via createUserRepository', async () => {
      const { createUserRepository } = await import('../repositories/user-repository.js');
      const repo = createUserRepository();

      const result = await repo.create({
        email: 'test@example.com',
        username: 'testuser',
      });

      expect(result.success).toBe(true);
    });
  });
});
