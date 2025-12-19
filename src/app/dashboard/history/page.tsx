'use client'

import { useState } from 'react'
import { clsx } from 'clsx'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { DisclaimerInline } from '@/components/ui/Disclaimer'
import { useI18n } from '@/i18n/client'
import { useTrades, type Trade } from '@/hooks/useTrades'

export const dynamic = 'force-dynamic'

// ============================================
// Icons
// ============================================

const HistoryIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const ArrowUpIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
  </svg>
)

const ArrowDownIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
  </svg>
)

const FilterIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
)

const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
)

// ============================================
// Components
// ============================================

interface TradeRowProps {
  trade: Trade
  t: (key: string) => string | string[] | Record<string, unknown>
}

function TradeRow({ trade, t }: TradeRowProps) {
  const isBuy = trade.side === 'buy'

  const formatDate = (date: Date | null) => {
    if (!date) return '-'
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (hours < 1) return t('dashboard.history.time.justNow') as string
    if (hours < 24) return (t('dashboard.history.time.hoursAgo') as string).replace('{hours}', String(hours))
    if (days < 7) return (t('dashboard.history.time.daysAgo') as string).replace('{days}', String(days))
    return date.toLocaleDateString('en-US')
  }

  return (
    <div className="flex items-center justify-between p-4 border-b border-white/[0.06] last:border-0 hover:bg-white/[0.02] transition-colors">
      <div className="flex items-center gap-3">
        <div className={clsx(
          'w-8 h-8 rounded-lg flex items-center justify-center',
          isBuy ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
        )}>
          {isBuy ? (
            <ArrowUpIcon />
          ) : (
            <ArrowDownIcon />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-white font-medium">{trade.symbol}</p>
            <span className={clsx(
              'px-1.5 py-0.5 rounded text-[10px]',
              isBuy ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
            )}>
              {isBuy ? t('dashboard.history.buy') as string : t('dashboard.history.sell') as string}
            </span>
            {trade.pnl !== null && (
              <span className={clsx(
                'px-1.5 py-0.5 rounded text-[10px] font-medium',
                trade.pnl >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
              )}>
                {trade.pnl >= 0 ? '+' : ''}{trade.pnlPercent?.toFixed(1)}%
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400">{trade.name}</p>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-white">{trade.quantity} {t('dashboard.history.shares') as string}</p>
        <p className="text-xs text-zinc-400">${trade.price.toFixed(2)}</p>
      </div>

      <div className="text-center">
        <p className="text-sm text-white">${trade.total.toLocaleString()}</p>
        {trade.strategyName && (
          <p className="text-[10px] text-blue-400">{trade.strategyName}</p>
        )}
      </div>

      <div className="text-right">
        <p className="text-xs text-zinc-400">{formatDate(trade.executedAt || trade.createdAt)}</p>
        <span className={clsx(
          'text-[10px]',
          trade.status === 'filled' && 'text-emerald-400',
          trade.status === 'partial' && 'text-yellow-400',
          trade.status === 'pending' && 'text-blue-400',
          (trade.status === 'cancelled' || trade.status === 'rejected') && 'text-zinc-500'
        )}>
          {trade.status === 'filled'
            ? t('dashboard.history.status.filled') as string
            : trade.status === 'partial'
              ? t('dashboard.history.status.partial') as string
              : trade.status === 'pending'
                ? '대기중'
                : t('dashboard.history.status.cancelled') as string}
        </span>
      </div>
    </div>
  )
}

interface TradeSummaryProps {
  summary: {
    totalTrades: number
    buyAmount: number
    sellAmount: number
    totalPnl: number
  }
  t: (key: string) => string | string[] | Record<string, unknown>
}

function TradeSummary({ summary, t }: TradeSummaryProps) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="p-4 rounded-lg border border-white/[0.06]">
        <p className="text-xs text-zinc-400 mb-1">{t('dashboard.history.summary.totalTrades') as string}</p>
        <p className="text-[18px] text-white font-medium">{summary.totalTrades}</p>
      </div>
      <div className="p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
        <p className="text-xs text-zinc-400 mb-1">{t('dashboard.history.summary.buyAmount') as string}</p>
        <p className="text-[18px] text-emerald-400 font-medium">${summary.buyAmount.toLocaleString()}</p>
      </div>
      <div className="p-4 rounded-lg border border-red-500/20 bg-red-500/5">
        <p className="text-xs text-zinc-400 mb-1">{t('dashboard.history.summary.sellAmount') as string}</p>
        <p className="text-[18px] text-red-400 font-medium">${summary.sellAmount.toLocaleString()}</p>
      </div>
      <div className={clsx(
        'p-4 rounded-lg border',
        summary.totalPnl >= 0
          ? 'border-emerald-500/20 bg-emerald-500/5'
          : 'border-red-500/20 bg-red-500/5'
      )}>
        <p className="text-xs text-zinc-400 mb-1">총 손익</p>
        <p className={clsx(
          'text-[18px] font-medium',
          summary.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'
        )}>
          {summary.totalPnl >= 0 ? '+' : ''}${summary.totalPnl.toLocaleString()}
        </p>
      </div>
    </div>
  )
}

// ============================================
// Main Page
// ============================================

export default function HistoryPage() {
  const { t } = useI18n()
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>('all')

  // Supabase 연동 trades hook
  const { trades, isLoading, summary } = useTrades({
    side: filter === 'all' ? undefined : filter,
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-medium text-white flex items-center gap-2">
            <HistoryIcon />
            {t('dashboard.history.title') as string}
          </h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            {t('dashboard.history.description') as string}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" leftIcon={<FilterIcon />}>
            {t('dashboard.history.filter') as string}
          </Button>
          <Button variant="secondary" size="sm" leftIcon={<DownloadIcon />}>
            {t('dashboard.history.export') as string}
          </Button>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/[0.06]" />

      {/* Summary */}
      {isLoading ? (
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-shimmer h-20 rounded-lg" />
          ))}
        </div>
      ) : (
        <TradeSummary summary={summary} t={t} />
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'buy', 'sell'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={clsx(
              'px-3 py-1.5 rounded text-xs transition-colors',
              filter === f
                ? 'bg-white/[0.08] text-white'
                : 'text-zinc-500 hover:text-white'
            )}
          >
            {f === 'all'
              ? t('dashboard.history.filters.all') as string
              : f === 'buy'
                ? t('dashboard.history.filters.buy') as string
                : t('dashboard.history.filters.sell') as string}
          </button>
        ))}
      </div>

      {/* Trades List */}
      <Card padding="none">
        <div className="p-4 border-b border-white/[0.06]">
          <h2 className="text-sm text-white font-medium">{t('dashboard.history.tradeList') as string}</h2>
          <p className="text-xs text-zinc-400">
            {(t('dashboard.history.tradeCount') as string).replace('{count}', String(trades.length))}
          </p>
        </div>
        <div>
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="skeleton-shimmer h-16 rounded-lg" />
              ))}
            </div>
          ) : trades.length > 0 ? (
            trades.map((trade) => (
              <TradeRow key={trade.id} trade={trade} t={t} />
            ))
          ) : (
            <div className="p-8 text-center">
              <p className="text-sm text-zinc-400">{t('dashboard.history.noTrades') as string}</p>
            </div>
          )}
        </div>
      </Card>

      {/* 면책조항 */}
      <DisclaimerInline className="mt-4" />
    </div>
  )
}
