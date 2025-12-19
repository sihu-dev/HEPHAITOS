'use client'

import { memo } from 'react'
import { clsx } from 'clsx'
import {
  ArrowUpIcon,
  ArrowDownIcon,
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  BellIcon,
} from '@heroicons/react/24/solid'
import { useI18n } from '@/i18n/client'
import { useRecentActivity, type Activity, type ActivityType } from '@/hooks/useRecentActivity'
import Link from 'next/link'

type ActivityStatus = 'profit' | 'loss' | 'neutral' | 'success' | 'warning'

interface DisplayActivity {
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
  trade: ArrowUpIcon,
  backtest: CheckCircleIcon,
  strategy: PlayIcon,
  notification: BellIcon,
  system: ExclamationTriangleIcon,
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

function getActivityIcon(type: ActivityType, color: Activity['color']): typeof ArrowUpIcon {
  if (type === 'trade') {
    return color === 'green' ? ArrowUpIcon : ArrowDownIcon
  }
  return activityIcons[type] || BellIcon
}

function getActivityStatus(activity: Activity): ActivityStatus {
  switch (activity.color) {
    case 'green': return 'profit'
    case 'red': return 'loss'
    case 'yellow': return 'warning'
    case 'blue': return 'success'
    default: return 'neutral'
  }
}

function formatRelativeTime(date: Date): string {
  const now = Date.now()
  const diff = now - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function transformActivity(activity: Activity): DisplayActivity {
  return {
    id: activity.id,
    type: activity.type,
    title: activity.title,
    description: activity.description,
    timestamp: formatRelativeTime(activity.timestamp),
    status: getActivityStatus(activity),
    amount: activity.metadata?.price
      ? `${activity.metadata.quantity || ''} @ $${activity.metadata.price}`
      : activity.metadata?.totalReturn
        ? `${Number(activity.metadata.totalReturn) > 0 ? '+' : ''}${activity.metadata.totalReturn}%`
        : undefined,
    meta: activity.metadata?.strategyName as string | undefined,
  }
}

const ActivityRow = memo(function ActivityRow({
  activity,
  originalActivity,
  index,
}: {
  activity: DisplayActivity
  originalActivity: Activity
  index: number
}) {
  const Icon = getActivityIcon(originalActivity.type, originalActivity.color)
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
  const { activities, isLoading } = useRecentActivity(5)

  // Transform activities for display
  const displayActivities = activities.map(transformActivity)

  return (
    <div className="card-cinematic overflow-hidden">
      {/* Activity List */}
      <div className="p-2">
        {isLoading ? (
          // Loading skeleton
          [...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start gap-4 p-4 -mx-2 rounded-xl animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-white/[0.06]" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-4 w-32 bg-white/[0.06] rounded" />
                  <div className="h-3 w-16 bg-white/[0.04] rounded" />
                </div>
                <div className="h-3 w-48 bg-white/[0.04] rounded mb-2" />
                <div className="h-6 w-24 bg-white/[0.04] rounded" />
              </div>
            </div>
          ))
        ) : displayActivities.length > 0 ? (
          displayActivities.map((activity, index) => (
            <ActivityRow
              key={activity.id}
              activity={activity}
              originalActivity={activities[index]}
              index={index}
            />
          ))
        ) : (
          <div className="py-8 text-center">
            <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-white/[0.04] flex items-center justify-center">
              <ClockIcon className="w-5 h-5 text-zinc-500" />
            </div>
            <p className="text-sm text-zinc-400">No recent activity</p>
            <p className="text-xs text-zinc-500 mt-1">Your trading activities will appear here</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/[0.06] bg-white/[0.01]">
        <Link
          href="/dashboard/history"
          className="w-full flex items-center justify-center gap-2 text-xs text-zinc-500 hover:text-white transition-colors group"
        >
          <span>View All Activity</span>
          <span className="group-hover:translate-x-0.5 transition-transform">→</span>
        </Link>
      </div>
    </div>
  )
})
