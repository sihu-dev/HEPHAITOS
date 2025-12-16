'use client'

import { memo, useState, useEffect, useRef } from 'react'
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline'
import { useI18n } from '@/i18n/client'
import { clsx } from 'clsx'
import { LiveIndicator } from '@/components/ui/LiveIndicator'
import { PriceDisplay } from '@/components/ui/PriceDisplay'

interface MarketData {
  symbol: string
  name: string
  price: number
  change: number
  icon?: string
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
    >
      {/* Symbol & Name */}
      <div className="flex items-center gap-3">
        <div className={clsx(
          'w-8 h-8 rounded-lg flex items-center justify-center',
          'bg-white/[0.06] text-xs font-bold text-white'
        )}>
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
            <ArrowTrendingUpIcon className="w-3 h-3" />
          ) : (
            <ArrowTrendingDownIcon className="w-3 h-3" />
          )}
          <span className="tabular-nums">
            {isPositive ? '+' : ''}{market.change.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  )
})

export const MarketOverview = memo(function MarketOverview() {
  const { t } = useI18n()
  const [markets, setMarkets] = useState(initialMarkets)
  const [isVisible, setIsVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Intersection Observer: Start polling only when visible
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

  // Simulate real-time price updates (only when visible)
  useEffect(() => {
    if (!isVisible) return

    const interval = setInterval(() => {
      setMarkets(prev => prev.map(market => ({
        ...market,
        price: market.price * (1 + (Math.random() - 0.5) * 0.002),
        change: market.change + (Math.random() - 0.5) * 0.1,
      })))
    }, 8000) // Increased from 5s to 8s
    return () => clearInterval(interval)
  }, [isVisible])

  return (
    <div ref={containerRef} className="card-cinematic p-4">
      {/* Header - Live indicator only (title provided by parent) */}
      <div className="flex items-center justify-end mb-4">
        <LiveIndicator status="live" size="sm" label="Live" />
      </div>

      {/* Market List */}
      <div className="space-y-1">
        {markets.map((market, index) => (
          <MarketRow key={market.symbol} market={market} index={index} />
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-white/[0.06]">
        <button className="w-full text-center text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
          View All Markets →
        </button>
      </div>
    </div>
  )
})
