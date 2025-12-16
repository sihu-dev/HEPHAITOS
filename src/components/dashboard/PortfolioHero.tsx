'use client'

import { useState } from 'react'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid'
import { clsx } from 'clsx'

type TimeRange = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL'

interface PortfolioHeroProps {
  totalValue: number
  change: number
  changePercent: number
  sparklineData?: number[]
  className?: string
}

export function PortfolioHero({
  totalValue,
  change,
  changePercent,
  sparklineData = [],
  className,
}: PortfolioHeroProps) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1D')

  const isProfit = change >= 0
  const ranges: TimeRange[] = ['1D', '1W', '1M', '3M', '1Y', 'ALL']

  // Generate sparkline path
  const generateSparklinePath = (data: number[]) => {
    if (data.length === 0) return ''

    const width = 200
    const height = 40
    const padding = 4

    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1

    const points = data.map((value, i) => {
      const x = (i / (data.length - 1)) * (width - padding * 2) + padding
      const y = height - ((value - min) / range) * (height - padding * 2) - padding
      return `${x},${y}`
    })

    return `M${points.join(' L')}`
  }

  const sparklinePath = generateSparklinePath(sparklineData)

  return (
    <div className={clsx('relative overflow-hidden', className)}>
      {/* Background Gradient Glow */}
      <div className={clsx(
        'absolute inset-0 -z-10 opacity-20 blur-3xl',
        isProfit ? 'bg-gradient-to-r from-emerald-500/20 to-transparent' : 'bg-gradient-to-r from-red-500/20 to-transparent'
      )} />

      {/* Main Content */}
      <div className="relative">
        {/* Portfolio Value */}
        <div className="mb-3">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            Portfolio Value
          </span>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-5xl font-semibold text-white tracking-tight">
              ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={clsx(
              'inline-flex items-center gap-1.5 text-sm font-medium px-2.5 py-1 rounded-md',
              isProfit
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            )}>
              {isProfit ? (
                <ArrowUpIcon className="w-3 h-3" />
              ) : (
                <ArrowDownIcon className="w-3 h-3" />
              )}
              <span>
                ${Math.abs(change).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs opacity-80">
                ({isProfit ? '+' : ''}{changePercent.toFixed(2)}%)
              </span>
            </span>
          </div>
        </div>

        {/* Sparkline Chart */}
        {sparklineData.length > 0 && (
          <div className="mb-4">
            <svg
              width="200"
              height="40"
              className="text-current"
              viewBox="0 0 200 40"
              preserveAspectRatio="none"
            >
              <path
                d={sparklinePath}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={isProfit ? 'text-emerald-400' : 'text-red-400'}
              />
            </svg>
          </div>
        )}

        {/* Time Range Selector */}
        <div className="flex items-center gap-1">
          {ranges.map((range) => (
            <button
              key={range}
              onClick={() => setSelectedRange(range)}
              className={clsx(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200',
                selectedRange === range
                  ? 'bg-white/[0.12] text-white border border-white/[0.12]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
