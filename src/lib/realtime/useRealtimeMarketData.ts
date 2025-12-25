'use client'

import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { safeLogger } from '@/lib/utils/safe-logger';

interface MarketData {
  symbol: string
  name: string
  price: number
  change: number
  icon?: string
}

interface MarketUpdate {
  symbol: string
  price: number
  change: number
}

export function useRealtimeMarketData(initialMarkets: MarketData[]) {
  const [markets, setMarkets] = useState<MarketData[]>(initialMarkets)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return

    // Subscribe to market_data channel
    const marketChannel = supabase
      .channel('market_data')
      .on('broadcast', { event: 'price_update' }, (payload) => {
        const update = payload.payload as MarketUpdate

        setMarkets((prev) =>
          prev.map((market) =>
            market.symbol === update.symbol
              ? {
                  ...market,
                  price: update.price,
                  change: update.change,
                }
              : market
          )
        )
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
          safeLogger.info('[Realtime] Connected to market_data channel')
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setIsConnected(false)
          safeLogger.error('[Realtime] Channel error or timeout')
        }
      })

    setChannel(marketChannel)

    // Cleanup
    return () => {
      marketChannel.unsubscribe()
      setIsConnected(false)
    }
  }, [])

  return { markets, isConnected, channel }
}
