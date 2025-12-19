/**
 * @hephaitos/core - Price Data Service
 * L2 (Cells) - 가격 데이터 서비스
 */

import type { IOHLCV, IResult, Timeframe } from '@hephaitos/types';

/**
 * 가격 데이터 조회 파라미터
 */
export interface IPriceDataQuery {
  symbol: string;
  timeframe: Timeframe;
  startDate: string;
  endDate: string;
  limit?: number;
}

/**
 * 과거 가격 데이터 결과
 */
export interface IHistoricalPriceData {
  symbol: string;
  timeframe: Timeframe;
  candles: IOHLCV[];
  startTime: string;
  endTime: string;
}

/**
 * 가격 데이터 서비스 인터페이스
 */
export interface IPriceDataService {
  /** OHLCV 데이터 조회 */
  getOHLCV(query: IPriceDataQuery): Promise<IResult<IOHLCV[]>>;

  /** 과거 가격 데이터 조회 (backtest용) */
  getHistoricalPrices(
    symbol: string,
    timeframe: Timeframe,
    startDate: string,
    endDate: string
  ): Promise<IResult<IHistoricalPriceData>>;

  /** 최신 가격 조회 */
  getLatestPrice(symbol: string): Promise<IResult<number>>;

  /** 여러 심볼의 최신 가격 조회 */
  getLatestPrices(symbols: string[]): Promise<IResult<Map<string, number>>>;
}

/**
 * Mock 가격 데이터 서비스 (개발/테스트용)
 */
export class MockPriceDataService implements IPriceDataService {
  async getOHLCV(_query: IPriceDataQuery): Promise<IResult<IOHLCV[]>> {
    const startTime = Date.now();
    return {
      success: true,
      data: [],
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }

  async getHistoricalPrices(
    symbol: string,
    timeframe: Timeframe,
    startDate: string,
    endDate: string
  ): Promise<IResult<IHistoricalPriceData>> {
    const startTime = Date.now();
    return {
      success: true,
      data: {
        symbol,
        timeframe,
        candles: [],
        startTime: startDate,
        endTime: endDate,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }

  async getLatestPrice(_symbol: string): Promise<IResult<number>> {
    const startTime = Date.now();
    return {
      success: true,
      data: 0,
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }

  async getLatestPrices(_symbols: string[]): Promise<IResult<Map<string, number>>> {
    const startTime = Date.now();
    return {
      success: true,
      data: new Map(),
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }
}
