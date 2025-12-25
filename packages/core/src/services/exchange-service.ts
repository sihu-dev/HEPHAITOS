/**
 * @hephaitos/core - Exchange Service
 * L2 (Cells) - 거래소/증권사 연결 및 주문 실행 서비스
 */

import type { IResult } from '@hephaitos/types';

/**
 * 증권사/거래소 제공자
 */
export type BrokerProvider = 'kis' | 'alpaca' | 'binance' | 'upbit';

/**
 * 증권사 인증 정보
 */
export interface IBrokerCredentials {
  provider: BrokerProvider;
  apiKey: string;
  apiSecret: string;
  accountNumber?: string;
  isPaper?: boolean;
}

/**
 * 연결 결과
 */
export interface IConnectionResult {
  provider: BrokerProvider;
  accountId?: string;
  latency?: number;
}

/**
 * 잔고 정보
 */
export interface IBalance {
  currency: string;
  total: number;
  available: number;
  reserved: number;
  updatedAt: string;
}

/**
 * 보유 자산
 */
export interface IHolding {
  symbol: string;
  name?: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
}

/**
 * 주문 요청
 */
export interface IOrderRequest {
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  orderType: 'market' | 'limit' | 'stop' | 'stop_limit';
  price?: number;
  stopPrice?: number;
  timeInForce?: 'day' | 'gtc' | 'ioc' | 'fok';
}

/**
 * 주문 상태
 */
export type OrderStatus =
  | 'pending'
  | 'submitted'
  | 'partial_filled'
  | 'filled'
  | 'cancelled'
  | 'rejected'
  | 'expired'
  | 'failed';

/**
 * 주문 결과
 */
export interface IOrderResult {
  orderId?: string;
  status: OrderStatus;
  filledQuantity?: number;
  avgFilledPrice?: number;
  timestamp: string;
}

/**
 * 거래소 서비스 인터페이스
 */
export interface IExchangeService {
  /** 증권사/거래소 연결 */
  connect(credentials: IBrokerCredentials): Promise<IResult<IConnectionResult>>;

  /** 연결 해제 */
  disconnect(): Promise<IResult<void>>;

  /** 잔고 조회 */
  getBalance(): Promise<IResult<IBalance>>;

  /** 보유 자산 조회 */
  getHoldings(): Promise<IResult<IHolding[]>>;

  /** 주문 제출 */
  submitOrder(request: IOrderRequest): Promise<IResult<IOrderResult>>;

  /** 주문 취소 */
  cancelOrder(orderId: string): Promise<IResult<boolean>>;

  /** 주문 상태 조회 */
  getOrderStatus(orderId: string): Promise<IResult<OrderStatus>>;

  /** 헬스 체크 */
  healthCheck(): Promise<IResult<{ latency: number; status: string }>>;
}

/**
 * 거래소 서비스 구현 (Stub)
 *
 * TODO: UnifiedBrokerV2를 packages/core로 이동하거나 별도 패키지로 분리 필요
 * 현재는 모든 메서드가 not-implemented 에러를 반환하는 stub 구현
 */
export class ExchangeService implements IExchangeService {
  private broker: unknown | null = null;
  private credentials: IBrokerCredentials | null = null;

  async connect(credentials: IBrokerCredentials): Promise<IResult<IConnectionResult>> {
    const startTime = Date.now();

    // TODO: UnifiedBrokerV2 integration
    // 현재는 stub 구현
    return {
      success: false,
      error: new Error('ExchangeService.connect() not yet implemented - UnifiedBrokerV2 integration pending'),
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }

  async disconnect(): Promise<IResult<void>> {
    const startTime = Date.now();

    // TODO: UnifiedBrokerV2 integration
    this.broker = null;
    this.credentials = null;

    return {
      success: true,
      data: undefined,
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }

  async getBalance(): Promise<IResult<IBalance>> {
    const startTime = Date.now();

    return {
      success: false,
      error: new Error('ExchangeService.getBalance() not yet implemented'),
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }

  async getHoldings(): Promise<IResult<IHolding[]>> {
    const startTime = Date.now();

    return {
      success: false,
      error: new Error('ExchangeService.getHoldings() not yet implemented'),
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }

  async submitOrder(_request: IOrderRequest): Promise<IResult<IOrderResult>> {
    const startTime = Date.now();

    return {
      success: false,
      error: new Error('ExchangeService.submitOrder() not yet implemented'),
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }

  async cancelOrder(_orderId: string): Promise<IResult<boolean>> {
    const startTime = Date.now();

    return {
      success: false,
      error: new Error('ExchangeService.cancelOrder() not yet implemented'),
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }

  async getOrderStatus(_orderId: string): Promise<IResult<OrderStatus>> {
    const startTime = Date.now();

    return {
      success: false,
      error: new Error('ExchangeService.getOrderStatus() not yet implemented'),
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }

  async healthCheck(): Promise<IResult<{ latency: number; status: string }>> {
    const startTime = Date.now();

    return {
      success: true,
      data: {
        latency: Date.now() - startTime,
        status: 'stub',
      },
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }
}

/**
 * 팩토리 함수
 */
export function createExchangeService(): IExchangeService {
  return new ExchangeService();
}
