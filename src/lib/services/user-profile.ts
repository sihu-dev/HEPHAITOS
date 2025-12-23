// ============================================
// User Profile Service
// 사용자 프로필 및 온보딩 관리
// ============================================

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { safeLogger } from '@/lib/utils/safe-logger'
import type { Database } from '@/lib/supabase/types'

type UserProfileRow = Database['public']['Tables']['user_profiles']['Row']

// 환경 설정: Supabase 사용 여부
const USE_SUPABASE = process.env.NEXT_PUBLIC_USE_SUPABASE === 'true'

// ============================================
// Types
// ============================================

export interface UserProfile {
  id: string
  userId: string
  nickname: string
  investmentStyle: 'conservative' | 'moderate' | 'aggressive'
  experience: 'beginner' | 'intermediate' | 'advanced'
  interests: string[]
  painPoints: string[]
  onboardingCompleted: boolean
  onboardingStep: number
  createdAt: Date
  updatedAt: Date
}

export interface OnboardingData {
  nickname: string
  investmentStyle: 'conservative' | 'moderate' | 'aggressive'
  experience: 'beginner' | 'intermediate' | 'advanced'
  interests: string[]
  painPoints: string[]
}

// Mock 데이터 저장소
const mockProfiles: Map<string, UserProfile> = new Map()

// ============================================
// Server-side functions
// ============================================

/**
 * 사용자 프로필 조회
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!USE_SUPABASE) {
    return mockProfiles.get(userId) ?? null
  }

  const supabase = await createServerSupabaseClient()

  if (!supabase) {
    return mockProfiles.get(userId) ?? null
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single<UserProfileRow>()

  if (error) {
    safeLogger.error('[UserProfileService] getUserProfile error:', error)
    return mockProfiles.get(userId) ?? null
  }

  return data ? {
    id: data.id,
    userId: data.user_id,
    nickname: data.nickname,
    investmentStyle: data.investment_style,
    experience: data.experience,
    interests: data.interests ?? [],
    painPoints: data.pain_points ?? [],
    onboardingCompleted: data.onboarding_completed ?? false,
    onboardingStep: data.onboarding_step ?? 0,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  } : null
}

/**
 * 온보딩 완료 처리
 */
