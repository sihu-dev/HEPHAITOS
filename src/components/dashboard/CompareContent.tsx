'use client'


import { useState } from 'react'
import { clsx } from 'clsx'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  celebrityPortfolioManager,
  formatPortfolioChange,
  type CelebrityProfile,
} from '@/lib/mirroring/celebrity-portfolio'
import { DisclaimerInline, TradeWarning } from '@/components/ui/Disclaimer'
import { useI18n } from '@/i18n/client'
import { useHoldings, type HoldingItem } from '@/hooks/useHoldings'


// ============================================
// Types
// ============================================

interface ComparisonResult {
  symbol: string
  name: string
  celebrityWeight: number
  userWeight: number
  difference: number
  suggestion: 'buy' | 'sell' | 'hold'
  suggestedShares?: number
  suggestedValue?: number
}

// ============================================
// Icons
// ============================================

const ChartIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
)

const ArrowUpIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
  </svg>
)

const ArrowDownIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
  </svg>
)

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const SyncIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

// ============================================
// Comparison Bar Component
// ============================================

function ComparisonBar({
  symbol,
  name,
  celebrityWeight,
  userWeight,
  suggestion,
  t,
}: ComparisonResult & { t: (key: string) => string | string[] | Record<string, unknown> }) {
  const maxWeight = Math.max(celebrityWeight, userWeight, 30)
  const celebrityWidth = (celebrityWeight / maxWeight) * 100
  const userWidth = (userWeight / maxWeight) * 100
  const difference = celebrityWeight - userWeight

  return (
    <div className="p-4 rounded-lg border border-white/[0.06] hover:bg-white/[0.02] transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-white/[0.06] flex items-center justify-center">
            <span className="text-xs text-white font-medium">
              {symbol.slice(0, 2)}
            </span>
          </div>
          <div>
            <p className="text-sm text-white font-medium">{symbol}</p>
            <p className="text-xs text-zinc-400">{name}</p>
          </div>
        </div>

        {/* Suggestion Badge */}
        <div className={clsx(
          'flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium',
          suggestion === 'buy' && 'bg-emerald-500/10 text-emerald-400',
          suggestion === 'sell' && 'bg-red-500/10 text-red-400',
          suggestion === 'hold' && 'bg-zinc-500/10 text-zinc-400'
        )}>
          {suggestion === 'buy' && <ArrowUpIcon />}
          {suggestion === 'sell' && <ArrowDownIcon />}
          {suggestion === 'hold' && <CheckIcon />}
          {suggestion === 'buy' ? t('dashboard.compare.suggestion.buy') as string : suggestion === 'sell' ? t('dashboard.compare.suggestion.sell') as string : t('dashboard.compare.suggestion.hold') as string}
        </div>
      </div>

      {/* Weight Comparison Bars */}
      <div className="space-y-2">
        {/* Celebrity Bar */}
        <div className="flex items-center gap-3">
          <span className="w-12 text-xs text-zinc-400">{t('dashboard.compare.labels.celeb') as string}</span>
          <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{ width: `${celebrityWidth}%` }}
            />
          </div>
          <span className="w-12 text-xs text-blue-400 text-right">
            {celebrityWeight.toFixed(1)}%
          </span>
        </div>

        {/* User Bar */}
        <div className="flex items-center gap-3">
          <span className="w-12 text-xs text-zinc-400">{t('dashboard.compare.labels.myPortfolio') as string}</span>
          <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full bg-purple-500 transition-all"
              style={{ width: `${userWidth}%` }}
            />
          </div>
          <span className="w-12 text-xs text-purple-400 text-right">
            {userWeight.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Difference */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06]">
        <span className="text-xs text-zinc-400">{t('dashboard.compare.labels.difference') as string}</span>
        <span className={clsx(
          'text-xs font-medium',
          difference > 0 ? 'text-emerald-400' : difference < 0 ? 'text-red-400' : 'text-zinc-400'
        )}>
          {difference > 0 ? '+' : ''}{difference.toFixed(1)}%p
        </span>
      </div>
    </div>
  )
}

// ============================================
// Portfolio Stats Component
// ============================================

