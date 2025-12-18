// ============================================
// AI Validation Schemas (Zod)
// ============================================

import { z } from 'zod'

// ============================================
// AI Report Schemas
// ============================================

export const aiReportQuerySchema = z.object({
  mentorId: z.string().optional(),
  focusSectors: z.string().optional(),
})

export const generateReportSchema = z.object({
  mentorId: z.string().optional(),
  focusSectors: z.array(z.string()).optional(),
  timeframe: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
  customPrompt: z.string().optional(),
  minConfidence: z.number().min(0).max(1).optional(),
})

// ============================================
// Trade Analysis Schemas
// ============================================

export const tradeAnalysisSchema = z.object({
  celebrity: z.string(),
  ticker: z.string(),
  company: z.string(),
  action: z.enum(['buy', 'sell']),
  amount: z.string(),
  date: z.string(),
  currentPrice: z.number().optional(),
  recentNews: z.array(z.string()).optional(),
  portfolioContext: z.object({
    previousHoldings: z.number().optional(),
    newHoldings: z.number().optional(),
    portfolioWeight: z.number().optional(),
  }).optional(),
})

// ============================================
// AI Tutor Schemas
// ============================================

export const tutorQuestionSchema = z.object({
  question: z.string().min(1, '질문을 입력해주세요'),
  context: z.string().optional(),
  userId: z.string().optional(),
})

// ============================================
// AI Strategy Generation Schemas
// ============================================

export const generateStrategySchema = z.object({
  prompt: z.string().min(10, '전략 설명은 최소 10자 이상이어야 합니다'),
  riskLevel: z.enum(['conservative', 'moderate', 'aggressive']).default('moderate'),
  timeframe: z.enum(['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w']).default('1h'),
  userId: z.string().optional(),
})

// ============================================
// Type Exports
// ============================================

export type AIReportQuery = z.infer<typeof aiReportQuerySchema>
export type GenerateReportInput = z.infer<typeof generateReportSchema>
export type TradeAnalysisInput = z.infer<typeof tradeAnalysisSchema>
export type TutorQuestionInput = z.infer<typeof tutorQuestionSchema>
export type GenerateStrategyInput = z.infer<typeof generateStrategySchema>
