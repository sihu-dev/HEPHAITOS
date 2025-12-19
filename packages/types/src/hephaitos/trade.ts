/**
 * @hephaitos/types - HEPHAITOS Trade Types
 * L0 (Atoms) - 거래 및 주문 타입 정의
 */

/**
 * 주문 방향
 */
export type OrderSide = 'buy' | 'sell';

/**
 * 주문 타입
 */
export type OrderType = 'market' | 'limit' | 'stop' | 'stop_limit';

/**
 * 주문 상태
 */
export type OrderStatus =
  | 'pending'     // 대기
  | 'open'        // 미체결
  | 'partial'     // 부분 체결
  | 'filled'      // 완전 체결
  | 'cancelled'   // 취소
  | 'rejected';   // 거부

/**
 * 포지션 상태
 */
export type PositionStatus = 'open' | 'closed';

/**
 * 주문
 */
export interface IOrder {
  /** 주문 ID */
  id: string;
  /** 심볼 */
  symbol: string;
  /** 방향 */
  side: OrderSide;
  /** 주문 타입 */
  type: OrderType;
  /** 주문 수량 */
  quantity: number;
  /** 지정가 (limit, stop_limit) */
  price?: number;
  /** 트리거 가격 (stop, stop_limit) */
  stopPrice?: number;
  /** 체결 수량 */
  filledQuantity: number;
  /** 평균 체결가 */
  avgFillPrice?: number;
  /** 상태 */
  status: OrderStatus;
  /** 생성 시간 */
  createdAt: string;
  /** 업데이트 시간 */
  updatedAt: string;
}

/**
 * 거래 (체결)
 */
export interface ITrade {
  /** 거래 ID */
  id: string;
  /** 주문 ID */
  orderId: string;
  /** 심볼 */
  symbol: string;
  /** 방향 */
  side: OrderSide;
  /** 체결 수량 */
  quantity: number;
  /** 체결 가격 */
  price: number;
  /** 거래 금액 */
  value: number;
  /** 수수료 */
  fee: number;
  /** 수수료 통화 */
  feeCurrency: string;
  /** 체결 시간 */
  executedAt: string;
}

/**
 * 포지션
 */
export interface IPosition {
  /** 포지션 ID */
  id: string;
  /** 심볼 */
  symbol: string;
  /** 방향 */
  side: OrderSide;
  /** 수량 */
  quantity: number;
  /** 평균 진입가 */
  entryPrice: number;
  /** 현재가 */
  currentPrice: number;
  /** 미실현 손익 */
  unrealizedPnL: number;
  /** 미실현 손익률 (%) */
  unrealizedPnLPercent: number;
  /** 상태 */
  status: PositionStatus;
  /** 진입 시간 */
  enteredAt: string;
  /** 청산 시간 (closed일 때) */
  closedAt?: string;
  /** 청산가 (closed일 때) */
  exitPrice?: number;
  /** 실현 손익 (closed일 때) */
  realizedPnL?: number;
}

/**
 * 라운드 트립 (완결된 매매)
 */
export interface IRoundTrip {
  /** ID */
  id: string;
  /** 심볼 */
  symbol: string;
  /** 방향 (롱/숏) */
  side: OrderSide;

  /** 진입 거래 */
  entryTrade: ITrade;
  /** 청산 거래 */
  exitTrade: ITrade;

  /** 진입가 */
  entryPrice: number;
  /** 청산가 */
  exitPrice: number;
  /** 수량 */
  quantity: number;

  /** 총 수수료 */
  totalFees: number;
  /** 순 손익 */
  netPnL: number;
  /** 순 손익률 (%) */
  netPnLPercent: number;

  /** 보유 기간 (ms) */
  holdingPeriodMs: number;
  /** 보유 기간 (바 수) */
  holdingPeriodBars: number;

  /** 진입 시간 */
  enteredAt: string;
  /** 청산 시간 */
  exitedAt: string;
}

/**
 * OHLCV 캔들
 */
export interface IOHLCV {
  /** 타임스탬프 */
  timestamp: string;
  /** 시가 */
  open: number;
  /** 고가 */
  high: number;
  /** 저가 */
  low: number;
  /** 종가 */
  close: number;
  /** 거래량 */
  volume: number;
}

/**
 * 가격 데이터
 */
export interface IPriceData {
  /** 심볼 */
  symbol: string;
  /** 타임프레임 */
  timeframe: string;
  /** OHLCV 데이터 */
  candles: IOHLCV[];
  /** 시작 시간 */
  startTime: string;
  /** 종료 시간 */
  endTime: string;
}
