'use client'

// ============================================
// useStrategies Hook
// Supabase 연동 전략 목록 조회
// ============================================

import { useState, useEffect, useCallback } from 'react'
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client'
import type { Strategy as SupabaseStrategy } from '@/lib/supabase/types'

export interface Strategy {
  id: string
  name: string
  description: string | null
  status: 'draft' | 'backtesting' | 'ready' | 'running' | 'paused' | 'stopped'
  config: Record<string, unknown>
  performance: {
    totalReturn?: number
    winRate?: number
    sharpeRatio?: number
    maxDrawdown?: number
    totalTrades?: number
  } | null
  isPublic: boolean
  copyCount: number
  createdAt: Date
  updatedAt: Date
}

interface UseStrategiesOptions {
  status?: Strategy['status'] | Strategy['status'][]
  limit?: number
  orderBy?: 'created_at' | 'updated_at' | 'name'
  orderDirection?: 'asc' | 'desc'
}

interface UseStrategiesReturn {
  strategies: Strategy[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
  createStrategy: (name: string, config: Record<string, unknown>) => Promise<Strategy | null>
  updateStrategy: (id: string, updates: Partial<Pick<Strategy, 'name' | 'description' | 'status' | 'config'>>) => Promise<boolean>
  deleteStrategy: (id: string) => Promise<boolean>
}

// Demo strategies for fallback
const DEMO_STRATEGIES: Strategy[] = [
  {
    id: 'demo-1',
    name: 'RSI Momentum',
    description: 'RSI 기반 모멘텀 전략',
    status: 'running',
    config: { indicator: 'RSI', period: 14 },
    performance: { totalReturn: 18.7, winRate: 67.3, sharpeRatio: 1.85, maxDrawdown: -8.2, totalTrades: 45 },
    isPublic: false,
    copyCount: 0,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    id: 'demo-2',
    name: 'MACD Crossover',
    description: 'MACD 크로스오버 전략',
    status: 'running',
    config: { indicator: 'MACD', fast: 12, slow: 26 },
    performance: { totalReturn: 12.4, winRate: 62.5, sharpeRatio: 1.45, maxDrawdown: -12.3, totalTrades: 32 },
    isPublic: false,
    copyCount: 0,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'demo-3',
    name: 'Bollinger Band',
    description: '볼린저 밴드 평균회귀 전략',
    status: 'paused',
    config: { indicator: 'BB', period: 20, stdDev: 2 },
    performance: { totalReturn: -3.2, winRate: 44.4, sharpeRatio: 0.82, maxDrawdown: -15.7, totalTrades: 18 },
    isPublic: false,
    copyCount: 0,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
]

function transformSupabaseStrategy(row: SupabaseStrategy): Strategy {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    config: row.config as Record<string, unknown>,
    performance: row.performance as Strategy['performance'],
    isPublic: row.is_public,
    copyCount: row.copy_count,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

export function useStrategies(options: UseStrategiesOptions = {}): UseStrategiesReturn {
  const { status, limit = 50, orderBy = 'updated_at', orderDirection = 'desc' } = options

  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchStrategies = useCallback(async () => {
    if (!isSupabaseConfigured) {
      // Demo mode fallback
      setStrategies(DEMO_STRATEGIES)
      setIsLoading(false)
      return
    }

    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      setStrategies(DEMO_STRATEGIES)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setStrategies(DEMO_STRATEGIES)
        setIsLoading(false)
        return
      }

      let query = supabase
        .from('strategies')
        .select('*')
        .eq('user_id', user.id)
        .order(orderBy, { ascending: orderDirection === 'asc' })
        .limit(limit)

      // Filter by status
      if (status) {
        if (Array.isArray(status)) {
          query = query.in('status', status)
        } else {
          query = query.eq('status', status)
        }
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      if (data && data.length > 0) {
        setStrategies(data.map(transformSupabaseStrategy))
      } else {
        // No strategies yet - show empty state (not demo)
        setStrategies([])
      }
    } catch (err) {
      console.error('[useStrategies] Fetch error:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch strategies'))
      // Fallback to demo on error
      setStrategies(DEMO_STRATEGIES)
    } finally {
      setIsLoading(false)
    }
  }, [status, limit, orderBy, orderDirection])

  // Create strategy
  const createStrategy = useCallback(async (name: string, config: Record<string, unknown>): Promise<Strategy | null> => {
    if (!isSupabaseConfigured) return null

    const supabase = getSupabaseBrowserClient()
    if (!supabase) return null

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const insertData = {
        user_id: user.id,
        name,
        config,
        status: 'draft' as const,
      }

      const { data, error: insertError } = await supabase
        .from('strategies')
        .insert(insertData as never)
        .select()
        .single()

      if (insertError) throw insertError

      const newStrategy = transformSupabaseStrategy(data as SupabaseStrategy)
      setStrategies(prev => [newStrategy, ...prev])
      return newStrategy
    } catch (err) {
      console.error('[useStrategies] Create error:', err)
      return null
    }
  }, [])

  // Update strategy
  const updateStrategy = useCallback(async (
    id: string,
    updates: Partial<Pick<Strategy, 'name' | 'description' | 'status' | 'config'>>
  ): Promise<boolean> => {
    if (!isSupabaseConfigured) return false

    const supabase = getSupabaseBrowserClient()
    if (!supabase) return false

    try {
      const updateData: Record<string, unknown> = {}
      if (updates.name !== undefined) updateData.name = updates.name
      if (updates.description !== undefined) updateData.description = updates.description
      if (updates.status !== undefined) updateData.status = updates.status
      if (updates.config !== undefined) updateData.config = updates.config

      const { error: updateError } = await supabase
        .from('strategies')
        .update(updateData as never)
        .eq('id', id)

      if (updateError) throw updateError

      setStrategies(prev =>
        prev.map(s => s.id === id ? { ...s, ...updates, updatedAt: new Date() } : s)
      )
      return true
    } catch (err) {
      console.error('[useStrategies] Update error:', err)
      return false
    }
  }, [])

  // Delete strategy
  const deleteStrategy = useCallback(async (id: string): Promise<boolean> => {
    if (!isSupabaseConfigured) return false

    const supabase = getSupabaseBrowserClient()
    if (!supabase) return false

    try {
      const { error: deleteError } = await supabase
        .from('strategies')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      setStrategies(prev => prev.filter(s => s.id !== id))
      return true
    } catch (err) {
      console.error('[useStrategies] Delete error:', err)
      return false
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchStrategies()
  }, [fetchStrategies])

  return {
    strategies,
    isLoading,
    error,
    refetch: fetchStrategies,
    createStrategy,
    updateStrategy,
    deleteStrategy,
  }
}
