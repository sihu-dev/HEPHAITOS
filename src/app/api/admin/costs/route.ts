// ============================================
// Cost Tracking API
// Loop 15: 비용 대시보드
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

interface CostLog {
  id: string
  provider: string
  endpoint: string
  model: string
  feature: string
  user_id: string
  input_tokens: number
  output_tokens: number
  total_tokens: number
  total_cost: number
  latency_ms: number
  success: boolean
  created_at: string
}

interface DailyCost {
  date: string
  provider: string
  total_cost: number
  ai_cost: number
  api_cost: number
  total_input_tokens: number
  total_output_tokens: number
  api_calls: number
  unique_users: number
  success_rate: number
}

interface Budget {
  id: number
  year_month: string
  provider: string
  budget_amount: number
  alert_threshold: number
  is_active: boolean
}

interface Alert {
  id: string
  alert_type: string
  provider: string
  message: string
  current_spend: number
  budget_amount: number
  percentage: number
  acknowledged: boolean
  created_at: string
}

/**
 * GET /api/admin/costs
 * 비용 데이터 조회
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
    const days = parseInt(searchParams.get('days') || '30', 10)
    const provider = searchParams.get('provider')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    if (type === 'summary') {
      // RPC 함수로 요약 조회
      const { data, error } = await supabase.rpc('get_cost_summary', {
        p_days: days,
      })

      if (error) {
        safeLogger.error('[Cost API] Summary query error', { error })
        return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 })
      }

      return NextResponse.json({
        type: 'summary',
        data: data || {},
      })
    }

    if (type === 'logs') {
      // 상세 로그 조회
      let query = supabase
        .from('api_cost_logs')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(500)

      if (provider) {
        query = query.eq('provider', provider)
      }

      const { data, error } = await query

      if (error) {
        safeLogger.error('[Cost API] Logs query error', { error })
        return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
      }

      return NextResponse.json({
        type: 'logs',
        data: data || [],
        count: data?.length || 0,
      })
    }

    if (type === 'daily') {
      // 일별 집계 조회
      let query = supabase
        .from('daily_cost_summary')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false })

      if (provider) {
        query = query.eq('provider', provider)
      }

      const { data, error } = await query

      if (error) {
        safeLogger.error('[Cost API] Daily query error', { error })
        return NextResponse.json({ error: 'Failed to fetch daily data' }, { status: 500 })
      }

      return NextResponse.json({
        type: 'daily',
        data: data || [],
      })
    }

    if (type === 'budgets') {
      // 예산 조회
      const { data, error } = await supabase
        .from('cost_budgets')
        .select('*')
        .order('year_month', { ascending: false })

      if (error) {
        safeLogger.error('[Cost API] Budgets query error', { error })
        return NextResponse.json({ error: 'Failed to fetch budgets' }, { status: 500 })
      }

      return NextResponse.json({
        type: 'budgets',
        data: data || [],
      })
    }

    if (type === 'alerts') {
      // 알림 조회
      const { data, error } = await supabase
        .from('cost_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        safeLogger.error('[Cost API] Alerts query error', { error })
        return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
      }

      return NextResponse.json({
        type: 'alerts',
        data: data || [],
        unacknowledged: data?.filter(a => !a.acknowledged).length || 0,
      })
    }

    if (type === 'pricing') {
      // 가격 설정 조회
      const { data, error } = await supabase
        .from('api_pricing')
        .select('*')
        .eq('is_active', true)
        .order('provider', { ascending: true })

      if (error) {
        safeLogger.error('[Cost API] Pricing query error', { error })
        return NextResponse.json({ error: 'Failed to fetch pricing' }, { status: 500 })
      }

      return NextResponse.json({
        type: 'pricing',
        data: data || [],
      })
    }

    if (type === 'by_feature') {
      // 기능별 비용 조회
      const { data, error } = await supabase
        .from('feature_costs')
        .select('*')

      if (error) {
        safeLogger.error('[Cost API] Feature costs query error', { error })
        return NextResponse.json({ error: 'Failed to fetch feature costs' }, { status: 500 })
      }

      return NextResponse.json({
        type: 'by_feature',
        data: data || [],
      })
    }

    return NextResponse.json({ error: 'Unknown type' }, { status: 400 })

  } catch (error) {
    safeLogger.error('[Cost API] Unexpected error', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/costs
 * 비용 관련 액션
 */
async function POSTHandler(request: NextRequest) {
  // P0 FIX: Admin 인증 필수
  const authResult = await requireAdminAuth(request)
  if ('error' in authResult) {
    return authResult.error
  }

  try {
    const body = await request.json()
    const { action } = body

    if (action === 'log') {
      // 비용 로그 기록
      const { provider, endpoint, model, feature, userId, inputTokens, outputTokens, apiCalls, latencyMs, success, requestId } = body

      const { data, error } = await supabase.rpc('log_api_cost', {
        p_provider: provider,
        p_endpoint: endpoint || null,
        p_model: model || null,
        p_feature: feature || null,
        p_user_id: userId || null,
        p_input_tokens: inputTokens || 0,
        p_output_tokens: outputTokens || 0,
        p_api_calls: apiCalls || 1,
        p_latency_ms: latencyMs || 0,
        p_success: success !== false,
        p_request_id: requestId || null,
      })

      if (error) {
        safeLogger.error('[Cost API] Log error', { error })
        return NextResponse.json({ error: 'Failed to log cost' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        log_id: data,
      })
    }

    if (action === 'aggregate') {
      // 일별 집계 실행
      const { date } = body

      const { error } = await supabase.rpc('aggregate_daily_costs', {
        p_date: date || new Date().toISOString().split('T')[0],
      })

      if (error) {
        safeLogger.error('[Cost API] Aggregate error', { error })
        return NextResponse.json({ error: 'Failed to aggregate' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Daily aggregation completed',
      })
    }

    if (action === 'set_budget') {
      // 예산 설정
      const { yearMonth, provider, budgetAmount, alertThreshold } = body

      const { data, error } = await supabase
        .from('cost_budgets')
        .upsert({
          year_month: yearMonth,
          provider,
          budget_amount: budgetAmount,
          alert_threshold: alertThreshold || 80,
          is_active: true,
        }, {
          onConflict: 'year_month,provider',
        })
        .select()
        .single()

      if (error) {
        safeLogger.error('[Cost API] Set budget error', { error })
        return NextResponse.json({ error: 'Failed to set budget' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        budget: data,
      })
    }

    if (action === 'acknowledge_alert') {
      // 알림 확인
      const { alertId } = body

      const { error } = await supabase
        .from('cost_alerts')
        .update({
          acknowledged: true,
          acknowledged_at: new Date().toISOString(),
        })
        .eq('id', alertId)

      if (error) {
        safeLogger.error('[Cost API] Acknowledge error', { error })
        return NextResponse.json({ error: 'Failed to acknowledge' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Alert acknowledged',
      })
    }

    if (action === 'check_budgets') {
      // 예산 체크 실행
      const { error } = await supabase.rpc('check_cost_budgets')

      if (error) {
        safeLogger.error('[Cost API] Check budgets error', { error })
        return NextResponse.json({ error: 'Failed to check budgets' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Budget check completed',
      })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })

  } catch (error) {
    safeLogger.error('[Cost API] Post error', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const GET = withRateLimit(GETHandler, { category: 'api' })
export const POST = withRateLimit(POSTHandler, { category: 'api' })
