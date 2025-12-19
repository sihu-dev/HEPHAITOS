/**
 * @hephaitos/types - HEPHAITOS Strategy Types
 * L0 (Atoms) - 트레이딩 전략 타입 정의
 */
/**
 * 전략 타입
 */
export type StrategyType = 'trend_following' | 'mean_reversion' | 'momentum' | 'breakout' | 'grid' | 'dca' | 'custom';
/**
 * 타임프레임
 */
export type Timeframe = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w' | '1M';
/**
 * 비교 연산자
 */
export type ComparisonOperator = 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq' | 'cross_above' | 'cross_below';
/**
 * 지표 타입
 */
export type IndicatorType = 'price' | 'sma' | 'ema' | 'rsi' | 'macd' | 'bollinger' | 'atr' | 'volume' | 'vwap';
/**
 * 지표 설정
 */
export interface IIndicatorConfig {
    type: IndicatorType;
    period?: number;
    source?: 'open' | 'high' | 'low' | 'close';
    params?: Record<string, number>;
}
/**
 * 조건 정의
 */
export interface ICondition {
    /** 좌변 지표 */
    left: IIndicatorConfig;
    /** 비교 연산자 */
    operator: ComparisonOperator;
    /** 우변 (지표 또는 상수) */
    right: IIndicatorConfig | number;
}
/**
 * 조건 그룹 (AND/OR)
 */
export interface IConditionGroup {
    /** 논리 연산자 */
    logic: 'and' | 'or';
    /** 조건들 */
    conditions: (ICondition | IConditionGroup)[];
}
/**
 * 포지션 사이징 타입
 */
export type PositionSizingType = 'fixed_amount' | 'fixed_percent' | 'kelly' | 'risk_based';
/**
 * 포지션 사이징 설정
 */
export interface IPositionSizing {
    type: PositionSizingType;
    /** 고정 금액 (fixed_amount) */
    amount?: number;
    /** 자본 대비 비율 (fixed_percent) */
    percent?: number;
    /** 최대 리스크 비율 (risk_based) */
    maxRiskPercent?: number;
}
/**
 * 리스크 관리 설정
 */
export interface IRiskManagement {
    /** 손절 비율 (%) */
    stopLossPercent?: number;
    /** 익절 비율 (%) */
    takeProfitPercent?: number;
    /** 트레일링 스탑 비율 (%) */
    trailingStopPercent?: number;
    /** 최대 동시 포지션 수 */
    maxPositions?: number;
    /** 최대 자본 사용 비율 (%) */
    maxCapitalUsage?: number;
    /** 일일 최대 손실 비율 (%) */
    dailyMaxLoss?: number;
}
/**
 * 트레이딩 전략
 */
export interface IStrategy {
    /** 전략 ID */
    id: string;
    /** 전략 이름 */
    name: string;
    /** 설명 */
    description: string;
    /** 전략 타입 */
    type: StrategyType;
    /** 버전 */
    version: string;
    /** 타임프레임 */
    timeframe: Timeframe;
    /** 대상 심볼 (빈 배열이면 모든 심볼) */
    symbols: string[];
    /** 진입 조건 */
    entryConditions: IConditionGroup;
    /** 청산 조건 */
    exitConditions: IConditionGroup;
    /** 포지션 사이징 */
    positionSizing: IPositionSizing;
    /** 리스크 관리 */
    riskManagement: IRiskManagement;
    /** 메타데이터 */
    metadata: {
        createdAt: string;
        updatedAt: string;
        createdBy?: string;
        tags?: string[];
    };
}
/**
 * 전략 생성 입력
 */
export type ICreateStrategyInput = Omit<IStrategy, 'id' | 'metadata'>;
/**
 * 기본 전략 템플릿
 */
export declare const STRATEGY_TEMPLATES: Record<string, Partial<IStrategy>>;
//# sourceMappingURL=strategy.d.ts.map