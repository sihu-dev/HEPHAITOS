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
} from '@/lib/services/user-profile'

/**
 * GET /api/user/onboarding
 * 온보딩 상태 조회
 */
export const GET = withApiMiddleware(
  async (request: NextRequest) => {
    const supabase = await createServerSupabaseClient()
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
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return createApiResponse({ error: 'Unauthorized' }, { status: 401 })
    }

    safeLogger.info('[Onboarding API] Completing onboarding', { userId: user.id })

    // Map validation data to service layer format
    const onboardingData = {
      nickname: validation.data.investmentExperience, // Adjust mapping as needed
      investmentStyle: validation.data.riskTolerance,
      experience: validation.data.investmentExperience,
      interests: validation.data.preferredAssets,
      painPoints: [],
    }

    const profile = await completeOnboarding(user.id, onboardingData as any)

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
