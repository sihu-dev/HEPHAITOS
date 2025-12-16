// ============================================
// Consent Gate Middleware
// GPT V1 피드백 P0-4: 연령 게이트(만 19세) + 면책 동의
// ============================================

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { safeLogger } from '@/lib/utils/safe-logger'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type ConsentType = 'disclaimer' | 'age_verification' | 'marketing' | 'data_processing'

export interface ConsentStatus {
  disclaimer: boolean
  age_verification: boolean
  all_consented: boolean
}

export interface ConsentCheckResult {
  hasConsent: boolean
  missingConsents: ConsentType[]
  status: ConsentStatus
}

/**
 * 사용자 동의 상태 확인
 */
export async function checkUserConsent(
  userId: string,
  requiredConsents: ConsentType[] = ['disclaimer', 'age_verification']
): Promise<ConsentCheckResult> {
  try {
    const { data, error } = await supabaseAdmin.rpc('check_user_consent', {
      p_user_id: userId,
      p_consent_types: requiredConsents,
    })

    if (error) {
      safeLogger.error('[ConsentGate] RPC error', { error, userId })
      // 에러 시 동의 필요로 처리
      return {
        hasConsent: false,
        missingConsents: requiredConsents,
        status: {
          disclaimer: false,
          age_verification: false,
          all_consented: false,
        },
      }
    }

    const status = data as ConsentStatus
    const missingConsents = requiredConsents.filter(
      (type) => !status[type as keyof ConsentStatus]
    )

    return {
      hasConsent: missingConsents.length === 0,
      missingConsents,
      status,
    }
  } catch (error) {
    safeLogger.error('[ConsentGate] Exception', { error, userId })
    return {
      hasConsent: false,
      missingConsents: requiredConsents,
      status: {
        disclaimer: false,
        age_verification: false,
        all_consented: false,
      },
    }
  }
}

/**
 * 동의 기록
 */
export async function recordConsent(
  userId: string,
  consentType: ConsentType,
  agreed: boolean,
  options?: {
    ipAddress?: string
    userAgent?: string
    birthDate?: string  // YYYY-MM-DD
    metadata?: Record<string, unknown>
  }
): Promise<{ success: boolean; error?: string; ageVerified?: boolean }> {
  try {
    const { data, error } = await supabaseAdmin.rpc('record_user_consent', {
      p_user_id: userId,
      p_consent_type: consentType,
      p_agreed: agreed,
      p_ip_address: options?.ipAddress || null,
      p_user_agent: options?.userAgent || null,
      p_birth_date: options?.birthDate || null,
      p_metadata: options?.metadata || null,
    })

    if (error) {
      safeLogger.error('[ConsentGate] Record consent RPC error', { error, userId, consentType })
      return { success: false, error: error.message }
    }

    const result = data as { success: boolean; error?: string; age_verified?: boolean }

    if (!result.success) {
      return { success: false, error: result.error }
    }

    safeLogger.info('[ConsentGate] Consent recorded', { userId, consentType, agreed })
    return { success: true, ageVerified: result.age_verified }
  } catch (error) {
    safeLogger.error('[ConsentGate] Record consent exception', { error, userId })
    return { success: false, error: 'INTERNAL_ERROR' }
  }
}

/**
 * 최신 면책조항 버전 조회
 */
export async function getLatestDisclaimer(): Promise<{
  id: string
  version: string
  title: string
  content: string
} | null> {
  const { data, error } = await supabaseAdmin
    .from('disclaimer_versions')
    .select('id, version, title, content')
    .eq('is_active', true)
    .order('effective_date', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    safeLogger.error('[ConsentGate] Failed to get disclaimer', { error })
    return null
  }

  return data
}

// ============================================
// Consent Gate Response Helpers
// ============================================

export function createConsentRequiredResponse(
  missingConsents: ConsentType[]
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'CONSENT_REQUIRED',
        message: '서비스 이용을 위해 동의가 필요합니다.',
        missingConsents,
        redirectUrl: '/consent',
      },
    },
    { status: 403 }
  )
}

export function createAgeVerificationRequiredResponse(): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'AGE_VERIFICATION_REQUIRED',
        message: '만 19세 이상만 이용 가능합니다. 연령 확인이 필요합니다.',
        redirectUrl: '/consent/age-verification',
      },
    },
    { status: 403 }
  )
}

export function createUnderageResponse(): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'UNDERAGE',
        message: '만 19세 미만은 서비스를 이용할 수 없습니다.',
      },
    },
    { status: 403 }
  )
}

// ============================================
// Middleware Wrapper
// ============================================

export interface ConsentGateOptions {
  requiredConsents?: ConsentType[]
  skipForRoutes?: string[]
}

/**
 * API Route Handler에 Consent Gate 적용
 */
export function withConsentGate<T>(
  handler: (request: NextRequest, userId: string) => Promise<T>,
  options: ConsentGateOptions = {}
): (request: NextRequest) => Promise<T | NextResponse> {
  const requiredConsents = options.requiredConsents || ['disclaimer', 'age_verification']

  return async (request: NextRequest) => {
    // 사용자 ID 추출 (Authorization 헤더 또는 쿠키에서)
    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.replace('Bearer ', '')

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' } },
        { status: 401 }
      ) as T | NextResponse
    }

    // 토큰에서 사용자 정보 추출
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken)

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '유효하지 않은 토큰입니다.' } },
        { status: 401 }
      ) as T | NextResponse
    }

    // 동의 상태 확인
    const consentResult = await checkUserConsent(user.id, requiredConsents)

    if (!consentResult.hasConsent) {
      safeLogger.warn('[ConsentGate] Consent missing', {
        userId: user.id,
        missingConsents: consentResult.missingConsents,
      })

      if (consentResult.missingConsents.includes('age_verification')) {
        return createAgeVerificationRequiredResponse() as T | NextResponse
      }

      return createConsentRequiredResponse(consentResult.missingConsents) as T | NextResponse
    }

    // 동의 완료 - 원래 핸들러 실행
    return handler(request, user.id)
  }
}

// ============================================
// React Hook용 클라이언트 헬퍼
// ============================================

export interface ConsentClientHelpers {
  checkConsentStatus: (userId: string) => Promise<ConsentCheckResult>
  submitConsent: (
    userId: string,
    consentType: ConsentType,
    agreed: boolean,
    birthDate?: string
  ) => Promise<{ success: boolean; error?: string }>
}
