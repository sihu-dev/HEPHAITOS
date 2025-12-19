/**
 * @hephaitos/types - HEPHAITOS Strategy Types
 * L0 (Atoms) - 트레이딩 전략 타입 정의
 */

/**
 * 전략 타입
 */
export type StrategyType =
  | 'trend_following'    // 추세 추종
  | 'mean_reversion'     // 평균 회귀
  | 'momentum'           // 모멘텀
  | 'breakout'           // 돌파
  | 'grid'               // 그리드
  | 'dca'                // 분할 매수
  | 'custom';            // 커스텀

/**
 * 타임프레임
 */
export type Timeframe =
  | '1m' | '5m' | '15m' | '30m'
  | '1h' | '4h'
  | '1d' | '1w' | '1M';

/**
 * 비교 연산자
 */
export type ComparisonOperator =
  | 'gt'      // greater than
  | 'gte'     // greater than or equal
  | 'lt'      // less than
  | 'lte'     // less than or equal
  | 'eq'      // equal
  | 'neq'     // not equal
  | 'cross_above'  // 상향 돌파
  | 'cross_below'; // 하향 돌파

/**
 * 지표 타입
 */
export type IndicatorType =
  | 'price'           // 가격
  | 'sma'             // 단순이동평균
  | 'ema'             // 지수이동평균
  | 'rsi'             // RSI
  | 'macd'            // MACD
  | 'bollinger'       // 볼린저밴드
  | 'atr'             // ATR
  | 'volume'          // 거래량
  | 'vwap';           // VWAP

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
export type PositionSizingType =
  | 'fixed_amount'     // 고정 금액
  | 'fixed_percent'    // 고정 비율
  | 'kelly'            // 켈리 공식
  | 'risk_based';      // 리스크 기반

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
export const STRATEGY_TEMPLATES: Record<string, Partial<IStrategy>> = {
  /** 골든 크로스 전략 */
  golden_cross: {
    name: '골든 크로스',
    type: 'trend_following',
    timeframe: '1d',
    entryConditions: {
      logic: 'and',
      conditions: [
        {
          left: { type: 'sma', period: 50 },
          operator: 'cross_above',
          right: { type: 'sma', period: 200 },
        },
      ],
    },
    exitConditions: {
      logic: 'or',
      conditions: [
        {
          left: { type: 'sma', period: 50 },
          operator: 'cross_below',
          right: { type: 'sma', period: 200 },
        },
      ],
    },
  },

  /** RSI 과매도 반등 */
  rsi_oversold: {
    name: 'RSI 과매도 반등',
    type: 'mean_reversion',
    timeframe: '4h',
    entryConditions: {
      logic: 'and',
      conditions: [
        {
          left: { type: 'rsi', period: 14 },
          operator: 'cross_above',
          right: 30,
        },
      ],
    },
    exitConditions: {
      logic: 'or',
      conditions: [
        {
          left: { type: 'rsi', period: 14 },
          operator: 'gt',
          right: 70,
        },
      ],
    },
  },

  /** 볼린저밴드 돌파 */
  bollinger_breakout: {
    name: '볼린저밴드 돌파',
    type: 'breakout',
    timeframe: '1h',
    entryConditions: {
      logic: 'and',
      conditions: [
        {
          left: { type: 'price', source: 'close' },
          operator: 'cross_above',
          right: { type: 'bollinger', params: { period: 20, stdDev: 2, band: 1 } }, // upper
        },
      ],
    },
    exitConditions: {
      logic: 'or',
      conditions: [
        {
          left: { type: 'price', source: 'close' },
          operator: 'cross_below',
          right: { type: 'bollinger', params: { period: 20, stdDev: 2, band: 0 } }, // middle
        },
      ],
    },
  },
} as const;
