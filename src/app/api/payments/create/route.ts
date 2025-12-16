// ============================================
// Payment Create API
// 결제 생성 API
// Zod Validation + Error Handling 표준화 적용
// ============================================

import { NextRequest } from 'next/server'
import {
  getTossPaymentsClient,
  type PlanType,
  type BillingCycle,
} from '@/lib/payments/toss-payments'
import { withApiMiddleware, createApiResponse, validateRequestBody } from '@/lib/api/middleware'
import { createPaymentSchema } from '@/lib/validations/payments'
import { safeLogger } from '@/lib/utils/safe-logger'

export const POST = withApiMiddleware(
  async (request: NextRequest) => {
    const validation = await validateRequestBody(request, createPaymentSchema)
    if ('error' in validation) return validation.error

    const { plan, billingCycle } = validation.data

    safeLogger.info('[Payment API] Creating payment', { plan, billingCycle })

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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const successUrl = validation.data.successUrl || `${baseUrl}/dashboard/settings/billing?success=true&orderId=${orderId}`
    const failUrl = validation.data.failUrl || `${baseUrl}/dashboard/settings/billing?fail=true&orderId=${orderId}`

    const result = await client.initiatePayment({
      orderId,
      amount,
      orderName,
      customerName: 'User', // Get from session
      customerEmail: 'user@example.com', // Get from session
      planId: plan as PlanType,
      billingCycle,
      successUrl,
      failUrl,
    })

    safeLogger.info('[Payment API] Payment created', { orderId, amount })

    return createApiResponse({
      orderId,
      amount,
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
