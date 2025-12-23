/**
 * @hephaitos/core - Notification Service
 * L2 (Cells) - 알림 전송 서비스
 */

import { randomUUID } from 'node:crypto';
import type { IResult } from '@hephaitos/types';

/**
 * 알림 채널
 */
export type NotificationChannel = 'email' | 'push' | 'sms' | 'webhook';

/**
 * 알림 우선순위
 */
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * 알림 전송 입력
 */
export interface ISendNotificationInput {
  /** 사용자 ID */
  user_id: string;
  /** 채널 */
  channel: NotificationChannel;
  /** 우선순위 */
  priority: NotificationPriority;
  /** 제목 */
  title: string;
  /** 메시지 */
  message: string;
  /** 데이터 (추가 정보) */
  data?: Record<string, unknown>;
  /** 예약 전송 시간 */
  scheduled_at?: string;
}

/**
 * 전송된 알림
 */
export interface ISentNotification {
  /** 알림 ID */
  id: string;
  /** 사용자 ID */
  user_id: string;
  /** 채널 */
  channel: NotificationChannel;
  /** 우선순위 */
  priority: NotificationPriority;
  /** 제목 */
  title: string;
  /** 메시지 */
  message: string;
  /** 데이터 */
  data?: Record<string, unknown>;
  /** 전송 상태 */
  status: 'pending' | 'sent' | 'failed' | 'read';
  /** 전송 시간 */
  sent_at?: string;
  /** 읽은 시간 */
  read_at?: string;
  /** 생성 시간 */
  created_at: string;
}

/**
 * 알림 서비스 인터페이스
 */
export interface INotificationService {
  /** 알림 전송 */
  send(input: ISendNotificationInput): Promise<IResult<ISentNotification>>;

  /** 여러 사용자에게 알림 전송 (브로드캐스트) */
  sendBulk(userIds: string[], input: Omit<ISendNotificationInput, 'user_id'>): Promise<IResult<ISentNotification[]>>;

  /** 알림 읽음 처리 */
  markAsRead(notificationId: string): Promise<IResult<ISentNotification>>;

  /** 사용자별 알림 조회 */
  getByUserId(userId: string, unreadOnly?: boolean): Promise<IResult<ISentNotification[]>>;

  /** 알림 삭제 */
  delete(notificationId: string): Promise<IResult<boolean>>;

  /** 읽지 않은 알림 수 */
  getUnreadCount(userId: string): Promise<IResult<number>>;
}

/**
 * 알림 서비스 구현
 */
export class NotificationService implements INotificationService {
  private notifications: Map<string, ISentNotification> = new Map();

  async send(input: ISendNotificationInput): Promise<IResult<ISentNotification>> {
    const startTime = Date.now();
    try {
      const now = new Date().toISOString();
      const notification: ISentNotification = {
        id: randomUUID(),
        user_id: input.user_id,
        channel: input.channel,
        priority: input.priority,
        title: input.title,
        message: input.message,
        data: input.data,
        status: 'sent',
        sent_at: now,
        created_at: now,
      };

      // TODO: 실제 전송 로직 (이메일 API, Push 서비스 등)
      // 현재는 In-Memory 저장만 수행
      this.notifications.set(notification.id, notification);

      return {
        success: true,
        data: notification,
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

  async sendBulk(userIds: string[], input: Omit<ISendNotificationInput, 'user_id'>): Promise<IResult<ISentNotification[]>> {
    const startTime = Date.now();
    try {
      const notifications: ISentNotification[] = [];

      for (const userId of userIds) {
        const result = await this.send({
          user_id: userId,
          ...input,
        });

        if (result.success && result.data) {
          notifications.push(result.data);
        }
      }

      return {
        success: true,
        data: notifications,
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

  async markAsRead(notificationId: string): Promise<IResult<ISentNotification>> {
    const startTime = Date.now();
    try {
      const notification = this.notifications.get(notificationId);

      if (!notification) {
        return {
          success: false,
          error: new Error('Notification not found'),
          metadata: {
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
          },
        };
      }

      const updated: ISentNotification = {
        ...notification,
        status: 'read',
        read_at: new Date().toISOString(),
      };

      this.notifications.set(notificationId, updated);

      return {
        success: true,
        data: updated,
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

  async getByUserId(userId: string, unreadOnly: boolean = false): Promise<IResult<ISentNotification[]>> {
    const startTime = Date.now();
    try {
      let notifications = Array.from(this.notifications.values()).filter(
        (n) => n.user_id === userId
      );

      if (unreadOnly) {
        notifications = notifications.filter((n) => n.status !== 'read');
      }

      // Sort by created_at desc
      notifications.sort((a, b) => b.created_at.localeCompare(a.created_at));

      return {
        success: true,
        data: notifications,
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

  async delete(notificationId: string): Promise<IResult<boolean>> {
    const startTime = Date.now();
    try {
      this.notifications.delete(notificationId);

      return {
        success: true,
        data: true,
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

  async getUnreadCount(userId: string): Promise<IResult<number>> {
    const startTime = Date.now();
    try {
      const unreadCount = Array.from(this.notifications.values()).filter(
        (n) => n.user_id === userId && n.status !== 'read'
      ).length;

      return {
        success: true,
        data: unreadCount,
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
 * 팩토리 함수
 */
export function createNotificationService(): INotificationService {
  return new NotificationService();
}
