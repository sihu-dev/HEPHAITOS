// ============================================
// Data Fallback Manager
// Loop 19: 데이터 Fallback 설계
// ============================================

import { safeLogger } from '@/lib/utils/safe-logger'

// ============================================
// Types
// ============================================

export type DataSource =
  | 'unusual_whales'
  | 'quiver'
  | 'sec_edgar'
  | 'openinsider'
  | 'finnhub'
  | 'alpha_vantage'
  | 'yahoo_finance'
  | 'cache'

export type DataType =
  | 'congress_trades'
  | 'insider_trades'
  | 'sec_filings'
  | 'stock_quote'
  | 'market_data'
  | 'news'

export interface DataSourceConfig {
  source: DataSource
  priority: number // Lower = higher priority
  isAvailable: boolean
  lastCheck: Date | null
  failureCount: number
  cooldownUntil: Date | null
  rateLimit: {
    requests: number
    window: number // seconds
    remaining: number
    resetAt: Date | null
  }
}

export interface FallbackResult<T> {
  success: boolean
  data?: T
  source: DataSource
  usedFallback: boolean
  latency: number
  error?: string
  cached?: boolean
}

export interface FetchOptions {
  timeout?: number
  skipCache?: boolean
  maxRetries?: number
  allowedSources?: DataSource[]
}

// ============================================
// Source Priority Configuration
// ============================================

const SOURCE_PRIORITIES: Record<DataType, DataSource[]> = {
  congress_trades: ['unusual_whales', 'quiver', 'sec_edgar', 'cache'],
  insider_trades: ['unusual_whales', 'openinsider', 'sec_edgar', 'cache'],
  sec_filings: ['sec_edgar', 'cache'],
  stock_quote: ['finnhub', 'alpha_vantage', 'yahoo_finance', 'cache'],
  market_data: ['finnhub', 'alpha_vantage', 'yahoo_finance', 'cache'],
  news: ['finnhub', 'alpha_vantage', 'cache'],
}

const SOURCE_CONFIGS: Record<DataSource, Omit<DataSourceConfig, 'source'>> = {
  unusual_whales: {
    priority: 1,
    isAvailable: true,
    lastCheck: null,
    failureCount: 0,
    cooldownUntil: null,
    rateLimit: { requests: 100, window: 60, remaining: 100, resetAt: null },
  },
  quiver: {
    priority: 2,
    isAvailable: true,
    lastCheck: null,
    failureCount: 0,
    cooldownUntil: null,
    rateLimit: { requests: 60, window: 60, remaining: 60, resetAt: null },
  },
  sec_edgar: {
    priority: 3,
    isAvailable: true,
    lastCheck: null,
    failureCount: 0,
    cooldownUntil: null,
    rateLimit: { requests: 10, window: 1, remaining: 10, resetAt: null },
  },
  openinsider: {
    priority: 4,
    isAvailable: true,
    lastCheck: null,
    failureCount: 0,
    cooldownUntil: null,
    rateLimit: { requests: 30, window: 60, remaining: 30, resetAt: null },
  },
  finnhub: {
    priority: 1,
    isAvailable: true,
    lastCheck: null,
    failureCount: 0,
    cooldownUntil: null,
    rateLimit: { requests: 60, window: 60, remaining: 60, resetAt: null },
  },
  alpha_vantage: {
    priority: 2,
    isAvailable: true,
    lastCheck: null,
    failureCount: 0,
    cooldownUntil: null,
    rateLimit: { requests: 5, window: 60, remaining: 5, resetAt: null },
  },
  yahoo_finance: {
    priority: 3,
    isAvailable: true,
    lastCheck: null,
    failureCount: 0,
    cooldownUntil: null,
    rateLimit: { requests: 100, window: 60, remaining: 100, resetAt: null },
  },
  cache: {
    priority: 99,
    isAvailable: true,
    lastCheck: null,
    failureCount: 0,
    cooldownUntil: null,
    rateLimit: { requests: 1000, window: 1, remaining: 1000, resetAt: null },
  },
}

// ============================================
// Fallback Manager Class
// ============================================

export class DataFallbackManager {
  private sourceStates: Map<DataSource, DataSourceConfig> = new Map()
  private cache: Map<string, { data: unknown; expires: Date }> = new Map()
  private readonly FAILURE_THRESHOLD = 3
  private readonly COOLDOWN_DURATION = 5 * 60 * 1000 // 5 minutes
  private readonly DEFAULT_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  constructor() {
    this.initializeSources()
  }

