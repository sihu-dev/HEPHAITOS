// Loop 13: CS/환불 자동화 Supabase Edge Function
// Deno runtime

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RefundRequest {
  refund_request_id: string
  user_id: string
  payment_id: string
  amount: number
  reason?: string
}

interface RefundResponse {
  success: boolean
  refund_id?: string
  status?: 'approved' | 'rejected' | 'pending'
  message: string
  error?: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Parse request body
    const { refund_request_id, user_id, payment_id, amount, reason }: RefundRequest =
      await req.json()

    console.log(`[Auto-Refund] Processing refund request: ${refund_request_id}`)

    // ============================================
    // 1. 환불 자격 검증
    // ============================================

    // 1.1 환불 요청 존재 여부 확인
    const { data: refundRequest, error: fetchError } = await supabase
      .from('refund_requests')
      .select('*')
      .eq('id', refund_request_id)
      .single()

    if (fetchError || !refundRequest) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'REFUND_REQUEST_NOT_FOUND',
          message: '환불 요청을 찾을 수 없습니다',
        } as RefundResponse),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // 1.2 사용자 환불 이력 조회 (1년간 1회 제한)
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    const { data: refundHistory, error: historyError } = await supabase
      .from('refund_requests')
      .select('id')
      .eq('user_id', user_id)
      .eq('status', 'approved')
      .gte('created_at', oneYearAgo.toISOString())

    if (historyError) {
      throw new Error(`History check failed: ${historyError.message}`)
    }

    // 환불 횟수 제한 (1회/년)
    if (refundHistory && refundHistory.length >= 1) {
      await supabase
        .from('refund_requests')
        .update({
          status: 'rejected',
          rejection_reason: '연간 환불 횟수 초과 (1회/년)',
          processed_at: new Date().toISOString(),
        })
        .eq('id', refund_request_id)

      return new Response(
        JSON.stringify({
          success: false,
          status: 'rejected',
          message: '연간 환불 횟수를 초과했습니다 (최대 1회)',
        } as RefundResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // 1.3 결제 정보 확인
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', payment_id)
      .single()

    if (paymentError || !payment) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'PAYMENT_NOT_FOUND',
          message: '결제 정보를 찾을 수 없습니다',
        } as RefundResponse),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // 1.4 환불 가능 기간 확인 (14일 이내)
    const paymentDate = new Date(payment.created_at)
    const now = new Date()
    const daysDiff = Math.floor((now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysDiff > 14) {
      await supabase
        .from('refund_requests')
        .update({
          status: 'rejected',
          rejection_reason: '환불 가능 기간 초과 (결제 후 14일)',
          processed_at: new Date().toISOString(),
        })
        .eq('id', refund_request_id)

      return new Response(
        JSON.stringify({
          success: false,
          status: 'rejected',
          message: '환불 가능 기간이 지났습니다 (결제 후 14일 이내)',
        } as RefundResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // ============================================
    // 2. PG사 환불 API 호출 (토스페이먼츠)
    // ============================================

    const tossApiKey = Deno.env.get('TOSS_SECRET_KEY')!
    const paymentKey = payment.payment_key

    const refundResponse = await fetch(
      `https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${btoa(tossApiKey + ':')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cancelReason: reason || '고객 요청',
          cancelAmount: amount,
        }),
      }
    )

    const refundData = await refundResponse.json()

    // 환불 실패 시
    if (!refundResponse.ok) {
      console.error('[Auto-Refund] Toss API error:', refundData)

      await supabase
        .from('refund_requests')
        .update({
          status: 'failed',
          rejection_reason: `PG 환불 실패: ${refundData.message || 'Unknown error'}`,
          processed_at: new Date().toISOString(),
        })
        .eq('id', refund_request_id)

      return new Response(
        JSON.stringify({
          success: false,
          error: 'PG_REFUND_FAILED',
          message: '결제사 환불 처리에 실패했습니다',
        } as RefundResponse),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // ============================================
    // 3. 상태 업데이트
    // ============================================

    await supabase
      .from('refund_requests')
      .update({
        status: 'approved',
        processed_at: new Date().toISOString(),
        refund_amount: amount,
        pg_refund_id: refundData.transactionKey || refundData.cancelId,
      })
      .eq('id', refund_request_id)

    // ============================================
    // 4. 이메일 발송 (선택)
    // ============================================

    // TODO: Resend API 또는 SendGrid 연동
    // await sendRefundEmail(user.email, { amount, refundId })

    console.log(`[Auto-Refund] Success: ${refund_request_id}`)

    return new Response(
      JSON.stringify({
        success: true,
        status: 'approved',
        refund_id: refundData.transactionKey || refundData.cancelId,
        message: '환불이 완료되었습니다',
      } as RefundResponse),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('[Auto-Refund] Unexpected error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: 'INTERNAL_ERROR',
        message: '서버 오류가 발생했습니다',
      } as RefundResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
