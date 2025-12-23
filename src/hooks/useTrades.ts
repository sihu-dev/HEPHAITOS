'use client'

// ============================================
// useTrades Hook
// Supabase 연동 거래 내역 조회
// ============================================

import { useState, useEffect, useCallback } from 'react'
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client'
import type { Trade as SupabaseTrade } from '@/lib/supabase/types'
import { safeLogger } from '@/lib/utils/safe-logger';

export interface Trade {
  id: string
  symbol: string
  name: string
  side: 'buy' | 'sell'
  quantity: number
  price: number
  total: number
  fee: number | null
  pnl: number | null
  pnlPercent: number | null
  status: 'pending' | 'filled' | 'partial' | 'cancelled' | 'rejected'
  strategyId: string | null
  strategyName: string | null
  exchangeId: string
  executedAt: Date | null
  createdAt: Date
}

interface UseTradesOptions {
  status?: Trade['status'] | Trade['status'][]
  side?: 'buy' | 'sell'
  symbol?: string
  limit?: number
  offset?: number
}

interface UseTradesReturn {
  trades: Trade[]
  isLoading: boolean
  error: Error | null
  totalCount: number
  refetch: () => Promise<void>
  summary: {
    totalTrades: number
    buyAmount: number
    sellAmount: number
    totalPnl: number
  }
}

// Demo trades for fallback
const DEMO_TRADES: Trade[] = [
  { id: '1', symbol: 'NVDA', name: 'NVIDIA', side: 'buy', quantity: 10, price: 875.32, total: 8753.20, fee: 8.75, pnl: 234.50, pnlPercent: 2.68, status: 'filled', strategyId: 'demo-1', strategyName: 'RSI Momentum', exchangeId: 'kis', executedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000) },
  { id: '2', symbol: 'AAPL', name: 'Apple', side: 'sell', quantity: 20, price: 178.50, total: 3570.00, fee: 3.57, pnl: 125.00, pnlPercent: 3.63, status: 'filled', strategyId: 'demo-2', strategyName: 'MACD Crossover', exchangeId: 'kis', executedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000) },
  { id: '3', symbol: 'TSLA', name: 'Tesla', side: 'buy', quantity: 15, price: 248.75, total: 3731.25, fee: 3.73, pnl: -89.50, pnlPercent: -2.4, status: 'filled', strategyId: null, strategyName: null, exchangeId: 'kis', executedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000) },
  { id: '4', symbol: 'MSFT', name: 'Microsoft', side: 'buy', quantity: 8, price: 410.20, total: 3281.60, fee: 3.28, pnl: 156.32, pnlPercent: 4.76, status: 'filled', strategyId: null, strategyName: null, exchangeId: 'kis', executedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  { id: '5', symbol: 'META', name: 'Meta', side: 'sell', quantity: 5, price: 520.00, total: 2600.00, fee: 2.60, pnl: 350.00, pnlPercent: 15.56, status: 'filled', strategyId: 'demo-1', strategyName: 'RSI Momentum', exchangeId: 'kis', executedAt: new Date(Date.now() - 25 * 60 * 60 * 1000), createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000) },
  { id: '6', symbol: 'GOOGL', name: 'Alphabet', side: 'buy', quantity: 25, price: 141.50, total: 3537.50, fee: 3.54, pnl: null, pnlPercent: null, status: 'partial', strategyId: null, strategyName: null, exchangeId: 'kis', executedAt: null, createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000) },
  { id: '7', symbol: 'AMZN', name: 'Amazon', side: 'buy', quantity: 12, price: 185.00, total: 2220.00, fee: 2.22, pnl: 78.00, pnlPercent: 3.51, status: 'filled', strategyId: 'demo-1', strategyName: 'RSI Momentum', exchangeId: 'kis', executedAt: new Date(Date.now() - 72 * 60 * 60 * 1000), createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000) },
  { id: '8', symbol: 'COIN', name: 'Coinbase', side: 'sell', quantity: 30, price: 180.25, total: 5407.50, fee: null, pnl: null, pnlPercent: null, status: 'cancelled', strategyId: null, strategyName: null, exchangeId: 'kis', executedAt: null, createdAt: new Date(Date.now() - 96 * 60 * 60 * 1000) },
]

