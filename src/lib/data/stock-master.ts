// ============================================
// Stock Master Data Cache
// 종목 마스터 데이터 관리 및 캐싱
// ============================================

import { getRedisClient } from '@/lib/redis/client'
import { safeLogger } from '@/lib/utils/safe-logger'

// ============================================
// Types
// ============================================

export interface StockInfo {
  symbol: string
  name: string
  nameKr?: string
  market: 'KOSPI' | 'KOSDAQ' | 'NYSE' | 'NASDAQ' | 'CRYPTO'
  exchange: string
  sector?: string
  industry?: string
  marketCap?: number
  currency: string
  country: string
  isActive: boolean
  ipoDate?: string
  delistingDate?: string
  lastUpdated: Date
}

export interface SearchResult {
  symbol: string
  name: string
  nameKr?: string
  market: string
  matchScore: number
}

// ============================================
// Cache Keys
// ============================================

const CACHE_PREFIX = 'stock:master'
const CACHE_TTL = 24 * 60 * 60 // 24 hours
const SEARCH_INDEX_PREFIX = 'stock:search'

// ============================================
// Stock Master Cache
// ============================================

class StockMasterCache {
  private memoryCache = new Map<string, StockInfo>()
  private searchIndex = new Map<string, string[]>() // keyword -> symbols
  private lastSyncTime: Date | null = null

  /**
   * 종목 정보 조회
   */
  async getStock(symbol: string): Promise<StockInfo | null> {
    // 메모리 캐시 확인
    const normalizedSymbol = symbol.toUpperCase()
    if (this.memoryCache.has(normalizedSymbol)) {
      return this.memoryCache.get(normalizedSymbol)!
    }

    // Redis 캐시 확인
    try {
      const redis = await getRedisClient()
      const cached = await redis.hget(`${CACHE_PREFIX}:data`, normalizedSymbol)

      if (cached) {
        const stockInfo = JSON.parse(cached) as StockInfo
        this.memoryCache.set(normalizedSymbol, stockInfo)
        return stockInfo
      }
    } catch (error) {
      safeLogger.error('[StockMaster] Failed to get stock from cache', { symbol, error })
    }

    return null
  }

  /**
   * 종목 정보 저장
   */
  async setStock(stock: StockInfo): Promise<void> {
    const normalizedSymbol = stock.symbol.toUpperCase()

    // 메모리 캐시 업데이트
    this.memoryCache.set(normalizedSymbol, stock)

    // 검색 인덱스 업데이트
    this.updateSearchIndex(stock)

    // Redis 캐시 업데이트
    try {
      const redis = await getRedisClient()
      await redis.hset(
        `${CACHE_PREFIX}:data`,
        normalizedSymbol,
        JSON.stringify(stock)
      )
    } catch (error) {
      safeLogger.error('[StockMaster] Failed to cache stock', { symbol: stock.symbol, error })
    }
  }

  /**
   * 여러 종목 일괄 저장
   */
  async setStocks(stocks: StockInfo[]): Promise<void> {
    for (const stock of stocks) {
      await this.setStock(stock)
    }

    safeLogger.info(`[StockMaster] Cached ${stocks.length} stocks`)
  }

  /**
   * 종목 검색
   */
  async search(query: string, options?: {
    market?: string
    limit?: number
  }): Promise<SearchResult[]> {
    const { market, limit = 20 } = options || {}
    const normalizedQuery = query.toLowerCase().trim()

    if (!normalizedQuery) return []

    const results: SearchResult[] = []
    const seen = new Set<string>()

    // 메모리 캐시에서 검색
    for (const [symbol, stock] of this.memoryCache) {
      if (seen.has(symbol)) continue
      if (market && stock.market !== market) continue

      const matchScore = this.calculateMatchScore(stock, normalizedQuery)
      if (matchScore > 0) {
        results.push({
          symbol: stock.symbol,
          name: stock.name,
          nameKr: stock.nameKr,
          market: stock.market,
          matchScore,
        })
        seen.add(symbol)
      }
    }

    // 결과 정렬 및 제한
    results.sort((a, b) => b.matchScore - a.matchScore)
    return results.slice(0, limit)
  }

