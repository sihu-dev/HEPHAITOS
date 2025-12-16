// ============================================
// Trading Logger Unit Tests (2026)
// ============================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TradingLogger, ErrorMetricsTracker } from '@/lib/trading/logger'
import type { LogLevel } from '@/lib/trading/logger'

describe('TradingLogger', () => {
  let logger: TradingLogger

  beforeEach(() => {
    logger = new TradingLogger({
      minLevel: 'debug',
      enableConsole: false,
    })
  })

  describe('Logging Levels', () => {
    it('should log debug messages', () => {
      logger.debug('TestComponent', 'Debug message', { key: 'value' })
      const logs = logger.getLogs({ level: 'debug' })

      expect(logs).toHaveLength(1)
      expect(logs[0].level).toBe('debug')
      expect(logs[0].component).toBe('TestComponent')
      expect(logs[0].message).toBe('Debug message')
      expect(logs[0].data).toEqual({ key: 'value' })
    })

    it('should log info messages', () => {
      logger.info('TestComponent', 'Info message')
      const logs = logger.getLogs({ level: 'info' })

      expect(logs).toHaveLength(1)
      expect(logs[0].level).toBe('info')
    })

    it('should log warn messages', () => {
      logger.warn('TestComponent', 'Warning message')
      const logs = logger.getLogs({ level: 'warn' })

      expect(logs).toHaveLength(1)
      expect(logs[0].level).toBe('warn')
    })

    it('should log error messages with error object', () => {
      const error = new Error('Test error')
      logger.error('TestComponent', 'Error occurred', error, { userId: '123' })
      const logs = logger.getLogs({ level: 'error' })

      expect(logs).toHaveLength(1)
      expect(logs[0].level).toBe('error')
      expect(logs[0].error).toBeDefined()
      expect(logs[0].error?.message).toBe('Test error')
      expect(logs[0].data).toEqual({ userId: '123' })
    })

    it('should log critical messages', () => {
      const error = new Error('Critical error')
      logger.critical('TestComponent', 'System failure', error)
      const logs = logger.getLogs({ level: 'critical' })

      expect(logs).toHaveLength(1)
      expect(logs[0].level).toBe('critical')
    })
  })

  describe('Log Filtering', () => {
    beforeEach(() => {
      logger.debug('ComponentA', 'Debug A')
      logger.info('ComponentB', 'Info B')
      logger.warn('ComponentA', 'Warn A')
      logger.error('ComponentB', 'Error B', new Error('Test'))
    })

    it('should filter by log level', () => {
      const errorLogs = logger.getLogs({ level: 'error' })
      expect(errorLogs).toHaveLength(1)
      expect(errorLogs[0].level).toBe('error')
    })

    it('should filter by component', () => {
      const componentALogs = logger.getLogs({ component: 'ComponentA' })
      expect(componentALogs).toHaveLength(2)
      expect(componentALogs.every((log) => log.component === 'ComponentA')).toBe(true)
    })

    it('should filter by time range', () => {
      const since = new Date(Date.now() - 1000) // 1 second ago
      const recentLogs = logger.getLogs({ since })

      expect(recentLogs.length).toBeGreaterThan(0)
      expect(recentLogs.every((log) => log.timestamp >= since)).toBe(true)
    })

    it('should combine multiple filters', () => {
      const filteredLogs = logger.getLogs({
        level: 'warn',
        component: 'ComponentA',
      })

      expect(filteredLogs).toHaveLength(1)
      expect(filteredLogs[0].level).toBe('warn')
      expect(filteredLogs[0].component).toBe('ComponentA')
    })
  })

  describe('Error Counting', () => {
    it('should count total errors', () => {
      logger.error('ComponentA', 'Error 1', new Error('1'))
      logger.error('ComponentB', 'Error 2', new Error('2'))
      logger.error('ComponentA', 'Error 3', new Error('3'))

      expect(logger.getErrorCount()).toBe(3)
    })

    it('should count errors by component', () => {
      logger.error('ComponentA', 'Error 1', new Error('1'))
      logger.error('ComponentB', 'Error 2', new Error('2'))
      logger.error('ComponentA', 'Error 3', new Error('3'))

      expect(logger.getErrorCount('ComponentA')).toBe(2)
      expect(logger.getErrorCount('ComponentB')).toBe(1)
    })

    it('should include critical errors in count', () => {
      logger.error('Component', 'Error', new Error('1'))
      logger.critical('Component', 'Critical', new Error('2'))

      expect(logger.getErrorCount()).toBe(2)
    })
  })

  describe('Log Export', () => {
    it('should export logs as JSON', () => {
      logger.info('TestComponent', 'Test message')
      const exported = logger.exportLogs()
      const parsed = JSON.parse(exported)

      expect(Array.isArray(parsed)).toBe(true)
      expect(parsed).toHaveLength(1)
      expect(parsed[0].component).toBe('TestComponent')
    })

    it('should handle empty logs', () => {
      const exported = logger.exportLogs()
      const parsed = JSON.parse(exported)

      expect(parsed).toEqual([])
    })
  })

  describe('Log Level Changes', () => {
    it('should respect minimum log level', () => {
      const restrictedLogger = new TradingLogger({
        minLevel: 'warn',
        enableConsole: false,
      })

      restrictedLogger.debug('Component', 'Debug')
      restrictedLogger.info('Component', 'Info')
      restrictedLogger.warn('Component', 'Warn')
      restrictedLogger.error('Component', 'Error', new Error('Test'))

      const logs = restrictedLogger.getLogs()
      expect(logs).toHaveLength(2) // Only warn and error
    })

    it('should change log level at runtime', () => {
      logger.debug('Component', 'Debug 1')
      logger.setLogLevel('error')
      logger.info('Component', 'Info') // Should be filtered
      logger.error('Component', 'Error', new Error('Test'))

      const logs = logger.getLogs()
      expect(logs).toHaveLength(2) // Debug 1 + Error
    })
  })

  describe('Max Logs Limit', () => {
    it('should maintain max log count (1000)', () => {
      // Generate 1100 logs
      for (let i = 0; i < 1100; i++) {
        logger.info('Component', `Log ${i}`)
      }

      const logs = logger.getLogs()
      expect(logs.length).toBeLessThanOrEqual(1000)
    })

    it('should keep most recent logs when limit exceeded', () => {
      for (let i = 0; i < 1100; i++) {
        logger.info('Component', `Log ${i}`)
      }

      const logs = logger.getLogs()
      const lastLog = logs[logs.length - 1]
      expect(lastLog.message).toBe('Log 1099')
    })
  })
})

