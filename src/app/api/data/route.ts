// ============================================
// Data API with Fallback
// Loop 19: 데이터 Fallback 설계
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { safeLogger } from '@/lib/utils/safe-logger'
import { withRateLimit } from '@/lib/api/middleware/rate-limit'
import {
  getDataFallbackManager,
  fetchCongressTrades,
  fetchStockQuote,
  fetchSecFilings,
  type DataSource,
} from '@/lib/data/fallback-manager'
import {
  createCongressTradeFetchers,
  createStockQuoteFetchers,
  createSecFilingsFetchers,
} from '@/lib/data/sources'

/**
 * GET /api/data
 * 데이터 조회 (with fallback)
 */
async function GETHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const symbol = searchParams.get('symbol')
    const cik = searchParams.get('cik')
    const skipCache = searchParams.get('skipCache') === 'true'

    if (!type) {
      return NextResponse.json({ error: 'Type required' }, { status: 400 })
    }

    const options = { skipCache }

    switch (type) {
      case 'congress_trades': {
        const fetchers = createCongressTradeFetchers()
        const result = await fetchCongressTrades(fetchers, symbol || undefined, options)

        return NextResponse.json({
          success: result.success,
          data: result.data,
          meta: {
            source: result.source,
            usedFallback: result.usedFallback,
            latency: result.latency,
            cached: result.cached,
          },
          disclaimer: '본 데이터는 교육 목적이며 투자 조언이 아닙니다.',
        })
      }

      case 'stock_quote': {
        if (!symbol) {
          return NextResponse.json({ error: 'Symbol required' }, { status: 400 })
        }

        const fetchers = createStockQuoteFetchers(symbol)
        const result = await fetchStockQuote(fetchers, symbol, options)

        return NextResponse.json({
          success: result.success,
          data: result.data,
          meta: {
            source: result.source,
            usedFallback: result.usedFallback,
            latency: result.latency,
            cached: result.cached,
          },
        })
      }

      case 'sec_filings': {
        const fetchers = createSecFilingsFetchers(cik || undefined)
        const result = await fetchSecFilings(fetchers, cik || undefined, options)

        return NextResponse.json({
          success: result.success,
          data: result.data,
          meta: {
            source: result.source,
            usedFallback: result.usedFallback,
            latency: result.latency,
            cached: result.cached,
          },
        })
      }

      case 'source_status': {
        // 데이터 소스 상태 조회
        const manager = getDataFallbackManager()
        const status = manager.getSourceStatus()

        return NextResponse.json({
          type: 'source_status',
          sources: status,
        })
      }

      default:
        return NextResponse.json({ error: 'Unknown data type' }, { status: 400 })
    }
  } catch (error) {
    safeLogger.error('[Data API] Unexpected error', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/data
 * 데이터 소스 관리
 */
async function POSTHandler(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, source } = body

    const manager = getDataFallbackManager()

    switch (action) {
      case 'reset_source': {
        if (!source) {
          return NextResponse.json({ error: 'Source required' }, { status: 400 })
        }

        manager.resetSource(source as DataSource)

        return NextResponse.json({
          success: true,
          message: `Source ${source} reset`,
        })
      }

      case 'disable_source': {
        if (!source) {
          return NextResponse.json({ error: 'Source required' }, { status: 400 })
        }

        manager.disableSource(source as DataSource)

        return NextResponse.json({
          success: true,
          message: `Source ${source} disabled`,
        })
      }

      case 'enable_source': {
        if (!source) {
          return NextResponse.json({ error: 'Source required' }, { status: 400 })
        }

        manager.enableSource(source as DataSource)

        return NextResponse.json({
          success: true,
          message: `Source ${source} enabled`,
        })
      }

      case 'clear_cache': {
        manager.clearCache()

        return NextResponse.json({
          success: true,
          message: 'Cache cleared',
        })
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    safeLogger.error('[Data API] Post error', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const GET = withRateLimit(GETHandler, { category: 'api' })
export const POST = withRateLimit(POSTHandler, { category: 'api' })
