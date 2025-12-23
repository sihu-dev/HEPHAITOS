// ============================================
// Entry Point Analysis API Route
// 타점 분석
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { aiReportGenerator } from '@/lib/ai'
import { safeLogger } from '@/lib/utils/safe-logger';
import { withRateLimit } from '@/lib/api/middleware/rate-limit'

export const dynamic = 'force-dynamic'

/**
 * GET /api/ai/entry-point?symbol=005930
 * Analyze entry point for specific stock
 */
async function entryPointHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')

    if (!symbol) {
      return NextResponse.json(
        {
          success: false,
          error: 'Symbol is required',
        },
        { status: 400 }
      )
    }

    const analysis = await aiReportGenerator.analyzeEntryPoint(symbol)

    return NextResponse.json({
      success: true,
      data: analysis,
    })
  } catch (error) {
    safeLogger.error('[API] Entry point analysis failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed',
      },
      { status: 500 }
    )
  }
}

export const GET = withRateLimit(entryPointHandler, { category: 'ai' })
