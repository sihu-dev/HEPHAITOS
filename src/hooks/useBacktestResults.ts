'use client'

// ============================================
// useBacktestResults Hook
// Supabase 연동 백테스트 결과 조회
// ============================================

import { useState, useEffect, useCallback } from 'react'
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client'

export interface BacktestResult {
  id: string
  strategyId: string
  strategyName: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  config: {
    timeframe: string
    startDate: string
    endDate: string
    symbol: string
    initialCapital?: number
  }
  performance: {
    totalReturn: number
    sharpeRatio: number | null
    maxDrawdown: number
    winRate: number
    totalTrades: number
    profitableTrades: number
    losingTrades: number
    profitFactor?: number
    avgWin?: number
    avgLoss?: number
  } | null
  equityCurve: number[]
  createdAt: Date
  completedAt: Date | null
}

interface UseBacktestResultsOptions {
  strategyId?: string
  status?: BacktestResult['status'] | BacktestResult['status'][]
  limit?: number
}

interface UseBacktestResultsReturn {
  results: BacktestResult[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
  stats: {
    totalRuns: number
    avgReturn: number
    avgSharpe: number
    lastRunAt: Date | null
  }
}

// Demo backtest results
const DEMO_RESULTS: BacktestResult[] = [
  {
    id: 'demo-bt-1',
    strategyId: 'demo-1',
    strategyName: 'RSI + MACD Crossover',
    status: 'completed',
    config: { timeframe: '1D', startDate: '2023-01-01', endDate: '2024-01-01', symbol: 'SPY', initialCapital: 10000 },
    performance: { totalReturn: 23.5, sharpeRatio: 1.82, maxDrawdown: -12.3, winRate: 58.2, totalTrades: 127, profitableTrades: 74, losingTrades: 53, profitFactor: 1.65 },
    equityCurve: [100, 103, 101, 108, 112, 109, 115, 118, 114, 120, 123.5],
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
  },
  {
    id: 'demo-bt-2',
    strategyId: 'demo-2',
    strategyName: 'Bollinger Band Mean Reversion',
    status: 'completed',
    config: { timeframe: '1D', startDate: '2023-01-01', endDate: '2024-01-01', symbol: 'QQQ', initialCapital: 10000 },
    performance: { totalReturn: 18.2, sharpeRatio: 1.45, maxDrawdown: -15.7, winRate: 62.1, totalTrades: 89, profitableTrades: 55, losingTrades: 34, profitFactor: 1.42 },
    equityCurve: [100, 102, 99, 104, 106, 103, 108, 111, 108, 114, 118.2],
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
  },
  {
    id: 'demo-bt-3',
    strategyId: 'demo-3',
    strategyName: 'Momentum Strategy',
    status: 'completed',
    config: { timeframe: '4H', startDate: '2023-06-01', endDate: '2024-01-01', symbol: 'AAPL', initialCapital: 10000 },
    performance: { totalReturn: -5.3, sharpeRatio: 0.45, maxDrawdown: -22.1, winRate: 42.5, totalTrades: 67, profitableTrades: 28, losingTrades: 39, profitFactor: 0.78 },
    equityCurve: [100, 98, 95, 92, 96, 93, 90, 94, 91, 96, 94.7],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
  },
]

export function useBacktestResults(options: UseBacktestResultsOptions = {}): UseBacktestResultsReturn {
  const { strategyId, status, limit = 20 } = options

  const [results, setResults] = useState<BacktestResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchResults = useCallback(async () => {
    if (!isSupabaseConfigured) {
      let filtered = [...DEMO_RESULTS]
      if (strategyId) filtered = filtered.filter(r => r.strategyId === strategyId)
      if (status) {
        const statuses = Array.isArray(status) ? status : [status]
        filtered = filtered.filter(r => statuses.includes(r.status))
      }
      setResults(filtered.slice(0, limit))
      setIsLoading(false)
      return
    }

    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      setResults(DEMO_RESULTS)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setResults(DEMO_RESULTS)
        setIsLoading(false)
        return
      }

      // Fetch backtest jobs with strategy names
      let query = supabase
        .from('backtest_jobs')
        .select(`
          id,
          job_id,
          strategy_id,
          status,
          result,
          created_at,
          completed_at,
          timeframe,
          start_date,
          end_date,
          symbol,
          strategies(name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (strategyId) {
        query = query.eq('strategy_id', strategyId)
      }

      if (status) {
        const statuses = Array.isArray(status) ? status : [status]
        query = query.in('status', statuses)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      if (data && data.length > 0) {
        interface BacktestJobRow {
          id: string
          job_id: string
          strategy_id: string
          status: string
          result: Record<string, unknown> | null
          created_at: string
          completed_at: string | null
          timeframe: string
          start_date: string
          end_date: string
          symbol: string
          strategies: { name: string } | null
        }

        setResults((data as BacktestJobRow[]).map(row => {
          const result = row.result as {
            performance?: BacktestResult['performance']
            equity_curve?: number[]
          } | null

          return {
            id: row.id,
            strategyId: row.strategy_id,
            strategyName: row.strategies?.name || 'Unknown Strategy',
            status: row.status as BacktestResult['status'],
            config: {
              timeframe: row.timeframe,
              startDate: row.start_date,
              endDate: row.end_date,
              symbol: row.symbol,
            },
            performance: result?.performance || null,
            equityCurve: result?.equity_curve || [],
            createdAt: new Date(row.created_at),
            completedAt: row.completed_at ? new Date(row.completed_at) : null,
          }
        }))
      } else {
        setResults([])
      }
    } catch (err) {
      console.error('[useBacktestResults] Fetch error:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch backtest results'))
      setResults(DEMO_RESULTS)
    } finally {
      setIsLoading(false)
    }
  }, [strategyId, status, limit])

  // Calculate stats
  const completedResults = results.filter(r => r.status === 'completed' && r.performance)
  const stats = {
    totalRuns: results.length,
    avgReturn: completedResults.length > 0
      ? completedResults.reduce((sum, r) => sum + (r.performance?.totalReturn || 0), 0) / completedResults.length
      : 0,
    avgSharpe: completedResults.length > 0
      ? completedResults.reduce((sum, r) => sum + (r.performance?.sharpeRatio || 0), 0) / completedResults.length
      : 0,
    lastRunAt: results.length > 0 ? results[0].createdAt : null,
  }

  useEffect(() => {
    fetchResults()
  }, [fetchResults])

  return {
    results,
    isLoading,
    error,
    refetch: fetchResults,
    stats,
  }
}
