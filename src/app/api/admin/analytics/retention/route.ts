// ============================================
// Retention Analytics API
// Loop 10: D1/D7 리텐션 추적 시스템
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { safeLogger } from '@/lib/utils/safe-logger'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface RetentionMetric {
  cohort_date: string
  cohort_size: number
  d1_retained: number
  d1_rate: number
  d3_retained: number
  d3_rate: number
  d7_retained: number
  d7_rate: number
  d14_retained: number
  d14_rate: number
  d30_retained: number
  d30_rate: number
}

interface RetentionCurvePoint {
  day_number: number
  retention_rate: number
  retained_users: number
  total_users: number
}

/**
 * GET /api/admin/analytics/retention
 * 리텐션 메트릭 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'daily'
    const days = parseInt(searchParams.get('days') || '30', 10)

    // 날짜 범위 계산
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    if (type === 'curve') {
      // 전체 리텐션 커브
      const { data, error } = await supabase.rpc('get_retention_curve')

      if (error) {
        safeLogger.error('[Retention] Curve query error', { error })
        return NextResponse.json(
          { error: 'Failed to fetch retention curve' },
          { status: 500 }
        )
      }

      const curve = (data as RetentionCurvePoint[]) || []

      return NextResponse.json({
        type: 'curve',
        data: curve,
        summary: {
          d1: curve.find(c => c.day_number === 1)?.retention_rate || 0,
          d7: curve.find(c => c.day_number === 7)?.retention_rate || 0,
          d30: curve.find(c => c.day_number === 30)?.retention_rate || 0,
        },
      })
    }

    if (type === 'cohort') {
      // 코호트별 리텐션
      const { data, error } = await supabase.rpc('calculate_retention_metrics', {
        p_start_date: startDate.toISOString().split('T')[0],
        p_end_date: endDate.toISOString().split('T')[0],
      })

      if (error) {
        safeLogger.error('[Retention] Cohort query error', { error })
        return NextResponse.json(
          { error: 'Failed to fetch cohort retention' },
          { status: 500 }
        )
      }

      const cohorts = (data as RetentionMetric[]) || []

      // 평균 계산
      const avgD1 = cohorts.length > 0
        ? cohorts.reduce((sum, c) => sum + (c.d1_rate || 0), 0) / cohorts.length
        : 0
      const avgD7 = cohorts.length > 0
        ? cohorts.reduce((sum, c) => sum + (c.d7_rate || 0), 0) / cohorts.length
        : 0
      const totalUsers = cohorts.reduce((sum, c) => sum + c.cohort_size, 0)

      return NextResponse.json({
        type: 'cohort',
        data: cohorts,
        summary: {
          avg_d1_rate: Math.round(avgD1 * 100) / 100,
          avg_d7_rate: Math.round(avgD7 * 100) / 100,
          total_cohort_users: totalUsers,
          cohort_count: cohorts.length,
        },
      })
    }

    // 기본: 일별 요약
    const { data, error } = await supabase
      .from('retention_dashboard')
      .select('*')
      .limit(days)

    if (error) {
      // 뷰가 없으면 직접 쿼리
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('user_cohorts')
        .select('signup_date, user_id')
        .gte('signup_date', startDate.toISOString().split('T')[0])

      if (fallbackError) {
        safeLogger.error('[Retention] Daily query error', { error: fallbackError })
        return NextResponse.json(
          { error: 'Failed to fetch retention data' },
          { status: 500 }
        )
      }

      // 간단한 요약 반환
      const userCount = new Set(fallbackData?.map(d => d.user_id)).size
      const dateCount = new Set(fallbackData?.map(d => d.signup_date)).size

      return NextResponse.json({
        type: 'daily',
        data: fallbackData || [],
        summary: {
          total_users: userCount,
          active_days: dateCount,
          message: 'Basic metrics - run migration for full retention data',
        },
      })
    }

    return NextResponse.json({
      type: 'daily',
      data: data || [],
      summary: {
        total_records: data?.length || 0,
      },
    })

  } catch (error) {
    safeLogger.error('[Retention] Unexpected error', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/analytics/retention/backfill
 * 기존 이벤트 데이터로 리텐션 백필
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'backfill') {
      // analytics_events에서 user_daily_activity 백필
      const { error } = await supabase.rpc('backfill_user_activity')

      if (error) {
        // RPC 없으면 직접 백필
        const { data: events, error: eventsError } = await supabase
          .from('analytics_events')
          .select('user_id, created_at, event_name')
          .not('user_id', 'is', null)
          .order('created_at', { ascending: true })
          .limit(10000)

        if (eventsError) {
          return NextResponse.json(
            { error: 'Failed to fetch events for backfill' },
            { status: 500 }
          )
        }

        // 일별 그룹화
        const activityMap = new Map<string, {
          user_id: string
          activity_date: string
          event_count: number
          page_views: number
        }>()

        for (const event of events || []) {
          const date = new Date(event.created_at).toISOString().split('T')[0]
          const key = `${event.user_id}_${date}`

          if (activityMap.has(key)) {
            const existing = activityMap.get(key)!
            existing.event_count++
            if (event.event_name === 'page_view') {
              existing.page_views++
            }
          } else {
            activityMap.set(key, {
              user_id: event.user_id,
              activity_date: date,
              event_count: 1,
              page_views: event.event_name === 'page_view' ? 1 : 0,
            })
          }
        }

        // 일괄 삽입
        const activities = Array.from(activityMap.values())
        if (activities.length > 0) {
          const { error: insertError } = await supabase
            .from('user_daily_activity')
            .upsert(activities, {
              onConflict: 'user_id,activity_date',
              ignoreDuplicates: true,
            })

          if (insertError) {
            safeLogger.error('[Retention] Backfill insert error', { error: insertError })
          }
        }

        return NextResponse.json({
          success: true,
          message: `Backfilled ${activities.length} daily activity records`,
          records_processed: events?.length || 0,
        })
      }

      return NextResponse.json({
        success: true,
        message: 'Backfill completed via RPC',
      })
    }

    return NextResponse.json(
      { error: 'Unknown action' },
      { status: 400 }
    )

  } catch (error) {
    safeLogger.error('[Retention] Backfill error', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
