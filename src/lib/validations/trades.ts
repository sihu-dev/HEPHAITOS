// ============================================
// Trades Validation Schemas (Zod)
// ============================================

import { z } from 'zod'

// ============================================
// Trades Query Schema
// ============================================

export const tradesQuerySchema = z.object({
  userId: z.string().optional(),
  strategyId: z.string().optional(),
  symbol: z.string().optional(),
  status: z.enum(['pending', 'executed', 'cancelled', 'failed']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['created_at', 'executed_at', 'symbol']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// ============================================
// Create Trade Schema
// ============================================

export const createTradeSchema = z.object({
  userId: z.string().min(1, '사용자 ID가 필요합니다'),
  strategyId: z.string().optional(),
  symbol: z.string().min(1, '종목 코드가 필요합니다'),
  side: z.enum(['buy', 'sell']),
  quantity: z.number().positive('수량은 양수여야 합니다'),
  price: z.number().positive('가격은 양수여야 합니다').optional(),
  orderType: z.enum(['market', 'limit']).default('market'),
  // Additional fields for compatibility
  type: z.enum(['market', 'limit']).optional(),
  amount: z.number().positive().optional(),
})

// ============================================
// Type Exports
// ============================================

export type TradesQuery = z.infer<typeof tradesQuerySchema>
export type CreateTradeInput = z.infer<typeof createTradeSchema>
