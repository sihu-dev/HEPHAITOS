// ============================================
// Celebrity Trades API Route
// 유명인 거래 내역 조회
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { celebrityPortfolioManager } from '@/lib/mirroring'
import { safeLogger } from '@/lib/utils/safe-logger';

export const dynamic = 'force-dynamic'

/**
 * GET /api/celebrities/trades
 * Get recent trades from celebrities
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const celebrityId = searchParams.get('celebrityId')
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    if (celebrityId) {
      const trades = celebrityPortfolioManager.getTrades(celebrityId, limit)
      return NextResponse.json({
        success: true,
        data: trades,
      })
    }

    const allTrades = celebrityPortfolioManager.getAllRecentTrades(limit)

    // Add celebrity info to each trade
    const tradesWithCelebrity = allTrades.map((trade) => {
      const celebrity = celebrityPortfolioManager.getCelebrity(trade.celebrityId)
      return {
        ...trade,
        celebrityName: celebrity?.name || 'Unknown',
        celebrityNameKr: celebrity?.nameKr || '알 수 없음',
      }
    })

    return NextResponse.json({
      success: true,
      data: tradesWithCelebrity,
    })
  } catch (error) {
    safeLogger.error('[API] Get celebrity trades failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get trades',
      },
      { status: 500 }
    )
  }
}
