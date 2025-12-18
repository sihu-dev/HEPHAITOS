/**
 * Strategy Leaderboard API
 * Loop 12: 전략 성과 집계 시스템
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type SortBy = 'sharpe' | 'cagr' | 'return' | 'backtest_count';

interface LeaderboardQuery {
  sortBy?: SortBy;
  limit?: number;
  offset?: number;
  minBacktests?: number;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Query parameters
    const sortBy = (searchParams.get('sortBy') || 'sharpe') as SortBy;
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '100'),
      500
    ); // Max 500
    const offset = parseInt(searchParams.get('offset') || '0');
    const minBacktests = parseInt(searchParams.get('minBacktests') || '3');

    const supabase = await createServerSupabaseClient();

    // Leaderboard entry type
    interface LeaderboardEntry {
      strategy_id: string;
      strategy_name: string;
      creator_id: string;
      backtest_count: number;
      avg_return: number;
      avg_sharpe: number;
      avg_cagr: number;
      avg_mdd: number;
      rank_sharpe: number;
      rank_cagr: number;
      last_backtest_at: string;
    }

    // 1. Materialized View에서 데이터 조회
    const { data, error, count } = await (supabase as unknown as {
      rpc: (fn: string, params: Record<string, unknown>) => { returns: <T>() => Promise<{ data: T | null; error: Error | null; count?: number }> }
    }).rpc('get_leaderboard', {
      p_sort_by: sortBy,
      p_limit: limit,
      p_offset: offset,
    }).returns<LeaderboardEntry[]>();

    if (error) {
      console.error('[Leaderboard] Query error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'QUERY_FAILED',
            message: '리더보드 조회에 실패했습니다',
          },
        },
        { status: 500 }
      );
    }

    // 2. 최소 백테스트 필터링
    const filtered = data?.filter((s: LeaderboardEntry) => s.backtest_count >= minBacktests) || [];

    // 3. 전체 개수 조회
    const { count: totalCount } = await supabase
      .from('strategy_performance_agg')
      .select('*', { count: 'exact', head: true });

    // 4. 응답
    return NextResponse.json(
      {
        success: true,
        data: {
          strategies: filtered.map((s: LeaderboardEntry, index: number) => ({
            rank: offset + index + 1,
            strategyId: s.strategy_id,
            strategyName: s.strategy_name,
            creatorId: s.creator_id,

            // 성과 지표
            backtestCount: s.backtest_count,
            avgReturn: s.avg_return,
            avgSharpe: s.avg_sharpe,
            avgCagr: s.avg_cagr,
            avgMdd: s.avg_mdd,

            // 랭킹
            rankSharpe: s.rank_sharpe,
            rankCagr: s.rank_cagr,

            // 메타
            lastBacktestAt: s.last_backtest_at,
          })),
          pagination: {
            total: totalCount || 0,
            limit,
            offset,
            hasMore: (offset + limit) < (totalCount || 0),
          },
          cachedAt: new Date().toISOString(),
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
    console.error('[Leaderboard] Error:', error);
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
