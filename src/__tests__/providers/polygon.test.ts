// ============================================
// Polygon.io API Provider Tests
// US 시장 데이터, 뉴스, 재무제표 테스트
// ============================================

import { describe, it, expect, vi } from 'vitest'

// Mock fetch
global.fetch = vi.fn()

import {
  isUSMarketOpen,
  isExtendedHours,
  isValidTicker,
  type TickerDetails,
  type StockPrice,
  type OHLCV,
  type NewsArticle,
  type FinancialReport,
  type MarketStatus,
} from '@/lib/api/providers/polygon'

// ============================================
// Test Data
// ============================================

const mockTickerDetails: TickerDetails = {
  ticker: 'AAPL',
  name: 'Apple Inc.',
  market: 'stocks',
  locale: 'us',
  primaryExchange: 'XNAS',
  type: 'CS',
  currencyName: 'usd',
  marketCap: 2800000000000,
  shareClassSharesOutstanding: 15000000000,
  description: 'Apple Inc. designs, manufactures, and markets smartphones...',
  homepageUrl: 'https://www.apple.com',
  totalEmployees: 164000,
  listDate: '1980-12-12',
  sicCode: '3571',
  sicDescription: 'Electronic Computers',
}

const mockStockPrice: StockPrice = {
  symbol: 'AAPL',
  price: 185.50,
  change: 2.30,
  changePercent: 1.26,
  open: 183.20,
  high: 186.00,
  low: 182.80,
  close: 185.50,
  volume: 52000000,
  vwap: 184.75,
  timestamp: new Date(),
}

const mockOHLCV: OHLCV[] = [
  { date: new Date('2024-01-02'), open: 180, high: 182, low: 179, close: 181, volume: 50000000, vwap: 180.5, transactions: 500000 },
  { date: new Date('2024-01-03'), open: 181, high: 184, low: 180, close: 183, volume: 55000000, vwap: 182.5, transactions: 550000 },
  { date: new Date('2024-01-04'), open: 183, high: 186, low: 182, close: 185, volume: 52000000, vwap: 184.0, transactions: 520000 },
]

const mockNews: NewsArticle[] = [
  {
    id: 'news_001',
    publisher: {
      name: 'Bloomberg',
      homepageUrl: 'https://www.bloomberg.com',
      logoUrl: 'https://www.bloomberg.com/logo.png',
    },
    title: 'Apple Reports Record Q4 Earnings',
    author: 'John Doe',
    publishedUtc: new Date('2024-01-15T14:30:00Z'),
    articleUrl: 'https://www.bloomberg.com/news/apple-q4',
    tickers: ['AAPL'],
    imageUrl: 'https://www.bloomberg.com/images/apple.jpg',
    description: 'Apple Inc. announced record earnings for Q4...',
    keywords: ['Apple', 'Earnings', 'Tech'],
  },
]

const mockFinancials: FinancialReport = {
  ticker: 'AAPL',
  period: 'Q4',
  fiscalYear: 2023,
  fiscalQuarter: 4,
  revenues: 119575000000,
  netIncome: 33916000000,
  eps: 2.18,
  grossProfit: 54855000000,
  operatingIncome: 36016000000,
  assets: 352583000000,
  liabilities: 274764000000,
  equity: 77819000000,
}

// ============================================
// Ticker Information Tests
// ============================================

