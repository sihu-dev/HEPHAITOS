// ============================================
// Simulation Validation Schemas (Zod)
// ============================================

import { z } from 'zod'

// ============================================
// Get Simulation Schema
// ============================================

export const getSimulationSchema = z.object({
  userId: z.string().optional(),
  accountId: z.string().optional(),
}).refine(data => data.userId || data.accountId, {
  message: 'Either userId or accountId must be provided',
})

// ============================================
// Create Simulation Schema
// ============================================

export const createSimulationSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  name: z.string().min(1).max(50).optional(),
  initialBalance: z.number().positive().default(1000000), // 기본 100만원
})

// ============================================
// Delete Simulation Schema
// ============================================

export const deleteSimulationSchema = z.object({
  accountId: z.string().min(1, 'accountId is required'),
})

// ============================================
// Simulation Trade Schema
// ============================================

export const createSimulationTradeSchema = z.object({
  accountId: z.string().min(1, 'accountId is required'),
  symbol: z.string().min(1, 'symbol is required'),
  side: z.enum(['buy', 'sell']),
  quantity: z.number().positive('quantity must be positive'),
  price: z.number().positive('price must be positive').optional(),
})

// Alias for backwards compatibility
export const simulationTradeSchema = createSimulationTradeSchema

// ============================================
// Type Exports
// ============================================

export type GetSimulationQuery = z.infer<typeof getSimulationSchema>
export type CreateSimulationInput = z.infer<typeof createSimulationSchema>
export type DeleteSimulationInput = z.infer<typeof deleteSimulationSchema>
export type SimulationTradeInput = z.infer<typeof simulationTradeSchema>
