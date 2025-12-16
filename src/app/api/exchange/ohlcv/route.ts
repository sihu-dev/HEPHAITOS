// ============================================
// Exchange OHLCV (Candlestick) API Route
// ============================================

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getExchange } from '@/lib/exchange'
import type { ExchangeId } from '@/types'
import { exchangeRateLimiter, getClientIP, createRateLimitResponse } from '@/lib/rate-limiter'

// GET /api/exchange/ohlcv?exchange=binance&symbol=BTC/USDT&interval=1h&limit=100
export async function GET(request: NextRequest) {
  // Rate limiting
  const clientIP = getClientIP(request)
  const rateLimitResult = exchangeRateLimiter.check(`ohlcv:${clientIP}`)

  if (!rateLimitResult.allowed) {
    return createRateLimitResponse(rateLimitResult.retryAfter!)
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const exchangeId = searchParams.get('exchange') as ExchangeId
    const symbol = searchParams.get('symbol')
    const interval = searchParams.get('interval') || '1h'
    const limit = Math.min(500, parseInt(searchParams.get('limit') || '100', 10))

    if (!exchangeId) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_EXCHANGE', message: 'Exchange ID is required' } },
        { status: 400 }
      )
    }

    if (!symbol) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_SYMBOL', message: 'Symbol is required' } },
        { status: 400 }
      )
    }

    const exchange = getExchange(exchangeId)
    const ohlcv = await exchange.getOHLCV(symbol, interval, limit)

    return NextResponse.json({
      success: true,
      data: {
        exchange: exchangeId,
        symbol,
        interval,
        ohlcv,
        count: ohlcv.length,
        timestamp: Date.now(),
      },
    })
  } catch (error) {
    console.error('OHLCV API Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch OHLCV data',
        },
      },
      { status: 500 }
    )
  }
}
