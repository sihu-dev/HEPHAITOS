'use client'

import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface Strategy {
  id: string
  name: string
  status: 'running' | 'paused'
  pnl: number
  trades: number
  winRate: number
  riskLevel: 'low' | 'medium' | 'high'
}

interface StrategyUpdate {
  id: string
  pnl?: number
  trades?: number
  winRate?: number
  status?: 'running' | 'paused'
}

export function useRealtimeStrategies(initialStrategies: Strategy[]) {
  const [strategies, setStrategies] = useState<Strategy[]>(initialStrategies)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return

    // Subscribe to strategy_performance channel
    const strategyChannel = supabase
      .channel('strategy_performance')
      .on('broadcast', { event: 'strategy_update' }, (payload) => {
        const update = payload.payload as StrategyUpdate

        setStrategies((prev) =>
          prev.map((strategy) =>
            strategy.id === update.id
              ? {
                  ...strategy,
                  pnl: update.pnl ?? strategy.pnl,
                  trades: update.trades ?? strategy.trades,
                  winRate: update.winRate ?? strategy.winRate,
                  status: update.status ?? strategy.status,
                }
              : strategy
          )
        )
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
          console.log('[Realtime] Connected to strategy_performance channel')
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setIsConnected(false)
          console.error('[Realtime] Channel error or timeout')
        }
      })

    setChannel(strategyChannel)

    // Cleanup
    return () => {
      strategyChannel.unsubscribe()
      setIsConnected(false)
    }
  }, [])

  return { strategies, isConnected, channel }
}
