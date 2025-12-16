// ============================================
// Slack Notification Service Unit Tests
// GPT V1 피드백: 테스트 코드
// ============================================

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  notifyDLQItem,
  notifyCircuitOpen,
  notifyDailySummary,
  notifyUrgent,
} from '@/lib/notifications/slack'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

vi.mock('@/lib/utils/safe-logger', () => ({
  safeLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

describe('Slack Notification Service', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = {
      ...originalEnv,
      SLACK_WEBHOOK_URL_ALERTS: 'https://hooks.slack.com/services/test/alerts',
      SLACK_WEBHOOK_URL_REPORTS: 'https://hooks.slack.com/services/test/reports',
      NEXT_PUBLIC_APP_URL: 'https://hephaitos.io',
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('notifyDLQItem', () => {
    it('should send DLQ notification successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      })

      const result = await notifyDLQItem({
        eventId: 'event-123',
        orderId: 'order-456',
        error: 'Payment timeout',
        failureCount: 3,
        provider: 'toss',
      })

      expect(result).toBe(true)
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://hooks.slack.com/services/test/alerts',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      )
    })

    it('should return false when webhook URL is not configured', async () => {
      delete process.env.SLACK_WEBHOOK_URL_ALERTS

      const result = await notifyDLQItem({
        eventId: 'event-123',
        orderId: 'order-456',
        error: 'Payment timeout',
        failureCount: 3,
        provider: 'toss',
      })

      expect(result).toBe(false)
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should return false when webhook request fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      const result = await notifyDLQItem({
        eventId: 'event-123',
        orderId: 'order-456',
        error: 'Payment timeout',
        failureCount: 3,
        provider: 'toss',
      })

      expect(result).toBe(false)
    })
  })

  describe('notifyCircuitOpen', () => {
    it('should send circuit open notification successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      })

      const result = await notifyCircuitOpen({
        circuitName: 'payment',
        identifier: 'toss-api',
        failures: 5,
        cooldownMs: 60000,
      })

      expect(result).toBe(true)
      expect(mockFetch).toHaveBeenCalledTimes(1)

      // Verify the body contains expected content
      const callArgs = mockFetch.mock.calls[0]
      const body = JSON.parse(callArgs[1].body)
      expect(body.blocks).toBeDefined()
      expect(body.blocks[0].text.text).toContain('Circuit Breaker Opened')
    })

    it('should calculate cooldown minutes correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      })

      await notifyCircuitOpen({
        circuitName: 'ai',
        identifier: 'claude-api',
        failures: 3,
        cooldownMs: 300000, // 5 minutes
      })

      const callArgs = mockFetch.mock.calls[0]
      const body = JSON.parse(callArgs[1].body)
      const cooldownField = body.blocks[1].fields.find((f: { text: string }) =>
        f.text.includes('Cooldown')
      )
      expect(cooldownField.text).toContain('5 minutes')
    })
  })

  describe('notifyDailySummary', () => {
    it('should send daily summary successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      })

      const result = await notifyDailySummary({
        date: '2025-12-17',
        webhooks: {
          total: 100,
          processed: 95,
          failed: 3,
          dlq: 2,
        },
        credits: {
          purchased: 50000,
          spent: 30000,
        },
        circuits: {
          openCount: 1,
        },
      })

      expect(result).toBe(true)

      const callArgs = mockFetch.mock.calls[0]
      expect(callArgs[0]).toBe('https://hooks.slack.com/services/test/reports')
    })

    it('should return false when reports webhook is not configured', async () => {
      delete process.env.SLACK_WEBHOOK_URL_REPORTS

      const result = await notifyDailySummary({
        date: '2025-12-17',
        webhooks: { total: 0, processed: 0, failed: 0, dlq: 0 },
        credits: { purchased: 0, spent: 0 },
        circuits: { openCount: 0 },
      })

      expect(result).toBe(false)
    })
  })

  describe('notifyUrgent', () => {
    it('should send urgent notification with high severity', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      })

      const result = await notifyUrgent({
        title: 'Payment Gateway Down',
        message: 'All payments are failing',
        severity: 'high',
        context: {
          Gateway: 'Toss',
          'Error Rate': '100%',
        },
      })

      expect(result).toBe(true)

      const callArgs = mockFetch.mock.calls[0]
      const body = JSON.parse(callArgs[1].body)
      expect(body.attachments[0].color).toBe('#FFA500') // Orange for high
    })

    it('should send urgent notification with critical severity', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      })

      const result = await notifyUrgent({
        title: 'Database Connection Lost',
        message: 'Cannot connect to primary database',
        severity: 'critical',
      })

      expect(result).toBe(true)

      const callArgs = mockFetch.mock.calls[0]
      const body = JSON.parse(callArgs[1].body)
      expect(body.attachments[0].color).toBe('#FF0000') // Red for critical
    })

    it('should return false when alerts webhook is not configured', async () => {
      delete process.env.SLACK_WEBHOOK_URL_ALERTS

      const result = await notifyUrgent({
        title: 'Test Alert',
        message: 'Test message',
        severity: 'high',
      })

      expect(result).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await notifyDLQItem({
        eventId: 'event-123',
        orderId: 'order-456',
        error: 'Test error',
        failureCount: 1,
        provider: 'test',
      })

      expect(result).toBe(false)
    })

    it('should handle JSON parse errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error('Invalid JSON')),
      })

      // This should still return true because we only check ok status
      const result = await notifyCircuitOpen({
        circuitName: 'test',
        identifier: 'test-id',
        failures: 1,
        cooldownMs: 1000,
      })

      expect(result).toBe(true)
    })
  })
})
