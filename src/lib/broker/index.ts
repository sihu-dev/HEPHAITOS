// ============================================
// Unified Broker Module
// 증권사 통합 API
// ============================================

export * from './types'
export { KISBroker, createKISBroker } from './adapters/kis'
export { KiwoomBroker, createKiwoomBroker } from './adapters/kiwoom'
export { AlpacaBroker, createAlpacaBroker } from './adapters/alpaca'
export { BinanceBroker, createBinanceBroker } from './adapters/binance'
export { UpbitBroker, createUpbitBroker } from './adapters/upbit'

import type { BrokerId, BrokerInfo, UnifiedBroker, BrokerCredentials } from './types'
import { KISBroker } from './adapters/kis'
import { KiwoomBroker } from './adapters/kiwoom'
import { AlpacaBroker } from './adapters/alpaca'
import { BinanceBroker } from './adapters/binance'
import { UpbitBroker } from './adapters/upbit'

// ============================================
// Broker Registry
// ============================================

/**
 * 지원 증권사 목록
 */
export const SUPPORTED_BROKERS: BrokerInfo[] = [
  {
    id: 'kis',
    name: 'Korea Investment & Securities',
    nameKr: '한국투자증권',
    logo: '/brokers/kis.svg',
    status: 'supported',  // P0-4: 완전 지원 (베타)
    difficulty: 'easy',
    setupTime: '3분',
    guideUrl: 'https://apiportal.koreainvestment.com',
    features: ['REST API', '실시간 시세', '자동매매', '모의투자'],
    apiType: 'rest',
    markets: ['kr_stock'],
    paperTrading: true,
  },
  {
    id: 'kiwoom',
    name: 'Kiwoom Securities',
    nameKr: '키움증권',
    logo: '/brokers/kiwoom.svg',
    status: 'coming_soon',  // P0-4: ❌ "지원" 제거 → "준비중"으로 변경
    difficulty: 'easy',
    setupTime: '3분',
    guideUrl: 'https://openapi.kiwoom.com',
    features: ['REST API', '실시간 시세', '자동매매', '모의투자'],
    apiType: 'rest',
    markets: ['kr_stock'],
    paperTrading: true,
  },
  {
    id: 'samsung',
    name: 'Samsung Securities',
    nameKr: '삼성증권',
    logo: '/brokers/samsung.svg',
    status: 'coming_soon',  // 준비중
    difficulty: 'easy',
    setupTime: '3분',
    guideUrl: 'https://www.samsungpop.com',
    features: ['REST API', '실시간 시세'],
    apiType: 'rest',
    markets: ['kr_stock'],
    paperTrading: false,
  },
  {
    id: 'mirae',
    name: 'Mirae Asset Securities',
    nameKr: '미래에셋증권',
    logo: '/brokers/mirae.svg',
    status: 'coming_soon',  // 준비중
    difficulty: 'easy',
    setupTime: '5분',
    guideUrl: 'https://www.miraeasset.com',
    features: ['REST API', '해외주식'],
    apiType: 'rest',
    markets: ['kr_stock', 'us_stock'],
    paperTrading: false,
  },
  {
    id: 'alpaca',
    name: 'Alpaca Markets',
    nameKr: 'Alpaca (해외주식)',
    logo: '/brokers/alpaca.svg',
    status: 'supported',  // 완전 지원
    difficulty: 'very_easy',
    setupTime: '1분',
    guideUrl: 'https://alpaca.markets',
    features: ['REST API', '무료', 'Paper Trading', '미국주식'],
    apiType: 'rest',
    markets: ['us_stock'],
    paperTrading: true,
  },
  {
    id: 'binance',
    name: 'Binance',
    nameKr: '바이낸스',
    logo: '/brokers/binance.svg',
    status: 'coming_soon',  // 준비중 (GPT V1: 코인은 베타 후 추가 권장)
    difficulty: 'easy',
    setupTime: '3분',
    guideUrl: 'https://www.binance.com/en/binance-api',
    features: ['REST API', 'WebSocket', '선물', '현물'],
    apiType: 'hybrid',
    markets: ['crypto'],
    paperTrading: true,
  },
  {
    id: 'upbit',
    name: 'Upbit',
    nameKr: '업비트',
    logo: '/brokers/upbit.svg',
    status: 'coming_soon',  // 준비중 (GPT V1: 코인은 베타 후 추가 권장)
    difficulty: 'easy',
    setupTime: '3분',
    guideUrl: 'https://docs.upbit.com',
    features: ['REST API', 'WebSocket', '원화 마켓'],
    apiType: 'hybrid',
    markets: ['crypto'],
    paperTrading: false,
  },
]

