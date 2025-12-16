// ============================================
// API Middleware Tests
// Rate Limiting + Error Handler 통합 테스트
// ============================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Mock Redis module
vi.mock('@/lib/redis/rate-limiter', () => ({
  RedisRateLimiter: class {
    check = vi.fn(() => Promise.resolve({ allowed: true, remaining: 99, resetTime: Date.now() + 60000 }))
  },
  apiRateLimiter: {
    check: vi.fn(() => Promise.resolve({ allowed: true, remaining: 99, resetTime: Date.now() + 60000 })),
  },
  exchangeRateLimiter: {
    check: vi.fn(() => Promise.resolve({ allowed: true, remaining: 29, resetTime: Date.now() + 60000 })),
  },
  authRateLimiter: {
    check: vi.fn(() => Promise.resolve({ allowed: true, remaining: 9, resetTime: Date.now() + 60000 })),
  },
  aiRateLimiter: {
    check: vi.fn(() => Promise.resolve({ allowed: true, remaining: 19, resetTime: Date.now() + 60000 })),
  },
  backtestRateLimiter: {
    check: vi.fn(() => Promise.resolve({ allowed: true, remaining: 9, resetTime: Date.now() + 60000 })),
  },
  strategyRateLimiter: {
    check: vi.fn(() => Promise.resolve({ allowed: true, remaining: 49, resetTime: Date.now() + 60000 })),
  },
  getClientIP: vi.fn(() => '127.0.0.1'),
}))

// Import after mocking
import {
  withRateLimit,
  checkRateLimit,
  getCategoryFromPath,
} from '@/lib/api/middleware/rate-limit'
import {
  withErrorHandler,
  withApiMiddleware,
  createApiResponse,
  createErrorResponse,
  validateRequestBody,
  validateQueryParams,
} from '@/lib/api/middleware/error-handler'
import { apiRateLimiter } from '@/lib/redis/rate-limiter'

