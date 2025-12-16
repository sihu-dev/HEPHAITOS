// ============================================
// Simulation Account API Route
// 가상 계좌 관리
// Zod Validation + Error Handling 표준화 적용
// ============================================

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { simulationAccountManager } from '@/lib/simulation'
import { withApiMiddleware, createApiResponse, validateQueryParams, validateRequestBody } from '@/lib/api/middleware'
import { safeLogger } from '@/lib/utils/safe-logger'

export const dynamic = 'force-dynamic'

// Validation schemas
const getSimulationSchema = z.object({
  userId: z.string().optional(),
  accountId: z.string().optional(),
}).refine(data => data.userId || data.accountId, {
  message: 'Either userId or accountId must be provided',
})

const createSimulationSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  name: z.string().min(1).max(50).optional(),
})

const deleteSimulationSchema = z.object({
  accountId: z.string().min(1, 'accountId is required'),
})

/**
 * GET /api/simulation?userId=xxx
 * Get user's simulation accounts
 */
export const GET = withApiMiddleware(
  async (request: NextRequest) => {
    const validation = validateQueryParams(request, getSimulationSchema)
    if ('error' in validation) return validation.error

    const { userId, accountId } = validation.data

    safeLogger.info('[Simulation API] Fetching accounts', { userId, accountId })

    if (accountId) {
      const account = simulationAccountManager.getAccount(accountId)
      if (!account) {
        return createApiResponse({ error: 'Account not found' }, { status: 404 })
      }

      const summary = simulationAccountManager.getAccountSummary(accountId)

      return createApiResponse({ account, summary })
    }

    const accounts = simulationAccountManager.getUserAccounts(userId!)
    const accountsWithSummary = accounts.map((account) => ({
      account,
      summary: simulationAccountManager.getAccountSummary(account.id),
    }))

    return createApiResponse(accountsWithSummary)
  },
  {
    rateLimit: { category: 'api' },
    errorHandler: { logErrors: true },
  }
)

/**
 * POST /api/simulation
 * Create new simulation account
 */
export const POST = withApiMiddleware(
  async (request: NextRequest) => {
    const validation = await validateRequestBody(request, createSimulationSchema)
    if ('error' in validation) return validation.error

    const { userId, name } = validation.data

    safeLogger.info('[Simulation API] Creating account', { userId, name })

    const account = simulationAccountManager.createAccount(userId, name)

    return createApiResponse(account)
  },
  {
    rateLimit: { category: 'write' },
    errorHandler: { logErrors: true },
  }
)

/**
 * DELETE /api/simulation?accountId=xxx
 * Delete simulation account
 */
export const DELETE = withApiMiddleware(
  async (request: NextRequest) => {
    const validation = validateQueryParams(request, deleteSimulationSchema)
    if ('error' in validation) return validation.error

    const { accountId } = validation.data

    safeLogger.info('[Simulation API] Deleting account', { accountId })

    const deleted = simulationAccountManager.deleteAccount(accountId)

    return createApiResponse({ deleted })
  },
  {
    rateLimit: { category: 'write' },
    errorHandler: { logErrors: true },
  }
)
