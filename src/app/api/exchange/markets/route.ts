// ============================================
// Exchange Markets API Route
// ============================================

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getExchange } from '@/lib/exchange'
import type { ExchangeId } from '@/types'
import { safeLogger } from '@/lib/utils/safe-logger';
import { withRateLimit } from '@/lib/api/middleware/rate-limit'

// GET /api/exchange/markets?exchange=binance
async function marketsHandler(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const exchangeId = searchParams.get('exchange') as ExchangeId

    if (!exchangeId) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_EXCHANGE', message: 'Exchange ID is required' } },
        { status: 400 }
      )
    }

    const exchange = getExchange(exchangeId)
    const markets = await exchange.getMarkets()

    // Filter active markets only
    const activeMarkets = markets.filter(m => m.status === 'active')

    return NextResponse.json({
      success: true,
      data: {
        exchange: exchangeId,
        markets: activeMarkets,
        count: activeMarkets.length,
        timestamp: Date.now(),
      },
    })
  } catch (error) {
    safeLogger.error('Markets API Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch markets',
        },
      },
      { status: 500 }
    )
  }
}

export const GET = withRateLimit(marketsHandler, { category: 'exchange' })
