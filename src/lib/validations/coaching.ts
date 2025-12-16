// ============================================
// Coaching Validation Schemas (Zod)
// P-1 CRITICAL: 크레딧 소비 기능 지원
// ============================================

import { z } from 'zod'

// ============================================
// Coaching Query Schema
// ============================================

export const coachingQuerySchema = z.object({
  type: z.enum(['mentors', 'sessions', 'all']).optional(),
  filter: z.enum(['live', 'upcoming', 'all']).optional(),
})

// ============================================
// Coaching Action Schemas (Union)
// ============================================

// 라이브 세션 참여
const joinSessionSchema = z.object({
  action: z.literal('join'),
  sessionId: z.string().min(1, '세션 ID가 필요합니다'),
  userId: z.string().optional(),
})

// 멘토 예약
const bookMentorSchema = z.object({
  action: z.literal('book'),
  mentorId: z.string().min(1, '멘토 ID가 필요합니다'),
  userId: z.string().optional(),
  scheduledAt: z.string().optional(),
  duration: z.number().positive().optional().default(60),
})

// 기존 세션 관리 액션들
const sessionManageSchema = z.object({
  action: z.enum(['start', 'end', 'schedule', 'cancel']),
  mentorId: z.string().min(1, '멘토 ID가 필요합니다'),
  userId: z.string().optional(),
  scheduledAt: z.string().optional(),
  duration: z.number().positive().optional().default(60),
  notes: z.string().optional(),
})

// 통합 스키마 (discriminated union)
export const coachingActionSchema = z.discriminatedUnion('action', [
  joinSessionSchema,
  bookMentorSchema,
  sessionManageSchema.extend({ action: z.literal('start') }),
  sessionManageSchema.extend({ action: z.literal('end') }),
  sessionManageSchema.extend({ action: z.literal('schedule') }),
  sessionManageSchema.extend({ action: z.literal('cancel') }),
])

// ============================================
// Type Exports
// ============================================

export type CoachingQuery = z.infer<typeof coachingQuerySchema>
export type CoachingActionInput = z.infer<typeof coachingActionSchema>
