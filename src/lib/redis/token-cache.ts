// ============================================
// Token Cache - Redis 기반 토큰 캐싱
// KIS API 등의 access token 캐싱
// ============================================

import { getRedisClient } from './client'
import { safeLogger } from '@/lib/utils/safe-logger'

export interface CachedToken {
  accessToken: string
  tokenType: string
  expiresIn: number
  expiresAt: number // Unix timestamp (ms)
  refreshToken?: string
}

const TOKEN_PREFIX = 'token'

/**
 * 토큰 캐시 키 생성
 */
function getTokenKey(provider: string, userId?: string): string {
  return userId
    ? `${TOKEN_PREFIX}:${provider}:${userId}`
    : `${TOKEN_PREFIX}:${provider}:global`
}

/**
 * 토큰 캐시에 저장
 * @param provider - 제공자 이름 (kis, polygon, etc.)
 * @param token - 저장할 토큰 정보
 * @param userId - 사용자별 토큰인 경우 사용자 ID
 */
export async function cacheToken(
  provider: string,
  token: CachedToken,
  userId?: string
): Promise<void> {
  try {
    const redis = await getRedisClient()
    const key = getTokenKey(provider, userId)

    // 만료 시간 계산 (1분 여유 두기)
    const ttlMs = token.expiresAt - Date.now() - 60000
    const ttlSecs = Math.max(Math.floor(ttlMs / 1000), 60) // 최소 60초

    await redis.setex(key, ttlSecs, JSON.stringify(token))

    safeLogger.debug(`[TokenCache] Cached token for ${provider}`, {
      ttlSecs,
      hasUserId: !!userId,
    })
  } catch (error) {
    safeLogger.error('[TokenCache] Failed to cache token', { provider, error })
  }
}

/**
 * 캐시에서 토큰 조회
 * @param provider - 제공자 이름
 * @param userId - 사용자별 토큰인 경우 사용자 ID
 * @returns 유효한 토큰 또는 null
 */
export async function getCachedToken(
  provider: string,
  userId?: string
): Promise<CachedToken | null> {
  try {
    const redis = await getRedisClient()
    const key = getTokenKey(provider, userId)

    const cached = await redis.get(key)
    if (!cached) {
      return null
    }

    const token: CachedToken = JSON.parse(cached)

    // 만료 확인 (1분 여유)
    if (Date.now() >= token.expiresAt - 60000) {
      await redis.del(key)
      return null
    }

    safeLogger.debug(`[TokenCache] Cache hit for ${provider}`)
    return token
  } catch (error) {
    safeLogger.error('[TokenCache] Failed to get cached token', { provider, error })
    return null
  }
}

/**
 * 캐시된 토큰 삭제
 */
export async function invalidateToken(
  provider: string,
  userId?: string
): Promise<void> {
  try {
    const redis = await getRedisClient()
    const key = getTokenKey(provider, userId)
    await redis.del(key)
    safeLogger.debug(`[TokenCache] Invalidated token for ${provider}`)
  } catch (error) {
    safeLogger.error('[TokenCache] Failed to invalidate token', { provider, error })
  }
}

/**
 * 특정 제공자의 모든 토큰 삭제
 */
export async function invalidateAllTokens(provider: string): Promise<void> {
  try {
    const redis = await getRedisClient()
    const pattern = `${TOKEN_PREFIX}:${provider}:*`
    const keys = await redis.keys(pattern)

    if (keys.length > 0) {
      await redis.del(keys)
      safeLogger.info(`[TokenCache] Invalidated ${keys.length} tokens for ${provider}`)
    }
  } catch (error) {
    safeLogger.error('[TokenCache] Failed to invalidate all tokens', { provider, error })
  }
}

/**
 * 토큰 TTL 조회 (남은 시간, 초)
 */
export async function getTokenTTL(
  provider: string,
  userId?: string
): Promise<number> {
  try {
    const redis = await getRedisClient()
    const key = getTokenKey(provider, userId)
    const ttl = await redis.ttl(key)
    return ttl > 0 ? ttl : 0
  } catch (error) {
    return 0
  }
}

// ============================================
// KIS Token Helper
// ============================================

/**
 * KIS 토큰 캐싱 헬퍼
 */
export const kisTokenCache = {
  async get(userId?: string): Promise<CachedToken | null> {
    return getCachedToken('kis', userId)
  },

  async set(token: {
    accessToken: string
    tokenType: string
    expiresIn: number
  }, userId?: string): Promise<void> {
    await cacheToken('kis', {
      ...token,
      expiresAt: Date.now() + token.expiresIn * 1000,
    }, userId)
  },

  async invalidate(userId?: string): Promise<void> {
    await invalidateToken('kis', userId)
  },

  async getTTL(userId?: string): Promise<number> {
    return getTokenTTL('kis', userId)
  },
}

// ============================================
// Polygon Token Helper (API 키 기반이라 캐싱 불필요하지만 예시)
// ============================================

/**
 * 범용 세션 토큰 캐싱 헬퍼
 */
export const sessionTokenCache = {
  async get(sessionId: string): Promise<string | null> {
    try {
      const redis = await getRedisClient()
      return redis.get(`session:${sessionId}`)
    } catch {
      return null
    }
  },

  async set(sessionId: string, data: string, ttlSecs: number = 3600): Promise<void> {
    try {
      const redis = await getRedisClient()
      await redis.setex(`session:${sessionId}`, ttlSecs, data)
    } catch (error) {
      safeLogger.error('[SessionCache] Failed to set session', { error })
    }
  },

  async delete(sessionId: string): Promise<void> {
    try {
      const redis = await getRedisClient()
      await redis.del(`session:${sessionId}`)
    } catch (error) {
      safeLogger.error('[SessionCache] Failed to delete session', { error })
    }
  },
}
