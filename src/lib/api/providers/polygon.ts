// ============================================
// Polygon.io API Provider
// US Market Data API Integration
// ============================================

import { requirePolygonConfig } from '@/lib/config/env'

// ============================================
// Types
// ============================================

export interface PolygonConfig {
  apiKey: string
  plan?: 'basic' | 'starter' | 'developer' | 'advanced' // 플랜에 따라 요청 제한 다름
}

export interface TickerDetails {
  ticker: string
  name: string
  market: string
  locale: string
  primaryExchange: string
  type: string
  currencyName: string
  marketCap?: number
  shareClassSharesOutstanding?: number
  description?: string
  homepageUrl?: string
  totalEmployees?: number
  listDate?: string
  sicCode?: string
  sicDescription?: string
}

export interface StockPrice {
  symbol: string
  price: number
  change: number
  changePercent: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  vwap: number
  timestamp: Date
}

export interface OHLCV {
  date: Date
  open: number
  high: number
  low: number
  close: number
  volume: number
  vwap?: number
  transactions?: number
}

export interface Trade {
  price: number
  size: number
  exchange: number
  timestamp: Date
  conditions: number[]
}

export interface Quote {
  bidPrice: number
  bidSize: number
  askPrice: number
  askSize: number
  bidExchange: number
  askExchange: number
  timestamp: Date
}

export interface NewsArticle {
  id: string
  publisher: {
    name: string
    homepageUrl: string
    logoUrl: string
  }
  title: string
  author: string
  publishedUtc: Date
  articleUrl: string
  tickers: string[]
  imageUrl?: string
  description?: string
  keywords?: string[]
}

export interface FinancialReport {
  ticker: string
  period: string
  fiscalYear: number
  fiscalQuarter: number
  revenues?: number
  netIncome?: number
  eps?: number
  grossProfit?: number
  operatingIncome?: number
  assets?: number
  liabilities?: number
  equity?: number
}

export interface MarketStatus {
  market: string
  serverTime: Date
  exchanges: Record<string, string>
  currencies: Record<string, string>
}

// ============================================
// Polygon API Provider
// ============================================

class PolygonProvider {
  private apiKey: string = ''
  private baseUrl: string = 'https://api.polygon.io'
  private plan: string = 'basic'

  // ============================================
  // Configuration
  // ============================================

  configure(config: PolygonConfig) {
    this.apiKey = config.apiKey
    this.plan = config.plan || 'basic'
  }

  /**
   * 환경변수에서 자동 설정 (lazy initialization)
   */
  configureFromEnv(): void {
    const envConfig = requirePolygonConfig()
    this.configure({
      apiKey: envConfig.apiKey,
      plan: envConfig.plan,
    })
  }

  private ensureConfig() {
    if (!this.apiKey) {
      // 환경변수에서 자동 설정 시도
      try {
        this.configureFromEnv()
      } catch {
        throw new Error('Polygon API not configured. Call configure() first or set POLYGON_API_KEY.')
      }
    }
  }

  private async request<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    this.ensureConfig()

