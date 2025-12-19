'use client'

// ============================================
// useNotifications Hook
// Supabase 연동 알림 시스템
// ============================================

import { useState, useEffect, useCallback } from 'react'
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface Notification {
  id: string
  type: 'signal' | 'trade' | 'alert' | 'system'
  title: string
  message: string
  read: boolean
  data: Record<string, unknown> | null
  createdAt: Date
}

interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  error: Error | null
  markAsRead: (id: string) => Promise<boolean>
  markAllAsRead: () => Promise<boolean>
  refetch: () => Promise<void>
}

// Demo notifications
const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: 'demo-n-1',
    type: 'trade',
    title: '주문 체결',
    message: 'NVDA 10주 매수 주문이 체결되었습니다. ($875.32)',
    read: false,
    data: { symbol: 'NVDA', side: 'buy', quantity: 10, price: 875.32 },
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: 'demo-n-2',
    type: 'signal',
    title: 'RSI 신호 발생',
    message: 'AAPL RSI가 과매도 구간(28)에 진입했습니다.',
    read: false,
    data: { symbol: 'AAPL', indicator: 'RSI', value: 28 },
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 'demo-n-3',
    type: 'alert',
    title: '손절가 도달',
    message: 'TSLA 포지션이 -5% 손절가에 도달했습니다.',
    read: true,
    data: { symbol: 'TSLA', pnlPercent: -5.2 },
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
  {
    id: 'demo-n-4',
    type: 'system',
    title: '백테스트 완료',
    message: 'RSI Momentum 전략 백테스트가 완료되었습니다. (+23.5%)',
    read: true,
    data: { strategyId: 'demo-1', totalReturn: 23.5 },
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
]

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  const fetchNotifications = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setNotifications(DEMO_NOTIFICATIONS)
      setIsLoading(false)
      return
    }

    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      setNotifications(DEMO_NOTIFICATIONS)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setNotifications(DEMO_NOTIFICATIONS)
        setIsLoading(false)
        return
      }

      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (fetchError) throw fetchError

      if (data && data.length > 0) {
        interface NotificationRow {
          id: string
          type: Notification['type']
          title: string
          message: string
          read: boolean
          data: Record<string, unknown> | null
          created_at: string
        }

        setNotifications((data as NotificationRow[]).map(row => ({
          id: row.id,
          type: row.type,
          title: row.title,
          message: row.message,
          read: row.read,
          data: row.data,
          createdAt: new Date(row.created_at),
        })))
      } else {
        setNotifications([])
      }
    } catch (err) {
      console.error('[useNotifications] Fetch error:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch notifications'))
      setNotifications(DEMO_NOTIFICATIONS)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!isSupabaseConfigured) return

    const supabase = getSupabaseBrowserClient()
    if (!supabase) return

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const notificationChannel = supabase
        .channel(`notifications:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newNotification = payload.new as {
              id: string
              type: Notification['type']
              title: string
              message: string
              read: boolean
              data: Record<string, unknown> | null
              created_at: string
            }

            setNotifications(prev => [{
              id: newNotification.id,
              type: newNotification.type,
              title: newNotification.title,
              message: newNotification.message,
              read: newNotification.read,
              data: newNotification.data,
              createdAt: new Date(newNotification.created_at),
            }, ...prev])
          }
        )
        .subscribe()

      setChannel(notificationChannel)
    }

    setupRealtime()

    return () => {
      channel?.unsubscribe()
    }
  }, [])

  // Mark single notification as read
  const markAsRead = useCallback(async (id: string): Promise<boolean> => {
    if (!isSupabaseConfigured) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
      return true
    }

    const supabase = getSupabaseBrowserClient()
    if (!supabase) return false

    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read: true } as never)
        .eq('id', id)

      if (updateError) throw updateError

      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
      return true
    } catch (err) {
      console.error('[useNotifications] Mark as read error:', err)
      return false
    }
  }, [])

  // Mark all notifications as read
  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    if (!isSupabaseConfigured) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      return true
    }

    const supabase = getSupabaseBrowserClient()
    if (!supabase) return false

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read: true } as never)
        .eq('user_id', user.id)
        .eq('read', false)

      if (updateError) throw updateError

      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      return true
    } catch (err) {
      console.error('[useNotifications] Mark all as read error:', err)
      return false
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const unreadCount = notifications.filter(n => !n.read).length

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  }
}
