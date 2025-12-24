// ============================================
// Payment Cancel API
// 결제 취소 API
// Zod Validation + Error Handling 표준화 적용
// ============================================

import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { getTossPaymentsClient } from '@/lib/payments/toss-payments'
import { withApiMiddleware, createApiResponse, validateRequestBody } from '@/lib/api/middleware'
import { cancelPaymentSchema } from '@/lib/validations/payments'
import { safeLogger } from '@/lib/utils/safe-logger'

// Admin client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const POST = withApiMiddleware(
  async (request: NextRequest) => {
    // 사용자 인증
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
      return createApiResponse(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    const validation = await validateRequestBody(request, cancelPaymentSchema)
    if ('error' in validation) return validation.error

    const { paymentKey, cancelReason } = validation.data

    safeLogger.info('[Payment API] Cancelling payment', {
      userId: user.id,
      paymentKey,
      cancelReason,
    })

    // 결제 소유권 확인
    const { data: order, error: orderError } = await supabaseAdmin
      .from('payment_orders')
      .select('user_id, order_id, status')
      .eq('payment_key', paymentKey)
      .single()

    if (orderError || !order) {
      return createApiResponse(
        { error: '결제 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (order.user_id !== user.id) {
      safeLogger.warn('[Payment API] Unauthorized cancel attempt', {
        userId: user.id,
        orderUserId: order.user_id,
      })
      return createApiResponse(
        { error: '결제 취소 권한이 없습니다.' },
        { status: 403 }
      )
    }

    const client = getTossPaymentsClient()
    const result = await client.cancelPayment(paymentKey, cancelReason)

    if (result.status === 'cancelled') {
      // 결제 상태 업데이트
      await supabaseAdmin
        .from('payment_orders')
        .update({
          status: 'cancelled',
          refund_reason: cancelReason,
          refunded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('payment_key', paymentKey)

      // 구독 취소 처리 (해당 시)
      await supabaseAdmin
        .from('subscriptions')
        .update({
          cancel_at_period_end: true,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('status', 'active')

      safeLogger.info('[Payment API] Payment cancelled', {
        userId: user.id,
        paymentKey,
        cancelReason,
        status: result.status,
      })

      return createApiResponse({
        payment: result,
        message: '결제가 취소되었습니다.',
      })
    } else {
      safeLogger.warn('[Payment API] Payment cancellation failed', {
        paymentKey,
        status: result.status,
      })

      return createApiResponse(
        {
          error: '결제 취소에 실패했습니다.',
          status: result.status,
        },
        { status: 400 }
      )
    }
  },
  {
    rateLimit: { category: 'write' },
    errorHandler: { logErrors: true },
  }
)