/**
 * 브로커 정보 조회
 */
export function getBrokerInfo(brokerId: BrokerId): BrokerInfo | undefined {
  return SUPPORTED_BROKERS.find((b) => b.id === brokerId)
}

/**
 * 시장별 브로커 조회
 */
export function getBrokersByMarket(market: 'kr_stock' | 'us_stock' | 'crypto'): BrokerInfo[] {
  return SUPPORTED_BROKERS.filter((b) => b.markets.includes(market))
}

// ============================================
// Broker Factory
// ============================================

/**
 * 브로커 인스턴스 생성
 */
export function createBroker(brokerId: BrokerId, options?: { testnet?: boolean }): UnifiedBroker {
  switch (brokerId) {
    case 'kis':
      return new KISBroker()
    case 'kiwoom':
      return new KiwoomBroker()
    case 'alpaca':
      return new AlpacaBroker()
    case 'binance':
      return new BinanceBroker(options?.testnet ?? false)
    case 'upbit':
      return new UpbitBroker()
    case 'samsung':
    case 'mirae':
    case 'nh':
      throw new Error(`${brokerId} adapter is not yet implemented`)
    default:
      throw new Error(`Unknown broker: ${brokerId}`)
  }
}

// ============================================
// Broker Manager (Singleton with Connection Pooling)
// Based on 2026 Trading AI Trends: Grok-style real-time architecture
// ============================================

/**
 * Broker Connection Metadata
 */
interface BrokerConnection {
  broker: UnifiedBroker
  lastUsed: Date
  createdAt: Date
  userId: string
  brokerId: BrokerId
}

/**
 * Connection Health Status (inspired by QuantConnect monitoring)
 */
interface ConnectionHealth {
  isHealthy: boolean
  lastCheck: Date
  errorCount: number
}

/**
 * Retry Configuration (exponential backoff)
 */
interface RetryOptions {
  maxAttempts?: number
  initialDelay?: number
  maxDelay?: number
  timeout?: number
}

class BrokerManager {
  private instances = new Map<string, BrokerConnection>()
  private activeConnections = new Map<string, string>() // userId -> brokerId
  private healthStatus = new Map<string, ConnectionHealth>()

  // Configuration (based on institutional trading platforms best practices)
  private readonly IDLE_TIMEOUT = 30 * 60 * 1000 // 30 minutes
  private readonly MAX_ERROR_COUNT = 3
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000 // 5 minutes
  private readonly HEALTH_CHECK_INTERVAL = 2 * 60 * 1000 // 2 minutes

  private cleanupInterval?: NodeJS.Timeout
  private healthCheckInterval?: NodeJS.Timeout

  constructor() {
    // Start background workers
    this.startCleanupWorker()
    this.startHealthMonitoring()

    // Graceful shutdown on process termination
    if (typeof process !== 'undefined') {
      process.on('SIGTERM', () => this.shutdown())
      process.on('SIGINT', () => this.shutdown())
    }
  }

