'use client'

import { memo } from 'react'
import { PlayIcon, PauseIcon, EllipsisHorizontalIcon } from '@heroicons/react/24/outline'
import { EmptyStrategies } from '@/components/ui/EmptyState'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/i18n/client'

interface Strategy {
  id: string
  name: string
  status: 'running' | 'paused'
  pnl: number
  trades: number
  winRate: number
}

// Demo data - strategy names are keys for i18n
const demoStrategiesData = [
  { id: '1', nameKey: 'momentum', status: 'running' as const, pnl: 18.7, trades: 45, winRate: 67.3 },
  { id: '2', nameKey: 'rsi', status: 'running' as const, pnl: 12.4, trades: 32, winRate: 62.5 },
  { id: '3', nameKey: 'macd', status: 'paused' as const, pnl: -3.2, trades: 18, winRate: 44.4 },
]

interface StrategyRowProps {
  strategy: Strategy
  t: (key: string) => string | string[] | Record<string, unknown>
}

const StrategyRow = memo(function StrategyRow({ strategy, t }: StrategyRowProps) {
  const isRunning = strategy.status === 'running'
  const isProfitable = strategy.pnl >= 0
  const tradesLabel = t('dashboard.components.activeStrategies.trades') as string

  return (
    <div className="flex items-center justify-between py-2 group">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
            isRunning
              ? 'text-emerald-500 hover:bg-emerald-500/10'
              : 'text-zinc-500 hover:bg-zinc-500/10'
          }`}
          aria-label={isRunning
            ? t('dashboard.components.activeStrategies.pause') as string
            : t('dashboard.components.activeStrategies.resume') as string}
        >
          {isRunning ? <PauseIcon className="w-3.5 h-3.5" /> : <PlayIcon className="w-3.5 h-3.5" />}
        </button>
        <div>
          <span className="text-sm text-white">{strategy.name}</span>
          <div className="text-xs text-zinc-400">
            {strategy.trades} {tradesLabel} · {strategy.winRate}%
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className={`text-sm font-medium ${isProfitable ? 'text-emerald-500' : 'text-red-500'}`}>
          {isProfitable ? '+' : ''}{strategy.pnl}%
        </span>
        <button
          type="button"
          className="w-6 h-6 rounded flex items-center justify-center text-zinc-400 hover:text-zinc-400 hover:bg-white/[0.05] opacity-0 group-hover:opacity-100 transition-all"
          aria-label={t('dashboard.components.activeStrategies.menu') as string}
        >
          <EllipsisHorizontalIcon className="w-4 h-4" />
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

  // Build strategies with translated names
  const strategies: Strategy[] = showEmpty ? [] : demoStrategiesData.map(s => ({
    id: s.id,
    name: t(`dashboard.components.activeStrategies.demoStrategies.${s.nameKey}`) as string,
    status: s.status,
    pnl: s.pnl,
    trades: s.trades,
    winRate: s.winRate,
  }))

  if (strategies.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-zinc-400">
            {t('dashboard.components.activeStrategies.title') as string}
          </h3>
        </div>
        <EmptyStrategies onCreate={() => router.push('/dashboard/ai-strategy')} />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-zinc-400">
          {t('dashboard.components.activeStrategies.title') as string}
        </h3>
        <button type="button" className="text-xs text-zinc-400 hover:text-zinc-400 transition-colors">
          {t('dashboard.components.activeStrategies.viewAll') as string}
        </button>
      </div>
      <div className="divide-y divide-white/[0.04]">
        {strategies.map((strategy) => (
          <StrategyRow key={strategy.id} strategy={strategy} t={t} />
        ))}
      </div>
    </div>
  )
})
