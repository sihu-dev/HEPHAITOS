// ============================================
// Strategy Validation Schemas (Zod)
// ============================================

import { z } from 'zod'

// ============================================
// Base Schemas
// ============================================

export const timeframeSchema = z.enum(['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'])

export const strategyStatusSchema = z.enum([
  'draft',
  'backtesting',
  'ready',
  'running',
  'paused',
  'stopped',
])

export const conditionOperatorSchema = z.enum([
  'gt', 'gte', 'lt', 'lte', 'eq', 'neq',
  'crosses_above', 'crosses_below',
])

// ============================================
// Condition Schema
// ============================================

export const conditionSchema = z.object({
  id: z.string().min(1),
  indicator: z.string().min(1),
  operator: conditionOperatorSchema,
  value: z.union([z.number(), z.string()]),
  params: z.record(z.string(), z.union([z.number(), z.string()])).optional(),
})

// ============================================
// Risk Management Schema
// ============================================

export const riskManagementSchema = z.object({
  stopLoss: z.number().min(0).max(100).optional(),
  takeProfit: z.number().min(0).max(1000).optional(),
  trailingStop: z.number().min(0).max(100).optional(),
  maxDrawdown: z.number().min(0).max(100).optional(),
  maxPositionSize: z.number().min(0).max(100).optional(),
  maxOpenPositions: z.number().int().min(1).max(100).optional(),
})

// ============================================
// Strategy Config Schema
// ============================================

export const strategyConfigSchema = z.object({
  symbols: z.array(z.string().min(1)).min(1).max(50),
  timeframe: timeframeSchema,
  entryConditions: z.array(conditionSchema).default([]),
  exitConditions: z.array(conditionSchema).default([]),
  riskManagement: riskManagementSchema.default({}),
  allocation: z.number().min(1).max(100).default(10),
})

// ============================================
// Create Strategy Input Schema
// ============================================

export const createStrategySchema = z.object({
  name: z
    .string()
    .min(2, '전략 이름은 최소 2자 이상이어야 합니다')
    .max(100, '전략 이름은 최대 100자까지 가능합니다')
    .transform((val) => val.trim()),
  description: z
    .string()
    .max(500, '설명은 최대 500자까지 가능합니다')
    .optional()
    .transform((val) => val?.trim()),
  config: strategyConfigSchema.optional(),
})

// ============================================
// Update Strategy Input Schema
// ============================================

export const updateStrategySchema = z.object({
  name: z
    .string()
    .min(2, '전략 이름은 최소 2자 이상이어야 합니다')
    .max(100, '전략 이름은 최대 100자까지 가능합니다')
    .transform((val) => val.trim())
    .optional(),
  description: z
    .string()
    .max(500, '설명은 최대 500자까지 가능합니다')
    .transform((val) => val?.trim())
    .optional(),
  status: strategyStatusSchema.optional(),
  config: strategyConfigSchema.partial().optional(),
})

// ============================================
// Patch Strategy Input Schema (Status change)
// ============================================

export const patchStrategySchema = z.object({
  status: strategyStatusSchema.optional(),
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
})

// ============================================
// Query Parameters Schema
// ============================================

export const strategyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: strategyStatusSchema.optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// ============================================
// AI Strategy Generation Schema
// ============================================

export const aiStrategyConfigSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  riskLevel: z.enum(['conservative', 'moderate', 'aggressive']),
  investmentGoal: z.enum(['growth', 'income', 'balanced', 'preservation']),
  timeHorizon: z.enum(['short', 'medium', 'long']),
  preferredSectors: z.array(z.string()).default([]),
  excludedSectors: z.array(z.string()).default([]),
  maxPositionSize: z.number().min(1).max(100).default(20),
  stopLossPercent: z.number().min(1).max(50).default(10),
  takeProfitPercent: z.number().min(1).max(200).default(20),
})

// ============================================
// Type Exports (inferred from schemas)
// ============================================

export type CreateStrategyInput = z.infer<typeof createStrategySchema>
export type UpdateStrategyInput = z.infer<typeof updateStrategySchema>
export type PatchStrategyInput = z.infer<typeof patchStrategySchema>
export type StrategyQueryParams = z.infer<typeof strategyQuerySchema>
export type StrategyConfig = z.infer<typeof strategyConfigSchema>
export type AIStrategyConfig = z.infer<typeof aiStrategyConfigSchema>
