// ============================================
// Notification Types
// 실시간 알림 타입 정의
// ============================================

export type NotificationType =
  | 'price_alert'      // 가격 알림
  | 'trade_executed'   // 거래 체결
  | 'strategy_signal'  // 전략 시그널
  | 'celebrity_trade'  // 셀럽 거래 감지
  | 'portfolio_update' // 포트폴리오 업데이트
  | 'system'           // 시스템 알림
  | 'achievement'      // 달성/보상
  | 'coaching'         // 코칭 메시지

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface Notification {
  id: string
  type: NotificationType
  priority: NotificationPriority
  title: string
  message: string
  data?: Record<string, unknown>
  read: boolean
  createdAt: Date
  expiresAt?: Date
  actionUrl?: string
  actionLabel?: string
}

export interface PriceAlertData {
  symbol: string
  targetPrice: number
  currentPrice: number
  condition: 'above' | 'below'
  triggered: boolean
}

export interface TradeExecutedData {
  orderId: string
  symbol: string
  side: 'buy' | 'sell'
  quantity: number
  price: number
  total: number
}

export interface StrategySignalData {
  strategyId: string
  strategyName: string
  signal: 'buy' | 'sell' | 'hold'
  symbol: string
  confidence: number
  reason: string
}

export interface CelebrityTradeData {
  celebrityId: string
  celebrityName: string
  action: 'buy' | 'sell'
  symbol: string
  value: number
  filingDate: string
}

export interface NotificationSettings {
  email: boolean
  push: boolean
  inApp: boolean
  categories: {
    price_alert: boolean
    trade_executed: boolean
    strategy_signal: boolean
    celebrity_trade: boolean
    portfolio_update: boolean
    system: boolean
    achievement: boolean
    coaching: boolean
  }
  quietHours: {
    enabled: boolean
    start: string // HH:mm
    end: string   // HH:mm
  }
}

export interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  settings: NotificationSettings
  isConnected: boolean
}

// WebSocket 메시지 타입
export interface WSNotificationMessage {
  type: 'notification'
  action: 'new' | 'read' | 'delete' | 'clear'
  payload: Notification | string | string[]
}
