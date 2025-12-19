/**
 * @hephaitos/utils - Validation Utilities
 * L1 (Molecules) - 입력 검증 유틸리티
 */
import type { ExchangeType } from '@hephaitos/types';
/**
 * 검증 결과 타입
 */
export interface IValidationResult {
    valid: boolean;
    errors: string[];
}
/**
 * API 키 형식 검증
 *
 * @param exchange - 거래소 종류
 * @param apiKey - API 키
 * @param apiSecret - API 시크릿
 * @returns 검증 결과
 *
 * @example
 * const result = validateApiKey('binance', key, secret);
 * if (!result.valid) {
 *   console.error(result.errors);
 * }
 */
export declare function validateApiKey(exchange: ExchangeType, apiKey: string, apiSecret: string): IValidationResult;
/**
 * 암호화폐 심볼 검증
 *
 * @param symbol - 심볼 (예: BTC, ETH)
 * @returns 유효 여부
 */
export declare function isValidSymbol(symbol: string): boolean;
/**
 * 양수 금액 검증
 *
 * @param amount - 금액
 * @returns 유효 여부
 */
export declare function isValidAmount(amount: number): boolean;
/**
 * UUID 형식 검증
 *
 * @param uuid - UUID 문자열
 * @returns 유효 여부
 */
export declare function isValidUUID(uuid: string): boolean;
/**
 * ISO 8601 타임스탬프 검증
 *
 * @param timestamp - 타임스탬프 문자열
 * @returns 유효 여부
 */
export declare function isValidTimestamp(timestamp: string): boolean;
/**
 * 이메일 형식 검증
 *
 * @param email - 이메일 주소
 * @returns 유효 여부
 */
export declare function isValidEmail(email: string): boolean;
/**
 * 포트폴리오 이름 검증
 *
 * @param name - 포트폴리오 이름
 * @returns 검증 결과
 */
export declare function validatePortfolioName(name: string): IValidationResult;
/**
 * 객체 필수 필드 검증
 *
 * @param obj - 검증할 객체
 * @param requiredFields - 필수 필드 목록
 * @returns 검증 결과
 */
export declare function validateRequiredFields(obj: Record<string, unknown>, requiredFields: string[]): IValidationResult;
//# sourceMappingURL=validation.d.ts.map