  private initializeSources(): void {
    for (const [source, config] of Object.entries(SOURCE_CONFIGS)) {
      this.sourceStates.set(source as DataSource, {
        source: source as DataSource,
        ...config,
      })
    }
  }

  // ============================================
  // Main Fetch Method with Fallback
  // ============================================

  async fetchWithFallback<T>(
    dataType: DataType,
    fetchers: Partial<Record<DataSource, () => Promise<T>>>,
    cacheKey: string,
    options: FetchOptions = {}
  ): Promise<FallbackResult<T>> {
    const startTime = Date.now()
    const {
      timeout = 10000,
      skipCache = false,
      maxRetries = 1,
      allowedSources,
    } = options

    // Check cache first
    if (!skipCache) {
      const cached = this.getFromCache<T>(cacheKey)
      if (cached) {
        return {
          success: true,
          data: cached,
          source: 'cache',
          usedFallback: false,
          latency: Date.now() - startTime,
          cached: true,
        }
      }
    }

    // Get ordered sources for this data type
    const sources = this.getOrderedSources(dataType, allowedSources)

    // Try each source in order
    for (const source of sources) {
      if (source === 'cache') continue // Already checked

      const fetcher = fetchers[source]
      if (!fetcher) continue

      // Check if source is available
      if (!this.isSourceAvailable(source)) {
        safeLogger.debug(`[Fallback] Skipping ${source} - not available`)
        continue
      }

      // Check rate limit
      if (!this.checkRateLimit(source)) {
        safeLogger.debug(`[Fallback] Skipping ${source} - rate limited`)
        continue
      }

      // Try fetching
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const data = await this.fetchWithTimeout(fetcher, timeout)

          // Success - update state and cache
          this.recordSuccess(source)
          this.setCache(cacheKey, data)

          return {
            success: true,
            data,
            source,
            usedFallback: source !== sources[0],
            latency: Date.now() - startTime,
          }
        } catch (error) {
          const isLastAttempt = attempt === maxRetries
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'

          if (isLastAttempt) {
            this.recordFailure(source, errorMessage)
            safeLogger.warn(`[Fallback] ${source} failed`, {
              error: errorMessage,
              attempt: attempt + 1,
            })
          }
        }
      }
    }

    // All sources failed - try cache as last resort
    const staleCache = this.getFromCache<T>(cacheKey, true)
    if (staleCache) {
      safeLogger.warn('[Fallback] Using stale cache')
      return {
        success: true,
        data: staleCache,
        source: 'cache',
        usedFallback: true,
        latency: Date.now() - startTime,
        cached: true,
      }
    }

    // Complete failure
    return {
      success: false,
      source: sources[sources.length - 1] || 'cache',
      usedFallback: true,
      latency: Date.now() - startTime,
      error: 'All data sources failed',
    }
  }

  // ============================================
  // Source Management
  // ============================================

  private getOrderedSources(
    dataType: DataType,
    allowedSources?: DataSource[]
  ): DataSource[] {
    let sources = SOURCE_PRIORITIES[dataType] || ['cache']

    if (allowedSources) {
      sources = sources.filter((s) => allowedSources.includes(s))
    }

    // Sort by current availability and priority
    return sources.sort((a, b) => {
      const stateA = this.sourceStates.get(a)
      const stateB = this.sourceStates.get(b)

      if (!stateA || !stateB) return 0

      // Prefer available sources
      if (stateA.isAvailable !== stateB.isAvailable) {
        return stateA.isAvailable ? -1 : 1
      }

      // Then by failure count
      if (stateA.failureCount !== stateB.failureCount) {
        return stateA.failureCount - stateB.failureCount
      }

      // Then by priority
      return stateA.priority - stateB.priority
    })
  }

  private isSourceAvailable(source: DataSource): boolean {
    const state = this.sourceStates.get(source)
    if (!state) return false

    // Check cooldown
    if (state.cooldownUntil && new Date() < state.cooldownUntil) {
      return false
    }

    return state.isAvailable
  }

  private checkRateLimit(source: DataSource): boolean {
    const state = this.sourceStates.get(source)
    if (!state) return false

    const now = new Date()

    // Reset if window expired
    if (state.rateLimit.resetAt && now >= state.rateLimit.resetAt) {
      state.rateLimit.remaining = state.rateLimit.requests
      state.rateLimit.resetAt = new Date(
        now.getTime() + state.rateLimit.window * 1000
      )
    }

    // Check remaining
    if (state.rateLimit.remaining <= 0) {
      return false
    }

    // Decrement
    state.rateLimit.remaining--

    // Set reset time if not set
    if (!state.rateLimit.resetAt) {
      state.rateLimit.resetAt = new Date(
        now.getTime() + state.rateLimit.window * 1000
      )
    }

    return true
  }

  private recordSuccess(source: DataSource): void {
    const state = this.sourceStates.get(source)
    if (!state) return

    state.failureCount = 0
    state.lastCheck = new Date()
    state.isAvailable = true
    state.cooldownUntil = null
  }

  private recordFailure(source: DataSource, error: string): void {
    const state = this.sourceStates.get(source)
    if (!state) return

    state.failureCount++
    state.lastCheck = new Date()

    // Put in cooldown if threshold reached
    if (state.failureCount >= this.FAILURE_THRESHOLD) {
      state.cooldownUntil = new Date(Date.now() + this.COOLDOWN_DURATION)
      safeLogger.warn(`[Fallback] ${source} in cooldown`, {
        failureCount: state.failureCount,
        cooldownUntil: state.cooldownUntil,
      })
    }
  }

  // ============================================
  // Cache Management
  // ============================================

  private getFromCache<T>(key: string, allowStale = false): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = new Date()
    if (!allowStale && now > entry.expires) {
      return null
    }

    return entry.data as T
  }

  private setCache<T>(key: string, data: T, ttl = this.DEFAULT_CACHE_TTL): void {
    this.cache.set(key, {
      data,
      expires: new Date(Date.now() + ttl),
    })
  }

  clearCache(): void {
    this.cache.clear()
  }

  // ============================================
  // Utility Methods
  // ============================================

  private async fetchWithTimeout<T>(
    fetcher: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return Promise.race([
      fetcher(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), timeout)
      ),
    ])
  }

  getSourceStatus(): Record<DataSource, DataSourceConfig> {
    const result: Record<string, DataSourceConfig> = {}
    for (const [source, state] of this.sourceStates.entries()) {
      result[source] = { ...state }
    }
    return result as Record<DataSource, DataSourceConfig>
  }

  resetSource(source: DataSource): void {
    const state = this.sourceStates.get(source)
    if (!state) return

    state.failureCount = 0
    state.cooldownUntil = null
    state.isAvailable = true

    safeLogger.info(`[Fallback] ${source} reset`)
  }

  disableSource(source: DataSource): void {
    const state = this.sourceStates.get(source)
    if (!state) return

    state.isAvailable = false
    safeLogger.info(`[Fallback] ${source} disabled`)
  }

  enableSource(source: DataSource): void {
    const state = this.sourceStates.get(source)
    if (!state) return

    state.isAvailable = true
    state.failureCount = 0
    state.cooldownUntil = null
    safeLogger.info(`[Fallback] ${source} enabled`)
  }
}

