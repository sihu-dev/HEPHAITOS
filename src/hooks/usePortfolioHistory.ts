'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { safeLogger } from '@/lib/utils/safe-logger';

// ============================================
// Types
// ============================================

export interface PortfolioHistoryPoint {
  date: string
  value: number
  profit?: number
  profitPercent?: number
}

export interface Transaction {
  id: string
  type: 'buy' | 'sell'
  symbol: string
  quantity: number
  price: number
  date: Date
  total?: number
}

// ============================================
// Demo Data
// ============================================

const generateDemoHistory = (days: number): PortfolioHistoryPoint[] => {
  return Array.from({ length: days }, (_, i) => ({
    date: new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    }),
    value: 100000 + Math.random() * 40000 + i * 1000,
  }))
}

const DEMO_TRANSACTIONS: Transaction[] = [
  { id: '1', type: 'buy', symbol: 'BTC', quantity: 0.1, price: 95000, date: new Date(Date.now() - 2 * 60 * 60 * 1000), total: 9500 },
  { id: '2', type: 'sell', symbol: 'ETH', quantity: 1, price: 3800, date: new Date(Date.now() - 24 * 60 * 60 * 1000), total: 3800 },
  { id: '3', type: 'buy', symbol: 'SOL', quantity: 20, price: 220, date: new Date(Date.now() - 48 * 60 * 60 * 1000), total: 4400 },
]

// ============================================
// Hook
// ============================================

interface UsePortfolioHistoryOptions {
  days?: number
  broker?: string
}

interface UsePortfolioHistoryReturn {
  history: PortfolioHistoryPoint[]
  transactions: Transaction[]
  isLoading: boolean
  error: Error | null
  refresh: () => Promise<void>
}

export function usePortfolioHistory(options: UsePortfolioHistoryOptions = {}): UsePortfolioHistoryReturn {
  const { days = 30, broker } = options
  const [history, setHistory] = useState<PortfolioHistoryPoint[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchHistory = useCallback(async () => {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setHistory(generateDemoHistory(days))
      setTransactions(DEMO_TRANSACTIONS)
      setIsLoading(false)
      return
    }

    const supabase = createClient()
    if (!supabase) {
      setHistory(generateDemoHistory(days))
      setTransactions(DEMO_TRANSACTIONS)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setHistory(generateDemoHistory(days))
        setTransactions(DEMO_TRANSACTIONS)
        setIsLoading(false)
        return
      }

      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      // Fetch portfolio history using the calculate_portfolio_performance function
      const { data: performanceData, error: perfError } = await supabase
        .rpc('calculate_portfolio_performance' as never, {
          p_user_id: user.id,
          p_start_date: startDate.toISOString().split('T')[0],
          p_end_date: new Date().toISOString().split('T')[0],
        } as never)

      if (perfError) {
        safeLogger.warn('[usePortfolioHistory] RPC error, trying direct query:', perfError)

        // Fallback to direct query
        const baseQuery = supabase
          .from('portfolio_snapshots' as never)
          .select('snapshot_date, total_assets, profit_loss, profit_loss_rate')
          .eq('user_id', user.id)
          .gte('snapshot_date', startDate.toISOString().split('T')[0])
          .order('snapshot_date', { ascending: true })

        const { data: snapshots, error: snapshotError } = broker
          ? await baseQuery.eq('broker', broker)
          : await baseQuery

        if (snapshotError) {
          throw snapshotError
        }

        interface SnapshotRow {
          snapshot_date: string
          total_assets: number
          profit_loss: number
          profit_loss_rate: number
        }

        const snapshotList = snapshots as SnapshotRow[] | null

        if (snapshotList && snapshotList.length > 0) {
          const historyData: PortfolioHistoryPoint[] = snapshotList.map((s) => ({
            date: new Date(s.snapshot_date).toLocaleDateString('ko-KR', {
              month: 'short',
              day: 'numeric',
            }),
            value: Number(s.total_assets) || 0,
            profit: Number(s.profit_loss) || 0,
            profitPercent: Number(s.profit_loss_rate) || 0,
          }))
          setHistory(historyData)
        } else {
          setHistory(generateDemoHistory(days))
        }
      } else {
        interface PerformanceRow {
          snapshot_date: string
          total_assets: number
          profit_loss: number
          profit_loss_rate: number
        }

        const perfList = performanceData as PerformanceRow[] | null

        if (perfList && Array.isArray(perfList) && perfList.length > 0) {
          const historyData: PortfolioHistoryPoint[] = perfList.map((p) => ({
            date: new Date(p.snapshot_date).toLocaleDateString('ko-KR', {
              month: 'short',
              day: 'numeric',
            }),
            value: Number(p.total_assets) || 0,
            profit: Number(p.profit_loss) || 0,
            profitPercent: Number(p.profit_loss_rate) || 0,
          }))
          setHistory(historyData)
        } else {
          setHistory(generateDemoHistory(days))
        }
      }

      // Fetch recent transactions from order_logs
      const { data: orderData, error: orderError } = await supabase
        .from('order_logs' as never)
        .select('id, side, symbol, quantity, filled_price, created_at')
        .eq('user_id', user.id)
        .eq('status', 'filled')
        .order('created_at', { ascending: false })
        .limit(10)

      interface OrderRow {
        id: string
        side: string
        symbol: string
        quantity: number
        filled_price: number | null
        created_at: string
      }

      const orderList = orderData as OrderRow[] | null

      if (orderError) {
        safeLogger.warn('[usePortfolioHistory] Order fetch error:', orderError)
        setTransactions(DEMO_TRANSACTIONS)
      } else if (orderList && orderList.length > 0) {
        const txData: Transaction[] = orderList.map((o) => ({
          id: o.id,
          type: o.side === 'buy' ? 'buy' : 'sell',
          symbol: o.symbol,
          quantity: o.quantity,
          price: Number(o.filled_price) || 0,
          date: new Date(o.created_at),
          total: (o.quantity * (Number(o.filled_price) || 0)),
        }))
        setTransactions(txData)
      } else {
        setTransactions(DEMO_TRANSACTIONS)
      }
    } catch (err) {
      safeLogger.error('[usePortfolioHistory] Error:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch portfolio history'))
      setHistory(generateDemoHistory(days))
      setTransactions(DEMO_TRANSACTIONS)
    } finally {
      setIsLoading(false)
    }
  }, [days, broker])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  return {
    history,
    transactions,
    isLoading,
    error,
    refresh: fetchHistory,
  }
}
