// ============================================
// API Providers - Unified Export
// HEPHAITOS 핵심 서비스 프로바이더
// ============================================

// ============================================
// Import market helpers for local use
// ============================================
import {
  isMarketOpen as kisIsMarketOpen,
  isPreMarket as kisIsPreMarket,
  isValidSymbol as kisIsValidSymbol,
} from './kis'

import {
  isUSMarketOpen as polygonIsUSMarketOpen,
  isExtendedHours as polygonIsExtendedHours,
  isValidTicker as polygonIsValidTicker,
} from './polygon'

// ============================================
// AI Provider (Claude)
// ============================================

export {
  claudeProvider,
  default as claude,
  type StrategyGenerationRequest,
  type StrategyGenerationResponse,
  type StrategyCondition,
  type RiskManagement,
  type IndicatorConfig,
  type MarketAnalysisRequest,
  type MarketAnalysisResponse,
  type AITutorRequest,
  type AITutorResponse,
} from './claude'

// ============================================
// Korea Market Provider (한국투자증권)
// ============================================

export {
  kisProvider,
  default as kis,
  isMarketOpen as kisIsMarketOpenExport,
  isPreMarket as kisIsPreMarketExport,
  isValidSymbol as kisIsValidSymbolExport,
  type KISConfig,
  type KISToken,
  type StockPrice as KRStockPrice,
  type StockQuote as KRStockQuote,
  type OHLCV as KROHLCV,
  type OrderRequest as KROrderRequest,
  type OrderResponse as KROrderResponse,
  type Position as KRPosition,
  type AccountBalance as KRAccountBalance,
} from './kis'

// ============================================
// US Market Provider (Polygon.io)
// ============================================

export {
  polygonProvider,
  default as polygon,
  isUSMarketOpen as polygonIsUSMarketOpenExport,
  isExtendedHours as polygonIsExtendedHoursExport,
  isValidTicker as polygonIsValidTickerExport,
  type PolygonConfig,
  type TickerDetails,
  type StockPrice as USStockPrice,
  type OHLCV as USOHLCV,
  type Trade,
  type Quote,
  type NewsArticle,
  type FinancialReport,
  type MarketStatus,
} from './polygon'

// ============================================
// Payment Provider (Toss Payments)
// ============================================

export {
  tossPayments,
  default as payments,
  verifyWebhookSignature,
  getPaymentWidgetScript,
  getTossPaymentsScript,
  BANK_CODES,
  type TossConfig,
  type PaymentRequest,
  type PaymentResponse,
  type PaymentStatus,
  type PaymentMethod,
  type CardInfo,
  type VirtualAccountInfo,
  type CancelRequest,
  type CancelResponse,
  type BillingKeyRequest,
  type BillingKeyResponse,
  type BillingPaymentRequest,
  type SubscriptionPlan,
  type Subscription,
  type TossWebhookEvent,
  type BankCode,
} from './toss-payments'

// ============================================
// Unified Market Interface
// ============================================

export type Market = 'KR' | 'US'

export interface UnifiedOHLCV {
  date: Date
  open: number
  high: number
  low: number
  close: number
  volume: number
  market: Market
}

export interface UnifiedStockPrice {
  symbol: string
  name?: string
  price: number
  change: number
  changePercent: number
  open: number
  high: number
  low: number
  volume: number
  timestamp: Date
  market: Market
  currency: 'KRW' | 'USD'
}

// ============================================
// Provider Initialization
// ============================================

import { kisProvider, type KISConfig } from './kis'
import { polygonProvider, type PolygonConfig } from './polygon'
import { tossPayments, type TossConfig } from './toss-payments'

export interface ProvidersConfig {
  kis?: KISConfig
  polygon?: PolygonConfig
  toss?: TossConfig
}

/**
 * 모든 프로바이더 초기화
 */
export function initializeProviders(config: ProvidersConfig) {
  if (config.kis) {
    kisProvider.configure(config.kis)
  }

  if (config.polygon) {
    polygonProvider.configure(config.polygon)
  }

  if (config.toss) {
    tossPayments.configure(config.toss)
  }
}

