'use client'

import { clsx } from 'clsx'
import {
  ArrowUpIcon,
  ArrowDownIcon,
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/solid'

interface Activity {
  id: string
  type: 'trade' | 'strategy' | 'backtest'
  title: string
  description: string
  timestamp: string
  status: 'profit' | 'loss' | 'neutral' | 'success'
  amount?: string
  icon: typeof ArrowUpIcon
}

export function RecentActivity() {
  // Mock data - replace with real data from API/WebSocket
  const activities: Activity[] = [
    {
      id: '1',
      type: 'trade',
      title: 'Bought AAPL',
      description: 'Strategy A executed buy order',
      timestamp: '2 minutes ago',
      status: 'neutral',
      amount: '10 shares @ $150.00',
      icon: ArrowUpIcon,
    },
    {
      id: '2',
      type: 'trade',
      title: 'Sold TSLA',
      description: 'Strategy B executed sell order',
      timestamp: '15 minutes ago',
      status: 'profit',
      amount: '5 shares @ $220.00 (+$45.00)',
      icon: ArrowDownIcon,
    },
    {
      id: '3',
      type: 'strategy',
      title: 'Strategy C Paused',
      description: 'Max drawdown threshold reached',
      timestamp: '1 hour ago',
      status: 'loss',
      icon: PauseIcon,
    },
    {
      id: '4',
      type: 'backtest',
      title: 'Backtest Completed',
      description: 'Strategy D backtest finished',
      timestamp: '2 hours ago',
      status: 'success',
      amount: 'Sharpe: 1.85, Win Rate: 72%',
      icon: CheckCircleIcon,
    },
    {
      id: '5',
      type: 'strategy',
      title: 'Strategy A Started',
      description: 'Resumed after manual pause',
      timestamp: '3 hours ago',
      status: 'success',
      icon: PlayIcon,
    },
  ]

  const getStatusColor = (status: Activity['status']) => {
    switch (status) {
      case 'profit':
      case 'success':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      case 'loss':
        return 'text-red-400 bg-red-500/10 border-red-500/20'
      case 'neutral':
        return 'text-zinc-400 bg-white/[0.06] border-white/[0.08]'
    }
  }

  return (
    <div className="bg-[#141416] border border-white/[0.08] rounded-xl overflow-hidden">
      <div className="divide-y divide-white/[0.06]">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-4 p-4 hover:bg-white/[0.02] transition-colors"
          >
            {/* Icon */}
            <div
              className={clsx(
                'flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border',
                getStatusColor(activity.status)
              )}
            >
              <activity.icon className="w-4 h-4" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-sm font-medium text-white truncate">
                  {activity.title}
                </p>
                <span className="text-xs text-zinc-400 flex-shrink-0">
                  {activity.timestamp}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mb-1">{activity.description}</p>
              {activity.amount && (
                <p
                  className={clsx(
                    'text-xs font-medium',
                    activity.status === 'profit'
                      ? 'text-emerald-400'
                      : activity.status === 'loss'
                      ? 'text-red-400'
                      : 'text-zinc-400'
                  )}
                >
                  {activity.amount}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* View All Button */}
      <div className="p-3 border-t border-white/[0.06] bg-white/[0.02]">
        <button className="w-full text-center text-xs text-zinc-400 hover:text-white transition-colors">
          View All Activity →
        </button>
      </div>
    </div>
  )
}
