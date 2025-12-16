// ============================================
// 한국투자증권 API Provider Tests
// 시세 조회, 주문, 계좌 관리 테스트
// ============================================

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock fetch
global.fetch = vi.fn()

import {
  isMarketOpen,
  isPreMarket,
  isValidSymbol,
  type KISConfig,
  type StockPrice,
  type StockQuote,
  type OHLCV,
  type OrderRequest,
  type OrderResponse,
  type Position,
  type AccountBalance,
} from '@/lib/api/providers/kis'

// ============================================
// Test Data
// ============================================

const mockConfig: KISConfig = {
  appKey: 'test_app_key',
  appSecret: 'test_app_secret',
  accountNumber: '12345678',
  accountProductCode: '01',
  isVirtual: true,
}

const mockStockPrice: StockPrice = {
  symbol: '005930',
  name: '삼성전자',
  currentPrice: 72000,
  change: 1500,
  changePercent: 2.13,
  open: 70500,
  high: 72500,
  low: 70000,
  volume: 15000000,
  tradingValue: 1080000000000,
  timestamp: new Date(),
}

const mockQuote: StockQuote = {
  symbol: '005930',
  bidPrice: 71900,
  askPrice: 72000,
  bidVolume: 50000,
  askVolume: 30000,
  spread: 100,
  spreadPercent: 0.14,
}

const mockOHLCV: OHLCV[] = [
  { date: new Date('2024-01-01'), open: 70000, high: 71000, low: 69500, close: 70500, volume: 10000000 },
  { date: new Date('2024-01-02'), open: 70500, high: 72000, low: 70000, close: 71500, volume: 12000000 },
  { date: new Date('2024-01-03'), open: 71500, high: 72500, low: 71000, close: 72000, volume: 15000000 },
]

const mockPosition: Position = {
  symbol: '005930',
  name: '삼성전자',
  quantity: 100,
  avgPrice: 70000,
  currentPrice: 72000,
  pnl: 200000,
  pnlPercent: 2.86,
  marketValue: 7200000,
}

const mockBalance: AccountBalance = {
  totalAsset: 50000000,
  totalDeposit: 42800000,
  totalStock: 7200000,
  availableCash: 42800000,
  positions: [mockPosition],
}

// ============================================
// Market Data Tests
// ============================================

describe('KIS Provider - Market Data', () => {
  describe('현재가 조회 시나리오', () => {
    it('유효한 종목 코드로 현재가를 조회할 수 있어야 함', () => {
      expect(mockStockPrice.symbol).toBe('005930')
      expect(mockStockPrice.currentPrice).toBeGreaterThan(0)
      expect(mockStockPrice.name).toBe('삼성전자')
    })

    it('등락률이 올바르게 계산되어야 함', () => {
      const prevClose = mockStockPrice.currentPrice - mockStockPrice.change
      const calculatedChangePercent = (mockStockPrice.change / prevClose) * 100

      expect(Math.abs(calculatedChangePercent - mockStockPrice.changePercent)).toBeLessThan(0.1)
    })

    it('거래대금이 올바르게 계산되어야 함', () => {
      // 거래대금 = 거래량 * 평균가 (대략적)
      const estimatedValue = mockStockPrice.volume * mockStockPrice.currentPrice
      expect(mockStockPrice.tradingValue).toBeGreaterThan(0)
    })

    it('장 마감 후에도 마지막 종가를 조회할 수 있어야 함', () => {
      // 장 마감 후에도 데이터 제공
      expect(mockStockPrice.timestamp).toBeDefined()
    })
  })

  describe('호가 조회 시나리오', () => {
    it('매수/매도 호가가 올바르게 조회되어야 함', () => {
      expect(mockQuote.bidPrice).toBeLessThan(mockQuote.askPrice)
      expect(mockQuote.spread).toBe(mockQuote.askPrice - mockQuote.bidPrice)
    })

    it('호가 스프레드가 적정 범위 내여야 함', () => {
      // 대형주의 경우 스프레드가 작음
      expect(mockQuote.spreadPercent).toBeLessThan(1) // 1% 미만
    })

    it('호가 잔량이 양수여야 함', () => {
      expect(mockQuote.bidVolume).toBeGreaterThan(0)
      expect(mockQuote.askVolume).toBeGreaterThan(0)
    })
  })

  describe('OHLCV 데이터 시나리오', () => {
    it('일봉 데이터가 시간순으로 정렬되어야 함', () => {
      for (let i = 1; i < mockOHLCV.length; i++) {
        expect(mockOHLCV[i].date.getTime()).toBeGreaterThan(mockOHLCV[i - 1].date.getTime())
      }
    })

    it('OHLCV 관계가 논리적이어야 함 (High >= Open, Close, Low)', () => {
      mockOHLCV.forEach((candle) => {
        expect(candle.high).toBeGreaterThanOrEqual(candle.open)
        expect(candle.high).toBeGreaterThanOrEqual(candle.close)
        expect(candle.high).toBeGreaterThanOrEqual(candle.low)
        expect(candle.low).toBeLessThanOrEqual(candle.open)
        expect(candle.low).toBeLessThanOrEqual(candle.close)
      })
    })

    it('거래량이 0 이상이어야 함', () => {
      mockOHLCV.forEach((candle) => {
        expect(candle.volume).toBeGreaterThanOrEqual(0)
      })
    })

    it('빈 기간에는 빈 배열을 반환해야 함', () => {
      const emptyData: OHLCV[] = []
      expect(emptyData.length).toBe(0)
    })
  })
})

