// ============================================
// Redis Rate Limiter
// 프로덕션용 분산 Rate Limiting
// GPT V1 피드백 P0-3: 일당 Rate Limit + Tier별 제한 추가
// ============================================

import { getRedisClient, isRedisConnected } from './client'
import { safeLogger } from '@/lib/utils/safe-logger'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
  limitType?: 'minute' | 'daily'
}

export interface RateLimitConfig {
  windowMs: number      // 시간 창 (밀리초)
  maxRequests: number   // 최대 요청 수
  keyPrefix?: string    // Redis 키 접두사
}

// Tier별 제한 설정
export type UserTier = 'free' | 'basic' | 'pro' | 'premium'

export interface TierLimits {
  perMinute: number
  perDay: number
}

export const TIER_LIMITS: Record<UserTier, TierLimits> = {
  free: { perMinute: 10, perDay: 100 },
  basic: { perMinute: 30, perDay: 500 },
  pro: { perMinute: 60, perDay: 2000 },
  premium: { perMinute: 100, perDay: 10000 },
}

/**
 * Redis 기반 Rate Limiter (Sliding Window Counter 알고리즘)
 */
export class RedisRateLimiter {
  private config: RateLimitConfig
  private keyPrefix: string

  constructor(config: RateLimitConfig) {
    this.config = config
    this.keyPrefix = config.keyPrefix || 'ratelimit'
  }

  private getKey(identifier: string): string {
    return `${this.keyPrefix}:${identifier}`
  }

  /**
   * 요청 허용 여부 확인 및 카운터 증가
   */
  async check(identifier: string): Promise<RateLimitResult> {
    const redis = await getRedisClient()
    const key = this.getKey(identifier)
    const now = Date.now()
    const windowSecs = Math.ceil(this.config.windowMs / 1000)

    try {
      // 현재 카운터 조회 및 증가 (atomic operation)
      const count = await redis.incr(key)

      // 첫 요청이면 TTL 설정
      if (count === 1) {
        await redis.expire(key, windowSecs)
      }

      // TTL 조회
      const ttl = await redis.ttl(key)
      const resetTime = now + (ttl > 0 ? ttl * 1000 : this.config.windowMs)

      if (count > this.config.maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          resetTime,
          retryAfter: ttl > 0 ? ttl : windowSecs,
        }
      }

      return {
        allowed: true,
        remaining: this.config.maxRequests - count,
        resetTime,
      }
    } catch (error) {
      safeLogger.error('[RateLimiter] Redis error, allowing request', { error })
      // Redis 에러 시 허용 (fail-open)
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs,
      }
    }
  }

  /**
   * 특정 식별자의 제한 해제
   */
  async reset(identifier: string): Promise<void> {
    const redis = await getRedisClient()
    await redis.del(this.getKey(identifier))
  }

  /**
   * 현재 사용량 조회 (카운터 증가 없이)
   */
  async getUsage(identifier: string): Promise<number> {
    const redis = await getRedisClient()
    const count = await redis.get(this.getKey(identifier))
    return count ? parseInt(count, 10) : 0
  }
}

// ============================================
// Pre-configured Rate Limiters (Redis 버전)
// ============================================

// General API: 100 requests per minute
export const apiRateLimiter = new RedisRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 100,
  keyPrefix: 'rl:api',
})

// Exchange API: 30 requests per minute
export const exchangeRateLimiter = new RedisRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
  keyPrefix: 'rl:exchange',
})

// Auth API: 10 requests per minute
export const authRateLimiter = new RedisRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
  keyPrefix: 'rl:auth',
})

// Strategy API: 50 requests per minute
export const strategyRateLimiter = new RedisRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 50,
  keyPrefix: 'rl:strategy',
})

// AI API: 20 requests per minute (비용 제한)
export const aiRateLimiter = new RedisRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 20,
  keyPrefix: 'rl:ai',
})

// Backtest API: 10 requests per minute (리소스 집약적)
export const backtestRateLimiter = new RedisRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
  keyPrefix: 'rl:backtest',
})

// ============================================
// Middleware Helper
// ============================================

/**
 * Rate limit 응답 생성 헬퍼
 */
export function createRateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
        retryAfter: result.retryAfter,
      },
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(result.retryAfter || 60),
        'X-RateLimit-Limit': String(result.remaining + (result.allowed ? 0 : 1)),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(Math.ceil(result.resetTime / 1000)),
      },
    }
  )
}

/**
 * IP 주소 추출 헬퍼
 */
