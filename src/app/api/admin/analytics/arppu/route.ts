// ============================================
// ARPPU Analytics API
// Loop 11: 코호트별 ARPPU 분석
// P0 FIX: Admin 인증 추가
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { safeLogger } from '@/lib/utils/safe-logger'
import { requireAdminAuth } from '@/lib/api/middleware'
import { withRateLimit } from '@/lib/api/middleware/rate-limit'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ARPPUCohort {
  cohort_date: string
  total_users: number
  paying_users: number
  conversion_rate: number
  total_revenue: number
  arppu: number
  arpu: number
  avg_orders_per_user: number
  avg_credits_per_user: number
}

interface ARPPUSummary {
  metric: string
  value: number
  trend_vs_prev: number
}

/**
 * GET /api/admin/analytics/arppu
 * ARPPU 및 매출 메트릭 조회
 */
async function GETHandler(request: NextRequest) {
  // P0 FIX: Admin 인증 필수
  const authResult = await requireAdminAuth(request)
  if ('error' in authResult) {
    return authResult.error
  }

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'summary'
    const cohortType = searchParams.get('cohort') || 'week'
    const days = parseInt(searchParams.get('days') || '90', 10)

    // 날짜 범위 계산
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    if (type === 'cohort') {
      // 코호트별 ARPPU
      const { data, error } = await supabase.rpc('calculate_arppu_by_cohort', {
        p_cohort_type: cohortType,
        p_start_date: startDate.toISOString().split('T')[0],
        p_end_date: endDate.toISOString().split('T')[0],
      })

      if (error) {
        safeLogger.error('[ARPPU] Cohort query error', { error })
        return NextResponse.json(
          { error: 'Failed to fetch cohort ARPPU' },
          { status: 500 }
        )
      }

      const cohorts = (data as ARPPUCohort[]) || []

      // 전체 평균 계산
      const totalRevenue = cohorts.reduce((sum, c) => sum + (c.total_revenue || 0), 0)
      const totalPayingUsers = cohorts.reduce((sum, c) => sum + (c.paying_users || 0), 0)
      const totalUsers = cohorts.reduce((sum, c) => sum + (c.total_users || 0), 0)

      return NextResponse.json({
        type: 'cohort',
        cohort_type: cohortType,
        data: cohorts,
        summary: {
          total_revenue: totalRevenue,
          total_paying_users: totalPayingUsers,
          total_users: totalUsers,
          overall_arppu: totalPayingUsers > 0 ? Math.round(totalRevenue / totalPayingUsers) : 0,
          overall_arpu: totalUsers > 0 ? Math.round(totalRevenue / totalUsers) : 0,
          overall_conversion: totalUsers > 0 ? Math.round((totalPayingUsers / totalUsers) * 10000) / 100 : 0,
        },
      })
    }

    if (type === 'daily') {
      // 일별 매출
      const { data, error } = await supabase
        .from('daily_revenue_summary')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false })

      if (error) {
        safeLogger.error('[ARPPU] Daily query error', { error })
        // 직접 쿼리 폴백
        const { data: fallbackData } = await supabase
          .from('payment_orders')
          .select('paid_at, amount, credits, user_id')
          .eq('status', 'paid')
          .gte('paid_at', startDate.toISOString())

        const dailyMap = new Map<string, {
          date: string
          total_orders: number
          unique_payers: Set<string>
          total_revenue: number
          total_credits: number
        }>()

        for (const order of fallbackData || []) {
          const date = new Date(order.paid_at).toISOString().split('T')[0]
          if (!dailyMap.has(date)) {
            dailyMap.set(date, {
              date,
              total_orders: 0,
              unique_payers: new Set(),
              total_revenue: 0,
              total_credits: 0,
            })
          }
          const day = dailyMap.get(date)!
          day.total_orders++
          day.unique_payers.add(order.user_id)
          day.total_revenue += order.amount
          day.total_credits += order.credits
        }

        const dailyData = Array.from(dailyMap.values()).map(d => ({
          date: d.date,
          total_orders: d.total_orders,
          unique_payers: d.unique_payers.size,
          total_revenue: d.total_revenue,
          avg_order_value: d.total_orders > 0 ? Math.round(d.total_revenue / d.total_orders) : 0,
          total_credits_sold: d.total_credits,
        })).sort((a, b) => b.date.localeCompare(a.date))

        return NextResponse.json({
          type: 'daily',
          data: dailyData,
        })
      }

      return NextResponse.json({
        type: 'daily',
        data: data || [],
      })
    }

    if (type === 'packages') {
      // 패키지별 판매
      const { data, error } = await supabase
        .from('package_sales_summary')
        .select('*')

      if (error) {
        safeLogger.error('[ARPPU] Package query error', { error })
        return NextResponse.json(
          { error: 'Failed to fetch package sales' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        type: 'packages',
        data: data || [],
      })
    }

    // 기본: 요약
    const { data, error } = await supabase.rpc('get_arppu_summary', {
      p_days: days,
    })

    if (error) {
      safeLogger.error('[ARPPU] Summary query error', { error })

      // 직접 쿼리 폴백
      const { data: orders } = await supabase
        .from('payment_orders')
        .select('amount, user_id')
        .eq('status', 'paid')
        .gte('paid_at', startDate.toISOString())

      const { count: totalUsers } = await supabase
        .from('user_revenue_summary')
        .select('*', { count: 'exact', head: true })
        .gte('signup_date', startDate.toISOString().split('T')[0])

      const uniquePayers = new Set(orders?.map(o => o.user_id)).size
      const totalRevenue = orders?.reduce((sum, o) => sum + o.amount, 0) || 0

      return NextResponse.json({
        type: 'summary',
        period_days: days,
        data: {
          total_users: totalUsers || 0,
          paying_users: uniquePayers,
          total_revenue: totalRevenue,
          arppu: uniquePayers > 0 ? Math.round(totalRevenue / uniquePayers) : 0,
          arpu: (totalUsers || 0) > 0 ? Math.round(totalRevenue / (totalUsers || 1)) : 0,
          conversion_rate: (totalUsers || 0) > 0 ? Math.round((uniquePayers / (totalUsers || 1)) * 10000) / 100 : 0,
        },
      })
    }

    // RPC 결과 파싱
    const summaryMap = new Map<string, { value: number; trend: number }>()
    for (const row of (data as ARPPUSummary[]) || []) {
      summaryMap.set(row.metric, { value: row.value, trend: row.trend_vs_prev })
    }

    return NextResponse.json({
      type: 'summary',
      period_days: days,
      data: {
        total_users: summaryMap.get('total_users')?.value || 0,
        paying_users: summaryMap.get('paying_users')?.value || 0,
        total_revenue: summaryMap.get('total_revenue')?.value || 0,
        arppu: summaryMap.get('arppu')?.value || 0,
        conversion_rate: summaryMap.get('conversion_rate')?.value || 0,
      },
      trends: {
        total_users: summaryMap.get('total_users')?.trend || 0,
        paying_users: summaryMap.get('paying_users')?.trend || 0,
        total_revenue: summaryMap.get('total_revenue')?.trend || 0,
        arppu: summaryMap.get('arppu')?.trend || 0,
        conversion_rate: summaryMap.get('conversion_rate')?.trend || 0,
      },
    })

  } catch (error) {
    safeLogger.error('[ARPPU] Unexpected error', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = withRateLimit(GETHandler, { category: 'api' })
