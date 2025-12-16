// ============================================
// Circuit Breaker Unit Tests
// GPT V1 피드백: 테스트 코드
// ============================================

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { CircuitBreaker, withCircuitBreaker } from '@/lib/redis/circuit-breaker'

// Mock Redis client
const mockRedisClient = {
  get: vi.fn(),
  set: vi.fn(),
  incr: vi.fn(),
  del: vi.fn(),
  expire: vi.fn(),
}

vi.mock('@/lib/redis/client', () => ({
  getRedisClient: vi.fn(() => Promise.resolve(mockRedisClient)),
  isRedisConnected: vi.fn(() => true),
}))

vi.mock('@/lib/utils/safe-logger', () => ({
  safeLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker

  beforeEach(() => {
    vi.clearAllMocks()
    circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      cooldownMs: 30000,
      keyPrefix: 'test:cb',
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('getStatus', () => {
    it('should return closed state when no failures', async () => {
      mockRedisClient.get.mockResolvedValue(null)

      const status = await circuitBreaker.getStatus('test-service')

      expect(status.state).toBe('closed')
      expect(status.failures).toBe(0)
      expect(status.openUntil).toBeNull()
    })

    it('should return open state when openUntil is in future', async () => {
      const futureTime = Date.now() + 60000
      mockRedisClient.get
        .mockResolvedValueOnce('3') // failures
        .mockResolvedValueOnce(String(Date.now() - 1000)) // lastFailure
        .mockResolvedValueOnce(String(futureTime)) // openUntil

      const status = await circuitBreaker.getStatus('test-service')

      expect(status.state).toBe('open')
      expect(status.failures).toBe(3)
      expect(status.openUntil).toBe(futureTime)
    })

    it('should return half-open state when openUntil has passed', async () => {
      const pastTime = Date.now() - 1000
      mockRedisClient.get
        .mockResolvedValueOnce('3') // failures
        .mockResolvedValueOnce(String(Date.now() - 60000)) // lastFailure
        .mockResolvedValueOnce(String(pastTime)) // openUntil

      const status = await circuitBreaker.getStatus('test-service')

      expect(status.state).toBe('half-open')
    })
  })

  describe('isAllowed', () => {
    it('should allow requests when circuit is closed', async () => {
      mockRedisClient.get.mockResolvedValue(null)

      const allowed = await circuitBreaker.isAllowed('test-service')

      expect(allowed).toBe(true)
    })

    it('should block requests when circuit is open', async () => {
      const futureTime = Date.now() + 60000
      mockRedisClient.get
        .mockResolvedValueOnce('5')
        .mockResolvedValueOnce(String(Date.now()))
        .mockResolvedValueOnce(String(futureTime))

      const allowed = await circuitBreaker.isAllowed('test-service')

      expect(allowed).toBe(false)
    })
  })

  describe('recordSuccess', () => {
    it('should reset all failure-related keys', async () => {
      mockRedisClient.del.mockResolvedValue(1)

      await circuitBreaker.recordSuccess('test-service')

      expect(mockRedisClient.del).toHaveBeenCalledTimes(3)
    })
  })

  describe('recordFailure', () => {
    it('should increment failure counter', async () => {
      mockRedisClient.incr.mockResolvedValue(1)
      mockRedisClient.expire.mockResolvedValue(1)
      mockRedisClient.set.mockResolvedValue('OK')

      const status = await circuitBreaker.recordFailure('test-service')

      expect(status.failures).toBe(1)
      expect(status.state).toBe('closed')
      expect(mockRedisClient.incr).toHaveBeenCalled()
    })

    it('should open circuit when threshold is reached', async () => {
      mockRedisClient.incr.mockResolvedValue(3) // At threshold
      mockRedisClient.expire.mockResolvedValue(1)
      mockRedisClient.set.mockResolvedValue('OK')

      const status = await circuitBreaker.recordFailure('test-service')

      expect(status.state).toBe('open')
      expect(status.openUntil).toBeDefined()
      expect(status.openUntil).toBeGreaterThan(Date.now())
    })
  })

  describe('reset', () => {
    it('should delete all circuit keys', async () => {
      mockRedisClient.del.mockResolvedValue(1)

      await circuitBreaker.reset('test-service')

      expect(mockRedisClient.del).toHaveBeenCalledTimes(3)
    })
  })
})

describe('withCircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker

  beforeEach(() => {
    vi.clearAllMocks()
    circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      cooldownMs: 30000,
      keyPrefix: 'test:cb',
    })
  })

  it('should execute function when circuit is closed', async () => {
    mockRedisClient.get.mockResolvedValue(null)
    mockRedisClient.del.mockResolvedValue(1)

    const mockFn = vi.fn().mockResolvedValue('success')

    const result = await withCircuitBreaker(circuitBreaker, 'test', mockFn)

    expect(result).toBe('success')
    expect(mockFn).toHaveBeenCalled()
  })

  it('should throw CIRCUIT_OPEN when circuit is open', async () => {
    const futureTime = Date.now() + 60000
    mockRedisClient.get
      .mockResolvedValueOnce('5')
      .mockResolvedValueOnce(String(Date.now()))
      .mockResolvedValueOnce(String(futureTime))

    const mockFn = vi.fn()

    await expect(
      withCircuitBreaker(circuitBreaker, 'test', mockFn)
    ).rejects.toThrow('CIRCUIT_OPEN')

    expect(mockFn).not.toHaveBeenCalled()
  })

  it('should record failure when function throws', async () => {
    mockRedisClient.get.mockResolvedValue(null)
    mockRedisClient.incr.mockResolvedValue(1)
    mockRedisClient.expire.mockResolvedValue(1)
    mockRedisClient.set.mockResolvedValue('OK')

    const mockFn = vi.fn().mockRejectedValue(new Error('API Error'))

    await expect(
      withCircuitBreaker(circuitBreaker, 'test', mockFn)
    ).rejects.toThrow('API Error')

    expect(mockRedisClient.incr).toHaveBeenCalled()
  })

  it('should record success when function succeeds', async () => {
    mockRedisClient.get.mockResolvedValue(null)
    mockRedisClient.del.mockResolvedValue(1)

    const mockFn = vi.fn().mockResolvedValue('success')

    await withCircuitBreaker(circuitBreaker, 'test', mockFn)

    expect(mockRedisClient.del).toHaveBeenCalled()
  })
})
