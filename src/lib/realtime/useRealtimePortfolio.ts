'use client'

import { useEffect, useState, useCallback } from 'react'
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { safeLogger } from '@/lib/utils/safe-logger';

// ============================================
// Portfolio Realtime Hook
// Supabase Realtime for portfolio updates
// ============================================

interface PortfolioData {
  totalValue: number
  change: number
  changePercent: number
  sparklineData: number[]
  lastUpdated: Date
}

interface PortfolioUpdate {
  totalValue?: number
  change?: number
  changePercent?: number
}

// Demo portfolio data for fallback
const DEMO_PORTFOLIO: PortfolioData = {
  totalValue: 12345.67,
  change: 567.89,
  changePercent: 4.82,
  sparklineData: [100, 102, 98, 105, 110, 108, 115, 120, 118, 125, 130, 128, 135, 140, 138],
  lastUpdated: new Date(),
}

export function useRealtimePortfolio(userId?: string) {
  const [portfolio, setPortfolio] = useState<PortfolioData>(DEMO_PORTFOLIO)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Fetch initial portfolio data
  const fetchPortfolio = useCallback(async () => {
    if (!isSupabaseConfigured || !userId) {
      setIsLoading(false)
      return
    }

    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      setIsLoading(false)
      return
    }

    try {
      // Fetch portfolio from simulation_accounts or real accounts
      const { data, error: fetchError } = await supabase
        .from('simulation_accounts')
        .select('balance, initial_balance, created_at')
        .eq('user_id', userId)
        .single<{ balance: number; initial_balance: number; created_at: string }>()

      if (fetchError) throw fetchError

      if (data) {
        const change = data.balance - data.initial_balance
        const changePercent = (change / data.initial_balance) * 100

        setPortfolio(prev => ({
          ...prev,
          totalValue: data.balance,
          change,
          changePercent,
          lastUpdated: new Date(),
        }))
      }
    } catch (err) {
      safeLogger.error('[useRealtimePortfolio] Fetch error:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch portfolio'))
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  // Subscribe to realtime updates
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false)

      // Demo mode: simulate updates
      const interval = setInterval(() => {
        setPortfolio(prev => {
          const randomChange = (Math.random() - 0.45) * 50
          const newValue = prev.totalValue + randomChange
          const newSparkline = [...prev.sparklineData.slice(1), newValue / 100]

          return {
            ...prev,
            totalValue: newValue,
            change: prev.change + randomChange,
            changePercent: ((prev.change + randomChange) / (newValue - prev.change - randomChange)) * 100,
            sparklineData: newSparkline,
            lastUpdated: new Date(),
          }
        })
      }, 10000) // Update every 10 seconds in demo mode

      return () => clearInterval(interval)
    }

    const supabase = getSupabaseBrowserClient()
    if (!supabase) return

    // Initial fetch
    fetchPortfolio()

    // Subscribe to portfolio updates
    const channel = supabase
      .channel(`portfolio:${userId || 'demo'}`)
      .on('broadcast', { event: 'portfolio_update' }, (payload) => {
        const update = payload.payload as PortfolioUpdate

        setPortfolio(prev => ({
          ...prev,
          totalValue: update.totalValue ?? prev.totalValue,
          change: update.change ?? prev.change,
          changePercent: update.changePercent ?? prev.changePercent,
          lastUpdated: new Date(),
        }))
      })
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'simulation_accounts',
          filter: userId ? `user_id=eq.${userId}` : undefined,
        },
        (payload) => {
          const newData = payload.new as { balance: number; initial_balance: number }
          const change = newData.balance - newData.initial_balance
          const changePercent = (change / newData.initial_balance) * 100

          setPortfolio(prev => ({
            ...prev,
            totalValue: newData.balance,
            change,
            changePercent,
            sparklineData: [...prev.sparklineData.slice(1), newData.balance / 100],
            lastUpdated: new Date(),
          }))
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
          safeLogger.info('[Realtime] Connected to portfolio channel')
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setIsConnected(false)
          safeLogger.error('[Realtime] Portfolio channel error')
        }
      })

    return () => {
      channel.unsubscribe()
      setIsConnected(false)
    }
  }, [userId, fetchPortfolio])

  // Manual refresh
  const refresh = useCallback(() => {
    fetchPortfolio()
  }, [fetchPortfolio])

  return {
    portfolio,
    isConnected,
    isLoading,
    error,
    refresh,
  }
}
