// ============================================
// User Onboarding API
// POST: 온보딩 완료
// GET: 온보딩 상태 조회
// PATCH: 온보딩 진행 저장
// Zod Validation + Error Handling 표준화 적용
// ============================================

import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { withApiMiddleware, createApiResponse, validateRequestBody } from '@/lib/api/middleware'
import { onboardingSchema } from '@/lib/validations/user'
import { safeLogger } from '@/lib/utils/safe-logger'
import {
  completeOnboarding,
  getUserProfile,
  saveOnboardingProgress,
  type OnboardingData,
} from '@/lib/services/user-profile'

/**
 * GET /api/user/onboarding
 * 온보딩 상태 조회
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

    safeLogger.info('[Onboarding API] Fetching status', { userId: user.id })

    const profile = await getUserProfile(user.id)

    return createApiResponse({
      onboardingCompleted: profile?.onboardingCompleted ?? false,
      onboardingStep: profile?.onboardingStep ?? 0,
      profile: profile
        ? {
            nickname: profile.nickname,
            investmentStyle: profile.investmentStyle,
            experience: profile.experience,
            interests: profile.interests,
            painPoints: profile.painPoints,
          }
        : null,
    })
  },
  {
    rateLimit: { category: 'api' },
    errorHandler: { logErrors: true },
  }
)

/**
 * POST /api/user/onboarding
 * 온보딩 완료
 */
export const POST = withApiMiddleware(
  async (request: NextRequest) => {
    const validation = await validateRequestBody(request, onboardingSchema)
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

    safeLogger.info('[Onboarding API] Completing onboarding', { userId: user.id })

    // Map validation data to service layer format
    // TODO: Fix mapping - nickname should not be investmentExperience
    const onboardingData: OnboardingData = {
      nickname: validation.data.investmentExperience, // TODO: Get actual nickname from validation
      investmentStyle: validation.data.riskProfile as 'conservative' | 'moderate' | 'aggressive',
      experience: validation.data.investmentExperience as 'beginner' | 'intermediate' | 'advanced',
      interests: validation.data.preferredSectors,
      painPoints: [],
    }

    const profile = await completeOnboarding(user.id, onboardingData)

    return createApiResponse({
      message: '온보딩이 완료되었습니다',
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

// PATCH endpoint removed - use profile API for updates
