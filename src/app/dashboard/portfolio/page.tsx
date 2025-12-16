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

type TranslateFunction = (key: string) => string | string[] | Record<string, unknown>

interface Holding {
  symbol: string
  name: string
  quantity: number
  avgPrice: number
  currentPrice: number
  value: number
  profit: number
  profitPercent: number
  weight: number
}

interface PortfolioStats {
  totalValue: number
  totalProfit: number
  totalProfitPercent: number
  todayProfit: number
  todayProfitPercent: number
  cash: number
  invested: number
}

// ============================================
// Icons
// ============================================

const TrendingUpIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
)

const TrendingDownIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
  </svg>
)

const PieChartIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
  </svg>
)

const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

// ============================================
// Mock Data
// ============================================

const MOCK_HOLDINGS: Holding[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', quantity: 50, avgPrice: 165, currentPrice: 178, value: 8900, profit: 650, profitPercent: 7.88, weight: 22.3 },
  { symbol: 'MSFT', name: 'Microsoft', quantity: 20, avgPrice: 380, currentPrice: 410, value: 8200, profit: 600, profitPercent: 7.89, weight: 20.5 },
  { symbol: 'GOOGL', name: 'Alphabet', quantity: 40, avgPrice: 135, currentPrice: 142, value: 5680, profit: 280, profitPercent: 5.19, weight: 14.2 },
  { symbol: 'TSLA', name: 'Tesla', quantity: 25, avgPrice: 220, currentPrice: 250, value: 6250, profit: 750, profitPercent: 13.64, weight: 15.6 },
  { symbol: 'AMZN', name: 'Amazon', quantity: 30, avgPrice: 170, currentPrice: 185, value: 5550, profit: 450, profitPercent: 8.82, weight: 13.9 },
  { symbol: 'META', name: 'Meta Platforms', quantity: 10, avgPrice: 480, currentPrice: 520, value: 5200, profit: 400, profitPercent: 8.33, weight: 13.0 },
]

const MOCK_STATS: PortfolioStats = {
  totalValue: 39780000,
  totalProfit: 3130000,
  totalProfitPercent: 8.54,
  todayProfit: 425000,
  todayProfitPercent: 1.08,
  cash: 5220000,
  invested: 34560000,
}

// ============================================
// Components
// ============================================

function StatCard({ label, value, change, isPositive }: { label: string; value: string; change?: string; isPositive?: boolean; }) {
  return (
    <div className="p-4 rounded-lg border border-white/[0.06]">
      <p className="text-xs text-zinc-400 mb-1">{label}</p>
      <p className="text-[18px] text-white font-medium">{value}</p>
      {change && (
        <div className={clsx(
          'flex items-center gap-1 mt-1',
          isPositive ? 'text-emerald-400' : 'text-red-400'
        )}>
          {isPositive ? <TrendingUpIcon /> : <TrendingDownIcon />}
          <span className="text-xs">{change}</span>
        </div>
      )}
    </div>
  )
}

function HoldingRow({ holding, t }: { holding: Holding; t: TranslateFunction }) {
  const isPositive = holding.profit >= 0

  return (
    <div className="flex items-center justify-between p-4 border-b border-white/[0.06] last:border-0 hover:bg-white/[0.02] transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center">
          <span className="text-xs text-white font-medium">{holding.symbol.slice(0, 2)}</span>
        </div>
        <div>
          <p className="text-sm text-white font-medium">{holding.symbol}</p>
          <p className="text-xs text-zinc-400">{holding.name}</p>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-white">{holding.quantity} {t('dashboard.portfolio.shares') as string}</p>
        <p className="text-xs text-zinc-400">{t('dashboard.portfolio.avgPrice') as string} ${holding.avgPrice}</p>
      </div>

      <div className="text-center">
        <p className="text-sm text-white">${holding.currentPrice}</p>
        <p className="text-xs text-zinc-400">{t('dashboard.portfolio.currentPrice') as string}</p>
      </div>

      <div className="text-right">
        <p className="text-sm text-white">${holding.value.toLocaleString()}</p>
        <p className={clsx(
          'text-xs',
          isPositive ? 'text-emerald-400' : 'text-red-400'
        )}>
          {isPositive ? '+' : ''}{holding.profitPercent.toFixed(2)}%
        </p>
      </div>

      <div className="w-16">
        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-500"
            style={{ width: `${holding.weight}%` }}
          />
        </div>
        <p className="text-[10px] text-zinc-500 text-center mt-1">{holding.weight}%</p>
      </div>
    </div>
  )
}