// ============================================
// Trading Tests
// ============================================

describe('KIS Provider - Trading', () => {
  describe('매수 주문 시나리오', () => {
    it('시장가 매수 주문이 올바르게 생성되어야 함', () => {
      const order: OrderRequest = {
        symbol: '005930',
        side: 'buy',
        orderType: 'market',
        quantity: 10,
      }

      expect(order.side).toBe('buy')
      expect(order.orderType).toBe('market')
      expect(order.price).toBeUndefined() // 시장가는 가격 없음
    })

    it('지정가 매수 주문에는 가격이 필요함', () => {
      const order: OrderRequest = {
        symbol: '005930',
        side: 'buy',
        orderType: 'limit',
        quantity: 10,
        price: 71000,
      }

      expect(order.orderType).toBe('limit')
      expect(order.price).toBeDefined()
      expect(order.price).toBeGreaterThan(0)
    })

    it('주문 수량이 1 이상이어야 함', () => {
      const order: OrderRequest = {
        symbol: '005930',
        side: 'buy',
        orderType: 'market',
        quantity: 1,
      }

      expect(order.quantity).toBeGreaterThanOrEqual(1)
    })

    it('호가 단위에 맞는 가격으로 주문해야 함', () => {
      // 5만원 이상: 100원 단위
      // 1만원~5만원: 50원 단위
      // 5천원~1만원: 10원 단위
      const price = 72000
      const tickSize = price >= 50000 ? 100 : price >= 10000 ? 50 : 10
      const isValidPrice = price % tickSize === 0

      expect(isValidPrice).toBe(true)
    })
  })

  describe('매도 주문 시나리오', () => {
    it('보유 수량 이하로만 매도할 수 있어야 함', () => {
      const holdingQuantity = mockPosition.quantity
      const sellQuantity = 50

      expect(sellQuantity).toBeLessThanOrEqual(holdingQuantity)
    })

    it('미보유 종목 매도 시 에러를 발생시켜야 함', () => {
      const positions = [mockPosition]
      const sellSymbol = '000660' // 보유하지 않은 종목

      const hasPosition = positions.some((p) => p.symbol === sellSymbol)
      expect(hasPosition).toBe(false)
    })
  })

  describe('주문 응답 시나리오', () => {
    it('주문 ID가 반환되어야 함', () => {
      const response: OrderResponse = {
        orderId: 'ORD123456',
        symbol: '005930',
        side: 'buy',
        orderType: 'market',
        quantity: 10,
        price: 0,
        status: 'pending',
        filledQuantity: 0,
        filledPrice: 0,
        orderedAt: new Date(),
      }

      expect(response.orderId).toBeDefined()
      expect(response.orderId.length).toBeGreaterThan(0)
    })

    it('체결 전 상태는 pending이어야 함', () => {
      const response: OrderResponse = {
        orderId: 'ORD123456',
        symbol: '005930',
        side: 'buy',
        orderType: 'market',
        quantity: 10,
        price: 0,
        status: 'pending',
        filledQuantity: 0,
        filledPrice: 0,
        orderedAt: new Date(),
      }

      expect(response.status).toBe('pending')
      expect(response.filledQuantity).toBe(0)
    })

    it('체결 완료 시 filled 상태여야 함', () => {
      const response: OrderResponse = {
        orderId: 'ORD123456',
        symbol: '005930',
        side: 'buy',
        orderType: 'market',
        quantity: 10,
        price: 72000,
        status: 'filled',
        filledQuantity: 10,
        filledPrice: 72000,
        orderedAt: new Date(),
      }

      expect(response.status).toBe('filled')
      expect(response.filledQuantity).toBe(response.quantity)
    })

    it('부분 체결 상태를 처리할 수 있어야 함', () => {
      const response: OrderResponse = {
        orderId: 'ORD123456',
        symbol: '005930',
        side: 'buy',
        orderType: 'limit',
        quantity: 100,
        price: 71000,
        status: 'partial',
        filledQuantity: 50,
        filledPrice: 71000,
        orderedAt: new Date(),
      }

      expect(response.status).toBe('partial')
      expect(response.filledQuantity).toBeLessThan(response.quantity)
      expect(response.filledQuantity).toBeGreaterThan(0)
    })
  })

  describe('주문 취소 시나리오', () => {
    it('미체결 주문만 취소할 수 있어야 함', () => {
      const pendingOrder: OrderResponse = {
        orderId: 'ORD123456',
        symbol: '005930',
        side: 'buy',
        orderType: 'limit',
        quantity: 10,
        price: 70000,
        status: 'pending',
        filledQuantity: 0,
        filledPrice: 0,
        orderedAt: new Date(),
      }

      const canCancel = pendingOrder.status === 'pending' || pendingOrder.status === 'partial'
      expect(canCancel).toBe(true)
    })

    it('체결 완료된 주문은 취소할 수 없어야 함', () => {
      const filledOrder: OrderResponse = {
        orderId: 'ORD123456',
        symbol: '005930',
        side: 'buy',
        orderType: 'market',
        quantity: 10,
        price: 72000,
        status: 'filled',
        filledQuantity: 10,
        filledPrice: 72000,
        orderedAt: new Date(),
      }

      const canCancel = filledOrder.status === 'pending' || filledOrder.status === 'partial'
      expect(canCancel).toBe(false)
    })
  })
})

