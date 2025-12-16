// ============================================
// Redis Agent Session Store
// AI 에이전트 세션 영속화
// ============================================

import { getRedisClient } from './client'
import { safeLogger } from '@/lib/utils/safe-logger'
import type { ConversationContext } from '@/lib/agent/types'

// ============================================
// Constants
// ============================================

const SESSION_PREFIX = 'agent:session'
const SESSION_TTL = 60 * 60 * 24 // 24 hours

// ============================================
// Types
// ============================================

interface SerializedSession {
  context: ConversationContext
  createdAt: string
  lastAccessedAt: string
}

// ============================================
// Session Operations
// ============================================

/**
 * 에이전트 세션 저장
 */
export async function setAgentSession(
  sessionId: string,
  context: ConversationContext
): Promise<void> {
  try {
    const redis = await getRedisClient()
    const key = `${SESSION_PREFIX}:${sessionId}`

    const serialized: SerializedSession = {
      context: {
        ...context,
        messages: context.messages.slice(-50), // 최근 50개 메시지만 저장
      },
      createdAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
    }

    await redis.setex(key, SESSION_TTL, JSON.stringify(serialized))

    safeLogger.debug('[AgentSession] Session saved', {
      sessionId,
      messageCount: context.messages.length,
    })
  } catch (error) {
    safeLogger.error('[AgentSession] Failed to save session', {
      sessionId,
      error,
    })
    // 실패해도 서비스는 계속 동작 (graceful degradation)
  }
}

/**
 * 에이전트 세션 조회
 */
export async function getAgentSession(
  sessionId: string
): Promise<ConversationContext | null> {
  try {
    const redis = await getRedisClient()
    const key = `${SESSION_PREFIX}:${sessionId}`

    const data = await redis.get(key)
    if (!data) {
      return null
    }

    const session: SerializedSession = JSON.parse(data)

    // 마지막 접근 시간 업데이트
    const updated: SerializedSession = {
      ...session,
      lastAccessedAt: new Date().toISOString(),
    }
    await redis.setex(key, SESSION_TTL, JSON.stringify(updated))

    // Date 객체 복원
    const context = session.context
    context.messages = context.messages.map((msg) => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    }))

    if (context.lastBacktestResult) {
      // BacktestSummary doesn't have date fields to restore
    }

    safeLogger.debug('[AgentSession] Session retrieved', {
      sessionId,
      messageCount: context.messages.length,
    })

    return context
  } catch (error) {
    safeLogger.error('[AgentSession] Failed to get session', {
      sessionId,
      error,
    })
    return null
  }
}

/**
 * 에이전트 세션 삭제
 */
export async function deleteAgentSession(sessionId: string): Promise<void> {
  try {
    const redis = await getRedisClient()
    const key = `${SESSION_PREFIX}:${sessionId}`

    await redis.del(key)

    safeLogger.debug('[AgentSession] Session deleted', { sessionId })
  } catch (error) {
    safeLogger.error('[AgentSession] Failed to delete session', {
      sessionId,
      error,
    })
  }
}

/**
 * 세션 존재 여부 확인
 */
export async function hasAgentSession(sessionId: string): Promise<boolean> {
  try {
    const redis = await getRedisClient()
    const key = `${SESSION_PREFIX}:${sessionId}`

    const exists = await redis.get(key)
    return exists !== null
  } catch (error) {
    safeLogger.error('[AgentSession] Failed to check session', {
      sessionId,
      error,
    })
    return false
  }
}

/**
 * 세션 TTL 연장
 */
export async function extendAgentSession(sessionId: string): Promise<void> {
  try {
    const redis = await getRedisClient()
    const key = `${SESSION_PREFIX}:${sessionId}`

    await redis.expire(key, SESSION_TTL)

    safeLogger.debug('[AgentSession] Session TTL extended', { sessionId })
  } catch (error) {
    safeLogger.error('[AgentSession] Failed to extend session', {
      sessionId,
      error,
    })
  }
}

/**
 * 모든 활성 세션 ID 조회
 */
export async function getActiveSessionIds(): Promise<string[]> {
  try {
    const redis = await getRedisClient()

    // keys 명령은 프로덕션에서 사용하지 않는 것이 좋지만,
    // 관리 목적으로만 사용
    const keys = await redis.keys(`${SESSION_PREFIX}:*`)

    return keys.map((key: string) => key.replace(`${SESSION_PREFIX}:`, ''))
  } catch (error) {
    safeLogger.error('[AgentSession] Failed to get active sessions', { error })
    return []
  }
}

/**
 * 세션 통계 조회
 */
export async function getSessionStats(): Promise<{
  totalSessions: number
  oldestSession: string | null
  newestSession: string | null
}> {
  try {
    const redis = await getRedisClient()
    const keys = await redis.keys(`${SESSION_PREFIX}:*`)

    if (keys.length === 0) {
      return {
        totalSessions: 0,
        oldestSession: null,
        newestSession: null,
      }
    }

    let oldest: { id: string; time: Date } | null = null
    let newest: { id: string; time: Date } | null = null

    for (const key of keys) {
      const data = await redis.get(key)
      if (data) {
        const session: SerializedSession = JSON.parse(data)
        const createdAt = new Date(session.createdAt)
        const sessionId = key.replace(`${SESSION_PREFIX}:`, '')

        if (!oldest || createdAt < oldest.time) {
          oldest = { id: sessionId, time: createdAt }
        }
        if (!newest || createdAt > newest.time) {
          newest = { id: sessionId, time: createdAt }
        }
      }
    }

    return {
      totalSessions: keys.length,
      oldestSession: oldest?.id || null,
      newestSession: newest?.id || null,
    }
  } catch (error) {
    safeLogger.error('[AgentSession] Failed to get stats', { error })
    return {
      totalSessions: 0,
      oldestSession: null,
      newestSession: null,
    }
  }
}
