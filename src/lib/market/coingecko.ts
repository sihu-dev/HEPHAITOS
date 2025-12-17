// ============================================
// CoinGecko API Service
// Free tier market data provider (fallback)
// ============================================

import type { MarketData } from '@/types'

// ============================================
// Types
// ============================================

interface CoinGeckoPrice {
  [coinId: string]: {
    usd: number
    usd_24h_change: number
    usd_24h_vol: number
    usd_market_cap: number
  }
}

interface CoinGeckoMarket {
  id: string
  symbol: string
  name: string
  current_price: number
  market_cap: number
  market_cap_rank: number
  total_volume: number
  high_24h: number
  low_24h: number
  price_change_24h: number
  price_change_percentage_24h: number
  circulating_supply: number
  total_supply: number
  ath: number
  ath_change_percentage: number
  atl: number
  atl_change_percentage: number
  last_updated: string
}

// ============================================
// Constants
// ============================================

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3'

// Map from display symbol to CoinGecko ID
const SYMBOL_TO_COINGECKO_ID: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  XRP: 'ripple',
  BNB: 'binancecoin',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  AVAX: 'avalanche-2',
  DOT: 'polkadot',
  MATIC: 'matic-network',
  LINK: 'chainlink',
  UNI: 'uniswap',
  ATOM: 'cosmos',
  LTC: 'litecoin',
  TRX: 'tron',
}

