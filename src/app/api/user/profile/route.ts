// ============================================
import { NextResponse } from 'next/server'
// User Profile API
// GET: 프로필 조회
// PATCH: 프로필 업데이트
// Zod Validation + Error Handling 표준화 적용
// ============================================

import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { withApiMiddleware, createApiResponse, validateRequestBody } from '@/lib/api/middleware'
import { updateProfileSchema } from '@/lib/validations/user'
import { safeLogger } from '@/lib/utils/safe-logger'
import { getUserProfile, updateUserProfile, type OnboardingData } from '@/lib/services/user-profile'

/**
 * GET /api/user/profile
 * 사용자 프로필 조회
 */
export const GET = withApiMiddleware(
  async (request: NextRequest) => {
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: { code: 'SUPABASE_ERROR', message: 'Database connection failed' } },
        { status: 500 }
      )
    }
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return createApiResponse({ error: 'Unauthorized' }, { status: 401 })
    }

    safeLogger.info('[Profile API] Fetching profile', { userId: user.id })

    const profile = await getUserProfile(user.id)

    if (!profile) {
      return createApiResponse({ error: 'Profile not found' }, { status: 404 })
    }

    return createApiResponse({
      id: profile.id,
      userId: profile.userId,
      nickname: profile.nickname,
      investmentStyle: profile.investmentStyle,
      experience: profile.experience,
      interests: profile.interests,
      painPoints: profile.painPoints,
      onboardingCompleted: profile.onboardingCompleted,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    })
  },
  {
    rateLimit: { category: 'api' },
    errorHandler: { logErrors: true },
  }
)

/**
 * PATCH /api/user/profile
 * 사용자 프로필 업데이트
 */
export const PATCH = withApiMiddleware(
  async (request: NextRequest) => {
    const validation = await validateRequestBody(request, updateProfileSchema)
    if ('error' in validation) return validation.error

    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      return createApiResponse({ error: 'Database connection failed' }, { status: 500 })
    }
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return createApiResponse({ error: 'Unauthorized' }, { status: 401 })
    }

    safeLogger.info('[Profile API] Updating profile', { userId: user.id })

    // TODO: Fix schema mismatch - updateProfileSchema uses different field names than OnboardingData
    // Map UpdateProfileInput to Partial<OnboardingData>
    const profileUpdates: Partial<OnboardingData> = {
      ...(validation.data.displayName && { nickname: validation.data.displayName }),
      ...(validation.data.riskProfile && { investmentStyle: validation.data.riskProfile }),
      ...(validation.data.preferredSectors && { interests: validation.data.preferredSectors }),
    }

    const profile = await updateUserProfile(user.id, profileUpdates)

    if (!profile) {
      return createApiResponse({ error: 'Profile not found' }, { status: 404 })
    }

    return createApiResponse({
      message: '프로필이 업데이트되었습니다',
      profile: {
        nickname: profile.nickname,
        investmentStyle: profile.investmentStyle,
        experience: profile.experience,
        interests: profile.interests,
      },
    })
  },
  {
    rateLimit: { category: 'write' },
    errorHandler: { logErrors: true },
  }
)
