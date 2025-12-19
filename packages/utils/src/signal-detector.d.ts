/**
 * @hephaitos/utils - Signal Detection Utilities
 * L1 (Molecules) - 전략 시그널 감지
 *
 * 순수 함수 기반 - 부작용 없음
 */
import type { IOHLCV, ICondition, IConditionGroup, IIndicatorConfig, ComparisonOperator } from '@hephaitos/types';
/**
 * 단순 이동 평균 (SMA)
 */
export declare function calculateSMA(closes: number[], period: number): number[];
/**
 * 지수 이동 평균 (EMA)
 */
export declare function calculateEMA(closes: number[], period: number): number[];
/**
 * RSI (Relative Strength Index)
 */
export declare function calculateRSI(closes: number[], period?: number): number[];
/**
 * MACD
 */
export declare function calculateMACD(closes: number[], fastPeriod?: number, slowPeriod?: number, signalPeriod?: number): {
    macd: number[];
    signal: number[];
    histogram: number[];
};
/**
 * 볼린저 밴드
 */
export declare function calculateBollingerBands(closes: number[], period?: number, stdDevMultiplier?: number): {
    upper: number[];
    middle: number[];
    lower: number[];
};
/**
 * ATR (Average True Range)
 */
export declare function calculateATR(candles: IOHLCV[], period?: number): number[];
/**
 * 지표 설정에 따른 값 시리즈 계산
 */
export declare function getIndicatorValues(candles: IOHLCV[], config: IIndicatorConfig): number[];
/**
 * 비교 연산자 평가
 */
export declare function evaluateComparison(leftValue: number, operator: ComparisonOperator, rightValue: number, prevLeftValue?: number, prevRightValue?: number): boolean;
/**
 * 단일 조건 평가
 */
export declare function evaluateCondition(candles: IOHLCV[], condition: ICondition, index: number): boolean;
/**
 * 조건 그룹 평가 (재귀)
 */
export declare function evaluateConditionGroup(candles: IOHLCV[], group: IConditionGroup, index: number): boolean;
/**
 * 진입 시그널 감지
 */
export declare function detectEntrySignal(candles: IOHLCV[], entryConditions: IConditionGroup, currentIndex: number): boolean;
/**
 * 청산 시그널 감지
 */
export declare function detectExitSignal(candles: IOHLCV[], exitConditions: IConditionGroup, currentIndex: number, entryPrice: number, stopLossPercent?: number, takeProfitPercent?: number): {
    exit: boolean;
    reason: 'condition' | 'stop_loss' | 'take_profit';
} | null;
//# sourceMappingURL=signal-detector.d.ts.map