/**
 * @hephaitos/core - Credentials Service
 * L2 (Cells) - API 자격증명 암호화/복호화 서비스
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import type {
  IExchangeCredentials,
  IEncryptedCredentials,
  ICredentialValidation,
  IResult,
} from '@hephaitos/types';

/**
 * 자격증명 서비스 인터페이스
 */
export interface ICredentialsService {
  /** API 키/시크릿 암호화 */
  encrypt(credentials: IExchangeCredentials): Promise<IResult<IEncryptedCredentials>>;

  /** 암호화된 자격증명 복호화 */
  decrypt(encrypted: IEncryptedCredentials): Promise<IResult<IExchangeCredentials>>;

  /** 자격증명 검증 (거래소 API 호출) */
  validate(credentials: IExchangeCredentials): Promise<IResult<ICredentialValidation>>;
}

/**
 * 자격증명 서비스 구현
 */
export class CredentialsService implements ICredentialsService {
  private readonly algorithm = 'aes-256-gcm' as const;
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly masterKey: Buffer;

  constructor(masterKey?: string) {
    // 마스터 키 설정 (환경변수 또는 기본값)
    const key = masterKey || process.env.ENCRYPTION_MASTER_KEY || 'default-dev-key-change-in-prod';

    // 키를 32바이트로 정규화 (SHA-256 해시 사용하면 더 좋음)
    this.masterKey = Buffer.alloc(this.keyLength);
    Buffer.from(key).copy(this.masterKey);
  }

  async encrypt(credentials: IExchangeCredentials): Promise<IResult<IEncryptedCredentials>> {
    const startTime = Date.now();
    try {
      // IV 생성 (각 암호화마다 고유해야 함)
      const iv = randomBytes(this.ivLength);

      // API 키 암호화
      const keycipher = createCipheriv(this.algorithm, this.masterKey, iv);
      let encryptedKey = keycipher.update(credentials.api_key, 'utf8', 'hex');
      encryptedKey += keycipher.final('hex');
      const keyAuthTag = keycipher.getAuthTag();

      // API 시크릿 암호화 (다른 IV 사용)
      const secretIv = randomBytes(this.ivLength);
      const secretCipher = createCipheriv(this.algorithm, this.masterKey, secretIv);
      let encryptedSecret = secretCipher.update(credentials.api_secret, 'utf8', 'hex');
      encryptedSecret += secretCipher.final('hex');
      const secretAuthTag = secretCipher.getAuthTag();

      // 암호화된 자격증명 객체 생성
      const encrypted: IEncryptedCredentials = {
        exchange: credentials.exchange,
        encrypted_key: encryptedKey,
        encrypted_secret: encryptedSecret,
        algorithm: this.algorithm,
        iv: `${iv.toString('hex')}:${secretIv.toString('hex')}`, // 두 IV를 결합
        auth_tag: `${keyAuthTag.toString('hex')}:${secretAuthTag.toString('hex')}`, // 두 태그를 결합
      };

      return {
        success: true,
        data: encrypted,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  async decrypt(encrypted: IEncryptedCredentials): Promise<IResult<IExchangeCredentials>> {
    const startTime = Date.now();
    try {
      // IV와 auth tag 분리
      const [keyIv, secretIv] = encrypted.iv.split(':').map(hex => Buffer.from(hex, 'hex'));
      const [keyAuthTag, secretAuthTag] = encrypted.auth_tag.split(':').map(hex => Buffer.from(hex, 'hex'));

      // API 키 복호화
      const keyDecipher = createDecipheriv(this.algorithm, this.masterKey, keyIv);
      keyDecipher.setAuthTag(keyAuthTag);
      let apiKey = keyDecipher.update(encrypted.encrypted_key, 'hex', 'utf8');
      apiKey += keyDecipher.final('utf8');

      // API 시크릿 복호화
      const secretDecipher = createDecipheriv(this.algorithm, this.masterKey, secretIv);
      secretDecipher.setAuthTag(secretAuthTag);
      let apiSecret = secretDecipher.update(encrypted.encrypted_secret, 'hex', 'utf8');
      apiSecret += secretDecipher.final('utf8');

      // 복호화된 자격증명 객체 생성
      const credentials: IExchangeCredentials = {
        exchange: encrypted.exchange,
        api_key: apiKey,
        api_secret: apiSecret,
      };

      return {
        success: true,
        data: credentials,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  async validate(credentials: IExchangeCredentials): Promise<IResult<ICredentialValidation>> {
    const startTime = Date.now();
    try {
      // TODO: 실제 거래소 API 호출하여 검증
      // 현재는 Mock 구현
      const validation: ICredentialValidation = {
        valid: true,
        permissions: ['read_balance', 'read_history'],
      };

      return {
        success: true,
        data: validation,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }
}

/**
 * 팩토리 함수 - CredentialsService 생성
 */
export function createCredentialsService(masterKey?: string): ICredentialsService {
  return new CredentialsService(masterKey);
}
