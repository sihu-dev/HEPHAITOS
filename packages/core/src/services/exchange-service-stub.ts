/**
 * @hephaitos/core - Exchange Service (Stub)
 * L2 (Cells) - 거래소/증권사 연결 및 주문 실행 서비스
 *
 * TODO: UnifiedBrokerV2를 packages/core로 이동하거나 별도 패키지로 분리 필요
 * 현재는 Mock 구현 - 실제 broker 연동 필요
 */

import type { IResult } from '@hephaitos/types';
import type {
  IBrokerCredentials,
  IConnectionResult,
  IBalance,
  IHolding,
  IOrderRequest,
  IOrderResult,
  OrderStatus,
  IExchangeService,
} from './exchange-service.js';

/**
 * Exchange Service Stub Implementation
 * 모든 메서드는 not-implemented 에러 반환
 */
export class ExchangeServiceStub implements IExchangeService {
  async connect(_credentials: IBrokerCredentials): Promise<IResult<IConnectionResult>> {
    return {
      success: false,
      error: new Error('ExchangeService not yet implemented - UnifiedBrokerV2 integration pending'),
      metadata: { timestamp: new Date().toISOString(), duration_ms: 0 },
    };
  }

  async disconnect(): Promise<IResult<void>> {
    return {
      success: false,
      error: new Error('ExchangeService not yet implemented'),
      metadata: { timestamp: new Date().toISOString(), duration_ms: 0 },
    };
  }

  async getBalance(): Promise<IResult<IBalance>> {
    return {
      success: false,
      error: new Error('ExchangeService not yet implemented'),
      metadata: { timestamp: new Date().toISOString(), duration_ms: 0 },
    };
  }

  async getHoldings(): Promise<IResult<IHolding[]>> {
    return {
      success: false,
      error: new Error('ExchangeService not yet implemented'),
      metadata: { timestamp: new Date().toISOString(), duration_ms: 0 },
    };
  }

  async submitOrder(_request: IOrderRequest): Promise<IResult<IOrderResult>> {
    return {
      success: false,
      error: new Error('ExchangeService not yet implemented'),
      metadata: { timestamp: new Date().toISOString(), duration_ms: 0 },
    };
  }

  async cancelOrder(_orderId: string): Promise<IResult<boolean>> {
    return {
      success: false,
      error: new Error('ExchangeService not yet implemented'),
      metadata: { timestamp: new Date().toISOString(), duration_ms: 0 },
    };
  }

  async getOrderStatus(_orderId: string): Promise<IResult<OrderStatus>> {
    return {
      success: false,
      error: new Error('ExchangeService not yet implemented'),
      metadata: { timestamp: new Date().toISOString(), duration_ms: 0 },
    };
  }

  async healthCheck(): Promise<IResult<{ latency: number; status: string }>> {
    return {
      success: false,
      error: new Error('ExchangeService not yet implemented'),
      metadata: { timestamp: new Date().toISOString(), duration_ms: 0 },
    };
  }
}

export function createExchangeService(): IExchangeService {
  return new ExchangeServiceStub();
}
