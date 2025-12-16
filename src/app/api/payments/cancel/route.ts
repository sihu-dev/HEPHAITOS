// ============================================
// Payment Cancel API
// 결제 취소 API
// Zod Validation + Error Handling 표준화 적용
// ============================================

import { NextRequest } from 'next/server'
import { getTossPaymentsClient } from '@/lib/payments/toss-payments'
import { withApiMiddleware, createApiResponse, validateRequestBody } from '@/lib/api/middleware'
import { cancelPaymentSchema } from '@/lib/validations/payments'
import { safeLogger } from '@/lib/utils/safe-logger'

export const POST = withApiMiddleware(
  async (request: NextRequest) => {
    const validation = await validateRequestBody(request, cancelPaymentSchema)
    if ('error' in validation) return validation.error

    const { paymentKey, cancelReason } = validation.data

    safeLogger.info('[Payment API] Cancelling payment', { paymentKey, cancelReason })

    const client = getTossPaymentsClient()
    const result = await client.cancelPayment(paymentKey, cancelReason)

    if (result.status === 'cancelled') {
      // TODO: 실제 구현 시 여기서 구독 상태를 업데이트
      // - 구독 취소 처리
      // - 환불 이력 저장
      // - 이메일 발송 (환불 안내)

      safeLogger.info('[Payment API] Payment cancelled', {
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