function AllocationChart({ holdings }: { holdings: Holding[] }) {
  const colors = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#6366F1']

  return (
    <div className="flex items-center gap-6">
      {/* Simple bar representation */}
      <div className="flex-1 h-4 rounded-full overflow-hidden flex">
        {holdings.map((h, i) => (
          <div
            key={h.symbol}
            className="h-full"
            style={{ width: `${h.weight}%`, backgroundColor: colors[i % colors.length] }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2">
        {holdings.slice(0, 6).map((h, i) => (
          <div key={h.symbol} className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: colors[i % colors.length] }}
            />
            <span className="text-xs text-zinc-400">{h.symbol}</span>
            <span className="text-xs text-zinc-400">{h.weight}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================
// Main Page
// ============================================

export default function PortfolioPage() {
  const { t } = useI18n()
  const [holdings] = useState<Holding[]>(MOCK_HOLDINGS)
  const [stats] = useState<PortfolioStats>(MOCK_STATS)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-medium text-white flex items-center gap-2">
            <PieChartIcon />
            {t('dashboard.portfolio.title') as string}
          </h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            {t('dashboard.portfolio.description') as string}
          </p>
        </div>
        <Button variant="secondary" size="sm" leftIcon={<RefreshIcon />}>
          {t('dashboard.portfolio.refresh') as string}
        </Button>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/[0.06]" />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label={t('dashboard.portfolio.stats.totalAssets') as string}
          value={`₩${(stats.totalValue / 10000).toFixed(0)}${t('dashboard.portfolio.stats.tenThousand') as string}`}
          change={`+${stats.totalProfitPercent.toFixed(2)}%`}
          isPositive={stats.totalProfit >= 0}
        />
        <StatCard
          label={t('dashboard.portfolio.stats.todayProfit') as string}
          value={`₩${(stats.todayProfit / 10000).toFixed(0)}${t('dashboard.portfolio.stats.tenThousand') as string}`}
          change={`${stats.todayProfitPercent >= 0 ? '+' : ''}${stats.todayProfitPercent.toFixed(2)}%`}
          isPositive={stats.todayProfit >= 0}
        />
        <StatCard
          label={t('dashboard.portfolio.stats.invested') as string}
          value={`₩${(stats.invested / 10000).toFixed(0)}${t('dashboard.portfolio.stats.tenThousand') as string}`}
        />
        <StatCard
          label={t('dashboard.portfolio.stats.cash') as string}
          value={`₩${(stats.cash / 10000).toFixed(0)}${t('dashboard.portfolio.stats.tenThousand') as string}`}
        />
      </div>

      {/* Allocation */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.portfolio.allocation.title') as string}</CardTitle>
          <CardDescription>{t('dashboard.portfolio.allocation.description') as string}</CardDescription>
        </CardHeader>
        <CardContent>
          <AllocationChart holdings={holdings} />
        </CardContent>
      </Card>

      {/* Holdings Table */}
      <Card padding="none">
        <div className="p-4 border-b border-white/[0.06]">
          <h2 className="text-sm text-white font-medium">{t('dashboard.portfolio.holdings.title') as string}</h2>
          <p className="text-xs text-zinc-400">{(t('dashboard.portfolio.holdings.count') as string).replace('{count}', String(holdings.length))}</p>
        </div>
        <div>
          {holdings.map((holding) => (
            <HoldingRow key={holding.symbol} holding={holding} t={t} />
          ))}
        </div>
      </Card>

      {/* Disclaimer */}
      <DisclaimerInline className="mt-6" />
    </div>
  )
}
