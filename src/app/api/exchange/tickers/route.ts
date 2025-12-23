// ============================================
// Exchange Tickers API Route
// ============================================

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getExchange, type Ticker } from '@/lib/exchange'
import type { ExchangeId } from '@/types'
import { safeLogger } from '@/lib/utils/safe-logger';
import { withRateLimit } from '@/lib/api/middleware/rate-limit'

// GET /api/exchange/tickers?exchange=binance&symbols=BTC/USDT,ETH/USDT
async function tickersHandler(request: NextRequest) {
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
    safeLogger.error('Tickers API Error:', error)
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

export const GET = withRateLimit(tickersHandler, { category: 'exchange' })
