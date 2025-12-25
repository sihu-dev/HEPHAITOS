/**
 * @hephaitos/types - HEPHAITOS User Types
 * L0 (Atoms) - 사용자 관련 타입 정의
 */

import type { Timestamp } from '../common.js';

/**
 * 사용자 역할
 */
export type UserRole = 'free' | 'pro' | 'premium' | 'admin';

/**
 * 사용자 상태
 */
export type UserStatus = 'active' | 'suspended' | 'deleted';

/**
 * 사용자 인터페이스
 */
export interface IUser {
  /** 사용자 ID (UUID) */
  id: string;
  /** 이메일 */
  email: string;
  /** 사용자명 */
  username: string;
  /** 전체 이름 */
  full_name?: string;
  /** 역할 */
  role: UserRole;
  /** 상태 */
  status: UserStatus;
  /** 이메일 인증 여부 */
  email_verified: boolean;
  /** 프로필 이미지 URL */
  avatar_url?: string;
  /** 가입일 */
  created_at: Timestamp;
  /** 마지막 업데이트 */
  updated_at: Timestamp;
  /** 마지막 로그인 */
  last_login_at?: Timestamp;
}

/**
 * 사용자 설정 인터페이스
 */
export interface IUserSettings {
  /** 사용자 ID */
  user_id: string;
  /** 언어 (ko, en) */
  language: 'ko' | 'en';
  /** 타임존 */
  timezone: string;
  /** 통화 (KRW, USD) */
  currency: 'KRW' | 'USD';
  /** 알림 설정 */
  notifications: INotificationSettings;
  /** 트레이딩 설정 */
  trading: ITradingSettings;
  /** 생성일 */
  created_at: Timestamp;
  /** 업데이트일 */
  updated_at: Timestamp;
}

/**
 * 알림 설정
 */
export interface INotificationSettings {
  /** 이메일 알림 */
  email_enabled: boolean;
  /** 푸시 알림 */
  push_enabled: boolean;
  /** 주문 체결 알림 */
  order_fills: boolean;
  /** 가격 알림 */
  price_alerts: boolean;
  /** 일일 리포트 */
  daily_reports: boolean;
  /** 주간 리포트 */
  weekly_reports: boolean;
}

/**
 * 트레이딩 설정
 */
export interface ITradingSettings {
  /** 기본 실행 모드 */
  default_execution_mode: 'simulation' | 'paper' | 'live';
  /** 주문 확인 필요 여부 */
  require_order_confirmation: boolean;
  /** 자동 손절 활성화 */
  auto_stop_loss: boolean;
  /** 자동 익절 활성화 */
  auto_take_profit: boolean;
  /** 위험 경고 표시 */
  show_risk_warnings: boolean;
}

/**
 * 사용자 생성 입력
 */
export interface ICreateUserInput {
  /** 이메일 */
  email: string;
  /** 사용자명 */
  username: string;
  /** 전체 이름 */
  full_name?: string;
  /** 역할 (기본: free) */
  role?: UserRole;
}

/**
 * 사용자 업데이트 입력
 */
export interface IUpdateUserInput {
  /** 사용자명 */
  username?: string;
  /** 전체 이름 */
  full_name?: string;
  /** 프로필 이미지 URL */
  avatar_url?: string;
  /** 역할 */
  role?: UserRole;
  /** 상태 */
  status?: UserStatus;
}

/**
 * 사용자 통계
 */
export interface IUserStats {
  /** 사용자 ID */
  user_id: string;
  /** 총 거래 수 */
  total_trades: number;
  /** 승리 거래 수 */
  winning_trades: number;
  /** 패배 거래 수 */
  losing_trades: number;
  /** 승률 (%) */
  win_rate: number;
  /** 총 수익 (USD) */
  total_profit: number;
  /** 총 손실 (USD) */
  total_loss: number;
  /** 순수익 (USD) */
  net_profit: number;
  /** 최대 낙폭 (USD) */
  max_drawdown: number;
  /** 샤프 비율 */
  sharpe_ratio?: number;
  /** 활성 전략 수 */
  active_strategies: number;
  /** 활성 포지션 수 */
  active_positions: number;
  /** 마지막 계산일 */
  calculated_at: Timestamp;
}

/**
 * 기본 사용자 설정
 */
export const DEFAULT_USER_SETTINGS: Omit<IUserSettings, 'user_id' | 'created_at' | 'updated_at'> = {
  language: 'ko',
  timezone: 'Asia/Seoul',
  currency: 'KRW',
  notifications: {
    email_enabled: true,
    push_enabled: true,
    order_fills: true,
    price_alerts: true,
    daily_reports: false,
    weekly_reports: true,
  },
  trading: {
    default_execution_mode: 'simulation',
    require_order_confirmation: true,
    auto_stop_loss: false,
    auto_take_profit: false,
    show_risk_warnings: true,
  },
};