// ============================================
// Singleton Instance
// ============================================

let fallbackManager: DataFallbackManager | null = null

export function getDataFallbackManager(): DataFallbackManager {
  if (!fallbackManager) {
    fallbackManager = new DataFallbackManager()
  }
  return fallbackManager
}

// ============================================
// Convenience Functions
// ============================================

export async function fetchCongressTrades<T>(
  fetchers: Partial<Record<DataSource, () => Promise<T>>>,
  symbol?: string,
  options?: FetchOptions
): Promise<FallbackResult<T>> {
  const manager = getDataFallbackManager()
  const cacheKey = `congress_trades:${symbol || 'all'}`
  return manager.fetchWithFallback('congress_trades', fetchers, cacheKey, options)
}

export async function fetchInsiderTrades<T>(
  fetchers: Partial<Record<DataSource, () => Promise<T>>>,
  symbol?: string,
  options?: FetchOptions
): Promise<FallbackResult<T>> {
  const manager = getDataFallbackManager()
  const cacheKey = `insider_trades:${symbol || 'all'}`
  return manager.fetchWithFallback('insider_trades', fetchers, cacheKey, options)
}

export async function fetchStockQuote<T>(
  fetchers: Partial<Record<DataSource, () => Promise<T>>>,
  symbol: string,
  options?: FetchOptions
): Promise<FallbackResult<T>> {
  const manager = getDataFallbackManager()
  const cacheKey = `stock_quote:${symbol}`
  return manager.fetchWithFallback('stock_quote', fetchers, cacheKey, options)
}

export async function fetchSecFilings<T>(
  fetchers: Partial<Record<DataSource, () => Promise<T>>>,
  cik?: string,
  options?: FetchOptions
): Promise<FallbackResult<T>> {
  const manager = getDataFallbackManager()
  const cacheKey = `sec_filings:${cik || 'recent'}`
  return manager.fetchWithFallback('sec_filings', fetchers, cacheKey, options)
}

export default DataFallbackManager
