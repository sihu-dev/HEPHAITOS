/**
 * @hephaitos/types - HEPHAITOS Order Execution Types
 * L0 (Atoms) - 주문 실행 관련 확장 타입 정의
 *
 * 기본 주문/포지션 타입은 trade.ts에 정의됨
 * 여기서는 실행 관련 확장 타입만 정의
 */

import type { OrderSide, OrderType, IOrder, IPosition, ITrade } from './trade.js';

// ═══════════════════════════════════════════════════════════════
// 주문 요청 타입
// ═══════════════════════════════════════════════════════════════

/**
 * 주문 타임인포스 (Time in Force)
 */
export type TimeInForce =
  | 'GTC'    // Good Till Cancelled
  | 'IOC'   // Immediate or Cancel
  | 'FOK'   // Fill or Kill
  | 'DAY';  // Day Order

/**
 * 주문 요청
 */
export interface IOrderRequest {
  /** 심볼 */
  symbol: string;
  /** 방향 */
  side: OrderSide;
  /** 주문 타입 */
  type: OrderType;
  /** 수량 */
  quantity: number;
  /** 지정가 (limit, stop_limit) */
  price?: number;
  /** 트리거 가격 (stop, stop_limit) */
  stopPrice?: number;
  /** 타임인포스 */
  timeInForce?: TimeInForce;
  /** 연결된 손절 주문 */
  stopLoss?: IStopLossOrder;
  /** 연결된 익절 주문 */
  takeProfit?: ITakeProfitOrder;
  /** 클라이언트 주문 ID */
  clientOrderId?: string;
  /** 메모 */
  note?: string;
}

/**
 * 손절 주문 설정
 */
export interface IStopLossOrder {
  /** 손절 타입 */
  type: 'fixed_price' | 'percent' | 'atr_based' | 'trailing';
  /** 손절가 (fixed_price) */
  price?: number;
  /** 손절 비율 (percent) */
  percent?: number;
  /** ATR 배수 (atr_based) */
  atrMultiplier?: number;
  /** 추적 거리 % (trailing) */
  trailingPercent?: number;
  /** 트리거 후 활성화 여부 */
  activated?: boolean;
}

/**
 * 익절 주문 설정
 */
export interface ITakeProfitOrder {
  /** 익절 타입 */
  type: 'fixed_price' | 'percent' | 'risk_reward' | 'trailing' | 'partial';
  /** 익절가 (fixed_price) */
  price?: number;
  /** 익절 비율 (percent) */
  percent?: number;
  /** R:R 비율 (risk_reward) */
  riskRewardRatio?: number;
  /** 추적 거리 % (trailing) */
  trailingPercent?: number;
  /** 분할 익절 설정 (partial) */
  partialExits?: IPartialExit[];
}

/**
 * 분할 익절 설정
 */
export interface IPartialExit {
  /** 익절 비율 (목표 도달 시) */
  targetPercent: number;
  /** 청산 비율 (포지션의 %) */
  exitPercent: number;
}

// ═══════════════════════════════════════════════════════════════
// 주문 실행 타입
// ═══════════════════════════════════════════════════════════════

/**
 * 실행 모드
 */
export type ExecutionMode =
  | 'simulation'   // 시뮬레이션 (백테스트)
  | 'paper'        // 페이퍼 트레이딩
  | 'live';        // 실거래

/**
 * 주문 실행 상세
 */
export interface IOrderExecution {
  /** 실행 ID */
  id: string;
  /** 주문 ID */
  orderId: string;
  /** 체결 정보 */
  trade: ITrade;
  /** 실행 모드 */
  mode: ExecutionMode;
  /** 슬리피지 */
  slippage: number;
  /** 슬리피지 비율 (%) */
  slippagePercent: number;
  /** 요청 가격 */
  requestedPrice: number;
  /** 체결 가격 */
  executedPrice: number;
  /** 지연 시간 (ms) */
  latencyMs: number;
  /** 실행 시간 */
  executedAt: string;
  /** 체결 수량 (편의 필드, trade.quantity와 동일) */
  quantity: number;
  /** 체결 가격 (편의 필드, trade.price와 동일) */
  price: number;
}

/**
 * 확장된 주문 (실행 관련 메타데이터 포함)
 */
export interface IOrderWithMeta extends IOrder {
  /** 전략 ID (연결된 전략) */
  strategyId?: string;
  /** 신호 ID (발생 신호) */
  signalId?: string;
  /** 연결된 손절 주문 ID */
  stopLossOrderId?: string;
  /** 연결된 익절 주문 ID */
  takeProfitOrderId?: string;
  /** 실행 목록 */
  executions: IOrderExecution[];
  /** 총 수수료 */
  totalFees: number;
  /** 실행 모드 */
  mode: ExecutionMode;
  /** 태그 */
  tags?: string[];
}

// ═══════════════════════════════════════════════════════════════
// 포지션 확장 타입
// ═══════════════════════════════════════════════════════════════

/**
 * 확장된 포지션 (메타데이터 포함)
 */
export interface IPositionWithMeta extends IPosition {
  /** 전략 ID */
  strategyId?: string;
  /** 원본 주문 ID */
  originOrderId: string;
  /** 활성 손절 주문 ID */
  activeSLOrderId?: string;
  /** 활성 익절 주문 ID */
  activeTPOrderId?: string;
  /** 추적 손절 현재가 */
  trailingStopPrice?: number;
  /** 부분 익절 기록 */
  partialExits: IPartialExitRecord[];
  /** 최고/최저 도달가 */
  peakPrice?: number;
  troughPrice?: number;
  /** MAE (Maximum Adverse Excursion) */
  mae: number;
  /** MFE (Maximum Favorable Excursion) */
  mfe: number;
  /** 총 수수료 */
  totalFees: number;
  /** 태그 */
  tags?: string[];
}

