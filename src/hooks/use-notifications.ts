// ============================================
// useNotifications Hook
// 실시간 알림 React Hook
// ============================================

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { notificationService } from '@/lib/notifications'
import type {
  Notification,
  NotificationSettings,
  NotificationType,
  NotificationPriority,
} from '@/lib/notifications/types'

// ============================================
// Types
// ============================================

interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  isConnected: boolean
  settings: NotificationSettings
  // Actions
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  deleteNotification: (id: string) => void
  clearAll: () => void
  updateSettings: (settings: Partial<NotificationSettings>) => void
  // Local notifications
  notify: (
    type: NotificationType,
    title: string,
    message: string,
    options?: {
      priority?: NotificationPriority
      data?: Record<string, unknown>
      actionUrl?: string
      actionLabel?: string
    }
  ) => Notification
  // Connection
  connect: (userId: string) => void
  disconnect: () => void
  // Filters
  filterByType: (type: NotificationType) => Notification[]
  filterUnread: () => Notification[]
}

// ============================================
// Hook
// ============================================

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [settings, setSettings] = useState<NotificationSettings>(
    notificationService.getSettings()
  )

  // Load settings on mount
  useEffect(() => {
    notificationService.loadSettings()
    setSettings(notificationService.getSettings())
  }, [])

  // Subscribe to notifications
  useEffect(() => {
    // Update notifications list
    const updateNotifications = () => {
      setNotifications(notificationService.getNotifications())
    }

    // Listen for new notifications
    const unsubscribeNotification = notificationService.onNotification(() => {
      updateNotifications()
    })

    // Listen for connection changes
    const unsubscribeConnection = notificationService.onConnectionChange((connected) => {
      setIsConnected(connected)
    })

    // Initial load
    updateNotifications()
    setIsConnected(notificationService.getConnectionStatus())

    return () => {
      unsubscribeNotification()
      unsubscribeConnection()
    }
  }, [])

  // Memoized unread count
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length
  }, [notifications])

  // Actions
  const markAsRead = useCallback((id: string) => {
    notificationService.markAsRead(id)
    setNotifications(notificationService.getNotifications())
  }, [])

  const markAllAsRead = useCallback(() => {
    notificationService.markAllAsRead()
    setNotifications(notificationService.getNotifications())
  }, [])

  const deleteNotification = useCallback((id: string) => {
    notificationService.delete(id)
    setNotifications(notificationService.getNotifications())
  }, [])

  const clearAll = useCallback(() => {
    notificationService.clearAll()
    setNotifications([])
  }, [])

  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    notificationService.updateSettings(newSettings)
    setSettings(notificationService.getSettings())
  }, [])

  const notify = useCallback(
    (
      type: NotificationType,
      title: string,
      message: string,
      options?: {
        priority?: NotificationPriority
        data?: Record<string, unknown>
        actionUrl?: string
        actionLabel?: string
      }
    ): Notification => {
      const notification = notificationService.createLocalNotification(
        type,
        title,
        message,
        options
      )
      setNotifications(notificationService.getNotifications())
      return notification
    },
    []
  )

  const connect = useCallback((userId: string) => {
    notificationService.connect(userId)
  }, [])

  const disconnect = useCallback(() => {
    notificationService.disconnect()
  }, [])

  // Filters
  const filterByType = useCallback(
    (type: NotificationType): Notification[] => {
      return notifications.filter((n) => n.type === type)
    },
    [notifications]
  )

  const filterUnread = useCallback((): Notification[] => {
    return notifications.filter((n) => !n.read)
  }, [notifications])

  return {
    notifications,
    unreadCount,
    isConnected,
    settings,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    updateSettings,
    notify,
    connect,
    disconnect,
    filterByType,
    filterUnread,
  }
}

// ============================================
// Specialized Hooks
// ============================================

/**
 * 가격 알림 전용 훅
 */
export function usePriceAlerts() {
  const { notifications, notify, ...rest } = useNotifications()

  const priceAlerts = useMemo(() => {
    return notifications.filter((n) => n.type === 'price_alert')
  }, [notifications])

  const createPriceAlert = useCallback(
    (symbol: string, targetPrice: number, condition: 'above' | 'below') => {
      return notify('price_alert', `${symbol} 가격 알림`, `${symbol}이(가) $${targetPrice} ${condition === 'above' ? '이상' : '이하'}입니다`, {
        priority: 'high',
        data: { symbol, targetPrice, condition },
        actionUrl: `/dashboard/portfolio?symbol=${symbol}`,
        actionLabel: '확인하기',
      })
    },
    [notify]
  )

  return {
    priceAlerts,
    createPriceAlert,
    ...rest,
  }
}

/**
 * 전략 시그널 알림 전용 훅
 */
export function useStrategySignals() {
  const { notifications, notify, ...rest } = useNotifications()

  const signals = useMemo(() => {
    return notifications.filter((n) => n.type === 'strategy_signal')
  }, [notifications])

  const createSignalAlert = useCallback(
    (strategyName: string, signal: 'buy' | 'sell' | 'hold', symbol: string, confidence: number) => {
      const signalText = signal === 'buy' ? '매수' : signal === 'sell' ? '매도' : '홀드'
      return notify('strategy_signal', `${strategyName} 시그널`, `${symbol} ${signalText} 신호 (신뢰도: ${Math.round(confidence * 100)}%)`, {
        priority: 'high',
        data: { strategyName, signal, symbol, confidence },
        actionUrl: `/dashboard/strategy-builder`,
        actionLabel: '전략 확인',
      })
    },
    [notify]
  )

  return {
    signals,
    createSignalAlert,
    ...rest,
  }
}

/**
 * 셀럽 거래 알림 전용 훅
 */
export function useCelebrityTradeAlerts() {
  const { notifications, notify, ...rest } = useNotifications()

  const celebrityTrades = useMemo(() => {
    return notifications.filter((n) => n.type === 'celebrity_trade')
  }, [notifications])

  const createCelebrityAlert = useCallback(
    (celebrityName: string, action: 'buy' | 'sell', symbol: string, value: number) => {
      const actionText = action === 'buy' ? '매수' : '매도'
      return notify('celebrity_trade', `${celebrityName} 거래 감지`, `${symbol} $${value.toLocaleString()} ${actionText}`, {
        priority: 'normal',
        data: { celebrityName, action, symbol, value },
        actionUrl: `/dashboard/mirroring`,
        actionLabel: '미러링 설정',
      })
    },
    [notify]
  )

  return {
    celebrityTrades,
    createCelebrityAlert,
    ...rest,
  }
}

export default useNotifications
