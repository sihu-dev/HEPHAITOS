import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Loop 13: Refund Request API
 *
 * POST /api/refunds/request
 *
 * Body:
 * {
 *   payment_id: string (UUID),
 *   reason?: string
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   refund_request_id?: string,
 *   status?: 'pending' | 'approved' | 'rejected',
 *   message: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. 사용자 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    // 2. 요청 본문 파싱
    const body = await request.json()
    const { payment_id, reason } = body

    if (!payment_id) {
      return NextResponse.json(
        { success: false, error: 'MISSING_PAYMENT_ID', message: '결제 ID가 필요합니다' },
        { status: 400 }
      )
    }

    // 3. 결제 정보 조회
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', payment_id)
      .eq('user_id', user.id)
      .single()

    if (paymentError || !payment) {
      return NextResponse.json(
        {
          success: false,
          error: 'PAYMENT_NOT_FOUND',
          message: '결제 정보를 찾을 수 없습니다',
        },
        { status: 404 }
      )
    }

    // 4. 환불 자격 확인
    const { data: eligibility, error: eligibilityError } = await supabase.rpc(
      'check_refund_eligibility',
      {
        p_user_id: user.id,
        p_payment_id: payment_id,
      }
    )

    if (eligibilityError) {
      console.error('[Refund Request] Eligibility check error:', eligibilityError)
      return NextResponse.json(
        {
          success: false,
          error: 'ELIGIBILITY_CHECK_FAILED',
          message: '환불 자격 확인에 실패했습니다',
        },
        { status: 500 }
      )
    }

    const eligible = eligibility?.[0]?.eligible
    const eligibilityReason = eligibility?.[0]?.reason

    if (!eligible) {
      return NextResponse.json(
        {
          success: false,
          error: 'NOT_ELIGIBLE',
          message: eligibilityReason || '환불 자격이 없습니다',
        },
        { status: 400 }
      )
    }

    // 5. 환불 요청 생성
    const { data: refundRequest, error: createError } = await supabase
      .from('refund_requests')
      .insert({
        user_id: user.id,
        payment_id: payment_id,
        refund_amount: payment.amount,
        reason: reason || '고객 요청',
        status: 'pending',
      })
      .select()
      .single()

    if (createError || !refundRequest) {
      console.error('[Refund Request] Create error:', createError)
      return NextResponse.json(
        {
          success: false,
          error: 'CREATE_FAILED',
          message: '환불 요청 생성에 실패했습니다',
        },
        { status: 500 }
      )
    }

    // 6. Edge Function 호출 (자동 환불 처리)
    const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/auto-refund`
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    try {
      const refundResponse = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          refund_request_id: refundRequest.id,
          user_id: user.id,
          payment_id: payment_id,
          amount: payment.amount,
          reason: reason || '고객 요청',
        }),
      })

      const refundData = await refundResponse.json()

      if (refundData.success) {
        return NextResponse.json(
          {
            success: true,
            refund_request_id: refundRequest.id,
            status: 'approved',
            message: '환불이 완료되었습니다. 3-5 영업일 내에 환불됩니다.',
          },
          { status: 200 }
        )
      } else {
        return NextResponse.json(
          {
            success: false,
            refund_request_id: refundRequest.id,
            status: refundData.status || 'failed',
            error: refundData.error,
            message: refundData.message || '환불 처리에 실패했습니다',
          },
          { status: 500 }
        )
      }
    } catch (edgeFunctionError) {
      console.error('[Refund Request] Edge Function error:', edgeFunctionError)

      // Edge Function 실패 시 요청은 pending 상태로 남음 (수동 처리 대기)
      return NextResponse.json(
        {
          success: false,
          refund_request_id: refundRequest.id,
          status: 'pending',
          message: '환불 요청이 접수되었습니다. 관리자가 확인 후 처리됩니다.',
        },
        { status: 202 } // Accepted
      )
    }
  } catch (error) {
    console.error('[Refund Request] Unexpected error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: '서버 오류가 발생했습니다',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/refunds/request
 *
 * 사용자의 환불 요청 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: refundRequests, error } = await supabase
      .from('refund_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Refund Requests] Query error:', error)
      return NextResponse.json(
        { success: false, error: 'QUERY_FAILED' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: refundRequests || [],
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Refund Requests] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