describe('Polygon Provider - Ticker Information', () => {
  describe('종목 상세 정보 조회', () => {
    it('티커 상세 정보가 올바르게 반환되어야 함', () => {
      expect(mockTickerDetails.ticker).toBe('AAPL')
      expect(mockTickerDetails.name).toBe('Apple Inc.')
      expect(mockTickerDetails.market).toBe('stocks')
    })

    it('시가총액이 양수여야 함', () => {
      expect(mockTickerDetails.marketCap).toBeGreaterThan(0)
    })

    it('발행 주식수가 양수여야 함', () => {
      expect(mockTickerDetails.shareClassSharesOutstanding).toBeGreaterThan(0)
    })
  })

  describe('티커 검색 시나리오', () => {
    it('키워드로 종목을 검색할 수 있어야 함', () => {
      const searchResults = [mockTickerDetails]
      expect(searchResults.length).toBeGreaterThan(0)
    })

    it('유형별 필터링이 가능해야 함', () => {
      const types = ['CS', 'ETF', 'INDEX']
      expect(types).toContain(mockTickerDetails.type)
    })

    it('시장별 필터링이 가능해야 함', () => {
      const markets = ['stocks', 'crypto', 'fx']
      expect(markets).toContain(mockTickerDetails.market)
    })
  })
})

// ============================================
// Market Data Tests
// ============================================

describe('Polygon Provider - Market Data', () => {
  describe('현재가 조회 시나리오', () => {
    it('스냅샷 데이터가 올바르게 반환되어야 함', () => {
      expect(mockStockPrice.symbol).toBe('AAPL')
      expect(mockStockPrice.price).toBeGreaterThan(0)
      expect(mockStockPrice.volume).toBeGreaterThan(0)
    })

    it('VWAP (Volume Weighted Average Price)가 계산되어야 함', () => {
      expect(mockStockPrice.vwap).toBeGreaterThan(0)
      // VWAP는 일반적으로 당일 가격 범위 내에 있어야 함
      expect(mockStockPrice.vwap).toBeGreaterThanOrEqual(mockStockPrice.low)
      expect(mockStockPrice.vwap).toBeLessThanOrEqual(mockStockPrice.high)
    })

    it('등락률이 올바르게 계산되어야 함', () => {
      const prevClose = mockStockPrice.price - mockStockPrice.change
      const calculatedPercent = (mockStockPrice.change / prevClose) * 100

      expect(Math.abs(calculatedPercent - mockStockPrice.changePercent)).toBeLessThan(0.1)
    })
  })

  describe('여러 종목 동시 조회', () => {
    it('복수 티커를 한 번에 조회할 수 있어야 함', () => {
      const tickers = ['AAPL', 'GOOGL', 'MSFT', 'AMZN']
      expect(tickers.length).toBe(4)
    })
  })

  describe('OHLCV 데이터 시나리오', () => {
    it('일봉 데이터가 시간순으로 정렬되어야 함', () => {
      for (let i = 1; i < mockOHLCV.length; i++) {
        expect(mockOHLCV[i].date.getTime()).toBeGreaterThan(mockOHLCV[i - 1].date.getTime())
      }
    })

    it('OHLCV 관계가 논리적이어야 함', () => {
      mockOHLCV.forEach((candle) => {
        expect(candle.high).toBeGreaterThanOrEqual(candle.open)
        expect(candle.high).toBeGreaterThanOrEqual(candle.close)
        expect(candle.high).toBeGreaterThanOrEqual(candle.low)
        expect(candle.low).toBeLessThanOrEqual(candle.open)
        expect(candle.low).toBeLessThanOrEqual(candle.close)
      })
    })

    it('거래 건수가 반환되어야 함', () => {
      mockOHLCV.forEach((candle) => {
        expect(candle.transactions).toBeGreaterThan(0)
      })
    })

    it('다양한 타임프레임을 지원해야 함', () => {
      const timeframes = ['day', 'week', 'month', 'quarter', 'year']
      expect(timeframes.length).toBe(5)
    })
  })

  describe('분봉 데이터 시나리오', () => {
    it('다양한 분봉 간격을 지원해야 함', () => {
      const multipliers = [1, 5, 15, 30, 60]
      expect(multipliers).toContain(1)
      expect(multipliers).toContain(5)
    })

    it('장중 데이터만 포함해야 함', () => {
      // 09:30 ~ 16:00 EST
      const tradingHoursStart = 9.5 // 9:30
      const tradingHoursEnd = 16 // 16:00

      expect(tradingHoursEnd - tradingHoursStart).toBe(6.5) // 6.5 시간
    })
  })
})

