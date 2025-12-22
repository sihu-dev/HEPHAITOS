// ============================================
// AI Tutor API
// POST: 트레이딩 교육 AI 튜터 질문/답변
// Claude API 연동 + 비용 추적
// ============================================

import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { withApiMiddleware, createApiResponse, validateRequestBody } from '@/lib/api/middleware'
import { tutorQuestionSchema } from '@/lib/validations/ai'
import { safeLogger } from '@/lib/utils/safe-logger'
import { spendCredits, InsufficientCreditsError } from '@/lib/credits/spend-helper'
import { callClaudeWithTracking } from '@/lib/ai/tracked-ai-call'

// ============================================
// AI Tutor System Prompt
// CRITICAL: 투자 조언 금지, 교육 목적만
// ============================================

const AI_TUTOR_SYSTEM_PROMPT = `당신은 HEPHAITOS의 AI 트레이딩 튜터입니다. 투자 교육과 시장 분석 개념을 가르치는 역할입니다.

## 핵심 원칙 (CRITICAL - 반드시 준수)

1. **투자 조언 절대 금지**
   - "~하세요", "~를 추천합니다" 같은 권유형 표현 금지
   - 구체적인 종목 매수/매도 추천 금지
   - "수익 보장", "확실한 수익" 표현 금지

2. **교육적 접근**
   - "~할 수 있습니다", "~하는 방법이 있습니다" 설명형 사용
   - 개념과 원리 중심으로 설명
   - 다양한 관점 제시

3. **면책 조항 포함**
   - 필요시 "과거 성과는 미래를 보장하지 않습니다" 언급
   - "투자 결정은 본인의 책임입니다" 상기

## 전문 영역

1. **기술적 분석**: 차트 패턴, 기술지표 (RSI, MACD, 볼린저밴드 등)
2. **기본적 분석**: 재무제표, 밸류에이션, 산업 분석
3. **리스크 관리**: 포지션 사이징, 손절, 분산투자
4. **트레이딩 심리**: 감정 관리, 편향 인식
5. **시장 구조**: 거래소, 주문 유형, 시장 메커니즘
6. **전략 설계**: 백테스팅 개념, 전략 평가 지표 (샤프 비율, MDD 등)

## 응답 형식

- 한국어로 응답
- 마크다운 형식 사용
- 복잡한 개념은 예시와 함께 설명
- 핵심 포인트는 **강조** 표시
- 관련 추가 학습 키워드 제안

## 답변 불가 영역

- 구체적 종목 추천
- 매수/매도 타이밍 조언
- 특정 가격 예측
- 수익률 보장 언급`

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

    // Claude API 호출
    try {
      // 컨텍스트가 있으면 대화 이력 포함
      const fullPrompt = context
        ? `이전 대화 컨텍스트:\n${context}\n\n새로운 질문:\n${question}`
        : question

      const result = await callClaudeWithTracking({
        userId,
        feature: 'ai-tutor',
        model: 'claude-sonnet-4',
        prompt: fullPrompt,
        systemPrompt: AI_TUTOR_SYSTEM_PROMPT,
        temperature: 0.7,
        maxTokens: 2048,
      })

      safeLogger.info('[Tutor API] Answer generated', {
        userId,
        tokensInput: result.tokensInput,
        tokensOutput: result.tokensOutput,
        latencyMs: result.latencyMs,
        costKRW: result.costKRW,
      })

      // 관련 키워드 추출 (응답 마지막에서)
      const suggestedTopics = extractSuggestedTopics(result.content)

      return createApiResponse({
        success: true,
        answer: {
          question,
          response: result.content,
          suggestedTopics,
          metadata: {
            tokensUsed: result.tokensInput + result.tokensOutput,
            latencyMs: result.latencyMs,
          },
        },
      })
    } catch (error) {
      safeLogger.error('[Tutor API] Claude API call failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      })

      // API 키 누락 체크
      if (!process.env.ANTHROPIC_API_KEY) {
        return createApiResponse(
          { error: 'AI 서비스 설정이 필요합니다. 관리자에게 문의하세요.' },
          { status: 503 }
        )
      }

      return createApiResponse(
        { error: 'AI 응답 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 500 }
      )
    }
  },
  {
    rateLimit: { category: 'write' },
    errorHandler: { logErrors: true },
  }
)

// ============================================
// Helper Functions
// ============================================

/**
 * AI 응답에서 추천 학습 키워드 추출
 */
function extractSuggestedTopics(content: string): string[] {
  // 마크다운의 키워드 섹션에서 추출 시도
  const keywordPatterns = [
    /추가 학습 키워드[:\s]*([^\n]+)/i,
    /관련 키워드[:\s]*([^\n]+)/i,
    /더 알아보기[:\s]*([^\n]+)/i,
  ]

  for (const pattern of keywordPatterns) {
    const match = content.match(pattern)
    if (match?.[1]) {
      return match[1]
        .split(/[,、·]/)
        .map(topic => topic.trim())
        .filter(topic => topic.length > 0 && topic.length < 30)
        .slice(0, 5)
    }
  }

  // 기본 키워드 반환
  return []
}
