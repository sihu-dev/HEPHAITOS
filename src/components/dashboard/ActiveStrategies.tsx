'use client'

import { memo, useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  PlayIcon,
  PauseIcon,
  EllipsisHorizontalIcon,
  ChartBarIcon,
  BoltIcon,
} from '@heroicons/react/24/outline'
import { EmptyStrategies } from '@/components/ui/EmptyState'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/i18n/client'
import { clsx } from 'clsx'
import { AnimatedValue } from '@/components/ui/AnimatedValue'
import { LiveIndicator } from '@/components/ui/LiveIndicator'
import { useStrategies, type Strategy } from '@/hooks/useStrategies'

interface StrategyDisplay {
  id: string
  name: string
  status: 'running' | 'paused'
  pnl: number
  trades: number
  winRate: number
  riskLevel: 'low' | 'medium' | 'high'
}

interface StrategyRowProps {
  strategy: StrategyDisplay
  t: (key: string) => string | string[] | Record<string, unknown>
  index: number
  onToggle: (id: string, currentStatus: 'running' | 'paused') => void
}

const riskColors = {
  low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
}

function determineRiskLevel(maxDrawdown: number | undefined): 'low' | 'medium' | 'high' {
  if (maxDrawdown === undefined) return 'medium'
  const dd = Math.abs(maxDrawdown)
  if (dd < 10) return 'low'
  if (dd < 20) return 'medium'
  return 'high'
}

const StrategyRow = memo(function StrategyRow({ strategy, t, index, onToggle }: StrategyRowProps) {
  const isRunning = strategy.status === 'running'
  const isProfitable = strategy.pnl >= 0
  const tradesLabel = t('dashboard.components.activeStrategies.trades') as string

  return (
    <article
      className={clsx(
        'relative flex items-center justify-between p-4 -mx-1 rounded-xl',
        'transition-all duration-300 group',
        'hover:bg-white/[0.03] hover:shadow-lg hover:shadow-black/20',
        'animate-fade-in'
      )}
      style={{ animationDelay: `${index * 100}ms` }}
      aria-label={`${strategy.name} strategy, ${isRunning ? 'running' : 'paused'}, ${isProfitable ? 'profit' : 'loss'} ${Math.abs(strategy.pnl).toFixed(1)}%`}
    >
      {/* Status Glow */}
      {isRunning && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/5 to-transparent pointer-events-none" />
      )}

      <div className="relative flex items-center gap-4">
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={() => onToggle(strategy.id, strategy.status)}
          className={clsx(
            'relative w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300',
            'border backdrop-blur-lg',
            isRunning
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
              : 'bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:bg-white/[0.08] hover:text-white'
          )}
          aria-label={isRunning
            ? (t('dashboard.components.activeStrategies.pause') as string + ` ${strategy.name}`)
            : (t('dashboard.components.activeStrategies.resume') as string + ` ${strategy.name}`)}
          aria-pressed={isRunning}
        >
          {isRunning ? (
            <>
              <PauseIcon className="w-4 h-4" aria-hidden="true" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" aria-hidden="true" />
            </>
          ) : (
            <PlayIcon className="w-4 h-4" aria-hidden="true" />
          )}
        </button>

        {/* Strategy Info */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-white">{strategy.name}</span>
            {isRunning && <LiveIndicator status="live" size="sm" />}
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <ChartBarIcon className="w-3 h-3" />
              {strategy.trades} {tradesLabel}
            </span>
            <span className="flex items-center gap-1">
              <BoltIcon className="w-3 h-3" />
              {strategy.winRate}%
            </span>
            <span className={clsx(
              'px-1.5 py-0.5 rounded text-[10px] font-medium border',
              riskColors[strategy.riskLevel]
            )}>
              {strategy.riskLevel.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* P&L & Actions */}
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className={clsx(
            'text-lg font-bold tabular-nums',
            isProfitable ? 'text-emerald-400' : 'text-red-400'
          )}>
            <AnimatedValue value={strategy.pnl} format="percent" decimals={1} />
          </div>
          <div className="text-xs text-zinc-500">
            {isProfitable ? 'Profit' : 'Loss'}
          </div>
        </div>

        <button
          type="button"
          className={clsx(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            'text-zinc-500 hover:text-white hover:bg-white/[0.06]',
            'opacity-0 group-hover:opacity-100 transition-all duration-200'
          )}
          aria-label={`${t('dashboard.components.activeStrategies.menu') as string} for ${strategy.name}`}
        >
          <EllipsisHorizontalIcon className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
    </article>
  )
})

interface ActiveStrategiesProps {
  showEmpty?: boolean
}

export const ActiveStrategies = memo(function ActiveStrategies({ showEmpty = false }: ActiveStrategiesProps) {
  const router = useRouter()
  const { t } = useI18n()
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  // Fetch strategies from Supabase
  const { strategies: dbStrategies, isLoading, updateStrategy } = useStrategies({
    status: ['running', 'paused'],
    limit: 10,
  })

  // Transform DB strategies to display format
  const strategies = useMemo<StrategyDisplay[]>(() => {
    if (showEmpty) return []

    return dbStrategies.map(s => ({
      id: s.id,
      name: s.name,
      status: (s.status === 'running' ? 'running' : 'paused') as 'running' | 'paused',
      pnl: s.performance?.totalReturn ?? 0,
      trades: s.performance?.totalTrades ?? 0,
      winRate: s.performance?.winRate ?? 0,
      riskLevel: determineRiskLevel(s.performance?.maxDrawdown),
    }))
  }, [dbStrategies, showEmpty])

  // Toggle strategy status
  const handleToggle = useCallback(async (id: string, currentStatus: 'running' | 'paused') => {
    const newStatus = currentStatus === 'running' ? 'paused' : 'running'
    await updateStrategy(id, { status: newStatus })
  }, [updateStrategy])

  // Intersection Observer: Track visibility for performance
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.1 }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [])

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 rounded-xl animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/[0.06]" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-white/[0.06] rounded mb-2" />
                <div className="h-3 w-48 bg-white/[0.04] rounded" />
              </div>
              <div className="text-right">
                <div className="h-5 w-16 bg-white/[0.06] rounded mb-1" />
                <div className="h-3 w-12 bg-white/[0.04] rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (strategies.length === 0) {
    return <EmptyStrategies onCreate={() => router.push('/dashboard/ai-strategy')} />
  }

  return (
    <section
      ref={containerRef}
      className="space-y-1"
      role="region"
      aria-live="polite"
      aria-atomic="false"
      aria-label="Active trading strategies"
    >
      {strategies.map((strategy, index) => (
        <StrategyRow
          key={strategy.id}
          strategy={strategy}
          t={t}
          index={index}
          onToggle={handleToggle}
        />
      ))}
    </section>
  )
})
