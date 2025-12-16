// ============================================
// Strategy Ranking API
// Loop 13: 전략 마켓플레이스
// ============================================

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/strategies/ranking
 * 공개 전략 랭킹 조회
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const marketCondition = searchParams.get('market_condition')

    let query = supabaseAdmin
      .from('public_strategy_ranking')
      .select('*')
      .limit(limit)

    const { data, error } = await query

    if (error) {
      console.error('[Strategy Ranking] Query error:', error)
      return NextResponse.json({ error: 'QUERY_FAILED' }, { status: 500 })
    }

    return NextResponse.json({ strategies: data })
  } catch (error) {
    console.error('[Strategy Ranking] GET error:', error)
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}
