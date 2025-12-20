// ============================================
// Payment Confirm API
// 결제 확인 API (결제 완료 후 호출)
// Zod Validation + Error Handling 표준화 적용
// GPT V1 피드백 P0-1: 크레딧 지급 로직 구현
// GPT V1 피드백 P0-3: Circuit Breaker 통합
// ============================================

import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getTossPaymentsClient } from '@/lib/payments/toss-payments'
import { withApiMiddleware, createApiResponse, validateRequestBody } from '@/lib/api/middleware'
import { confirmPaymentSchema } from '@/lib/validations/payments'
import { safeLogger } from '@/lib/utils/safe-logger'
import { paymentCircuit, withCircuitBreaker, createCircuitOpenResponse } from '@/lib/redis/circuit-breaker'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const POST = withApiMiddleware(
  async (request: NextRequest) => {
    const validation = await validateRequestBody(request, confirmPaymentSchema)
    if ('error' in validation) return validation.error

    const { paymentKey, orderId, amount } = validation.data

    // ═══════════════════════════════════════════════════════════════
    // P0 FIX: 결제 금액 DB 검증 (클라이언트 조작 방지)
    // ═══════════════════════════════════════════════════════════════
    const { data: order, error: orderError } = await supabaseAdmin
      .from('payment_orders')
      .select('amount, status, user_id')
      .eq('order_id', orderId)
      .single()

    if (orderError || !order) {
      safeLogger.error('[Payment API] Order not found', { orderId, error: orderError })
      return createApiResponse(
        { error: '유효하지 않은 주문입니다.' },
        { status: 400 }
      )
    }

    if (order.status !== 'pending') {
      safeLogger.warn('[Payment API] Order already processed', { orderId, status: order.status })
      return createApiResponse(
        { error: '이미 처리된 주문입니다.' },
        { status: 400 }
      )
    }

    // 금액 검증 (클라이언트 조작 방지)
    if (order.amount !== amount) {
      safeLogger.error('[Payment API] Amount mismatch - possible tampering', {
        orderId,
        expected: order.amount,
        received: amount,
      })
      return createApiResponse(
        { error: '결제 금액이 일치하지 않습니다.' },
        { status: 400 }
      )
    }
    // ═══════════════════════════════════════════════════════════════

    // Circuit Breaker 체크
    const circuitAllowed = await paymentCircuit.isAllowed('toss-api')
    if (!circuitAllowed) {
      safeLogger.warn('[Payment API] Circuit breaker open for Toss API')
      return createCircuitOpenResponse()
    }

    safeLogger.info('[Payment API] Confirming payment', { orderId, amount })

    const client = getTossPaymentsClient()

    // Toss API 호출을 Circuit Breaker로 감싸기
    let result
    try {
      result = await withCircuitBreaker(paymentCircuit, 'toss-api', async () => {
        return client.confirmPayment(paymentKey, orderId, amount)
      })
    } catch (circuitError) {
      if (circuitError instanceof Error && circuitError.message === 'CIRCUIT_OPEN') {
        return createCircuitOpenResponse()
      }
      safeLogger.error('[Payment API] Toss API error', { orderId, error: circuitError })
      return createApiResponse(
        { error: '결제 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 503 }
      )
    }

    if (result.status === 'completed') {
      // P0-1: 크레딧 지급 (RPC 호출)
      try {
        const { error: rpcError } = await supabaseAdmin.rpc('grant_credits_for_paid_order', {
          p_order_id: orderId,
          p_payment_key: paymentKey,
          p_paid_amount: amount,
          p_raw: result,
        })

        if (rpcError) {
          // 이미 지급된 경우 (멱등성) - 에러 무시
          if (rpcError.message?.includes('paid') || rpcError.message?.includes('already')) {
            safeLogger.info('[Payment API] Order already paid (idempotent)', { orderId })
          } else {
            safeLogger.error('[Payment API] Credit grant failed', { orderId, error: rpcError })
            // 결제는 성공했으나 크레딧 지급 실패 - 웹훅에서 보완
            // 사용자에게는 성공으로 응답하되 로그 남김
          }
        } else {
          safeLogger.info('[Payment API] Credits granted successfully', { orderId })
        }
      } catch (grantError) {
        safeLogger.error('[Payment API] Credit grant exception', { orderId, error: grantError })
        // 웹훅에서 보완 예정, 사용자에게는 성공 응답
      }

      safeLogger.info('[Payment API] Payment confirmed', {
        orderId,
        paymentKey,
        amount,
        status: result.status,
      })

      return createApiResponse({
        payment: result,
        message: '결제가 완료되었습니다.',
      })
    } else {
      safeLogger.warn('[Payment API] Payment confirmation failed', {
        orderId,
        status: result.status,
      })

      return createApiResponse(
        {
          error: '결제 확인에 실패했습니다.',
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