// Stock name mapping (for symbols without name in DB)
const STOCK_NAMES: Record<string, string> = {
  'NVDA': 'NVIDIA',
  'AAPL': 'Apple',
  'TSLA': 'Tesla',
  'MSFT': 'Microsoft',
  'META': 'Meta',
  'GOOGL': 'Alphabet',
  'AMZN': 'Amazon',
  'COIN': 'Coinbase',
}

function transformSupabaseTrade(row: SupabaseTrade, strategyName?: string | null): Trade {
  return {
    id: row.id,
    symbol: row.symbol,
    name: STOCK_NAMES[row.symbol] || row.symbol,
    side: row.type,
    quantity: row.amount,
    price: row.price,
    total: row.total,
    fee: row.fee,
    pnl: row.pnl,
    pnlPercent: row.pnl_percent,
    status: row.status,
    strategyId: row.strategy_id,
    strategyName: strategyName || null,
    exchangeId: row.exchange_id,
    executedAt: row.executed_at ? new Date(row.executed_at) : null,
    createdAt: new Date(row.created_at),
  }
}

export function useTrades(options: UseTradesOptions = {}): UseTradesReturn {
  const { status, side, symbol, limit = 50, offset = 0 } = options

  const [trades, setTrades] = useState<Trade[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  const fetchTrades = useCallback(async () => {
    if (!isSupabaseConfigured) {
      // Demo mode fallback
      let filtered = [...DEMO_TRADES]
      if (status) {
        const statuses = Array.isArray(status) ? status : [status]
        filtered = filtered.filter(t => statuses.includes(t.status))
      }
      if (side) {
        filtered = filtered.filter(t => t.side === side)
      }
      if (symbol) {
        filtered = filtered.filter(t => t.symbol === symbol)
      }
      setTrades(filtered.slice(offset, offset + limit))
      setTotalCount(filtered.length)
      setIsLoading(false)
      return
    }

    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      setTrades(DEMO_TRADES)
      setTotalCount(DEMO_TRADES.length)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setTrades(DEMO_TRADES)
        setTotalCount(DEMO_TRADES.length)
        setIsLoading(false)
        return
      }

      // Build query
      let query = supabase
        .from('trades')
        .select('*, strategies(name)', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (status) {
        if (Array.isArray(status)) {
          query = query.in('status', status)
        } else {
          query = query.eq('status', status)
        }
      }
      if (side) {
        query = query.eq('type', side)
      }
      if (symbol) {
        query = query.eq('symbol', symbol)
      }

      const { data, error: fetchError, count } = await query

      if (fetchError) throw fetchError

      if (data && data.length > 0) {
        setTrades(data.map((row: SupabaseTrade & { strategies?: { name: string } | null }) =>
          transformSupabaseTrade(row, row.strategies?.name)
        ))
        setTotalCount(count || 0)
      } else {
        setTrades([])
        setTotalCount(0)
      }
    } catch (err) {
      safeLogger.error('[useTrades] Fetch error:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch trades'))
      setTrades(DEMO_TRADES)
      setTotalCount(DEMO_TRADES.length)
    } finally {
      setIsLoading(false)
    }
  }, [status, side, symbol, limit, offset])

  // Calculate summary
  const summary = {
    totalTrades: trades.length,
    buyAmount: trades.filter(t => t.side === 'buy' && t.status === 'filled').reduce((sum, t) => sum + t.total, 0),
    sellAmount: trades.filter(t => t.side === 'sell' && t.status === 'filled').reduce((sum, t) => sum + t.total, 0),
    totalPnl: trades.filter(t => t.pnl !== null).reduce((sum, t) => sum + (t.pnl || 0), 0),
  }

  // Initial fetch
  useEffect(() => {
    fetchTrades()
  }, [fetchTrades])

  return {
    trades,
    isLoading,
    error,
    totalCount,
    refetch: fetchTrades,
    summary,
  }
}
