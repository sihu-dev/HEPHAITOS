/**
 * @hephaitos/core - CredentialsService Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CredentialsService } from '../services/credentials-service.js';
import type { IExchangeCredentials } from '@hephaitos/types';

describe('CredentialsService', () => {
  let service: CredentialsService;
  const testMasterKey = 'test-master-key-32-bytes-long!!';

  beforeEach(() => {
    service = new CredentialsService(testMasterKey);
  });

  describe('encrypt', () => {
    it('should encrypt API credentials successfully', async () => {
      const credentials: IExchangeCredentials = {
        exchange: 'binance',
        api_key: 'test-api-key-123',
        api_secret: 'test-api-secret-456',
      };

      const result = await service.encrypt(credentials);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.exchange).toBe('binance');
      expect(result.data!.encrypted_key).toBeDefined();
      expect(result.data!.encrypted_secret).toBeDefined();
      expect(result.data!.algorithm).toBe('aes-256-gcm');
      expect(result.data!.iv).toBeDefined();
      expect(result.data!.auth_tag).toBeDefined();
    });

    it('should generate different encrypted values for same input', async () => {
      const credentials: IExchangeCredentials = {
        exchange: 'binance',
        api_key: 'test-api-key',
        api_secret: 'test-api-secret',
      };

      const result1 = await service.encrypt(credentials);
      const result2 = await service.encrypt(credentials);

      // IV가 매번 달라서 암호화 결과도 달라야 함
      expect(result1.data!.encrypted_key).not.toBe(result2.data!.encrypted_key);
      expect(result1.data!.encrypted_secret).not.toBe(result2.data!.encrypted_secret);
      expect(result1.data!.iv).not.toBe(result2.data!.iv);
    });

    it('should include metadata with timestamp and duration', async () => {
      const credentials: IExchangeCredentials = {
        exchange: 'upbit',
        api_key: 'key',
        api_secret: 'secret',
      };

      const result = await service.encrypt(credentials);

      expect(result.metadata).toBeDefined();
      expect(result.metadata!.timestamp).toBeDefined();
      expect(result.metadata!.duration_ms).toBeGreaterThanOrEqual(0);
    });

    it('should separate IVs for key and secret', async () => {
      const credentials: IExchangeCredentials = {
        exchange: 'binance',
        api_key: 'key',
        api_secret: 'secret',
      };

      const result = await service.encrypt(credentials);

      // IV는 "keyIv:secretIv" 형식
      const ivParts = result.data!.iv.split(':');
      expect(ivParts).toHaveLength(2);
      expect(ivParts[0]).not.toBe(ivParts[1]); // 두 IV는 달라야 함
    });

    it('should separate auth tags for key and secret', async () => {
      const credentials: IExchangeCredentials = {
        exchange: 'binance',
        api_key: 'key',
        api_secret: 'secret',
      };

      const result = await service.encrypt(credentials);

      // auth_tag는 "keyTag:secretTag" 형식
      const tagParts = result.data!.auth_tag.split(':');
      expect(tagParts).toHaveLength(2);
      expect(tagParts[0]).not.toBe(tagParts[1]);
    });
  });

  describe('decrypt', () => {
    it('should decrypt encrypted credentials successfully', async () => {
      const original: IExchangeCredentials = {
        exchange: 'binance',
        api_key: 'my-api-key-12345',
        api_secret: 'my-api-secret-67890',
      };

      const encrypted = await service.encrypt(original);
      const decrypted = await service.decrypt(encrypted.data!);

      expect(decrypted.success).toBe(true);
      expect(decrypted.data).toBeDefined();
      expect(decrypted.data!.exchange).toBe(original.exchange);
      expect(decrypted.data!.api_key).toBe(original.api_key);
      expect(decrypted.data!.api_secret).toBe(original.api_secret);
    });

    it('should handle multiple encrypt/decrypt cycles', async () => {
      const original: IExchangeCredentials = {
        exchange: 'upbit',
        api_key: 'key-abc',
        api_secret: 'secret-xyz',
      };

      // 여러 번 암호화/복호화 반복
      for (let i = 0; i < 3; i++) {
        const encrypted = await service.encrypt(original);
        const decrypted = await service.decrypt(encrypted.data!);

        expect(decrypted.data!.api_key).toBe(original.api_key);
        expect(decrypted.data!.api_secret).toBe(original.api_secret);
      }
    });

    it('should fail with wrong auth tag', async () => {
      const original: IExchangeCredentials = {
        exchange: 'binance',
        api_key: 'key',
        api_secret: 'secret',
      };

      const encrypted = await service.encrypt(original);

      // auth_tag를 임의로 변경
      const tampered = {
        ...encrypted.data!,
        auth_tag: '0000000000000000:1111111111111111',
      };

      const result = await service.decrypt(tampered);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should fail with corrupted encrypted data', async () => {
      const original: IExchangeCredentials = {
        exchange: 'binance',
        api_key: 'key',
        api_secret: 'secret',
      };

      const encrypted = await service.encrypt(original);

      // 암호화된 키를 임의로 변경
      const corrupted = {
        ...encrypted.data!,
        encrypted_key: 'corrupted-data-xxx',
      };

      const result = await service.decrypt(corrupted);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should include metadata in decryption result', async () => {
      const original: IExchangeCredentials = {
        exchange: 'binance',
        api_key: 'key',
        api_secret: 'secret',
      };

      const encrypted = await service.encrypt(original);
      const decrypted = await service.decrypt(encrypted.data!);

      expect(decrypted.metadata).toBeDefined();
      expect(decrypted.metadata!.timestamp).toBeDefined();
      expect(decrypted.metadata!.duration_ms).toBeGreaterThanOrEqual(0);
    });
  });

  describe('validate', () => {
    it('should return validation result (mock)', async () => {
      const credentials: IExchangeCredentials = {
        exchange: 'binance',
        api_key: 'key',
        api_secret: 'secret',
      };

      const result = await service.validate(credentials);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.valid).toBe(true);
      expect(result.data!.permissions).toBeDefined();
      expect(Array.isArray(result.data!.permissions)).toBe(true);
    });

    it('should include metadata in validation result', async () => {
      const credentials: IExchangeCredentials = {
        exchange: 'upbit',
        api_key: 'key',
        api_secret: 'secret',
      };

      const result = await service.validate(credentials);

      expect(result.metadata).toBeDefined();
      expect(result.metadata!.timestamp).toBeDefined();
      expect(result.metadata!.duration_ms).toBeGreaterThanOrEqual(0);
    });
  });

  describe('different master keys', () => {
    it('should fail to decrypt with different master key', async () => {
      const service1 = new CredentialsService('master-key-1');
      const service2 = new CredentialsService('master-key-2');

      const original: IExchangeCredentials = {
        exchange: 'binance',
        api_key: 'key',
        api_secret: 'secret',
      };

      const encrypted = await service1.encrypt(original);
      const decrypted = await service2.decrypt(encrypted.data!);

      // 다른 마스터 키로는 복호화 불가
      expect(decrypted.success).toBe(false);
      expect(decrypted.error).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty api_key and api_secret', async () => {
      const credentials: IExchangeCredentials = {
        exchange: 'binance',
        api_key: '',
        api_secret: '',
      };

      const encrypted = await service.encrypt(credentials);
      const decrypted = await service.decrypt(encrypted.data!);

      expect(decrypted.success).toBe(true);
      expect(decrypted.data!.api_key).toBe('');
      expect(decrypted.data!.api_secret).toBe('');
    });

    it('should handle long api credentials', async () => {
      const credentials: IExchangeCredentials = {
        exchange: 'binance',
        api_key: 'a'.repeat(500), // 500자
        api_secret: 'b'.repeat(500),
      };

      const encrypted = await service.encrypt(credentials);
      const decrypted = await service.decrypt(encrypted.data!);

      expect(decrypted.success).toBe(true);
      expect(decrypted.data!.api_key).toBe(credentials.api_key);
      expect(decrypted.data!.api_secret).toBe(credentials.api_secret);
    });

    it('should handle special characters in credentials', async () => {
      const credentials: IExchangeCredentials = {
        exchange: 'binance',
        api_key: 'key-with-!@#$%^&*()_+-=[]{}|;:,.<>?',
        api_secret: 'secret-with-émojis-🔐🔑',
      };

      const encrypted = await service.encrypt(credentials);
      const decrypted = await service.decrypt(encrypted.data!);

      expect(decrypted.success).toBe(true);
      expect(decrypted.data!.api_key).toBe(credentials.api_key);
      expect(decrypted.data!.api_secret).toBe(credentials.api_secret);
    });
  });

  describe('factory function', () => {
    it('should create service via createCredentialsService', async () => {
      const { createCredentialsService } = await import('../services/credentials-service.js');
      const service = createCredentialsService('test-key');

      const credentials: IExchangeCredentials = {
        exchange: 'binance',
        api_key: 'key',
        api_secret: 'secret',
      };

      const result = await service.encrypt(credentials);

      expect(result.success).toBe(true);
    });
  });
});
