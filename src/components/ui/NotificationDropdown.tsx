'use client'

import { memo, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { clsx } from 'clsx'
import {
  BellIcon,
  CheckIcon,
  TrashIcon,
  XMarkIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  SparklesIcon,
  UserGroupIcon,
  TrophyIcon,
  AcademicCapIcon,
  ExclamationCircleIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline'
import { useNotifications } from '@/hooks/use-notifications'
import type { Notification, NotificationType } from '@/lib/notifications/types'

// ============================================
// Notification Icons
// ============================================

const NotificationIcons: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  price_alert: CurrencyDollarIcon,
  trade_executed: ArrowTrendingUpIcon,
  strategy_signal: SparklesIcon,
  celebrity_trade: UserGroupIcon,
  portfolio_update: ChartBarIcon,
  system: ExclamationCircleIcon,
  achievement: TrophyIcon,
  coaching: AcademicCapIcon,
}

const NotificationColors: Record<NotificationType, string> = {
  price_alert: 'text-yellow-400 bg-yellow-400/10',
  trade_executed: 'text-emerald-400 bg-emerald-400/10',
  strategy_signal: 'text-[#7C8AEA] bg-[#5E6AD2]/10',
  celebrity_trade: 'text-amber-400 bg-amber-400/10',
  portfolio_update: 'text-blue-400 bg-blue-400/10',
  system: 'text-zinc-400 bg-zinc-400/10',
  achievement: 'text-amber-400 bg-amber-400/10',
  coaching: 'text-cyan-400 bg-cyan-400/10',
}

// ============================================
// Time Formatter
// ============================================

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  if (diffHour < 24) return `${diffHour}시간 전`
  if (diffDay < 7) return `${diffDay}일 전`

  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

// ============================================
// Notification Item Component
// ============================================

interface NotificationItemProps {
  notification: Notification
  onRead: (id: string) => void
  onDelete: (id: string) => void
  onClick: () => void
}

const NotificationItem = memo(function NotificationItem({
  notification,
  onRead,
  onDelete,
  onClick,
}: NotificationItemProps) {
  const Icon = NotificationIcons[notification.type]
  const colorClass = NotificationColors[notification.type]

  const handleClick = useCallback(() => {
    if (!notification.read) {
      onRead(notification.id)
    }
    onClick()
  }, [notification.id, notification.read, onRead, onClick])

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(notification.id)
  }, [notification.id, onDelete])

  return (
    <div
      className={clsx(
        'group relative px-3 py-3 hover:bg-white/[0.04] cursor-pointer transition-colors',
        !notification.read && 'bg-white/[0.02]'
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', colorClass)}>
          <Icon className="w-4 h-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={clsx(
              'text-sm truncate',
              notification.read ? 'text-zinc-400' : 'text-white font-medium'
            )}>
              {notification.title}
            </p>
            {!notification.read && (
              <span className="w-2 h-2 rounded-full bg-[#5E6AD2] flex-shrink-0 mt-1.5" />
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-[10px] text-zinc-600 mt-1">
            {formatTimeAgo(new Date(notification.createdAt))}
          </p>
        </div>
      </div>

      {/* Delete Button (on hover) */}
      <button
        onClick={handleDelete}
        className="absolute right-2 top-2 p-1 rounded opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.06] transition-all"
      >
        <XMarkIcon className="w-3.5 h-3.5" />
      </button>
    </div>
  )
})

// ============================================
// Empty State
// ============================================

function EmptyNotifications() {
  return (
    <div className="py-12 text-center">
      <BellIcon className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
      <p className="text-sm text-zinc-500">알림이 없습니다</p>
      <p className="text-xs text-zinc-600 mt-1">새로운 알림이 여기에 표시됩니다</p>
    </div>
  )
}

// ============================================
// Main Dropdown Component
// ============================================

interface NotificationDropdownProps {
  isOpen: boolean
  onClose: () => void
}

export const NotificationDropdown = memo(function NotificationDropdown({
  isOpen,
  onClose,
}: NotificationDropdownProps) {
  const router = useRouter()
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    notify,
  } = useNotifications()

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Demo: Add sample notification on first open
  useEffect(() => {
    if (isOpen && notifications.length === 0) {
      // Add demo notifications
      notify('strategy_signal', 'RSI 전략 시그널', 'BTCUSDT 매수 신호 감지 (신뢰도: 85%)', {
        priority: 'high',
        actionUrl: '/dashboard/strategies',
      })
      notify('celebrity_trade', 'Nancy Pelosi 거래', 'NVDA $500,000 매수', {
        priority: 'normal',
        actionUrl: '/dashboard/mirroring',
      })
      notify('system', '시스템 공지', '새로운 기능이 추가되었습니다. 확인해보세요!', {
        priority: 'low',
        actionUrl: '/docs',
      })
    }
  }, [isOpen, notifications.length, notify])

  const handleNotificationClick = useCallback((notification: Notification) => {
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
    }
    onClose()
  }, [router, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Dropdown */}
      <div className={clsx(
        'absolute right-0 top-full mt-2 w-80',
        'bg-[#111113] border border-white/[0.08] rounded-xl',
        'shadow-2xl shadow-black/50',
        'z-50 overflow-hidden',
        'animate-fade-in'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">알림</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-[#5E6AD2]/20 text-[10px] font-medium text-[#7C8AEA]">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06] transition-colors"
                title="모두 읽음 처리"
              >
                <CheckIcon className="w-4 h-4" />
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06] transition-colors"
                title="모두 삭제"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Notification List */}
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <EmptyNotifications />
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {notifications.slice(0, 10).map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={markAsRead}
                  onDelete={deleteNotification}
                  onClick={() => handleNotificationClick(notification)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-4 py-2 border-t border-white/[0.06]">
            <button
              onClick={() => {
                router.push('/dashboard/settings')
                onClose()
              }}
              className="w-full text-center text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              알림 설정 관리 →
            </button>
          </div>
        )}
      </div>
    </>
  )
})

// ============================================
// Notification Bell Button
// ============================================

interface NotificationBellProps {
  onClick: () => void
  unreadCount: number
}

export const NotificationBell = memo(function NotificationBell({
  onClick,
  unreadCount,
}: NotificationBellProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'relative w-8 h-8 rounded flex items-center justify-center',
        'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05] transition-colors'
      )}
      aria-label="알림"
    >
      <BellIcon className="w-4 h-4" />
      {unreadCount > 0 && (
        <span className={clsx(
          'absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1',
          'flex items-center justify-center',
          'rounded-full bg-[#5E6AD2] text-[10px] font-bold text-white'
        )}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  )
})

export default NotificationDropdown
