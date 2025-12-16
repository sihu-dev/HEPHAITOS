'use client'

import { memo } from 'react'
import { clsx } from 'clsx'
import {
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline'
import { MetricCard } from '@/components/ui/MetricCard'
import { useI18n } from '@/i18n/client'

interface Metric {
  label: string
  value: number
  change: number
  changeLabel: string
  format: 'currency' | 'percent' | 'number'
  icon: React.ReactNode
  variant: 'default' | 'profit' | 'loss' | 'primary'
}

export const PerformanceMetrics = memo(function PerformanceMetrics() {
  const { t } = useI18n()

  // Demo data - replace with real data from API
  const metrics: Metric[] = [
    {
      label: "Today's P&L",
      value: 567.89,
      change: 4.82,
      changeLabel: 'vs yesterday',
      format: 'currency',
      icon: <CurrencyDollarIcon className="w-5 h-5 text-emerald-400" />,
      variant: 'profit',
    },
    {
      label: 'Win Rate',
      value: 68,
      change: 5,
      changeLabel: 'vs last week',
      format: 'percent',
      icon: <ChartBarIcon className="w-5 h-5 text-[#5E6AD2]" />,
      variant: 'primary',
    },
    {
      label: 'Sharpe Ratio',
      value: 1.85,
      change: -2,
      changeLabel: 'vs last month',
      format: 'number',
      icon: <ArrowTrendingUpIcon className="w-5 h-5 text-amber-400" />,
      variant: 'default',
    },
    {
      label: 'Max Drawdown',
      value: -8.2,
      change: 0,
      changeLabel: 'no change',
      format: 'percent',
      icon: <ShieldExclamationIcon className="w-5 h-5 text-red-400" />,
      variant: 'loss',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {metrics.map((metric, index) => (
        <div
          key={metric.label}
          className="animate-fade-in"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <MetricCard
            label={metric.label}
            value={metric.value}
            change={metric.change}
            changeLabel={metric.changeLabel}
            format={metric.format}
            icon={metric.icon}
            variant={metric.variant}
            size="sm"
          />
        </div>
      ))}
    </div>
  )
})
