// ============================================
// Refund API Route
// GPT V1 피드백 P0-9: 부분 사용 시 차등 환불
// Zod Validation + Error Handling 표준화 적용
// ============================================

import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withApiMiddleware, createApiResponse, validateRequestBody } from '@/lib/api/middleware'
import { z } from 'zod'
import { safeLogger } from '@/lib/utils/safe-logger'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const dynamic = 'force-dynamic'

// ============================================
// Zod Schemas
// ============================================

const refundRequestSchema = z.object({
  orderId: z.string().min(1, '주문 ID가 필요합니다'),
  reason: z.string().min(10, '환불 사유는 최소 10자 이상이어야 합니다'),
})

type RefundRequestInput = z.infer<typeof refundRequestSchema>

// ============================================
// API Handlers
// ============================================

/**
 * GET /api/payments/refund?orderId=xxx
 * 환불 가능 금액 계산 (미리보기)
 */
export const GET = withApiMiddleware(
  async (request: NextRequest) => {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return createApiResponse({ error: '주문 ID가 필요합니다' }, { status: 400 })
    }

    // TODO: Get real user ID from session
    const userId = 'demo-user'

    safeLogger.info('[Refund API] Calculating refund', { orderId, userId })

    // 1. calculate_refund RPC 호출
    const { data, error } = await supabaseAdmin.rpc('calculate_refund', {
      p_order_id: orderId,
      p_user_id: userId,
    })

    if (error) {
      safeLogger.error('[Refund API] RPC error', { error })
      return createApiResponse({ error: 'RPC 호출 실패' }, { status: 500 })
    }

    if (!data || !data.eligible) {
      return createApiResponse({
        eligible: false,
        message: data?.error || '환불 불가능 (50% 이상 사용)',
        ...data,
      })
    }

    // 2. 메시지 생성
    const message =
      data.usage_rate <= 10
        ? `사용률 ${data.usage_rate}% - 전액 환불 가능 (₩${data.refund_amount.toLocaleString()})`
        : `사용률 ${data.usage_rate}% - 50% 환불 가능 (₩${data.refund_amount.toLocaleString()})`

    safeLogger.info('[Refund API] Calculation success', { refundAmount: data.refund_amount })

    return createApiResponse({
      eligible: true,
      message,
      ...data,
    })
  },
  {
    rateLimit: { category: 'api' },
    errorHandler: { logErrors: true },
  }
)

/**
 * POST /api/payments/refund
 * 환불 요청 생성
 */
export const POST = withApiMiddleware(
  async (request: NextRequest) => {
    const validation = await validateRequestBody(request, refundRequestSchema)
    if ('error' in validation) return validation.error

    const { orderId, reason } = validation.data

    // TODO: Get real user ID from session
    const userId = 'demo-user'

    safeLogger.info('[Refund API] Creating refund request', { orderId, userId })

    // 1. calculate_refund RPC로 환불 가능 여부 확인
    const { data: refundCalc, error: calcError } = await supabaseAdmin.rpc('calculate_refund', {
      p_order_id: orderId,
      p_user_id: userId,
    })

    if (calcError) {
      safeLogger.error('[Refund API] Calculate error', { error: calcError })
      return createApiResponse({ error: 'RPC 호출 실패' }, { status: 500 })
    }

    if (!refundCalc || !refundCalc.eligible) {
      safeLogger.warn('[Refund API] Not eligible', { refundCalc })
      return createApiResponse(
        { error: refundCalc?.error || '환불 불가능 (50% 이상 사용)' },
        { status: 400 }
      )
    }

    // 2. 중복 요청 체크
    const { data: existingRequests } = await supabaseAdmin
      .from('refund_requests')
      .select('id, status')
      .eq('order_id', orderId)
      .in('status', ['pending', 'approved'])

    if (existingRequests && existingRequests.length > 0) {
      safeLogger.warn('[Refund API] Duplicate request', { orderId })
      return createApiResponse(
        { error: '이미 처리 중인 환불 요청이 있습니다' },
        { status: 400 }
      )
    }

    // 3. 환불 요청 생성
    const { data: refundRequest, error: insertError } = await supabaseAdmin
      .from('refund_requests')
      .insert({
        user_id: userId,
        order_id: orderId,
        reason,
        credits_used: refundCalc.credits_used,
        credits_total: refundCalc.credits_total,
        usage_rate: refundCalc.usage_rate,
        refund_amount: refundCalc.refund_amount,
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      safeLogger.error('[Refund API] Insert error', { error: insertError })
      return createApiResponse({ error: '환불 요청 생성 실패' }, { status: 500 })
    }

    safeLogger.info('[Refund API] Request created', { requestId: refundRequest.id })

    return createApiResponse({
      success: true,
      refundRequest,
      message: '환불 요청이 접수되었습니다. 관리자 승인 후 3-5 영업일 내 처리됩니다.',
    })
  },
  {
    rateLimit: { category: 'write' },
    errorHandler: { logErrors: true },
  }
)

