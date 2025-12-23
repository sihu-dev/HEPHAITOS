/**
 * Strategy Performance API
 * Loop 12: 개별 전략 성과 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { safeLogger } from '@/lib/utils/safe-logger';
import { withRateLimit } from '@/lib/api/middleware/rate-limit'

async function GETHandler(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: strategyId } = await context.params;
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: { code: 'SUPABASE_ERROR', message: 'Database connection failed' } },
        { status: 500 }
      )
    }

    // 1. 집계 성과 조회 (Materialized View)
    interface StrategyPerformanceData {
      strategy_id: string
      strategy_name: string
      backtest_count: number
      avg_return: number
      avg_sharpe: number
      avg_cagr: number
      rank_sharpe: number
      rank_cagr: number
      last_backtest_at: string
    }
    const { data: aggregate, error: aggError } = await (supabase as unknown as {
      rpc: (fn: string, params: Record<string, unknown>) => { single: () => Promise<{ data: StrategyPerformanceData | null; error: Error | null }> }
    }).rpc('get_strategy_performance', {
      p_strategy_id: strategyId,
    }).single();

    if (aggError) {
      safeLogger.error('[Strategy Performance] Aggregate error:', aggError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'QUERY_FAILED',
            message: '전략 성과 조회에 실패했습니다',
          },
        },
        { status: 500 }
      );
    }

    if (!aggregate) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '전략을 찾을 수 없습니다',
          },
        },
        { status: 404 }
      );
    }

    // 2. 개별 백테스트 히스토리 조회 (최근 20개)
    const { data: history, error: historyError } = await supabase
      .from('backtest_results')
      .select('id, total_return, sharpe_ratio, cagr, max_drawdown, created_at')
      .eq('strategy_id', strategyId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(20);

    if (historyError) {
      safeLogger.error('[Strategy Performance] History error:', historyError);
    }

    // 3. 응답
    return NextResponse.json(
      {
        success: true,
        data: {
          strategyId: aggregate.strategy_id,
          strategyName: aggregate.strategy_name,

          // 집계 성과
          aggregate: {
            backtestCount: aggregate.backtest_count,
            avgReturn: aggregate.avg_return,
            avgSharpe: aggregate.avg_sharpe,
            avgCagr: aggregate.avg_cagr,
            rankSharpe: aggregate.rank_sharpe,
            rankCagr: aggregate.rank_cagr,
            lastBacktestAt: aggregate.last_backtest_at,
          },

          // 개별 백테스트 히스토리
          history: history || [],
        },
      },
      {
        status: 200,
        headers: {
          // 1시간 캐싱
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=7200',
        },
      }
    );
  } catch (error) {
    safeLogger.error('[Strategy Performance] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '서버 오류가 발생했습니다',
        },
      },
      { status: 500 }
    );
  }
}

export const GET = withRateLimit(GETHandler, { category: 'api' })
