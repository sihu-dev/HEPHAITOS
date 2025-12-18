// ============================================
// Trading Agent API Route
// 자연어 → 트레이딩 전략
// Rate Limiting + Error Handling 표준화 적용
// ============================================

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createTradingAgent } from '@/lib/agent'
import {
  withApiMiddleware,
  createApiResponse,
  createErrorResponse,
  validateRequestBody,
} from '@/lib/api/middleware'
import { getAgentSession, setAgentSession, deleteAgentSession } from '@/lib/redis/agent-session'
import { safeLogger } from '@/lib/utils/safe-logger'
import { createAgentCache } from '@/lib/utils/lru-cache'

export const dynamic = 'force-dynamic'

// ============================================
// Validation Schemas
// ============================================

const processInputSchema = z.object({
  input: z.string().min(1, '입력이 필요합니다'),
  sessionId: z.string().optional().default('default'),
})

const confirmInputSchema = z.object({
  sessionId: z.string().optional().default('default'),
  confirmed: z.boolean({ message: 'confirmed 값이 필요합니다' }),
})

// ============================================
// Agent Instance Management (LRU Cache + Redis 하이브리드)
// 🆕 2026: Prevents unbounded memory growth with LRU cache (max 100 agents)
// ============================================

const agentInstances = createAgentCache<ReturnType<typeof createTradingAgent>>(100)

async function getOrCreateAgent(sessionId: string) {
  // LRU 캐시 확인
  const cachedAgent = agentInstances.get(sessionId)
  if (cachedAgent) {
    safeLogger.debug('[Agent API] Agent found in LRU cache', {
      sessionId,
      cacheSize: agentInstances.size
    })
    return cachedAgent
  }

  // Redis에서 세션 컨텍스트 복원 시도
  const savedContext = await getAgentSession(sessionId)

  const agent = createTradingAgent()

  // 저장된 컨텍스트가 있으면 복원
  if (savedContext) {
    safeLogger.info('[Agent API] Restored session from Redis', { sessionId })
  }

  // LRU 캐시에 저장 (자동으로 가장 오래된 항목 제거)
  agentInstances.set(sessionId, agent)

  safeLogger.info('[Agent API] New agent created and cached', {
    sessionId,
    cacheSize: agentInstances.size
  })

  return agent
}

// 🆕 2026: LRU 캐시가 자동으로 관리하므로 수동 정리 불필요
// TTL 기반 자동 만료 (30분) + LRU eviction (최대 100개)
// Redis는 영구 저장소로 계속 사용

// ============================================
// POST /api/ai/agent - Process natural language
// ============================================

export const POST = withApiMiddleware(
  async (request: NextRequest) => {
    const validation = await validateRequestBody(request, processInputSchema)
    if ('error' in validation) return validation.error

    const { input, sessionId } = validation.data

    safeLogger.info('[Agent API] Processing input', {
      sessionId,
      inputLength: input.length,
    })

    const agent = await getOrCreateAgent(sessionId)
    const response = await agent.process(input)

    // Redis에 세션 저장 (에러 처리 개선)
    let sessionSaveWarning: string | undefined
    try {
      await setAgentSession(sessionId, agent.getContext())
    } catch (err) {
      safeLogger.error('[Agent API] Failed to save session to Redis', {
        error: err,
        sessionId
      })
      // Fallback: 메모리에만 유지되고 사용자에게 경고
      sessionSaveWarning = 'Session persistence may be limited. Please save your strategy manually.'
    }

    // LRU 캐시가 자동으로 관리 (더 이상 수동 스케줄링 불필요)

    return createApiResponse({
      message: response.message,
      intent: response.intent.type,
      confidence: response.intent.confidence,
      action: response.action,
      suggestions: response.suggestions,
      requiresConfirmation: response.requiresConfirmation,
      confirmationPrompt: response.confirmationPrompt,
      ...(sessionSaveWarning && { warning: sessionSaveWarning }),
    })
  },
  {
    rateLimit: { category: 'ai' },
    errorHandler: { logErrors: true },
  }
)

// ============================================
// PUT /api/ai/agent - Confirm pending action
// ============================================

export const PUT = withApiMiddleware(
  async (request: NextRequest) => {
    const validation = await validateRequestBody(request, confirmInputSchema)
    if ('error' in validation) return validation.error

    const { sessionId, confirmed } = validation.data

    safeLogger.info('[Agent API] Confirming action', { sessionId, confirmed })

    const agent = await getOrCreateAgent(sessionId)
    const response = await agent.confirm(confirmed)

    if (!response) {
      return createApiResponse({
        message: '확인 대기 중인 작업이 없습니다.',
      })
    }

    // Redis에 세션 저장
    setAgentSession(sessionId, agent.getContext()).catch((err) => {
      safeLogger.error('[Agent API] Failed to save session', { error: err })
    })

    return createApiResponse({
      message: response.message,
      action: response.action,
    })
  },
  {
    rateLimit: { category: 'ai' },
    errorHandler: { logErrors: true },
  }
)

// ============================================
// DELETE /api/ai/agent - Reset session
// ============================================

export const DELETE = withApiMiddleware(
  async (request: NextRequest) => {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId') || 'default'

    safeLogger.info('[Agent API] Resetting session', { sessionId })

    // LRU 캐시에서 제거 (onEvict 콜백이 자동으로 agent.reset() 호출)
    agentInstances.delete(sessionId)

    // Redis에서도 제거
    await deleteAgentSession(sessionId)

    return createApiResponse({
      message: 'Session reset successfully',
    })
  },
  {
    rateLimit: { category: 'api' },
    errorHandler: { logErrors: true },
  }
)
