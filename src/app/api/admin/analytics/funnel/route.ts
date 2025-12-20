// ============================================
// Conversion Funnel Analytics API
// Loop 12: 전환율 퍼널 분석
// P0 FIX: Admin 인증 추가
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { safeLogger } from '@/lib/utils/safe-logger'
import { requireAdminAuth } from '@/lib/api/middleware'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface FunnelStage {
  stage_name: string
  stage_order: number
  total_users: number
  converted_users: number
  conversion_rate: number
  cumulative_rate: number
  drop_off_rate: number
  avg_days_to_convert: number | null
}

interface FunnelCohort {
  cohort_date: string
  signups: number
  activated: number
  activation_rate: number
  purchased: number
  purchase_rate: number
  repeated: number
  repeat_rate: number
}

/**
 * GET /api/admin/analytics/funnel
 * 전환율 퍼널 메트릭 조회
 */
export async function GET(request: NextRequest) {
  // P0 FIX: Admin 인증 필수
  const authResult = await requireAdminAuth(request)
  if ('error' in authResult) {
    return authResult.error
  }

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'summary'
    const cohortType = searchParams.get('cohort') || 'week'
    const days = parseInt(searchParams.get('days') || '30', 10)

    // 날짜 범위 계산
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    if (type === 'stages') {
      // 퍼널 단계별 전환율
      const { data, error } = await supabase.rpc('calculate_funnel_metrics', {
        p_start_date: startDate.toISOString().split('T')[0],
        p_end_date: endDate.toISOString().split('T')[0],
      })

      if (error) {
        safeLogger.error('[Funnel] Stages query error', { error })

        // 직접 쿼리 폴백
        const { data: progressData } = await supabase
          .from('user_funnel_progress')
          .select('*')
          .gte('signup_at', startDate.toISOString())

        const stages = [
          { name: 'signup', order: 2, count: progressData?.length || 0 },
          { name: 'first_activity', order: 3, count: progressData?.filter(p => p.first_activity_at).length || 0 },
          { name: 'first_purchase', order: 4, count: progressData?.filter(p => p.first_purchase_at).length || 0 },
          { name: 'repeat_purchase', order: 5, count: progressData?.filter(p => p.repeat_purchase_at).length || 0 },
        ]

        const totalSignups = stages[0].count || 1

        return NextResponse.json({
          type: 'stages',
          data: stages.map((s, i) => ({
            stage_name: s.name,
            stage_order: s.order,
            total_users: s.count,
            converted_users: stages[i + 1]?.count || 0,
            conversion_rate: stages[i + 1]
              ? Math.round((stages[i + 1].count / Math.max(s.count, 1)) * 10000) / 100
              : 0,
            cumulative_rate: Math.round((s.count / totalSignups) * 10000) / 100,
            drop_off_rate: stages[i + 1]
              ? Math.round((1 - stages[i + 1].count / Math.max(s.count, 1)) * 10000) / 100
              : 0,
          })),
        })
      }

      const stages = (data as FunnelStage[]) || []

      // 요약 계산
      const signupStage = stages.find(s => s.stage_name === 'signup')
      const purchaseStage = stages.find(s => s.stage_name === 'first_purchase')

      return NextResponse.json({
        type: 'stages',
        data: stages,
        summary: {
          total_signups: signupStage?.total_users || 0,
          total_purchases: purchaseStage?.total_users || 0,
          overall_conversion: purchaseStage?.cumulative_rate || 0,
          biggest_drop_off: stages.reduce((max, s) =>
            s.drop_off_rate > (max?.drop_off_rate || 0) ? s : max, stages[0]
          )?.stage_name || 'unknown',
        },
      })
    }

    if (type === 'cohort') {
      // 코호트별 퍼널
      const { data, error } = await supabase.rpc('get_funnel_by_cohort', {
        p_cohort_type: cohortType,
        p_days: days,
      })

      if (error) {
        safeLogger.error('[Funnel] Cohort query error', { error })
        return NextResponse.json(
          { error: 'Failed to fetch funnel cohort data' },
          { status: 500 }
        )
      }

      const cohorts = (data as FunnelCohort[]) || []

      // 전체 평균 계산
      const avgActivation = cohorts.length > 0
        ? cohorts.reduce((sum, c) => sum + (c.activation_rate || 0), 0) / cohorts.length
        : 0
      const avgPurchase = cohorts.length > 0
        ? cohorts.reduce((sum, c) => sum + (c.purchase_rate || 0), 0) / cohorts.length
        : 0

      return NextResponse.json({
        type: 'cohort',
        cohort_type: cohortType,
        data: cohorts,
        summary: {
          avg_activation_rate: Math.round(avgActivation * 100) / 100,
          avg_purchase_rate: Math.round(avgPurchase * 100) / 100,
          total_cohorts: cohorts.length,
        },
      })
    }

    // 기본: 요약 (funnel_summary 뷰)
    const { data, error } = await supabase
      .from('funnel_summary')
      .select('*')

    if (error) {
      // RPC 폴백
      const { data: rpcData } = await supabase.rpc('calculate_funnel_metrics', {
        p_start_date: startDate.toISOString().split('T')[0],
        p_end_date: endDate.toISOString().split('T')[0],
      })

      return NextResponse.json({
        type: 'summary',
        period_days: days,
        data: rpcData || [],
      })
    }

    // 퍼널 시각화용 데이터 포맷
    const stages = (data as FunnelStage[]) || []
    const funnelData = stages.map(s => ({
      name: s.stage_name,
      value: s.total_users,
      conversion: s.conversion_rate,
      dropOff: s.drop_off_rate,
    }))

    return NextResponse.json({
      type: 'summary',
      period_days: days,
      data: stages,
      funnel: funnelData,
    })

  } catch (error) {
    safeLogger.error('[Funnel] Unexpected error', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
