// ============================================
// Subscription API
// 구독 정보 조회/관리 API
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import {
  PRICING_PLANS,
  type PlanType,
  type BillingCycle,
} from '@/lib/payments/toss-payments'
import { safeLogger } from '@/lib/utils/safe-logger'

// GET: 현재 구독 정보 조회
export async function GET() {
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

    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 구독 정보 조회
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // 구독이 없으면 무료 플랜
    if (subError || !subscription) {
      const freePlan = PRICING_PLANS.find((p) => p.id === 'free')
      return NextResponse.json({
        success: true,
        subscription: {
          planId: 'free',
          plan: freePlan,
          status: 'active',
          daysRemaining: null,
        },
      })
    }

    const plan = PRICING_PLANS.find((p) => p.id === subscription.plan_id)
    const periodEnd = new Date(subscription.current_period_end)
    const daysRemaining = Math.max(0, Math.ceil(
      (periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    ))

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        planId: subscription.plan_id,
        plan,
        billingCycle: subscription.billing_cycle,
        status: subscription.status,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        daysRemaining,
      },
    })
  } catch (error) {
    safeLogger.error('[Subscription GET] Error', { error })
    return NextResponse.json(
      { error: '구독 정보 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// POST: 구독 생성/변경
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

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      planId,
      billingCycle,
    }: {
      planId: PlanType
      billingCycle: BillingCycle
    } = body

    if (!planId || !billingCycle) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // Free 플랜으로 변경
    if (planId === 'free') {
      // 현재 구독을 취소 예약
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          cancel_at_period_end: true,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)

      if (updateError) {
        safeLogger.error('[Subscription] Failed to cancel subscription', { error: updateError })
      }

      return NextResponse.json({
        success: true,
        message: '현재 구독 기간 종료 후 무료 플랜으로 전환됩니다.',
        cancelAtPeriodEnd: true,
      })
    }

    // 유료 플랜으로 변경 시 결제 필요
    const plan = PRICING_PLANS.find((p) => p.id === planId)
    if (!plan) {
      return NextResponse.json(
        { error: '유효하지 않은 플랜입니다.' },
        { status: 400 }
      )
    }

    // 업그레이드/다운그레이드 안내
    return NextResponse.json({
      success: true,
      requiresPayment: true,
      plan,
      amount:
        billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice,
      message: '결제를 진행해주세요.',
    })
  } catch (error) {
    safeLogger.error('[Subscription POST] Error', { error })
    return NextResponse.json(
      { error: '구독 변경 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE: 구독 취소
export async function DELETE() {
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

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 구독 취소 예약
    const { data: subscription, error: updateError } = await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select('current_period_end')
      .single()

    if (updateError) {
      safeLogger.error('[Subscription DELETE] Error', { error: updateError })
      return NextResponse.json(
        { error: '구독 취소 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message:
        '구독이 취소 예약되었습니다. 현재 구독 기간이 종료되면 무료 플랜으로 전환됩니다.',
      cancelAtPeriodEnd: true,
      currentPeriodEnd: subscription?.current_period_end,
    })
  } catch (error) {
    safeLogger.error('[Subscription DELETE] Error', { error })
    return NextResponse.json(
      { error: '구독 취소 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
