// ============================================
// API Rate Limit Middleware
// API 라우트용 Rate Limiting 유틸리티
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import {
  RedisRateLimiter,
  apiRateLimiter,
  exchangeRateLimiter,
  authRateLimiter,
  aiRateLimiter,
  backtestRateLimiter,
  strategyRateLimiter,
  getClientIP,
  type RateLimitResult,
} from '@/lib/redis/rate-limiter'
import { safeLogger } from '@/lib/utils/safe-logger'

// ============================================
// Types
// ============================================

export type RateLimitCategory =
  | 'api'
  | 'exchange'
  | 'auth'
  | 'ai'
  | 'backtest'
  | 'strategy'

export interface RateLimitOptions {
  category?: RateLimitCategory
  customLimiter?: RedisRateLimiter
  identifier?: string // 커스텀 식별자 (기본: IP)
  skipCheck?: (req: NextRequest) => boolean
}

// ============================================
// Rate Limiter Map
// ============================================

const rateLimiters: Record<RateLimitCategory, RedisRateLimiter> = {
  api: apiRateLimiter,
  exchange: exchangeRateLimiter,
  auth: authRateLimiter,
  ai: aiRateLimiter,
  backtest: backtestRateLimiter,
  strategy: strategyRateLimiter,
}

// ============================================
// Rate Limit Headers
// ============================================

function setRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult,
  limit: number
): NextResponse {
  response.headers.set('X-RateLimit-Limit', String(limit))
  response.headers.set('X-RateLimit-Remaining', String(result.remaining))
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetTime / 1000)))

  if (!result.allowed && result.retryAfter) {
    response.headers.set('Retry-After', String(result.retryAfter))
  }

  return response
}

// ============================================
// Rate Limit Response
// ============================================

function createRateLimitErrorResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
        retryAfter: result.retryAfter,
      },
    },
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(result.retryAfter || 60),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(result.resetTime / 1000)),
      },
    }
  )
}

// ============================================
// Middleware HOF (Higher-Order Function)
// ============================================

/**
 * Rate Limit이 적용된 API 핸들러 래퍼
 *
 * @example
 * ```ts
 * export const GET = withRateLimit(
 *   async (req) => {
 *     return NextResponse.json({ data: 'ok' })
 *   },
 *   { category: 'api' }
 * )
 * ```
 */
export function withRateLimit<T extends NextRequest>(
  handler: (request: T, context?: unknown) => Promise<NextResponse>,
  options: RateLimitOptions = {}
): (request: T, context?: unknown) => Promise<NextResponse> {
  const {
    category = 'api',
    customLimiter,
    identifier: customIdentifier,
    skipCheck,
  } = options

  const limiter = customLimiter || rateLimiters[category]

  return async (request: T, context?: unknown): Promise<NextResponse> => {
    // Skip check if provided and returns true
    if (skipCheck && skipCheck(request)) {
      return handler(request, context)
    }

    // Get identifier (custom or IP-based)
    const identifier = customIdentifier || getClientIP(request)

    try {
      // Check rate limit
      const result = await limiter.check(identifier)

      if (!result.allowed) {
        safeLogger.warn('[RateLimit] Request blocked', {
          category,
          identifier,
          remaining: result.remaining,
          retryAfter: result.retryAfter,
        })

        return createRateLimitErrorResponse(result)
      }

      // Execute handler
      const response = await handler(request, context)

      // Add rate limit headers to successful response
      // Get limit from limiter config
      const limit = category === 'api' ? 100 :
                    category === 'exchange' ? 30 :
                    category === 'auth' ? 10 :
                    category === 'ai' ? 20 :
                    category === 'backtest' ? 10 :
                    category === 'strategy' ? 50 : 100

      return setRateLimitHeaders(response, result, limit)
    } catch (error) {
      safeLogger.error('[RateLimit] Error checking rate limit', { error, category })
      // Fail-open: 에러 시 요청 허용
      return handler(request, context)
    }
  }
}

// ============================================
// Inline Rate Limit Check
// ============================================

/**
 * API 라우트 내부에서 직접 사용하는 Rate Limit 체크
 *
 * @example
 * ```ts
 * export async function POST(req: NextRequest) {
 *   const rateLimitResult = await checkRateLimit(req, 'ai')
 *   if (rateLimitResult) return rateLimitResult
 *
 *   // ... 핸들러 로직
 * }
 * ```
 */
export async function checkRateLimit(
  request: NextRequest,
  category: RateLimitCategory = 'api',
  customIdentifier?: string
): Promise<NextResponse | null> {
  const limiter = rateLimiters[category]
  const identifier = customIdentifier || getClientIP(request)

  try {
    const result = await limiter.check(identifier)

    if (!result.allowed) {
      safeLogger.warn('[RateLimit] Request blocked (inline)', {
        category,
        identifier,
        retryAfter: result.retryAfter,
      })

      return createRateLimitErrorResponse(result)
    }

    return null // Allowed
  } catch (error) {
    safeLogger.error('[RateLimit] Error in inline check', { error })
    return null // Fail-open
  }
}

// ============================================
// User-based Rate Limiting
// ============================================

/**
 * 인증된 사용자 기반 Rate Limit 체크
 * IP 대신 userId를 식별자로 사용
 */
export async function checkUserRateLimit(
  userId: string,
  category: RateLimitCategory = 'api'
): Promise<RateLimitResult> {
  const limiter = rateLimiters[category]
  return limiter.check(`user:${userId}`)
}

// ============================================
// Route-based Configuration
// ============================================

/**
 * 경로 패턴에 따른 Rate Limit 카테고리 결정
 */
export function getCategoryFromPath(pathname: string): RateLimitCategory {
  if (pathname.includes('/api/ai/')) return 'ai'
  if (pathname.includes('/api/exchange/')) return 'exchange'
  if (pathname.includes('/api/auth/')) return 'auth'
  if (pathname.includes('/api/backtest')) return 'backtest'
  if (pathname.includes('/api/strategies')) return 'strategy'
  return 'api'
}