    const url = new URL(`${this.baseUrl}${endpoint}`)
    url.searchParams.set('apiKey', this.apiKey)
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })

    const response = await fetch(url.toString())

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `Polygon API error: ${response.status}`)
    }

    return response.json()
  }

  // ============================================
  // Reference Data - 종목 정보
  // ============================================

  /**
   * 종목 상세 정보
   */
  async getTickerDetails(ticker: string): Promise<TickerDetails> {
    const data = await this.request<{ results: Record<string, unknown> }>(
      `/v3/reference/tickers/${ticker.toUpperCase()}`
    )

    const r = data.results

    return {
      ticker: r.ticker as string,
      name: r.name as string,
      market: r.market as string,
      locale: r.locale as string,
      primaryExchange: r.primary_exchange as string,
      type: r.type as string,
      currencyName: r.currency_name as string,
      marketCap: r.market_cap as number | undefined,
      shareClassSharesOutstanding: r.share_class_shares_outstanding as number | undefined,
      description: r.description as string | undefined,
      homepageUrl: r.homepage_url as string | undefined,
      totalEmployees: r.total_employees as number | undefined,
      listDate: r.list_date as string | undefined,
      sicCode: r.sic_code as string | undefined,
      sicDescription: r.sic_description as string | undefined,
    }
  }

  /**
   * 종목 검색
   */
  async searchTickers(
    query: string,
    options: {
      type?: 'CS' | 'ETF' | 'INDEX' // Common Stock, ETF, Index
      market?: 'stocks' | 'crypto' | 'fx'
      limit?: number
    } = {}
  ): Promise<TickerDetails[]> {
    const params: Record<string, string> = {
      search: query,
      active: 'true',
      limit: String(options.limit || 20),
    }

    if (options.type) params.type = options.type
    if (options.market) params.market = options.market

    const data = await this.request<{ results: Record<string, unknown>[] }>(
      '/v3/reference/tickers',
      params
    )

    return (data.results || []).map((r) => ({
      ticker: r.ticker as string,
      name: r.name as string,
      market: r.market as string,
      locale: r.locale as string,
      primaryExchange: r.primary_exchange as string,
      type: r.type as string,
      currencyName: r.currency_name as string,
    }))
  }

  // ============================================
  // Market Data - 시세 조회
  // ============================================

  /**
   * 현재가 조회 (스냅샷)
   */
  async getCurrentPrice(ticker: string): Promise<StockPrice> {
    const data = await this.request<{ ticker: Record<string, unknown> }>(
      `/v2/snapshot/locale/us/markets/stocks/tickers/${ticker.toUpperCase()}`
    )

    const t = data.ticker
    const day = t.day as Record<string, number>
    const prevDay = t.prevDay as Record<string, number>

    const change = day.c - prevDay.c
    const changePercent = (change / prevDay.c) * 100

    return {
      symbol: t.ticker as string,
      price: day.c,
      change,
      changePercent,
      open: day.o,
      high: day.h,
      low: day.l,
      close: day.c,
      volume: day.v,
      vwap: day.vw,
      timestamp: new Date(t.updated as number),
    }
  }

  /**
   * 여러 종목 현재가 조회
   */
  async getMultiplePrices(tickers: string[]): Promise<StockPrice[]> {
    const tickerStr = tickers.map((t) => t.toUpperCase()).join(',')

    const data = await this.request<{ tickers: Record<string, unknown>[] }>(
      `/v2/snapshot/locale/us/markets/stocks/tickers`,
      { tickers: tickerStr }
    )

    return (data.tickers || []).map((t) => {
      const day = t.day as Record<string, number>
      const prevDay = t.prevDay as Record<string, number>
      const change = day.c - prevDay.c

      return {
        symbol: t.ticker as string,
        price: day.c,
        change,
        changePercent: (change / prevDay.c) * 100,
        open: day.o,
        high: day.h,
        low: day.l,
        close: day.c,
        volume: day.v,
        vwap: day.vw,
        timestamp: new Date(t.updated as number),
      }
    })
  }

  /**
   * OHLCV 데이터 조회 (일봉/주봉/월봉)
   */
  async getOHLCV(
    ticker: string,
    timeframe: 'day' | 'week' | 'month' | 'quarter' | 'year',
    from: string, // YYYY-MM-DD
    to: string, // YYYY-MM-DD
    options: {
      adjusted?: boolean
      sort?: 'asc' | 'desc'
      limit?: number
    } = {}
  ): Promise<OHLCV[]> {
    const data = await this.request<{ results: Record<string, number>[] }>(
      `/v2/aggs/ticker/${ticker.toUpperCase()}/range/1/${timeframe}/${from}/${to}`,
      {
        adjusted: String(options.adjusted !== false),
        sort: options.sort || 'asc',
        limit: String(options.limit || 5000),
      }
    )

    return (data.results || []).map((r) => ({
      date: new Date(r.t),
      open: r.o,
      high: r.h,
      low: r.l,
      close: r.c,
      volume: r.v,
      vwap: r.vw,
      transactions: r.n,
    }))
  }

  /**
   * 분봉 데이터 조회
   */
  async getMinuteOHLCV(
    ticker: string,
    multiplier: number, // 1, 5, 15, 30, 60 등
    from: string, // YYYY-MM-DD
    to: string,
    options: {
      adjusted?: boolean
      sort?: 'asc' | 'desc'
      limit?: number
    } = {}
  ): Promise<OHLCV[]> {
    const data = await this.request<{ results: Record<string, number>[] }>(
      `/v2/aggs/ticker/${ticker.toUpperCase()}/range/${multiplier}/minute/${from}/${to}`,
      {
        adjusted: String(options.adjusted !== false),
        sort: options.sort || 'asc',
        limit: String(options.limit || 5000),
      }
    )

    return (data.results || []).map((r) => ({
      date: new Date(r.t),
      open: r.o,
      high: r.h,
      low: r.l,
      close: r.c,
      volume: r.v,
      vwap: r.vw,
      transactions: r.n,
    }))
  }

  /**
   * 이전 종가 조회
   */
  async getPreviousClose(ticker: string): Promise<OHLCV> {
    const data = await this.request<{ results: Record<string, number>[] }>(
      `/v2/aggs/ticker/${ticker.toUpperCase()}/prev`
    )

    const r = data.results[0]

    return {
      date: new Date(r.t),
      open: r.o,
      high: r.h,
      low: r.l,
      close: r.c,
      volume: r.v,
      vwap: r.vw,
    }
  }

  // ============================================
  // Real-time Data (WebSocket)
  // ============================================

  /**
   * WebSocket 연결 URL 생성
   */
  getWebSocketUrl(feed: 'stocks' | 'options' | 'forex' | 'crypto'): string {
    this.ensureConfig()
    return `wss://socket.polygon.io/${feed}`
  }

  /**
   * WebSocket 인증 메시지
   */
  getAuthMessage(): string {
    return JSON.stringify({ action: 'auth', params: this.apiKey })
  }

  /**
   * WebSocket 구독 메시지
   */
  getSubscribeMessage(tickers: string[], type: 'T' | 'Q' | 'A' = 'T'): string {
    // T: Trades, Q: Quotes, A: Aggregates (second)
    const channels = tickers.map((t) => `${type}.${t.toUpperCase()}`)
    return JSON.stringify({ action: 'subscribe', params: channels.join(',') })
  }

  // ============================================
  // News - 뉴스
  // ============================================

  /**
   * 종목 관련 뉴스 조회
   */
  async getNews(
    ticker?: string,
    options: {
      limit?: number
      order?: 'asc' | 'desc'
      publishedBefore?: string
      publishedAfter?: string
    } = {}
  ): Promise<NewsArticle[]> {
    const params: Record<string, string> = {
      limit: String(options.limit || 20),
      order: options.order || 'desc',
    }

    if (ticker) params.ticker = ticker.toUpperCase()
    if (options.publishedBefore) params['published_utc.lt'] = options.publishedBefore
    if (options.publishedAfter) params['published_utc.gt'] = options.publishedAfter

    const data = await this.request<{ results: Record<string, unknown>[] }>(
      '/v2/reference/news',
      params
    )

    return (data.results || []).map((r) => ({
      id: r.id as string,
      publisher: r.publisher as { name: string; homepageUrl: string; logoUrl: string },
      title: r.title as string,
      author: r.author as string,
      publishedUtc: new Date(r.published_utc as string),
      articleUrl: r.article_url as string,
      tickers: r.tickers as string[],
      imageUrl: r.image_url as string | undefined,
      description: r.description as string | undefined,
      keywords: r.keywords as string[] | undefined,
    }))
  }

  // ============================================
  // Market Status
  // ============================================

  /**
   * 시장 상태 조회
   */
  async getMarketStatus(): Promise<MarketStatus> {
    const data = await this.request<Record<string, unknown>>('/v1/marketstatus/now')

    return {
      market: data.market as string,
      serverTime: new Date(data.serverTime as string),
      exchanges: data.exchanges as Record<string, string>,
      currencies: data.currencies as Record<string, string>,
    }
  }

  /**
   * 휴장일 조회
   */
  async getMarketHolidays(): Promise<
    Array<{
      exchange: string
      name: string
      date: string
      status: string
    }>
  > {
    const data = await this.request<
      Array<{ exchange: string; name: string; date: string; status: string }>
    >('/v1/marketstatus/upcoming')
    return data
  }

  // ============================================
  // Financials - 재무제표
  // ============================================

  /**
   * 재무제표 조회
   */
  async getFinancials(
    ticker: string,
    options: {
      type?: 'Y' | 'Q' | 'T' // Yearly, Quarterly, TTM
      limit?: number
    } = {}
  ): Promise<FinancialReport[]> {
    const params: Record<string, string> = {
      ticker: ticker.toUpperCase(),
      limit: String(options.limit || 10),
    }

    if (options.type) params.timeframe = options.type === 'Y' ? 'annual' : 'quarterly'

    const data = await this.request<{ results: Record<string, unknown>[] }>(
      '/vX/reference/financials',
      params
    )

    return (data.results || []).map((r) => {
      const financials = r.financials as Record<string, unknown>
      const income = financials.income_statement as Record<string, Record<string, number>> | undefined
      const balance = financials.balance_sheet as Record<string, Record<string, number>> | undefined

      return {
        ticker: r.ticker as string,
        period: r.fiscal_period as string,
        fiscalYear: r.fiscal_year as number,
        fiscalQuarter: r.fiscal_period === 'FY' ? 0 : parseInt((r.fiscal_period as string).replace('Q', '')),
        revenues: income?.revenues?.value,
        netIncome: income?.net_income_loss?.value,
        eps: income?.basic_earnings_per_share?.value,
        grossProfit: income?.gross_profit?.value,
        operatingIncome: income?.operating_income_loss?.value,
        assets: balance?.assets?.value,
        liabilities: balance?.liabilities?.value,
        equity: balance?.equity?.value,
      }
    })
  }

  // ============================================
  // Technical Indicators
  // ============================================

  /**
   * SMA 조회
   */
  async getSMA(
    ticker: string,
    options: {
      window?: number
      timespan?: 'day' | 'week' | 'month'
      seriesType?: 'close' | 'open' | 'high' | 'low'
      limit?: number
    } = {}
  ): Promise<Array<{ date: Date; value: number }>> {
    const data = await this.request<{ results: { values: Array<{ timestamp: number; value: number }> } }>(
      `/v1/indicators/sma/${ticker.toUpperCase()}`,
      {
        'window': String(options.window || 20),
        'timespan': options.timespan || 'day',
        'series_type': options.seriesType || 'close',
        'limit': String(options.limit || 100),
      }
    )

    return (data.results?.values || []).map((v) => ({
      date: new Date(v.timestamp),
      value: v.value,
    }))
  }

  /**
   * EMA 조회
   */
  async getEMA(
    ticker: string,
    options: {
      window?: number
      timespan?: 'day' | 'week' | 'month'
      seriesType?: 'close' | 'open' | 'high' | 'low'
      limit?: number
    } = {}
  ): Promise<Array<{ date: Date; value: number }>> {
    const data = await this.request<{ results: { values: Array<{ timestamp: number; value: number }> } }>(
      `/v1/indicators/ema/${ticker.toUpperCase()}`,
      {
        'window': String(options.window || 20),
        'timespan': options.timespan || 'day',
        'series_type': options.seriesType || 'close',
        'limit': String(options.limit || 100),
      }
    )

    return (data.results?.values || []).map((v) => ({
      date: new Date(v.timestamp),
      value: v.value,
    }))
  }

  /**
   * RSI 조회
   */
  async getRSI(
    ticker: string,
    options: {
      window?: number
      timespan?: 'day' | 'week' | 'month'
      seriesType?: 'close' | 'open' | 'high' | 'low'
      limit?: number
    } = {}
  ): Promise<Array<{ date: Date; value: number }>> {
    const data = await this.request<{ results: { values: Array<{ timestamp: number; value: number }> } }>(
      `/v1/indicators/rsi/${ticker.toUpperCase()}`,
      {
        'window': String(options.window || 14),
        'timespan': options.timespan || 'day',
        'series_type': options.seriesType || 'close',
        'limit': String(options.limit || 100),
      }
    )

    return (data.results?.values || []).map((v) => ({
      date: new Date(v.timestamp),
      value: v.value,
    }))
  }

  /**
   * MACD 조회
   */
  async getMACD(
    ticker: string,
    options: {
      shortWindow?: number
      longWindow?: number
      signalWindow?: number
      timespan?: 'day' | 'week' | 'month'
      seriesType?: 'close' | 'open' | 'high' | 'low'
      limit?: number
    } = {}
  ): Promise<Array<{ date: Date; value: number; signal: number; histogram: number }>> {
    const data = await this.request<{
      results: {
        values: Array<{
          timestamp: number
          value: number
          signal: number
          histogram: number
        }>
      }
    }>(
      `/v1/indicators/macd/${ticker.toUpperCase()}`,
      {
        'short_window': String(options.shortWindow || 12),
        'long_window': String(options.longWindow || 26),
        'signal_window': String(options.signalWindow || 9),
        'timespan': options.timespan || 'day',
        'series_type': options.seriesType || 'close',
        'limit': String(options.limit || 100),
      }
    )

    return (data.results?.values || []).map((v) => ({
      date: new Date(v.timestamp),
      value: v.value,
      signal: v.signal,
      histogram: v.histogram,
    }))
  }
}

