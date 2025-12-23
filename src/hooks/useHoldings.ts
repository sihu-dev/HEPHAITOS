'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

// ============================================
// Types
// ============================================

type PortfolioSnapshot = Database['public']['Tables']['portfolio_snapshots']['Row']

export interface HoldingItem {
  symbol: string
  name: string
  quantity: number
  avgPrice: number
  currentPrice: number
  value: number
  profit: number
  profitPercent: number
  weight: number
  sector: string
  color: string
}

export interface PortfolioStats {
  totalValue: number
  totalProfit: number
  totalProfitPercent: number
  todayProfit: number
  todayProfitPercent: number
  cash: number
  invested: number
  sharpeRatio: number
  volatility: number
  beta: number
}

interface HoldingJson {
  symbol?: string
  name?: string
  stock_name?: string
  quantity?: number
  avg_price?: number
  current_price?: number
  purchase_amount?: number
  evaluation_amount?: number
  profit_loss?: number
  profit_loss_rate?: number
  sector?: string
}

// ============================================
// Demo Data
// ============================================

import { CHART_COLORS } from '@/constants/design-tokens'
import { safeLogger } from '@/lib/utils/safe-logger';

const COLORS = CHART_COLORS.palette

const DEMO_HOLDINGS: HoldingItem[] = [
  { symbol: 'BTC', name: 'Bitcoin', quantity: 0.5, avgPrice: 42000, currentPrice: 97000, value: 48500, profit: 27500, profitPercent: 130.95, weight: 35.2, sector: 'Crypto', color: COLORS[0] },
  { symbol: 'ETH', name: 'Ethereum', quantity: 5, avgPrice: 2200, currentPrice: 3850, value: 19250, profit: 8250, profitPercent: 75.00, weight: 14.0, sector: 'Crypto', color: COLORS[1] },
  { symbol: 'AAPL', name: 'Apple Inc.', quantity: 50, avgPrice: 165, currentPrice: 178, value: 8900, profit: 650, profitPercent: 7.88, weight: 6.5, sector: 'Tech', color: COLORS[2] },
  { symbol: 'MSFT', name: 'Microsoft', quantity: 20, avgPrice: 380, currentPrice: 410, value: 8200, profit: 600, profitPercent: 7.89, weight: 6.0, sector: 'Tech', color: COLORS[3] },
  { symbol: 'SOL', name: 'Solana', quantity: 100, avgPrice: 80, currentPrice: 225, value: 22500, profit: 14500, profitPercent: 181.25, weight: 16.3, sector: 'Crypto', color: COLORS[4] },
  { symbol: 'NVDA', name: 'NVIDIA', quantity: 15, avgPrice: 450, currentPrice: 520, value: 7800, profit: 1050, profitPercent: 15.56, weight: 5.7, sector: 'Tech', color: COLORS[5] },
]

const DEMO_STATS: PortfolioStats = {
  totalValue: 137850,
  totalProfit: 52550,
  totalProfitPercent: 61.62,
  todayProfit: 4250,
  todayProfitPercent: 3.18,
  cash: 22150,
  invested: 115700,
  sharpeRatio: 2.34,
  volatility: 18.5,
  beta: 1.15,
}

// ============================================
// Hook
// ============================================

interface UseHoldingsOptions {
  broker?: string
}

interface UseHoldingsReturn {
  holdings: HoldingItem[]
  stats: PortfolioStats
  isLoading: boolean
  error: Error | null
  refresh: () => Promise<void>
}

