'use client'

import { memo } from 'react'
import { formatCurrency } from '@/lib/utils'
import { EmptyState } from '@/components/ui/EmptyState'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { useI18n } from '@/i18n/client'

interface Trade {
  id: string
  symbol: string
  type: 'buy' | 'sell'
  price: number
  amount: number
  pnl: number | null
  pnlPercent: number | null
  strategy: string
  status: 'completed' | 'pending'
}

// Demo data - strategy names are i18n keys
const demoTradesData = [
  { id: '1', symbol: 'BTC/USDT', type: 'buy' as const, price: 97245.50, amount: 0.025, pnl: 124.50, pnlPercent: 5.12, strategyKey: 'momentum', status: 'completed' as const },
  { id: '2', symbol: 'ETH/USDT', type: 'sell' as const, price: 3842.20, amount: 1.5, pnl: -82.40, pnlPercent: -1.43, strategyKey: 'rsi', status: 'completed' as const },
  { id: '3', symbol: 'SOL/USDT', type: 'buy' as const, price: 224.85, amount: 10, pnl: 45.20, pnlPercent: 2.01, strategyKey: 'macd', status: 'completed' as const },
  { id: '4', symbol: 'BTC/USDT', type: 'buy' as const, price: 96845.00, amount: 0.015, pnl: null, pnlPercent: null, strategyKey: 'momentum', status: 'pending' as const },
]

interface TradeRowProps {
  trade: Trade
  pendingLabel: string
}

const TradeRow = memo(function TradeRow({ trade, pendingLabel }: TradeRowProps) {
  const isBuy = trade.type === 'buy'
  const hasPnl = trade.pnl !== null
  const isProfitable = hasPnl && (trade.pnl ?? 0) >= 0

  return (
    <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-4 py-2.5 text-sm">
      <div className="flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isBuy ? 'bg-emerald-500' : 'bg-red-500'}`} />
        <span className="text-white truncate">{trade.symbol}</span>
      </div>
      <div className="hidden md:block text-zinc-400 tabular-nums">${trade.price.toLocaleString()}</div>
      <div className="hidden md:block text-zinc-500 tabular-nums">{trade.amount}</div>
      <div>
        {trade.status === 'pending' ? (
          <span className="text-zinc-500">{pendingLabel}</span>
        ) : hasPnl ? (
          <span className={isProfitable ? 'text-emerald-500' : 'text-red-500'}>
            {isProfitable ? '+' : ''}{formatCurrency(trade.pnl!)}
          </span>
        ) : (
          <span className="text-zinc-400">-</span>
        )}
      </div>
      <div className="text-zinc-400 text-right truncate">{trade.strategy}</div>
    </div>
  )
})

interface RecentTradesProps {
  showEmpty?: boolean
}

export const RecentTrades = memo(function RecentTrades({ showEmpty = false }: RecentTradesProps) {
  const { t } = useI18n()

  // Build trades with translated strategy names
  const trades: Trade[] = showEmpty ? [] : demoTradesData.map(td => ({
    id: td.id,
    symbol: td.symbol,
    type: td.type,
    price: td.price,
    amount: td.amount,
    pnl: td.pnl,
    pnlPercent: td.pnlPercent,
    strategy: t(`dashboard.components.recentTrades.strategies.${td.strategyKey}`) as string,
    status: td.status,
  }))

  const pendingLabel = t('dashboard.components.recentTrades.pending') as string

  if (trades.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-zinc-400">
            {t('dashboard.components.recentTrades.title') as string}
          </h3>
        </div>
        <EmptyState
          icon={<ArrowPathIcon className="w-12 h-12" />}
          title={t('dashboard.components.recentTrades.emptyTitle') as string}
          description={t('dashboard.components.recentTrades.emptyDesc') as string}
        />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-zinc-400">
          {t('dashboard.components.recentTrades.title') as string}
        </h3>
        <button type="button" className="text-xs text-zinc-400 hover:text-zinc-400 transition-colors">
          {t('dashboard.components.recentTrades.viewAll') as string}
        </button>
      </div>

      {/* Header */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-4 py-2 text-xs text-zinc-400 border-b border-white/[0.06]">
        <div>{t('dashboard.components.recentTrades.symbol') as string}</div>
        <div className="hidden md:block">{t('dashboard.components.recentTrades.price') as string}</div>
        <div className="hidden md:block">{t('dashboard.components.recentTrades.amount') as string}</div>
        <div>{t('dashboard.components.recentTrades.pnl') as string}</div>
        <div className="text-right">{t('dashboard.components.recentTrades.strategy') as string}</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-white/[0.04]">
        {trades.map((trade) => (
          <TradeRow key={trade.id} trade={trade} pendingLabel={pendingLabel} />
        ))}
      </div>
    </div>
  )
})