  /**
   * 검색 점수 계산
   */
  private calculateMatchScore(stock: StockInfo, query: string): number {
    let score = 0

    // 심볼 정확히 일치
    if (stock.symbol.toLowerCase() === query) {
      score += 100
    }
    // 심볼이 쿼리로 시작
    else if (stock.symbol.toLowerCase().startsWith(query)) {
      score += 80
    }
    // 심볼에 쿼리 포함
    else if (stock.symbol.toLowerCase().includes(query)) {
      score += 50
    }

    // 이름 정확히 일치
    if (stock.name.toLowerCase() === query) {
      score += 90
    }
    // 이름이 쿼리로 시작
    else if (stock.name.toLowerCase().startsWith(query)) {
      score += 70
    }
    // 이름에 쿼리 포함
    else if (stock.name.toLowerCase().includes(query)) {
      score += 40
    }

    // 한글 이름 검색
    if (stock.nameKr) {
      if (stock.nameKr.includes(query)) {
        score += 60
      }
    }

    return score
  }

  /**
   * 검색 인덱스 업데이트
   */
  private updateSearchIndex(stock: StockInfo): void {
    const keywords = [
      stock.symbol.toLowerCase(),
      stock.name.toLowerCase(),
      ...(stock.nameKr ? [stock.nameKr] : []),
      ...(stock.sector ? [stock.sector.toLowerCase()] : []),
    ]

    for (const keyword of keywords) {
      // 키워드의 각 접두사를 인덱스에 추가
      for (let i = 1; i <= keyword.length && i <= 10; i++) {
        const prefix = keyword.slice(0, i)
        if (!this.searchIndex.has(prefix)) {
          this.searchIndex.set(prefix, [])
        }
        const symbols = this.searchIndex.get(prefix)!
        if (!symbols.includes(stock.symbol)) {
          symbols.push(stock.symbol)
        }
      }
    }
  }

  /**
   * 시장별 종목 목록 조회
   */
  async getStocksByMarket(market: StockInfo['market']): Promise<StockInfo[]> {
    const stocks: StockInfo[] = []

    for (const stock of this.memoryCache.values()) {
      if (stock.market === market && stock.isActive) {
        stocks.push(stock)
      }
    }

    return stocks
  }

  /**
   * 캐시 통계
   */
  getStats(): {
    memorySize: number
    searchIndexSize: number
    lastSyncTime: Date | null
  } {
    return {
      memorySize: this.memoryCache.size,
      searchIndexSize: this.searchIndex.size,
      lastSyncTime: this.lastSyncTime,
    }
  }

  /**
   * 캐시 클리어
   */
  async clear(): Promise<void> {
    this.memoryCache.clear()
    this.searchIndex.clear()
    this.lastSyncTime = null

    try {
      const redis = await getRedisClient()
      await redis.del(`${CACHE_PREFIX}:data`)
      await redis.del(`${SEARCH_INDEX_PREFIX}:*`)
    } catch (error) {
      safeLogger.error('[StockMaster] Failed to clear cache', { error })
    }
  }

  /**
   * 마지막 동기화 시간 업데이트
   */
  updateSyncTime(): void {
    this.lastSyncTime = new Date()
  }
}

// ============================================
// Korean Stock Data (KRX)
// ============================================

/**
 * KRX 종목 마스터 데이터 초기화 (예시 데이터)
 */
