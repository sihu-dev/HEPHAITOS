// ============================================
// Payment Create API
// 결제 생성 API
// Zod Validation + Error Handling 표준화 적용
// GPT V1 피드백: payment_orders DB 저장 추가
// ============================================

import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import {
  getTossPaymentsClient,
  type PlanType,
  type BillingCycle,
} from '@/lib/payments/toss-payments'
import { withApiMiddleware, createApiResponse, validateRequestBody } from '@/lib/api/middleware'
import { createPaymentSchema } from '@/lib/validations/payments'
import { safeLogger } from '@/lib/utils/safe-logger'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 플랜별 크레딧 매핑
const PLAN_CREDITS: Record<string, number> = {
  basic: 500,
  pro: 1000,
  premium: 5000,
}

export const POST = withApiMiddleware(
  async (request: NextRequest) => {
    const validation = await validateRequestBody(request, createPaymentSchema)
    if ('error' in validation) return validation.error

    const { plan, billingCycle } = validation.data

    // 사용자 인증 확인
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
      safeLogger.warn('[Payment API] Unauthorized payment attempt')
      return createApiResponse(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    safeLogger.info('[Payment API] Creating payment', { plan, billingCycle, userId: user.id })

    const client = getTossPaymentsClient()
    const amount = client.getPlanPrice(plan as PlanType, billingCycle)

    if (amount === 0) {
      return createApiResponse({ error: 'Invalid plan' }, { status: 400 })
    }

    const orderId = client.generateOrderId()
    const planNames: Record<string, string> = {
      free: '무료',
      basic: '베이직',
      pro: '프로',
      premium: '프리미엄',
    }
    const cycleNames: Record<BillingCycle, string> = {
      monthly: '월간',
      yearly: '연간',
    }

    const orderName = `HEPHAITOS ${planNames[plan]} (${cycleNames[billingCycle]})`
    const credits = PLAN_CREDITS[plan] || 100

    // 주문 정보를 payment_orders에 저장
    const { error: insertError } = await supabaseAdmin
      .from('payment_orders')
      .insert({
        user_id: user.id,
        order_id: orderId,
        amount,
        credits,
        status: 'pending',
      })

    if (insertError) {
      safeLogger.error('[Payment API] Failed to save order', { error: insertError, orderId })
      return createApiResponse(
        { error: '주문 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const successUrl = validation.data.successUrl || `${baseUrl}/dashboard/settings/billing?success=true&orderId=${orderId}`
    const failUrl = validation.data.failUrl || `${baseUrl}/dashboard/settings/billing?fail=true&orderId=${orderId}`

    const result = await client.initiatePayment({
      orderId,
      amount,
      orderName,
      customerName: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      customerEmail: user.email || '',
      planId: plan as PlanType,
      billingCycle,
      successUrl,
      failUrl,
    })

    safeLogger.info('[Payment API] Payment created', { orderId, amount, userId: user.id })

    return createApiResponse({
      orderId,
      amount,
      credits,
      orderName,
      checkoutUrl: result.checkoutUrl,
      clientKey: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY,
    })
  },
  {
    rateLimit: { category: 'write' },
    errorHandler: { logErrors: true },
  }
)
