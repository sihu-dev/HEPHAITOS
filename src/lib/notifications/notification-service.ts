// ============================================
// Notification Service
// 실시간 알림 관리 서비스
// ============================================

import { safeLogger } from '@/lib/utils/safe-logger'
import type {
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationSettings,
  WSNotificationMessage,
} from './types'

// ============================================
// Default Settings
// ============================================

const DEFAULT_SETTINGS: NotificationSettings = {
  email: true,
  push: true,
  inApp: true,
  categories: {
    price_alert: true,
    trade_executed: true,
    strategy_signal: true,
    celebrity_trade: true,
    portfolio_update: true,
    system: true,
    achievement: true,
    coaching: true,
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
  },
}

// ============================================
// Notification Service Class
// ============================================

type NotificationListener = (notification: Notification) => void
type ConnectionListener = (connected: boolean) => void

class NotificationService {
  private notifications: Notification[] = []
  private settings: NotificationSettings = DEFAULT_SETTINGS
  private listeners: Set<NotificationListener> = new Set()
  private connectionListeners: Set<ConnectionListener> = new Set()
  private ws: WebSocket | null = null
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private reconnectTimer: NodeJS.Timeout | null = null
  private userId: string | null = null

  // ============================================
  // Connection Management
  // ============================================

  connect(userId: string): void {
    this.userId = userId

    // Supabase Realtime 또는 커스텀 WebSocket 서버 사용
    // 여기서는 Supabase Realtime 패턴 사용
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://realtime.hephaitos.com'

    try {
      this.ws = new WebSocket(`${wsUrl}/notifications?userId=${userId}`)
      this.setupWebSocket()
    } catch (error) {
      safeLogger.error('[NotificationService] Connection error:', error)
      this.handleReconnect()
    }
  }

  disconnect(): void {
    this.clearReconnectTimer()
    this.reconnectAttempts = 0

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }

