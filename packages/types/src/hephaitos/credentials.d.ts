/**
 * @hephaitos/types - HEPHAITOS Credentials Types
 * L0 (Atoms) - API 자격증명 타입 정의
 */
import type { ExchangeType } from './exchange.js';
/**
 * API 권한 종류
 */
export type CredentialPermission = 'read_balance' | 'read_history' | 'trade' | 'withdraw';
/**
 * 거래소 API 자격증명 인터페이스
 */
export interface IExchangeCredentials {
    /** 거래소 종류 */
    exchange: ExchangeType;
    /** API 키 */
    api_key: string;
    /** API 시크릿 */
    api_secret: string;
    /** Coinbase 전용 패스프레이즈 */
    passphrase?: string;
    /** 서브계정명 */
    subaccount?: string;
}
/**
 * 자격증명 검증 결과 인터페이스
 */
export interface ICredentialValidation {
    /** 유효 여부 */
    valid: boolean;
    /** 부여된 권한 목록 */
    permissions: CredentialPermission[];
    /** 에러 메시지 (실패 시) */
    error?: string;
}
/**
 * 암호화된 자격증명 저장 형식
 */
export interface IEncryptedCredentials {
    /** 거래소 종류 */
    exchange: ExchangeType;
    /** 암호화된 API 키 */
    encrypted_key: string;
    /** 암호화된 시크릿 */
    encrypted_secret: string;
    /** 암호화 알고리즘 */
    algorithm: 'aes-256-gcm';
    /** 초기화 벡터 */
    iv: string;
    /** 인증 태그 */
    auth_tag: string;
}
/**
 * 권장 권한 (읽기 전용)
 */
export declare const RECOMMENDED_PERMISSIONS: CredentialPermission[];
//# sourceMappingURL=credentials.d.ts.map