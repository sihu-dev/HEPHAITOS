/**
 * @hephaitos/utils - Balance Utilities
 * L1 (Molecules) - 잔고 정규화 유틸리티
 */
import type { IAsset, ExchangeType } from '@hephaitos/types';
/**
 * 거래소 원본 잔고 데이터를 표준 IAsset 형식으로 정규화
 *
 * @param exchange - 거래소 종류
 * @param rawBalances - 거래소 원본 잔고 데이터
 * @param prices - 심볼별 USD 가격 맵
 * @returns 정규화된 IAsset 배열
 *
 * @example
 * const assets = normalizeBalance('binance', binanceResponse, priceMap);
 */
export declare function normalizeBalance(exchange: ExchangeType, rawBalances: unknown[], prices: Map<string, number>): IAsset[];
/**
 * 자산 목록의 총 가치 계산
 */
export declare function calculateTotalValue(assets: IAsset[]): number;
/**
 * 자산 목록을 가치 기준 내림차순 정렬
 */
export declare function sortByValue(assets: IAsset[]): IAsset[];
/**
 * 최소 가치 이하 자산 필터링 (더스트 제거)
 */
export declare function filterDust(assets: IAsset[], minValueUsd?: number): IAsset[];
//# sourceMappingURL=balance.d.ts.map