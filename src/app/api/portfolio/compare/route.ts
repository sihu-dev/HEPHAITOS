// ============================================
// Portfolio Comparison API Route
// 포트폴리오 비교 및 동기화
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { celebrityPortfolioManager } from '@/lib/mirroring'
import { safeLogger } from '@/lib/utils/safe-logger';
import { withRateLimit } from '@/lib/api/middleware/rate-limit'

export const dynamic = 'force-dynamic'

// ============================================
// Types
// ============================================

interface UserHolding {
  symbol: string
  value: number
}

interface ComparisonResult {
  symbol: string
  name: string
  celebrityWeight: number
  userWeight: number
  difference: number
  suggestion: 'buy' | 'sell' | 'hold'
  suggestedShares?: number
  suggestedValue?: number
}

// ============================================
// API Handlers
// ============================================

/**
 * POST /api/portfolio/compare
 * Compare user portfolio with celebrity portfolio
 */
async function POSTHandler(request: NextRequest) {
  try {
    const body = await request.json()
    const { celebrityId, userHoldings } = body as {
      celebrityId: string
      userHoldings: UserHolding[]
    }

    if (!celebrityId) {
      return NextResponse.json(
        { success: false, error: 'celebrityId is required' },
        { status: 400 }
      )
    }

    if (!userHoldings || !Array.isArray(userHoldings)) {
      return NextResponse.json(
        { success: false, error: 'userHoldings array is required' },
        { status: 400 }
      )
    }

    const celebrity = celebrityPortfolioManager.getCelebrity(celebrityId)
    if (!celebrity) {
      return NextResponse.json(
        { success: false, error: 'Celebrity not found' },
        { status: 404 }
      )
    }

    const celebrityPortfolio = celebrityPortfolioManager.getPortfolio(celebrityId)
    if (!celebrityPortfolio) {
      return NextResponse.json(
        { success: false, error: 'Celebrity portfolio not found' },
        { status: 404 }
      )
    }

    // Calculate comparison
    const comparison = celebrityPortfolioManager.comparePortfolios(celebrityId, userHoldings)

    // Get user total value
    const userTotalValue = userHoldings.reduce((sum, h) => sum + h.value, 0)
    const userWeights = new Map(
      userHoldings.map((h) => [h.symbol, (h.value / userTotalValue) * 100])
    )

    // Find holdings only in user portfolio
    const celebritySymbols = new Set(comparison.map((c) => c.symbol))
    const userOnlyHoldings = userHoldings
      .filter((h) => !celebritySymbols.has(h.symbol))
      .map((h) => ({
        symbol: h.symbol,
        name: h.symbol,
        celebrityWeight: 0,
        userWeight: userWeights.get(h.symbol) || 0,
        difference: -(userWeights.get(h.symbol) || 0),
        suggestion: 'sell' as const,
      }))

    // Calculate sync summary
    const allComparisons: ComparisonResult[] = [
      ...comparison.map((c) => ({
        ...c,
        name: celebrityPortfolio.holdings.find((h) => h.symbol === c.symbol)?.name || c.symbol,
      })),
      ...userOnlyHoldings,
    ]

    const buySuggestions = allComparisons.filter((c) => c.suggestion === 'buy')
    const sellSuggestions = allComparisons.filter((c) => c.suggestion === 'sell')
    const holdSuggestions = allComparisons.filter((c) => c.suggestion === 'hold')

    return NextResponse.json({
      success: true,
      data: {
        celebrity: {
          id: celebrity.id,
          name: celebrity.nameKr,
          performance: celebrityPortfolio.performance,
        },
        comparison: allComparisons,
        summary: {
          totalSymbols: allComparisons.length,
          buys: buySuggestions.length,
          sells: sellSuggestions.length,
          holds: holdSuggestions.length,
          syncScore: Math.round((holdSuggestions.length / allComparisons.length) * 100),
        },
      },
    })
  } catch (error) {
    safeLogger.error('[API] Portfolio comparison failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Comparison failed',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/portfolio/compare
 * Execute portfolio sync (rebalancing)
 */
async function PUTHandler(request: NextRequest) {
  try {
    const body = await request.json()
    const { celebrityId, syncItems, userId } = body as {
      celebrityId: string
      syncItems: ComparisonResult[]
      userId?: string
    }

    if (!celebrityId || !syncItems || !Array.isArray(syncItems)) {
      return NextResponse.json(
        { success: false, error: 'celebrityId and syncItems are required' },
        { status: 400 }
      )
    }

    // In real implementation, execute trades through broker
    const executedTrades = syncItems.map((item) => ({
      symbol: item.symbol,
      action: item.suggestion,
      status: 'pending',
      orderId: `order_${Date.now()}_${item.symbol}`,
    }))

    return NextResponse.json({
      success: true,
      data: {
        message: '리밸런싱 주문이 접수되었습니다',
        trades: executedTrades,
        estimatedCompletion: new Date(Date.now() + 5 * 60 * 1000),
      },
    })
  } catch (error) {
    safeLogger.error('[API] Portfolio sync failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed',
      },
      { status: 500 }
    )
  }
}

export const POST = withRateLimit(POSTHandler, { category: 'api' })
export const PUT = withRateLimit(PUTHandler, { category: 'api' })
