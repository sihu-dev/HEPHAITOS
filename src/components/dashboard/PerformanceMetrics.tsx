'use client'

import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid'
import { clsx } from 'clsx'

interface Metric {
  label: string
  value: string
  change?: number
  changeLabel?: string
  icon?: 'up' | 'down' | 'neutral'
}

export function PerformanceMetrics() {
  // Mock data - replace with real data from API
  const metrics: Metric[] = [
    {
      label: "Today's P&L",
      value: '$567.89',
      change: 4.82,
      changeLabel: '+4.82%',
      icon: 'up',
    },
    {
      label: 'Win Rate',
      value: '68%',
      change: 5,
      changeLabel: '+5% vs last week',
      icon: 'up',
    },
    {
      label: 'Sharpe Ratio',
      value: '1.85',
      change: -2,
      changeLabel: '-2% vs last month',
      icon: 'down',
    },
    {
      label: 'Max Drawdown',
      value: '-8.2%',
      change: 0,
      changeLabel: 'No change',
      icon: 'neutral',
    },
  ]

  return (
    <div className="space-y-3">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="p-4 bg-[#141416] border border-white/[0.08] rounded-lg hover:border-white/[0.12] transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              {metric.label}
            </span>
            {metric.icon !== 'neutral' && (
              <div
                className={clsx(
                  'flex items-center gap-1 text-xs font-medium',
                  metric.icon === 'up' ? 'text-emerald-400' : 'text-red-400'
                )}
              >
                {metric.icon === 'up' ? (
                  <ArrowUpIcon className="w-3 h-3" />
                ) : (
                  <ArrowDownIcon className="w-3 h-3" />
                )}
                {metric.changeLabel}
              </div>
            )}
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-white">
              {metric.value}
            </span>
          </div>

          {/* Mini Progress Bar or Chart */}
          {metric.change !== undefined && metric.change !== 0 && (
            <div className="mt-3 h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className={clsx(
                  'h-full rounded-full transition-all',
                  metric.change > 0 ? 'bg-emerald-500' : 'bg-red-500'
                )}
                style={{ width: `${Math.min(Math.abs(metric.change) * 10, 100)}%` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
