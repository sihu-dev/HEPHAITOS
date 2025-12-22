// ============================================
// Backtest Report API Route
// 백테스트 결과 심층 분석 (Extended Context 200K)
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createClaudeClient } from '@/lib/ai/claude-client'
import { getContextManager } from '@/lib/ai/context-manager'
import { createClient } from '@/lib/supabase/server'
import { safeLogger } from '@/lib/utils/safe-logger'
import { ensureDisclaimer } from '@/lib/safety/safety-net-v2'

export const dynamic = 'force-dynamic'

interface BacktestReportRequest {
  strategyId: string
  includeAllTrades?: boolean // Default: false (include top 100 trades)
  sampleEquityCurve?: boolean // Default: true (sample every 10th point)
}

/**
 * POST /api/ai/backtest-report
 *
 * @description
 * 백테스트 결과를 Claude Extended Context (200K tokens)로 심층 분석
 * - 10년치 데이터를 청킹 없이 한 번에 처리
 * - 상세한 거래 패턴 분석
 * - 자산 곡선 시계열 분석
 *
 * @body strategyId - Strategy ID to analyze
 * @body includeAllTrades - Include all trades (default: false, top 100 only)
 * @body sampleEquityCurve - Sample equity curve (default: true, every 10th point)
 * @returns Comprehensive backtest analysis report
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/ai/backtest-report', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     strategyId: 'strategy-123',
 *     includeAllTrades: true
 *   })
 * })
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Parse request
    const body: BacktestReportRequest = await request.json()
    const { strategyId, includeAllTrades = false, sampleEquityCurve = true } = body

    // 2. Validate
    if (!strategyId) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'strategyId is required' } },
        { status: 400 }
      )
    }

    // 3. Auth check
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    safeLogger.info('[BacktestReport] Request received', {
      userId: user.id,
      strategyId,
      includeAllTrades,
      sampleEquityCurve,
    })

    // 4. Fetch strategy and backtest results
    const { data: strategy, error: fetchError } = await supabase
      .from('strategies')
      .select('id, name, backtest_results')
      .eq('id', strategyId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !strategy) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Strategy not found' } },
        { status: 404 }
      )
    }

    const backtestData = strategy.backtest_results as {
      metrics: Record<string, number | string>
      trades: Array<{ entryTime: number; exitTime: number | null; pnl: number; pnlPercent: number; side: string }>
      equityCurve: Array<{ timestamp: number; equity: number; drawdown: number }>
    }

    if (!backtestData || !backtestData.metrics) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_DATA', message: 'No backtest results available' } },
        { status: 404 }
      )
    }

    // 5. Prepare data (optimize for context)
    const contextManager = getContextManager()

    let trades = backtestData.trades || []
    if (!includeAllTrades && trades.length > 100) {
      // Include top 100 most significant trades (by absolute PnL)
      trades = [...trades].sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl)).slice(0, 100)
      safeLogger.info('[BacktestReport] Sampled trades', {
        original: backtestData.trades.length,
        included: trades.length,
      })
    }

    let equityCurve = backtestData.equityCurve || []
    if (sampleEquityCurve && equityCurve.length > 1000) {
      // Sample every 10th point to reduce size
      equityCurve = equityCurve.filter((_, i) => i % 10 === 0)
      safeLogger.info('[BacktestReport] Sampled equity curve', {
        original: backtestData.equityCurve.length,
        sampled: equityCurve.length,
      })
    }

    const analysisData = {
      metrics: backtestData.metrics,
      trades,
      equityCurve,
      strategyName: strategy.name,
    }

    // 6. Estimate context usage
    const dataText = JSON.stringify(analysisData)
    const estimate = contextManager.estimate(dataText)

    safeLogger.info('[BacktestReport] Context estimate', {
      totalTokens: estimate.tokens,
      utilizationPercent: estimate.utilizationPercent.toFixed(2) + '%',
      canFit: estimate.canFit,
      tradesIncluded: trades.length,
      equityPointsIncluded: equityCurve.length,
    })

    if (!estimate.canFit) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONTEXT_OVERFLOW',
            message: `Data (${estimate.tokens} tokens) exceeds 200K context limit. Try enabling sampling.`,
          },
        },
        { status: 413 }
      )
    }

    // 7. Call Claude API with Extended Context
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: { code: 'CONFIG_ERROR', message: 'Claude API key not configured' } },
        { status: 500 }
      )
    }

    const claudeClient = createClaudeClient({
      apiKey,
      model: 'claude-sonnet-4-5-20250514', // Supports 200K context
      useExtendedContext: true,
    })

    safeLogger.info('[BacktestReport] Calling Claude API', {
      model: 'claude-sonnet-4-5-20250514',
      extendedContext: true,
    })

    const startTime = Date.now()
    const analysis = await claudeClient.analyzeBacktest(analysisData)
    const duration = Date.now() - startTime

    // 8. Add disclaimer
    const safeAnalysis = ensureDisclaimer(analysis)

    // 9. Save report (optional)
    const { error: insertError } = await supabase.from('backtest_reports').insert({
      user_id: user.id,
      strategy_id: strategyId,
      report: safeAnalysis,
      metadata: {
        tokensUsed: estimate.tokens,
        utilizationPercent: estimate.utilizationPercent,
        apiDuration: duration,
        tradesAnalyzed: trades.length,
        equityPointsAnalyzed: equityCurve.length,
      },
      created_at: new Date().toISOString(),
    })

    if (insertError) {
      safeLogger.error('[BacktestReport] Failed to save report', { error: insertError.message })
    }

    safeLogger.info('[BacktestReport] ✅ Analysis completed', {
      userId: user.id,
      strategyId,
      tokensUsed: estimate.tokens,
      duration: `${duration}ms`,
      reportLength: safeAnalysis.length,
    })

    return NextResponse.json({
      success: true,
      data: {
        strategyName: strategy.name,
        report: safeAnalysis,
        metadata: {
          tokensUsed: estimate.tokens,
          utilizationPercent: estimate.utilizationPercent,
          apiDuration: duration,
          tradesAnalyzed: trades.length,
          equityPointsAnalyzed: equityCurve.length,
        },
      },
    })
  } catch (error) {
    safeLogger.error('[BacktestReport] Error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate backtest report',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/ai/backtest-report?strategyId=xxx
 *
 * @description
 * Retrieve previously generated backtest report
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const strategyId = searchParams.get('strategyId')

    if (!strategyId) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'strategyId is required' } },
        { status: 400 }
      )
    }

    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Get latest report for this strategy
    const { data: report, error: fetchError } = await supabase
      .from('backtest_reports')
      .select('*')
      .eq('strategy_id', strategyId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (fetchError || !report) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'No report found for this strategy' } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        report: report.report,
        metadata: report.metadata,
        createdAt: report.created_at,
      },
    })
  } catch (error) {
    safeLogger.error('[BacktestReport] GET Error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve report',
        },
      },
      { status: 500 }
    )
  }
}
