// ============================================
// Binance WebSocket Adapter
// Exchange-specific message formatting
// ============================================

import type { WSMessage, Ticker } from '@/lib/exchange/types'
import { safeLogger } from '@/lib/utils/safe-logger';

// ============================================
// Types
// ============================================

export interface BinanceTickerResponse {
  e: '24hrTicker' // Event type
  E: number // Event time
  s: string // Symbol
  p: string // Price change
  P: string // Price change percent
  w: string // Weighted average price
  x: string // First trade price
  c: string // Last price
  Q: string // Last quantity
  b: string // Best bid price
  B: string // Best bid quantity
  a: string // Best ask price
  A: string // Best ask quantity
  o: string // Open price
  h: string // High price
  l: string // Low price
  v: string // Total traded base asset volume
  q: string // Total traded quote asset volume
  O: number // Statistics open time
  C: number // Statistics close time
  F: number // First trade ID
  L: number // Last trade ID
  n: number // Total number of trades
}

export interface BinanceMiniTickerResponse {
  e: '24hrMiniTicker'
  E: number
  s: string
  c: string // Close price
  o: string // Open price
  h: string // High price
  l: string // Low price
  v: string // Total traded base asset volume
  q: string // Total traded quote asset volume
}

// ============================================
// Message Formatters
// ============================================

/**
 * Format subscription message for Binance WebSocket
 */
export function formatSubscribeMessage(
  streams: string[],
  id: number = Date.now()
): string {
  return JSON.stringify({
    method: 'SUBSCRIBE',
    params: streams,
    id,
  })
}

/**
 * Format unsubscription message for Binance WebSocket
 */
export function formatUnsubscribeMessage(
  streams: string[],
  id: number = Date.now()
): string {
  return JSON.stringify({
    method: 'UNSUBSCRIBE',
    params: streams,
    id,
  })
}

/**
 * Get stream name for ticker
 * Example: btcusdt@ticker
 */
export function getTickerStreamName(symbol: string): string {
  return `${symbol.toLowerCase()}@ticker`
}

/**
 * Get stream name for mini ticker (smaller payload)
 * Example: btcusdt@miniTicker
 */
export function getMiniTickerStreamName(symbol: string): string {
  return `${symbol.toLowerCase()}@miniTicker`
}

/**
 * Get stream name for orderbook
 * Example: btcusdt@depth20@100ms
 */
export function getOrderBookStreamName(
  symbol: string,
  levels: number = 20,
  updateSpeed: '100ms' | '1000ms' = '100ms'
): string {
  return `${symbol.toLowerCase()}@depth${levels}@${updateSpeed}`
}

/**
 * Get stream name for trades
 * Example: btcusdt@trade
 */
export function getTradeStreamName(symbol: string): string {
  return `${symbol.toLowerCase()}@trade`
}

/**
 * Get stream name for klines/candlesticks
 * Example: btcusdt@kline_1m
 */
export function getKlineStreamName(symbol: string, interval: string = '1m'): string {
  return `${symbol.toLowerCase()}@kline_${interval}`
}

// ============================================
// Message Parsers
// ============================================

/**
 * Parse Binance ticker response to unified Ticker format
 */
export function parseBinanceTicker(data: BinanceTickerResponse): Ticker {
  return {
    symbol: data.s,
    lastPrice: parseFloat(data.c),
    bidPrice: parseFloat(data.b),
    askPrice: parseFloat(data.a),
    high24h: parseFloat(data.h),
    low24h: parseFloat(data.l),
    volume24h: parseFloat(data.v),
    quoteVolume24h: parseFloat(data.q),
    change24h: parseFloat(data.p),
    changePercent24h: parseFloat(data.P),
    timestamp: data.E,
  }
}

/**
 * Parse Binance mini ticker response to unified Ticker format
 */
export function parseBinanceMiniTicker(data: BinanceMiniTickerResponse): Ticker {
  const openPrice = parseFloat(data.o)
  const closePrice = parseFloat(data.c)
  const priceChange = closePrice - openPrice
  const priceChangePercent = openPrice > 0 ? (priceChange / openPrice) * 100 : 0

  return {
    symbol: data.s,
    lastPrice: closePrice,
    bidPrice: 0,
    askPrice: 0,
    high24h: parseFloat(data.h),
    low24h: parseFloat(data.l),
    volume24h: parseFloat(data.v),
    quoteVolume24h: parseFloat(data.q),
    change24h: priceChange,
    changePercent24h: priceChangePercent,
    timestamp: data.E,
  }
}

/**
 * Parse raw Binance message to unified WSMessage format
 */
export function parseBinanceMessage(rawData: string): WSMessage | null {
  try {
    const data = JSON.parse(rawData)

    // Handle subscription/unsubscription response
    if (data.result !== undefined || data.id !== undefined) {
      return null // Acknowledgment, not data
    }

    // Handle individual ticker
    if (data.e === '24hrTicker') {
      const ticker = parseBinanceTicker(data as BinanceTickerResponse)
      return {
        type: 'ticker',
        symbol: ticker.symbol,
        data: ticker,
        timestamp: ticker.timestamp,
      }
    }

    // Handle mini ticker
    if (data.e === '24hrMiniTicker') {
      const ticker = parseBinanceMiniTicker(data as BinanceMiniTickerResponse)
      return {
        type: 'ticker',
        symbol: ticker.symbol,
        data: ticker,
        timestamp: ticker.timestamp,
      }
    }

    // Handle orderbook depth
    if (data.lastUpdateId !== undefined && data.bids && data.asks) {
      return {
        type: 'orderbook',
        symbol: data.s || '',
        data: {
          bids: data.bids,
          asks: data.asks,
          lastUpdateId: data.lastUpdateId,
        },
        timestamp: Date.now(),
      }
    }

    // Handle trade
    if (data.e === 'trade') {
      return {
        type: 'trade',
        symbol: data.s,
        data: {
          id: data.t,
          price: parseFloat(data.p),
          quantity: parseFloat(data.q),
          time: data.T,
          isBuyerMaker: data.m,
        },
        timestamp: data.T,
      }
    }

    // Handle kline/candlestick
    if (data.e === 'kline') {
      const kline = data.k
      return {
        type: 'kline',
        symbol: kline.s,
        data: {
          open: parseFloat(kline.o),
          high: parseFloat(kline.h),
          low: parseFloat(kline.l),
          close: parseFloat(kline.c),
          volume: parseFloat(kline.v),
          openTime: kline.t,
          closeTime: kline.T,
          interval: kline.i,
          isFinal: kline.x,
        },
        timestamp: data.E,
      }
    }

    // Unknown message type
    return {
      type: 'unknown',
      symbol: data.s || '',
      data,
      timestamp: Date.now(),
    }
  } catch {
    safeLogger.warn('[BinanceAdapter] Failed to parse message:', rawData.substring(0, 100))
    return null
  }
}

// ============================================
// Combined Stream URL Builder
// ============================================

/**
 * Build combined stream URL for multiple symbols
 * Example: wss://stream.binance.com:9443/stream?streams=btcusdt@ticker/ethusdt@ticker
 */
export function buildCombinedStreamUrl(streams: string[]): string {
  const baseUrl = 'wss://stream.binance.com:9443/stream'
  return `${baseUrl}?streams=${streams.join('/')}`
}

/**
 * Build single stream URL
 * Example: wss://stream.binance.com:9443/ws/btcusdt@ticker
 */
export function buildSingleStreamUrl(stream: string): string {
  return `wss://stream.binance.com:9443/ws/${stream}`
}