export function getClientIP(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  return 'unknown'
}

/**
 * Rate Limiter 상태 조회
 */
export async function getRateLimiterStatus(): Promise<{
  backend: 'redis' | 'memory'
  connected: boolean
}> {
  return {
    backend: isRedisConnected() ? 'redis' : 'memory',
    connected: isRedisConnected(),
  }
}

// ============================================
// Tiered Rate Limiter (일당 + 분당 제한)
// GPT V1 피드백 P0-3
// ============================================

/**
 * Tier별 Rate Limiter - 분당 + 일당 제한 적용
 */
export class TieredRateLimiter {
  private keyPrefix: string

  constructor(keyPrefix: string = 'rl:tiered') {
    this.keyPrefix = keyPrefix
  }

  private getKey(identifier: string, window: 'minute' | 'daily'): string {
    if (window === 'daily') {
      const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
      return `${this.keyPrefix}:${identifier}:day:${today}`
    }
    return `${this.keyPrefix}:${identifier}:minute`
  }

  /**
   * 요청 허용 여부 확인 (분당 + 일당 모두 체크)
   */
  async check(identifier: string, tier: UserTier = 'free'): Promise<RateLimitResult> {
    const redis = await getRedisClient()
    const limits = TIER_LIMITS[tier]
    const now = Date.now()

    try {
      // 1. 분당 제한 체크
      const minuteKey = this.getKey(identifier, 'minute')
      const minuteCount = await redis.incr(minuteKey)
      if (minuteCount === 1) {
        await redis.expire(minuteKey, 60)
      }

      if (minuteCount > limits.perMinute) {
        const ttl = await redis.ttl(minuteKey)
        return {
          allowed: false,
          remaining: 0,
          resetTime: now + (ttl > 0 ? ttl * 1000 : 60000),
          retryAfter: ttl > 0 ? ttl : 60,
          limitType: 'minute',
        }
      }

      // 2. 일당 제한 체크
      const dailyKey = this.getKey(identifier, 'daily')
      const dailyCount = await redis.incr(dailyKey)
      if (dailyCount === 1) {
        // 자정까지 남은 시간 계산 (UTC 기준)
        const tomorrow = new Date()
        tomorrow.setUTCHours(24, 0, 0, 0)
        const secondsUntilMidnight = Math.ceil((tomorrow.getTime() - now) / 1000)
        await redis.expire(dailyKey, secondsUntilMidnight)
      }

      if (dailyCount > limits.perDay) {
        const ttl = await redis.ttl(dailyKey)
        return {
          allowed: false,
          remaining: 0,
          resetTime: now + (ttl > 0 ? ttl * 1000 : 86400000),
          retryAfter: ttl > 0 ? ttl : 86400,
          limitType: 'daily',
        }
      }

      return {
        allowed: true,
        remaining: Math.min(limits.perMinute - minuteCount, limits.perDay - dailyCount),
        resetTime: now + 60000,
      }
    } catch (error) {
      safeLogger.error('[TieredRateLimiter] Redis error, allowing request', { error })
      return {
        allowed: true,
        remaining: limits.perMinute - 1,
        resetTime: now + 60000,
      }
    }
  }

  /**
   * 현재 사용량 조회
   */
  async getUsage(identifier: string): Promise<{ minute: number; daily: number }> {
    const redis = await getRedisClient()
    const [minute, daily] = await Promise.all([
      redis.get(this.getKey(identifier, 'minute')),
      redis.get(this.getKey(identifier, 'daily')),
    ])

    return {
      minute: minute ? parseInt(minute, 10) : 0,
      daily: daily ? parseInt(daily, 10) : 0,
    }
  }
}

// Pre-configured Tiered Rate Limiters
export const aiTieredLimiter = new TieredRateLimiter('rl:ai:tiered')
export const strategyTieredLimiter = new TieredRateLimiter('rl:strategy:tiered')
export const backtestTieredLimiter = new TieredRateLimiter('rl:backtest:tiered')

/**
 * Tiered Rate Limit 응답 생성
 */
export function createTieredRateLimitResponse(result: RateLimitResult): Response {
  const message = result.limitType === 'daily'
    ? '일일 사용량 한도에 도달했습니다. 내일 다시 시도해주세요.'
    : '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'

  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code: result.limitType === 'daily' ? 'DAILY_LIMIT_EXCEEDED' : 'RATE_LIMITED',
        message,
        retryAfter: result.retryAfter,
        limitType: result.limitType,
      },
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(result.retryAfter || 60),
      },
    }
  )
}
