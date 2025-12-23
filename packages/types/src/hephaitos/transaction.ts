/**
 * @hephaitos/types - HEPHAITOS Transaction Types
 * L0 (Atoms) - 거래 내역 타입 정의
 */

import type { Timestamp, OrderSide, OrderType, OrderStatus } from './trade.js';

/**
 * 거래 타입
 */
export type TransactionType =
  | 'order_create'      // 주문 생성
  | 'order_fill'        // 주문 체결
  | 'order_cancel'      // 주문 취소
  | 'position_open'     // 포지션 진입
  | 'position_close'    // 포지션 종료
  | 'deposit'           // 입금
  | 'withdrawal'        // 출금
  | 'fee'               // 수수료
  | 'dividend'          // 배당
  | 'interest';         // 이자

/**
 * 거래 인터페이스
 */
export interface ITransaction {
  /** 거래 ID (UUID) */
  id: string;
  /** 사용자 ID */
  user_id: string;
  /** 거래 타입 */
  type: TransactionType;
  /** 심볼 (주문/포지션인 경우) */
  symbol?: string;
  /** 주문 방향 (주문/포지션인 경우) */
  side?: OrderSide;
  /** 수량 */
  quantity: number;
  /** 가격 */
  price: number;
  /** 총 금액 (USD) */
  amount: number;
  /** 수수료 */
  fee: number;
  /** 잔고 (거래 후) */
  balance_after: number;
  /** 관련 주문 ID */
  order_id?: string;
  /** 관련 포지션 ID */
  position_id?: string;
  /** 거래소 */
  exchange?: string;
  /** 메모 */
  note?: string;
  /** 메타데이터 */
  metadata?: Record<string, unknown>;
  /** 거래 시간 */
  executed_at: Timestamp;
  /** 생성일 */
  created_at: Timestamp;
}

/**
 * 거래 생성 입력
 */
export interface ICreateTransactionInput {
  /** 사용자 ID */
  user_id: string;
  /** 거래 타입 */
  type: TransactionType;
  /** 심볼 */
  symbol?: string;
  /** 방향 */
  side?: OrderSide;
  /** 수량 */
  quantity: number;
  /** 가격 */
  price: number;
  /** 총 금액 */
  amount: number;
  /** 수수료 */
  fee: number;
  /** 거래 후 잔고 */
  balance_after: number;
  /** 주문 ID */
  order_id?: string;
  /** 포지션 ID */
  position_id?: string;
  /** 거래소 */
  exchange?: string;
  /** 메모 */
  note?: string;
  /** 메타데이터 */
  metadata?: Record<string, unknown>;
}

/**
 * 거래 필터
 */
export interface ITransactionFilter {
  /** 사용자 ID */
  user_id?: string;
  /** 거래 타입 목록 */
  types?: TransactionType[];
  /** 심볼 */
  symbol?: string;
  /** 기간 */
  dateRange?: {
    start: string;
    end: string;
  };
  /** 주문 ID */
  order_id?: string;
  /** 포지션 ID */
  position_id?: string;
  /** 거래소 */
  exchange?: string;
  /** 페이지 */
  page?: number;
  /** 페이지 크기 */
  pageSize?: number;
}

/**
 * 거래 통계
 */
export interface ITransactionStats {
  /** 사용자 ID */
  user_id: string;
  /** 총 거래 수 */
  total_count: number;
  /** 총 거래 금액 */
  total_volume: number;
  /** 총 수수료 */
  total_fees: number;
  /** 평균 거래 금액 */
  avg_transaction_amount: number;
  /** 타입별 통계 */
  by_type: Record<TransactionType, {
    count: number;
    volume: number;
  }>;
  /** 심볼별 통계 */
  by_symbol: Record<string, {
    count: number;
    volume: number;
  }>;
  /** 기간 */
  period: {
    start: string;
    end: string;
  };
  /** 계산일 */
  calculated_at: Timestamp;
}

/**
 * 일별 거래 요약
 */
export interface IDailyTransactionSummary {
  /** 날짜 (YYYY-MM-DD) */
  date: string;
  /** 사용자 ID */
  user_id: string;
  /** 거래 수 */
  transaction_count: number;
  /** 총 거래 금액 */
  total_volume: number;
  /** 총 수수료 */
  total_fees: number;
  /** 순손익 (예금/출금 제외) */
  net_pnl: number;
  /** 시작 잔고 */
  starting_balance: number;
  /** 종료 잔고 */
  ending_balance: number;
}
