// ============================================
// User Profile Service
// 사용자 프로필 및 온보딩 관리
// ============================================

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

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

// Database row type for user_profiles table
interface UserProfileRow {
  id: string
  user_id: string
  nickname: string
  investment_style: 'conservative' | 'moderate' | 'aggressive'
  experience: 'beginner' | 'intermediate' | 'advanced'
  interests: string[]
  pain_points: string[]
  onboarding_completed: boolean
  onboarding_step: number
  created_at: string
  updated_at: string
}

// Update data type for database operations
interface UserProfileUpdateData {
  user_id?: string
  nickname?: string
  investment_style?: 'conservative' | 'moderate' | 'aggressive'
  experience?: 'beginner' | 'intermediate' | 'advanced'
  interests?: string[]
  pain_points?: string[]
  onboarding_completed?: boolean
  onboarding_step?: number
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

  const { data, error } = await (supabase as unknown as SupabaseClient<Database>)
    .from('user_profiles' as never)
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('[UserProfileService] getUserProfile error:', error)
    return mockProfiles.get(userId) ?? null
  }

  const row = data as unknown as UserProfileRow
  return row ? {
    id: row.id,
    userId: row.user_id,
    nickname: row.nickname,
    investmentStyle: row.investment_style,
    experience: row.experience,
    interests: row.interests ?? [],
    painPoints: row.pain_points ?? [],
    onboardingCompleted: row.onboarding_completed ?? false,
    onboardingStep: row.onboarding_step ?? 0,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
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

  // Upsert: 있으면 업데이트, 없으면 생성
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: result, error } = await (supabase as any)
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
    }, {
      onConflict: 'user_id',
    })
    .select()
    .single()

  if (error) {
    console.error('[UserProfileService] completeOnboarding error:', error)
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

  const row = result as unknown as UserProfileRow
  return {
    id: row.id,
    userId: row.user_id,
    nickname: row.nickname,
    investmentStyle: row.investment_style,
    experience: row.experience,
    interests: row.interests ?? [],
    painPoints: row.pain_points ?? [],
    onboardingCompleted: row.onboarding_completed,
    onboardingStep: row.onboarding_step,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
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

  const updateData: UserProfileUpdateData = {
    onboarding_step: step,
  }

  if (partialData.nickname) updateData.nickname = partialData.nickname
  if (partialData.investmentStyle) updateData.investment_style = partialData.investmentStyle
  if (partialData.experience) updateData.experience = partialData.experience
  if (partialData.interests) updateData.interests = partialData.interests
  if (partialData.painPoints) updateData.pain_points = partialData.painPoints

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('user_profiles')
    .upsert({
      user_id: userId,
      ...updateData,
    }, {
      onConflict: 'user_id',
    })

  if (error) {
    console.error('[UserProfileService] saveOnboardingProgress error:', error)
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

  const updateData: UserProfileUpdateData = {}
  if (updates.nickname) updateData.nickname = updates.nickname
  if (updates.investmentStyle) updateData.investment_style = updates.investmentStyle
  if (updates.experience) updateData.experience = updates.experience
  if (updates.interests) updateData.interests = updates.interests
  if (updates.painPoints) updateData.pain_points = updates.painPoints

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('user_profiles')
    .update(updateData)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    console.error('[UserProfileService] updateUserProfile error:', error)
    return null
  }

  const row = data as unknown as UserProfileRow
  return row ? {
    id: row.id,
    userId: row.user_id,
    nickname: row.nickname,
    investmentStyle: row.investment_style,
    experience: row.experience,
    interests: row.interests ?? [],
    painPoints: row.pain_points ?? [],
    onboardingCompleted: row.onboarding_completed,
    onboardingStep: row.onboarding_step,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
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

  const { data, error } = await (supabase as unknown as SupabaseClient<Database>)
    .from('user_profiles' as never)
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('[UserProfileService] getUserProfileClient error:', error)
    return null
  }

  const row = data as unknown as UserProfileRow
  return row ? {
    id: row.id,
    userId: row.user_id,
    nickname: row.nickname,
    investmentStyle: row.investment_style,
    experience: row.experience,
    interests: row.interests ?? [],
    painPoints: row.pain_points ?? [],
    onboardingCompleted: row.onboarding_completed,
    onboardingStep: row.onboarding_step,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  } : null
}
