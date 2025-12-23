/**
 * @hephaitos/core - NotificationService Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { NotificationService } from '../services/notification-service.js';
import type { ISendNotificationInput } from '../services/notification-service.js';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
  });

  describe('send', () => {
    it('should send notification successfully', async () => {
      const input: ISendNotificationInput = {
        user_id: 'user-123',
        channel: 'email',
        priority: 'normal',
        title: 'Test Notification',
        message: 'This is a test notification',
      };

      const result = await service.send(input);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.id).toBeDefined();
      expect(result.data!.user_id).toBe(input.user_id);
      expect(result.data!.channel).toBe(input.channel);
      expect(result.data!.status).toBe('sent');
      expect(result.data!.sent_at).toBeDefined();
    });

    it('should support different channels', async () => {
      const channels: Array<'email' | 'push' | 'sms' | 'webhook'> = ['email', 'push', 'sms', 'webhook'];

      for (const channel of channels) {
        const input: ISendNotificationInput = {
          user_id: 'user-123',
          channel,
          priority: 'normal',
          title: 'Test',
          message: 'Test message',
        };

        const result = await service.send(input);

        expect(result.success).toBe(true);
        expect(result.data!.channel).toBe(channel);
      }
    });

    it('should support different priorities', async () => {
      const priorities: Array<'low' | 'normal' | 'high' | 'urgent'> = ['low', 'normal', 'high', 'urgent'];

      for (const priority of priorities) {
        const input: ISendNotificationInput = {
          user_id: 'user-123',
          channel: 'email',
          priority,
          title: 'Test',
          message: 'Test message',
        };

        const result = await service.send(input);

        expect(result.success).toBe(true);
        expect(result.data!.priority).toBe(priority);
      }
    });

    it('should include additional data if provided', async () => {
      const input: ISendNotificationInput = {
        user_id: 'user-123',
        channel: 'push',
        priority: 'high',
        title: 'Order Filled',
        message: 'Your order has been filled',
        data: {
          order_id: 'order-456',
          symbol: 'AAPL',
          quantity: 10,
        },
      };

      const result = await service.send(input);

      expect(result.success).toBe(true);
      expect(result.data!.data).toEqual(input.data);
    });

    it('should include metadata', async () => {
      const input: ISendNotificationInput = {
        user_id: 'user-123',
        channel: 'email',
        priority: 'normal',
        title: 'Test',
        message: 'Test',
      };

      const result = await service.send(input);

      expect(result.metadata).toBeDefined();
      expect(result.metadata!.timestamp).toBeDefined();
      expect(result.metadata!.duration_ms).toBeGreaterThanOrEqual(0);
    });
  });

  describe('sendBulk', () => {
    it('should send notifications to multiple users', async () => {
      const userIds = ['user-1', 'user-2', 'user-3'];
      const input = {
        channel: 'email' as const,
        priority: 'normal' as const,
        title: 'Bulk Notification',
        message: 'This is a bulk notification',
      };

      const result = await service.sendBulk(userIds, input);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.length).toBe(userIds.length);

      result.data!.forEach((notification, index) => {
        expect(notification.user_id).toBe(userIds[index]);
        expect(notification.channel).toBe(input.channel);
        expect(notification.title).toBe(input.title);
      });
    });

    it('should handle empty user list', async () => {
      const result = await service.sendBulk([], {
        channel: 'email',
        priority: 'normal',
        title: 'Test',
        message: 'Test',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const sendResult = await service.send({
        user_id: 'user-123',
        channel: 'push',
        priority: 'normal',
        title: 'Test',
        message: 'Test',
      });

      const notificationId = sendResult.data!.id;
      const result = await service.markAsRead(notificationId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.is_read).toBe(true);
      expect(result.data!.read_at).toBeDefined();
    });

    it('should return error for non-existent notification', async () => {
      const result = await service.markAsRead('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.message).toContain('not found');
    });
  });

  describe('getUnreadCount', () => {
    it('should return 0 for user with no notifications', async () => {
      const result = await service.getUnreadCount('new-user');

      expect(result.success).toBe(true);
      expect(result.data).toBe(0);
    });

    it('should count unread notifications correctly', async () => {
      const userId = 'user-123';

      // Send 3 notifications
      await service.send({
        user_id: userId,
        channel: 'email',
        priority: 'normal',
        title: 'Test 1',
        message: 'Test 1',
      });

      await service.send({
        user_id: userId,
        channel: 'push',
        priority: 'normal',
        title: 'Test 2',
        message: 'Test 2',
      });

      await service.send({
        user_id: userId,
        channel: 'sms',
        priority: 'normal',
        title: 'Test 3',
        message: 'Test 3',
      });

      const result = await service.getUnreadCount(userId);

      expect(result.success).toBe(true);
      expect(result.data).toBe(3);
    });

    it('should not count read notifications', async () => {
      const userId = 'user-123';

      const result1 = await service.send({
        user_id: userId,
        channel: 'email',
        priority: 'normal',
        title: 'Test 1',
        message: 'Test 1',
      });

      await service.send({
        user_id: userId,
        channel: 'push',
        priority: 'normal',
        title: 'Test 2',
        message: 'Test 2',
      });

      // Mark first one as read
      await service.markAsRead(result1.data!.id);

      const countResult = await service.getUnreadCount(userId);

      expect(countResult.success).toBe(true);
      expect(countResult.data).toBe(1); // Only 1 unread
    });
  });

  describe('factory function', () => {
    it('should create service via createNotificationService', async () => {
      const { createNotificationService } = await import('../services/notification-service.js');
      const service = createNotificationService();

      const result = await service.send({
        user_id: 'user-123',
        channel: 'email',
        priority: 'normal',
        title: 'Test',
        message: 'Test',
      });

      expect(result.success).toBe(true);
    });
  });
});
