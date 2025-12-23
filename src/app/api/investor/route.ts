// ============================================
// Investor Dashboard API
// Loop 25: 시리즈 A 준비 자료
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { safeLogger } from '@/lib/utils/safe-logger'
import { withRateLimit } from '@/lib/api/middleware/rate-limit'

export const dynamic = 'force-dynamic'

// ============================================
// GET /api/investor
// ============================================

async function GETHandler(request: NextRequest) {
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
    const type = searchParams.get('type') || 'dashboard'

    safeLogger.info('[Investor API] GET request', { type })

    switch (type) {
      case 'dashboard': {
        // 투자자 대시보드 데이터 (RPC)
        const { data, error } = await supabase.rpc('get_investor_dashboard_data')

        if (error) throw error

        return NextResponse.json({
          type: 'dashboard',
          data,
        })
      }

      case 'metrics': {
        // 최신 지표 스냅샷
        const { data, error } = await supabase
          .from('investor_metrics_snapshots')
          .select('*')
          .order('snapshot_date', { ascending: false })
          .limit(1)
          .single()

        if (error && error.code !== 'PGRST116') throw error

        return NextResponse.json({
          type: 'metrics',
          data,
        })
      }

      case 'metrics_history': {
        // 지표 히스토리
        const months = parseInt(searchParams.get('months') || '6')

        const { data, error } = await supabase
          .from('investor_metrics_snapshots')
          .select('*')
          .gte('snapshot_date', new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .order('snapshot_date', { ascending: true })

        if (error) throw error

        return NextResponse.json({
          type: 'metrics_history',
          data,
        })
      }

      case 'funding_rounds': {
        // 펀딩 라운드
        const { data, error } = await supabase
          .from('funding_rounds')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json({
          type: 'funding_rounds',
          data,
        })
      }

      case 'investors': {
        // 투자자 목록
        const status = searchParams.get('status')

        let query = supabase
          .from('investors')
          .select('*')
          .order('updated_at', { ascending: false })

        if (status) {
          query = query.eq('relationship_status', status)
        }

        const { data, error } = await query

        if (error) throw error

        return NextResponse.json({
          type: 'investors',
          data,
        })
      }

      case 'pipeline': {
        // 파이프라인 뷰
        const { data, error } = await supabase
          .from('fundraising_pipeline')
          .select('*')
          .order('probability_percent', { ascending: false })

        if (error) throw error

        return NextResponse.json({
          type: 'pipeline',
          data,
        })
      }

      case 'meetings': {
        // 미팅 목록
        const investorId = searchParams.get('investor_id')

        let query = supabase
          .from('investor_meetings')
          .select(`
            *,
            investor:investors(name, type)
          `)
          .order('meeting_date', { ascending: false })

        if (investorId) {
          query = query.eq('investor_id', investorId)
        }

        const { data, error } = await query.limit(50)

        if (error) throw error

        return NextResponse.json({
          type: 'meetings',
          data,
        })
      }

      case 'kpi_targets': {
        // KPI 목표
        const category = searchParams.get('category')

        let query = supabase
          .from('kpi_targets')
          .select('*')
          .order('period_start', { ascending: false })

        if (category) {
          query = query.eq('category', category)
        }

        const { data, error } = await query

        if (error) throw error

        return NextResponse.json({
          type: 'kpi_targets',
          data,
        })
      }

      case 'competitors': {
        // 경쟁사 분석
        const { data, error } = await supabase
          .from('competitor_analysis')
          .select('*')
          .order('estimated_market_share', { ascending: false })

        if (error) throw error

        return NextResponse.json({
          type: 'competitors',
          data,
        })
      }

      case 'pitch_deck_data': {
        // 피치 덱용 데이터 종합
        const [
          { data: metrics },
          { data: fundingRounds },
          { data: kpiTargets },
          { data: competitors },
        ] = await Promise.all([
          supabase.from('investor_metrics_snapshots')
            .select('*')
            .order('snapshot_date', { ascending: false })
            .limit(1)
            .single(),
          supabase.from('funding_rounds')
            .select('*')
            .eq('status', 'planned')
            .single(),
          supabase.from('kpi_targets')
            .select('*')
            .order('period_start', { ascending: false }),
          supabase.from('competitor_analysis')
            .select('*'),
        ])

        const pitchDeckData = {
          // Company Overview
          company: {
            name: 'HEPHAITOS',
            tagline: 'Replit for Trading',
            mission: '누구나 코딩 없이 AI 트레이딩 봇을 만들 수 있는 세상',
            founded: '2024',
            stage: 'Series A',
          },

          // Problem
          problem: [
            '알고리즘 트레이딩은 전문 개발자만의 영역',
            '개인 투자자의 95%가 시장 수익률 하회',
            '트레이딩 교육 시장의 높은 진입 장벽',
          ],

          // Solution
          solution: {
            headline: 'AI-Powered No-Code Trading Platform',
            features: [
              'COPY: 전문가 전략 복사',
              'LEARN: AI 멘토 코칭',
              'BUILD: 자연어 전략 빌더',
            ],
          },

          // Market Size
          market: {
            tam: metrics?.addressable_market_size || 500000000000000,
            sam: metrics?.serviceable_market_size || 50000000000000,
            som: metrics?.obtainable_market_size || 500000000000,
            tamLabel: '전세계 리테일 트레이딩',
            samLabel: '한국 + 미국 타겟 시장',
            somLabel: '3년 내 목표 (1% 점유율)',
          },

          // Traction
          traction: {
            mau: metrics?.mau || 0,
            mrr: metrics?.mrr || 0,
            arr: metrics?.arr || 0,
            total_users: metrics?.total_users || 0,
            strategies_created: metrics?.total_strategies_created || 0,
            retention_d7: metrics?.d7_retention || 0,
          },

          // Business Model
          businessModel: {
            revenue_streams: [
              { name: '크레딧 판매', percent: 60, description: 'AI 쿼리 및 거래 실행' },
              { name: '구독료', percent: 25, description: 'Pro/Premium 플랜' },
              { name: '성과 기반', percent: 10, description: '수익의 20% 수수료' },
              { name: '전략 마켓플레이스', percent: 5, description: '거래 수수료 30%' },
            ],
            unit_economics: {
              arpu: metrics?.arpu || 0,
              ltv: metrics?.ltv || 0,
              cac: metrics?.cac || 0,
              ltv_cac: metrics?.ltv_cac_ratio || 0,
            },
          },

          // Competition
          competition: competitors?.map(c => ({
            name: c.name,
            strengths: c.strengths,
            our_advantage: c.our_advantages,
          })) || [],

          // Team (placeholder)
          team: [
            { role: 'CEO', focus: 'Product & Strategy' },
            { role: 'CTO', focus: 'AI & Engineering' },
            { role: 'Head of Growth', focus: 'Marketing & BD' },
          ],

          // Funding
          funding: {
            round: fundingRounds?.round_name || 'Series A',
            target: fundingRounds?.target_amount || 5000000000,
            pre_money: fundingRounds?.pre_money_valuation || 20000000000,
            use_of_funds: fundingRounds?.use_of_funds || {},
          },

          // Roadmap
          roadmap: {
            '2025 Q1': ['베타 런칭', 'MAU 10K', 'MRR 5000만'],
            '2025 Q2': ['정식 런칭', 'MAU 50K', 'MRR 2억'],
            '2025 Q3': ['미국 시장 진출', 'MAU 100K'],
            '2025 Q4': ['크립토 연동', 'MAU 200K'],
          },

          // KPIs
          kpi_targets: kpiTargets,
        }

        return NextResponse.json({
          type: 'pitch_deck_data',
          data: pitchDeckData,
        })
      }

      default:
        return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
    }
  } catch (error) {
    safeLogger.error('[Investor API] GET error', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================
// POST /api/investor
// ============================================

async function POSTHandler(request: NextRequest) {
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

    safeLogger.info('[Investor API] POST request', { action, userId: user.id })

    switch (action) {
      case 'refresh_metrics': {
        // 지표 새로고침
        const { data, error } = await supabase.rpc('calculate_investor_metrics')

        if (error) throw error

        return NextResponse.json({
          success: true,
          action: 'refresh_metrics',
          data,
        })
      }

      case 'add_investor': {
        // 투자자 추가
        const {
          name,
          type: investorType,
          website,
          contact_email,
          contact_name,
          focus_areas,
          investment_stage,
          typical_check_size_min,
          typical_check_size_max,
        } = body

        const { data, error } = await supabase
          .from('investors')
          .insert({
            name,
            type: investorType,
            website,
            contact_email,
            contact_name,
            focus_areas: focus_areas || [],
            investment_stage: investment_stage || [],
            typical_check_size_min,
            typical_check_size_max,
          })
          .select()
          .single()

        if (error) throw error

        return NextResponse.json({
          success: true,
          action: 'add_investor',
          data,
        })
      }

      case 'update_investor': {
        // 투자자 업데이트
        const { investor_id, ...updates } = body

        const { data, error } = await supabase
          .from('investors')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', investor_id)
          .select()
          .single()

        if (error) throw error

        return NextResponse.json({
          success: true,
          action: 'update_investor',
          data,
        })
      }

      case 'update_relationship_status': {
        // 관계 상태 업데이트
        const { investor_id, relationship_status } = body

        const { data, error } = await supabase
          .from('investors')
          .update({
            relationship_status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', investor_id)
          .select()
          .single()

        if (error) throw error

        return NextResponse.json({
          success: true,
          action: 'update_relationship_status',
          data,
        })
      }

      case 'add_meeting': {
        // 미팅 추가
        const {
          investor_id,
          funding_round_id,
          meeting_date,
          meeting_type,
          location,
          attendees,
          agenda,
          notes,
          outcome,
        } = body

        const { data, error } = await supabase
          .from('investor_meetings')
          .insert({
            investor_id,
            funding_round_id,
            meeting_date,
            meeting_type,
            location,
            attendees: attendees || [],
            agenda,
            notes,
            outcome,
          })
          .select()
          .single()

        if (error) throw error

        // 투자자 미팅 카운트 업데이트
        await supabase.rpc('increment', {
          table_name: 'investors',
          column_name: 'meetings_count',
          row_id: investor_id,
        })

        return NextResponse.json({
          success: true,
          action: 'add_meeting',
          data,
        })
      }

      case 'update_kpi': {
        // KPI 실제 값 업데이트
        const { kpi_id, actual_value } = body

        const { data: kpi, error: fetchError } = await supabase
          .from('kpi_targets')
          .select('target_value')
          .eq('id', kpi_id)
          .single()

        if (fetchError) throw fetchError

        const achievement_rate = kpi.target_value > 0
          ? (actual_value / kpi.target_value) * 100
          : 0

        const { data, error } = await supabase
          .from('kpi_targets')
          .update({
            actual_value,
            achievement_rate,
            updated_at: new Date().toISOString(),
          })
          .eq('id', kpi_id)
          .select()
          .single()

        if (error) throw error

        return NextResponse.json({
          success: true,
          action: 'update_kpi',
          data,
        })
      }

      case 'add_competitor': {
        // 경쟁사 추가
        const {
          name,
          website,
          description,
          target_market,
          key_features,
          strengths,
          weaknesses,
          our_advantages,
          their_advantages,
        } = body

        const { data, error } = await supabase
          .from('competitor_analysis')
          .insert({
            name,
            website,
            description,
            target_market,
            key_features: key_features || [],
            strengths: strengths || [],
            weaknesses: weaknesses || [],
            our_advantages: our_advantages || [],
            their_advantages: their_advantages || [],
            last_updated: new Date().toISOString().split('T')[0],
          })
          .select()
          .single()

        if (error) throw error

        return NextResponse.json({
          success: true,
          action: 'add_competitor',
          data,
        })
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    safeLogger.error('[Investor API] POST error', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const GET = withRateLimit(GETHandler, { category: 'api' })
export const POST = withRateLimit(POSTHandler, { category: 'api' })