export async function completeOnboarding(
  userId: string,
  data: OnboardingData
): Promise<UserProfile> {
  if (!USE_SUPABASE) {
    const profile: UserProfile = {
      id: `profile_${Date.now()}`,
      userId,
      ...data,
      onboardingCompleted: true,
      onboardingStep: 6,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    mockProfiles.set(userId, profile)
    return profile
  }

  const supabase = await createServerSupabaseClient()
  if (!supabase) {
    throw new Error('Database connection failed')
  }

  // Upsert: 있으면 업데이트, 없으면 생성
  const { data: result, error } = await supabase
    .from('user_profiles')
    .upsert({
      user_id: userId,
      nickname: data.nickname,
      investment_style: data.investmentStyle,
      experience: data.experience,
      interests: data.interests,
      pain_points: data.painPoints,
      onboarding_completed: true,
      onboarding_step: 6,
    } as any, {
      onConflict: 'user_id',
    })
    .select()
    .single<UserProfileRow>()

  if (error) {
    safeLogger.error('[UserProfileService] completeOnboarding error:', error)
    // Fallback to mock
    const profile: UserProfile = {
      id: `profile_${Date.now()}`,
      userId,
      ...data,
      onboardingCompleted: true,
      onboardingStep: 6,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    mockProfiles.set(userId, profile)
    return profile
  }

  return {
    id: result.id,
    userId: result.user_id,
    nickname: result.nickname,
    investmentStyle: result.investment_style,
    experience: result.experience,
    interests: result.interests ?? [],
    painPoints: result.pain_points ?? [],
    onboardingCompleted: result.onboarding_completed,
    onboardingStep: result.onboarding_step,
    createdAt: new Date(result.created_at),
    updatedAt: new Date(result.updated_at),
  }
}

/**
 * 온보딩 진행 상태 저장 (중간 저장)
 */
export async function saveOnboardingProgress(
  userId: string,
  step: number,
  partialData: Partial<OnboardingData>
): Promise<void> {
  if (!USE_SUPABASE) {
    const existing = mockProfiles.get(userId)
    if (existing) {
      mockProfiles.set(userId, {
        ...existing,
        ...partialData,
        onboardingStep: step,
        updatedAt: new Date(),
      } as UserProfile)
    } else {
      mockProfiles.set(userId, {
        id: `profile_${Date.now()}`,
        userId,
        nickname: partialData.nickname ?? '',
        investmentStyle: partialData.investmentStyle ?? 'moderate',
        experience: partialData.experience ?? 'beginner',
        interests: partialData.interests ?? [],
        painPoints: partialData.painPoints ?? [],
        onboardingCompleted: false,
        onboardingStep: step,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }
    return
  }

  const supabase = await createServerSupabaseClient()
  if (!supabase) {
    return
  }

  const updateData: Record<string, unknown> = {
    onboarding_step: step,
  }

  if (partialData.nickname) updateData.nickname = partialData.nickname
  if (partialData.investmentStyle) updateData.investment_style = partialData.investmentStyle
  if (partialData.experience) updateData.experience = partialData.experience
  if (partialData.interests) updateData.interests = partialData.interests
  if (partialData.painPoints) updateData.pain_points = partialData.painPoints

  const { error } = await supabase
    .from('user_profiles')
    .upsert({
      user_id: userId,
      ...updateData,
    } as any, {
      onConflict: 'user_id',
    })

  if (error) {
    safeLogger.error('[UserProfileService] saveOnboardingProgress error:', error)
  }
}

/**
 * 사용자 프로필 업데이트
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<OnboardingData>
): Promise<UserProfile | null> {
  if (!USE_SUPABASE) {
    const existing = mockProfiles.get(userId)
    if (!existing) return null

    const updated: UserProfile = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    }
    mockProfiles.set(userId, updated)
    return updated
  }

  const supabase = await createServerSupabaseClient()
  if (!supabase) {
    return null
  }

  const updateData: Record<string, unknown> = {}
  if (updates.nickname) updateData.nickname = updates.nickname
  if (updates.investmentStyle) updateData.investment_style = updates.investmentStyle
  if (updates.experience) updateData.experience = updates.experience
  if (updates.interests) updateData.interests = updates.interests
  if (updates.painPoints) updateData.pain_points = updates.painPoints

  const { data, error } = await supabase
    .from('user_profiles')
    // @ts-ignore - Supabase generated types conflict
    .update(updateData)
    .eq('user_id', userId)
    .select()
    .single<UserProfileRow>()

  if (error) {
    safeLogger.error('[UserProfileService] updateUserProfile error:', error)
    return null
  }

  return data ? {
    id: data.id,
    userId: data.user_id,
    nickname: data.nickname,
    investmentStyle: data.investment_style,
    experience: data.experience,
    interests: data.interests ?? [],
    painPoints: data.pain_points ?? [],
    onboardingCompleted: data.onboarding_completed,
    onboardingStep: data.onboarding_step,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  } : null
}

/**
 * 온보딩 완료 여부 확인
 */
export async function isOnboardingCompleted(userId: string): Promise<boolean> {
  const profile = await getUserProfile(userId)
  return profile?.onboardingCompleted ?? false
}

// ============================================
// Client-side functions
// ============================================

/**
 * 사용자 프로필 조회 (클라이언트)
 */
export async function getUserProfileClient(userId: string): Promise<UserProfile | null> {
  if (!USE_SUPABASE) {
    return mockProfiles.get(userId) ?? null
  }

  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    return null
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single<UserProfileRow>()

  if (error) {
    safeLogger.error('[UserProfileService] getUserProfileClient error:', error)
    return null
  }

  return data ? {
    id: data.id,
    userId: data.user_id,
    nickname: data.nickname,
    investmentStyle: data.investment_style,
    experience: data.experience,
    interests: data.interests ?? [],
    painPoints: data.pain_points ?? [],
    onboardingCompleted: data.onboarding_completed,
    onboardingStep: data.onboarding_step,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  } : null
}