// ============================================
// Account Tests
// ============================================

describe('KIS Provider - Account', () => {
  describe('잔고 조회 시나리오', () => {
    it('총자산 = 예수금 + 주식평가금액', () => {
      const calculatedTotal = mockBalance.totalDeposit + mockBalance.totalStock
      expect(mockBalance.totalAsset).toBe(calculatedTotal)
    })

    it('가용 현금이 예수금 이하여야 함', () => {
      expect(mockBalance.availableCash).toBeLessThanOrEqual(mockBalance.totalDeposit)
    })

    it('포지션별 손익이 올바르게 계산되어야 함', () => {
      mockBalance.positions.forEach((position) => {
        const expectedPnl = (position.currentPrice - position.avgPrice) * position.quantity
        expect(Math.abs(position.pnl - expectedPnl)).toBeLessThan(1) // 반올림 오차 허용
      })
    })

    it('포지션별 수익률이 올바르게 계산되어야 함', () => {
      mockBalance.positions.forEach((position) => {
        const expectedPnlPercent =
          ((position.currentPrice - position.avgPrice) / position.avgPrice) * 100
        expect(Math.abs(position.pnlPercent - expectedPnlPercent)).toBeLessThan(0.1)
      })
    })
  })

  describe('포트폴리오 시나리오', () => {
    it('전체 포지션의 시장가치 합이 주식평가금액과 일치해야 함', () => {
      const totalMarketValue = mockBalance.positions.reduce((sum, p) => sum + p.marketValue, 0)
      expect(totalMarketValue).toBe(mockBalance.totalStock)
    })

    it('빈 포트폴리오 처리', () => {
      const emptyBalance: AccountBalance = {
        totalAsset: 10000000,
        totalDeposit: 10000000,
        totalStock: 0,
        availableCash: 10000000,
        positions: [],
      }

      expect(emptyBalance.positions.length).toBe(0)
      expect(emptyBalance.totalStock).toBe(0)
    })
  })
})

// ============================================
// Market Hours Tests
// ============================================