/**
 * 환경변수에서 프로바이더 설정
 */
export function initializeFromEnv() {
  // KIS (한국투자증권)
  if (process.env.KIS_APP_KEY && process.env.KIS_APP_SECRET) {
    kisProvider.configure({
      appKey: process.env.KIS_APP_KEY,
      appSecret: process.env.KIS_APP_SECRET,
      accountNumber: process.env.KIS_ACCOUNT_NUMBER || '',
      accountProductCode: process.env.KIS_ACCOUNT_PRODUCT_CODE || '01',
      isVirtual: process.env.KIS_VIRTUAL === 'true',
    })
  }

  // Polygon.io
  if (process.env.POLYGON_API_KEY) {
    polygonProvider.configure({
      apiKey: process.env.POLYGON_API_KEY,
      plan: (process.env.POLYGON_PLAN as PolygonConfig['plan']) || 'basic',
    })
  }

  // Toss Payments
  if (process.env.TOSS_CLIENT_KEY && process.env.TOSS_SECRET_KEY) {
    tossPayments.configure({
      clientKey: process.env.TOSS_CLIENT_KEY,
      secretKey: process.env.TOSS_SECRET_KEY,
      isTest: process.env.TOSS_TEST === 'true',
    })
  }
}

// ============================================
// Unified Market Data Helpers
// ============================================

/**
 * 통합 OHLCV 데이터 조회
 */
export async function getUnifiedOHLCV(
  symbol: string,
  market: Market,
  from: string,
  to: string
): Promise<UnifiedOHLCV[]> {
  if (market === 'KR') {
    const data = await kisProvider.getDailyOHLCV(symbol, from.replace(/-/g, ''), to.replace(/-/g, ''))
    return data.map((d) => ({ ...d, market: 'KR' as const }))
  } else {
    const data = await polygonProvider.getOHLCV(symbol, 'day', from, to)
    return data.map((d) => ({ ...d, market: 'US' as const }))
  }
}

/**
 * 통합 현재가 조회
 */
export async function getUnifiedPrice(
  symbol: string,
  market: Market
): Promise<UnifiedStockPrice> {
  if (market === 'KR') {
    const data = await kisProvider.getCurrentPrice(symbol)
    return {
      symbol: data.symbol,
      name: data.name,
      price: data.currentPrice,
      change: data.change,
      changePercent: data.changePercent,
      open: data.open,
      high: data.high,
      low: data.low,
      volume: data.volume,
      timestamp: data.timestamp,
      market: 'KR',
      currency: 'KRW',
    }
  } else {
    const data = await polygonProvider.getCurrentPrice(symbol)
    return {
      symbol: data.symbol,
      price: data.price,
      change: data.change,
      changePercent: data.changePercent,
      open: data.open,
      high: data.high,
      low: data.low,
      volume: data.volume,
      timestamp: data.timestamp,
      market: 'US',
      currency: 'USD',
    }
  }
}

/**
 * 시장 운영 시간 확인
 */
export function isMarketOpen(market: Market): boolean {
  if (market === 'KR') {
    return kisIsMarketOpen()
  } else {
    return polygonIsUSMarketOpen()
  }
}

/**
 * 심볼 유효성 검사
 */
export function isValidSymbol(symbol: string, market: Market): boolean {
  if (market === 'KR') {
    return kisIsValidSymbol(symbol)
  } else {
    return polygonIsValidTicker(symbol)
  }
}

// ============================================
// Re-export market helpers (with aliased names)
// ============================================

export {
  kisIsMarketOpen as isKRMarketOpen,
  kisIsPreMarket as isPreMarket,
  kisIsValidSymbol as isValidKRSymbol,
  polygonIsUSMarketOpen as isUSMarketOpen,
  polygonIsExtendedHours as isExtendedHours,
  polygonIsValidTicker as isValidUSTicker,
}
