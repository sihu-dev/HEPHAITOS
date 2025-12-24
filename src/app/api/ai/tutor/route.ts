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

    try {
      // Claude API로 튜터 응답 생성
      const systemPrompt = `당신은 HEPHAITOS의 AI 투자 교육 튜터입니다.

역할:
- 투자와 트레이딩에 관한 교육적 질문에 답변
- 기술적 분석, 지표, 전략 개념을 설명
- 시장 구조와 메커니즘을 이해하기 쉽게 설명

중요 지침:
1. 절대로 특정 종목 매수/매도를 권유하지 않습니다
2. "~하세요"와 같은 권유형 표현을 사용하지 않습니다
3. 교육 목적의 객관적인 설명만 제공합니다
4. 과거 성과가 미래를 보장하지 않음을 명시합니다

${context ? `사용자 컨텍스트: ${context}` : ''}

한국어로 친절하게 답변해주세요.`

      const { callClaude } = await import('@/lib/ai/claude-client')
      const { LegalCompliance } = await import('@/lib/agent/legal-compliance')

      const aiResponse = await callClaude(question, {
        systemPrompt,
        maxTokens: 1024,
      })

      // 법률 준수 검증
      const legalCheck = LegalCompliance.validateAIResponse(aiResponse)

      // 응답에 면책조항 추가
      const safeResponse = LegalCompliance.addDisclaimer(aiResponse, {
        type: 'response',
        includeRiskWarning: false,
      })

      const answer = {
        question,
        response: safeResponse,
        sources: [],
        warnings: legalCheck.warnings,
      }

      safeLogger.info('[Tutor API] Answer generated', {
        userId,
        questionLength: question.length,
        responseLength: aiResponse.length,
      })

      return createApiResponse({
        answer,
      })
    } catch (error) {
      safeLogger.error('[Tutor API] AI generation failed', { error })
      return createApiResponse(
        { error: 'AI 응답 생성 중 오류가 발생했습니다' },
        { status: 500 }
      )
    }
  },
  {
    rateLimit: { category: 'write' },
    errorHandler: { logErrors: true },
  }
)