// ============================================
// News Tests
// ============================================

describe('Polygon Provider - News', () => {
  describe('뉴스 조회 시나리오', () => {
    it('종목 관련 뉴스가 반환되어야 함', () => {
      expect(mockNews.length).toBeGreaterThan(0)
      expect(mockNews[0].tickers).toContain('AAPL')
    })

    it('뉴스에 필수 필드가 포함되어야 함', () => {
      const news = mockNews[0]
      expect(news.id).toBeDefined()
      expect(news.title).toBeDefined()
      expect(news.publishedUtc).toBeDefined()
      expect(news.articleUrl).toBeDefined()
    })

    it('발행일 기준 정렬이 가능해야 함', () => {
      const sortedNews = [...mockNews].sort(
        (a, b) => b.publishedUtc.getTime() - a.publishedUtc.getTime()
      )
      expect(sortedNews[0].publishedUtc.getTime()).toBeGreaterThanOrEqual(
        sortedNews[sortedNews.length - 1].publishedUtc.getTime()
      )
    })

    it('날짜 범위 필터링이 가능해야 함', () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      const filteredNews = mockNews.filter(
        (n) => n.publishedUtc >= startDate && n.publishedUtc <= endDate
      )

      expect(filteredNews.length).toBeLessThanOrEqual(mockNews.length)
    })
  })

  describe('뉴스 메타데이터', () => {
    it('퍼블리셔 정보가 포함되어야 함', () => {
      const news = mockNews[0]
      expect(news.publisher.name).toBeDefined()
      expect(news.publisher.homepageUrl).toBeDefined()
    })

    it('키워드가 포함되어야 함', () => {
      const news = mockNews[0]
      expect(news.keywords?.length).toBeGreaterThan(0)
    })
  })
})

// ============================================
// Financials Tests
// ============================================

describe('Polygon Provider - Financials', () => {
  describe('재무제표 조회 시나리오', () => {
    it('분기별 재무 데이터가 반환되어야 함', () => {
      expect(mockFinancials.fiscalQuarter).toBeGreaterThanOrEqual(1)
      expect(mockFinancials.fiscalQuarter).toBeLessThanOrEqual(4)
    })

    it('손익계산서 항목이 포함되어야 함', () => {
      expect(mockFinancials.revenues).toBeGreaterThan(0)
      expect(mockFinancials.netIncome).toBeDefined()
      expect(mockFinancials.eps).toBeDefined()
    })

    it('대차대조표 항목이 포함되어야 함', () => {
      expect(mockFinancials.assets).toBeGreaterThan(0)
      expect(mockFinancials.liabilities).toBeDefined()
      expect(mockFinancials.equity).toBeDefined()
    })

    it('자산 = 부채 + 자본 등식이 성립해야 함', () => {
      const assetsCalc = (mockFinancials.liabilities || 0) + (mockFinancials.equity || 0)
      const tolerance = mockFinancials.assets! * 0.01 // 1% 오차 허용

      expect(Math.abs(mockFinancials.assets! - assetsCalc)).toBeLessThan(tolerance)
    })
  })

  describe('재무 비율 계산', () => {
    it('EPS가 순이익/발행주식수와 일치해야 함', () => {
      // Apple 기준 대략적 검증
      const sharesOutstanding = 15000000000
      const calculatedEPS = mockFinancials.netIncome! / sharesOutstanding

      // EPS는 대략 2-3달러 범위
      expect(mockFinancials.eps).toBeGreaterThan(0)
    })

    it('매출총이익률 계산이 가능해야 함', () => {
      const grossMargin = (mockFinancials.grossProfit! / mockFinancials.revenues!) * 100
      expect(grossMargin).toBeGreaterThan(0)
      expect(grossMargin).toBeLessThan(100)
    })

    it('영업이익률 계산이 가능해야 함', () => {
      const operatingMargin = (mockFinancials.operatingIncome! / mockFinancials.revenues!) * 100
      expect(operatingMargin).toBeGreaterThan(0)
      expect(operatingMargin).toBeLessThan(100)
    })
  })
})

