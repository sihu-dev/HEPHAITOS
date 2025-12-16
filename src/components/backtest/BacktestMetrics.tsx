'use client'

import { memo } from 'react'
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  BoltIcon,
  PercentBadgeIcon,
  PresentationChartLineIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline'
import { useI18n } from '@/i18n/client'

import type { BacktestMetrics as Metrics } from '@/lib/backtest'

// heroicons 별칭 (기존 아이콘명과 호환성)
const Activity = PresentationChartLineIcon
const Target = AdjustmentsHorizontalIcon
const DollarSign = CurrencyDollarIcon
const Zap = BoltIcon

interface BacktestMetricsProps {
  metrics: Metrics
  className?: string
}

export function BacktestMetrics({ metrics, className = '' }: BacktestMetricsProps) {
  const { t, locale } = useI18n()

  const formatDurationLocalized = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))

    if (hours >= 24) {
      const days = Math.floor(hours / 24)
      return `${days}${t('dashboard.backtest.duration.days')} ${hours % 24}${t('dashboard.backtest.duration.hours')}`
    }

    if (hours > 0) {
      return `${hours}${t('dashboard.backtest.duration.hours')} ${minutes}${t('dashboard.backtest.duration.minutes')}`
    }

    return `${minutes}${t('dashboard.backtest.duration.minutes')}`
  }

  return (
    <div className={`border border-white/[0.06] rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
        <ChartBarIcon className="w-4 h-4 text-zinc-500" />
        <h3 className="text-sm font-medium text-white">{t('dashboard.backtest.metrics.title') as string}</h3>
      </div>

      {/* Metrics Grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
          <MetricItem
            label={t('dashboard.backtest.metrics.totalReturn') as string}
            value={`${metrics.totalReturn >= 0 ? '+' : ''}${(metrics.totalReturn * 100).toFixed(2)}%`}
            icon={metrics.totalReturn >= 0 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon}
            positive={metrics.totalReturn >= 0}
          />

          <MetricItem
            label={t('dashboard.backtest.metrics.annualizedReturn') as string}
            value={`${metrics.annualizedReturn >= 0 ? '+' : ''}${(metrics.annualizedReturn * 100).toFixed(2)}%`}
            icon={Activity}
            positive={metrics.annualizedReturn >= 0}
          />

          <MetricItem
            label={t('dashboard.backtest.metrics.maxDrawdown') as string}
            value={`${(metrics.maxDrawdown * 100).toFixed(2)}%`}
            icon={ArrowTrendingDownIcon}
            negative
          />

          <MetricItem
            label={t('dashboard.backtest.metrics.volatility') as string}
            value={`${(metrics.volatility * 100).toFixed(2)}%`}
            icon={Activity}
          />

          <MetricItem
            label={t('dashboard.backtest.metrics.sharpeRatio') as string}
            value={metrics.sharpeRatio.toFixed(3)}
            icon={Target}
            positive={metrics.sharpeRatio >= 1}
          />

          <MetricItem
            label={t('dashboard.backtest.metrics.sortinoRatio') as string}
            value={metrics.sortinoRatio.toFixed(3)}
            icon={Target}
            positive={metrics.sortinoRatio >= 1}
          />

          <MetricItem
            label={t('dashboard.backtest.metrics.calmarRatio') as string}
            value={metrics.calmarRatio.toFixed(3)}
            icon={Target}
            positive={metrics.calmarRatio >= 1}
          />

          <MetricItem
            label={t('dashboard.backtest.metrics.profitFactor') as string}
            value={metrics.profitFactor.toFixed(2)}
            icon={PercentBadgeIcon}
            positive={metrics.profitFactor >= 1.5}
          />

          <MetricItem
            label={t('dashboard.backtest.metrics.totalTrades') as string}
            value={metrics.totalTrades.toLocaleString()}
            icon={Activity}
          />

          <MetricItem
            label={t('dashboard.backtest.metrics.winRate') as string}
            value={`${(metrics.winRate * 100).toFixed(1)}%`}
            icon={ArrowTrendingUpIcon}
            positive={metrics.winRate >= 0.5}
          />

          <MetricItem
            label={t('dashboard.backtest.metrics.avgWin') as string}
            value={`$${metrics.avgWin.toFixed(2)}`}
            icon={DollarSign}
            positive
          />

          <MetricItem
            label={t('dashboard.backtest.metrics.avgLoss') as string}
            value={`$${metrics.avgLoss.toFixed(2)}`}
            icon={DollarSign}
            negative
          />

          <MetricItem
            label={t('dashboard.backtest.metrics.maxConsecutiveWins') as string}
            value={metrics.maxConsecutiveWins.toString()}
            icon={Zap}
            positive
          />

          <MetricItem
            label={t('dashboard.backtest.metrics.maxConsecutiveLosses') as string}
            value={metrics.maxConsecutiveLosses.toString()}
            icon={Zap}
            negative
          />

          <MetricItem
            label={t('dashboard.backtest.metrics.avgHoldingPeriod') as string}
            value={formatDurationLocalized(metrics.avgHoldingPeriod)}
            icon={CalendarDaysIcon}
          />

          <MetricItem
            label={t('dashboard.backtest.metrics.expectancy') as string}
            value={`$${metrics.expectancy.toFixed(2)}`}
            icon={Target}
            positive={metrics.expectancy >= 0}
          />
        </div>
      </div>
    </div>
  )
}

interface MetricItemProps {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  positive?: boolean
  negative?: boolean
}

const MetricItem = memo(function MetricItem({ label, value, icon: Icon, positive, negative }: MetricItemProps) {
  let valueClass = 'text-zinc-300'
  let iconClass = 'text-zinc-500'

  if (positive) {
    valueClass = 'text-emerald-400'
    iconClass = 'text-emerald-500'
  } else if (negative) {
    valueClass = 'text-red-400'
    iconClass = 'text-red-500'
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <Icon className={`w-3.5 h-3.5 ${iconClass}`} />
        <span className="text-xs text-zinc-400">{label}</span>
      </div>
      <p className={`text-base font-medium ${valueClass}`}>{value}</p>
    </div>
  )
})

export default BacktestMetrics
