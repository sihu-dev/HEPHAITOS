// ============================================
// Exchange Order Book API Route
// ============================================

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getExchange } from '@/lib/exchange'
import type { ExchangeId } from '@/types'
import { safeLogger } from '@/lib/utils/safe-logger';
import { withRateLimit } from '@/lib/api/middleware/rate-limit'

// GET /api/exchange/orderbook?exchange=binance&symbol=BTC/USDT&limit=20
async function orderbookHandler(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const exchangeId = searchParams.get('exchange') as ExchangeId
    const symbol = searchParams.get('symbol')
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20', 10))

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
    const orderBook = await exchange.getOrderBook(symbol, limit)

    return NextResponse.json({
      success: true,
      data: {
        exchange: exchangeId,
        ...orderBook,
      },
    })
  } catch (error) {
    safeLogger.error('OrderBook API Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch order book',
        },
      },
      { status: 500 }
    )
  }
}

export const GET = withRateLimit(orderbookHandler, { category: 'exchange' })
