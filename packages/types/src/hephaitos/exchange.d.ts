/**
 * @hephaitos/types - HEPHAITOS Exchange Types
 * L0 (Atoms) - 거래소 관련 타입 정의
 */
/**
 * 지원 거래소 종류
 */
export type ExchangeType = 'binance' | 'upbit' | 'bithumb' | 'coinbase' | 'kraken';
/**
 * 거래소 기능
 */
export type ExchangeFeature = 'spot' | 'futures' | 'margin' | 'staking';
/**
 * 거래소 설정 인터페이스
 */
export interface IExchangeConfig {
    /** 거래소 타입 */
    type: ExchangeType;
    /** 거래소 표시명 */
    name: string;
    /** API 기본 URL */
    baseUrl: string;
    /** 분당 요청 제한 */
    rateLimit: number;
    /** 지원 기능 목록 */
    features: ExchangeFeature[];
}
/**
 * 거래소별 설정 상수
 */
export declare const EXCHANGE_CONFIGS: Record<ExchangeType, IExchangeConfig>;
//# sourceMappingURL=exchange.d.ts.map