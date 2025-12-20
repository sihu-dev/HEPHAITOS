'use client'


import Link from 'next/link'
import { useState } from 'react'
import { clsx } from 'clsx'
import {
  PlusIcon,
  SparklesIcon,
  PlayIcon,
  PauseIcon,
  EllipsisHorizontalIcon,
  ChartBarIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { useI18n } from '@/i18n/client'
import { useStrategies, type Strategy } from '@/hooks/useStrategies'
import { LiveIndicator } from '@/components/ui/LiveIndicator'

export function StrategiesContent() {
  const { t } = useI18n()
  const { strategies, isLoading, updateStrategy, deleteStrategy } = useStrategies()
  const [filter, setFilter] = useState<'all' | 'running' | 'paused' | 'draft'>('all')

  const filteredStrategies = strategies.filter(s => {
    if (filter === 'all') return true
    if (filter === 'running') return s.status === 'running'
    if (filter === 'paused') return s.status === 'paused' || s.status === 'stopped'
    if (filter === 'draft') return s.status === 'draft' || s.status === 'ready'
    return true
  })

  const handleToggleStatus = async (strategy: Strategy) => {
    const newStatus = strategy.status === 'running' ? 'paused' : 'running'
    await updateStrategy(strategy.id, { status: newStatus })
  }

  const handleDelete = async (id: string) => {
    if (confirm('정말로 이 전략을 삭제하시겠습니까?')) {
      await deleteStrategy(id)
    }
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return '오늘'
    if (days === 1) return '어제'
    if (days < 7) return `${days}일 전`
    return date.toLocaleDateString('ko-KR')
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-medium text-white mb-2">
            {t('dashboard.strategies.title') as string}
          </h1>
          <p className="text-sm text-zinc-400">
            {t('dashboard.strategies.description') as string}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/ai-strategy"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#5E6AD2]/20 text-[#5E6AD2] border border-[#5E6AD2]/30 rounded-lg text-sm font-medium hover:bg-[#5E6AD2]/30 transition-colors"
          >
            <SparklesIcon className="w-4 h-4" />
            AI 생성
          </Link>
          <Link
            href="/dashboard/strategy-builder"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/[0.08] text-white rounded-lg text-sm font-medium hover:bg-white/[0.12] transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            {t('dashboard.strategies.newStrategy') as string}
          </Link>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/[0.06]" />

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'running', 'paused', 'draft'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={clsx(
              'px-3 py-1.5 rounded text-xs transition-colors',
              filter === f
                ? 'bg-white/[0.08] text-white'
                : 'text-zinc-500 hover:text-white'
            )}
          >
            {f === 'all' && '전체'}
            {f === 'running' && '실행 중'}
            {f === 'paused' && '일시정지'}
            {f === 'draft' && '초안'}
            {f !== 'all' && ` (${strategies.filter(s =>
              f === 'running' ? s.status === 'running' :
              f === 'paused' ? (s.status === 'paused' || s.status === 'stopped') :
              (s.status === 'draft' || s.status === 'ready')
            ).length})`}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-shimmer h-24 rounded-xl" />
          ))}
        </div>
      ) : filteredStrategies.length === 0 ? (
        /* Empty State */
        <div className="border border-white/[0.06] rounded-xl p-12 text-center">
          <div className="w-16 h-16 rounded-xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
            <SparklesIcon className="w-8 h-8 text-zinc-500" />
          </div>
          <h2 className="text-[16px] font-medium text-white mb-2">
            {t('dashboard.strategies.empty.title') as string}
          </h2>
          <p className="text-sm text-zinc-400 max-w-md mx-auto mb-6">
            {t('dashboard.strategies.empty.description') as string}
            <br />
            {t('dashboard.strategies.empty.example') as string}
          </p>
          <Link
            href="/dashboard/strategy-builder"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/[0.08] text-white rounded-lg text-sm font-medium hover:bg-white/[0.12] transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            {t('dashboard.strategies.createStrategy') as string}
          </Link>
        </div>
      ) : (
        /* Strategy List */
        <div className="space-y-3">
          {filteredStrategies.map((strategy, index) => {
            const isRunning = strategy.status === 'running'
            const isProfitable = (strategy.performance?.totalReturn || 0) >= 0

            return (
              <div
                key={strategy.id}
                className={clsx(
                  'relative flex items-center justify-between p-4 rounded-xl',
                  'border border-white/[0.06] bg-white/[0.02]',
                  'transition-all duration-300 group',
                  'hover:bg-white/[0.04] hover:border-white/[0.1]',
                  'animate-fade-in'
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Status Glow */}
                {isRunning && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/5 to-transparent pointer-events-none" />
                )}

                <div className="relative flex items-center gap-4">
                  {/* Play/Pause Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(strategy)}
                    className={clsx(
                      'relative w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300',
                      'border backdrop-blur-lg',
                      isRunning
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                        : 'bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:bg-white/[0.08] hover:text-white'
                    )}
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
                      <Link
                        href={`/dashboard/strategies/${strategy.id}`}
                        className="text-sm font-semibold text-white hover:text-[#5E6AD2] transition-colors"
                      >
                        {strategy.name}
                      </Link>
                      {isRunning && <LiveIndicator status="live" size="sm" />}
                      <span className={clsx(
                        'px-1.5 py-0.5 rounded text-[10px] font-medium',
                        strategy.status === 'running' && 'bg-emerald-500/20 text-emerald-400',
                        strategy.status === 'paused' && 'bg-amber-500/20 text-amber-400',
                        strategy.status === 'stopped' && 'bg-red-500/20 text-red-400',
                        strategy.status === 'draft' && 'bg-zinc-500/20 text-zinc-400',
                        strategy.status === 'ready' && 'bg-blue-500/20 text-blue-400',
                      )}>
                        {strategy.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      {strategy.description && (
                        <span className="max-w-[200px] truncate">{strategy.description}</span>
                      )}
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <ChartBarIcon className="w-3 h-3" />
                        {strategy.performance?.totalTrades || 0} trades
                      </span>
                      <span>•</span>
                      <span>{formatDate(strategy.updatedAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Performance & Actions */}
                <div className="flex items-center gap-4">
                  {strategy.performance && (
                    <div className="text-right">
                      <div className={clsx(
                        'text-lg font-bold tabular-nums',
                        isProfitable ? 'text-emerald-400' : 'text-red-400'
                      )}>
                        {isProfitable ? '+' : ''}{(strategy.performance.totalReturn || 0).toFixed(1)}%
                      </div>
                      <div className="text-xs text-zinc-500">
                        승률 {(strategy.performance.winRate || 0).toFixed(0)}%
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                      href={`/dashboard/backtest?strategy=${strategy.id}`}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors"
                    >
                      <ChartBarIcon className="w-4 h-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(strategy.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors"
                    >
                      <EllipsisHorizontalIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
