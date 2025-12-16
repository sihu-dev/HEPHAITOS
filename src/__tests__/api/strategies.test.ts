// ============================================
// Strategies API Integration Tests
// 실제 API 동작 테스트
// ============================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Redis rate limiter module
vi.mock('@/lib/redis/rate-limiter', () => {
  const mockRateLimiter = {
    check: vi.fn(() => Promise.resolve({ allowed: true, remaining: 99, resetTime: Date.now() + 60000 })),
  }
  return {
    RedisRateLimiter: class {
      check = vi.fn(() => Promise.resolve({ allowed: true, remaining: 99, resetTime: Date.now() + 60000 }))
    },
    apiRateLimiter: mockRateLimiter,
    exchangeRateLimiter: mockRateLimiter,
    authRateLimiter: mockRateLimiter,
    aiRateLimiter: mockRateLimiter,
    backtestRateLimiter: mockRateLimiter,
    strategyRateLimiter: {
      check: vi.fn(() => Promise.resolve({ allowed: true, remaining: 49, resetTime: Date.now() + 60000 })),
    },
    getClientIP: vi.fn(() => '127.0.0.1'),
  }
})

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(() => Promise.resolve({
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test_user' } } })),
    },
  })),
}))

// Mock services
vi.mock('@/lib/services/strategies', () => ({
  getStrategies: vi.fn(() => Promise.resolve({
    data: [
      {
        id: 'strategy_1',
        name: 'Test Strategy',
        description: 'Test description',
        status: 'draft',
        userId: 'test_user',
        config: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    total: 1,
  })),
  createStrategy: vi.fn((data) => Promise.resolve({
    id: 'new_strategy_1',
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
}))

// Import after mocking
import { GET, POST } from '@/app/api/strategies/route'
import { strategyRateLimiter } from '@/lib/redis/rate-limiter'

describe('Strategies API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/strategies', () => {
    it('should return paginated strategies', async () => {
      const request = new NextRequest('http://localhost:3000/api/strategies?page=1&limit=10')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      // API response wrapper: { data: { data: [...], pagination: {...} } }
      expect(data.data).toBeDefined()
      expect(data.data.data).toBeDefined()
      expect(Array.isArray(data.data.data)).toBe(true)
      expect(data.data.pagination).toBeDefined()
    })

    it('should filter by status', async () => {
      const request = new NextRequest('http://localhost:3000/api/strategies?status=draft')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toBeDefined()
    })

    it('should sort by createdAt descending by default', async () => {
      const request = new NextRequest('http://localhost:3000/api/strategies?sortBy=createdAt&sortOrder=desc')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toBeDefined()
    })

    it('should handle invalid page parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/strategies?page=-1')
      const response = await GET(request)
      const data = await response.json()

      // Validation catches invalid page
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should handle invalid limit parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/strategies?limit=1000')
      const response = await GET(request)
      const data = await response.json()

      // Limit is capped at 100 by validation
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should return rate limit response when exceeded', async () => {
      vi.mocked(strategyRateLimiter.check).mockResolvedValueOnce({
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 60000,
        retryAfter: 60,
      })

      const request = new NextRequest('http://localhost:3000/api/strategies')
      const response = await GET(request)

      expect(response.status).toBe(429)
    })

    it('should add rate limit headers', async () => {
      const request = new NextRequest('http://localhost:3000/api/strategies')
      const response = await GET(request)

      expect(response.headers.get('X-RateLimit-Limit')).toBeDefined()
      expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined()
    })
  })

  describe('POST /api/strategies', () => {
    it('should create a new strategy with valid data', async () => {
      const newStrategy = {
        name: 'Test Strategy',
        description: 'A test strategy description',
        config: {
          symbols: ['BTC/USDT'],
          timeframe: '1h',
          entryConditions: [],
          exitConditions: [],
          riskManagement: {},
          allocation: 10,
        },
      }

      const request = new NextRequest('http://localhost:3000/api/strategies', {
        method: 'POST',
        body: JSON.stringify(newStrategy),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.data.name).toBe(newStrategy.name)
      expect(data.data.id).toBeDefined()
    })

    it('should reject invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/strategies', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should reject missing required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/strategies', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should validate name length', async () => {
      const request = new NextRequest('http://localhost:3000/api/strategies', {
        method: 'POST',
        body: JSON.stringify({
          name: '', // Empty name should fail
          description: 'Test',
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should return rate limit response when exceeded', async () => {
      vi.mocked(strategyRateLimiter.check).mockResolvedValueOnce({
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 60000,
        retryAfter: 30,
      })

      const request = new NextRequest('http://localhost:3000/api/strategies', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', description: 'Test' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)

      expect(response.status).toBe(429)
    })
  })
})
