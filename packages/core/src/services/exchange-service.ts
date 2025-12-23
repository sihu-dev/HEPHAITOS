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
  cancelOrder(orderId: string): Promise<IResult<void>>;

  /** 주문 상태 조회 */
  getOrderStatus(orderId: string): Promise<IResult<{ status: OrderStatus; filledQuantity?: number; avgPrice?: number }>>;

  /** 헬스 체크 */
  healthCheck(): Promise<IResult<{ healthy: boolean; latency?: number }>>;
}

/**
 * 거래소 서비스 구현
 *
 * UnifiedBrokerV2를 래핑하여 L2 서비스 레이어에서 사용 가능하도록 함
 */
export class ExchangeService implements IExchangeService {
  private broker: unknown | null = null;
  private credentials: IBrokerCredentials | null = null;

  async connect(credentials: IBrokerCredentials): Promise<IResult<IConnectionResult>> {
    const startTime = Date.now();

    // TODO: UnifiedBrokerV2를 packages/core로 이동하거나 별도 패키지로 분리 필요
    // 현재는 Mock 구현 - 실제 broker 연동 필요
    return {
      success: false,
      error: new Error('ExchangeService.connect() not yet implemented - UnifiedBrokerV2 integration pending'),
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };

    // 아래 코드는 UnifiedBrokerV2가 패키지에 포함되면 활성화
    // try {
    //   const { UnifiedBrokerV2 } = await import('unified-broker-v2');
    //   this.broker = new UnifiedBrokerV2({
    //     provider: credentials.provider,
    //     apiKey: credentials.apiKey,
    //     apiSecret: credentials.apiSecret,
    //     accountNumber: credentials.accountNumber,
    //     isPaper: credentials.isPaper,
    //   });
    //   const result = await this.broker.connect();
    //   this.credentials = credentials;
    //   return {
    //     success: true,
    //     data: {
    //       provider: credentials.provider,
    //       accountId: result.accountId,
    //       latency: result.latency,
    //     },
    //     metadata: {
    //       timestamp: new Date().toISOString(),
    //       duration_ms: Date.now() - startTime,
    //     },
    //   };
    // } catch (error) {
    //   return {
    //     success: false,
    //     error: error instanceof Error ? error : new Error(String(error)),
    //     metadata: {
    //       timestamp: new Date().toISOString(),
    //       duration_ms: Date.now() - startTime,
    //     },
    //   };
    // }
  }

  async disconnect(): Promise<IResult<void>> {
    const startTime = Date.now();
    try {
      if (!this.broker) {
        return {
          success: false,
          error: new Error('Not connected'),
          metadata: {
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
          },
        };
      }

      // TODO: await this.broker.disconnect();
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
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  async getBalance(): Promise<IResult<IBalance>> {
    const startTime = Date.now();
    try {
      if (!this.broker) {
        return {
          success: false,
          error: new Error('Not connected'),
          metadata: {
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
          },
        };
      }

      const result = // TODO: await this.broker.getBalance();

      if (!result.success) {
        return {
          success: false,
          error: new Error(result.error?.message || 'Failed to get balance'),
          metadata: {
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
          },
        };
      }

      return {
        success: true,
        data: {
          currency: result.data.currency,
          total: result.data.total,
          available: result.data.available,
          reserved: result.data.reserved,
          updatedAt: result.data.updatedAt.toISOString(),
        },
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  async getHoldings(): Promise<IResult<IHolding[]>> {
    const startTime = Date.now();
    try {
      if (!this.broker) {
        return {
          success: false,
          error: new Error('Not connected'),
          metadata: {
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
          },
        };
      }

      const result = // TODO: await this.broker.getHoldings();

      if (!result.success) {
        return {
          success: false,
          error: new Error(result.error?.message || 'Failed to get holdings'),
          metadata: {
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
          },
        };
      }

      return {
        success: true,
        data: result.data,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  async submitOrder(request: IOrderRequest): Promise<IResult<IOrderResult>> {
    const startTime = Date.now();
    try {
      if (!this.broker) {
        return {
          success: false,
          error: new Error('Not connected'),
          metadata: {
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
          },
        };
      }

      const result = // TODO: await this.broker.submitOrder(request);

      if (!result.success) {
        return {
          success: false,
          error: new Error(result.error?.message || 'Order failed'),
          metadata: {
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
          },
        };
      }

      return {
        success: true,
        data: {
          orderId: result.orderId,
          status: result.status,
          filledQuantity: result.filledQuantity,
          avgFilledPrice: result.avgFilledPrice,
          timestamp: result.timestamp.toISOString(),
        },
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  async cancelOrder(orderId: string): Promise<IResult<void>> {
    const startTime = Date.now();
    try {
      if (!this.broker) {
        return {
          success: false,
          error: new Error('Not connected'),
          metadata: {
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
          },
        };
      }

      const result = // TODO: await this.broker.cancelOrder(orderId);

      if (!result.success) {
        return {
          success: false,
          error: new Error(result.error?.message || 'Cancel failed'),
          metadata: {
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
          },
        };
      }

      return {
        success: true,
        data: undefined,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  async getOrderStatus(orderId: string): Promise<IResult<{ status: OrderStatus; filledQuantity?: number; avgPrice?: number }>> {
    const startTime = Date.now();
    try {
      if (!this.broker) {
        return {
          success: false,
          error: new Error('Not connected'),
          metadata: {
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
          },
        };
      }

      const result = // TODO: await this.broker.getOrderStatus(orderId);

      if (!result.success) {
        return {
          success: false,
          error: new Error(result.error?.message || 'Status check failed'),
          metadata: {
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
          },
        };
      }

      return {
        success: true,
        data: result.data,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  async healthCheck(): Promise<IResult<{ healthy: boolean; latency?: number }>> {
    const startTime = Date.now();
    try {
      if (!this.broker) {
        return {
          success: false,
          error: new Error('Not connected'),
          metadata: {
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
          },
        };
      }

      const result = // TODO: await this.broker.healthCheck();

      return {
        success: true,
        data: {
          healthy: result.healthy,
          latency: result.latency,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }
}

/**
 * 팩토리 함수 - ExchangeService 생성
 */
export function createExchangeService(): IExchangeService {
  return new ExchangeService();
}