describe('Rate Limit Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('withRateLimit', () => {
    it('should allow request when under limit', async () => {
      const handler = vi.fn(() => NextResponse.json({ success: true }))
      const wrappedHandler = withRateLimit(handler, { category: 'api' })

      const request = new NextRequest('http://localhost:3000/api/test')
      const response = await wrappedHandler(request)

      expect(handler).toHaveBeenCalledTimes(1)
      expect(response.status).toBe(200)
    })

    it('should block request when rate limit exceeded', async () => {
      vi.mocked(apiRateLimiter.check).mockResolvedValueOnce({
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 60000,
        retryAfter: 60,
      })

      const handler = vi.fn(() => NextResponse.json({ success: true }))
      const wrappedHandler = withRateLimit(handler, { category: 'api' })

      const request = new NextRequest('http://localhost:3000/api/test')
      const response = await wrappedHandler(request)

      expect(handler).not.toHaveBeenCalled()
      expect(response.status).toBe(429)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('RATE_LIMITED')
    })

    it('should add rate limit headers to response', async () => {
      const handler = vi.fn(() => NextResponse.json({ success: true }))
      const wrappedHandler = withRateLimit(handler, { category: 'api' })

      const request = new NextRequest('http://localhost:3000/api/test')
      const response = await wrappedHandler(request)

      expect(response.headers.get('X-RateLimit-Limit')).toBeDefined()
      expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined()
      expect(response.headers.get('X-RateLimit-Reset')).toBeDefined()
    })

    it('should skip rate limit check when skipCheck returns true', async () => {
      const handler = vi.fn(() => NextResponse.json({ success: true }))
      const wrappedHandler = withRateLimit(handler, {
        category: 'api',
        skipCheck: () => true,
      })

      const request = new NextRequest('http://localhost:3000/api/test')
      const response = await wrappedHandler(request)

      expect(handler).toHaveBeenCalledTimes(1)
      expect(response.headers.get('X-RateLimit-Limit')).toBeNull()
    })

    it('should fail-open on rate limiter error', async () => {
      vi.mocked(apiRateLimiter.check).mockRejectedValueOnce(new Error('Redis connection failed'))

      const handler = vi.fn(() => NextResponse.json({ success: true }))
      const wrappedHandler = withRateLimit(handler, { category: 'api' })

      const request = new NextRequest('http://localhost:3000/api/test')
      const response = await wrappedHandler(request)

      // Should fail-open and allow request
      expect(handler).toHaveBeenCalledTimes(1)
      expect(response.status).toBe(200)
    })
  })

  describe('checkRateLimit', () => {
    it('should return null when allowed', async () => {
      const request = new NextRequest('http://localhost:3000/api/test')
      const result = await checkRateLimit(request, 'api')

      expect(result).toBeNull()
    })

    it('should return error response when blocked', async () => {
      vi.mocked(apiRateLimiter.check).mockResolvedValueOnce({
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 60000,
        retryAfter: 45,
      })

      const request = new NextRequest('http://localhost:3000/api/test')
      const result = await checkRateLimit(request, 'api')

      expect(result).not.toBeNull()
      expect(result?.status).toBe(429)
    })
  })

  describe('getCategoryFromPath', () => {
    it('should return correct category for AI routes', () => {
      expect(getCategoryFromPath('/api/ai/chat')).toBe('ai')
      expect(getCategoryFromPath('/api/ai/analyze')).toBe('ai')
    })

    it('should return correct category for exchange routes', () => {
      expect(getCategoryFromPath('/api/exchange/orders')).toBe('exchange')
    })

    it('should return correct category for auth routes', () => {
      expect(getCategoryFromPath('/api/auth/login')).toBe('auth')
    })

    it('should return correct category for backtest routes', () => {
      expect(getCategoryFromPath('/api/backtest/run')).toBe('backtest')
    })

    it('should return correct category for strategy routes', () => {
      expect(getCategoryFromPath('/api/strategies')).toBe('strategy')
    })

    it('should return api for unknown routes', () => {
      expect(getCategoryFromPath('/api/unknown')).toBe('api')
      expect(getCategoryFromPath('/api/something/else')).toBe('api')
    })
  })
})

