// ============================================
// Strategies [id] API Integration Tests
// ============================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, PUT, DELETE, PATCH } from '@/app/api/strategies/[id]/route'
import { mockStrategies, addStrategy } from '@/lib/mock-data'
import type { Strategy } from '@/types'

describe('Strategies [id] API', () => {
  const originalStrategies = [...mockStrategies]

  const createTestStrategy = (): Strategy => ({
    id: 'test-id-123',
    userId: 'user_1',
    name: 'Test Strategy',
    description: 'Test description',
    status: 'draft',
    config: {
      symbols: ['BTC/USDT'],
      timeframe: '1h',
      entryConditions: [],
      exitConditions: [],
      riskManagement: {},
      allocation: 10,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock strategies
    mockStrategies.length = 0
    originalStrategies.forEach((s) => mockStrategies.push({ ...s }))
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // Helper to create context with Promise-based params (Next.js 16)
  const createContext = (id: string) => ({
    params: Promise.resolve({ id })
  })

  describe('GET /api/strategies/[id]', () => {
    it('should return a strategy by id', async () => {
      const request = new NextRequest('http://localhost:3000/api/strategies/1')
      const response = await GET(request, createContext('1'))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe('1')
      expect(data.data.name).toBe('모멘텀 돌파 전략')
    })

    it('should return 404 for non-existent strategy', async () => {
      const request = new NextRequest('http://localhost:3000/api/strategies/non-existent')
      const response = await GET(request, createContext('non-existent'))
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('NOT_FOUND')
    })
  })

  describe('PUT /api/strategies/[id]', () => {
    it('should update a strategy', async () => {
      const testStrategy = createTestStrategy()
      addStrategy(testStrategy)

      const updates = {
        name: 'Updated Strategy Name',
        description: 'Updated description',
      }

      const request = new NextRequest('http://localhost:3000/api/strategies/test-id-123', {
        method: 'PUT',
        body: JSON.stringify(updates),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PUT(request, createContext('test-id-123'))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.name).toBe('Updated Strategy Name')
      expect(data.data.description).toBe('Updated description')
    })

    it('should truncate long name', async () => {
      const testStrategy = createTestStrategy()
      addStrategy(testStrategy)

      const longName = 'a'.repeat(200)
      const request = new NextRequest('http://localhost:3000/api/strategies/test-id-123', {
        method: 'PUT',
        body: JSON.stringify({ name: longName }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PUT(request, createContext('test-id-123'))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.name.length).toBe(100) // Truncated to 100 chars
    })

    it('should truncate long description', async () => {
      const testStrategy = createTestStrategy()
      addStrategy(testStrategy)

      const longDesc = 'a'.repeat(1000)
      const request = new NextRequest('http://localhost:3000/api/strategies/test-id-123', {
        method: 'PUT',
        body: JSON.stringify({ description: longDesc }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PUT(request, createContext('test-id-123'))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.description.length).toBe(500) // Truncated to 500 chars
    })

    it('should return 404 for non-existent strategy', async () => {
      const request = new NextRequest('http://localhost:3000/api/strategies/non-existent', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Test' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PUT(request, createContext('non-existent'))
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error.code).toBe('NOT_FOUND')
    })
  })

  describe('DELETE /api/strategies/[id]', () => {
    it('should delete a strategy', async () => {
      const testStrategy = createTestStrategy()
      addStrategy(testStrategy)

      const request = new NextRequest('http://localhost:3000/api/strategies/test-id-123', {
        method: 'DELETE',
      })

      const response = await DELETE(request, createContext('test-id-123'))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.deleted).toBe(true)

      // Verify it's actually deleted
      const findResponse = await GET(
        new NextRequest('http://localhost:3000/api/strategies/test-id-123'),
        createContext('test-id-123')
      )
      expect(findResponse.status).toBe(404)
    })

    it('should return 404 for non-existent strategy', async () => {
      const request = new NextRequest('http://localhost:3000/api/strategies/non-existent', {
        method: 'DELETE',
      })

      const response = await DELETE(request, createContext('non-existent'))
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error.code).toBe('NOT_FOUND')
    })
  })

  describe('PATCH /api/strategies/[id]', () => {
    it('should update status with valid value', async () => {
      const testStrategy = createTestStrategy()
      addStrategy(testStrategy)

      const request = new NextRequest('http://localhost:3000/api/strategies/test-id-123', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'running' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PATCH(request, createContext('test-id-123'))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.status).toBe('running')
    })

    it('should reject invalid status', async () => {
      const testStrategy = createTestStrategy()
      addStrategy(testStrategy)

      const request = new NextRequest('http://localhost:3000/api/strategies/test-id-123', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'invalid_status' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PATCH(request, createContext('test-id-123'))
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('should accept all valid status values', async () => {
      const validStatuses = ['draft', 'backtesting', 'ready', 'running', 'paused', 'stopped']

      for (const status of validStatuses) {
        // Reset and add test strategy
        const testStrategy = { ...createTestStrategy(), id: `test-${status}` }
        addStrategy(testStrategy)

        const request = new NextRequest(`http://localhost:3000/api/strategies/test-${status}`, {
          method: 'PATCH',
          body: JSON.stringify({ status }),
          headers: { 'Content-Type': 'application/json' },
        })

        const response = await PATCH(request, createContext(`test-${status}`))
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.data.status).toBe(status)
      }
    })

    it('should return 404 for non-existent strategy', async () => {
      const request = new NextRequest('http://localhost:3000/api/strategies/non-existent', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'running' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PATCH(request, createContext('non-existent'))
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error.code).toBe('NOT_FOUND')
    })
  })
})
