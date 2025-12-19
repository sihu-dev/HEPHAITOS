/**
 * @hephaitos/types - HEPHAITOS Backtest Types
 * L0 (Atoms) - 백테스트 타입 정의
 */
import type { Timeframe } from './strategy.js';
import type { IRoundTrip } from './trade.js';
/**
 * 백테스트 상태
 */
export type BacktestStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
/**
 * 백테스트 설정
 */
export interface IBacktestConfig {
    /** 설정 ID */
    id: string;
    /** 전략 ID */
    strategyId: string;
    /** 대상 심볼 */
    symbols: string[];
    /** 타임프레임 */
    timeframe: Timeframe;
    /** 시작 일시 */
    startDate: string;
    /** 종료 일시 */
    endDate: string;
    /** 초기 자본 */
    initialCapital: number;
    /** 통화 */
    currency: string;
    /** 수수료율 (%) */
    feeRate: number;
    /** 슬리피지 (%) */
    slippage: number;
    /** 마진 사용 여부 */
    useMargin: boolean;
    /** 레버리지 (마진 사용 시) */
    leverage?: number;
}
/**
 * 자산 곡선 포인트
 */
export interface IEquityPoint {
    /** 타임스탬프 */
    timestamp: string;
    /** 자본 */
    equity: number;
    /** 현금 */
    cash: number;
    /** 포지션 가치 */
    positionValue: number;
    /** 낙폭 (%) */
    drawdown: number;
}
/**
 * 낙폭 기록
 */
export interface IDrawdownRecord {
    /** 시작 시간 */
    startTime: string;
    /** 바닥 시간 */
    troughTime: string;
    /** 회복 시간 (null이면 미회복) */
    recoveryTime: string | null;
    /** 고점 */
    peakEquity: number;
    /** 저점 */
    troughEquity: number;
    /** 낙폭 (%) */
    drawdownPercent: number;
    /** 회복 기간 (일) */
    recoveryDays: number | null;
}
/**
 * 성과 지표
 */
export interface IPerformanceMetrics {
    /** 총 수익률 (%) */
    totalReturn: number;
    /** 연환산 수익률 (%) */
    annualizedReturn: number;
    /** 월평균 수익률 (%) */
    monthlyReturn: number;
    /** 샤프 비율 (무위험수익률 2% 가정) */
    sharpeRatio: number;
    /** 소르티노 비율 */
    sortinoRatio: number;
    /** 칼마 비율 (수익률 / 최대낙폭) */
    calmarRatio: number;
    /** 최대 낙폭 (%) */
    maxDrawdown: number;
    /** 평균 낙폭 (%) */
    avgDrawdown: number;
    /** 최대 낙폭 기간 (일) */
    maxDrawdownDuration: number;
    /** 총 거래 수 */
    totalTrades: number;
    /** 승률 (%) */
    winRate: number;
    /** 손익비 (평균 이익 / 평균 손실) */
    profitFactor: number;
    /** 평균 이익 */
    avgWin: number;
    /** 평균 손실 */
    avgLoss: number;
    /** 최대 이익 */
    maxWin: number;
    /** 최대 손실 */
    maxLoss: number;
    /** 연속 승리 최대 */
    maxConsecutiveWins: number;
    /** 연속 패배 최대 */
    maxConsecutiveLosses: number;
    /** 평균 보유 기간 (일) */
    avgHoldingPeriod: number;
    /** 손익 표준편차 */
    pnlStdDev: number;
    /** 거래당 평균 손익 */
    avgTradeReturn: number;
    /** 기대값 (승률 × 평균이익 - 패률 × 평균손실) */
    expectancy: number;
}
/**
 * 월별 수익률
 */
export interface IMonthlyReturn {
    /** 연도 */
    year: number;
    /** 월 (1-12) */
    month: number;
    /** 수익률 (%) */
    return: number;
    /** 거래 수 */
    tradeCount: number;
}
/**
 * 백테스트 결과
 */
export interface IBacktestResult {
    /** 결과 ID */
    id: string;
    /** 설정 ID */
    configId: string;
    /** 전략 ID */
    strategyId: string;
    /** 상태 */
    status: BacktestStatus;
    /** 오류 메시지 (실패 시) */
    errorMessage?: string;
    /** 시작 시간 */
    startedAt: string;
    /** 완료 시간 */
    completedAt?: string;
    /** 실행 시간 (ms) */
    executionTimeMs?: number;
    /** 초기 자본 */
    initialCapital: number;
    /** 최종 자본 */
    finalCapital: number;
    /** 최고 자본 */
    peakCapital: number;
    /** 거래 내역 */
    trades: IRoundTrip[];
    /** 자산 곡선 */
    equityCurve: IEquityPoint[];
    /** 낙폭 기록 */
    drawdowns: IDrawdownRecord[];
    /** 월별 수익률 */
    monthlyReturns: IMonthlyReturn[];
    /** 성과 지표 */
    metrics: IPerformanceMetrics;
}
/**
 * 백테스트 요약 (목록용)
 */
export interface IBacktestSummary {
    id: string;
    strategyId: string;
    strategyName: string;
    status: BacktestStatus;
    startDate: string;
    endDate: string;
    totalReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
    totalTrades: number;
    completedAt?: string;
}
/**
 * 전략 비교 결과
 */
export interface IStrategyComparison {
    /** 비교 대상 백테스트 ID들 */
    backtestIds: string[];
    /** 기준 기간 */
    period: {
        start: string;
        end: string;
    };
    /** 전략별 요약 */
    summaries: IBacktestSummary[];
    /** 순위 (지표별) */
    rankings: {
        byReturn: string[];
        bySharpe: string[];
        byDrawdown: string[];
        byWinRate: string[];
    };
    /** 상관관계 매트릭스 */
    correlationMatrix?: number[][];
}
/**
 * 기본 백테스트 설정
 */
export declare const DEFAULT_BACKTEST_CONFIG: Omit<IBacktestConfig, 'id' | 'strategyId' | 'symbols' | 'startDate' | 'endDate'>;
//# sourceMappingURL=backtest.d.ts.map