describe('ErrorMetricsTracker', () => {
  let tracker: ErrorMetricsTracker

  beforeEach(() => {
    tracker = new ErrorMetricsTracker()
  })

  describe('Error Tracking', () => {
    it('should track errors', () => {
      tracker.track({
        timestamp: new Date(),
        level: 'error',
        component: 'TestComponent',
        message: 'Test error',
        error: {
          name: 'Error',
          message: 'Test',
          stack: 'stack trace',
        },
      })

      const metrics = tracker.getMetrics()
      expect(metrics.totalErrors).toBe(1)
    })

    it('should calculate error rate (per minute)', () => {
      // Add 10 errors in current time window
      for (let i = 0; i < 10; i++) {
        tracker.track({
          timestamp: new Date(),
          level: 'error',
          component: 'Component',
          message: `Error ${i}`,
        })
      }

      const metrics = tracker.getMetrics()
      expect(metrics.errorRate).toBeGreaterThan(0)
    })

    it('should group errors by type', () => {
      tracker.track({
        timestamp: new Date(),
        level: 'error',
        component: 'Component',
        message: 'Error 1',
        error: {
          name: 'TypeError',
          message: 'Type error',
          stack: '',
        },
      })

      tracker.track({
        timestamp: new Date(),
        level: 'error',
        component: 'Component',
        message: 'Error 2',
        error: {
          name: 'TypeError',
          message: 'Another type error',
          stack: '',
        },
      })

      tracker.track({
        timestamp: new Date(),
        level: 'error',
        component: 'Component',
        message: 'Error 3',
        error: {
          name: 'ReferenceError',
          message: 'Reference error',
          stack: '',
        },
      })

      const metrics = tracker.getMetrics()
      expect(metrics.errorsByType['TypeError']).toBe(2)
      expect(metrics.errorsByType['ReferenceError']).toBe(1)
    })

    it('should handle errors without error object', () => {
      tracker.track({
        timestamp: new Date(),
        level: 'error',
        component: 'Component',
        message: 'Generic error',
      })

      const metrics = tracker.getMetrics()
      expect(metrics.errorsByType['Unknown']).toBe(1)
    })
  })

  describe('Error Rate Detection', () => {
    it('should detect high error rate (default threshold 10/min)', () => {
      // Add 15 errors in current window
      for (let i = 0; i < 15; i++) {
        tracker.track({
          timestamp: new Date(),
          level: 'error',
          component: 'Component',
          message: `Error ${i}`,
        })
      }

      expect(tracker.isErrorRateHigh()).toBe(true)
    })

    it('should not flag low error rate', () => {
      // Add 5 errors
      for (let i = 0; i < 5; i++) {
        tracker.track({
          timestamp: new Date(),
          level: 'error',
          component: 'Component',
          message: `Error ${i}`,
        })
      }

      expect(tracker.isErrorRateHigh()).toBe(false)
    })

    it('should use custom threshold', () => {
      // Add 8 errors
      for (let i = 0; i < 8; i++) {
        tracker.track({
          timestamp: new Date(),
          level: 'error',
          component: 'Component',
          message: `Error ${i}`,
        })
      }

      expect(tracker.isErrorRateHigh(5)).toBe(true)
      expect(tracker.isErrorRateHigh(10)).toBe(false)
    })
  })

  describe('Time Window', () => {
    it('should only count errors within 60-second window', () => {
      const now = Date.now()

      // Old error (2 minutes ago)
      tracker.track({
        timestamp: new Date(now - 120 * 1000),
        level: 'error',
        component: 'Component',
        message: 'Old error',
      })

      // Recent error
      tracker.track({
        timestamp: new Date(),
        level: 'error',
        component: 'Component',
        message: 'Recent error',
      })

      const metrics = tracker.getMetrics()
      // totalErrors counts only errors within the time window (recent errors)
      // Old errors are excluded from metrics
      expect(metrics.totalErrors).toBe(1)
      expect(metrics.errorRate).toBe(1)
    })
  })
})
