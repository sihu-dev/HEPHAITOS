// ============================================
// User Validation Schemas (Zod)
// ============================================

import { z } from 'zod'

// ============================================
// Update Profile Schema
// ============================================

export const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
  riskProfile: z.enum(['conservative', 'moderate', 'aggressive']).optional(),
  investmentGoals: z.array(z.string()).optional(),
  preferredSectors: z.array(z.string()).optional(),
  notificationPreferences: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    sms: z.boolean().optional(),
  }).optional(),
})

// ============================================
// Onboarding Schema
// ============================================

export const onboardingSchema = z.object({
  userId: z.string().min(1, '사용자 ID가 필요합니다'),
  riskProfile: z.enum(['conservative', 'moderate', 'aggressive']),
  investmentExperience: z.enum(['beginner', 'intermediate', 'advanced']),
  investmentGoal: z.enum(['growth', 'income', 'balanced', 'preservation']),
  initialCapital: z.number().positive().optional(),
  preferredSectors: z.array(z.string()).default([]),
})

// ============================================
// Type Exports
// ============================================

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type OnboardingInput = z.infer<typeof onboardingSchema>
