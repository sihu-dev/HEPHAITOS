// ============================================
// API Response Helper Tests
// ============================================

import { describe, it, expect } from 'vitest'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response'

describe('API Response Helpers', () => {
  describe('createSuccessResponse()', () => {
    it('should create success response with data', () => {
      const data = { id: '1', name: 'Test' }
      const response = createSuccessResponse(data)

      expect(response.success).toBe(true)
      expect(response.data).toEqual(data)
    })

    it('should work with array data', () => {
      const data = [{ id: '1' }, { id: '2' }]
      const response = createSuccessResponse(data)

      expect(response.success).toBe(true)
      expect(response.data).toEqual(data)
    })

    it('should work with primitive data', () => {
      const response = createSuccessResponse('test string')

      expect(response.success).toBe(true)
      expect(response.data).toBe('test string')
    })

    it('should work with null data', () => {
      const response = createSuccessResponse(null)

      expect(response.success).toBe(true)
      expect(response.data).toBeNull()
    })

    it('should work with nested objects', () => {
      const data = {
        user: {
          profile: {
            name: 'Test',
          },
        },
      }
      const response = createSuccessResponse(data)

      expect(response.success).toBe(true)
      expect(response.data?.user.profile.name).toBe('Test')
    })
  })

  describe('createErrorResponse()', () => {
    it('should create error response with code and message', () => {
      const response = createErrorResponse('NOT_FOUND', 'Resource not found')

      expect(response.success).toBe(false)
      expect(response.error?.code).toBe('NOT_FOUND')
      expect(response.error?.message).toBe('Resource not found')
    })

    it('should handle different error codes', () => {
      const codes = [
        'VALIDATION_ERROR',
        'INTERNAL_ERROR',
        'UNAUTHORIZED',
        'FORBIDDEN',
        'RATE_LIMITED',
      ]

      for (const code of codes) {
        const response = createErrorResponse(code, 'Test message')
        expect(response.error?.code).toBe(code)
      }
    })

    it('should handle empty message', () => {
      const response = createErrorResponse('ERROR', '')

      expect(response.error?.message).toBe('')
    })

    it('should handle long messages', () => {
      const longMessage = 'a'.repeat(1000)
      const response = createErrorResponse('ERROR', longMessage)

      expect(response.error?.message).toBe(longMessage)
    })

    it('should handle unicode messages', () => {
      const message = '오류가 발생했습니다. 다시 시도해주세요.'
      const response = createErrorResponse('ERROR', message)

      expect(response.error?.message).toBe(message)
    })
  })
})
