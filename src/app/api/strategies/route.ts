// ============================================
// Strategies API Route
// Rate Limiting + Error Handling 표준화 적용
// ============================================

import { NextRequest } from 'next/server'
import type { Strategy, PaginatedResponse } from '@/types'
import {
  withApiMiddleware,
  createApiResponse,
  validateRequestBody,
  validateQueryParams,
} from '@/lib/api/middleware'
import { createStrategySchema, strategyQuerySchema } from '@/lib/validations/strategy'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getStrategies, createStrategy } from '@/lib/services/strategies'
import { safeLogger } from '@/lib/utils/safe-logger'

export const dynamic = 'force-dynamic'

// ============================================
// Helper Functions
// ============================================

async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = await createServerSupabaseClient()
    if (!supabase) return null
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id ?? null
  } catch {
    return null
  }
}

// ============================================
// GET /api/strategies
// ============================================

export const GET = withApiMiddleware(
  async (request: NextRequest) => {
    // Validate query parameters
    const validation = validateQueryParams(request, strategyQuerySchema)
    if ('error' in validation) return validation.error

    const { page, limit, status, sortBy, sortOrder } = validation.data

    // Get current user for filtering
    const userId = await getCurrentUserId()

    safeLogger.info('[Strategies API] Fetching strategies', {
      userId: userId || 'demo',
      status,
      page,
      limit,
    })

    // Use service layer
    const { data: strategies, total } = await getStrategies({
      userId: userId ?? '00000000-0000-0000-0000-000000000001', // Demo user UUID
      status: status as Strategy['status'] | undefined,
      page,
      limit,
      sortBy: sortBy as keyof Strategy,
      sortOrder,
    })

    const totalPages = Math.ceil(total / limit)

    const response: PaginatedResponse<Strategy> = {
      data: strategies,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    }

    return createApiResponse(response)
  },
  {
    rateLimit: { category: 'strategy' },
    errorHandler: { logErrors: true },
  }
)

// ============================================
// POST /api/strategies
// ============================================

export const POST = withApiMiddleware(
  async (request: NextRequest) => {
    // Validate request body
    const validation = await validateRequestBody(request, createStrategySchema)
    if ('error' in validation) return validation.error

    const validatedData = validation.data

    // Get authenticated user ID
    const userId = await getCurrentUserId() ?? 'demo_user'

    safeLogger.info('[Strategies API] Creating strategy', {
      userId,
      name: validatedData.name,
    })

    // Create strategy via service layer
    const newStrategy = await createStrategy({
      userId,
      name: validatedData.name,
      description: validatedData.description,
      status: 'draft',
      config: validatedData.config || {
        symbols: [],
        timeframe: '1h',
        entryConditions: [],
        exitConditions: [],
        riskManagement: {},
        allocation: 10,
      },
    })

    safeLogger.info('[Strategies API] Strategy created', {
      strategyId: newStrategy.id,
    })

    return createApiResponse(newStrategy, 201)
  },
  {
    rateLimit: { category: 'strategy' },
    errorHandler: { logErrors: true },
  }
)
