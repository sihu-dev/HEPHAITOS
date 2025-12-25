/**
 * @hephaitos/types - HEPHAITOS Portfolio Types
 * L0 (Atoms) - 포트폴리오 관련 타입 정의
 */

import type { ExchangeType } from './exchange.js';
import type { IAsset, IAssetBreakdown } from './asset.js';

/**
 * 동기화 상태
 */
export type SyncStatus =
  | 'idle'
  | 'pending'
  | 'syncing'
  | 'synced'
  | 'success'
  | 'error';

/**
 * 포트폴리오 인터페이스
 */
export interface IPortfolio {
  /** 고유 ID */
  id: string;
  /** 사용자 ID */
  user_id: string;
  /** 거래소 종류 */
  exchange: ExchangeType;
  /** 포트폴리오 이름 */
  name: string;
  /** 보유 자산 목록 */
  assets: IAsset[];
  /** 총 USD 가치 */
  total_value_usd: number;

  /** 생성 일시 (ISO 8601) */
  created_at: string;
  /** 마지막 동기화 일시 */
  synced_at: string;
  /** 마지막 동기화 일시 (별칭, synced_at와 동일) */
  last_synced_at?: string;
  /** 동기화 상태 */
  sync_status: SyncStatus;
}

/**
 * 포트폴리오 요약 인터페이스
 */
export interface IPortfolioSummary {
  /** 총 현재 가치 (USD) */
  total_value_usd: number;
  /** 총 투자 비용 (USD) */
  total_cost_usd: number;
  /** 총 손익 (USD) */
  total_pnl_usd: number;
  /** 총 손익률 (%) */
  total_pnl_percent: number;
  /** 보유 자산 종류 수 */
  asset_count: number;
  /** 연결 거래소 수 */
  exchange_count: number;
}

/**
 * 포트폴리오 스냅샷 인터페이스
 */
export interface IPortfolioSnapshot {
  /** 고유 ID */
  id: string;
  /** 포트폴리오 ID */
  portfolio_id: string;
  /** 스냅샷 시점 총 가치 */
  total_value_usd: number;
  /** 자산별 상세 */
  asset_breakdown: IAssetBreakdown[];
  /** 기록 일시 (ISO 8601) */
  recorded_at: string;
}

/**
 * 포트폴리오 생성 입력
 */
export interface ICreatePortfolioInput {
  user_id: string;
  exchange: ExchangeType;
  name: string;
  api_key: string;
  api_secret: string;
}

/**
 * 포트폴리오 동기화 결과
 */
export interface ISyncResult {
  success: boolean;
  portfolio_id: string;
  synced_at: string;
  asset_count: number;
  total_value_usd: number;
  error?: string;
}
