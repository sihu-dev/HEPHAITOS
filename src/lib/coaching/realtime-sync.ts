// ============================================
// Real-time Coaching Sync Manager
// 멘토-수강생 실시간 화면 동기화
// ============================================

import { generateId } from '@/lib/utils'
import { safeLogger } from '@/lib/utils/safe-logger';

// ============================================
// Types
// ============================================

export interface CoachingSession {
  id: string
  mentorId: string
  mentorName: string
  studentIds: string[]
  status: 'waiting' | 'active' | 'paused' | 'ended'
  currentStock?: string
  annotations: ChartAnnotation[]
  messages: ChatMessage[]
  startedAt?: Date
  endedAt?: Date
  createdAt: Date
}

export interface ChartAnnotation {
  id: string
  type: 'entry_arrow' | 'exit_arrow' | 'warning_circle' | 'text' | 'line'
  x: number
  y: number
  color: string
  text?: string
  timestamp: Date
  mentorId: string
}

export interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  senderRole: 'mentor' | 'student'
  content: string
  type: 'text' | 'trade_alert' | 'entry_signal' | 'exit_signal'
  timestamp: Date
}

export interface StockChangeEvent {
  stockCode: string
  stockName: string
  reasoning: string
  timestamp: Date
}

export interface TradeAlertEvent {
  type: 'buy' | 'sell'
  stockCode: string
  stockName: string
  price: number
  quantity: number
  reasoning: string
  timestamp: Date
}

export interface SyncCallback {
  onStockChange?: (event: StockChangeEvent) => void
  onAnnotation?: (annotation: ChartAnnotation) => void
  onMessage?: (message: ChatMessage) => void
  onTradeAlert?: (event: TradeAlertEvent) => void
  onSessionUpdate?: (session: CoachingSession) => void
}

// ============================================
// Real-time Sync Manager
// ============================================

export class RealtimeSyncManager {
  private sessions: Map<string, CoachingSession> = new Map()
  private subscribers: Map<string, Map<string, SyncCallback>> = new Map()
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private readonly MAX_RECONNECT_ATTEMPTS = 5

  /**
   * Create new coaching session
   */
  createSession(mentorId: string, mentorName: string): CoachingSession {
    const session: CoachingSession = {
      id: generateId('session'),
      mentorId,
      mentorName,
      studentIds: [],
      status: 'waiting',
      annotations: [],
      messages: [],
      createdAt: new Date(),
    }

    this.sessions.set(session.id, session)
    return session
  }

  /**
   * Join session as student
   */
  joinSession(sessionId: string, studentId: string): boolean {
    const session = this.sessions.get(sessionId)
    if (!session) return false

    if (!session.studentIds.includes(studentId)) {
      session.studentIds.push(studentId)
    }

    this.notifySubscribers(sessionId, 'onSessionUpdate', session)
    return true
  }

  /**
   * Leave session
   */
  leaveSession(sessionId: string, participantId: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) return

    if (session.mentorId === participantId) {
      // Mentor left, end session
      session.status = 'ended'
      session.endedAt = new Date()
    } else {
      // Student left
      session.studentIds = session.studentIds.filter((id) => id !== participantId)
    }

