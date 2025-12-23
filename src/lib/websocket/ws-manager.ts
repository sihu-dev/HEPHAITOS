// ============================================
// WebSocket Manager
// Unified WebSocket connection management
// ============================================

import type { WSMessage, WSSubscription, WSEventType, Ticker } from '@/lib/exchange/types'
import type { ExchangeId } from '@/types'
import { safeLogger } from '@/lib/utils/safe-logger';

// ============================================
// Types
// ============================================

export interface WSConfig {
  url: string
  exchangeId: ExchangeId
  reconnectAttempts?: number
  reconnectDelay?: number
  heartbeatInterval?: number
  onOpen?: () => void
  onClose?: () => void
  onError?: (error: Event) => void
  onMessage?: (message: WSMessage) => void
  onReconnect?: (attempt: number) => void
}

export type WSConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting'

interface WSMessageHandler {
  type: WSEventType
  symbol?: string
  callback: (data: unknown) => void
}

// ============================================
// WebSocket Manager Class
// ============================================

export class WSManager {
  private ws: WebSocket | null = null
  private config: Required<WSConfig>
  private state: WSConnectionState = 'disconnected'
  private reconnectCount = 0
  private reconnectTimer: NodeJS.Timeout | null = null
  private heartbeatTimer: NodeJS.Timeout | null = null
  private handlers: WSMessageHandler[] = []
  private subscriptions: WSSubscription[] = []
  private messageQueue: string[] = []

  constructor(config: WSConfig) {
    this.config = {
      reconnectAttempts: 5,
      reconnectDelay: 1000,
      heartbeatInterval: 30000,
      onOpen: () => {},
      onClose: () => {},
      onError: () => {},
      onMessage: () => {},
      onReconnect: () => {},
      ...config,
    }
  }

  // ============================================
  // Connection Management
  // ============================================

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return
    }

    this.state = 'connecting'

    try {
      this.ws = new WebSocket(this.config.url)
      this.setupEventListeners()
    } catch (error) {
      safeLogger.error('[WSManager] Connection error:', error)
      this.handleReconnect()
    }
  }

  disconnect(): void {
    this.clearTimers()
    this.reconnectCount = 0
    this.state = 'disconnected'

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }
  }

  private setupEventListeners(): void {
    if (!this.ws) return

    this.ws.onopen = () => {
      this.state = 'connected'
      this.reconnectCount = 0
      this.config.onOpen()
      this.startHeartbeat()
      this.flushMessageQueue()
      this.resubscribeAll()
    }

    this.ws.onclose = (event) => {
      this.state = 'disconnected'
      this.config.onClose()
      this.clearTimers()

      // Auto-reconnect if not intentional close
      if (event.code !== 1000) {
        this.handleReconnect()
      }
    }

    this.ws.onerror = (error) => {
      safeLogger.error('[WSManager] WebSocket error:', error)
      this.config.onError(error)
    }

    this.ws.onmessage = (event) => {
      try {
        const message = this.parseMessage(event.data)
        if (message) {
          this.config.onMessage(message)
          this.dispatchToHandlers(message)
        }
      } catch (error) {
        safeLogger.error('[WSManager] Message parse error:', error)
      }
    }
  }

  private handleReconnect(): void {
    if (this.reconnectCount >= this.config.reconnectAttempts) {
      safeLogger.error('[WSManager] Max reconnection attempts reached')
      return
    }

    this.state = 'reconnecting'
    this.reconnectCount++

    const delay = this.config.reconnectDelay * Math.pow(2, this.reconnectCount - 1)
    this.config.onReconnect(this.reconnectCount)

    this.reconnectTimer = setTimeout(() => {
      this.connect()
    }, delay)
  }

  // ============================================
  // Heartbeat
  // ============================================

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping', timestamp: Date.now() })
      }
    }, this.config.heartbeatInterval)
  }

  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  // ============================================
  // Subscriptions
  // ============================================

  subscribe(subscription: WSSubscription): void {
    const exists = this.subscriptions.some(
      (s) => s.type === subscription.type && s.symbol === subscription.symbol
    )

    if (!exists) {
      this.subscriptions.push(subscription)
    }

    if (this.isConnected()) {
      this.sendSubscribe(subscription)
    }
  }

  unsubscribe(subscription: WSSubscription): void {
    this.subscriptions = this.subscriptions.filter(
      (s) => !(s.type === subscription.type && s.symbol === subscription.symbol)
    )

    if (this.isConnected()) {
      this.sendUnsubscribe(subscription)
    }
  }

  private resubscribeAll(): void {
    for (const sub of this.subscriptions) {
      this.sendSubscribe(sub)
    }
  }

  private sendSubscribe(subscription: WSSubscription): void {
    // Format varies by exchange - this is a generic format
    // Override in exchange-specific implementations
    this.send({
      action: 'subscribe',
      channel: subscription.type,
      symbol: subscription.symbol,
      interval: subscription.interval,
    })
  }

  private sendUnsubscribe(subscription: WSSubscription): void {
    this.send({
      action: 'unsubscribe',
      channel: subscription.type,
      symbol: subscription.symbol,
    })
  }

  // ============================================
  // Message Handling
  // ============================================

  onMessage(type: WSEventType, callback: (data: unknown) => void, symbol?: string): () => void {
    const handler: WSMessageHandler = { type, symbol, callback }
    this.handlers.push(handler)

    // Return unsubscribe function
    return () => {
      const index = this.handlers.indexOf(handler)
      if (index > -1) {
        this.handlers.splice(index, 1)
      }
    }
  }

  private dispatchToHandlers(message: WSMessage): void {
    for (const handler of this.handlers) {
      if (handler.type === message.type) {
        if (!handler.symbol || handler.symbol === message.symbol) {
          handler.callback(message.data)
        }
      }
    }
  }

  private parseMessage(data: string): WSMessage | null {
    try {
      const parsed = JSON.parse(data)

      // Handle ping/pong
      if (parsed.type === 'pong' || parsed.event === 'pong') {
        return null
      }

      // Generic message format - override for exchange-specific
      return {
        type: parsed.type || parsed.channel || 'unknown',
        symbol: parsed.symbol || parsed.s,
        data: parsed.data || parsed,
        timestamp: parsed.timestamp || parsed.T || Date.now(),
      }
    } catch {
      safeLogger.warn('[WSManager] Failed to parse message:', data)
      return null
    }
  }

  // ============================================
  // Send Methods
  // ============================================

  send(data: unknown): void {
    const message = JSON.stringify(data)

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(message)
    } else {
      this.messageQueue.push(message)
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected()) {
      const message = this.messageQueue.shift()
      if (message && this.ws) {
        this.ws.send(message)
      }
    }
  }

  // ============================================
  // Utilities
  // ============================================

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  getState(): WSConnectionState {
    return this.state
  }

  getSubscriptions(): WSSubscription[] {
    return [...this.subscriptions]
  }
}

// ============================================
// Factory Function
// ============================================

export function createWSManager(config: WSConfig): WSManager {
  return new WSManager(config)
}
