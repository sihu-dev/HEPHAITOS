/**
 * @hephaitos/core - ExchangeService Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ExchangeService, type IBrokerCredentials } from '../services/exchange-service.js';

describe('ExchangeService', () => {
  let service: ExchangeService;

  beforeEach(() => {
    service = new ExchangeService();
  });

  const mockCredentials: IBrokerCredentials = {
    provider: 'binance',
    apiKey: 'test-api-key',
    apiSecret: 'test-api-secret',
    isPaper: true,
  };

  describe('getBalance', () => {
    it('should fail when not connected', async () => {
      const result = await service.getBalance();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.message).toContain('Not connected');
    });
  });

  describe('getHoldings', () => {
    it('should fail when not connected', async () => {
      const result = await service.getHoldings();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.message).toContain('Not connected');
    });
  });

  describe('submitOrder', () => {
    it('should fail when not connected', async () => {
      const result = await service.submitOrder({
        symbol: 'BTCUSDT',
        side: 'buy',
        quantity: 0.001,
        orderType: 'market',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.message).toContain('Not connected');
    });
  });

  describe('cancelOrder', () => {
    it('should fail when not connected', async () => {
      const result = await service.cancelOrder('order-123');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.message).toContain('Not connected');
    });
  });

  describe('getOrderStatus', () => {
    it('should fail when not connected', async () => {
      const result = await service.getOrderStatus('order-123');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.message).toContain('Not connected');
    });
  });

  describe('healthCheck', () => {
    it('should fail when not connected', async () => {
      const result = await service.healthCheck();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.message).toContain('Not connected');
    });
  });

  describe('disconnect', () => {
    it('should fail when not connected', async () => {
      const result = await service.disconnect();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.message).toContain('Not connected');
    });
  });

  describe('metadata', () => {
    it('should include timestamp and duration in all results', async () => {
      const result = await service.getBalance();

      expect(result.metadata).toBeDefined();
      expect(result.metadata!.timestamp).toBeDefined();
      expect(result.metadata!.duration_ms).toBeGreaterThanOrEqual(0);
    });
  });

  describe('factory function', () => {
    it('should create service via createExchangeService', async () => {
      const { createExchangeService } = await import('../services/exchange-service.js');
      const service = createExchangeService();

      expect(service).toBeDefined();

      const result = await service.getBalance();
      expect(result.success).toBe(false); // Not connected
    });
  });

  // Note: Full integration tests with UnifiedBrokerV2 would require:
  // 1. Mocking the dynamic import of UnifiedBrokerV2
  // 2. Running in Node.js environment (not browser)
  // 3. Valid API credentials or mock broker implementation
  //
  // For now, we verify:
  // - Service instantiation works
  // - Methods return proper IResult format
  // - Error handling for disconnected state
  // - Metadata is included in all responses
});
