'use client'

import { useState, memo } from 'react'
import {
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarDaysIcon,
  TrashIcon,
  ChevronRightIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'
import type { BacktestResult, RiskConfig } from '@/lib/backtest'
import { useI18n } from '@/i18n/client'

// UI-specific config type for history entries
interface UIBacktestConfig {
  initialCapital: number
  symbols: string[]
  timeframe: string
  riskConfig?: RiskConfig
}

interface BacktestHistoryEntry {
  id: string
  config: UIBacktestConfig
  result: BacktestResult
  createdAt: Date
}

interface BacktestHistoryProps {
  history: BacktestHistoryEntry[]
  onSelect: (entry: BacktestHistoryEntry) => void
  onRemove: (id: string) => void
  onClear: () => void
  className?: string
}

export const BacktestHistory = memo(function BacktestHistory({
  history = [],
  onSelect,
  onRemove,
  onClear,
  className = '',
}: BacktestHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const safeHistory = history ?? []

  return (
    <div className={`bg-white/[0.02] rounded-lg border border-white/[0.06] overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClockIcon className="w-4 h-4 text-zinc-500" />
          <h3 className="text-sm font-medium text-white">백테스트 기록</h3>
          <span className="text-[10px] text-zinc-400 bg-white/[0.04] px-1.5 py-0.5 rounded">
            {safeHistory.length}
          </span>
        </div>
        {safeHistory.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-zinc-400 hover:text-red-400 transition-colors"
          >
            전체 삭제
          </button>
        )}
      </div>

      {/* History List */}
      <div className="divide-y divide-white/[0.04] max-h-96 overflow-y-auto">
        {safeHistory.length === 0 ? (
          <div className="p-6 text-center">
            <ChartBarIcon className="w-6 h-6 text-zinc-500 mx-auto mb-2" />
            <p className="text-sm text-zinc-400">백테스트 기록이 없습니다</p>
          </div>
        ) : (
          <>
            {safeHistory.map((entry) => (
              <HistoryItem
                key={entry.id}
                entry={entry}
                isExpanded={expandedId === entry.id}
                onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                onSelect={() => onSelect(entry)}
                onRemove={() => onRemove(entry.id)}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
})

interface HistoryItemProps {
  entry: BacktestHistoryEntry
  isExpanded: boolean
  onToggle: () => void
  onSelect: () => void
  onRemove: () => void
}

const HistoryItem = memo(function HistoryItem({ entry, isExpanded, onToggle, onSelect, onRemove }: HistoryItemProps) {
  const { t } = useI18n()
  const { config, result, createdAt } = entry
  const metrics = result.metrics
  const isPositive = metrics.totalReturn >= 0

  return (
    <div className="bg-white/[0.01]">
      {/* Main row */}
      <div
        className="px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] cursor-pointer transition-colors"
        onClick={onToggle}
      >
        {/* Icon */}
        <div
          className={`w-8 h-8 rounded flex items-center justify-center ${
            isPositive ? 'bg-emerald-500/10' : 'bg-red-500/10'
          }`}
        >
          {isPositive ? (
            <ArrowTrendingUpIcon className="w-4 h-4 text-emerald-400" />
          ) : (
            <ArrowTrendingDownIcon className="w-4 h-4 text-red-400" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-white truncate">
              {config.symbols.join(', ')}
            </p>
            <span className="text-xs text-zinc-400">{config.timeframe}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <CalendarDaysIcon className="w-3 h-3" />
            <span>{formatDate(createdAt)}</span>
          </div>
        </div>

        {/* Return */}
        <div className="text-right">
          <p className={`text-sm font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}{(metrics.totalReturn * 100).toFixed(2)}%
          </p>
          <p className="text-xs text-zinc-400">
            {metrics.totalTrades} 거래
          </p>
        </div>

        {/* Chevron */}
        <ChevronRightIcon
          className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${
            isExpanded ? 'rotate-90' : ''
          }`}
        />
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-4 pb-3">
          <div className="p-3 bg-white/[0.02] rounded border border-white/[0.04] space-y-3">
            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-2">
              <QuickStat label="샤프" value={metrics.sharpeRatio.toFixed(2)} />
              <QuickStat label="낙폭" value={`${(metrics.maxDrawdown * 100).toFixed(1)}%`} />
              <QuickStat label="승률" value={`${(metrics.winRate * 100).toFixed(0)}%`} />
              <QuickStat label="손익비" value={metrics.profitFactor.toFixed(2)} />
            </div>

            {/* Config Summary */}
            <div className="text-xs text-zinc-400">
              <span>초기자본: ${config.initialCapital.toLocaleString()}</span>
              <span className="mx-2">•</span>
              <span>손절: {((config.riskConfig?.stopLossPercent ?? 0) * 100).toFixed(1)}%</span>
              <span className="mx-2">•</span>
              <span>익절: {((config.riskConfig?.takeProfitPercent ?? 0) * 100).toFixed(1)}%</span>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-white/[0.04]">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect()
                }}
                className="flex-1 py-1.5 bg-white/[0.06] hover:bg-white/[0.1] rounded text-xs font-medium text-white transition-colors"
              >
                상세 보기
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove()
                }}
                className="px-2.5 py-1.5 bg-white/[0.04] hover:bg-red-500/10 rounded text-zinc-500 hover:text-red-400 transition-colors"
                aria-label={t('dashboard.backtest.history.delete') as string}
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

const QuickStat = memo(function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-[10px] text-zinc-400">{label}</p>
      <p className="text-xs font-medium text-zinc-400">{value}</p>
    </div>
  )
})

function formatDate(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (hours < 24) return `${hours}시간 전`
  if (days < 7) return `${days}일 전`

  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default BacktestHistory
