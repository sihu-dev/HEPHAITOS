'use client'

import { memo, useState, useEffect, useRef, useMemo } from 'react'
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline'
import { useI18n } from '@/i18n/client'
import { clsx } from 'clsx'
import { LiveIndicator } from '@/components/ui/LiveIndicator'
import { PriceDisplay } from '@/components/ui/PriceDisplay'
import { useTickerStream } from '@/hooks/use-websocket'

interface MarketData {
  symbol: string
  name: string
  price: number
  change: number
  icon?: string
}

// Binance trading pair symbols
const MARKET_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT']

const MARKET_NAMES: Record<string, { name: string; displaySymbol: string }> = {
  BTCUSDT: { name: 'Bitcoin', displaySymbol: 'BTC' },
  ETHUSDT: { name: 'Ethereum', displaySymbol: 'ETH' },
  SOLUSDT: { name: 'Solana', displaySymbol: 'SOL' },
  XRPUSDT: { name: 'Ripple', displaySymbol: 'XRP' },
}

const initialMarkets: MarketData[] = [
  { symbol: 'BTC', name: 'Bitcoin', price: 97245.50, change: 2.34 },
  { symbol: 'ETH', name: 'Ethereum', price: 3842.20, change: -0.82 },
  { symbol: 'SOL', name: 'Solana', price: 224.85, change: 5.67 },
  { symbol: 'XRP', name: 'Ripple', price: 2.34, change: 1.23 },
]

const MarketRow = memo(function MarketRow({
  market,
  index
}: {
  market: MarketData
  index: number
}) {
  const isPositive = market.change >= 0
  const [flash, setFlash] = useState<'up' | 'down' | null>(null)

  return (
    <div
      className={clsx(
        'flex items-center justify-between py-3 px-2 -mx-2 rounded-lg',
        'transition-all duration-300',
        'hover:bg-white/[0.02]',
        flash === 'up' && 'bg-emerald-500/10',
        flash === 'down' && 'bg-red-500/10',
        'animate-fade-in'
      )}
      style={{ animationDelay: `${index * 50}ms` }}
      role="article"
      aria-label={`${market.name} price ${market.price}`}
    >
      {/* Symbol & Name */}
      <div className="flex items-center gap-3">
        <div
          className={clsx(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            'bg-white/[0.06] text-xs font-bold text-white'
          )}
          aria-hidden="true"
        >
          {market.symbol.slice(0, 2)}
        </div>
        <div>
          <span className="text-sm font-medium text-white block">{market.symbol}</span>
          <span className="text-xs text-zinc-500">{market.name}</span>
        </div>
      </div>

      {/* Price & Change */}
      <div className="text-right">
        <PriceDisplay
          price={market.price}
          changePercent={market.change}
          size="sm"
          showChange={false}
        />
        <div className={clsx(
          'flex items-center justify-end gap-1 mt-0.5',
          'text-xs font-medium',
          isPositive ? 'text-emerald-400' : 'text-red-400'
        )}>
          {isPositive ? (
            <ArrowTrendingUpIcon className="w-3 h-3" aria-hidden="true" />
          ) : (
            <ArrowTrendingDownIcon className="w-3 h-3" aria-hidden="true" />
          )}
          <span className="tabular-nums" aria-label={`${isPositive ? 'up' : 'down'} ${Math.abs(market.change).toFixed(2)} percent`}>
            {isPositive ? '+' : ''}{market.change.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  )
})

export const MarketOverview = memo(function MarketOverview() {
  const { t } = useI18n()
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  // Use real WebSocket ticker stream from Binance
  const { tickers, isConnected } = useTickerStream({
    symbols: isVisible ? MARKET_SYMBOLS : [], // Only subscribe when visible
  })

  // Transform WebSocket tickers to MarketData format
  const markets = useMemo<MarketData[]>(() => {
    return MARKET_SYMBOLS.map(symbol => {
      const ticker = tickers[symbol]
      const info = MARKET_NAMES[symbol]

      if (ticker) {
        return {
          symbol: info.displaySymbol,
          name: info.name,
          price: ticker.lastPrice,
          change: ticker.changePercent24h,
        }
      }

      // Fallback to initial data if ticker not yet received
      const initial = initialMarkets.find(m => m.symbol === info.displaySymbol)
      return initial || {
        symbol: info.displaySymbol,
        name: info.name,
        price: 0,
        change: 0,
      }
    })
  }, [tickers])

  // Intersection Observer: Start WebSocket subscription only when visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.1 }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={containerRef}
      className="card-cinematic p-4"
      aria-label="Market Overview"
    >
      {/* Header - Live indicator shows WebSocket connection status */}
      <div className="flex items-center justify-end mb-4">
        <LiveIndicator
          status={isConnected ? 'live' : 'connecting'}
          size="sm"
          label={isConnected ? 'Live' : 'Connecting...'}
        />
      </div>

      {/* Market List - aria-live for real-time price updates */}
      <div
        className="space-y-1"
        role="region"
        aria-live="polite"
        aria-atomic="false"
        aria-label="Live market prices"
      >
        {markets.map((market, index) => (
          <MarketRow key={market.symbol} market={market} index={index} />
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-white/[0.06]">
        <button
          type="button"
          className="w-full text-center text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          aria-label="View all markets"
        >
          View All Markets →
        </button>
      </div>
    </section>
  )
})
