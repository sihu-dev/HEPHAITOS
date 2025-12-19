/**
 * @hephaitos/utils - Balance Utilities
 * L1 (Molecules) - 잔고 정규화 유틸리티
 */

import type { IAsset, ExchangeType } from '@hephaitos/types';

/**
 * 바이낸스 잔고 응답 타입
 */
interface BinanceBalance {
  asset: string;
  free: string;
  locked: string;
}

/**
 * 업비트 잔고 응답 타입
 */
interface UpbitBalance {
  currency: string;
  balance: string;
  locked: string;
  avg_buy_price: string;
}

/**
 * 빗썸 잔고 응답 타입
 */
interface BithumbBalance {
  currency: string;
  total_currency: string;
  available_currency: string;
  xcoin_last: string;
}

/**
 * 거래소 원본 잔고 데이터를 표준 IAsset 형식으로 정규화
 *
 * @param exchange - 거래소 종류
 * @param rawBalances - 거래소 원본 잔고 데이터
 * @param prices - 심볼별 USD 가격 맵
 * @returns 정규화된 IAsset 배열
 *
 * @example
 * const assets = normalizeBalance('binance', binanceResponse, priceMap);
 */
export function normalizeBalance(
  exchange: ExchangeType,
  rawBalances: unknown[],
  prices: Map<string, number>
): IAsset[] {
  switch (exchange) {
    case 'binance':
      return normalizeBinance(rawBalances as BinanceBalance[], prices);
    case 'upbit':
      return normalizeUpbit(rawBalances as UpbitBalance[], prices);
    case 'bithumb':
      return normalizeBithumb(rawBalances as BithumbBalance[], prices);
    default:
      throw new Error(`Unsupported exchange: ${exchange}`);
  }
}

/**
 * 바이낸스 잔고 정규화
 */
function normalizeBinance(
  balances: BinanceBalance[],
  prices: Map<string, number>
): IAsset[] {
  return balances
    .filter((b) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
    .map((b) => {
      const amount = parseFloat(b.free) + parseFloat(b.locked);
      const priceUsd = prices.get(b.asset) ?? 0;

      return {
        symbol: b.asset,
        name: b.asset, // 이름은 별도 매핑 필요
        amount,
        price_usd: priceUsd,
        value_usd: amount * priceUsd,
        change_24h: 0, // 별도 API 필요
      };
    });
}

/**
 * 업비트 잔고 정규화
 */
function normalizeUpbit(
  balances: UpbitBalance[],
  prices: Map<string, number>
): IAsset[] {
  return balances
    .filter((b) => parseFloat(b.balance) > 0)
    .map((b) => {
      const amount = parseFloat(b.balance) + parseFloat(b.locked);
      const priceUsd = prices.get(b.currency) ?? 0;
      const avgBuyPrice = parseFloat(b.avg_buy_price);

      return {
        symbol: b.currency,
        name: b.currency,
        amount,
        price_usd: priceUsd,
        value_usd: amount * priceUsd,
        change_24h: 0,
        avg_buy_price: avgBuyPrice,
        unrealized_pnl: avgBuyPrice > 0 ? (priceUsd - avgBuyPrice) * amount : undefined,
      };
    });
}

/**
 * 빗썸 잔고 정규화
 */
function normalizeBithumb(
  balances: BithumbBalance[],
  prices: Map<string, number>
): IAsset[] {
  return balances
    .filter((b) => parseFloat(b.total_currency) > 0)
    .map((b) => {
      const amount = parseFloat(b.total_currency);
      const priceUsd = prices.get(b.currency) ?? 0;

      return {
        symbol: b.currency,
        name: b.currency,
        amount,
        price_usd: priceUsd,
        value_usd: amount * priceUsd,
        change_24h: 0,
      };
    });
}

/**
 * 자산 목록의 총 가치 계산
 */
export function calculateTotalValue(assets: IAsset[]): number {
  return assets.reduce((sum, asset) => sum + asset.value_usd, 0);
}

/**
 * 자산 목록을 가치 기준 내림차순 정렬
 */
export function sortByValue(assets: IAsset[]): IAsset[] {
  return [...assets].sort((a, b) => b.value_usd - a.value_usd);
}

/**
 * 최소 가치 이하 자산 필터링 (더스트 제거)
 */
export function filterDust(assets: IAsset[], minValueUsd: number = 1): IAsset[] {
  return assets.filter((asset) => asset.value_usd >= minValueUsd);
}
