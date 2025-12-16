/**
 * Auto Refund Handler (Supabase Edge Function)
 * Loop 13: CS/환불 자동화
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TOSS_SECRET_KEY = Deno.env.get('TOSS_SECRET_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface RefundRequest {
  id: string;
  user_id: string;
  payment_id: string;
  amount: number;
  reason: string;
  status: string;
}

/**
 * Toss Payments 환불 API 호출
 */
async function callTossRefundAPI(
  paymentId: string,
  amount: number,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `https://api.tosspayments.com/v1/payments/${paymentId}/cancel`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${btoa(TOSS_SECRET_KEY + ':')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cancelReason: reason || '고객 요청',
          cancelAmount: amount,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('[Toss Refund] API error:', error);
      return { success: false, error: error.message };
    }

    const result = await response.json();
    console.log('[Toss Refund] Success:', result);
    return { success: true };
  } catch (error) {
    console.error('[Toss Refund] Exception:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * 환불 완료 이메일 발송
 */
async function sendRefundEmail(
  userEmail: string,
  amount: number
): Promise<void> {
  // Supabase Email 또는 외부 이메일 서비스
  try {
    // TODO: 실제 이메일 발송 로직 구현
    console.log(`[Email] Refund notification sent to ${userEmail}: ₩${amount}`);
  } catch (error) {
    console.error('[Email] Send failed:', error);
  }
}

/**
 * Main Handler
 */
serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { refund_request_id } = await req.json();

    if (!refund_request_id) {
      return new Response(
        JSON.stringify({ error: 'MISSING_REFUND_REQUEST_ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Auto Refund] Processing request: ${refund_request_id}`);

    // 1. 환불 요청 조회
    const { data: request, error: fetchError } = await supabase
      .from('refund_requests')
      .select('*')
      .eq('id', refund_request_id)
      .single();

    if (fetchError || !request) {
      console.error('[Auto Refund] Request not found:', fetchError);
      return new Response(
        JSON.stringify({ error: 'REFUND_REQUEST_NOT_FOUND' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. 이미 처리된 경우
    if (request.status === 'completed' || request.status === 'failed') {
      return new Response(
        JSON.stringify({ success: true, message: 'Already processed', status: request.status }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. 환불 자격 확인
    const { data: eligible } = await supabase.rpc('check_refund_eligibility', {
      p_user_id: request.user_id,
    });

    if (!eligible) {
      await supabase.rpc('update_refund_status', {
        p_request_id: refund_request_id,
        p_status: 'rejected',
        p_admin_note: '연간 환불 횟수 제한 초과 (1회/년)',
      });

      return new Response(
        JSON.stringify({ error: 'REFUND_LIMIT_EXCEEDED' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. 상태 업데이트: approved
    await supabase.rpc('update_refund_status', {
      p_request_id: refund_request_id,
      p_status: 'approved',
    });

    // 5. Toss Payments 환불 API 호출
    const refundResult = await callTossRefundAPI(
      request.payment_id,
      request.amount,
      request.reason
    );

    if (!refundResult.success) {
      // 실패 시 상태 업데이트
      await supabase.rpc('update_refund_status', {
        p_request_id: refund_request_id,
        p_status: 'failed',
        p_admin_note: `Toss API 실패: ${refundResult.error}`,
      });

      return new Response(
        JSON.stringify({ error: 'TOSS_REFUND_FAILED', details: refundResult.error }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 6. 성공 시 상태 업데이트: completed
    await supabase.rpc('update_refund_status', {
      p_request_id: refund_request_id,
      p_status: 'completed',
    });

    // 7. 사용자 이메일 조회 + 이메일 발송
    const { data: user } = await supabase.auth.admin.getUserById(request.user_id);
    if (user?.user?.email) {
      await sendRefundEmail(user.user.email, request.amount);
    }

    console.log(`[Auto Refund] Completed: ${refund_request_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        refundId: refund_request_id,
        amount: request.amount,
        status: 'completed',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Auto Refund] Exception:', error);

    return new Response(
      JSON.stringify({ error: 'INTERNAL_ERROR', message: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