describe('Error Handler Middleware', () => {
  describe('withErrorHandler', () => {
    it('should pass through successful responses', async () => {
      const handler = vi.fn(() => NextResponse.json({ data: 'test' }))
      const wrappedHandler = withErrorHandler(handler)

      const request = new NextRequest('http://localhost:3000/api/test')
      const response = await wrappedHandler(request)

      expect(handler).toHaveBeenCalledTimes(1)
      expect(response.status).toBe(200)
    })

    it('should catch and handle errors', async () => {
      const handler = vi.fn(() => {
        throw new Error('Something went wrong')
      })
      const wrappedHandler = withErrorHandler(handler, { logErrors: false })

      const request = new NextRequest('http://localhost:3000/api/test')
      const response = await wrappedHandler(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBeDefined()
    })

    it('should handle async errors', async () => {
      const handler = vi.fn(async () => {
        await Promise.reject(new Error('Async error'))
      })
      const wrappedHandler = withErrorHandler(handler, { logErrors: false })

      const request = new NextRequest('http://localhost:3000/api/test')
      const response = await wrappedHandler(request)

      expect(response.status).toBe(500)
    })
  })

  describe('createApiResponse', () => {
    it('should create successful response with data', () => {
      const data = { id: 1, name: 'Test' }
      const response = createApiResponse(data)

      expect(response.status).toBe(200)
    })

    it('should create response with custom status', () => {
      const data = { id: 1 }
      const response = createApiResponse(data, 201)

      expect(response.status).toBe(201)
    })
  })

  describe('createErrorResponse', () => {
    it('should create error response', () => {
      const response = createErrorResponse('NOT_FOUND', 'Resource not found', 404)

      expect(response.status).toBe(404)
    })

    it('should create error response with default status', () => {
      const response = createErrorResponse('INVALID_INPUT', 'Invalid input')

      expect(response.status).toBe(400)
    })
  })

  describe('validateRequestBody', () => {
    const testSchema = z.object({
      name: z.string().min(1),
      age: z.number().positive(),
    })

    it('should validate valid request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        body: JSON.stringify({ name: 'John', age: 25 }),
        headers: { 'Content-Type': 'application/json' },
      })

      const result = await validateRequestBody(request, testSchema)

      expect('data' in result).toBe(true)
      if ('data' in result) {
        expect(result.data.name).toBe('John')
        expect(result.data.age).toBe(25)
      }
    })

    it('should return error for invalid body', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        body: JSON.stringify({ name: '', age: -5 }),
        headers: { 'Content-Type': 'application/json' },
      })

      const result = await validateRequestBody(request, testSchema)

      expect('error' in result).toBe(true)
      if ('error' in result) {
        expect(result.error.status).toBe(400)
      }
    })

    it('should handle invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        body: 'not valid json',
        headers: { 'Content-Type': 'application/json' },
      })

      const result = await validateRequestBody(request, testSchema)

      expect('error' in result).toBe(true)
    })
  })

  describe('validateQueryParams', () => {
    const querySchema = z.object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(10),
      status: z.enum(['active', 'inactive']).optional(),
    })

    it('should validate valid query params', () => {
      const request = new NextRequest('http://localhost:3000/api/test?page=2&limit=20&status=active')

      const result = validateQueryParams(request, querySchema)

      expect('data' in result).toBe(true)
      if ('data' in result) {
        expect(result.data.page).toBe(2)
        expect(result.data.limit).toBe(20)
        expect(result.data.status).toBe('active')
      }
    })

    it('should use default values', () => {
      const request = new NextRequest('http://localhost:3000/api/test')

      const result = validateQueryParams(request, querySchema)

      expect('data' in result).toBe(true)
      if ('data' in result) {
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(10)
      }
    })

    it('should return error for invalid params', () => {
      const request = new NextRequest('http://localhost:3000/api/test?page=-1')

      const result = validateQueryParams(request, querySchema)

      expect('error' in result).toBe(true)
    })
  })
})

describe('withApiMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should combine rate limiting and error handling', async () => {
    const handler = vi.fn(() => NextResponse.json({ success: true }))
    const wrappedHandler = withApiMiddleware(handler, {
      rateLimit: { category: 'api' },
      errorHandler: { logErrors: false },
    })

    const request = new NextRequest('http://localhost:3000/api/test')
    const response = await wrappedHandler(request)

    expect(handler).toHaveBeenCalledTimes(1)
    expect(response.status).toBe(200)
    expect(response.headers.get('X-RateLimit-Limit')).toBeDefined()
  })

  it('should block when rate limited', async () => {
    vi.mocked(apiRateLimiter.check).mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      resetTime: Date.now() + 60000,
      retryAfter: 60,
    })

    const handler = vi.fn(() => NextResponse.json({ success: true }))
    const wrappedHandler = withApiMiddleware(handler, {
      rateLimit: { category: 'api' },
      errorHandler: { logErrors: false },
    })

    const request = new NextRequest('http://localhost:3000/api/test')
    const response = await wrappedHandler(request)

    expect(handler).not.toHaveBeenCalled()
    expect(response.status).toBe(429)
  })

  it('should catch handler errors', async () => {
    const handler = vi.fn(() => {
      throw new Error('Handler error')
    })
    const wrappedHandler = withApiMiddleware(handler, {
      rateLimit: { category: 'api' },
      errorHandler: { logErrors: false },
    })

    const request = new NextRequest('http://localhost:3000/api/test')
    const response = await wrappedHandler(request)

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.success).toBe(false)
  })
})
