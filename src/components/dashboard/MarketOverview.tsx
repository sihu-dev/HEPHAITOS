'use client'

import { memo } from 'react'
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline'
import { useI18n } from '@/i18n/client'

interface MarketData {
  symbol: string
  name: string
  price: number
  change: number
}

const markets: MarketData[] = [
  { symbol: 'BTC', name: 'Bitcoin', price: 97245.50, change: 2.34 },
  { symbol: 'ETH', name: 'Ethereum', price: 3842.20, change: -0.82 },
  { symbol: 'SOL', name: 'Solana', price: 224.85, change: 5.67 },
  { symbol: 'XRP', name: 'Ripple', price: 2.34, change: 1.23 },
]

const MarketRow = memo(function MarketRow({ market }: { market: MarketData }) {
  const isPositive = market.change >= 0

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-white">{market.symbol}</span>
        <span className="text-xs text-zinc-400">{market.name}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-zinc-300 tabular-nums">
          ${market.price.toLocaleString()}
        </span>
        <div className={`flex items-center gap-0.5 text-xs ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
          {isPositive ? (
            <ArrowTrendingUpIcon className="w-3.5 h-3.5" />
          ) : (
            <ArrowTrendingDownIcon className="w-3.5 h-3.5" />
          )}
          <span>{isPositive ? '+' : ''}{market.change}%</span>
        </div>
      </div>
    </div>
  )
})

export const MarketOverview = memo(function MarketOverview() {
  const { t } = useI18n()

  return (
    <div>
      <h3 className="text-sm font-medium text-zinc-400 mb-3">
        {t('dashboard.components.marketOverview.title') as string}
      </h3>
      <div className="divide-y divide-white/[0.04]">
        {markets.map((market) => (
          <MarketRow key={market.symbol} market={market} />
        ))}
      </div>
    </div>
  )
})
