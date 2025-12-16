// ============================================
// Error Handler Tests
// ============================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createAppError,
  determineErrorSeverity,
  errorCodeFromStatus,
  getUserFriendlyMessage,
  safeAsync,
  withRetry,
  ERROR_CODES,
} from '@/lib/error-handler'

describe('Error Handler', () => {
  describe('createAppError()', () => {
    it('should create AppError from Error object', () => {
      const error = new Error('Test error')
      const appError = createAppError(error, 'NETWORK_ERROR', 'high')

      expect(appError.message).toBe('Test error')
      expect(appError.code).toBe('NETWORK_ERROR')
      expect(appError.severity).toBe('high')
      expect(appError.timestamp).toBeInstanceOf(Date)
    })

    it('should create AppError from string', () => {
      const appError = createAppError('Test error string', 'API_ERROR', 'medium')

      expect(appError.message).toBe('Test error string')
      expect(appError.code).toBe('API_ERROR')
      expect(appError.severity).toBe('medium')
    })

    it('should include context when provided', () => {
      const context = { userId: '123', action: 'test' }
      const appError = createAppError('Error', 'INTERNAL_ERROR', 'high', context)

      expect(appError.context).toEqual(context)
    })

    it('should use default values when not provided', () => {
      const appError = createAppError('Error')

      expect(appError.code).toBe('UNKNOWN_ERROR')
      expect(appError.severity).toBe('medium')
    })
  })

  describe('determineErrorSeverity()', () => {
    it('should return critical for critical errors', () => {
      const error = new Error('This is a critical failure')
      expect(determineErrorSeverity(error)).toBe('critical')
    })

    it('should return critical for fatal errors', () => {
      const error = new Error('Fatal database error')
      expect(determineErrorSeverity(error)).toBe('critical')
    })

    it('should return high for unauthorized errors', () => {
      const error = new Error('User unauthorized')
      expect(determineErrorSeverity(error)).toBe('high')
    })

    it('should return high for forbidden errors', () => {
      const error = new Error('Access forbidden')
      expect(determineErrorSeverity(error)).toBe('high')
    })

    it('should return medium for network errors', () => {
      const error = new Error('Network request failed')
      expect(determineErrorSeverity(error)).toBe('medium')
    })

    it('should return medium for timeout errors', () => {
      const error = new Error('Request timeout')
      expect(determineErrorSeverity(error)).toBe('medium')
    })

    it('should return low for generic errors', () => {
      const error = new Error('Something went wrong')
      expect(determineErrorSeverity(error)).toBe('low')
    })
  })

  describe('errorCodeFromStatus()', () => {
    it('should return VALIDATION_ERROR for 400', () => {
      expect(errorCodeFromStatus(400)).toBe('VALIDATION_ERROR')
    })

    it('should return UNAUTHORIZED for 401', () => {
      expect(errorCodeFromStatus(401)).toBe('UNAUTHORIZED')
    })

    it('should return FORBIDDEN for 403', () => {
      expect(errorCodeFromStatus(403)).toBe('FORBIDDEN')
    })

    it('should return NOT_FOUND for 404', () => {
      expect(errorCodeFromStatus(404)).toBe('NOT_FOUND')
    })

    it('should return RATE_LIMITED for 429', () => {
      expect(errorCodeFromStatus(429)).toBe('RATE_LIMITED')
    })

    it('should return INTERNAL_ERROR for 500', () => {
      expect(errorCodeFromStatus(500)).toBe('INTERNAL_ERROR')
    })

    it('should return INTERNAL_ERROR for 502', () => {
      expect(errorCodeFromStatus(502)).toBe('INTERNAL_ERROR')
    })

    it('should return INTERNAL_ERROR for 503', () => {
      expect(errorCodeFromStatus(503)).toBe('INTERNAL_ERROR')
    })

    it('should return UNKNOWN_ERROR for unknown status', () => {
      expect(errorCodeFromStatus(418)).toBe('UNKNOWN_ERROR')
    })
  })

  describe('getUserFriendlyMessage()', () => {
    it('should return correct message for NETWORK_ERROR', () => {
      const message = getUserFriendlyMessage('NETWORK_ERROR')
      expect(message).toBe('네트워크 연결을 확인해주세요.')
    })

    it('should return correct message for UNAUTHORIZED', () => {
      const message = getUserFriendlyMessage('UNAUTHORIZED')
      expect(message).toBe('로그인이 필요합니다.')
    })

    it('should return correct message for RATE_LIMITED', () => {
      const message = getUserFriendlyMessage('RATE_LIMITED')
      expect(message).toContain('요청이 너무 많습니다')
    })

    it('should return default message for unknown code', () => {
      const message = getUserFriendlyMessage('UNKNOWN_ERROR')
      expect(message).toBe('알 수 없는 오류가 발생했습니다.')
    })

    it('should have messages for all error codes', () => {
      for (const code of Object.keys(ERROR_CODES)) {
        const message = getUserFriendlyMessage(code as keyof typeof ERROR_CODES)
        expect(message).toBeTruthy()
        expect(typeof message).toBe('string')
      }
    })
  })

  describe('safeAsync()', () => {
    it('should return result on success', async () => {
      const fn = vi.fn().mockResolvedValue('success')
      const result = await safeAsync(fn)

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should return undefined on error', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Failed'))
      const result = await safeAsync(fn)

      expect(result).toBeUndefined()
    })

    it('should return fallback on error when provided', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Failed'))
      const result = await safeAsync(fn, { fallback: 'default' })

      expect(result).toBe('default')
    })

    it('should rethrow error when rethrow option is true', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Failed'))

      await expect(safeAsync(fn, { rethrow: true })).rejects.toThrow('Failed')
    })

    it('should handle non-Error throws', async () => {
      const fn = vi.fn().mockRejectedValue('string error')
      const result = await safeAsync(fn)

      expect(result).toBeUndefined()
    })
  })

  describe('withRetry()', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should return result on first success', async () => {
      const fn = vi.fn().mockResolvedValue('success')
      const retryFn = withRetry(fn, { maxRetries: 3 })

      const result = await retryFn()

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure and succeed', async () => {
      vi.useRealTimers() // Use real timers for this test

      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success')

      const retryFn = withRetry(fn, { maxRetries: 3, delay: 10 }) // Short delay for real timers

      const result = await retryFn()

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(3)
    })

    it('should throw after max retries', async () => {
      vi.useRealTimers() // Use real timers for this test

      const fn = vi.fn().mockRejectedValue(new Error('Always fails'))
      const retryFn = withRetry(fn, { maxRetries: 3, delay: 10 })

      await expect(retryFn()).rejects.toThrow('Always fails')
      expect(fn).toHaveBeenCalledTimes(3)
    })

    it('should respect shouldRetry callback', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Stop retry'))
      const shouldRetry = vi.fn().mockReturnValue(false)

      const retryFn = withRetry(fn, { maxRetries: 3, shouldRetry })

      await expect(retryFn()).rejects.toThrow('Stop retry')
      expect(fn).toHaveBeenCalledTimes(1)
      expect(shouldRetry).toHaveBeenCalledTimes(1)
    })

    it('should use exponential backoff', async () => {
      vi.useRealTimers() // Use real timers for this test

      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValue('success')

      const retryFn = withRetry(fn, { maxRetries: 3, delay: 10, backoff: 2 })

      const result = await retryFn()
      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(3)
    })
  })
})
