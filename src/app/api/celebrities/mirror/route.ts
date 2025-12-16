// ============================================
// Celebrity Mirror API Route
// 포트폴리오 미러링 설정 및 계산
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { celebrityPortfolioManager } from '@/lib/mirroring'

export const dynamic = 'force-dynamic'

/**
 * GET /api/celebrities/mirror
 * Calculate mirror portfolio allocation
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const celebrityId = searchParams.get('celebrityId')
    const investmentAmount = parseFloat(searchParams.get('amount') || '10000000')

    if (!celebrityId) {
      return NextResponse.json(
        { success: false, error: 'celebrityId is required' },
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

    const allocation = celebrityPortfolioManager.calculateMirrorPortfolio(
      celebrityId,
      investmentAmount
    )

    const totalAllocated = allocation.reduce((sum, a) => sum + a.value, 0)

    return NextResponse.json({
      success: true,
      data: {
        celebrity: {
          id: celebrity.id,
          name: celebrity.name,
          nameKr: celebrity.nameKr,
        },
        investmentAmount,
        allocation,
        totalAllocated,
        cashRemaining: investmentAmount - totalAllocated,
      },
    })
  } catch (error) {
    console.error('[API] Calculate mirror failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate mirror',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/celebrities/mirror
 * Setup mirror configuration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      celebrityId,
      investmentAmount,
      autoMirror = false,
      minTradeValue,
      excludeSymbols,
      notifyOnTrade = true,
    } = body

    if (!userId || !celebrityId || !investmentAmount) {
      return NextResponse.json(
        {
          success: false,
          error: 'userId, celebrityId, and investmentAmount are required',
        },
        { status: 400 }
      )
    }

    celebrityPortfolioManager.setupMirror({
      userId,
      celebrityId,
      investmentAmount,
      autoMirror,
      minTradeValue,
      excludeSymbols,
      notifyOnTrade,
    })

    return NextResponse.json({
      success: true,
      message: 'Mirror configuration saved',
    })
  } catch (error) {
    console.error('[API] Setup mirror failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to setup mirror',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/celebrities/mirror
 * Compare user portfolio with celebrity
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { celebrityId, userHoldings } = body

    if (!celebrityId || !Array.isArray(userHoldings)) {
      return NextResponse.json(
        {
          success: false,
          error: 'celebrityId and userHoldings array are required',
        },
        { status: 400 }
      )
    }

    const comparison = celebrityPortfolioManager.comparePortfolios(
      celebrityId,
      userHoldings
    )

    const suggestions = comparison.filter((c) => c.suggestion !== 'hold')

    return NextResponse.json({
      success: true,
      data: {
        comparison,
        suggestions,
        matchScore: calculateMatchScore(comparison),
      },
    })
  } catch (error) {
    console.error('[API] Compare portfolios failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to compare',
      },
      { status: 500 }
    )
  }
}

function calculateMatchScore(
  comparison: { difference: number }[]
): number {
  if (comparison.length === 0) return 0

  const totalDiff = comparison.reduce(
    (sum, c) => sum + Math.abs(c.difference),
    0
  )
  const avgDiff = totalDiff / comparison.length

  // Score: 100 = perfect match, 0 = completely different
  return Math.max(0, Math.round(100 - avgDiff * 2))
}
