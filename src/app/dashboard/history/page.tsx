'use client'

import { useState } from 'react'
import { clsx } from 'clsx'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { DisclaimerInline } from '@/components/ui/Disclaimer'
import { useI18n } from '@/i18n/client'

export const dynamic = 'force-dynamic'

// ============================================
// Types
// ============================================

interface Trade {
  id: string
  symbol: string
  name: string
  side: 'buy' | 'sell'
  quantity: number
  price: number
  value: number
  executedAt: Date
  strategy?: string
  status: 'filled' | 'partial' | 'cancelled'
}

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
// Mock Data
// ============================================

const MOCK_TRADES: Trade[] = [
  { id: '1', symbol: 'NVDA', name: 'NVIDIA', side: 'buy', quantity: 10, price: 875.32, value: 8753.20, executedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), strategy: 'Momentum', status: 'filled' },
  { id: '2', symbol: 'AAPL', name: 'Apple', side: 'sell', quantity: 20, price: 178.50, value: 3570.00, executedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), strategy: 'Celeb Mirroring', status: 'filled' },
  { id: '3', symbol: 'TSLA', name: 'Tesla', side: 'buy', quantity: 15, price: 248.75, value: 3731.25, executedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), strategy: 'Swing Trading', status: 'filled' },
  { id: '4', symbol: 'MSFT', name: 'Microsoft', side: 'buy', quantity: 8, price: 410.20, value: 3281.60, executedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), status: 'filled' },
  { id: '5', symbol: 'META', name: 'Meta', side: 'sell', quantity: 5, price: 520.00, value: 2600.00, executedAt: new Date(Date.now() - 25 * 60 * 60 * 1000), strategy: 'Value Investing', status: 'filled' },
  { id: '6', symbol: 'GOOGL', name: 'Alphabet', side: 'buy', quantity: 25, price: 141.50, value: 3537.50, executedAt: new Date(Date.now() - 48 * 60 * 60 * 1000), status: 'partial' },
  { id: '7', symbol: 'AMZN', name: 'Amazon', side: 'buy', quantity: 12, price: 185.00, value: 2220.00, executedAt: new Date(Date.now() - 72 * 60 * 60 * 1000), strategy: 'Momentum', status: 'filled' },
  { id: '8', symbol: 'COIN', name: 'Coinbase', side: 'sell', quantity: 30, price: 180.25, value: 5407.50, executedAt: new Date(Date.now() - 96 * 60 * 60 * 1000), status: 'cancelled' },
]

// ============================================
// Components
// ============================================

interface TradeRowProps {
  trade: Trade
  t: (key: string) => string | string[] | Record<string, unknown>
}

function TradeRow({ trade, t }: TradeRowProps) {
  const isBuy = trade.side === 'buy'

  const formatDate = (date: Date) => {
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
          isBuy ? 'bg-emerald-500/10' : 'bg-red-500/10'
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
          </div>
          <p className="text-xs text-zinc-400">{trade.name}</p>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-white">{trade.quantity} {t('dashboard.history.shares') as string}</p>
        <p className="text-xs text-zinc-400">${trade.price.toFixed(2)}</p>
      </div>

      <div className="text-center">
        <p className="text-sm text-white">${trade.value.toLocaleString()}</p>
        {trade.strategy && (
          <p className="text-[10px] text-blue-400">{trade.strategy}</p>
        )}
      </div>

      <div className="text-right">
        <p className="text-xs text-zinc-400">{formatDate(trade.executedAt)}</p>
        <span className={clsx(
          'text-[10px]',
          trade.status === 'filled' && 'text-emerald-400',
          trade.status === 'partial' && 'text-yellow-400',
          trade.status === 'cancelled' && 'text-zinc-500'
        )}>
          {trade.status === 'filled'
            ? t('dashboard.history.status.filled') as string
            : trade.status === 'partial'
              ? t('dashboard.history.status.partial') as string
              : t('dashboard.history.status.cancelled') as string}
        </span>
      </div>
    </div>
  )
}

interface TradeSummaryProps {
  trades: Trade[]
  t: (key: string) => string | string[] | Record<string, unknown>
}

function TradeSummary({ trades, t }: TradeSummaryProps) {
  const filledTrades = trades.filter(trade => trade.status === 'filled')
  const totalBuy = filledTrades.filter(trade => trade.side === 'buy').reduce((sum, trade) => sum + trade.value, 0)
  const totalSell = filledTrades.filter(trade => trade.side === 'sell').reduce((sum, trade) => sum + trade.value, 0)

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="p-4 rounded-lg border border-white/[0.06]">
        <p className="text-xs text-zinc-400 mb-1">{t('dashboard.history.summary.totalTrades') as string}</p>
        <p className="text-[18px] text-white font-medium">{trades.length}</p>
      </div>
      <div className="p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
        <p className="text-xs text-zinc-400 mb-1">{t('dashboard.history.summary.buyAmount') as string}</p>
        <p className="text-[18px] text-emerald-400 font-medium">${totalBuy.toLocaleString()}</p>
      </div>
      <div className="p-4 rounded-lg border border-red-500/20 bg-red-500/5">
        <p className="text-xs text-zinc-400 mb-1">{t('dashboard.history.summary.sellAmount') as string}</p>
        <p className="text-[18px] text-red-400 font-medium">${totalSell.toLocaleString()}</p>
      </div>
    </div>
  )
}

// ============================================
// Main Page
// ============================================

export default function HistoryPage() {
  const { t } = useI18n()
  const [trades] = useState<Trade[]>(MOCK_TRADES)
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>('all')

  const filteredTrades = trades.filter(trade => {
    if (filter === 'all') return true
    return trade.side === filter
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
      <TradeSummary trades={trades} t={t} />

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
            {(t('dashboard.history.tradeCount') as string).replace('{count}', String(filteredTrades.length))}
          </p>
        </div>
        <div>
          {filteredTrades.length > 0 ? (
            filteredTrades.map((trade) => (
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
