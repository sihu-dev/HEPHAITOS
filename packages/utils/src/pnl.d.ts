/**
 * @hephaitos/utils - PnL (Profit & Loss) Utilities
 * L1 (Molecules) - 손익 계산 유틸리티
 */
import type { IAsset, IPortfolioSnapshot } from '@hephaitos/types';
/**
 * PnL 계산 결과 타입
 */
export interface IPnLResult {
    /** 절대 손익 (USD) */
    absolute: number;
    /** 손익률 (%) */
    percentage: number;
    /** 비용 기준 */
    cost_basis: number;
    /** 현재 가치 */
    current_value: number;
}
/**
 * 기간별 수익률 타입
 */
export interface IPeriodReturn {
    period: '1d' | '7d' | '30d' | '90d' | '1y' | 'all';
    return_usd: number;
    return_percent: number;
    start_value: number;
    end_value: number;
}
/**
 * 단일 자산의 미실현 손익 계산
 *
 * @param asset - 자산 정보
 * @returns PnL 계산 결과
 */
export declare function calculateAssetPnL(asset: IAsset): IPnLResult;
/**
 * 포트폴리오 전체 손익 계산
 *
 * @param assets - 자산 목록
 * @returns PnL 계산 결과
 */
export declare function calculatePortfolioPnL(assets: IAsset[]): IPnLResult;
/**
 * 두 스냅샷 간의 수익률 계산
 *
 * @param startSnapshot - 시작 시점 스냅샷
 * @param endSnapshot - 종료 시점 스냅샷
 * @returns 수익률 결과
 */
export declare function calculateSnapshotReturn(startSnapshot: IPortfolioSnapshot, endSnapshot: IPortfolioSnapshot): IPnLResult;
/**
 * 기간별 수익률 계산
 *
 * @param snapshots - 시간순 정렬된 스냅샷 배열
 * @param currentValue - 현재 포트폴리오 가치
 * @returns 기간별 수익률 배열
 */
export declare function calculatePeriodReturns(snapshots: IPortfolioSnapshot[], currentValue: number): IPeriodReturn[];
/**
 * 샤프 비율 계산 (간략화)
 *
 * @param returns - 일별 수익률 배열 (%)
 * @param riskFreeRate - 무위험 이자율 (연간 %, 기본: 4%)
 * @returns 샤프 비율
 */
export declare function calculateSharpeRatio(returns: number[], riskFreeRate?: number): number;
/**
 * 최대 낙폭 (MDD) 계산
 *
 * @param values - 시계열 가치 데이터
 * @returns 최대 낙폭 (%)
 */
export declare function calculateMaxDrawdown(values: number[]): number;
//# sourceMappingURL=pnl.d.ts.map