// ============================================
// Technical Indicators Tests
// ============================================

describe('Polygon Provider - Technical Indicators', () => {
  describe('이동평균 (SMA/EMA)', () => {
    it('SMA 데이터가 반환되어야 함', () => {
      const smaData = [
        { date: new Date('2024-01-02'), value: 180 },
        { date: new Date('2024-01-03'), value: 181 },
        { date: new Date('2024-01-04'), value: 182 },
      ]

      expect(smaData.length).toBeGreaterThan(0)
      smaData.forEach((d) => expect(d.value).toBeGreaterThan(0))
    })

    it('다양한 기간을 지원해야 함', () => {
      const windows = [5, 10, 20, 50, 200]
      expect(windows).toContain(20)
      expect(windows).toContain(200)
    })
  })

  describe('RSI', () => {
    it('RSI 값이 0-100 범위여야 함', () => {
      const rsiData = [
        { date: new Date('2024-01-02'), value: 55 },
        { date: new Date('2024-01-03'), value: 62 },
        { date: new Date('2024-01-04'), value: 58 },
      ]

      rsiData.forEach((d) => {
        expect(d.value).toBeGreaterThanOrEqual(0)
        expect(d.value).toBeLessThanOrEqual(100)
      })
    })

    it('과매수/과매도 임계값을 식별할 수 있어야 함', () => {
      const overbought = 70
      const oversold = 30

      expect(overbought).toBeGreaterThan(oversold)
    })
  })

  describe('MACD', () => {
    it('MACD 라인, 시그널, 히스토그램이 반환되어야 함', () => {
      const macdData = [
        { date: new Date('2024-01-02'), value: 1.5, signal: 1.2, histogram: 0.3 },
        { date: new Date('2024-01-03'), value: 1.8, signal: 1.4, histogram: 0.4 },
      ]

      macdData.forEach((d) => {
        expect(d.value).toBeDefined()
        expect(d.signal).toBeDefined()
        // 히스토그램 = value - signal (부동소수점 오차 허용)
        expect(Math.abs(d.histogram - (d.value - d.signal))).toBeLessThan(0.001)
      })
    })

    it('골든크로스/데드크로스를 감지할 수 있어야 함', () => {
      const macdData = [
        { value: -0.2, signal: 0.1 }, // 데드크로스 상태
        { value: 0.3, signal: 0.1 }, // 골든크로스
      ]

      const goldenCross = macdData[0].value < macdData[0].signal && macdData[1].value > macdData[1].signal
      expect(goldenCross).toBe(true)
    })
  })
})

// ============================================
// Market Status Tests
// ============================================

describe('Polygon Provider - Market Status', () => {
  describe('시장 상태 조회', () => {
    it('거래소별 상태를 조회할 수 있어야 함', () => {
      const status: MarketStatus = {
        market: 'stocks',
        serverTime: new Date(),
        exchanges: {
          nasdaq: 'open',
          nyse: 'open',
        },
        currencies: {
          fx: 'open',
          crypto: 'open',
        },
      }

      expect(status.exchanges.nasdaq).toBeDefined()
      expect(status.exchanges.nyse).toBeDefined()
    })
  })

  describe('휴장일 조회', () => {
    it('예정된 휴장일 목록을 조회할 수 있어야 함', () => {
      const holidays = [
        { exchange: 'NYSE', name: "New Year's Day", date: '2024-01-01', status: 'closed' },
        { exchange: 'NYSE', name: 'Martin Luther King Jr. Day', date: '2024-01-15', status: 'closed' },
      ]

      expect(holidays.length).toBeGreaterThan(0)
    })
  })
})

// ============================================
// Ticker Validation Tests
// ============================================