    this.setConnected(false)
  }

  private setupWebSocket(): void {
    if (!this.ws) return

    this.ws.onopen = () => {
      safeLogger.info('[NotificationService] Connected')
      this.reconnectAttempts = 0
      this.setConnected(true)

      // 초기 알림 로드 요청
      this.send({ action: 'load', limit: 50 })
    }

    this.ws.onclose = (event) => {
      safeLogger.info('[NotificationService] Disconnected:', event.code)
      this.setConnected(false)

      if (event.code !== 1000) {
        this.handleReconnect()
      }
    }

    this.ws.onerror = (error) => {
      safeLogger.error('[NotificationService] WebSocket error:', error)
    }

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WSNotificationMessage
        this.handleMessage(message)
      } catch (error) {
        safeLogger.error('[NotificationService] Message parse error:', error)
      }
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      safeLogger.error('[NotificationService] Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    safeLogger.info(`[NotificationService] Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts})`)

    this.reconnectTimer = setTimeout(() => {
      if (this.userId) {
        this.connect(this.userId)
      }
    }, delay)
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  private setConnected(connected: boolean): void {
    this.isConnected = connected
    this.connectionListeners.forEach((listener) => listener(connected))
  }

  // ============================================
  // Message Handling
  // ============================================

  private handleMessage(message: WSNotificationMessage): void {
    switch (message.action) {
      case 'new':
        this.addNotification(message.payload as Notification)
        break
      case 'read':
        this.markAsReadInternal(message.payload as string)
        break
      case 'delete':
        this.deleteInternal(message.payload as string)
        break
      case 'clear':
        this.clearAllInternal()
        break
    }
  }

  private addNotification(notification: Notification): void {
    // 설정 확인
    if (!this.shouldShowNotification(notification)) {
      return
    }

    // 중복 체크
    const exists = this.notifications.some((n) => n.id === notification.id)
    if (exists) return

    // 추가
    this.notifications.unshift({
      ...notification,
      createdAt: new Date(notification.createdAt),
      expiresAt: notification.expiresAt ? new Date(notification.expiresAt) : undefined,
    })

    // 리스너 알림
    this.listeners.forEach((listener) => listener(notification))

    // 브라우저 알림 표시
    if (this.settings.push && 'Notification' in window) {
      this.showBrowserNotification(notification)
    }
  }

  private markAsReadInternal(id: string): void {
    const notification = this.notifications.find((n) => n.id === id)
    if (notification) {
      notification.read = true
    }
  }

  private deleteInternal(id: string): void {
    this.notifications = this.notifications.filter((n) => n.id !== id)
  }

  private clearAllInternal(): void {
    this.notifications = []
  }

  // ============================================
  // Public Methods
  // ============================================

  getNotifications(): Notification[] {
    return [...this.notifications]
  }

  getUnreadCount(): number {
    return this.notifications.filter((n) => !n.read).length
  }

  markAsRead(id: string): void {
    this.markAsReadInternal(id)
    this.send({ action: 'read', notificationId: id })
  }

  markAllAsRead(): void {
    this.notifications.forEach((n) => {
      n.read = true
    })
    this.send({ action: 'readAll' })
  }

  delete(id: string): void {
    this.deleteInternal(id)
    this.send({ action: 'delete', notificationId: id })
  }

  clearAll(): void {
    this.clearAllInternal()
    this.send({ action: 'clear' })
  }

  // ============================================
  // Local Notification Creation (for testing)
  // ============================================

  createLocalNotification(
    type: NotificationType,
    title: string,
    message: string,
    options?: {
      priority?: NotificationPriority
      data?: Record<string, unknown>
      actionUrl?: string
      actionLabel?: string
    }
  ): Notification {
    const notification: Notification = {
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      priority: options?.priority ?? 'normal',
      title,
      message,
      data: options?.data,
      read: false,
      createdAt: new Date(),
      actionUrl: options?.actionUrl,
      actionLabel: options?.actionLabel,
    }

    this.addNotification(notification)
    return notification
  }

  // ============================================
  // Settings
  // ============================================

  getSettings(): NotificationSettings {
    return { ...this.settings }
  }

  updateSettings(settings: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...settings }

    // 서버에 설정 저장
    this.send({ action: 'updateSettings', settings: this.settings })

    // 로컬 스토리지에도 저장
    try {
      localStorage.setItem('notification_settings', JSON.stringify(this.settings))
    } catch (error) {
      safeLogger.warn('[NotificationService] Failed to save settings:', error)
    }
  }

  loadSettings(): void {
    try {
      const saved = localStorage.getItem('notification_settings')
      if (saved) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
      }
    } catch (error) {
      safeLogger.warn('[NotificationService] Failed to load settings:', error)
    }
  }

  // ============================================
  // Listeners
  // ============================================

  onNotification(listener: NotificationListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  onConnectionChange(listener: ConnectionListener): () => void {
    this.connectionListeners.add(listener)
    return () => this.connectionListeners.delete(listener)
  }

  // ============================================
  // Utilities
  // ============================================

  private send(data: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  private shouldShowNotification(notification: Notification): boolean {
    // 카테고리 설정 확인
    if (!this.settings.categories[notification.type]) {
      return false
    }

    // 조용한 시간 확인
    if (this.settings.quietHours.enabled) {
      const now = new Date()
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      const { start, end } = this.settings.quietHours

      // 조용한 시간 내인지 확인
      if (start < end) {
        if (currentTime >= start && currentTime <= end) {
          return notification.priority === 'urgent'
        }
      } else {
        // 자정을 넘는 경우 (예: 22:00 ~ 08:00)
        if (currentTime >= start || currentTime <= end) {
          return notification.priority === 'urgent'
        }
      }
    }

    return true
  }

  private async showBrowserNotification(notification: Notification): Promise<void> {
    if (!('Notification' in window)) return

    if (Notification.permission === 'default') {
      await Notification.requestPermission()
    }

    if (Notification.permission === 'granted') {
      const icon = this.getNotificationIcon(notification.type)
      new Notification(notification.title, {
        body: notification.message,
        icon,
        tag: notification.id,
        data: notification,
      })
    }
  }

  private getNotificationIcon(type: NotificationType): string {
    const icons: Record<NotificationType, string> = {
      price_alert: '/icons/notification-price.png',
      trade_executed: '/icons/notification-trade.png',
      strategy_signal: '/icons/notification-strategy.png',
      celebrity_trade: '/icons/notification-celebrity.png',
      portfolio_update: '/icons/notification-portfolio.png',
      system: '/icons/notification-system.png',
      achievement: '/icons/notification-achievement.png',
      coaching: '/icons/notification-coaching.png',
    }
    return icons[type] || '/icons/notification-default.png'
  }

  getConnectionStatus(): boolean {
    return this.isConnected
  }
}

// ============================================
// Singleton Instance
// ============================================

export const notificationService = new NotificationService()
export default notificationService