function PortfolioStats({
  title,
  holdings,
  performance,
  color,
  t,
}: {
  title: string
  holdings: { symbol: string; weight: number }[]
  performance: { ytd: number; sharpe?: number }
  color: 'blue' | 'purple'
  t: (key: string) => string | string[] | Record<string, unknown>
}) {
  const totalWeight = holdings.reduce((sum, h) => sum + h.weight, 0)
  const topHoldings = [...holdings].sort((a, b) => b.weight - a.weight).slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
        <CardDescription>{t('dashboard.compare.card.composition') as string}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Performance */}
        <div className="flex gap-4">
          <div className="flex-1 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <p className="text-xs text-zinc-400 mb-1">{t('dashboard.compare.card.ytdReturn') as string}</p>
            <p className={clsx(
              'text-[16px] font-medium',
              performance.ytd >= 0 ? 'text-emerald-400' : 'text-red-400'
            )}>
              {formatPortfolioChange(performance.ytd)}
            </p>
          </div>
          {performance.sharpe && (
            <div className="flex-1 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
              <p className="text-xs text-zinc-400 mb-1">Sharpe Ratio</p>
              <p className="text-[16px] text-white font-medium">
                {performance.sharpe.toFixed(2)}
              </p>
            </div>
          )}
        </div>

        {/* Top Holdings */}
        <div>
          <p className="text-xs text-zinc-400 mb-2">{t('dashboard.compare.card.topHoldings') as string}</p>
          <div className="space-y-2">
            {topHoldings.map((holding) => (
              <div key={holding.symbol} className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className={clsx(
                      'h-full rounded-full',
                      color === 'blue' ? 'bg-blue-500' : 'bg-purple-500'
                    )}
                    style={{ width: `${(holding.weight / totalWeight) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-zinc-400 w-12">{holding.symbol}</span>
                <span className="text-xs text-zinc-400 w-10 text-right">
                  {holding.weight.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// Sync Suggestions Component
// ============================================

function SyncSuggestions({
  comparisons,
  onSync,
  t,
}: {
  comparisons: ComparisonResult[]
  onSync: (items: ComparisonResult[]) => void
  t: (key: string) => string | string[] | Record<string, unknown>
}) {
  const suggestions = comparisons.filter((c) => c.suggestion !== 'hold')
  const buys = suggestions.filter((c) => c.suggestion === 'buy')
  const sells = suggestions.filter((c) => c.suggestion === 'sell')

  if (suggestions.length === 0) {
    return (
      <div className="p-6 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-3">
          <CheckIcon />
        </div>
        <p className="text-sm text-emerald-400 font-medium">{t('dashboard.compare.sync.synced') as string}</p>
        <p className="text-xs text-zinc-400 mt-1">{t('dashboard.compare.sync.syncedDesc') as string}</p>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SyncIcon />
          {t('dashboard.compare.sync.suggestions') as string}
        </CardTitle>
        <CardDescription>
          {t('dashboard.compare.sync.adjustments') as string}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Buy Suggestions */}
        {buys.length > 0 && (
          <div>
            <p className="text-xs text-emerald-400 font-medium mb-2">{t('dashboard.compare.sync.buyRecommend') as string}</p>
            <div className="space-y-2">
              {buys.map((item) => (
                <div
                  key={item.symbol}
                  className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20"
                >
                  <div className="flex items-center gap-2">
                    <ArrowUpIcon />
                    <span className="text-sm text-white">{item.symbol}</span>
                    <span className="text-xs text-zinc-400">{item.name}</span>
                  </div>
                  <span className="text-xs text-emerald-400">
                    +{item.difference.toFixed(1)}%p
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sell Suggestions */}
        {sells.length > 0 && (
          <div>
            <p className="text-xs text-red-400 font-medium mb-2">{t('dashboard.compare.sync.sellRecommend') as string}</p>
            <div className="space-y-2">
              {sells.map((item) => (
                <div
                  key={item.symbol}
                  className="flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/20"
                >
                  <div className="flex items-center gap-2">
                    <ArrowDownIcon />
                    <span className="text-sm text-white">{item.symbol}</span>
                    <span className="text-xs text-zinc-400">{item.name}</span>
                  </div>
                  <span className="text-xs text-red-400">
                    {item.difference.toFixed(1)}%p
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trade Warning */}
        <TradeWarning className="mb-3" />

        <Button
          fullWidth
          onClick={() => onSync(suggestions)}
          leftIcon={<SyncIcon />}
        >
          {t('dashboard.compare.sync.autoRebalance') as string}
        </Button>
      </CardContent>
    </Card>
  )
}

// ============================================
// Main Page Component
// ============================================

export function CompareContent() {
  const { t } = useI18n()
  const [selectedCelebrity, setSelectedCelebrity] = useState<string>('nancy_pelosi')
  const { holdings, isLoading } = useHoldings()

  const celebrities = celebrityPortfolioManager.getCelebrities()
  const celebrity = celebrityPortfolioManager.getCelebrity(selectedCelebrity)
  const celebrityPortfolio = celebrityPortfolioManager.getPortfolio(selectedCelebrity)

  // Calculate comparison using real holdings data
  const userHoldings = holdings.map((h) => ({
    symbol: h.symbol,
    value: h.value,
  }))

  const comparisons = celebrity
    ? celebrityPortfolioManager.comparePortfolios(selectedCelebrity, userHoldings)
    : []

  // Add user holdings not in celebrity portfolio
  const celebritySymbols = new Set(comparisons.map((c) => c.symbol))
  const userOnlyHoldings = holdings.filter(
    (h) => !celebritySymbols.has(h.symbol)
  ).map((h) => ({
    symbol: h.symbol,
    name: h.name,
    celebrityWeight: 0,
    userWeight: h.weight,
    difference: -h.weight,
    suggestion: 'sell' as const,
  }))

  const allComparisons: ComparisonResult[] = [
    ...comparisons.map((c) => ({
      ...c,
      name: holdings.find((h) => h.symbol === c.symbol)?.name ||
            celebrityPortfolio?.holdings.find((h) => h.symbol === c.symbol)?.name ||
            c.symbol,
    })),
    ...userOnlyHoldings,
  ]

  const handleSync = (items: ComparisonResult[]) => {
    console.log('Syncing portfolio:', items)
    // TODO: Implement actual sync logic
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-medium text-white flex items-center gap-2">
            <ChartIcon />
            {t('dashboard.compare.page.title') as string}
          </h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            {t('dashboard.compare.page.subtitle') as string}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/[0.06]" />

      {/* Celebrity Selector */}
      <div>
        <p className="text-xs text-zinc-400 mb-2">{t('dashboard.compare.page.selectInvestor') as string}</p>
        <div className="flex flex-wrap gap-2">
          {celebrities.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCelebrity(c.id)}
              className={clsx(
                'px-4 py-2 rounded-lg text-sm transition-colors border',
                selectedCelebrity === c.id
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                  : 'bg-white/[0.04] text-zinc-400 border-white/[0.06] hover:bg-white/[0.06]'
              )}
            >
              {c.nameKr}
            </button>
          ))}
        </div>
      </div>

      {/* Portfolio Stats Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Celebrity Portfolio */}
        {celebrity && celebrityPortfolio && (
          <PortfolioStats
            title={(t('dashboard.compare.page.celebrityPortfolio') as string).replace('{name}', celebrity.nameKr)}
            holdings={celebrityPortfolio.holdings.map((h) => ({
              symbol: h.symbol,
              weight: h.weight,
            }))}
            performance={{
              ytd: celebrityPortfolio.performance.ytd,
              sharpe: celebrityPortfolio.performance.sharpeRatio,
            }}
            color="blue"
            t={t}
          />
        )}

        {/* User Portfolio */}
        <PortfolioStats
          title={t('dashboard.compare.page.myPortfolio') as string}
          holdings={holdings.map((h) => ({
            symbol: h.symbol,
            weight: h.weight,
          }))}
          performance={{
            ytd: holdings.reduce((sum, h) => sum + h.profitPercent * h.weight / 100, 0),
          }}
          color="purple"
          t={t}
        />
      </div>

      {/* Comparison Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Comparison Bars */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm text-zinc-400 font-medium">{t('dashboard.compare.page.weightComparison') as string}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allComparisons.map((comparison) => (
              <ComparisonBar
                key={comparison.symbol}
                {...comparison}
                t={t}
              />
            ))}
          </div>
        </div>

        {/* Sync Suggestions */}
        <div className="lg:col-span-1">
          <SyncSuggestions
            comparisons={allComparisons}
            onSync={handleSync}
            t={t}
          />
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-xs text-zinc-400">
            {celebrity?.nameKr || (t('dashboard.compare.labels.celeb') as string)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <span className="text-xs text-zinc-400">{t('dashboard.compare.page.myPortfolio') as string}</span>
        </div>
      </div>

      {/* Disclaimer */}
      <DisclaimerInline className="mt-4" />
    </div>
  )
}
