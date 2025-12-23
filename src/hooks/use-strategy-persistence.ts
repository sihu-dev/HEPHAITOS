// ============================================
// Strategy Persistence Hook
// Handles saving/loading strategies to/from Supabase
// ============================================

'use client'

import { useState, useCallback } from 'react'
import type { Node, Edge } from 'reactflow'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { createTypedStrategiesQuery } from '@/lib/supabase/typed-client'
import { safeLogger } from '@/lib/utils/safe-logger';

interface StrategyGraph {
  nodes: Node[]
  edges: Edge[]
}

interface SaveStrategyParams {
  id?: string
  name: string
  description?: string
  graph: StrategyGraph
}

interface UseStrategyPersistenceReturn {
  isSaving: boolean
  isLoading: boolean
  error: string | null
  saveStrategy: (params: SaveStrategyParams) => Promise<string | null>
  loadStrategy: (id: string) => Promise<StrategyGraph | null>
  loadUserStrategies: () => Promise<{ id: string; name: string; updatedAt: string }[]>
  clearError: () => void
}

export function useStrategyPersistence(): UseStrategyPersistenceReturn {
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const saveStrategy = useCallback(async (params: SaveStrategyParams): Promise<string | null> => {
    setIsSaving(true)
    setError(null)

    try {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) {
        // Fallback to localStorage when Supabase is not available
        const localStrategies = JSON.parse(localStorage.getItem('hephaitos_strategies') || '[]')
        const strategyId = params.id || `local_${Date.now()}`
        const strategyData = {
          id: strategyId,
          name: params.name,
          description: params.description || '',
          graph: params.graph,
          updatedAt: new Date().toISOString(),
        }
        const existingIndex = localStrategies.findIndex((s: { id: string }) => s.id === strategyId)
        if (existingIndex >= 0) {
          localStrategies[existingIndex] = strategyData
        } else {
          localStrategies.push(strategyData)
        }
        localStorage.setItem('hephaitos_strategies', JSON.stringify(localStrategies))
        return strategyId
      }
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // Fallback to localStorage for non-authenticated users
        const localStrategies = JSON.parse(localStorage.getItem('hephaitos_strategies') || '[]')
        const strategyId = params.id || `local_${Date.now()}`

        const strategyData = {
          id: strategyId,
          name: params.name,
          description: params.description || '',
          graph: params.graph,
          updatedAt: new Date().toISOString(),
        }

        const existingIndex = localStrategies.findIndex((s: { id: string }) => s.id === strategyId)
        if (existingIndex >= 0) {
          localStrategies[existingIndex] = strategyData
        } else {
          localStrategies.push(strategyData)
        }

        localStorage.setItem('hephaitos_strategies', JSON.stringify(localStrategies))
        return strategyId
      }

      // Save to Supabase
      const strategyData = {
        user_id: user.id,
        name: params.name,
        description: params.description || null,
        graph: params.graph as unknown,
        config: {
          symbols: [],
          timeframe: '1h',
          entryConditions: [],
          exitConditions: [],
          riskManagement: {},
          allocation: 10,
        },
        status: 'draft' as const,
        updated_at: new Date().toISOString(),
      }

      const strategiesQuery = createTypedStrategiesQuery(supabase)

      if (params.id && !params.id.startsWith('local_')) {
        // Update existing strategy
        const { data, error: updateError } = await supabase
          .from('strategies')
          // @ts-ignore - Supabase generated types conflict
          .update(strategyData)
          .eq('id', params.id)
          .eq('user_id', user.id)
          .select('id')
          .single()

        if (updateError) throw updateError
        return (data as { id: string } | null)?.id || null
      } else {
        // Create new strategy
        const { data, error: insertError } = await strategiesQuery.insert(strategyData as any)

        if (insertError) throw insertError
        return (data as { id: string } | null)?.id || null
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save strategy'
      setError(message)
      safeLogger.error('Save strategy error:', err)
      return null
    } finally {
      setIsSaving(false)
    }
  }, [])

  const loadStrategy = useCallback(async (id: string): Promise<StrategyGraph | null> => {
    setIsLoading(true)
    setError(null)

    try {
      // Check localStorage first for local strategies
      if (id.startsWith('local_')) {
        const localStrategies = JSON.parse(localStorage.getItem('hephaitos_strategies') || '[]')
        const strategy = localStrategies.find((s: { id: string }) => s.id === id)
        return strategy?.graph || null
      }

      const supabase = getSupabaseBrowserClient()
      if (!supabase) {
        setError('서비스를 사용할 수 없습니다')
        return null
      }
      const { data, error: fetchError } = await supabase
        .from('strategies')
        .select('graph')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError
      return ((data as { graph: unknown } | null)?.graph as StrategyGraph) || null
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load strategy'
      setError(message)
      safeLogger.error('Load strategy error:', err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadUserStrategies = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Get local strategies
      const localStrategies = JSON.parse(localStorage.getItem('hephaitos_strategies') || '[]')
        .map((s: { id: string; name: string; updatedAt: string }) => ({
          id: s.id,
          name: s.name,
          updatedAt: s.updatedAt,
        }))

      const supabase = getSupabaseBrowserClient()
      if (!supabase) {
        return localStrategies
      }
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return localStrategies
      }

      // Get Supabase strategies
      const { data, error: fetchError } = await supabase
        .from('strategies')
        .select('id, name, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (fetchError) throw fetchError

      type StrategyRow = { id: string; name: string; updated_at: string }
      const supabaseStrategies = ((data || []) as StrategyRow[]).map(s => ({
        id: s.id,
        name: s.name,
        updatedAt: s.updated_at,
      }))

      return [...supabaseStrategies, ...localStrategies]
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load strategies'
      setError(message)
      safeLogger.error('Load user strategies error:', err)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    isSaving,
    isLoading,
    error,
    saveStrategy,
    loadStrategy,
    loadUserStrategies,
    clearError,
  }
}
