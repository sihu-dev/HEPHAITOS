/**
 * @hephaitos/types - HEPHAITOS Asset Types
 * L0 (Atoms) - 자산 관련 타입 정의
 */

/**
 * 자산 기본 인터페이스
 */
export interface IAsset {
  /** 심볼 (BTC, ETH, USDT) */
  symbol: string;
  /** 자산명 (Bitcoin, Ethereum) */
  name: string;
  /** 보유 수량 */
  amount: number;
  /** 현재 USD 가격 */
  price_usd: number;
  /** 총 가치 (amount * price_usd) */
  value_usd: number;
  /** 24시간 변동률 (%) */
  change_24h: number;

  /** 평균 매수가 (선택) */
  avg_buy_price?: number;
  /** 미실현 손익 (선택) */
  unrealized_pnl?: number;
}

/**
 * 자산 잔고 상세 인터페이스
 */
export interface IAssetBalance {
  /** 자산 정보 */
  asset: IAsset;
  /** 사용 가능 수량 */
  free: number;
  /** 주문 중 잠금 수량 */
  locked: number;
  /** 스테이킹 중 수량 (선택) */
  staking?: number;
}

/**
 * 자산 비중 인터페이스
 */
export interface IAssetBreakdown {
  /** 심볼 */
  symbol: string;
  /** 수량 */
  amount: number;
  /** USD 가치 */
  value_usd: number;
  /** 포트폴리오 내 비중 (%) */
  percentage: number;
}

/**
 * 자산 생성 헬퍼 (불변성 보장)
 */
export function createAsset(params: Omit<IAsset, 'value_usd'>): IAsset {
  return {
    ...params,
    value_usd: params.amount * params.price_usd,
  };
}
