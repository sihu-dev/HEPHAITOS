// ============================================
// Pricing Experiments API
// Loop 24: 성과 기반 가격 실험
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { safeLogger } from '@/lib/utils/safe-logger'

export const dynamic = 'force-dynamic'

// ============================================
// GET /api/experiments
// ============================================

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'list'

    safeLogger.info('[Experiments API] GET request', { type })

    switch (type) {
      case 'list': {
        // 실험 목록 조회
        const status = searchParams.get('status')

        let query = supabase
          .from('pricing_experiments')
          .select(`
            *,
            variants:experiment_variants(*)
          `)
          .order('created_at', { ascending: false })

        if (status) {
          query = query.eq('status', status)
        }

        const { data, error } = await query

        if (error) throw error

        return NextResponse.json({
          type: 'list',
          data,
        })
      }

      case 'experiment': {
        // 특정 실험 상세
        const id = searchParams.get('id')
        if (!id) {
          return NextResponse.json({ error: 'id required' }, { status: 400 })
        }

        const { data, error } = await supabase
          .from('pricing_experiments')
          .select(`
            *,
            variants:experiment_variants(*)
          `)
          .eq('id', id)
          .single()

        if (error) throw error

        return NextResponse.json({
          type: 'experiment',
          data,
        })
      }

      case 'results': {
        // 실험 결과 (뷰 사용)
        const id = searchParams.get('id')

        let query = supabase.from('experiment_results').select('*')

        if (id) {
          query = query.eq('experiment_id', id)
        }

        const { data, error } = await query

        if (error) throw error

        return NextResponse.json({
          type: 'results',
          data,
        })
      }

      case 'summary': {
        // 실험 요약 (RPC 함수 사용)
        const id = searchParams.get('id')
        if (!id) {
          return NextResponse.json({ error: 'id required' }, { status: 400 })
        }

        const { data, error } = await supabase.rpc('get_experiment_summary', {
          p_experiment_id: id,
        })

        if (error) throw error

        return NextResponse.json({
          type: 'summary',
          data,
        })
      }

      case 'my_assignment': {
        // 현재 사용자의 실험 배정
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const experimentId = searchParams.get('experiment_id')

        let query = supabase
          .from('experiment_assignments')
          .select(`
            *,
            variant:experiment_variants(*),
            experiment:pricing_experiments(*)
          `)
          .eq('user_id', user.id)

        if (experimentId) {
          query = query.eq('experiment_id', experimentId)
        }

        const { data, error } = await query

        if (error) throw error

        return NextResponse.json({
          type: 'my_assignment',
          data,
        })
      }

      case 'performance_account': {
        // 성과 기반 가격 계정 조회
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data, error } = await supabase
          .from('performance_pricing_accounts')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') throw error

        return NextResponse.json({
          type: 'performance_account',
          data,
        })
      }

      case 'settlements': {
        // 정산 내역 조회
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data, error } = await supabase
          .from('performance_settlements')
          .select('*')
          .eq('user_id', user.id)
          .order('period_end', { ascending: false })

        if (error) throw error

        return NextResponse.json({
          type: 'settlements',
          data,
        })
      }

      case 'stats': {
        // 전체 실험 통계
        const { data: experiments } = await supabase
          .from('pricing_experiments')
          .select('status')

        const { data: assignments } = await supabase
          .from('experiment_assignments')
          .select('id')

        const { data: conversions } = await supabase
          .from('experiment_conversions')
          .select('revenue_amount')

        const stats = {
          total_experiments: experiments?.length || 0,
          running_experiments:
            experiments?.filter((e) => e.status === 'running').length || 0,
          completed_experiments:
            experiments?.filter((e) => e.status === 'completed').length || 0,
          total_participants: assignments?.length || 0,
          total_conversions: conversions?.length || 0,
          total_revenue: conversions?.reduce(
            (sum, c) => sum + (c.revenue_amount || 0),
            0
          ),
        }

        return NextResponse.json({
          type: 'stats',
          data: stats,
        })
      }

      default:
        return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
    }
  } catch (error) {
    safeLogger.error('[Experiments API] GET error', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================
// POST /api/experiments
// ============================================

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    safeLogger.info('[Experiments API] POST request', { action, userId: user.id })

    switch (action) {
      case 'create_experiment': {
        // 새 실험 생성 (관리자만)
        const {
          name,
          description,
          hypothesis,
          primary_metric,
          secondary_metrics,
          target_sample_size,
          confidence_level,
        } = body

        const { data, error } = await supabase
          .from('pricing_experiments')
          .insert({
            name,
            description,
            hypothesis,
            primary_metric: primary_metric || 'conversion_rate',
            secondary_metrics: secondary_metrics || [],
            target_sample_size: target_sample_size || 1000,
            confidence_level: confidence_level || 0.95,
            created_by: user.id,
          })
          .select()
          .single()

        if (error) throw error

        return NextResponse.json({
          success: true,
          action: 'create_experiment',
          data,
        })
      }

      case 'add_variant': {
        // 실험에 변형 추가
        const {
          experiment_id,
          name: variantName,
          description: variantDesc,
          traffic_allocation,
          pricing_model,
          pricing_config,
          is_control,
        } = body

        const { data, error } = await supabase
          .from('experiment_variants')
          .insert({
            experiment_id,
            name: variantName,
            description: variantDesc,
            traffic_allocation: traffic_allocation || 50,
            pricing_model: pricing_model || 'fixed',
            pricing_config: pricing_config || {},
            is_control: is_control || false,
          })
          .select()
          .single()

        if (error) throw error

        return NextResponse.json({
          success: true,
          action: 'add_variant',
          data,
        })
      }

      case 'start_experiment': {
        // 실험 시작
        const { experiment_id } = body

        const { data, error } = await supabase
          .from('pricing_experiments')
          .update({
            status: 'running',
            start_date: new Date().toISOString(),
          })
          .eq('id', experiment_id)
          .select()
          .single()

        if (error) throw error

        return NextResponse.json({
          success: true,
          action: 'start_experiment',
          data,
        })
      }

      case 'pause_experiment': {
        // 실험 일시 중지
        const { experiment_id } = body

        const { data, error } = await supabase
          .from('pricing_experiments')
          .update({ status: 'paused' })
          .eq('id', experiment_id)
          .select()
          .single()

        if (error) throw error

        return NextResponse.json({
          success: true,
          action: 'pause_experiment',
          data,
        })
      }

      case 'complete_experiment': {
        // 실험 완료
        const { experiment_id } = body

        const { data, error } = await supabase
          .from('pricing_experiments')
          .update({
            status: 'completed',
            end_date: new Date().toISOString(),
          })
          .eq('id', experiment_id)
          .select()
          .single()

        if (error) throw error

        return NextResponse.json({
          success: true,
          action: 'complete_experiment',
          data,
        })
      }

      case 'assign_user': {
        // 사용자를 실험에 배정
        const {
          experiment_id,
          user_segment,
          acquisition_channel,
          device_type,
        } = body

        const { data, error } = await supabase.rpc('assign_user_to_experiment', {
          p_user_id: user.id,
          p_experiment_id: experiment_id,
          p_user_segment: user_segment || 'new',
          p_acquisition_channel: acquisition_channel,
          p_device_type: device_type,
        })

        if (error) throw error

        // 배정된 변형 정보 조회
        const { data: assignment } = await supabase
          .from('experiment_assignments')
          .select(`
            *,
            variant:experiment_variants(*)
          `)
          .eq('id', data)
          .single()

        return NextResponse.json({
          success: true,
          action: 'assign_user',
          data: assignment,
        })
      }

      case 'record_conversion': {
        // 전환 기록
        const {
          experiment_id,
          conversion_type,
          revenue_amount,
          credits_purchased,
          user_profit,
          platform_fee,
          metadata,
        } = body

        const { data, error } = await supabase.rpc('record_experiment_conversion', {
          p_user_id: user.id,
          p_experiment_id: experiment_id,
          p_conversion_type: conversion_type,
          p_revenue_amount: revenue_amount,
          p_credits_purchased: credits_purchased,
          p_user_profit: user_profit,
          p_platform_fee: platform_fee,
          p_metadata: metadata || {},
        })

        if (error) throw error

        return NextResponse.json({
          success: true,
          action: 'record_conversion',
          data: { conversion_id: data },
        })
      }

      case 'enable_performance_pricing': {
        // 성과 기반 가격 활성화
        const { success_fee_percent, min_profit_threshold, settlement_period } =
          body

        const { data, error } = await supabase
          .from('performance_pricing_accounts')
          .upsert({
            user_id: user.id,
            is_enabled: true,
            success_fee_percent: success_fee_percent || 20,
            min_profit_threshold: min_profit_threshold || 100000,
            settlement_period: settlement_period || 'monthly',
            period_start_date: new Date().toISOString().split('T')[0],
          })
          .select()
          .single()

        if (error) throw error

        return NextResponse.json({
          success: true,
          action: 'enable_performance_pricing',
          data,
        })
      }

      case 'disable_performance_pricing': {
        // 성과 기반 가격 비활성화
        const { data, error } = await supabase
          .from('performance_pricing_accounts')
          .update({ is_enabled: false })
          .eq('user_id', user.id)
          .select()
          .single()

        if (error) throw error

        return NextResponse.json({
          success: true,
          action: 'disable_performance_pricing',
          data,
        })
      }

      case 'calculate_fee': {
        // 성과 기반 수수료 계산
        const { profit } = body

        const { data, error } = await supabase.rpc('calculate_performance_fee', {
          p_user_id: user.id,
          p_profit: profit,
        })

        if (error) throw error

        return NextResponse.json({
          success: true,
          action: 'calculate_fee',
          data: { fee: data },
        })
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    safeLogger.error('[Experiments API] POST error', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
