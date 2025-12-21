// ============================================
// Strategy Server Actions
// API 라우트를 대체하는 타입 안전한 Server Actions
// ============================================

'use server'

import type { Strategy, StrategyConfig, StrategyPerformance } from '@/types'
import {
  getStrategies as getStrategiesService,
  getStrategyById as getStrategyByIdService,
  createStrategy as createStrategyService,
  updateStrategy as updateStrategyService,
  deleteStrategy as deleteStrategyService,
} from '@/lib/services/strategies'
import { withAuth, type ActionResponse, validateRequired } from './utils/action-wrapper'
import {
  revalidateStrategies,
  revalidateStrategy,
  revalidateDashboard,
} from './utils/revalidation'
import { safeLogger } from '@/lib/utils/safe-logger'

// ============================================
// Types
// ============================================

export interface GetStrategiesOptions {
  status?: Strategy['status']
  page?: number
  limit?: number
  sortBy?: keyof Strategy
  sortOrder?: 'asc' | 'desc'
}

export interface CreateStrategyInput {
  name: string
  description?: string
  config?: StrategyConfig
}

export interface UpdateStrategyInput {
  name?: string
  description?: string
  status?: Strategy['status']
  config?: StrategyConfig
  performance?: StrategyPerformance
}

// ============================================
// Actions
// ============================================

/**
 * 전략 목록 조회
 * @example
 * const result = await getStrategiesAction({ status: 'running', page: 1, limit: 10 })
 * if (result.success) {
 *   console.log(result.data.strategies)
 * }
 */
export const getStrategiesAction = withAuth(
  async (
    userId: string,
    options: GetStrategiesOptions = {}
  ): Promise<{ strategies: Strategy[]; total: number; totalPages: number }> => {
    const { page = 1, limit = 10, status, sortBy, sortOrder } = options

    const { data: strategies, total } = await getStrategiesService({
      userId,
      status,
      page,
      limit,
      sortBy,
      sortOrder,
    })

    const totalPages = Math.ceil(total / limit)

    return {
      strategies,
      total,
      totalPages,
    }
  },
  'getStrategiesAction'
)

/**
 * 단일 전략 조회
 * @example
 * const result = await getStrategyAction('strategy-id-123')
 * if (result.success) {
 *   console.log(result.data)
 * }
 */
export const getStrategyAction = withAuth(
  async (userId: string, strategyId: string): Promise<Strategy> => {
    // Validation
    const validationError = validateRequired(strategyId, '전략 ID')
    if (validationError) {
      throw new Error(validationError.error)
    }

    const strategy = await getStrategyByIdService(strategyId)

    if (!strategy) {
      throw new Error('전략을 찾을 수 없습니다')
    }

    // 권한 체크 (본인의 전략만 조회 가능)
    if (strategy.userId !== userId) {
      safeLogger.warn('[getStrategyAction] Unauthorized access attempt', {
        userId,
        strategyId,
        ownerId: strategy.userId,
      })
      throw new Error('권한이 없습니다')
    }

    return strategy
  },
  'getStrategyAction'
)

/**
 * 전략 생성
 * @example
 * const result = await createStrategyAction({
 *   name: 'My Strategy',
 *   description: 'A great strategy',
 *   config: { symbols: ['AAPL'], timeframe: '1h' }
 * })
 * if (result.success) {
 *   console.log('Created:', result.data.id)
 * }
 */
export const createStrategyAction = withAuth(
  async (userId: string, input: CreateStrategyInput): Promise<Strategy> => {
    // Validation
    const nameError = validateRequired(input.name, '전략 이름')
    if (nameError) {
      throw new Error(nameError.error)
    }

    if (input.name.length > 100) {
      throw new Error('전략 이름은 100자 이내로 입력해주세요')
    }

    if (input.description && input.description.length > 500) {
      throw new Error('전략 설명은 500자 이내로 입력해주세요')
    }

    // 전략 생성
    const strategy = await createStrategyService({
      userId,
      name: input.name.trim(),
      description: input.description?.trim(),
      status: 'draft',
      config: input.config ?? {
        symbols: [],
        timeframe: '1h',
        entryConditions: [],
        exitConditions: [],
        riskManagement: {},
        allocation: 10,
      },
    })

    // 캐시 무효화
    await revalidateStrategies(userId)
    await revalidateDashboard()

    safeLogger.info('[createStrategyAction] Strategy created', {
      userId,
      strategyId: strategy.id,
      name: strategy.name,
    })

    return strategy
  },
  'createStrategyAction'
)

