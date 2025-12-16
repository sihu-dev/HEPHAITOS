'use client'

import { memo, useState, useEffect, useRef } from 'react'
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

interface Strategy {
  id: string
  name: string
  status: 'running' | 'paused'
  pnl: number
  trades: number
  winRate: number
  riskLevel: 'low' | 'medium' | 'high'
}

// Demo data - strategy names are keys for i18n
const demoStrategiesData = [
  { id: '1', nameKey: 'momentum', status: 'running' as const, pnl: 18.7, trades: 45, winRate: 67.3, riskLevel: 'medium' as const },
  { id: '2', nameKey: 'rsi', status: 'running' as const, pnl: 12.4, trades: 32, winRate: 62.5, riskLevel: 'low' as const },
  { id: '3', nameKey: 'macd', status: 'paused' as const, pnl: -3.2, trades: 18, winRate: 44.4, riskLevel: 'high' as const },
]

interface StrategyRowProps {
  strategy: Strategy
  t: (key: string) => string | string[] | Record<string, unknown>
  index: number
}

const riskColors = {
  low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const StrategyRow = memo(function StrategyRow({ strategy, t, index }: StrategyRowProps) {
  const isRunning = strategy.status === 'running'
  const isProfitable = strategy.pnl >= 0
  const tradesLabel = t('dashboard.components.activeStrategies.trades') as string

  return (
    <div
      className={clsx(
        'relative flex items-center justify-between p-4 -mx-1 rounded-xl',
        'transition-all duration-300 group',
        'hover:bg-white/[0.03] hover:shadow-lg hover:shadow-black/20',
        'animate-fade-in'
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Status Glow */}
      {isRunning && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/5 to-transparent pointer-events-none" />
      )}

      <div className="relative flex items-center gap-4">
        {/* Play/Pause Button */}
        <button
          type="button"
          className={clsx(
            'relative w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300',
            'border backdrop-blur-lg',
            isRunning
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
              : 'bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:bg-white/[0.08] hover:text-white'
          )}
          aria-label={isRunning
            ? t('dashboard.components.activeStrategies.pause') as string
            : t('dashboard.components.activeStrategies.resume') as string}
        >
          {isRunning ? (
            <>
              <PauseIcon className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            </>
          ) : (
            <PlayIcon className="w-4 h-4" />
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
          aria-label={t('dashboard.components.activeStrategies.menu') as string}
        >
          <EllipsisHorizontalIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
})

interface ActiveStrategiesProps {
  showEmpty?: boolean
}

export const ActiveStrategies = memo(function ActiveStrategies({ showEmpty = false }: ActiveStrategiesProps) {
  const router = useRouter()
  const { t } = useI18n()
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Build strategies with translated names
    const data: Strategy[] = showEmpty ? [] : demoStrategiesData.map(s => ({
      id: s.id,
      name: t(`dashboard.components.activeStrategies.demoStrategies.${s.nameKey}`) as string,
      status: s.status,
      pnl: s.pnl,
      trades: s.trades,
      winRate: s.winRate,
      riskLevel: s.riskLevel,
    }))
    setStrategies(data)
  }, [showEmpty, t])

  // Intersection Observer: Start polling only when visible
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

  // Simulate real-time P&L updates (only when visible)
  useEffect(() => {
    if (strategies.length === 0 || !isVisible) return

    const interval = setInterval(() => {
      setStrategies(prev => prev.map(s => ({
        ...s,
        pnl: s.status === 'running'
          ? s.pnl + (Math.random() - 0.45) * 0.5
          : s.pnl,
        trades: s.status === 'running' && Math.random() > 0.8
          ? s.trades + 1
          : s.trades,
      })))
    }, 8000) // Increased from 5s to 8s

    return () => clearInterval(interval)
  }, [strategies.length, isVisible])

  if (strategies.length === 0) {
    return <EmptyStrategies onCreate={() => router.push('/dashboard/ai-strategy')} />
  }

  return (
    <div ref={containerRef} className="space-y-1">
      {strategies.map((strategy, index) => (
        <StrategyRow key={strategy.id} strategy={strategy} t={t} index={index} />
      ))}
    </div>
  )
})