// Default symbols to fetch
const DEFAULT_SYMBOLS = ['BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'ADA', 'DOGE', 'AVAX']

// Cache configuration
let marketCache: MarketData[] = []
let cacheTimestamp = 0
const CACHE_TTL = 60 * 1000 // 1 minute cache

// ============================================
// API Functions
// ============================================

/**
 * Fetch simple price data from CoinGecko
 * Rate limit: 10-30 calls/minute on free tier
 */
export async function fetchCoinGeckoPrices(
  symbols: string[] = DEFAULT_SYMBOLS
): Promise<MarketData[]> {
  // Check cache first
  if (Date.now() - cacheTimestamp < CACHE_TTL && marketCache.length > 0) {
    return marketCache.filter(m => symbols.includes(m.symbol))
  }

  try {
    const coinIds = symbols
      .map(s => SYMBOL_TO_COINGECKO_ID[s.toUpperCase()])
      .filter(Boolean)
      .join(',')

    if (!coinIds) {
      console.warn('[CoinGecko] No valid coin IDs found for symbols:', symbols)
      return getMockMarketData(symbols)
    }

    const url = `${COINGECKO_API_BASE}/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
      next: { revalidate: 60 }, // Cache for 60 seconds
    })

    if (!response.ok) {
      console.warn('[CoinGecko] API error:', response.status)
      return getMockMarketData(symbols)
    }

    const data: CoinGeckoPrice = await response.json()

    const result = symbols.map(symbol => {
      const coinId = SYMBOL_TO_COINGECKO_ID[symbol.toUpperCase()]
      const priceData = coinId ? data[coinId] : null

      if (priceData) {
        return {
          symbol: symbol.toUpperCase(),
          price: priceData.usd,
          change24h: priceData.usd_24h_change,
          volume24h: priceData.usd_24h_vol,
          high24h: 0, // Not available in simple price endpoint
          low24h: 0,
          marketCap: priceData.usd_market_cap,
        }
      }

      // Return mock data if coin not found
      return getMockDataForSymbol(symbol)
    })

    // Update cache
    marketCache = result
    cacheTimestamp = Date.now()

    return result
  } catch (error) {
    console.error('[CoinGecko] Fetch error:', error)
    return getMockMarketData(symbols)
  }
}

/**
 * Fetch detailed market data from CoinGecko
 * Includes high/low prices
 */
export async function fetchCoinGeckoMarkets(
  symbols: string[] = DEFAULT_SYMBOLS
): Promise<MarketData[]> {
  try {
    const coinIds = symbols
      .map(s => SYMBOL_TO_COINGECKO_ID[s.toUpperCase()])
      .filter(Boolean)
      .join(',')

    if (!coinIds) {
      return getMockMarketData(symbols)
    }

    const url = `${COINGECKO_API_BASE}/coins/markets?vs_currency=usd&ids=${coinIds}&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h`

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
      next: { revalidate: 60 },
    })

    if (!response.ok) {
      console.warn('[CoinGecko] Markets API error:', response.status)
      return getMockMarketData(symbols)
    }

    const data: CoinGeckoMarket[] = await response.json()

    const result = symbols.map(symbol => {
      const upperSymbol = symbol.toUpperCase()
      const market = data.find(m => m.symbol.toUpperCase() === upperSymbol)

      if (market) {
        return {
          symbol: upperSymbol,
          price: market.current_price,
          change24h: market.price_change_percentage_24h,
          volume24h: market.total_volume,
          high24h: market.high_24h,
          low24h: market.low_24h,
          marketCap: market.market_cap,
        }
      }

      return getMockDataForSymbol(symbol)
    })

    // Update cache
    marketCache = result
    cacheTimestamp = Date.now()

    return result
  } catch (error) {
    console.error('[CoinGecko] Markets fetch error:', error)
    return getMockMarketData(symbols)
  }
}

// ============================================
// Mock Data (Fallback)
// ============================================

const MOCK_PRICES: Record<string, Omit<MarketData, 'symbol'>> = {
  BTC: { price: 97245.50, change24h: 2.34, volume24h: 32400000000, high24h: 98123.00, low24h: 94567.00, marketCap: 1920000000000 },
  ETH: { price: 3842.20, change24h: -0.82, volume24h: 18700000000, high24h: 3912.50, low24h: 3798.00, marketCap: 462000000000 },
  SOL: { price: 224.85, change24h: 5.67, volume24h: 4200000000, high24h: 228.50, low24h: 212.30, marketCap: 105000000000 },
  XRP: { price: 2.34, change24h: 1.23, volume24h: 8900000000, high24h: 2.42, low24h: 2.28, marketCap: 134000000000 },
  BNB: { price: 712.45, change24h: 0.45, volume24h: 2100000000, high24h: 718.90, low24h: 705.20, marketCap: 109000000000 },
  ADA: { price: 1.12, change24h: 3.21, volume24h: 1800000000, high24h: 1.15, low24h: 1.08, marketCap: 40000000000 },
  DOGE: { price: 0.42, change24h: -1.45, volume24h: 2500000000, high24h: 0.44, low24h: 0.41, marketCap: 62000000000 },
  AVAX: { price: 52.30, change24h: 4.12, volume24h: 890000000, high24h: 53.80, low24h: 49.50, marketCap: 21000000000 },
}

function getMockDataForSymbol(symbol: string): MarketData {
  const upperSymbol = symbol.toUpperCase()
  const mock = MOCK_PRICES[upperSymbol]

  if (mock) {
    return { symbol: upperSymbol, ...mock }
  }

  return {
    symbol: upperSymbol,
    price: 100,
    change24h: 0,
    volume24h: 0,
    high24h: 100,
    low24h: 100,
    marketCap: 0,
  }
}

function getMockMarketData(symbols: string[]): MarketData[] {
  return symbols.map(getMockDataForSymbol)
}

// ============================================
// Utility Functions
// ============================================

/**
 * Get supported symbols list
 */
export function getSupportedSymbols(): string[] {
  return Object.keys(SYMBOL_TO_COINGECKO_ID)
}

/**
 * Check if a symbol is supported
 */
export function isSymbolSupported(symbol: string): boolean {
  return symbol.toUpperCase() in SYMBOL_TO_COINGECKO_ID
}

/**
 * Clear the cache
 */
export function clearMarketCache(): void {
  marketCache = []
  cacheTimestamp = 0
}
