// ============================================
// Portfolio Validation Schemas (Zod)
// ============================================

import { z } from 'zod'

// ============================================
// Portfolio Query Schema
// ============================================

export const portfolioQuerySchema = z.object({
  userId: z.string().optional(),
  timeframe: z.enum(['1D', '1W', '1M', '3M', '1Y', 'ALL']).default('1M'),
  includeHistory: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
})

// ============================================
// Update Portfolio Schema
// ============================================

export const updatePortfolioSchema = z.object({
  userId: z.string().min(1, '사용자 ID가 필요합니다'),
  holdings: z.array(
    z.object({
      symbol: z.string(),
      quantity: z.number().positive(),
      averagePrice: z.number().positive(),
    })
  ).optional(),
})

// ============================================
// Type Exports
// ============================================

export type PortfolioQuery = z.infer<typeof portfolioQuerySchema>
export type UpdatePortfolioInput = z.infer<typeof updatePortfolioSchema>