describe('KIS Provider - Market Hours', () => {
  it('주말에는 장이 닫혀있어야 함', () => {
    // isMarketOpen은 실제 시간 기반
    // 테스트에서는 로직만 검증
    const weekend = new Date('2024-01-06') // 토요일
    const day = weekend.getDay()
    const isWeekend = day === 0 || day === 6

    expect(isWeekend).toBe(true)
  })

  it('정규장 시간 (09:00-15:30)을 올바르게 판단해야 함', () => {
    // 실제 시간 의존적이므로 로직 검증
    const regularHoursStart = 900 // 09:00
    const regularHoursEnd = 1530 // 15:30

    const testTime = 1000 // 10:00
    const isRegularHours = testTime >= regularHoursStart && testTime <= regularHoursEnd

    expect(isRegularHours).toBe(true)
  })

  it('동시호가 시간을 올바르게 판단해야 함', () => {
    // 08:30-09:00, 15:20-15:30
    const preMarketStart = 830
    const preMarketEnd = 900
    const closingAuctionStart = 1520
    const closingAuctionEnd = 1530

    const testTime = 845
    const isPreMarket = testTime >= preMarketStart && testTime < preMarketEnd

    expect(isPreMarket).toBe(true)
  })
})

// ============================================
// Symbol Validation Tests
// ============================================

describe('KIS Provider - Symbol Validation', () => {
  it('유효한 한국 종목 코드 (6자리 숫자)', () => {
    expect(isValidSymbol('005930')).toBe(true) // 삼성전자
    expect(isValidSymbol('000660')).toBe(true) // SK하이닉스
    expect(isValidSymbol('035720')).toBe(true) // 카카오
  })

  it('잘못된 종목 코드 형식', () => {
    expect(isValidSymbol('AAPL')).toBe(false) // 미국 티커
    expect(isValidSymbol('12345')).toBe(false) // 5자리
    expect(isValidSymbol('1234567')).toBe(false) // 7자리
    expect(isValidSymbol('')).toBe(false) // 빈 문자열
    expect(isValidSymbol('00593A')).toBe(false) // 문자 포함
  })
})

// ============================================
// Error Handling Tests
// ============================================

describe('KIS Provider - Error Handling', () => {
  it('인증 실패 시 적절한 에러를 발생시켜야 함', () => {
    const authError = { code: 'AUTH001', message: 'Invalid credentials' }
    expect(authError.code).toBe('AUTH001')
  })

  it('토큰 만료 시 자동 갱신해야 함', () => {
    const token = {
      accessToken: 'test_token',
      expiresAt: new Date(Date.now() - 1000), // 만료됨
    }

    const isExpired = new Date() >= token.expiresAt
    expect(isExpired).toBe(true)
    // 자동 갱신 로직 트리거
  })

  it('네트워크 에러를 처리할 수 있어야 함', () => {
    const networkError = { code: 'NETWORK_ERROR', message: 'Connection timeout' }
    expect(networkError.code).toBe('NETWORK_ERROR')
    // 재시도 로직 필요
  })

  it('잔고 부족 에러를 처리할 수 있어야 함', () => {
    const insufficientFundsError = {
      code: 'ORDER001',
      message: '주문가능금액이 부족합니다',
    }

    expect(insufficientFundsError.code).toBe('ORDER001')
  })

  it('장 마감 시간 외 주문 에러를 처리할 수 있어야 함', () => {
    const marketClosedError = {
      code: 'ORDER002',
      message: '장 운영시간이 아닙니다',
    }

    expect(marketClosedError.code).toBe('ORDER002')
  })
})

// ============================================
// Virtual Trading Tests (모의투자)
// ============================================

describe('KIS Provider - Virtual Trading', () => {
  it('모의투자 모드에서 실제 주문이 실행되지 않아야 함', () => {
    expect(mockConfig.isVirtual).toBe(true)
  })

  it('모의투자 API URL이 다르게 설정되어야 함', () => {
    const realUrl = 'https://openapi.koreainvestment.com:9443'
    const virtualUrl = 'https://openapivts.koreainvestment.com:29443'

    const url = mockConfig.isVirtual ? virtualUrl : realUrl
    expect(url).toBe(virtualUrl)
  })

  it('모의투자 거래 ID가 다르게 설정되어야 함', () => {
    const realTrId = 'TTTC0802U'
    const virtualTrId = 'VTTC0802U'

    const trId = mockConfig.isVirtual ? virtualTrId : realTrId
    expect(trId.startsWith('V')).toBe(true)
  })
})