/**
 * 전략 수정
 * @example
 * const result = await updateStrategyAction('strategy-id-123', {
 *   name: 'Updated Strategy',
 *   status: 'running'
 * })
 * if (result.success) {
 *   console.log('Updated:', result.data)
 * }
 */
export const updateStrategyAction = withAuth(
  async (
    userId: string,
    strategyId: string,
    input: UpdateStrategyInput
  ): Promise<Strategy> => {
    // Validation
    const idError = validateRequired(strategyId, '전략 ID')
    if (idError) {
      throw new Error(idError.error)
    }

    if (input.name && input.name.length > 100) {
      throw new Error('전략 이름은 100자 이내로 입력해주세요')
    }

    if (input.description && input.description.length > 500) {
      throw new Error('전략 설명은 500자 이내로 입력해주세요')
    }

    // 권한 체크
    const existing = await getStrategyByIdService(strategyId)
    if (!existing) {
      throw new Error('전략을 찾을 수 없습니다')
    }

    if (existing.userId !== userId) {
      safeLogger.warn('[updateStrategyAction] Unauthorized update attempt', {
        userId,
        strategyId,
        ownerId: existing.userId,
      })
      throw new Error('권한이 없습니다')
    }

    // Sanitize input
    const updates: Partial<Strategy> = {}
    if (input.name !== undefined) updates.name = input.name.trim()
    if (input.description !== undefined) updates.description = input.description.trim()
    if (input.status !== undefined) updates.status = input.status
    if (input.config !== undefined) updates.config = input.config
    if (input.performance !== undefined) updates.performance = input.performance

    // 전략 수정
    const updated = await updateStrategyService(strategyId, updates)

    if (!updated) {
      throw new Error('전략 수정에 실패했습니다')
    }

    // 캐시 무효화
    await revalidateStrategy(strategyId)
    await revalidateStrategies(userId)
    await revalidateDashboard()

    safeLogger.info('[updateStrategyAction] Strategy updated', {
      userId,
      strategyId,
      updates: Object.keys(updates),
    })

    return updated
  },
  'updateStrategyAction'
)

/**
 * 전략 삭제
 * @example
 * const result = await deleteStrategyAction('strategy-id-123')
 * if (result.success) {
 *   console.log('Deleted successfully')
 * }
 */
export const deleteStrategyAction = withAuth(
  async (userId: string, strategyId: string): Promise<{ deleted: true }> => {
    // Validation
    const idError = validateRequired(strategyId, '전략 ID')
    if (idError) {
      throw new Error(idError.error)
    }

    // 권한 체크
    const existing = await getStrategyByIdService(strategyId)
    if (!existing) {
      throw new Error('전략을 찾을 수 없습니다')
    }

    if (existing.userId !== userId) {
      safeLogger.warn('[deleteStrategyAction] Unauthorized delete attempt', {
        userId,
        strategyId,
        ownerId: existing.userId,
      })
      throw new Error('권한이 없습니다')
    }

    // 전략 삭제
    const deleted = await deleteStrategyService(strategyId)

    if (!deleted) {
      throw new Error('전략 삭제에 실패했습니다')
    }

    // 캐시 무효화
    await revalidateStrategies(userId)
    await revalidateDashboard()

    safeLogger.info('[deleteStrategyAction] Strategy deleted', {
      userId,
      strategyId,
    })

    return { deleted: true }
  },
  'deleteStrategyAction'
)

/**
 * 전략 상태 변경 (shorthand for updateStrategyAction)
 * @example
 * const result = await changeStrategyStatusAction('strategy-id-123', 'running')
 * if (result.success) {
 *   console.log('Status changed')
 * }
 */
export async function changeStrategyStatusAction(
  strategyId: string,
  status: Strategy['status']
): Promise<ActionResponse<Strategy>> {
  return updateStrategyAction(strategyId, { status })
}
