// ============================================
// Compare Strategies API Route
// 여러 전략의 백테스트 결과를 동시에 비교 (Extended Context 200K)
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createClaudeClient } from '@/lib/ai/claude-client'
import { getContextManager } from '@/lib/ai/context-manager'
import { createClient } from '@/lib/supabase/server'
import { safeLogger } from '@/lib/utils/safe-logger'
import { ensureDisclaimer } from '@/lib/safety/safety-net-v2'

export const dynamic = 'force-dynamic'

interface CompareRequest {
  strategyIds: string[] // Array of strategy IDs (2-3개)
}

/**
 * POST /api/ai/compare-strategies
 *
 * @description
 * 여러 전략의 백테스트 결과를 Claude Extended Context (200K tokens)로 비교 분석
 *
 * @body strategyIds - Array of strategy IDs to compare (2-3)
 * @returns Comparative analysis report
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/ai/compare-strategies', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     strategyIds: ['strategy-1', 'strategy-2', 'strategy-3']
 *   })
 * })
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Parse request
    const body: CompareRequest = await request.json()
    const { strategyIds } = body

    // 2. Validate
    if (!strategyIds || !Array.isArray(strategyIds)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'strategyIds must be an array' } },
        { status: 400 }
      )
    }

    if (strategyIds.length < 2) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'At least 2 strategies required' } },
        { status: 400 }
      )
    }

    if (strategyIds.length > 3) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Maximum 3 strategies allowed' } },
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

    safeLogger.info('[CompareStrategies] Request received', {
      userId: user.id,
      strategyCount: strategyIds.length,
    })

    // 4. Fetch strategy backtest results from Supabase
    const strategies = await Promise.all(
      strategyIds.map(async (id) => {
        const { data: strategy, error } = await supabase
          .from('strategies')
          .select('id, name, backtest_results')
          .eq('id', id)
          .eq('user_id', user.id)
          .single()

        if (error || !strategy) {
          throw new Error(`Strategy not found: ${id}`)
        }

        // Backtest results should be stored in JSON format
        const backtestData = strategy.backtest_results as {
          metrics: Record<string, number | string>
          trades: Array<Record<string, unknown>>
          equityCurve: Array<Record<string, number>>
        }

        if (!backtestData || !backtestData.metrics) {
          throw new Error(`No backtest results for strategy: ${id}`)
        }

        return {
          name: strategy.name,
          metrics: backtestData.metrics,
          trades: backtestData.trades || [],
          equityCurve: backtestData.equityCurve || [],
        }
      })
    )

    // 5. Check context window
    const contextManager = getContextManager()
    const totalData = strategies.map((s) =>
      JSON.stringify({ metrics: s.metrics, trades: s.trades.slice(0, 100), equityCurve: s.equityCurve })
    )
    const estimate = contextManager.estimateMultiple(totalData)

    safeLogger.info('[CompareStrategies] Context estimate', {
      strategies: strategies.length,
      totalTokens: estimate.tokens,
      utilizationPercent: estimate.utilizationPercent.toFixed(2) + '%',
      canFit: estimate.canFit,
    })

    if (!estimate.canFit) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONTEXT_OVERFLOW',
            message: `Total data (${estimate.tokens} tokens) exceeds 200K context limit`,
          },
        },
        { status: 413 }
      )
    }

    // 6. Call Claude API with Extended Context
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

    safeLogger.info('[CompareStrategies] Calling Claude API', {
      model: 'claude-sonnet-4-5-20250514',
      extendedContext: true,
    })

    const analysis = await claudeClient.compareStrategies(strategies)

    // 7. Add disclaimer
    const safeAnalysis = ensureDisclaimer(analysis)

    // 8. Save comparison result (optional)
    const { error: insertError } = await supabase.from('strategy_comparisons').insert({
      user_id: user.id,
      strategy_ids: strategyIds,
      analysis: safeAnalysis,
      created_at: new Date().toISOString(),
    })

    if (insertError) {
      safeLogger.error('[CompareStrategies] Failed to save comparison', { error: insertError.message })
    }

    safeLogger.info('[CompareStrategies] ✅ Comparison completed', {
      userId: user.id,
      strategyCount: strategies.length,
      analysisLength: safeAnalysis.length,
    })

    return NextResponse.json({
      success: true,
      data: {
        strategies: strategies.map((s) => ({ name: s.name })),
        analysis: safeAnalysis,
        metadata: {
          tokensUsed: estimate.tokens,
          utilizationPercent: estimate.utilizationPercent,
        },
      },
    })
  } catch (error) {
    safeLogger.error('[CompareStrategies] Error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to compare strategies',
        },
      },
      { status: 500 }
    )
  }
}
