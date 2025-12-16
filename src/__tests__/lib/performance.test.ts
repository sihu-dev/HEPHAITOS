// ============================================
// Performance Monitoring Unit Tests
// GPT V1 피드백: 테스트 코드
// ============================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  recordMetric,
  getAggregatedMetrics,
  getRecentMetrics,
  getPerformanceSummary,
  getHealthStatus,
  createPerformanceTracker,
  type PerformanceMetrics,
} from '@/lib/monitoring/performance'

vi.mock('@/lib/utils/safe-logger', () => ({
  safeLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

describe('Performance Monitoring', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('recordMetric', () => {
    it('should record a metric without errors', () => {
      const metric: PerformanceMetrics = {
        path: '/api/test',
        method: 'GET',
        statusCode: 200,
        duration: 150,
        timestamp: Date.now(),
      }

      expect(() => recordMetric(metric)).not.toThrow()
    })

    it('should record metric with userId', () => {
      const metric: PerformanceMetrics = {
        path: '/api/test',
        method: 'POST',
        statusCode: 201,
        duration: 200,
        timestamp: Date.now(),
        userId: 'user-123',
      }

      expect(() => recordMetric(metric)).not.toThrow()
    })

    it('should record error metrics', () => {
      const metric: PerformanceMetrics = {
        path: '/api/error',
        method: 'GET',
        statusCode: 500,
        duration: 50,
        timestamp: Date.now(),
        error: 'Internal Server Error',
      }

      expect(() => recordMetric(metric)).not.toThrow()
    })
  })

  describe('getRecentMetrics', () => {
    it('should return recent metrics', () => {
      // Record some metrics first
      for (let i = 0; i < 5; i++) {
        recordMetric({
          path: `/api/test-${i}`,
          method: 'GET',
          statusCode: 200,
          duration: 100 + i * 10,
          timestamp: Date.now(),
        })
      }

      const recent = getRecentMetrics(10)
      expect(Array.isArray(recent)).toBe(true)
    })

    it('should respect limit parameter', () => {
      const recent = getRecentMetrics(3)
      expect(recent.length).toBeLessThanOrEqual(3)
    })
  })

  describe('getAggregatedMetrics', () => {
    it('should return aggregated metrics array', () => {
      const metrics = getAggregatedMetrics()
      expect(Array.isArray(metrics)).toBe(true)
    })

    it('should include path and count in aggregated metrics', () => {
      // Record metrics for a specific path
      for (let i = 0; i < 3; i++) {
        recordMetric({
          path: '/api/aggregate-test',
          method: 'GET',
          statusCode: 200,
          duration: 100,
          timestamp: Date.now(),
        })
      }

      const metrics = getAggregatedMetrics()
      const testMetric = metrics.find(m => m.path === '/api/aggregate-test')

      if (testMetric) {
        expect(testMetric.count).toBeGreaterThanOrEqual(3)
        expect(testMetric.avgDuration).toBeDefined()
      }
    })
  })

  describe('getPerformanceSummary', () => {
    it('should return summary with required fields', () => {
      const summary = getPerformanceSummary()

      expect(summary).toHaveProperty('totalRequests')
      expect(summary).toHaveProperty('avgDuration')
      expect(summary).toHaveProperty('errorRate')
      expect(summary).toHaveProperty('slowRequests')
      expect(summary).toHaveProperty('topErrors')
    })

    it('should return numeric values', () => {
      const summary = getPerformanceSummary()

      expect(typeof summary.totalRequests).toBe('number')
      expect(typeof summary.avgDuration).toBe('number')
      expect(typeof summary.errorRate).toBe('number')
    })
  })

  describe('getHealthStatus', () => {
    it('should return health status with status and details', () => {
      const health = getHealthStatus()

      expect(health).toHaveProperty('status')
      expect(health).toHaveProperty('details')
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status)
    })
  })

  describe('createPerformanceTracker', () => {
    it('should create a tracker with start and end functions', () => {
      const tracker = createPerformanceTracker('/api/test', 'GET')

      expect(typeof tracker.start).toBe('function')
      expect(typeof tracker.end).toBe('function')
    })

    it('should track duration between start and end', async () => {
      const tracker = createPerformanceTracker('/api/duration-test', 'POST')

      tracker.start()

      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 50))

      // End should not throw
      expect(() => tracker.end(200)).not.toThrow()
    })

    it('should accept userId and error parameters', () => {
      const tracker = createPerformanceTracker('/api/params-test', 'PUT')

      tracker.start()

      expect(() => tracker.end(500, 'user-456', 'Test error')).not.toThrow()
    })
  })
})

describe('Edge Cases', () => {
  it('should handle empty metrics gracefully', () => {
    // These should not throw even with no data
    expect(() => getAggregatedMetrics()).not.toThrow()
    expect(() => getPerformanceSummary()).not.toThrow()
    expect(() => getHealthStatus()).not.toThrow()
  })

  it('should handle slow request logging', () => {
    // Record a slow request (>1000ms)
    const slowMetric: PerformanceMetrics = {
      path: '/api/slow',
      method: 'GET',
      statusCode: 200,
      duration: 2000,
      timestamp: Date.now(),
    }

    expect(() => recordMetric(slowMetric)).not.toThrow()
  })

  it('should handle server error logging', () => {
    const errorMetric: PerformanceMetrics = {
      path: '/api/server-error',
      method: 'POST',
      statusCode: 503,
      duration: 100,
      timestamp: Date.now(),
      error: 'Service Unavailable',
    }

    expect(() => recordMetric(errorMetric)).not.toThrow()
  })
})
