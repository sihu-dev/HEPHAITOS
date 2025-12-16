'use client'

// ============================================
// Notification Toast Component
// 실시간 팝업 알림 토스트
// ============================================

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  XMarkIcon,
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
  return icons[type] || ExclamationCircleIcon
}

function getNotificationColors(type: NotificationType) {
  const colors: Record<NotificationType, { bg: string; border: string; icon: string }> = {
    price_alert: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      icon: 'text-amber-400',
    },
    trade_executed: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      icon: 'text-emerald-400',
    },
    strategy_signal: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      icon: 'text-blue-400',
    },
    celebrity_trade: {
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/30',
      icon: 'text-purple-400',
    },
    portfolio_update: {
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/30',
      icon: 'text-cyan-400',
    },
    system: {
      bg: 'bg-zinc-500/10',
      border: 'border-zinc-500/30',
      icon: 'text-zinc-400',
    },
    achievement: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      icon: 'text-yellow-400',
    },
    coaching: {
      bg: 'bg-pink-500/10',
      border: 'border-pink-500/30',
      icon: 'text-pink-400',
    },
  }
  return colors[type] || colors.system
}

// ============================================
// Single Toast Component
// ============================================

interface ToastProps {
  notification: Notification
  onDismiss: (id: string) => void
  onAction?: () => void
}

function Toast({ notification, onDismiss, onAction }: ToastProps) {
  const { t } = useI18n()
  const Icon = getNotificationIcon(notification.type)
  const colors = getNotificationColors(notification.type)

  useEffect(() => {
    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      onDismiss(notification.id)
    }, 5000)

    return () => clearTimeout(timer)
  }, [notification.id, onDismiss])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`w-80 ${colors.bg} border ${colors.border} rounded-xl shadow-lg backdrop-blur-sm overflow-hidden`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`p-2 rounded-lg bg-white/[0.05] ${colors.icon}`}>
            <Icon className="w-5 h-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white mb-1">
              {notification.title}
            </p>
            <p className="text-xs text-zinc-400 line-clamp-2">
              {notification.message}
            </p>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={() => onDismiss(notification.id)}
            className="p-1 rounded hover:bg-white/[0.05] text-zinc-500 hover:text-white transition-colors"
            title={t('dashboard.toast.closeLabel') as string}
            aria-label={t('dashboard.toast.closeLabel') as string}
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Action Button */}
        {notification.actionUrl && (
          <div className="mt-3 pt-3 border-t border-white/[0.06]">
            <a
              href={notification.actionUrl}
              onClick={onAction}
              className={`block w-full py-1.5 text-center text-xs font-medium ${colors.icon} hover:opacity-80 transition-opacity`}
            >
              {notification.actionLabel || (t('dashboard.notifications.viewAction') as string)}
            </a>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <motion.div
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: 5, ease: 'linear' }}
        className={`h-0.5 ${colors.icon.replace('text-', 'bg-')}`}
      />
    </motion.div>
  )
}

// ============================================
// Toast Container Component
// ============================================

interface NotificationToastProps {
  maxToasts?: number
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

export function NotificationToast({
  maxToasts = 3,
  position = 'top-right',
}: NotificationToastProps) {
  const { notifications, deleteNotification, markAsRead } = useNotifications()
  const [visibleToasts, setVisibleToasts] = useState<Notification[]>([])

  // Track seen notification IDs to prevent re-showing
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set())

  // Show new notifications as toasts
  useEffect(() => {
    const unread = notifications.filter(
      (n) => !n.read && !seenIds.has(n.id)
    )

    if (unread.length > 0) {
      // Add new notifications to visible toasts
      const newToasts = unread.slice(0, maxToasts)
      setVisibleToasts((prev) => {
        const combined = [...newToasts, ...prev]
        return combined.slice(0, maxToasts)
      })

      // Mark as seen
      setSeenIds((prev) => {
        const newSet = new Set(prev)
        unread.forEach((n) => newSet.add(n.id))
        return newSet
      })
    }
  }, [notifications, maxToasts, seenIds])

  const handleDismiss = (id: string) => {
    setVisibleToasts((prev) => prev.filter((t) => t.id !== id))
    markAsRead(id)
  }

  const handleAction = (id: string) => {
    handleDismiss(id)
  }

  // Position classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  }

  return (
    <div
      className={`fixed ${positionClasses[position]} z-50 flex flex-col gap-2`}
    >
      <AnimatePresence>
        {visibleToasts.map((toast) => (
          <Toast
            key={toast.id}
            notification={toast}
            onDismiss={handleDismiss}
            onAction={() => handleAction(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

export default NotificationToast