/**
 * 분할 익절 기록
 */
export interface IPartialExitRecord {
  /** 익절 시간 */
  exitedAt: string;
  /** 익절가 */
  exitPrice: number;
  /** 청산 수량 */
  quantity: number;
  /** 실현 손익 */
  realizedPnL: number;
  /** 청산 비율 (%) */
  exitPercent: number;
}

// ═══════════════════════════════════════════════════════════════
// 리스크 관리 타입
// ═══════════════════════════════════════════════════════════════

/**
 * 포지션 사이징 방법
 */
export type PositionSizingMethod =
  | 'fixed_amount'        // 고정 금액
  | 'fixed_quantity'      // 고정 수량
  | 'percent_equity'      // 자본금 비율
  | 'percent_risk'        // 리스크 비율
  | 'kelly_criterion'     // 켈리 기준
  | 'volatility_adjusted'; // 변동성 조정

/**
 * 리스크 설정
 */
export interface IRiskConfig {
  /** 계정 자본금 */
  accountEquity: number;
  /** 포지션 사이징 방법 */
  sizingMethod: PositionSizingMethod;
  /** 최대 리스크 비율 (% per trade) */
  maxRiskPerTrade: number;
  /** 최대 포지션 크기 (자본금 대비 %) */
  maxPositionSize: number;
  /** 최대 동시 포지션 수 */
  maxOpenPositions: number;
  /** 일일 손실 한도 (%) */
  dailyLossLimit: number;
  /** 일일 거래 횟수 한도 */
  dailyTradeLimit: number;
  /** 기본 레버리지 */
  defaultLeverage: number;
  /** 최대 레버리지 */
  maxLeverage: number;
  /** 기본 손절 비율 (%) */
  defaultStopLossPercent: number;
  /** 기본 익절 비율 (%) */
  defaultTakeProfitPercent: number;
}

/**
 * 리스크 상태
 */
export interface IRiskStatus {
  /** 현재 자본금 */
  currentEquity: number;
  /** 오늘 실현 손익 */
  dailyPnL: number;
  /** 오늘 실현 손익률 (%) */
  dailyPnLPercent: number;
  /** 오늘 거래 횟수 */
  dailyTradeCount: number;
  /** 현재 열린 포지션 수 */
  openPositionCount: number;
  /** 총 사용 마진 */
  totalMarginUsed: number;
  /** 가용 마진 */
  availableMargin: number;
  /** 일일 손실 한도 도달 여부 */
  dailyLimitReached: boolean;
  /** 거래 가능 여부 */
  canTrade: boolean;
  /** 거래 불가 사유 */
  blockReason?: string;
}

// ═══════════════════════════════════════════════════════════════
// 주문/포지션 이력
// ═══════════════════════════════════════════════════════════════

/**
 * 주문 이력 필터
 */
export interface IOrderHistoryFilter {
  /** 심볼 */
  symbol?: string;
  /** 방향 */
  side?: OrderSide;
  /** 상태 목록 */
  status?: string[];
  /** 기간 */
  dateRange?: {
    start: string;
    end: string;
  };
  /** 전략 ID */
  strategyId?: string;
  /** 태그 */
  tags?: string[];
  /** 페이지 */
  page?: number;
  /** 페이지 크기 */
  pageSize?: number;
}

/**
 * 실행 통계
 */
export interface IExecutionStats {
  /** 총 주문 수 */
  totalOrders: number;
  /** 체결 주문 수 */
  filledOrders: number;
  /** 취소 주문 수 */
  cancelledOrders: number;
  /** 거부 주문 수 */
  rejectedOrders: number;
  /** 평균 체결률 (%) */
  fillRate: number;
  /** 평균 슬리피지 */
  avgSlippage: number;
  /** 총 수수료 */
  totalFees: number;
  /** 평균 체결 지연 (ms) */
  avgLatencyMs: number;
  /** 심볼별 통계 */
  bySymbol: Record<string, {
    orders: number;
    filled: number;
    avgSlippage: number;
  }>;
}

// ═══════════════════════════════════════════════════════════════
// 기본 설정
// ═══════════════════════════════════════════════════════════════

/**
 * 기본 리스크 설정
 */
export const DEFAULT_RISK_CONFIG: IRiskConfig = {
  accountEquity: 10000,
  sizingMethod: 'percent_risk',
  maxRiskPerTrade: 2,
  maxPositionSize: 20,
  maxOpenPositions: 5,
  dailyLossLimit: 5,
  dailyTradeLimit: 10,
  defaultLeverage: 1,
  maxLeverage: 3,
  defaultStopLossPercent: 2,
  defaultTakeProfitPercent: 4,
};

/**
 * 시뮬레이션 기본 설정
 */
export const DEFAULT_SIMULATION_CONFIG = {
  /** 기본 슬리피지 (%) */
  slippagePercent: 0.1,
  /** 기본 수수료 (%) */
  feePercent: 0.1,
  /** 기본 지연 (ms) */
  latencyMs: 50,
  /** 부분 체결 확률 */
  partialFillProbability: 0.1,
};
