// ============================================
// Tutor API
// POST: 튜터 질문/답변
// Zod Validation + Error Handling 표준화 적용
// GPT V1 피드백: 실제 사용자 인증 적용
// ============================================

import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { withApiMiddleware, createApiResponse, validateRequestBody } from '@/lib/api/middleware'
import { tutorQuestionSchema } from '@/lib/validations/ai'
import { safeLogger } from '@/lib/utils/safe-logger'
import { spendCredits, InsufficientCreditsError } from '@/lib/credits/spend-helper'

export const POST = withApiMiddleware(
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

    const userId = user.id

    const validation = await validateRequestBody(request, tutorQuestionSchema)
    if ('error' in validation) return validation.error

    const { question, context } = validation.data

    safeLogger.info('[Tutor API] Processing question', {
      userId,
      questionLength: question.length,
      hasContext: !!context,
    })

    // P-1 CRITICAL: 크레딧 소비 (1 크레딧)
    try {
      await spendCredits({
        userId,
        feature: 'ai_tutor',
        amount: 1,
        metadata: {
          questionLength: question.length,
          hasContext: !!context,
        },
      })
    } catch (error) {
      if (error instanceof InsufficientCreditsError) {
        safeLogger.warn('[Tutor API] Insufficient credits', {
          userId,
          required: error.required,
          current: error.current,
        })
        return createApiResponse(
          {
            error: 'INSUFFICIENT_CREDITS',
            message: '크레딧이 부족합니다',
            required: error.required,
            current: error.current,
          },
          { status: 402 }
        )
      }
      safeLogger.error('[Tutor API] Credit spend failed', { error })
      return createApiResponse(
        { error: '크레딧 처리 중 오류가 발생했습니다' },
        { status: 500 }
      )
    }

    // TODO: 실제 튜터 로직 구현
    // 현재는 플레이스홀더 응답
    const answer = {
      question,
      response: '이 기능은 현재 개발 중입니다. 곧 데이터 기반 투자 교육 기능을 제공할 예정입니다.',
      sources: [],
    }

    safeLogger.info('[Tutor API] Answer generated')

    return createApiResponse({
      message: '튜터 기능 준비 중입니다',
      answer,
    })
  },
  {
    rateLimit: { category: 'write' },
    errorHandler: { logErrors: true },
  }
)
