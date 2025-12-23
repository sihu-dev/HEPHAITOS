// ============================================
// Safety Net Monitoring API
// Loop 13: 안전 정책 모니터링
// P0 FIX: Admin 인증 추가
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { safeLogger } from '@/lib/utils/safe-logger'
import { getSafetyConfig, type SafetyConfig } from '@/lib/safety/config'
import { requireAdminAuth } from '@/lib/api/middleware'
import { withRateLimit } from '@/lib/api/middleware/rate-limit'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface SafetyEventStats {
  total_events: number
  allow_count: number
  soften_count: number
  block_count: number
  by_feature: Record<string, number>
  by_policy: Record<string, number>
  trend: Array<{
    date: string
    count: number
    soften: number
    block: number
  }>
}

/**
 * GET /api/admin/safety
 * 안전 정책 이벤트 통계 조회
 */
async function GETHandler(request: NextRequest) {
  // P0 FIX: Admin 인증 필수
  const authResult = await requireAdminAuth(request)
  if ('error' in authResult) {
    return authResult.error
  }

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'stats'
    const days = parseInt(searchParams.get('days') || '30', 10)

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    if (type === 'events') {
      // 최근 이벤트 목록
      const { data, error } = await supabase
        .from('safety_events')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        safeLogger.error('[Safety API] Events query error', { error })
        return NextResponse.json(
          { error: 'Failed to fetch safety events' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        type: 'events',
        data: data || [],
        count: data?.length || 0,
      })
    }

    if (type === 'config') {
      // 현재 설정 반환
      const config = getSafetyConfig()
      return NextResponse.json({
        type: 'config',
        data: config,
      })
    }

    // 기본: 통계
    const { data: events, error } = await supabase
      .from('safety_events')
      .select('decision, feature, policy_matched, created_at')
      .gte('created_at', startDate.toISOString())

    if (error) {
      safeLogger.error('[Safety API] Stats query error', { error })
      return NextResponse.json(
        { error: 'Failed to fetch safety stats' },
        { status: 500 }
      )
    }

    // 통계 계산
    const stats: SafetyEventStats = {
      total_events: events?.length || 0,
      allow_count: 0,
      soften_count: 0,
      block_count: 0,
      by_feature: {},
      by_policy: {},
      trend: [],
    }

    const dailyMap = new Map<string, { count: number; soften: number; block: number }>()

    for (const event of events || []) {
      // 결정별 카운트
      if (event.decision === 'allow') stats.allow_count++
      else if (event.decision === 'soften') stats.soften_count++
      else if (event.decision === 'block') stats.block_count++

      // 기능별 카운트
      if (event.feature) {
        stats.by_feature[event.feature] = (stats.by_feature[event.feature] || 0) + 1
      }

      // 정책별 카운트
      const policies = event.policy_matched as string[] || []
      for (const policy of policies) {
        stats.by_policy[policy] = (stats.by_policy[policy] || 0) + 1
      }

      // 일별 트렌드
      const date = new Date(event.created_at).toISOString().split('T')[0]
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { count: 0, soften: 0, block: 0 })
      }
      const day = dailyMap.get(date)!
      day.count++
      if (event.decision === 'soften') day.soften++
      if (event.decision === 'block') day.block++
    }

    stats.trend = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({
      type: 'stats',
      period_days: days,
      data: stats,
      summary: {
        total: stats.total_events,
        soften_rate: stats.total_events > 0
          ? Math.round((stats.soften_count / stats.total_events) * 10000) / 100
          : 0,
        block_rate: stats.total_events > 0
          ? Math.round((stats.block_count / stats.total_events) * 10000) / 100
          : 0,
        top_policy: Object.entries(stats.by_policy)
          .sort(([, a], [, b]) => b - a)[0]?.[0] || 'none',
        top_feature: Object.entries(stats.by_feature)
          .sort(([, a], [, b]) => b - a)[0]?.[0] || 'none',
      },
    })

  } catch (error) {
    safeLogger.error('[Safety API] Unexpected error', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/safety
 * 안전 정책 설정 업데이트
 */
async function POSTHandler(request: NextRequest) {
  // P0 FIX: Admin 인증 필수
  const authResult = await requireAdminAuth(request)
  if ('error' in authResult) {
    return authResult.error
  }

  try {
    const body = await request.json()
    const { action, config } = body

    if (action === 'update_config') {
      // 설정 업데이트 (환경 변수나 DB에 저장)
      // 현재는 환경 변수 기반이므로 로그만 남김
      safeLogger.info('[Safety API] Config update requested', { config })

      return NextResponse.json({
        success: true,
        message: 'Config update logged. Restart required for changes to take effect.',
        current: getSafetyConfig(),
      })
    }

    if (action === 'test_soften') {
      // 완화 테스트
      const { softenContentV2 } = await import('@/lib/safety/softener-v2')
      const { getPoliciesForSection } = await import('@/lib/safety/policies')

      const { content, section } = body
      const policies = getPoliciesForSection(section)

      const results = await Promise.all(
        policies.map(policy => softenContentV2({ content, policy, section }))
      )

      return NextResponse.json({
        success: true,
        original: content,
        results: results.filter(r => r.changes.length > 0),
      })
    }

    return NextResponse.json(
      { error: 'Unknown action' },
      { status: 400 }
    )

  } catch (error) {
    safeLogger.error('[Safety API] Post error', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = withRateLimit(GETHandler, { category: 'api' })
export const POST = withRateLimit(POSTHandler, { category: 'api' })
