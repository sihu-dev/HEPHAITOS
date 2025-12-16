// ============================================
// Broker API Route
// 증권사 연동 관리
// Zod Validation + Error Handling 표준화 적용
// ============================================

import { NextRequest } from 'next/server'
import { brokerManager, SUPPORTED_BROKERS, getBrokerInfo } from '@/lib/broker'
import type { BrokerId, BrokerCredentials } from '@/lib/broker'
import {
  withApiMiddleware,
  createApiResponse,
  validateQueryParams,
  validateRequestBody,
} from '@/lib/api/middleware'
import {
  brokerQuerySchema,
  connectBrokerSchema,
  disconnectBrokerSchema,
} from '@/lib/validations/broker'
import { safeLogger } from '@/lib/utils/safe-logger'

export const dynamic = 'force-dynamic'

/**
 * GET /api/broker
 * Get supported brokers list or connected broker status
 */
export const GET = withApiMiddleware(
  async (request: NextRequest) => {
    const validation = validateQueryParams(request, brokerQuerySchema)
    if ('error' in validation) return validation.error

    const { userId, brokerId } = validation.data

    // 특정 브로커 정보 조회
    if (brokerId) {
      safeLogger.info('[Broker API] Getting broker info', { brokerId })
      const info = getBrokerInfo(brokerId as BrokerId)
      if (!info) {
        safeLogger.warn('[Broker API] Broker not found', { brokerId })
        return createApiResponse({ error: 'Broker not found' }, { status: 404 })
      }
      return createApiResponse({ broker: info })
    }

    // 사용자 연결 상태 조회
    if (userId) {
      safeLogger.info('[Broker API] Getting user connections', { userId })
      const connections = brokerManager.getActiveConnections(userId)
      return createApiResponse({
        userId,
        connectedBrokers: connections,
        brokers: connections.map((id) => getBrokerInfo(id)),
      })
    }

    // 전체 지원 브로커 목록
    safeLogger.info('[Broker API] Getting supported brokers')
    return createApiResponse({ brokers: SUPPORTED_BROKERS })
  },
  {
    rateLimit: { category: 'api' },
    errorHandler: { logErrors: true },
  }
)

/**
 * POST /api/broker
 * Connect to a broker
 */
export const POST = withApiMiddleware(
  async (request: NextRequest) => {
    const validation = await validateRequestBody(request, connectBrokerSchema)
    if ('error' in validation) return validation.error

    const { userId, brokerId, credentials } = validation.data

    safeLogger.info('[Broker API] Connecting broker', { userId, brokerId })

    // 지원 브로커 확인
    const brokerInfo = getBrokerInfo(brokerId as BrokerId)
    if (!brokerInfo) {
      safeLogger.warn('[Broker API] Unsupported broker', { brokerId })
      return createApiResponse({ error: 'Unsupported broker' }, { status: 400 })
    }

    // 연결 시도
    const result = await brokerManager.connect(
      userId,
      brokerId as BrokerId,
      credentials as BrokerCredentials
    )

    if (!result.success) {
      safeLogger.warn('[Broker API] Connection failed', {
        userId,
        brokerId,
        message: result.message,
      })
      return createApiResponse({ error: result.message }, { status: 400 })
    }

    safeLogger.info('[Broker API] Broker connected successfully', { userId, brokerId })

    return createApiResponse({
      message: result.message,
      broker: brokerInfo,
    })
  },
  {
    rateLimit: { category: 'write' },
    errorHandler: { logErrors: true },
  }
)

/**
 * DELETE /api/broker
 * Disconnect from a broker
 */
export const DELETE = withApiMiddleware(
  async (request: NextRequest) => {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const brokerId = searchParams.get('brokerId') as BrokerId | null

    if (!userId) {
      return createApiResponse({ error: 'userId is required' }, { status: 400 })
    }

    safeLogger.info('[Broker API] Disconnecting broker', { userId, brokerId })

    if (brokerId) {
      await brokerManager.disconnect(userId, brokerId)
    } else {
      await brokerManager.disconnectAll(userId)
    }

    const message = brokerId ? `${brokerId} disconnected` : 'All brokers disconnected'

    safeLogger.info('[Broker API] Disconnected successfully', { userId, brokerId })

    return createApiResponse({ message })
  },
  {
    rateLimit: { category: 'write' },
    errorHandler: { logErrors: true },
  }
)
