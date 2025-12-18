// ============================================
// Consent API
// GPT V1 피드백 P0-4: 동의 상태 조회 및 기록
// ============================================

import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { withApiMiddleware, createApiResponse, validateRequestBody } from '@/lib/api/middleware'
import { safeLogger } from '@/lib/utils/safe-logger'
import { z } from 'zod'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 동의 기록 스키마
const recordConsentSchema = z.object({
  consentType: z.enum(['disclaimer', 'age_verification', 'marketing', 'data_processing']),
  agreed: z.boolean(),
  birthDate: z.string().optional(),  // YYYY-MM-DD
  metadata: z.record(z.string(), z.unknown()).optional(),
})

/**
 * GET /api/consent
 * 현재 사용자의 동의 상태 조회
 */
export const GET = withApiMiddleware(
  async (request: NextRequest) => {
    // 사용자 인증
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return createApiResponse(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 동의 상태 조회
    const { data, error } = await supabaseAdmin.rpc('check_user_consent', {
      p_user_id: user.id,
      p_consent_types: ['disclaimer', 'age_verification'],
    })

    if (error) {
      safeLogger.error('[Consent API] Failed to check consent', { error, userId: user.id })
      return createApiResponse(
        { error: '동의 상태 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 최신 면책조항 버전 조회
    const { data: disclaimer } = await supabaseAdmin
      .from('disclaimer_versions')
      .select('id, version, title')
      .eq('is_active', true)
      .order('effective_date', { ascending: false })
      .limit(1)
      .single()

    return createApiResponse({
      consents: data,
      latestDisclaimer: disclaimer,
      requiresConsent: !data?.all_consented,
    })
  },
  {
    rateLimit: { category: 'api' },
    errorHandler: { logErrors: true },
  }
)

/**
 * POST /api/consent
 * 동의 기록
 */
export const POST = withApiMiddleware(
  async (request: NextRequest) => {
    const validation = await validateRequestBody(request, recordConsentSchema)
    if ('error' in validation) return validation.error

    const { consentType, agreed, birthDate, metadata } = validation.data

    // 사용자 인증
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return createApiResponse(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // IP 주소 추출
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ipAddress = forwardedFor?.split(',')[0].trim() || request.headers.get('x-real-ip') || null

    // 동의 기록
    const { data, error } = await supabaseAdmin.rpc('record_user_consent', {
      p_user_id: user.id,
      p_consent_type: consentType,
      p_agreed: agreed,
      p_ip_address: ipAddress,
      p_user_agent: request.headers.get('user-agent'),
      p_birth_date: birthDate || null,
      p_metadata: metadata || null,
    })

    if (error) {
      safeLogger.error('[Consent API] Failed to record consent', { error, userId: user.id })
      return createApiResponse(
        { error: '동의 기록에 실패했습니다.' },
        { status: 500 }
      )
    }

    const result = data as { success: boolean; error?: string; age_verified?: boolean }

    if (!result.success) {
      // 만 19세 미만인 경우
      if (result.error === 'AGE_REQUIREMENT_NOT_MET') {
        return createApiResponse(
          { error: '만 19세 이상만 서비스를 이용할 수 있습니다.' },
          { status: 403 }
        )
      }
      return createApiResponse(
        { error: result.error || '동의 기록에 실패했습니다.' },
        { status: 400 }
      )
    }

    safeLogger.info('[Consent API] Consent recorded', {
      userId: user.id,
      consentType,
      agreed,
      ageVerified: result.age_verified,
    })

    return createApiResponse({
      success: true,
      consentType,
      agreed,
      ageVerified: result.age_verified,
    })
  },
  {
    rateLimit: { category: 'write' },
    errorHandler: { logErrors: true },
  }
)
