// ============================================
// Subscription API
// 구독 정보 조회/관리 API
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import {
import { safeLogger } from '@/lib/utils/safe-logger';
  PRICING_PLANS,
  type PlanType,
  type BillingCycle,
  type Subscription,
} from '@/lib/payments/toss-payments'

// Mock subscription data (실제 환경에서는 DB에서 조회)
const mockSubscription: Subscription = {
  id: 'sub_mock_001',
  userId: 'user_001',
  planId: 'starter',
  billingCycle: 'monthly',
  status: 'active',
  currentPeriodStart: new Date('2024-12-01'),
  currentPeriodEnd: new Date('2025-01-01'),
  cancelAtPeriodEnd: false,
  paymentMethod: 'card',
  lastPaymentAt: new Date('2024-12-01'),
  nextPaymentAt: new Date('2025-01-01'),
}

// GET: 현재 구독 정보 조회
export async function GET() {
  try {
    // TODO: 실제 구현 시 세션에서 userId 가져와서 DB 조회
    // const userId = await getCurrentUserId()
    // const subscription = await db.subscription.findUnique({ where: { userId } })

    const subscription = mockSubscription
    const plan = PRICING_PLANS.find((p) => p.id === subscription.planId)

    return NextResponse.json({
      success: true,
      subscription: {
        ...subscription,
        plan,
        daysRemaining: Math.ceil(
          (subscription.currentPeriodEnd.getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        ),
      },
    })
  } catch (error) {
    safeLogger.error('[Subscription GET] Error:', error)
    return NextResponse.json(
      { error: '구독 정보 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// POST: 구독 생성/변경
export async function POST(request: NextRequest) {
  try {
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
      // TODO: 현재 구독을 취소 예약 (기간 종료 시 무료로 전환)
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
    safeLogger.error('[Subscription POST] Error:', error)
    return NextResponse.json(
      { error: '구독 변경 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE: 구독 취소
export async function DELETE() {
  try {
    // TODO: 실제 구현 시 구독 취소 예약
    // - cancelAtPeriodEnd = true 설정
    // - 현재 기간은 계속 사용 가능

    return NextResponse.json({
      success: true,
      message:
        '구독이 취소 예약되었습니다. 현재 구독 기간이 종료되면 무료 플랜으로 전환됩니다.',
      cancelAtPeriodEnd: true,
      currentPeriodEnd: mockSubscription.currentPeriodEnd,
    })
  } catch (error) {
    safeLogger.error('[Subscription DELETE] Error:', error)
    return NextResponse.json(
      { error: '구독 취소 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