  /**
   * Background worker to clean up idle connections
   * Prevents memory leak by removing unused broker instances
   */
  private startCleanupWorker(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleConnections()
    }, this.CLEANUP_INTERVAL)
  }

  /**
   * Health monitoring worker (Grok-style real-time monitoring)
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(() => {
      this.checkConnectionsHealth()
    }, this.HEALTH_CHECK_INTERVAL)
  }

  /**
   * Remove idle connections to prevent memory bloat
   */
  private cleanupIdleConnections(): void {
    const now = Date.now()
    const keysToRemove: string[] = []

    for (const [key, connection] of this.instances) {
      const idleTime = now - connection.lastUsed.getTime()

      if (idleTime > this.IDLE_TIMEOUT) {
        console.log(
          `[BrokerManager] Cleaning up idle connection: ${key} (idle for ${Math.round(idleTime / 60000)}m)`
        )

        try {
          connection.broker.disconnect()
        } catch (error) {
          console.error(`[BrokerManager] Error disconnecting broker ${key}:`, error)
        }

        keysToRemove.push(key)
      }
    }

    // Remove from maps
    for (const key of keysToRemove) {
      this.instances.delete(key)
      this.healthStatus.delete(key)
    }

    if (keysToRemove.length > 0) {
      console.log(`[BrokerManager] Cleaned up ${keysToRemove.length} idle connections`)
    }
  }

  /**
   * Check health of active connections (QuantConnect-style monitoring)
   */
  private async checkConnectionsHealth(): Promise<void> {
    for (const [key, connection] of this.instances) {
      const health = this.healthStatus.get(key) || {
        isHealthy: true,
        lastCheck: new Date(),
        errorCount: 0,
      }

      try {
        // Simple health check: verify connection status
        if (!connection.broker.isConnected()) {
          throw new Error('Connection lost')
        }

        // Try to get balance as a liveness probe
        await connection.broker.getBalance()

        // Reset error count on success
        health.isHealthy = true
        health.errorCount = 0
        health.lastCheck = new Date()
      } catch (error) {
        health.errorCount++
        health.lastCheck = new Date()

        if (health.errorCount >= this.MAX_ERROR_COUNT) {
          health.isHealthy = false
          console.error(
            `[BrokerManager] Connection ${key} marked as unhealthy after ${health.errorCount} errors`
          )

          // Auto-remove unhealthy connection
          this.instances.delete(key)
          this.healthStatus.delete(key)

          // Also remove from active connections
          if (this.activeConnections.get(connection.userId) === connection.brokerId) {
            this.activeConnections.delete(connection.userId)
          }
        }
      }

      this.healthStatus.set(key, health)
    }
  }

  /**
   * Retry helper with exponential backoff (TradingView-style resilience)
   */
  private async retry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      initialDelay = 1000,
      maxDelay = 10000,
      timeout = 30000,
    } = options

    let lastError: Error | unknown

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Operation timed out')), timeout)
        )

        // Race between operation and timeout
        const result = await Promise.race([fn(), timeoutPromise])

        return result
      } catch (error) {
        lastError = error
        console.error(`[BrokerManager] Attempt ${attempt}/${maxAttempts} failed:`, error)

        if (attempt < maxAttempts) {
          // Exponential backoff
          const delay = Math.min(initialDelay * Math.pow(2, attempt - 1), maxDelay)
          console.log(`[BrokerManager] Retrying in ${delay}ms...`)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError
  }

  /**
   * 브로커 연결 (with retry & timeout)
   */
  async connect(
    userId: string,
    brokerId: BrokerId,
    credentials: BrokerCredentials
  ): Promise<{ success: boolean; message: string; broker?: UnifiedBroker }> {
    const key = `${userId}:${brokerId}`

    // 기존 연결이 있으면 재사용
    if (this.instances.has(key)) {
      const connection = this.instances.get(key)!

      // Update last used timestamp
      connection.lastUsed = new Date()

      if (connection.broker.isConnected()) {
        return {
          success: true,
          message: '이미 연결되어 있습니다',
          broker: connection.broker,
        }
      }
    }

    try {
      // 새로운 브로커 인스턴스 생성
      const broker = createBroker(brokerId)

      // Connect with retry logic
      const result = await this.retry(
        () => broker.connect(credentials),
        { maxAttempts: 3, timeout: 10000 }
      )

      if (result.success) {
        // Store connection metadata
        this.instances.set(key, {
          broker,
          lastUsed: new Date(),
          createdAt: new Date(),
          userId,
          brokerId,
        })

        this.activeConnections.set(userId, brokerId)

        // Initialize health status
        this.healthStatus.set(key, {
          isHealthy: true,
          lastCheck: new Date(),
          errorCount: 0,
        })

        console.log(`[BrokerManager] Successfully connected: ${key}`)
      }

      return { ...result, broker: result.success ? broker : undefined }
    } catch (error) {
      const message = error instanceof Error ? error.message : '연결 중 오류가 발생했습니다'
      console.error(`[BrokerManager] Connection failed for ${key}:`, error)

      return {
        success: false,
        message: `연결 실패: ${message}`,
      }
    }
  }

  /**
   * 브로커 연결 해제
   */
  async disconnect(userId: string, brokerId?: BrokerId): Promise<void> {
    const targetBrokerId = brokerId || this.activeConnections.get(userId)
    if (!targetBrokerId) return

    const key = `${userId}:${targetBrokerId}`
    const connection = this.instances.get(key)

    if (connection) {
      try {
        await connection.broker.disconnect()
      } catch (error) {
        console.error(`[BrokerManager] Error disconnecting ${key}:`, error)
      }

      this.instances.delete(key)
      this.healthStatus.delete(key)
    }

    if (!brokerId || brokerId === this.activeConnections.get(userId)) {
      this.activeConnections.delete(userId)
    }

    console.log(`[BrokerManager] Disconnected: ${key}`)
  }

  /**
   * 브로커 인스턴스 가져오기
   */
  getBroker(userId: string, brokerId?: BrokerId): UnifiedBroker | undefined {
    const targetBrokerId = brokerId || this.activeConnections.get(userId)
    if (!targetBrokerId) return undefined

    const key = `${userId}:${targetBrokerId}`
    const connection = this.instances.get(key)

    if (connection) {
      // Update last used timestamp
      connection.lastUsed = new Date()
      return connection.broker
    }

    return undefined
  }

  /**
   * 활성 연결 목록
   */
  getActiveConnections(userId: string): BrokerId[] {
    const connections: BrokerId[] = []
    for (const [key, connection] of this.instances) {
      if (key.startsWith(`${userId}:`) && connection.broker.isConnected()) {
        connections.push(connection.brokerId)
      }
    }
    return connections
  }

  /**
   * 연결 상태 조회 (with health info)
   */
  getConnectionStatus(userId: string, brokerId?: BrokerId): {
    connected: boolean
    healthy: boolean
    lastUsed?: Date
    errorCount?: number
  } | null {
    const targetBrokerId = brokerId || this.activeConnections.get(userId)
    if (!targetBrokerId) return null

    const key = `${userId}:${targetBrokerId}`
    const connection = this.instances.get(key)
    const health = this.healthStatus.get(key)

    if (!connection) return null

    return {
      connected: connection.broker.isConnected(),
      healthy: health?.isHealthy ?? true,
      lastUsed: connection.lastUsed,
      errorCount: health?.errorCount ?? 0,
    }
  }

  /**
   * 모든 연결 해제
   */
  async disconnectAll(userId: string): Promise<void> {
    const connections = this.getActiveConnections(userId)
    await Promise.all(connections.map((bid) => this.disconnect(userId, bid)))
  }

  /**
   * Graceful shutdown (cleanup on app termination)
   */
  shutdown(): void {
    console.log('[BrokerManager] Shutting down...')

    if (this.cleanupInterval) clearInterval(this.cleanupInterval)
    if (this.healthCheckInterval) clearInterval(this.healthCheckInterval)

    // Disconnect all brokers
    for (const [key, connection] of this.instances) {
      try {
        console.log(`[BrokerManager] Disconnecting ${key}`)
        connection.broker.disconnect()
      } catch (error) {
        console.error(`[BrokerManager] Error during shutdown for ${key}:`, error)
      }
    }

    this.instances.clear()
    this.healthStatus.clear()
    this.activeConnections.clear()

    console.log('[BrokerManager] Shutdown complete')
  }
}

/**
 * 브로커 매니저 싱글톤
 */
export const brokerManager = new BrokerManager()
