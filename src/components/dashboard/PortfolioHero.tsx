'use client'

import { useState, useMemo } from 'react'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid'
import { clsx } from 'clsx'
import { AnimatedValue } from '@/components/ui/AnimatedValue'
import { LiveIndicator } from '@/components/ui/LiveIndicator'

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

  // Generate sparkline path with gradient fill
  const { linePath, areaPath, gradientId } = useMemo(() => {
    if (sparklineData.length === 0) return { linePath: '', areaPath: '', gradientId: '' }

    const width = 400
    const height = 80
    const padding = 4

    const min = Math.min(...sparklineData)
    const max = Math.max(...sparklineData)
    const range = max - min || 1

    const points = sparklineData.map((value, i) => {
      const x = (i / (sparklineData.length - 1)) * (width - padding * 2) + padding
      const y = height - ((value - min) / range) * (height - padding * 2) - padding
      return { x, y }
    })

    const linePath = `M${points.map(p => `${p.x},${p.y}`).join(' L')}`
    const areaPath = `${linePath} L${width - padding},${height} L${padding},${height} Z`
    const gradientId = `portfolio-gradient-${isProfit ? 'profit' : 'loss'}`

    return { linePath, areaPath, gradientId }
  }, [sparklineData, isProfit])

  return (
    <div className={clsx('relative overflow-hidden', className)}>
      {/* Cinematic Background Glow */}
      <div className={clsx(
        'absolute inset-0 -z-10',
        isProfit
          ? 'bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent'
          : 'bg-gradient-to-br from-red-500/10 via-transparent to-transparent'
      )} />
      <div className={clsx(
        'absolute top-0 right-0 w-64 h-64 -z-10 blur-3xl opacity-30',
        isProfit ? 'bg-emerald-500/20' : 'bg-red-500/20'
      )} />

      {/* Main Content */}
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Portfolio Value
            </span>
            <LiveIndicator status="live" size="sm" />
          </div>
          <span className="text-xs text-zinc-500">
            Updated just now
          </span>
        </div>

        {/* Portfolio Value */}
        <div className="mb-6">
          <div className="flex items-baseline gap-4">
            <span className="text-5xl md:text-6xl font-bold text-white tracking-tight">
              <AnimatedValue
                value={totalValue}
                format="currency"
                decimals={2}
                duration={800}
              />
            </span>
            <div className={clsx(
              'inline-flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-lg',
              'backdrop-blur-lg transition-all duration-300',
              isProfit
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-red-500/15 text-red-400 border border-red-500/30'
            )}>
              {isProfit ? (
                <ArrowUpIcon className="w-4 h-4" />
              ) : (
                <ArrowDownIcon className="w-4 h-4" />
              )}
              <span className="tabular-nums">
                <AnimatedValue value={Math.abs(change)} format="currency" decimals={2} />
              </span>
              <span className="text-xs opacity-80 tabular-nums">
                ({isProfit ? '+' : ''}{changePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Enhanced Sparkline Chart */}
        {sparklineData.length > 0 && (
          <div className="mb-6 -mx-2">
            <svg
              width="100%"
              height="80"
              viewBox="0 0 400 80"
              preserveAspectRatio="none"
              className="overflow-visible"
            >
              {/* Gradient Definition */}
              <defs>
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop
                    offset="0%"
                    stopColor={isProfit ? '#22C55E' : '#EF4444'}
                    stopOpacity="0.3"
                  />
                  <stop
                    offset="100%"
                    stopColor={isProfit ? '#22C55E' : '#EF4444'}
                    stopOpacity="0"
                  />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Area Fill */}
              <path
                d={areaPath}
                fill={`url(#${gradientId})`}
                className="transition-all duration-500"
              />

              {/* Line */}
              <path
                d={linePath}
                fill="none"
                stroke={isProfit ? '#22C55E' : '#EF4444'}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow)"
                className="transition-all duration-500"
              />

              {/* End Point Dot */}
              {sparklineData.length > 0 && (
                <circle
                  cx={400 - 4}
                  cy={80 - ((sparklineData[sparklineData.length - 1] - Math.min(...sparklineData)) / (Math.max(...sparklineData) - Math.min(...sparklineData) || 1)) * (80 - 8) - 4}
                  r="4"
                  fill={isProfit ? '#22C55E' : '#EF4444'}
                  className="animate-pulse"
                />
              )}
            </svg>
          </div>
        )}

        {/* Time Range Selector */}
        <div className="flex items-center gap-1 p-1 bg-white/[0.03] rounded-lg w-fit">
          {ranges.map((range) => (
            <button
              key={range}
              onClick={() => setSelectedRange(range)}
              className={clsx(
                'px-4 py-2 text-xs font-medium rounded-md transition-all duration-200',
                selectedRange === range
                  ? clsx(
                      'text-white',
                      isProfit ? 'bg-emerald-500/20' : 'bg-red-500/20',
                      'shadow-lg'
                    )
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
