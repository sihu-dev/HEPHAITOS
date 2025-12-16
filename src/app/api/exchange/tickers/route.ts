// ============================================
// Exchange Tickers API Route
// ============================================

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getExchange, type Ticker } from '@/lib/exchange'
import type { ExchangeId } from '@/types'
import { exchangeRateLimiter, getClientIP, createRateLimitResponse } from '@/lib/rate-limiter'

// GET /api/exchange/tickers?exchange=binance&symbols=BTC/USDT,ETH/USDT
export async function GET(request: NextRequest) {
  // Rate limiting
  const clientIP = getClientIP(request)
  const rateLimitResult = exchangeRateLimiter.check(`tickers:${clientIP}`)

  if (!rateLimitResult.allowed) {
    return createRateLimitResponse(rateLimitResult.retryAfter!)
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const exchangeId = searchParams.get('exchange') as ExchangeId
    const symbolsParam = searchParams.get('symbols')

    if (!exchangeId) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_EXCHANGE', message: 'Exchange ID is required' } },
        { status: 400 }
      )
    }

    const exchange = getExchange(exchangeId)
    const symbols = symbolsParam ? symbolsParam.split(',') : undefined

    const tickers = await exchange.getTickers(symbols)

    // Convert to a map for easier client-side access
    const tickerMap: Record<string, Ticker> = {}
    tickers.forEach(ticker => {
      tickerMap[ticker.symbol] = ticker
    })

    return NextResponse.json({
      success: true,
      data: {
        exchange: exchangeId,
        tickers: tickerMap,
        count: tickers.length,
        timestamp: Date.now(),
      },
    })
  } catch (error) {
    console.error('Tickers API Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch tickers',
        },
      },
      { status: 500 }
    )
  }
}
