// ============================================
// Strategy Insights API (Network Effect)
// Loop 16: 전략 성과 네트워크 효과
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { safeLogger } from '@/lib/utils/safe-logger'
import { withRateLimit } from '@/lib/api/middleware/rate-limit'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface PopularStrategy {
  strategy_hash: string
  strategy_type: string
  strategy_tags: string[]
  market_condition: string
  timeframe: string
  total_runs: number
  total_users: number
  avg_return: number
  win_rate: number
  sharpe_ratio: number
  confidence_score: number
  rank: number
}

/**
 * GET /api/insights/strategies
 * 전략 인사이트 조회 (익명화된 집계 데이터)
 */
async function GETHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'popular'
    const condition = searchParams.get('condition')
    const timeframe = searchParams.get('timeframe') || '1w'
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    if (type === 'popular') {
      // 인기 전략 조회
      const { data, error } = await supabase.rpc('get_popular_strategies', {
        p_market_condition: condition || null,
        p_timeframe: timeframe,
        p_limit: Math.min(limit, 50),
      })

      if (error) {
        safeLogger.error('[Strategy Insights] Popular query error', { error })
        return NextResponse.json({ error: 'Failed to fetch popular strategies' }, { status: 500 })
      }

      return NextResponse.json({
        type: 'popular',
        market_condition: condition || 'all',
        timeframe,
        data: data || [],
        count: data?.length || 0,
        disclaimer: '본 데이터는 교육 목적의 익명화된 집계 데이터입니다. 투자 조언이 아닙니다.',
      })
    }

    if (type === 'by_condition') {
      // 시장 조건별 최적 전략
      const { data, error } = await supabase.rpc('get_best_strategies_by_condition')

      if (error) {
        safeLogger.error('[Strategy Insights] By condition query error', { error })
        return NextResponse.json({ error: 'Failed to fetch strategies by condition' }, { status: 500 })
      }

      return NextResponse.json({
        type: 'by_condition',
        data: data || [],
        disclaimer: '시장 조건별 성과는 과거 데이터 기반이며 미래 수익을 보장하지 않습니다.',
      })
    }

    if (type === 'compare') {
      // 전략 비교
      const strategyHash = searchParams.get('hash')

      if (!strategyHash) {
        return NextResponse.json({ error: 'Strategy hash required' }, { status: 400 })
      }

      const { data, error } = await supabase.rpc('compare_strategy_performance', {
        p_strategy_hash: strategyHash,
        p_timeframe: timeframe,
      })

      if (error) {
        safeLogger.error('[Strategy Insights] Compare query error', { error })
        return NextResponse.json({ error: 'Failed to compare strategy' }, { status: 500 })
      }

      return NextResponse.json({
        type: 'compare',
        data: data || {},
        disclaimer: '비교 데이터는 참고용이며 실제 성과와 다를 수 있습니다.',
      })
    }

    if (type === 'insights') {
      // 전체 인사이트
      const { data, error } = await supabase
        .from('strategy_insights')
        .select('*')

      if (error) {
        safeLogger.error('[Strategy Insights] Insights query error', { error })
        return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 })
      }

      return NextResponse.json({
        type: 'insights',
        data: data || [],
      })
    }

    if (type === 'type_performance') {
      // 전략 타입별 성과
      const { data, error } = await supabase
        .from('strategy_type_performance')
        .select('*')

      if (error) {
        safeLogger.error('[Strategy Insights] Type performance query error', { error })
        return NextResponse.json({ error: 'Failed to fetch type performance' }, { status: 500 })
      }

      return NextResponse.json({
        type: 'type_performance',
        data: data || [],
      })
    }

    if (type === 'tags') {
      // 전략 태그 목록
      const { data, error } = await supabase
        .from('strategy_tags')
        .select('*')
        .order('usage_count', { ascending: false })

      if (error) {
        safeLogger.error('[Strategy Insights] Tags query error', { error })
        return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
      }

      return NextResponse.json({
        type: 'tags',
        data: data || [],
      })
    }

    if (type === 'market') {
      // 최근 시장 조건
      const days = parseInt(searchParams.get('days') || '30', 10)

      const { data, error } = await supabase
        .from('market_conditions')
        .select('*')
        .order('date', { ascending: false })
        .limit(days)

      if (error) {
        safeLogger.error('[Strategy Insights] Market query error', { error })
        return NextResponse.json({ error: 'Failed to fetch market conditions' }, { status: 500 })
      }

      return NextResponse.json({
        type: 'market',
        data: data || [],
      })
    }

    return NextResponse.json({ error: 'Unknown type' }, { status: 400 })

  } catch (error) {
    safeLogger.error('[Strategy Insights] Unexpected error', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/insights/strategies
 * 전략 실행 기록 및 집계
 */
async function POSTHandler(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'record_execution') {
      // 전략 실행 기록
      const {
        userId,
        strategyId,
        strategyPrompt,
        startedAt,
        endedAt,
        marketCondition,
        marketSector,
        initialCapital,
        finalCapital,
        tradesCount,
        winningTrades,
        losingTrades,
        maxDrawdown,
        isSimulation,
      } = body

      // 전략 해시 생성
      const { data: hashData } = await supabase.rpc('generate_strategy_hash', {
        p_prompt: strategyPrompt,
      })

      const strategyHash = hashData as string

      // 수익률 계산
      const returnPct = initialCapital > 0
        ? ((finalCapital - initialCapital) / initialCapital) * 100
        : 0

      // 기간 계산 (시간)
      const durationHours = endedAt && startedAt
        ? (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / (1000 * 60 * 60)
        : null

      // 샤프 비율 (간단 계산)
      const sharpeRatio = returnPct > 0 && maxDrawdown > 0
        ? returnPct / maxDrawdown
        : 0

      const { data, error } = await supabase
        .from('strategy_executions')
        .insert({
          user_id: userId,
          strategy_id: strategyId,
          strategy_hash: strategyHash,
          started_at: startedAt,
          ended_at: endedAt,
          duration_hours: durationHours,
          market_condition: marketCondition || 'sideways',
          market_sector: marketSector,
          initial_capital: initialCapital,
          final_capital: finalCapital,
          return_pct: returnPct,
          trades_count: tradesCount || 0,
          winning_trades: winningTrades || 0,
          losing_trades: losingTrades || 0,
          max_drawdown: maxDrawdown || 0,
          sharpe_ratio: sharpeRatio,
          is_simulation: isSimulation !== false,
        })
        .select()
        .single()

      if (error) {
        safeLogger.error('[Strategy Insights] Record execution error', { error })
        return NextResponse.json({ error: 'Failed to record execution' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        execution_id: data.id,
        strategy_hash: strategyHash,
      })
    }

    if (action === 'aggregate') {
      // 집계 실행 (관리자 또는 cron)
      const { data, error } = await supabase.rpc('aggregate_strategy_performance')

      if (error) {
        safeLogger.error('[Strategy Insights] Aggregate error', { error })
        return NextResponse.json({ error: 'Failed to aggregate' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        aggregated_count: data,
        message: `${data}개의 실행 기록이 집계되었습니다.`,
      })
    }

    if (action === 'update_market') {
      // 시장 조건 업데이트 (관리자 또는 cron)
      const {
        date,
        sp500Return,
        nasdaqReturn,
        kospiReturn,
        vix,
        topSectors,
        bottomSectors,
      } = body

      // 시장 조건 판단
      const { data: conditionData } = await supabase.rpc('determine_market_condition', {
        p_return: sp500Return || 0,
        p_volatility: vix || 15,
      })

      const volatilityRegime = vix >= 30 ? 'extreme'
        : vix >= 25 ? 'high'
        : vix >= 15 ? 'normal'
        : 'low'

      const { data, error } = await supabase
        .from('market_conditions')
        .upsert({
          date: date || new Date().toISOString().split('T')[0],
          sp500_return: sp500Return,
          nasdaq_return: nasdaqReturn,
          kospi_return: kospiReturn,
          vix,
          volatility_regime: volatilityRegime,
          condition: conditionData as string,
          trend_strength: Math.abs(sp500Return || 0) * 10,
          top_sectors: topSectors || [],
          bottom_sectors: bottomSectors || [],
        }, {
          onConflict: 'date',
        })
        .select()
        .single()

      if (error) {
        safeLogger.error('[Strategy Insights] Update market error', { error })
        return NextResponse.json({ error: 'Failed to update market condition' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        market_condition: data,
      })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })

  } catch (error) {
    safeLogger.error('[Strategy Insights] Post error', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const GET = withRateLimit(GETHandler, { category: 'api' })
export const POST = withRateLimit(POSTHandler, { category: 'api' })
