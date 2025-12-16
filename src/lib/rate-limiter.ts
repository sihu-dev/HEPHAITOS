// ============================================
// Rate Limiter - 하이브리드 (메모리 / Redis)
// Redis가 있으면 Redis 사용, 없으면 메모리 fallback
// ============================================

// Re-export Redis rate limiter (프로덕션 권장)
export {
  RedisRateLimiter,
  apiRateLimiter as redisApiRateLimiter,
  exchangeRateLimiter as redisExchangeRateLimiter,
  authRateLimiter as redisAuthRateLimiter,
  strategyRateLimiter as redisStrategyRateLimiter,
  aiRateLimiter,
  backtestRateLimiter,
  createRateLimitResponse as createRedisRateLimitResponse,
  getClientIP as getClientIPRedis,
  getRateLimiterStatus,
} from './redis/rate-limiter'

// ============================================
// Legacy In-Memory Rate Limiter (Fallback용)
// ============================================

interface RateLimitEntry {
  count: number
  resetTime: number
}

interface RateLimiterConfig {
  windowMs: number     // Time window in milliseconds
  maxRequests: number  // Maximum requests per window
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map()
  private config: RateLimiterConfig

  constructor(config: RateLimiterConfig) {
    this.config = config

    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000)
  }

  /**
   * Check if request should be rate limited
   * @param key - Unique identifier (IP address, user ID, etc.)
   * @returns Object with allowed status and remaining requests
   */
  check(key: string): {
    allowed: boolean
    remaining: number
    resetTime: number
    retryAfter?: number
  } {
    const now = Date.now()
    const entry = this.store.get(key)

    // No existing entry or window expired
    if (!entry || now > entry.resetTime) {
      this.store.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs,
      })
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs,
      }
    }

    // Within window
    if (entry.count < this.config.maxRequests) {
      entry.count++
      return {
        allowed: true,
        remaining: this.config.maxRequests - entry.count,
        resetTime: entry.resetTime,
      }
    }

    // Rate limited
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key)
      }
    }
  }

  /**
   * Reset rate limit for a specific key
   */
  reset(key: string): void {
    this.store.delete(key)
  }

  /**
   * Get current store size (for debugging)
   */
  getSize(): number {
    return this.store.size
  }
}

// Pre-configured rate limiters for different use cases

// General API: 100 requests per minute
export const apiRateLimiter = new RateLimiter({
  windowMs: 60 * 1000,  // 1 minute
  maxRequests: 100,
})

// Exchange API: 30 requests per minute (stricter due to external API calls)
export const exchangeRateLimiter = new RateLimiter({
  windowMs: 60 * 1000,  // 1 minute
  maxRequests: 30,
})

// Auth API: 10 requests per minute (prevent brute force)
export const authRateLimiter = new RateLimiter({
  windowMs: 60 * 1000,  // 1 minute
  maxRequests: 10,
})

// Strategy API: 50 requests per minute
export const strategyRateLimiter = new RateLimiter({
  windowMs: 60 * 1000,  // 1 minute
  maxRequests: 50,
})

/**
 * Helper function to extract client IP from request
 */
export function getClientIP(request: Request): string {
  // Check various headers for IP (reverse proxy scenarios)
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  // Fallback to a default identifier
  return 'unknown'
}

/**
 * Create rate limit response
 */
export function createRateLimitResponse(retryAfter: number) {
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
        retryAfter,
      },
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
      },
    }
  )
}

export { RateLimiter }
export type { RateLimiterConfig }
