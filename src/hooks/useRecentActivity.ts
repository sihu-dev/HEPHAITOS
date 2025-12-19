'use client'

// ============================================
// useRecentActivity Hook
// 최근 활동 통합 조회 (거래, 알림, 백테스트 등)
// ============================================

import { useState, useEffect, useCallback } from 'react'
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client'

export type ActivityType = 'trade' | 'backtest' | 'strategy' | 'notification' | 'system'

export interface Activity {
  id: string
  type: ActivityType
  title: string
  description: string
  timestamp: Date
  metadata: Record<string, unknown>
  icon?: string
  color?: 'green' | 'red' | 'blue' | 'yellow' | 'gray'
}

interface UseRecentActivityReturn {
  activities: Activity[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

// Demo activities
const DEMO_ACTIVITIES: Activity[] = [
  {
    id: 'act-1',
    type: 'trade',
    title: 'NVDA 매수 체결',
    description: '10주 @ $875.32',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    metadata: { symbol: 'NVDA', side: 'buy', quantity: 10, price: 875.32 },
    color: 'green',
  },
  {
    id: 'act-2',
    type: 'backtest',
    title: '백테스트 완료',
    description: 'RSI Momentum: +23.5%',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    metadata: { strategyName: 'RSI Momentum', totalReturn: 23.5 },
    color: 'blue',
  },
  {
    id: 'act-3',
    type: 'trade',
    title: 'AAPL 매도 체결',
    description: '20주 @ $178.50',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
    metadata: { symbol: 'AAPL', side: 'sell', quantity: 20, price: 178.50 },
    color: 'red',
  },
  {
    id: 'act-4',
    type: 'strategy',
    title: '전략 생성',
    description: 'MACD Crossover 전략',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    metadata: { strategyName: 'MACD Crossover' },
    color: 'blue',
  },
  {
    id: 'act-5',
    type: 'notification',
    title: 'RSI 신호 발생',
    description: 'TSLA 과매수 구간 진입',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    metadata: { symbol: 'TSLA', indicator: 'RSI', value: 72 },
    color: 'yellow',
  },
]

export function useRecentActivity(limit: number = 10): UseRecentActivityReturn {
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchActivities = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setActivities(DEMO_ACTIVITIES.slice(0, limit))
      setIsLoading(false)
      return
    }

    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      setActivities(DEMO_ACTIVITIES.slice(0, limit))
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setActivities(DEMO_ACTIVITIES.slice(0, limit))
        setIsLoading(false)
        return
      }

      // Fetch recent trades, notifications, and backtest jobs in parallel
      const [tradesResult, notificationsResult, backtestsResult] = await Promise.all([
        supabase
          .from('trades')
          .select('id, symbol, type, amount, price, total, created_at, status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(limit),
        supabase
          .from('notifications')
          .select('id, type, title, message, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(limit),
        supabase
          .from('backtest_jobs')
          .select('id, status, result, created_at, completed_at, strategies(name)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(limit),
      ])

      const allActivities: Activity[] = []

      // Process trades
      interface TradeRow {
        id: string
        symbol: string
        type: 'buy' | 'sell'
        amount: number
        price: number
        total: number
        created_at: string
        status: string
      }

      if (tradesResult.data) {
        (tradesResult.data as TradeRow[]).forEach(trade => {
          allActivities.push({
            id: `trade-${trade.id}`,
            type: 'trade',
            title: `${trade.symbol} ${trade.type === 'buy' ? '매수' : '매도'} ${trade.status === 'filled' ? '체결' : '대기'}`,
            description: `${trade.amount}주 @ $${trade.price.toFixed(2)}`,
            timestamp: new Date(trade.created_at),
            metadata: { symbol: trade.symbol, side: trade.type, quantity: trade.amount, price: trade.price },
            color: trade.type === 'buy' ? 'green' : 'red',
          })
        })
      }

      // Process notifications
      interface NotificationRow {
        id: string
        type: string
        title: string
        message: string
        created_at: string
      }

      if (notificationsResult.data) {
        (notificationsResult.data as NotificationRow[]).forEach(notif => {
          allActivities.push({
            id: `notif-${notif.id}`,
            type: 'notification',
            title: notif.title,
            description: notif.message,
            timestamp: new Date(notif.created_at),
            metadata: { notificationType: notif.type },
            color: notif.type === 'alert' ? 'yellow' : 'gray',
          })
        })
      }

      // Process backtests
      interface BacktestRow {
        id: string
        status: string
        result: { performance?: { totalReturn?: number } } | null
        created_at: string
        completed_at: string | null
        strategies: { name: string } | null
      }

      if (backtestsResult.data) {
        (backtestsResult.data as BacktestRow[]).forEach(bt => {
          const totalReturn = bt.result?.performance?.totalReturn
          allActivities.push({
            id: `bt-${bt.id}`,
            type: 'backtest',
            title: `백테스트 ${bt.status === 'completed' ? '완료' : bt.status === 'processing' ? '진행 중' : '대기'}`,
            description: `${bt.strategies?.name || 'Unknown'}${totalReturn !== undefined ? `: ${totalReturn > 0 ? '+' : ''}${totalReturn.toFixed(1)}%` : ''}`,
            timestamp: new Date(bt.completed_at || bt.created_at),
            metadata: { strategyName: bt.strategies?.name, totalReturn },
            color: bt.status === 'completed' ? (totalReturn && totalReturn > 0 ? 'green' : 'red') : 'blue',
          })
        })
      }

      // Sort by timestamp and limit
      allActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      setActivities(allActivities.slice(0, limit))
    } catch (err) {
      console.error('[useRecentActivity] Fetch error:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch activities'))
      setActivities(DEMO_ACTIVITIES.slice(0, limit))
    } finally {
      setIsLoading(false)
    }
  }, [limit])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  return {
    activities,
    isLoading,
    error,
    refetch: fetchActivities,
  }
}
