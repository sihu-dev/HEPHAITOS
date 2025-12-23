// ============================================
// Strategy Service
// Supabase 연동 + Mock 데이터 fallback
// ============================================

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { createTypedStrategiesQuery } from '@/lib/supabase/typed-client'
import type { Strategy, StrategyConfig, StrategyPerformance } from '@/types'
import type { Database } from '@/lib/supabase/types'
import { mockStrategies, addStrategy as addMockStrategy, updateStrategy as updateMockStrategy, deleteStrategy as deleteMockStrategy } from '@/lib/mock-data'
import { safeLogger } from '@/lib/utils/safe-logger';

type StrategyRow = Database['public']['Tables']['strategies']['Row']

// 환경 설정: Supabase 사용 여부
const USE_SUPABASE = process.env.NEXT_PUBLIC_USE_SUPABASE === 'true'

/**
 * Supabase Row를 앱 Strategy 타입으로 변환
 */
function rowToStrategy(row: StrategyRow): Strategy {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description ?? undefined,
    status: row.status,
    config: row.config as unknown as StrategyConfig,
    performance: row.performance as unknown as StrategyPerformance | undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

// ============================================
// Server-side functions (API routes, Server Components)
// ============================================

/**
 * 전략 목록 조회 (서버)
 */
export async function getStrategies(options?: {
  userId?: string
  status?: Strategy['status']
  page?: number
  limit?: number
  sortBy?: keyof Strategy
  sortOrder?: 'asc' | 'desc'
}): Promise<{ data: Strategy[]; total: number }> {
  const { userId, status, page = 1, limit = 10, sortBy = 'updatedAt', sortOrder = 'desc' } = options ?? {}

  if (!USE_SUPABASE) {
    // Mock 데이터 사용
    let filtered = [...mockStrategies]
    if (userId) filtered = filtered.filter(s => s.userId === userId)
    if (status) filtered = filtered.filter(s => s.status === status)
    
    filtered.sort((a, b) => {
      const aVal = a[sortBy]
      const bVal = b[sortBy]
      if (aVal instanceof Date && bVal instanceof Date) {
        return sortOrder === 'asc' ? aVal.getTime() - bVal.getTime() : bVal.getTime() - aVal.getTime()
      }
      return 0
    })

    const start = (page - 1) * limit
    return {
      data: filtered.slice(start, start + limit),
      total: filtered.length,
    }
  }

  const supabase = await createServerSupabaseClient()
  if (!supabase) {
    return { data: [], total: 0 }
  }
  const strategiesQuery = createTypedStrategiesQuery(supabase)

  let query = supabase
    .from('strategies')
    .select('*', { count: 'exact' })

  if (userId) query = query.eq('user_id', userId)
  if (status) query = query.eq('status', status)

  // Supabase column name mapping
  const columnMap: Record<string, string> = {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    userId: 'user_id',
  }
  const dbColumn = columnMap[sortBy as string] ?? sortBy
  query = query.order(dbColumn, { ascending: sortOrder === 'asc' })

  const start = (page - 1) * limit
  query = query.range(start, start + limit - 1)

  const { data, error, count } = await query

  if (error) {
    safeLogger.error('[StrategyService] getStrategies error:', error)
    // Fallback to mock - but prevent infinite loop
    let filtered = [...mockStrategies]
    if (userId) filtered = filtered.filter(s => s.userId === userId)
    if (status) filtered = filtered.filter(s => s.status === status)
    return { data: filtered.slice(0, limit), total: filtered.length }
  }

  return {
    data: (data ?? []).map((row) => rowToStrategy(row as StrategyRow)),
    total: count ?? 0,
  }
}

/**
 * 단일 전략 조회 (서버)
 */
export async function getStrategyById(id: string): Promise<Strategy | null> {
  if (!USE_SUPABASE) {
    return mockStrategies.find(s => s.id === id) ?? null
  }

  const supabase = await createServerSupabaseClient()
  if (!supabase) {
    return { data: [], total: 0 }
  }
  const strategiesQuery = createTypedStrategiesQuery(supabase)

  const { data, error } = await strategiesQuery.selectById(id)

  if (error) {
    safeLogger.error('[StrategyService] getStrategyById error:', error)
    return mockStrategies.find(s => s.id === id) ?? null
  }

  return data ? rowToStrategy(data as StrategyRow) : null
}

/**
 * 전략 생성 (서버)
 */
export async function createStrategy(
  strategy: Omit<Strategy, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Strategy> {
  if (!USE_SUPABASE) {
    const newStrategy: Strategy = {
      ...strategy,
      id: Math.random().toString(36).substring(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    addMockStrategy(newStrategy)
    return newStrategy
  }

  const supabase = await createServerSupabaseClient()
  if (!supabase) {
    return { data: [], total: 0 }
  }
  const strategiesQuery = createTypedStrategiesQuery(supabase)

  const { data, error } = await strategiesQuery.insert({
    user_id: strategy.userId,
    name: strategy.name,
    description: strategy.description ?? null,
    status: strategy.status ?? 'draft',
    config: strategy.config as any,
  })

  if (error) {
    safeLogger.error('[StrategyService] createStrategy error:', error)
    throw new Error('전략 생성에 실패했습니다')
  }

  return rowToStrategy(data as StrategyRow)
}

/**
 * 전략 업데이트 (서버)
 */
export async function updateStrategy(
  id: string,
  updates: Partial<Strategy>
): Promise<Strategy | null> {
  if (!USE_SUPABASE) {
    return updateMockStrategy(id, updates)
  }

  const supabase = await createServerSupabaseClient()
  if (!supabase) {
    return { data: [], total: 0 }
  }
  const strategiesQuery = createTypedStrategiesQuery(supabase)

  const updateData: Database['public']['Tables']['strategies']['Update'] = {}
  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.description !== undefined) updateData.description = updates.description
  if (updates.status !== undefined) updateData.status = updates.status
  if (updates.config !== undefined) updateData.config = updates.config as never
  if (updates.performance !== undefined) updateData.performance = updates.performance as never

  const { data, error } = await strategiesQuery.update(id, updateData)

  if (error) {
    safeLogger.error('[StrategyService] updateStrategy error:', error)
    return updateMockStrategy(id, updates)
  }

  return data ? rowToStrategy(data as StrategyRow) : null
}

/**
 * 전략 삭제 (서버)
 */
export async function deleteStrategy(id: string): Promise<boolean> {
  if (!USE_SUPABASE) {
    return deleteMockStrategy(id)
  }

  const supabase = await createServerSupabaseClient()
  if (!supabase) {
    return { data: [], total: 0 }
  }
  const strategiesQuery = createTypedStrategiesQuery(supabase)

  const { error } = await strategiesQuery.delete(id)

  if (error) {
    safeLogger.error('[StrategyService] deleteStrategy error:', error)
    return deleteMockStrategy(id)
  }

  return true
}

// ============================================
// Client-side functions (React Components)
// ============================================

/**
 * 전략 목록 조회 (클라이언트)
 */
export async function getStrategiesClient(options?: {
  userId?: string
  status?: Strategy['status']
}): Promise<Strategy[]> {
  if (!USE_SUPABASE) {
    let filtered = [...mockStrategies]
    if (options?.userId) filtered = filtered.filter(s => s.userId === options.userId)
    if (options?.status) filtered = filtered.filter(s => s.status === options.status)
    return filtered
  }

  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    return mockStrategies
  }

  let query = supabase
    .from('strategies')
    .select('*')
    .order('updated_at', { ascending: false })

  if (options?.userId) query = query.eq('user_id', options.userId)
  if (options?.status) query = query.eq('status', options.status)

  const { data, error } = await query

  if (error) {
    safeLogger.error('[StrategyService] getStrategiesClient error:', error)
    return mockStrategies
  }

  return (data ?? []).map((row) => rowToStrategy(row as StrategyRow))
}

/**
 * 실시간 전략 구독 (클라이언트)
 */
export function subscribeToStrategies(
  userId: string,
  callback: (strategies: Strategy[]) => void
): () => void {
  if (!USE_SUPABASE) {
    // Mock: 즉시 콜백 실행
    callback(mockStrategies.filter(s => s.userId === userId))
    return () => {}
  }

  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    callback(mockStrategies.filter(s => s.userId === userId))
    return () => {}
  }

  const channel = supabase
    .channel('strategies-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'strategies',
        filter: `user_id=eq.${userId}`,
      },
      async () => {
        // 변경 시 전체 목록 재조회
        const strategies = await getStrategiesClient({ userId })
        callback(strategies)
      }
    )
    .subscribe()

  // 초기 데이터 로드
  getStrategiesClient({ userId }).then(callback)

  return () => {
    supabase.removeChannel(channel)
  }
}
