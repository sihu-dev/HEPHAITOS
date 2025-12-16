'use client'

import { memo, useState, useEffect } from 'react'
import { clsx } from 'clsx'
import {
  ArrowUpIcon,
  ArrowDownIcon,
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from '@heroicons/react/24/solid'
import { useI18n } from '@/i18n/client'

type ActivityType = 'buy' | 'sell' | 'strategy_start' | 'strategy_pause' | 'backtest' | 'alert'
type ActivityStatus = 'profit' | 'loss' | 'neutral' | 'success' | 'warning'

interface Activity {
  id: string
  type: ActivityType
  title: string
  description: string
  timestamp: string
  status: ActivityStatus
  amount?: string
  meta?: string
}

const activityIcons: Record<ActivityType, typeof ArrowUpIcon> = {
  buy: ArrowUpIcon,
  sell: ArrowDownIcon,
  strategy_start: PlayIcon,
  strategy_pause: PauseIcon,
  backtest: CheckCircleIcon,
  alert: ExclamationTriangleIcon,
}

const statusStyles: Record<ActivityStatus, { bg: string; border: string; text: string; glow: string }> = {
  profit: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-500/20',
  },
  success: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-500/20',
  },
  loss: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    glow: 'shadow-red-500/20',
  },
  warning: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    glow: 'shadow-amber-500/20',
  },
  neutral: {
    bg: 'bg-white/[0.04]',
    border: 'border-white/[0.08]',
    text: 'text-zinc-400',
    glow: '',
  },
}

const ActivityRow = memo(function ActivityRow({
  activity,
  index,
}: {
  activity: Activity
  index: number
}) {
  const Icon = activityIcons[activity.type]
  const style = statusStyles[activity.status]

  return (
    <div
      className={clsx(
        'relative flex items-start gap-4 p-4 -mx-2 rounded-xl',
        'transition-all duration-300 group',
        'hover:bg-white/[0.02]',
        'animate-fade-in'
      )}
      style={{ animationDelay: `${index * 75}ms` }}
    >
      {/* Timeline Connector */}
      {index < 4 && (
        <div className="absolute left-[30px] top-[56px] w-px h-[calc(100%-40px)] bg-gradient-to-b from-white/[0.08] to-transparent" />
      )}

      {/* Icon */}
      <div
        className={clsx(
          'relative flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl border',
          'backdrop-blur-lg transition-all duration-300',
          'group-hover:shadow-lg',
          style.bg,
          style.border,
          style.text,
          style.glow && `group-hover:${style.glow}`
        )}
      >
        <Icon className="w-4 h-4" />
        {activity.status === 'success' && (
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full flex items-center justify-center">
            <CheckCircleIcon className="w-2 h-2 text-white" />
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 py-0.5">
        <div className="flex items-center justify-between gap-3 mb-1">
          <p className="text-sm font-medium text-white truncate group-hover:text-[#7C8AEA] transition-colors">
            {activity.title}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 flex-shrink-0">
            <ClockIcon className="w-3 h-3" />
            <span>{activity.timestamp}</span>
          </div>
        </div>

        <p className="text-xs text-zinc-500 mb-2">{activity.description}</p>

        {(activity.amount || activity.meta) && (
          <div className="flex items-center gap-3">
            {activity.amount && (
              <span
                className={clsx(
                  'inline-flex items-center px-2 py-1 rounded-md text-xs font-medium',
                  'border backdrop-blur-sm',
                  style.bg,
                  style.border,
                  style.text
                )}
              >
                {activity.amount}
              </span>
            )}
            {activity.meta && (
              <span className="text-xs text-zinc-500">{activity.meta}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
})

export const RecentActivity = memo(function RecentActivity() {
  const { t } = useI18n()
  const [activities, setActivities] = useState<Activity[]>([])

  useEffect(() => {
    // Initialize with mock data
    const mockActivities: Activity[] = [
      {
        id: '1',
        type: 'buy',
        title: 'Bought AAPL',
        description: 'Momentum Strategy executed buy order',
        timestamp: '2m ago',
        status: 'neutral',
        amount: '10 shares @ $195.50',
        meta: 'Market Order',
      },
      {
        id: '2',
        type: 'sell',
        title: 'Sold TSLA',
        description: 'RSI Strategy hit profit target',
        timestamp: '15m ago',
        status: 'profit',
        amount: '+$125.00 (+5.2%)',
        meta: '5 shares',
      },
      {
        id: '3',
        type: 'strategy_pause',
        title: 'MACD Crossover Paused',
        description: 'Max drawdown threshold (8%) reached',
        timestamp: '1h ago',
        status: 'warning',
      },
      {
        id: '4',
        type: 'backtest',
        title: 'Backtest Completed',
        description: 'Mean Reversion Strategy analysis finished',
        timestamp: '2h ago',
        status: 'success',
        amount: 'Sharpe: 1.85',
        meta: 'Win Rate: 72%',
      },
      {
        id: '5',
        type: 'strategy_start',
        title: 'RSI Strategy Started',
        description: 'Resumed after configuration update',
        timestamp: '3h ago',
        status: 'success',
      },
    ]
    setActivities(mockActivities)
  }, [])

  return (
    <div className="card-cinematic overflow-hidden">
      {/* Activity List */}
      <div className="p-2">
        {activities.map((activity, index) => (
          <ActivityRow key={activity.id} activity={activity} index={index} />
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/[0.06] bg-white/[0.01]">
        <button className="w-full flex items-center justify-center gap-2 text-xs text-zinc-500 hover:text-white transition-colors group">
          <span>View All Activity</span>
          <span className="group-hover:translate-x-0.5 transition-transform">→</span>
        </button>
      </div>
    </div>
  )
})
