/**
 * @hephaitos/types - HEPHAITOS Alert Types
 * L0 (Atoms) - 알림/알람 타입 정의
 */

import type { Timestamp } from './common.js';

export type AlertType = 'price' | 'order_fill' | 'position_change' | 'risk_limit' | 'system';
export type AlertStatus = 'active' | 'triggered' | 'cancelled';
export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';

export interface IAlert {
  id: string;
  user_id: string;
  type: AlertType;
  status: AlertStatus;
  priority: AlertPriority;
  title: string;
  message: string;
  symbol?: string;
  trigger_price?: number;
  metadata?: Record<string, unknown>;
  triggered_at?: Timestamp;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface ICreateAlertInput {
  user_id: string;
  type: AlertType;
  priority: AlertPriority;
  title: string;
  message: string;
  symbol?: string;
  trigger_price?: number;
  metadata?: Record<string, unknown>;
}
