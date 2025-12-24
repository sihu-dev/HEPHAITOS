// ============================================
// Strategy Generation API
// POST: AI로 트레이딩 전략 생성
// Zod Validation + Error Handling 표준화 적용
// ============================================

import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { withApiMiddleware, createApiResponse, validateRequestBody } from '@/lib/api/middleware'
import { safeLogger } from '@/lib/utils/safe-logger'
import { spendCredits, InsufficientCreditsError, CREDIT_COSTS } from '@/lib/credits/spend-helper'
import { callClaude, TRADING_PROMPTS } from '@/lib/ai/claude-client'
import { LegalCompliance } from '@/lib/agent/legal-compliance'
import { generateId } from '@/lib/utils'
import { z } from 'zod'

const generateStrategySchema = z.object({
  prompt: z.string().min(10).max(1000),
  type: z.enum(['momentum', 'value', 'trend', 'custom']).optional(),
})

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

    const validation = await validateRequestBody(request, generateStrategySchema)
    if ('error' in validation) return validation.error

    const { prompt, type } = validation.data

    // 법률 준수 검증
    const legalCheck = LegalCompliance.validateStrategyPrompt(prompt)
    if (!legalCheck.safe) {
      safeLogger.warn('[Generate Strategy API] Legal compliance failed', {
        userId,
        blockers: legalCheck.blockers,
      })
      return createApiResponse(
        {
          error: 'LEGAL_COMPLIANCE_ERROR',
          message: '입력에 허용되지 않는 표현이 포함되어 있습니다.',
          blockers: legalCheck.blockers,
        },
        { status: 400 }
      )
    }

    safeLogger.info('[Generate Strategy API] Generating strategy', {
      userId,
      promptLength: prompt.length,
      type,
    })

    // 크레딧 소비 (10 크레딧)
    try {
      await spendCredits({
        userId,
        feature: 'ai_strategy',
        amount: CREDIT_COSTS.ai_strategy,
        metadata: {
          promptLength: prompt.length,
          type,
        },
      })
    } catch (error) {
      if (error instanceof InsufficientCreditsError) {
        safeLogger.warn('[Generate Strategy API] Insufficient credits', {
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
      safeLogger.error('[Generate Strategy API] Credit spend failed', { error })
      return createApiResponse(
        { error: '크레딧 처리 중 오류가 발생했습니다' },
        { status: 500 }
      )
    }

    try {
      // Claude API로 전략 생성
      const systemPrompt = `${TRADING_PROMPTS.STRATEGY_GENERATION}

추가 지침:
- 전략 유형 힌트: ${type || 'custom'}
- 반드시 JSON 형식으로만 응답
- 투자 조언이 아닌 교육 목적의 전략 설명 제공`

      const aiResponse = await callClaude(prompt, {
        systemPrompt,
        maxTokens: 2048,
      })

      // JSON 추출
      let strategyData
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          strategyData = JSON.parse(jsonMatch[0])
        }
      } catch {
        safeLogger.warn('[Generate Strategy API] JSON parsing failed, using fallback')
      }

      // 기본값 적용
      const strategy = {
        id: generateId('strat'),
        name: strategyData?.name || '자동 생성 전략',
        description: strategyData?.description || prompt,
        type: type || 'custom',
        symbols: strategyData?.symbols || ['BTC/USDT'],
        timeframe: strategyData?.timeframe || '1h',
        entryConditions: strategyData?.entryConditions || [],
        exitConditions: strategyData?.exitConditions || [],
        riskManagement: strategyData?.riskManagement || {
          stopLoss: 5,
          takeProfit: 10,
          maxPositionSize: 10,
        },
        status: 'draft',
        createdAt: new Date().toISOString(),
      }

      // 리스크 평가
      const riskAssessment = LegalCompliance.assessStrategyRisk({
        stopLoss: strategy.riskManagement.stopLoss,
        positionSize: strategy.riskManagement.maxPositionSize,
        indicators: strategy.entryConditions.map((c: { type?: string }) => c.type).filter(Boolean),
      })

      // AI 응답 검증 및 면책조항 추가
      const explanation = LegalCompliance.addDisclaimer(
        `전략 "${strategy.name}"이 생성되었습니다.\n\n${strategy.description}`,
        { type: 'strategy', includeRiskWarning: riskAssessment.level !== 'low' }
      )

      safeLogger.info('[Generate Strategy API] Strategy generated', {
        strategyId: strategy.id,
        riskLevel: riskAssessment.level,
      })

      return createApiResponse({
        strategy,
        explanation,
        riskAssessment,
        warnings: legalCheck.warnings,
      })
    } catch (error) {
      safeLogger.error('[Generate Strategy API] AI generation failed', { error })
      return createApiResponse(
        { error: 'AI 전략 생성 중 오류가 발생했습니다' },
        { status: 500 }
      )
    }
  },
  {
    rateLimit: { category: 'write' },
    errorHandler: { logErrors: true },
  }
)