export async function initializeKRXStocks(): Promise<void> {
  const sampleKRXStocks: StockInfo[] = [
    {
      symbol: '005930',
      name: 'Samsung Electronics',
      nameKr: '삼성전자',
      market: 'KOSPI',
      exchange: 'KRX',
      sector: 'Technology',
      industry: 'Semiconductors',
      currency: 'KRW',
      country: 'KR',
      isActive: true,
      lastUpdated: new Date(),
    },
    {
      symbol: '000660',
      name: 'SK Hynix',
      nameKr: 'SK하이닉스',
      market: 'KOSPI',
      exchange: 'KRX',
      sector: 'Technology',
      industry: 'Semiconductors',
      currency: 'KRW',
      country: 'KR',
      isActive: true,
      lastUpdated: new Date(),
    },
    {
      symbol: '373220',
      name: 'LG Energy Solution',
      nameKr: 'LG에너지솔루션',
      market: 'KOSPI',
      exchange: 'KRX',
      sector: 'Energy',
      industry: 'Batteries',
      currency: 'KRW',
      country: 'KR',
      isActive: true,
      lastUpdated: new Date(),
    },
    {
      symbol: '035720',
      name: 'Kakao Corp',
      nameKr: '카카오',
      market: 'KOSPI',
      exchange: 'KRX',
      sector: 'Communication Services',
      industry: 'Internet',
      currency: 'KRW',
      country: 'KR',
      isActive: true,
      lastUpdated: new Date(),
    },
    {
      symbol: '035420',
      name: 'NAVER Corp',
      nameKr: '네이버',
      market: 'KOSPI',
      exchange: 'KRX',
      sector: 'Communication Services',
      industry: 'Internet',
      currency: 'KRW',
      country: 'KR',
      isActive: true,
      lastUpdated: new Date(),
    },
  ]

  await stockMasterCache.setStocks(sampleKRXStocks)
  stockMasterCache.updateSyncTime()
  safeLogger.info('[StockMaster] KRX sample stocks initialized')
}

/**
 * US 종목 마스터 데이터 초기화 (예시 데이터)
 */
export async function initializeUSStocks(): Promise<void> {
  const sampleUSStocks: StockInfo[] = [
    {
      symbol: 'AAPL',
      name: 'Apple Inc',
      market: 'NASDAQ',
      exchange: 'NASDAQ',
      sector: 'Technology',
      industry: 'Consumer Electronics',
      currency: 'USD',
      country: 'US',
      isActive: true,
      lastUpdated: new Date(),
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      market: 'NASDAQ',
      exchange: 'NASDAQ',
      sector: 'Technology',
      industry: 'Software',
      currency: 'USD',
      country: 'US',
      isActive: true,
      lastUpdated: new Date(),
    },
    {
      symbol: 'GOOGL',
      name: 'Alphabet Inc',
      market: 'NASDAQ',
      exchange: 'NASDAQ',
      sector: 'Communication Services',
      industry: 'Internet',
      currency: 'USD',
      country: 'US',
      isActive: true,
      lastUpdated: new Date(),
    },
    {
      symbol: 'AMZN',
      name: 'Amazon.com Inc',
      market: 'NASDAQ',
      exchange: 'NASDAQ',
      sector: 'Consumer Discretionary',
      industry: 'E-commerce',
      currency: 'USD',
      country: 'US',
      isActive: true,
      lastUpdated: new Date(),
    },
    {
      symbol: 'NVDA',
      name: 'NVIDIA Corporation',
      market: 'NASDAQ',
      exchange: 'NASDAQ',
      sector: 'Technology',
      industry: 'Semiconductors',
      currency: 'USD',
      country: 'US',
      isActive: true,
      lastUpdated: new Date(),
    },
    {
      symbol: 'TSLA',
      name: 'Tesla Inc',
      market: 'NASDAQ',
      exchange: 'NASDAQ',
      sector: 'Consumer Discretionary',
      industry: 'Automotive',
      currency: 'USD',
      country: 'US',
      isActive: true,
      lastUpdated: new Date(),
    },
  ]

  await stockMasterCache.setStocks(sampleUSStocks)
  stockMasterCache.updateSyncTime()
  safeLogger.info('[StockMaster] US sample stocks initialized')
}

// ============================================
// Singleton Export
// ============================================

export const stockMasterCache = new StockMasterCache()

// 데이터 모듈 인덱스 export
export { StockMasterCache }
