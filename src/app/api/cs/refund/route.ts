/**
 * CS Refund API
 * Loop 13: 환불 자동화
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * POST /api/cs/refund
 * 환불 요청 생성 + Edge Function 트리거
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // 1. 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' },
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { paymentId, amount, reason } = body;

    // 2. Validation
    if (!paymentId || !amount) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_REQUEST', message: 'paymentId와 amount는 필수입니다' },
        },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_AMOUNT', message: '환불 금액은 0보다 커야 합니다' },
        },
        { status: 400 }
      );
    }

    // 3. 환불 자격 확인
    const { data: eligible, error: eligibleError } = await (supabase as unknown as {
      rpc: (fn: string, params: Record<string, unknown>) => Promise<{ data: boolean | null; error: Error | null }>
    }).rpc('check_refund_eligibility', {
      p_user_id: user.id,
    });

    if (eligibleError) {
      console.error('[Refund API] Eligibility check error:', eligibleError);
      return NextResponse.json(
        {
          success: false,
          error: { code: 'CHECK_FAILED', message: '환불 자격 확인 실패' },
        },
        { status: 500 }
      );
    }

    if (!eligible) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'REFUND_LIMIT_EXCEEDED',
            message: '연간 1회 환불 제한을 초과했습니다',
          },
        },
        { status: 400 }
      );
    }

    // 4. 환불 요청 생성 (멱등성 보장)
    interface RefundRequestData { id: string; status: string; amount: number }
    const { data: refundRequest, error: createError } = await (supabase as unknown as {
      rpc: (fn: string, params: Record<string, unknown>) => Promise<{ data: RefundRequestData | null; error: Error | null }>
    }).rpc('create_refund_request', {
      p_user_id: user.id,
      p_payment_id: paymentId,
      p_amount: amount,
      p_reason: reason || null,
    });

    if (createError) {
      console.error('[Refund API] Create error:', createError);
      return NextResponse.json(
        {
          success: false,
          error: { code: 'CREATE_FAILED', message: '환불 요청 생성 실패' },
        },
        { status: 500 }
      );
    }

    // 5. Edge Function 트리거 (비동기)
    if (!refundRequest) {
      return NextResponse.json(
        { success: false, error: { code: 'CREATE_FAILED', message: '환불 요청 데이터 없음' } },
        { status: 500 }
      );
    }

    const { error: functionError } = await supabase.functions.invoke(
      'auto-refund-handler',
      {
        body: { refund_request_id: refundRequest.id },
      }
    );

    if (functionError) {
      console.error('[Refund API] Edge Function error:', functionError);
      // Edge Function 실패해도 요청은 생성됨 (나중에 수동 처리 가능)
    }

    return NextResponse.json({
      success: true,
      data: {
        refundId: refundRequest.id,
        status: refundRequest.status,
        amount: refundRequest.amount,
        message: '환불 요청이 접수되었습니다. 처리 중입니다.',
      },
    });
  } catch (error) {
    console.error('[Refund API] POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cs/refund
 * 사용자의 환불 이력 조회
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // 1. 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' },
        },
        { status: 401 }
      );
    }

    // 2. 환불 이력 조회
    const { data: history, error: historyError } = await (supabase as unknown as {
      rpc: (fn: string, params: Record<string, unknown>) => Promise<{ data: unknown[] | null; error: Error | null }>
    }).rpc('get_user_refund_history', {
      p_user_id: user.id,
    });

    if (historyError) {
      console.error('[Refund API] History error:', historyError);
      return NextResponse.json(
        {
          success: false,
          error: { code: 'QUERY_FAILED', message: '환불 이력 조회 실패' },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        history: history || [],
      },
    });
  } catch (error) {
    console.error('[Refund API] GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' },
      },
      { status: 500 }
    );
  }
}
