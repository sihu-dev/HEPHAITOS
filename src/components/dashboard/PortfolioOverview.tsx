'use client'

import { memo } from 'react'
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline'
import { formatCurrency } from '@/lib/utils'
import { useI18n } from '@/i18n/client'

interface StatItem {
  labelKey: string
  value: number
  change: number
  format: 'currency' | 'percent'
}

const statsConfig: StatItem[] = [
  { labelKey: 'totalValue', value: 128470000, change: 12.4, format: 'currency' },
  { labelKey: 'todayPnl', value: 2847000, change: 2.3, format: 'currency' },
  { labelKey: 'totalReturn', value: 28.4, change: 5.2, format: 'percent' },
  { labelKey: 'winRate', value: 67.3, change: 2.1, format: 'percent' },
]

interface StatCardProps {
  stat: StatItem
  label: string
}

const StatCard = memo(function StatCard({ stat, label }: StatCardProps) {
  const isPositive = stat.change >= 0
  const formattedValue = stat.format === 'currency' ? formatCurrency(stat.value) : `${stat.value}%`;

  return (
    <article className="space-y-1" aria-label={`${label}: ${formattedValue}`}>
      <span className="text-sm text-zinc-400">{label}</span>
      <div className="text-base font-medium text-white" aria-label={formattedValue}>
        {formattedValue}
      </div>
      <div className="flex items-center gap-1">
        {isPositive ? (
          <ArrowTrendingUpIcon className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
        ) : (
          <ArrowTrendingDownIcon className="w-3.5 h-3.5 text-red-500" aria-hidden="true" />
        )}
        <span
          className={`text-xs ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}
          aria-label={`${isPositive ? 'up' : 'down'} ${Math.abs(stat.change)} percent`}
        >
          {isPositive ? '+' : ''}{stat.change}%
        </span>
      </div>
    </article>
  )
})

// Simple chart bars
const chartData = [45, 62, 55, 78, 34, 67, 89, 45, 56, 72, 48, 91, 38, 65, 74, 52, 83, 41, 69, 58, 76, 44, 87, 39, 63, 71, 49, 85, 37, 66]

export const PortfolioOverview = memo(function PortfolioOverview() {
  const { t } = useI18n()

  return (
    <section className="space-y-6" aria-label="Portfolio Overview">
      {/* Stats Row */}
      <div
        className="grid grid-cols-2 lg:grid-cols-4 gap-6"
        role="region"
        aria-live="polite"
        aria-atomic="false"
        aria-label="Portfolio statistics"
      >
        {statsConfig.map((stat) => (
          <StatCard
            key={stat.labelKey}
            stat={stat}
            label={t(`dashboard.components.portfolioOverview.${stat.labelKey}`) as string}
          />
        ))}
      </div>

      {/* Chart */}
      <div
        className="h-32 flex items-end gap-[2px]"
        role="img"
        aria-label="Portfolio performance chart"
      >
        {chartData.map((height, i) => (
          <div
            key={i}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 transition-colors rounded-sm"
            style={{ height: `${height}%` }}
            aria-hidden="true"
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span>{t('dashboard.components.portfolioOverview.chartStart') as string}</span>
        <span>{t('dashboard.components.portfolioOverview.chartEnd') as string}</span>
      </div>
    </section>
  )
})
