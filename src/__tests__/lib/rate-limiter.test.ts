// ============================================
// Rate Limiter Tests
// ============================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RateLimiter, getClientIP, createRateLimitResponse } from '@/lib/rate-limiter'

describe('RateLimiter', () => {
  let limiter: RateLimiter

  beforeEach(() => {
    vi.useFakeTimers()
    limiter = new RateLimiter({
      windowMs: 60000, // 1 minute
      maxRequests: 5,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('check()', () => {
    it('should allow requests within limit', () => {
      const result = limiter.check('test-key')

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(4)
    })

    it('should decrement remaining count', () => {
      limiter.check('test-key')
      limiter.check('test-key')
      const result = limiter.check('test-key')

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(2)
    })

    it('should block requests after limit exceeded', () => {
      for (let i = 0; i < 5; i++) {
        limiter.check('test-key')
      }

      const result = limiter.check('test-key')

      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
      expect(result.retryAfter).toBeDefined()
    })

    it('should reset after window expires', () => {
      for (let i = 0; i < 5; i++) {
        limiter.check('test-key')
      }

      // Should be blocked
      expect(limiter.check('test-key').allowed).toBe(false)

      // Advance time past window
      vi.advanceTimersByTime(61000)

      // Should be allowed again
      const result = limiter.check('test-key')
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(4)
    })

    it('should track different keys separately', () => {
      for (let i = 0; i < 5; i++) {
        limiter.check('key-1')
      }

      expect(limiter.check('key-1').allowed).toBe(false)
      expect(limiter.check('key-2').allowed).toBe(true)
    })

    it('should provide correct retryAfter time', () => {
      for (let i = 0; i < 5; i++) {
        limiter.check('test-key')
      }

      const result = limiter.check('test-key')

      expect(result.retryAfter).toBeLessThanOrEqual(60)
      expect(result.retryAfter).toBeGreaterThan(0)
    })

    it('should handle rapid sequential requests', () => {
      const results = []
      for (let i = 0; i < 10; i++) {
        results.push(limiter.check('rapid-key'))
      }

      expect(results.filter((r) => r.allowed).length).toBe(5)
      expect(results.filter((r) => !r.allowed).length).toBe(5)
    })
  })

  describe('reset()', () => {
    it('should reset limit for specific key', () => {
      for (let i = 0; i < 5; i++) {
        limiter.check('test-key')
      }

      expect(limiter.check('test-key').allowed).toBe(false)

      limiter.reset('test-key')

      expect(limiter.check('test-key').allowed).toBe(true)
    })

    it('should not affect other keys', () => {
      for (let i = 0; i < 5; i++) {
        limiter.check('key-1')
        limiter.check('key-2')
      }

      limiter.reset('key-1')

      expect(limiter.check('key-1').allowed).toBe(true)
      expect(limiter.check('key-2').allowed).toBe(false)
    })
  })

  describe('getSize()', () => {
    it('should return number of tracked keys', () => {
      limiter.check('key-1')
      limiter.check('key-2')
      limiter.check('key-3')

      expect(limiter.getSize()).toBe(3)
    })

    it('should start at 0', () => {
      expect(limiter.getSize()).toBe(0)
    })
  })
})

describe('getClientIP()', () => {
  it('should extract IP from x-forwarded-for header', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
    })

    const ip = getClientIP(request)

    expect(ip).toBe('192.168.1.1')
  })

  it('should extract IP from x-real-ip header', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-real-ip': '192.168.1.100' },
    })

    const ip = getClientIP(request)

    expect(ip).toBe('192.168.1.100')
  })

  it('should prefer x-forwarded-for over x-real-ip', () => {
    const request = new Request('http://localhost', {
      headers: {
        'x-forwarded-for': '10.0.0.1',
        'x-real-ip': '192.168.1.100',
      },
    })

    const ip = getClientIP(request)

    expect(ip).toBe('10.0.0.1')
  })

  it('should return unknown when no IP headers present', () => {
    const request = new Request('http://localhost')

    const ip = getClientIP(request)

    expect(ip).toBe('unknown')
  })

  it('should trim whitespace from IP', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '  192.168.1.1  , 10.0.0.1' },
    })

    const ip = getClientIP(request)

    expect(ip).toBe('192.168.1.1')
  })
})

describe('createRateLimitResponse()', () => {
  it('should create 429 response', async () => {
    const response = createRateLimitResponse(60)

    expect(response.status).toBe(429)
  })

  it('should include Retry-After header', async () => {
    const response = createRateLimitResponse(60)

    expect(response.headers.get('Retry-After')).toBe('60')
  })

  it('should include error details in body', async () => {
    const response = createRateLimitResponse(30)
    const body = await response.json()

    expect(body.success).toBe(false)
    expect(body.error.code).toBe('RATE_LIMITED')
    expect(body.error.retryAfter).toBe(30)
  })

  it('should set Content-Type to application/json', async () => {
    const response = createRateLimitResponse(60)

    expect(response.headers.get('Content-Type')).toBe('application/json')
  })
})