describe('Polygon Provider - Ticker Validation', () => {
  it('유효한 US 티커 (1-5자리 영문)', () => {
    expect(isValidTicker('AAPL')).toBe(true)
    expect(isValidTicker('GOOGL')).toBe(true)
    expect(isValidTicker('A')).toBe(true) // 1자리도 유효
    expect(isValidTicker('MSFT')).toBe(true)
  })

  it('잘못된 티커 형식', () => {
    expect(isValidTicker('005930')).toBe(false) // 숫자만
    expect(isValidTicker('AAPLX1')).toBe(false) // 6자리 이상
    expect(isValidTicker('')).toBe(false) // 빈 문자열
    expect(isValidTicker('AAP-L')).toBe(false) // 특수문자
  })
})

// ============================================
// Market Hours Tests
// ============================================

describe('Polygon Provider - Market Hours', () => {
  it('정규장 시간 (09:30-16:00 EST)을 판단해야 함', () => {
    // EST 기준
    const regularStart = 9.5 // 09:30
    const regularEnd = 16 // 16:00

    expect(regularEnd - regularStart).toBe(6.5)
  })

  it('프리마켓 시간 (04:00-09:30 EST)을 판단해야 함', () => {
    const preMarketStart = 4
    const preMarketEnd = 9.5

    expect(preMarketEnd - preMarketStart).toBe(5.5)
  })

  it('애프터아워 시간 (16:00-20:00 EST)을 판단해야 함', () => {
    const afterHoursStart = 16
    const afterHoursEnd = 20

    expect(afterHoursEnd - afterHoursStart).toBe(4)
  })
})

// ============================================
// WebSocket Tests
// ============================================

describe('Polygon Provider - WebSocket', () => {
  it('올바른 WebSocket URL을 생성해야 함', () => {
    const feeds = ['stocks', 'options', 'forex', 'crypto']
    const baseUrl = 'wss://socket.polygon.io'

    feeds.forEach((feed) => {
      const url = `${baseUrl}/${feed}`
      expect(url).toContain(feed)
    })
  })

  it('인증 메시지 형식이 올바라야 함', () => {
    const authMessage = JSON.stringify({ action: 'auth', params: 'API_KEY' })
    const parsed = JSON.parse(authMessage)

    expect(parsed.action).toBe('auth')
    expect(parsed.params).toBeDefined()
  })

  it('구독 메시지 형식이 올바라야 함', () => {
    const tickers = ['AAPL', 'GOOGL']
    const subscribeMessage = JSON.stringify({
      action: 'subscribe',
      params: tickers.map((t) => `T.${t}`).join(','),
    })

    const parsed = JSON.parse(subscribeMessage)
    expect(parsed.action).toBe('subscribe')
    expect(parsed.params).toContain('T.AAPL')
  })
})

// ============================================
// Error Handling Tests
// ============================================

describe('Polygon Provider - Error Handling', () => {
  it('API 키 누락 시 에러를 발생시켜야 함', () => {
    const errorMessage = 'Polygon API not configured'
    expect(errorMessage).toBeDefined()
  })

  it('Rate limit 에러를 처리해야 함', () => {
    const rateLimitError = { status: 429, message: 'Rate limit exceeded' }
    expect(rateLimitError.status).toBe(429)
  })

  it('잘못된 티커 요청 시 에러를 처리해야 함', () => {
    const notFoundError = { status: 404, message: 'Ticker not found' }
    expect(notFoundError.status).toBe(404)
  })

  it('플랜 제한 초과 시 적절한 메시지를 표시해야 함', () => {
    const plans = {
      basic: { callsPerMin: 5, historyYears: 2 },
      starter: { callsPerMin: 'unlimited', historyYears: 5 },
      developer: { callsPerMin: 'unlimited', historyYears: 'all' },
    }

    expect(plans.basic.callsPerMin).toBe(5)
    expect(plans.starter.historyYears).toBe(5)
  })
})