export function useHoldings(options: UseHoldingsOptions = {}): UseHoldingsReturn {
  const { broker } = options
  const [holdings, setHoldings] = useState<HoldingItem[]>([])
  const [snapshot, setSnapshot] = useState<PortfolioSnapshot | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Transform DB holding to display format
  const transformHolding = useCallback((
    item: HoldingJson,
    index: number,
    totalValue: number
  ): HoldingItem => {
    const quantity = item.quantity ?? 0
    const avgPrice = item.avg_price ?? 0
    const currentPrice = item.current_price ?? avgPrice
    const value = item.evaluation_amount ?? (quantity * currentPrice)
    const cost = item.purchase_amount ?? (quantity * avgPrice)
    const profit = item.profit_loss ?? (value - cost)
    const profitPercent = item.profit_loss_rate ?? (cost > 0 ? ((value - cost) / cost) * 100 : 0)
    const weight = totalValue > 0 ? (value / totalValue) * 100 : 0

    return {
      symbol: item.symbol ?? `UNKNOWN-${index}`,
      name: item.name ?? item.stock_name ?? item.symbol ?? 'Unknown',
      quantity,
      avgPrice,
      currentPrice,
      value,
      profit,
      profitPercent,
      weight,
      sector: item.sector ?? 'Other',
      color: COLORS[index % COLORS.length],
    }
  }, [])

  // Fetch holdings from Supabase
  const fetchHoldings = useCallback(async () => {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      // Use demo data
      setHoldings(DEMO_HOLDINGS)
      setIsLoading(false)
      return
    }

    const supabase = createClient()
    if (!supabase) {
      setHoldings(DEMO_HOLDINGS)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // Use demo data for non-authenticated users
        setHoldings(DEMO_HOLDINGS)
        setIsLoading(false)
        return
      }

      // Fetch latest portfolio snapshot
      let query = supabase
        .from('portfolio_snapshots')
        .select('*')
        .eq('user_id', user.id)
        .order('snapshot_date', { ascending: false })
        .limit(1)

      if (broker) {
        query = query.eq('broker', broker)
      }

      const { data: snapshots, error: fetchError } = await query

      if (fetchError) {
        throw fetchError
      }

      if (!snapshots || snapshots.length === 0) {
        // No data, use demo
        setHoldings(DEMO_HOLDINGS)
        setIsLoading(false)
        return
      }

      const latestSnapshot = snapshots[0] as unknown as PortfolioSnapshot
      setSnapshot(latestSnapshot)

      // Parse holdings JSON
      const holdingsJson = latestSnapshot.holdings as HoldingJson[] | null
      if (!holdingsJson || !Array.isArray(holdingsJson) || holdingsJson.length === 0) {
        setHoldings([])
        setIsLoading(false)
        return
      }

      // Calculate total value for weight calculation
      const totalValue = Number(latestSnapshot.total_evaluation) || 0

      // Transform to display format
      const transformedHoldings = holdingsJson.map((item, index) =>
        transformHolding(item, index, totalValue)
      )

      setHoldings(transformedHoldings)
    } catch (err) {
      safeLogger.error('[useHoldings] Error:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch holdings'))
      // Fallback to demo data on error
      setHoldings(DEMO_HOLDINGS)
    } finally {
      setIsLoading(false)
    }
  }, [broker, transformHolding])

  // Calculate stats from snapshot
  const stats = useMemo<PortfolioStats>(() => {
    if (!snapshot) {
      return DEMO_STATS
    }

    const totalValue = Number(snapshot.total_evaluation) || 0
    const totalCost = Number(snapshot.total_purchase) || 0
    const totalProfit = Number(snapshot.profit_loss) || 0
    const totalProfitPercent = Number(snapshot.profit_loss_rate) || 0
    const cash = Number(snapshot.available_cash) || 0

    return {
      totalValue: totalValue + cash,
      totalProfit,
      totalProfitPercent,
      todayProfit: 0, // Would need daily comparison
      todayProfitPercent: 0,
      cash,
      invested: totalCost,
      sharpeRatio: 0, // Would need historical data
      volatility: 0,
      beta: 0,
    }
  }, [snapshot])

  // Initial fetch
  useEffect(() => {
    fetchHoldings()
  }, [fetchHoldings])

  return {
    holdings,
    stats,
    isLoading,
    error,
    refresh: fetchHoldings,
  }
}
