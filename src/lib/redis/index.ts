// ============================================
// Redis Module Export
// ============================================

export {
  getRedisClient,
  isRedisConnected,
  closeRedisConnection,
  InMemoryRedis,
  type RedisClientType,
} from './client'

export {
  RedisRateLimiter,
  apiRateLimiter,
  exchangeRateLimiter,
  authRateLimiter,
  strategyRateLimiter,
  aiRateLimiter,
  backtestRateLimiter,
  createRateLimitResponse,
  getClientIP,
  getRateLimiterStatus,
  type RateLimitResult,
  type RateLimitConfig,
} from './rate-limiter'

export {
  cacheToken,
  getCachedToken,
  invalidateToken,
  invalidateAllTokens,
  getTokenTTL,
  kisTokenCache,
  sessionTokenCache,
  type CachedToken,
} from './token-cache'

export {
  setAgentSession,
  getAgentSession,
  deleteAgentSession,
  hasAgentSession,
  extendAgentSession,
  getActiveSessionIds,
  getSessionStats,
} from './agent-session'
