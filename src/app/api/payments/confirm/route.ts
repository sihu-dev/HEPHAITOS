// ============================================
// Payment Confirm API
// 결제 확인 API (결제 완료 후 호출)
// Zod Validation + Error Handling 표준화 적용
// ============================================

import { NextRequest } from 'next/server'
import { getTossPaymentsClient } from '@/lib/payments/toss-payments'
import { withApiMiddleware, createApiResponse, validateRequestBody } from '@/lib/api/middleware'
import { confirmPaymentSchema } from '@/lib/validations/payments'
import { safeLogger } from '@/lib/utils/safe-logger'

export const POST = withApiMiddleware(
  async (request: NextRequest) => {
    const validation = await validateRequestBody(request, confirmPaymentSchema)
    if ('error' in validation) return validation.error

    const { paymentKey, orderId, amount } = validation.data

    safeLogger.info('[Payment API] Confirming payment', { orderId, amount })

    const client = getTossPaymentsClient()
    const result = await client.confirmPayment(paymentKey, orderId, amount)

    if (result.status === 'completed') {
      // TODO: 실제 구현 시 여기서 구독 정보를 데이터베이스에 저장
      // - 사용자 구독 상태 업데이트
      // - 결제 이력 저장
      // - 이메일 발송 (영수증)

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
