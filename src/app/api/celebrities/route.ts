// ============================================
// Celebrity Portfolio API Route
// 유명인 포트폴리오 조회
// ============================================

import { NextRequest } from 'next/server'
import { celebrityPortfolioManager } from '@/lib/mirroring'
import { jsonSuccess, notFoundError, internalError } from '@/lib/api-response'
import { safeLogger } from '@/lib/utils/safe-logger';

export const dynamic = 'force-dynamic'

/**
 * GET /api/celebrities
 * Get all celebrities or specific celebrity
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const celebrityId = searchParams.get('id')

    if (celebrityId) {
      const celebrity = celebrityPortfolioManager.getCelebrity(celebrityId)
      if (!celebrity) {
        return notFoundError('셀러브리티')
      }

      const portfolio = celebrityPortfolioManager.getPortfolio(celebrityId)
      const recentTrades = celebrityPortfolioManager.getTrades(celebrityId, 5)

      return jsonSuccess({
        celebrity,
        portfolio,
        recentTrades,
      })
    }

    const celebrities = celebrityPortfolioManager.getCelebrities()
    const celebritiesWithPerformance = celebrities.map((celebrity) => {
      const portfolio = celebrityPortfolioManager.getPortfolio(celebrity.id)
      return {
        ...celebrity,
        performance: portfolio?.performance || null,
      }
    })

    return jsonSuccess(celebritiesWithPerformance)
  } catch (error) {
    safeLogger.error('[API] Get celebrities failed:', error)
    return internalError(
      error instanceof Error ? error.message : '셀러브리티 조회에 실패했습니다.'
    )
  }
}