// ============================================
// Singleton Export
// ============================================

export const polygonProvider = new PolygonProvider()
export default polygonProvider

// ============================================
// Helper Functions
// ============================================

/**
 * US 시장 운영 시간 확인 (EST 기준)
 */
export function isUSMarketOpen(): boolean {
  const now = new Date()

  // EST 시간으로 변환 (UTC - 5)
  const estOffset = -5 * 60
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  const est = new Date(utc + estOffset * 60000)

  const hour = est.getHours()
  const minute = est.getMinutes()
  const day = est.getDay()

  // 주말 체크
  if (day === 0 || day === 6) return false

  // 정규장: 09:30 ~ 16:00 EST
  const time = hour * 100 + minute
  return time >= 930 && time < 1600
}

/**
 * Pre-market/After-hours 확인
 */
export function isExtendedHours(): boolean {
  const now = new Date()

  const estOffset = -5 * 60
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  const est = new Date(utc + estOffset * 60000)

  const hour = est.getHours()
  const minute = est.getMinutes()
  const day = est.getDay()

  if (day === 0 || day === 6) return false

  const time = hour * 100 + minute
  // Pre-market: 04:00 ~ 09:30, After-hours: 16:00 ~ 20:00
  return (time >= 400 && time < 930) || (time >= 1600 && time < 2000)
}

/**
 * 티커 유효성 검사
 */
export function isValidTicker(ticker: string): boolean {
  // US 티커: 1-5자리 영문 대문자
  return /^[A-Z]{1,5}$/.test(ticker.toUpperCase())
}
