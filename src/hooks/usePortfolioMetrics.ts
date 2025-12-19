'use client'

// ============================================
// usePortfolioMetrics Hook
// Supabase 연동 포트폴리오 지표 조회
// ============================================

import { useState, useEffect, useCallback } from 'react'
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client'

export interface PortfolioMetrics {
  // Portfolio value
  totalValue: number
  todayPnl: number
  todayPnlPercent: number

  // Performance metrics
  totalReturn: number
  totalReturnPercent: number
  winRate: number
  sharpeRatio: number
  maxDrawdown: number

  // Trade stats
  totalTrades: number
  winningTrades: number
  losingTrades: number
  avgWin: number
  avgLoss: number

  // Comparison
  vsYesterday: number
  vsLastWeek: number
  vsLastMonth: number
}

interface UsePortfolioMetricsReturn {
  metrics: PortfolioMetrics
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

// Demo metrics for fallback
const DEMO_METRICS: PortfolioMetrics = {
  totalValue: 12345.67,
  todayPnl: 567.89,
  todayPnlPercent: 4.82,

  totalReturn: 2345.67,
  totalReturnPercent: 23.46,
  winRate: 68,
  sharpeRatio: 1.85,
  maxDrawdown: -8.2,

  totalTrades: 127,
  winningTrades: 86,
  losingTrades: 41,
  avgWin: 45.67,
  avgLoss: -23.45,

  vsYesterday: 4.82,
  vsLastWeek: 5.0,
  vsLastMonth: -2.0,
}

export function usePortfolioMetrics(): UsePortfolioMetricsReturn {
  const [metrics, setMetrics] = useState<PortfolioMetrics>(DEMO_METRICS)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchMetrics = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setMetrics(DEMO_METRICS)
      setIsLoading(false)
      return
    }

    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      setMetrics(DEMO_METRICS)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setMetrics(DEMO_METRICS)
        setIsLoading(false)
        return
      }

      // Try RPC function first, fallback to manual calculation
      try {
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('get_portfolio_metrics', { p_user_id: user.id } as never)

        if (!rpcError && rpcData) {
          const data = rpcData as Record<string, unknown>
          setMetrics({
            totalValue: (data.total_value as number) || 0,
            todayPnl: (data.today_pnl as number) || 0,
            todayPnlPercent: (data.today_pnl_percent as number) || 0,

            totalReturn: (data.total_pnl as number) || 0,
            totalReturnPercent: (data.avg_pnl_percent as number) || 0,
            winRate: (data.win_rate as number) || 0,
            sharpeRatio: (data.sharpe_ratio as number) || 0,
            maxDrawdown: (data.worst_trade as number) || 0,

            totalTrades: (data.total_trades as number) || 0,
            winningTrades: (data.winning_trades as number) || 0,
            losingTrades: (data.losing_trades as number) || 0,
            avgWin: (data.best_trade as number) || 0,
            avgLoss: (data.worst_trade as number) || 0,

            vsYesterday: (data.vs_yesterday as number) || 0,
            vsLastWeek: (data.vs_last_week as number) || 0,
            vsLastMonth: (data.vs_last_month as number) || 0,
          })
          setIsLoading(false)
          return
        }
      } catch {
        // RPC not available, fall through to manual calculation
      }

      // Fallback: calculate from trades table
      await fetchMetricsManually(supabase, user.id)
    } catch (err) {
      console.error('[usePortfolioMetrics] Fetch error:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch portfolio metrics'))
      setMetrics(DEMO_METRICS)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Manual calculation fallback
  const fetchMetricsManually = async (supabase: NonNullable<ReturnType<typeof getSupabaseBrowserClient>>, userId: string) => {
    interface TradeRow {
      pnl: number | null
      pnl_percent: number | null
      total: number
      type: string
      created_at: string
    }

    try {
      // Fetch all filled trades
      const { data, error: tradesError } = await supabase
        .from('trades')
        .select('pnl, pnl_percent, total, type, created_at')
        .eq('user_id', userId)
        .eq('status', 'filled')
        .order('created_at', { ascending: false })
        .limit(500)

      if (tradesError) throw tradesError

      const trades = (data || []) as TradeRow[]

      if (trades.length === 0) {
        setMetrics({
          ...DEMO_METRICS,
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          totalReturn: 0,
          totalReturnPercent: 0,
        })
        return
      }

      const winningTrades = trades.filter(t => (t.pnl || 0) > 0)
      const losingTrades = trades.filter(t => (t.pnl || 0) < 0)
      const totalPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0)

      // Calculate today's P&L
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayTrades = trades.filter(t => new Date(t.created_at) >= today)
      const todayPnl = todayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0)

      // Calculate total value (simplified - sum of all trades)
      const totalValue = trades.reduce((sum, t) => sum + t.total, 0)

      setMetrics({
        totalValue,
        todayPnl,
        todayPnlPercent: totalValue > 0 ? (todayPnl / totalValue) * 100 : 0,

        totalReturn: totalPnl,
        totalReturnPercent: trades.length > 0
          ? trades.reduce((sum, t) => sum + (t.pnl_percent || 0), 0) / trades.length
          : 0,
        winRate: trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0,
        sharpeRatio: calculateSharpeRatio(trades.map(t => t.pnl_percent || 0)),
        maxDrawdown: Math.min(...trades.map(t => t.pnl_percent || 0), 0),

        totalTrades: trades.length,
        winningTrades: winningTrades.length,
        losingTrades: losingTrades.length,
        avgWin: winningTrades.length > 0
          ? winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / winningTrades.length
          : 0,
        avgLoss: losingTrades.length > 0
          ? losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / losingTrades.length
          : 0,

        vsYesterday: todayPnl > 0 ? ((todayPnl / totalValue) * 100) : 0,
        vsLastWeek: 0, // Would need more complex calculation
        vsLastMonth: 0,
      })
    } catch (err) {
      console.error('[usePortfolioMetrics] Manual calculation error:', err)
      setMetrics(DEMO_METRICS)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  return {
    metrics,
    isLoading,
    error,
    refetch: fetchMetrics,
  }
}

// Helper: Calculate Sharpe Ratio
function calculateSharpeRatio(returns: number[], riskFreeRate: number = 0): number {
  if (returns.length < 2) return 0

  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length
  const stdDev = Math.sqrt(
    returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
  )

  if (stdDev === 0) return 0
  return (avgReturn - riskFreeRate) / stdDev
}
