/**
 * @hephaitos/core - Market Data Service
 * L2 (Cells) - 실시간 시장 데이터 서비스
 */

import { randomUUID } from 'node:crypto';
import type { IResult, IOHLCV, Timeframe } from '@hephaitos/types';

/**
 * 실시간 가격 구독 콜백
 */
export type PriceCallback = (symbol: string, price: number) => void;

/**
 * 티커 정보
 */
export interface ITickerInfo {
  symbol: string;
  last_price: number;
  high_24h: number;
  low_24h: number;
  volume_24h: number;
  price_change_24h: number;
  price_change_percent_24h: number;
  updated_at: string;
}

/**
 * 시장 데이터 서비스 인터페이스
 */
export interface IMarketDataService {
  /** 실시간 가격 구독 */
  subscribe(symbol: string, callback: PriceCallback): Promise<IResult<string>>;

  /** 구독 해제 */
  unsubscribe(subscriptionId: string): Promise<IResult<void>>;

  /** 최신 가격 조회 */
  getLatestPrice(symbol: string): Promise<IResult<number>>;

  /** 티커 정보 조회 */
  getTicker(symbol: string): Promise<IResult<ITickerInfo>>;

  /** 실시간 OHLCV 조회 */
  getRealtimeOHLCV(symbol: string, timeframe: Timeframe, limit?: number): Promise<IResult<IOHLCV[]>>;

  /** 여러 심볼의 최신 가격 조회 */
  getLatestPrices(symbols: string[]): Promise<IResult<Map<string, number>>>;
}

/**
 * 시장 데이터 서비스 구현
 */
export class MarketDataService implements IMarketDataService {
  private subscriptions: Map<string, { symbol: string; callback: PriceCallback }> = new Map();
  private latestPrices: Map<string, number> = new Map();
  private tickers: Map<string, ITickerInfo> = new Map();

  async subscribe(symbol: string, callback: PriceCallback): Promise<IResult<string>> {
    const startTime = Date.now();
    try {
      const subscriptionId = randomUUID();
      this.subscriptions.set(subscriptionId, { symbol, callback });

      // TODO: WebSocket 연결 및 실시간 데이터 수신
      // 현재는 Mock으로 초기 가격만 설정
      if (!this.latestPrices.has(symbol)) {
        this.latestPrices.set(symbol, 100); // Mock price
      }

      return {
        success: true,
        data: subscriptionId,
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

  async unsubscribe(subscriptionId: string): Promise<IResult<void>> {
    const startTime = Date.now();
    try {
      this.subscriptions.delete(subscriptionId);

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

  async getLatestPrice(symbol: string): Promise<IResult<number>> {
    const startTime = Date.now();
    try {
      const price = this.latestPrices.get(symbol) ?? 0;

      return {
        success: true,
        data: price,
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

  async getTicker(symbol: string): Promise<IResult<ITickerInfo>> {
    const startTime = Date.now();
    try {
      let ticker = this.tickers.get(symbol);

      if (!ticker) {
        // Generate mock ticker
        const price = this.latestPrices.get(symbol) ?? 100;
        ticker = {
          symbol,
          last_price: price,
          high_24h: price * 1.05,
          low_24h: price * 0.95,
          volume_24h: 1000000,
          price_change_24h: price * 0.02,
          price_change_percent_24h: 2.0,
          updated_at: new Date().toISOString(),
        };
        this.tickers.set(symbol, ticker);
      }

      return {
        success: true,
        data: ticker,
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

  async getRealtimeOHLCV(symbol: string, timeframe: Timeframe, limit: number = 100): Promise<IResult<IOHLCV[]>> {
    const startTime = Date.now();
    try {
      // TODO: 실제 OHLCV 데이터 조회
      // 현재는 빈 배열 반환
      const ohlcv: IOHLCV[] = [];

      return {
        success: true,
        data: ohlcv,
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

  async getLatestPrices(symbols: string[]): Promise<IResult<Map<string, number>>> {
    const startTime = Date.now();
    try {
      const prices = new Map<string, number>();

      for (const symbol of symbols) {
        const price = this.latestPrices.get(symbol) ?? 0;
        prices.set(symbol, price);
      }

      return {
        success: true,
        data: prices,
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

  /**
   * 가격 업데이트 (내부용 - WebSocket 핸들러에서 호출)
   */
  updatePrice(symbol: string, price: number): void {
    this.latestPrices.set(symbol, price);

    // 구독자들에게 알림
    this.subscriptions.forEach((sub) => {
      if (sub.symbol === symbol) {
        sub.callback(symbol, price);
      }
    });
  }
}

/**
 * 팩토리 함수
 */
export function createMarketDataService(): IMarketDataService {
  return new MarketDataService();
}
