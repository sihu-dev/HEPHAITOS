/**
 * @hephaitos/utils - Backtest Calculation Utilities
 * L1 (Molecules) - 백테스트 성과 지표 계산
 *
 * 순수 함수 기반 - 부작용 없음
 */
import type { IRoundTrip, IEquityPoint, IDrawdownRecord, IPerformanceMetrics, IMonthlyReturn } from '@hephaitos/types';
/**
 * 총 수익률 계산
 */
export declare function calculateTotalReturn(initialCapital: number, finalCapital: number): number;
/**
 * 연환산 수익률 (CAGR)
 */
export declare function calculateAnnualizedReturn(totalReturn: number, tradingDays: number): number;
/**
 * 일별 수익률 계산
 */
export declare function calculateDailyReturns(equityCurve: IEquityPoint[]): number[];
/**
 * 샤프 비율 계산
 *
 * (연환산 수익률 - 무위험수익률) / 연환산 변동성
 */
export declare function calculateSharpeRatio(dailyReturns: number[]): number;
/**
 * 소르티노 비율 계산
 *
 * 하방 변동성만 고려 (손실만)
 */
export declare function calculateSortinoRatio(dailyReturns: number[]): number;
/**
 * 칼마 비율 계산
 *
 * 연환산 수익률 / 최대 낙폭
 */
export declare function calculateCalmarRatio(annualizedReturn: number, maxDrawdown: number): number;
/**
 * 낙폭 시리즈 계산
 */
export declare function calculateDrawdownSeries(equityCurve: IEquityPoint[]): number[];
/**
 * 최대 낙폭 계산
 */
export declare function calculateMaxDrawdown(equityCurve: IEquityPoint[]): number;
/**
 * 평균 낙폭 계산
 */
export declare function calculateAvgDrawdown(equityCurve: IEquityPoint[]): number;
/**
 * 낙폭 기록 추출
 */
export declare function extractDrawdownRecords(equityCurve: IEquityPoint[]): IDrawdownRecord[];
/**
 * 승률 계산
 */
export declare function calculateWinRate(trades: IRoundTrip[]): number;
/**
 * 손익비 (Profit Factor) 계산
 *
 * 총 이익 / 총 손실
 */
export declare function calculateProfitFactor(trades: IRoundTrip[]): number;
/**
 * 평균 이익/손실 계산
 */
export declare function calculateAvgWinLoss(trades: IRoundTrip[]): {
    avgWin: number;
    avgLoss: number;
    maxWin: number;
    maxLoss: number;
};
/**
 * 연속 승/패 계산
 */
export declare function calculateConsecutiveWinsLosses(trades: IRoundTrip[]): {
    maxConsecutiveWins: number;
    maxConsecutiveLosses: number;
};
/**
 * 기대값 (Expectancy) 계산
 *
 * 승률 × 평균이익 - 패률 × 평균손실
 */
export declare function calculateExpectancy(trades: IRoundTrip[]): number;
/**
 * 평균 보유 기간 계산 (일)
 */
export declare function calculateAvgHoldingPeriod(trades: IRoundTrip[]): number;
/**
 * 월별 수익률 계산
 */
export declare function calculateMonthlyReturns(equityCurve: IEquityPoint[], trades: IRoundTrip[]): IMonthlyReturn[];
/**
 * 전체 성과 지표 계산
 */
export declare function calculatePerformanceMetrics(initialCapital: number, finalCapital: number, equityCurve: IEquityPoint[], trades: IRoundTrip[]): IPerformanceMetrics;
//# sourceMappingURL=backtest-calc.d.ts.map