    this.notifySubscribers(sessionId, 'onSessionUpdate', session)
  }

  /**
   * Start session
   */
  startSession(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) return

    session.status = 'active'
    session.startedAt = new Date()

    this.notifySubscribers(sessionId, 'onSessionUpdate', session)
  }

  /**
   * Subscribe to session events
   */
  subscribe(sessionId: string, subscriberId: string, callbacks: SyncCallback): () => void {
    if (!this.subscribers.has(sessionId)) {
      this.subscribers.set(sessionId, new Map())
    }

    this.subscribers.get(sessionId)!.set(subscriberId, callbacks)

    return () => {
      this.subscribers.get(sessionId)?.delete(subscriberId)
    }
  }

  /**
   * Change current stock (mentor action)
   */
  changeStock(sessionId: string, event: StockChangeEvent): void {
    const session = this.sessions.get(sessionId)
    if (!session || session.status !== 'active') return

    session.currentStock = event.stockCode

    // Add system message
    const message: ChatMessage = {
      id: generateId('msg'),
      senderId: session.mentorId,
      senderName: session.mentorName,
      senderRole: 'mentor',
      content: `${event.stockName}(${event.stockCode})로 전환했습니다. ${event.reasoning}`,
      type: 'text',
      timestamp: event.timestamp,
    }
    session.messages.push(message)

    this.notifySubscribers(sessionId, 'onStockChange', event)
    this.notifySubscribers(sessionId, 'onMessage', message)
  }

  /**
   * Add annotation (mentor action)
   */
  addAnnotation(sessionId: string, annotation: Omit<ChartAnnotation, 'id' | 'timestamp'>): void {
    const session = this.sessions.get(sessionId)
    if (!session || session.status !== 'active') return

    const fullAnnotation: ChartAnnotation = {
      ...annotation,
      id: generateId('ann'),
      timestamp: new Date(),
    }

    session.annotations.push(fullAnnotation)
    this.notifySubscribers(sessionId, 'onAnnotation', fullAnnotation)
  }

  /**
   * Clear annotations
   */
  clearAnnotations(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) return

    session.annotations = []
    this.notifySubscribers(sessionId, 'onSessionUpdate', session)
  }

  /**
   * Send message
   */
  sendMessage(
    sessionId: string,
    senderId: string,
    senderName: string,
    senderRole: 'mentor' | 'student',
    content: string,
    type: ChatMessage['type'] = 'text'
  ): void {
    const session = this.sessions.get(sessionId)
    if (!session) return

    const message: ChatMessage = {
      id: generateId('msg'),
      senderId,
      senderName,
      senderRole,
      content,
      type,
      timestamp: new Date(),
    }

    session.messages.push(message)
    this.notifySubscribers(sessionId, 'onMessage', message)
  }

  /**
   * Send trade alert
   */
  sendTradeAlert(sessionId: string, event: TradeAlertEvent): void {
    const session = this.sessions.get(sessionId)
    if (!session || session.status !== 'active') return

    // Add as message
    const message: ChatMessage = {
      id: generateId('msg'),
      senderId: session.mentorId,
      senderName: session.mentorName,
      senderRole: 'mentor',
      content: `${event.type === 'buy' ? '매수' : '매도'} 체결: ${event.stockName} ${event.quantity}주 @ ${event.price.toLocaleString()}원\n${event.reasoning}`,
      type: event.type === 'buy' ? 'entry_signal' : 'exit_signal',
      timestamp: event.timestamp,
    }
    session.messages.push(message)

    this.notifySubscribers(sessionId, 'onTradeAlert', event)
    this.notifySubscribers(sessionId, 'onMessage', message)
  }

  /**
   * Get session
   */
  getSession(sessionId: string): CoachingSession | null {
    return this.sessions.get(sessionId) || null
  }

  /**
   * Get active sessions for mentor
   */
  getMentorSessions(mentorId: string): CoachingSession[] {
    return Array.from(this.sessions.values()).filter(
      (s) => s.mentorId === mentorId && s.status !== 'ended'
    )
  }

  /**
   * Get available sessions (for students to join)
   */
  getAvailableSessions(): CoachingSession[] {
    return Array.from(this.sessions.values()).filter(
      (s) => s.status === 'waiting' || s.status === 'active'
    )
  }

  /**
   * Connect to WebSocket server
   */
  connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url)

        this.ws.onopen = () => {
          safeLogger.info('[RealtimeSync] Connected')
          this.reconnectAttempts = 0
          resolve()
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(JSON.parse(event.data))
        }

        this.ws.onclose = () => {
          safeLogger.info('[RealtimeSync] Disconnected')
          this.attemptReconnect(url)
        }

        this.ws.onerror = (error) => {
          safeLogger.error('[RealtimeSync] Error:', error)
          reject(error)
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  // ============================================
  // Private Methods
  // ============================================

  private notifySubscribers(
    sessionId: string,
    eventType: keyof SyncCallback,
    data: unknown
  ): void {
    const sessionSubscribers = this.subscribers.get(sessionId)
    if (!sessionSubscribers) return

    sessionSubscribers.forEach((callbacks) => {
      const callback = callbacks[eventType] as ((data: unknown) => void) | undefined
      if (callback) {
        try {
          callback(data)
        } catch (error) {
          safeLogger.error('[RealtimeSync] Callback error:', error)
        }
      }
    })
  }

  private handleMessage(data: {
    type: string
    sessionId: string
    payload: unknown
  }): void {
    const { type, sessionId, payload } = data

    switch (type) {
      case 'stock_change':
        this.notifySubscribers(sessionId, 'onStockChange', payload)
        break
      case 'annotation':
        this.notifySubscribers(sessionId, 'onAnnotation', payload)
        break
      case 'message':
        this.notifySubscribers(sessionId, 'onMessage', payload)
        break
      case 'trade_alert':
        this.notifySubscribers(sessionId, 'onTradeAlert', payload)
        break
      case 'session_update':
        this.notifySubscribers(sessionId, 'onSessionUpdate', payload)
        break
    }
  }

  private attemptReconnect(url: string): void {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      safeLogger.error('[RealtimeSync] Max reconnect attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)

    safeLogger.info(`[RealtimeSync] Reconnecting in ${delay}ms...`)

    setTimeout(() => {
      this.connect(url).catch((error) => safeLogger.error('[RealtimeSync] Reconnect failed:', error))
    }, delay)
  }
}

// ============================================
// Singleton Instance
// ============================================

export const realtimeSyncManager = new RealtimeSyncManager()

// ============================================
// Helper Functions
// ============================================

export function createEntryAnnotation(
  x: number,
  y: number,
  mentorId: string,
  text?: string
): Omit<ChartAnnotation, 'id' | 'timestamp'> {
  return {
    type: 'entry_arrow',
    x,
    y,
    color: '#22c55e',
    text: text || '진입!',
    mentorId,
  }
}

export function createExitAnnotation(
  x: number,
  y: number,
  mentorId: string,
  text?: string
): Omit<ChartAnnotation, 'id' | 'timestamp'> {
  return {
    type: 'exit_arrow',
    x,
    y,
    color: '#ef4444',
    text: text || '청산!',
    mentorId,
  }
}

export function createWarningAnnotation(
  x: number,
  y: number,
  mentorId: string,
  text?: string
): Omit<ChartAnnotation, 'id' | 'timestamp'> {
  return {
    type: 'warning_circle',
    x,
    y,
    color: '#f59e0b',
    text: text || '주의!',
    mentorId,
  }
}
