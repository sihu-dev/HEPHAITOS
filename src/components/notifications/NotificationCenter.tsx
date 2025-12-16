'use client'

// ============================================
// Notification Center Component
// 실시간 알림 센터 UI
// ============================================

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BellIcon,
  BellAlertIcon,
  CheckIcon,
  TrashIcon,
  XMarkIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  SparklesIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  ExclamationCircleIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline'
import { useNotifications } from '@/hooks/use-notifications'
import type { Notification, NotificationType } from '@/lib/notifications/types'
import { formatDistanceToNow } from 'date-fns'
import { useI18n } from '@/i18n/client'

// ============================================
// Helper Functions
// ============================================

function getNotificationIcon(type: NotificationType) {
  const icons: Record<NotificationType, React.ElementType> = {
    price_alert: CurrencyDollarIcon,
    trade_executed: ChartBarIcon,
    strategy_signal: SparklesIcon,
    celebrity_trade: UserGroupIcon,
    portfolio_update: BriefcaseIcon,
    system: ExclamationCircleIcon,
    achievement: TrophyIcon,
    coaching: AcademicCapIcon,
  }
  return icons[type] || BellIcon
}

function getNotificationColor(type: NotificationType) {
  const colors: Record<NotificationType, string> = {
    price_alert: 'text-amber-400 bg-amber-500/10',
    trade_executed: 'text-emerald-400 bg-emerald-500/10',
    strategy_signal: 'text-blue-400 bg-blue-500/10',
    celebrity_trade: 'text-purple-400 bg-purple-500/10',
    portfolio_update: 'text-cyan-400 bg-cyan-500/10',
    system: 'text-zinc-400 bg-zinc-500/10',
    achievement: 'text-yellow-400 bg-yellow-500/10',
    coaching: 'text-pink-400 bg-pink-500/10',
  }
  return colors[type] || 'text-zinc-400 bg-zinc-500/10'
}

function formatTime(date: Date) {
  return formatDistanceToNow(date, { addSuffix: true })
}

// ============================================
// Notification Item Component
// ============================================

interface NotificationItemProps {
  notification: Notification
  onRead: (id: string) => void
  onDelete: (id: string) => void
  onClick?: () => void
}

function NotificationItem({ notification, onRead, onDelete, onClick }: NotificationItemProps) {
  const { t } = useI18n()
  const Icon = getNotificationIcon(notification.type)
  const colorClass = getNotificationColor(notification.type)

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`p-3 border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors ${
        !notification.read ? 'bg-white/[0.01]' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`p-2 rounded-lg ${colorClass}`}>
          <Icon className="w-4 h-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-medium text-white truncate">
              {notification.title}
            </span>
            {!notification.read && (
              <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-zinc-400 line-clamp-2">{notification.message}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-zinc-400">
              {formatTime(notification.createdAt)}
            </span>
            {notification.actionUrl && (
              <a
                href={notification.actionUrl}
                onClick={onClick}
                className="text-xs text-amber-400 hover:text-amber-300"
              >
                {notification.actionLabel || (t('dashboard.notifications.viewAction') as string)}
              </a>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {!notification.read && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onRead(notification.id)
              }}
              className="p-1.5 rounded hover:bg-white/[0.05] text-zinc-500 hover:text-emerald-400 transition-colors"
              title={t('dashboard.notifications.markAsRead') as string}
            >
              <CheckIcon className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(notification.id)
            }}
            className="p-1.5 rounded hover:bg-white/[0.05] text-zinc-500 hover:text-red-400 transition-colors"
            title={t('dashboard.notifications.delete') as string}
          >
            <TrashIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================
// Main Component
// ============================================

interface NotificationCenterProps {
  className?: string
}

export function NotificationCenter({ className = '' }: NotificationCenterProps) {
  const { t } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications()

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className={`relative ${className}`} ref={panelRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-white/[0.05] transition-colors"
      >
        {unreadCount > 0 ? (
          <BellAlertIcon className="w-5 h-5 text-amber-400" />
        ) : (
          <BellIcon className="w-5 h-5 text-zinc-400" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-500 text-[10px] font-medium text-black flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-[#0D0D0F] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-white">{t('dashboard.notifications.title') as string}</h3>
                {!isConnected && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400">
                    {t('dashboard.notifications.offline') as string}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="px-2 py-1 text-xs text-zinc-400 hover:text-white transition-colors"
                  >
                    {t('dashboard.notifications.markAllRead') as string}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded hover:bg-white/[0.05] text-zinc-500"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <BellIcon className="w-10 h-10 mx-auto text-zinc-500 mb-3" />
                  <p className="text-sm text-zinc-400">{t('dashboard.notifications.noNotifications') as string}</p>
                </div>
              ) : (
                <AnimatePresence>
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onRead={markAsRead}
                      onDelete={deleteNotification}
                      onClick={() => setIsOpen(false)}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="flex items-center justify-between p-2 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={clearAll}
                  className="px-2 py-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  {t('dashboard.notifications.clearAll') as string}
                </button>
                <a
                  href="/dashboard/settings/notifications"
                  className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  <Cog6ToothIcon className="w-3.5 h-3.5" />
                  {t('dashboard.notifications.settings') as string}
                </a>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default NotificationCenter
