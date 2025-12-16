// ============================================
// Payments Validation Schemas (Zod)
// ============================================

import { z } from 'zod'

// ============================================
// Create Payment Schema
// ============================================

export const createPaymentSchema = z.object({
  plan: z.enum(['free', 'starter', 'pro', 'premium']),
  billingCycle: z.enum(['monthly', 'yearly']).default('monthly'),
  userId: z.string().optional(),
})

// ============================================
// Confirm Payment Schema
// ============================================

export const confirmPaymentSchema = z.object({
  paymentKey: z.string().min(1, '결제 키가 필요합니다'),
  orderId: z.string().min(1, '주문 ID가 필요합니다'),
  amount: z.number().positive('결제 금액은 양수여야 합니다'),
})

// ============================================
// Cancel Payment Schema
// ============================================

export const cancelPaymentSchema = z.object({
  paymentKey: z.string().min(1, '결제 키가 필요합니다'),
  cancelReason: z.string().min(1, '취소 사유가 필요합니다'),
})

// ============================================
// Type Exports
// ============================================

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>
export type ConfirmPaymentInput = z.infer<typeof confirmPaymentSchema>
export type CancelPaymentInput = z.infer<typeof cancelPaymentSchema>
