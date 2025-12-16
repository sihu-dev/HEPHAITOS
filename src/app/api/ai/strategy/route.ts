// ============================================
// Strategy Generator API Route
// 데이터 기반 전략 생성 (Claude 연동)
// Zod Validation + Error Handling 표준화 적용
// GPT V1 피드백: Consent Gate + Circuit Breaker + Tiered Rate Limit 통합
// ============================================

import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClaudeClient, TRADING_PROMPTS } from '@/lib/ai/claude-client'
import { withApiMiddleware, createApiResponse, validateRequestBody } from '@/lib/api/middleware'
import { aiStrategyConfigSchema } from '@/lib/validations/strategy'
import { safeLogger } from '@/lib/utils/safe-logger'
import { applySafetyNet } from '@/lib/safety/safety-net-v2'
import { spendCredits, InsufficientCreditsError } from '@/lib/credits/spend-helper'
import { checkUserConsent, createConsentRequiredResponse } from '@/lib/compliance/consent-gate'
import { aiCircuit, withCircuitBreaker, createCircuitOpenResponse } from '@/lib/redis/circuit-breaker'
import { aiTieredLimiter, createTieredRateLimitResponse, type UserTier } from '@/lib/redis/rate-limiter'

export const dynamic = 'force-dynamic'

const USE_CLAUDE = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY

// ============================================
// Types
// ============================================

interface StrategyConfig {
  name: string
  riskLevel: 'conservative' | 'moderate' | 'aggressive'
  investmentGoal: 'growth' | 'income' | 'balanced' | 'preservation'
  timeHorizon: 'short' | 'medium' | 'long'
  preferredSectors: string[]
  excludedSectors: string[]
  maxPositionSize: number
  stopLossPercent: number
  takeProfitPercent: number
}

interface GeneratedStrategy {
  id: string
  name: string
  description: string
  signals: {
    type: 'entry' | 'exit'
    condition: string
    indicator: string
    value: string
  }[]
  backtestResult: {
    totalReturn: number
    sharpeRatio: number
    maxDrawdown: number
    winRate: number
    totalTrades: number
  }
  aiInsights: string
  createdAt: Date
}

// ============================================
// Claude Strategy Generation
// ============================================

async function generateStrategyWithClaude(config: StrategyConfig): Promise<GeneratedStrategy> {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY
  if (!apiKey) throw new Error('Claude API key not configured')

  const client = createClaudeClient({ apiKey, temperature: 0.5 })

  const prompt = `${TRADING_PROMPTS.STRATEGY_GENERATION}

사용자 설정:
- 전략명: ${config.name || '자동 생성'}
- 리스크 수준: ${config.riskLevel === 'conservative' ? '보수적' : config.riskLevel === 'aggressive' ? '공격적' : '중립적'}
- 투자 목표: ${config.investmentGoal === 'growth' ? '성장' : config.investmentGoal === 'income' ? '수익' : config.investmentGoal === 'preservation' ? '자본 보존' : '균형'}
- 투자 기간: ${config.timeHorizon === 'short' ? '단기 (1-3개월)' : config.timeHorizon === 'long' ? '장기 (1년+)' : '중기 (3-12개월)'}
- 선호 섹터: ${config.preferredSectors.length > 0 ? config.preferredSectors.join(', ') : '전체'}
- 제외 섹터: ${config.excludedSectors.length > 0 ? config.excludedSectors.join(', ') : '없음'}
- 최대 포지션: ${config.maxPositionSize}%
- 손절: ${config.stopLossPercent}%
- 익절: ${config.takeProfitPercent}%

위 조건에 맞는 트레이딩 전략을 JSON 형식으로 생성해주세요. 백테스트 결과도 예상치로 포함해주세요.

결과 JSON 형식:
{
  "name": "전략명",
  "description": "전략 설명 (2-3문장)",
  "signals": [
    { "type": "entry", "indicator": "지표명", "condition": "조건", "value": "값" }
  ],
  "backtestResult": {
    "totalReturn": 예상수익률,
    "sharpeRatio": 샤프비율,
    "maxDrawdown": 최대낙폭(음수),
    "winRate": 승률,
    "totalTrades": 예상거래수
  },
  "aiInsights": "전략 분석 인사이트 (3-4문장)"
}`

  const response = await client.chat([{ role: 'user', content: prompt }], {
    systemPrompt: '당신은 퀀트 전략 전문가입니다. 사용자의 조건에 맞는 최적의 트레이딩 전략을 생성합니다. 반드시 유효한 JSON만 응답하세요.',
    temperature: 0.5,
    maxTokens: 2048,
  })

  try {
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        id: `strategy_${Date.now()}`,
        name: parsed.name || config.name || '전략',
        description: parsed.description || '',
        signals: parsed.signals || [],
        backtestResult: parsed.backtestResult || {
          totalReturn: 20,
          sharpeRatio: 1.5,
          maxDrawdown: -15,
          winRate: 55,
          totalTrades: 50,
        },
        aiInsights: parsed.aiInsights || response,
        createdAt: new Date(),
      }
    }
  } catch (parseError) {
    console.error('[Claude] JSON parse error:', parseError)
  }

  // Fallback to mock if parsing fails
  return generateStrategyMock(config)
}

// ============================================
// Mock Strategy Generation (Fallback)
// ============================================

function generateStrategyMock(config: StrategyConfig): GeneratedStrategy {
  const id = `strategy_${Date.now()}`

  // Risk-based parameters
  const riskParams = {
    conservative: { multiplier: 0.6, sharpe: 1.8, drawdown: -8, winRate: 68, trades: 45 },
    moderate: { multiplier: 1.0, sharpe: 1.5, drawdown: -15, winRate: 58, trades: 78 },
    aggressive: { multiplier: 1.6, sharpe: 1.2, drawdown: -25, winRate: 52, trades: 124 },
  }

  const params = riskParams[config.riskLevel]
  const baseReturn = config.investmentGoal === 'growth' ? 35 : config.investmentGoal === 'income' ? 15 : 25

  // Generate signals based on config
  const signals = [
    {
      type: 'entry' as const,
      indicator: 'RSI(14)',
      condition: '<',
      value: config.riskLevel === 'aggressive' ? '25' : config.riskLevel === 'conservative' ? '35' : '30',
    },
    {
      type: 'entry' as const,
      indicator: 'MACD',
      condition: 'Golden Cross',
      value: 'Signal',
    },
    {
      type: 'exit' as const,
      indicator: 'RSI(14)',
      condition: '>',
      value: config.riskLevel === 'aggressive' ? '75' : config.riskLevel === 'conservative' ? '65' : '70',
    },
    {
      type: 'exit' as const,
      indicator: 'Stop Loss',
      condition: '-',
      value: `${config.stopLossPercent}%`,
    },
    {
      type: 'exit' as const,
      indicator: 'Take Profit',
      condition: '+',
      value: `${config.takeProfitPercent}%`,
    },
  ]

  // Time horizon adjustments
  const timeMultiplier = config.timeHorizon === 'short' ? 0.8 : config.timeHorizon === 'long' ? 1.3 : 1.0

  // Sector focus description
  const sectorText = config.preferredSectors.length > 0
    ? `${config.preferredSectors.join(', ')} 섹터를 중심으로`
    : '전체 시장을 대상으로'

  const riskText = config.riskLevel === 'conservative'
    ? '보수적인 손절 라인으로 자본 보존을 우선시합니다.'
    : config.riskLevel === 'aggressive'
    ? '높은 리스크를 감수하며 수익 극대화를 추구합니다.'
    : '리스크와 수익의 균형을 추구합니다.'

  return {
    id,
    name: config.name || '자동 생성 전략',
    description: `${config.riskLevel === 'conservative' ? '보수적' : config.riskLevel === 'aggressive' ? '공격적' : '중립적'} 리스크 수준의 ${
      config.investmentGoal === 'growth' ? '성장' : config.investmentGoal === 'income' ? '수익' : '균형'
    } 지향 전략`,
    signals,
    backtestResult: {
      totalReturn: Math.round(baseReturn * params.multiplier * timeMultiplier * 10) / 10,
      sharpeRatio: params.sharpe,
      maxDrawdown: params.drawdown,
      winRate: params.winRate,
      totalTrades: params.trades,
    },
    aiInsights: `이 전략은 ${sectorText} 기술적 지표를 활용합니다. RSI와 MACD의 조합으로 과매도 구간에서 진입하고, 과매수 구간에서 청산하는 역발상 전략입니다. ${riskText} ${config.timeHorizon === 'short' ? '단기 변동성을 활용하여 빠른 수익 실현을 목표로 합니다.' : config.timeHorizon === 'long' ? '장기 추세를 따라가며 복리 효과를 극대화합니다.' : '중기 트렌드에 맞춰 안정적인 수익을 추구합니다.'}`,
    createdAt: new Date(),
  }
}

// ============================================
// API Handlers
// ============================================

/**
 * POST /api/ai/strategy
 * Generate data-based trading strategy
 */
export const POST = withApiMiddleware(
  async (request: NextRequest) => {
    // 1. 사용자 인증
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
      safeLogger.warn('[Strategy API] Unauthorized access attempt')
      return createApiResponse(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    const userId = user.id

    // 2. Consent Gate (P0-4: 만 19세 + 면책 동의)
    const consentResult = await checkUserConsent(userId, ['disclaimer', 'age_verification'])
    if (!consentResult.hasConsent) {
      safeLogger.warn('[Strategy API] Consent required', {
        userId,
        missingConsents: consentResult.missingConsents,
      })
      return createConsentRequiredResponse(consentResult.missingConsents)
    }

    // 3. Circuit Breaker (P0-3)
    const circuitAllowed = await aiCircuit.isAllowed('claude-api')
    if (!circuitAllowed) {
      safeLogger.warn('[Strategy API] Circuit breaker open')
      return createCircuitOpenResponse()
    }

    // 4. Tiered Rate Limit (P0-3: 일당 + 분당 제한)
    // TODO: 사용자 tier 정보를 프로필에서 조회 (현재는 free로 기본 설정)
    const userTier: UserTier = 'free'
    const rateLimitResult = await aiTieredLimiter.check(userId, userTier)
    if (!rateLimitResult.allowed) {
      safeLogger.warn('[Strategy API] Rate limited', {
        userId,
        limitType: rateLimitResult.limitType,
      })
      return createTieredRateLimitResponse(rateLimitResult)
    }

    const validation = await validateRequestBody(request, aiStrategyConfigSchema)
    if ('error' in validation) return validation.error

    const config = validation.data

    safeLogger.info('[Strategy API] Generating strategy', {
      userId,
      riskLevel: config.riskLevel,
      investmentGoal: config.investmentGoal,
      timeHorizon: config.timeHorizon,
    })

    // P-1 CRITICAL: 크레딧 소비 (10 크레딧)
    try {
      await spendCredits({
        userId,
        feature: 'ai_strategy',
        amount: 10,
        metadata: {
          riskLevel: config.riskLevel,
          investmentGoal: config.investmentGoal,
          timeHorizon: config.timeHorizon,
        },
      })
    } catch (error) {
      if (error instanceof InsufficientCreditsError) {
        safeLogger.warn('[Strategy API] Insufficient credits', {
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
      // 기타 크레딧 에러는 500으로 처리
      safeLogger.error('[Strategy API] Credit spend failed', { error })
      return createApiResponse(
        { error: '크레딧 처리 중 오류가 발생했습니다' },
        { status: 500 }
      )
    }

    let strategy: GeneratedStrategy

    // Use Claude if API key is available, otherwise fallback to mock
    if (USE_CLAUDE) {
      safeLogger.debug('[Strategy API] Using Claude')
      try {
        // Circuit Breaker로 Claude 호출 감싸기
        strategy = await withCircuitBreaker(aiCircuit, 'claude-api', async () => {
          return generateStrategyWithClaude(config)
        })
      } catch (claudeError) {
        if (claudeError instanceof Error && claudeError.message === 'CIRCUIT_OPEN') {
          return createCircuitOpenResponse()
        }
        safeLogger.warn('[Strategy API] Claude failed, falling back to mock', { error: claudeError })
        // Claude 실패 시 Circuit Breaker에 기록됨
        strategy = generateStrategyMock(config)
      }
    } else {
      // Simulate processing delay for mock
      await new Promise((resolve) => setTimeout(resolve, 1500))
      strategy = generateStrategyMock(config)
    }

    // P0-8: Safety Net v2 적용
    try {
      // 전략 이름 검사
      const nameCheck = await applySafetyNet({
        content: strategy.name,
        section: 'title',
        feature: 'strategy_generate',
        userId,
      })
      strategy.name = nameCheck.content

      // 전략 인사이트 검사
      const insightsCheck = await applySafetyNet({
        content: strategy.aiInsights,
        section: 'summary',
        feature: 'strategy_generate',
        userId,
      })
      strategy.aiInsights = insightsCheck.content

      safeLogger.info('[Strategy API] Safety Net applied', {
        nameChanged: nameCheck.decision !== 'allow',
        insightsChanged: insightsCheck.decision !== 'allow',
      })
    } catch (safetyError) {
      // Safety Net에서 block된 경우
      if (safetyError instanceof Error && safetyError.message.startsWith('SAFETY_BLOCK')) {
        safeLogger.error('[Strategy API] Content blocked by Safety Net', { error: safetyError })
        return createApiResponse(
          { error: '생성된 전략이 법률 준수 기준을 충족하지 못했습니다. 다시 시도해주세요.' },
          { status: 400 }
        )
      }
      // 기타 에러는 로그만 남기고 계속 진행
      safeLogger.error('[Strategy API] Safety Net error', { error: safetyError })
    }

    safeLogger.info('[Strategy API] Strategy generated', {
      strategyId: strategy.id,
      usedClaude: !!USE_CLAUDE,
    })

    return createApiResponse({
      strategy,
      usedClaude: !!USE_CLAUDE,
    })
  },
  {
    rateLimit: { category: 'write' },
    errorHandler: { logErrors: true },
  }
)

/**
 * GET /api/ai/strategy
 * Get user's generated strategies
 */
export const GET = withApiMiddleware(
  async (_request: NextRequest) => {
    safeLogger.info('[Strategy API] Fetching user strategies')

    // Mock recent strategies
    const recentStrategies = [
      {
        id: 'strategy_1',
        name: '모멘텀 스윙',
        totalReturn: 32.5,
        trades: 45,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'strategy_2',
        name: '배당 성장',
        totalReturn: 18.2,
        trades: 12,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'strategy_3',
        name: '테크 섹터 포커스',
        totalReturn: 48.7,
        trades: 67,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    ]

    safeLogger.info('[Strategy API] Strategies fetched', { count: recentStrategies.length })

    return createApiResponse({ strategies: recentStrategies })
  },
  {
    rateLimit: { category: 'api' },
    errorHandler: { logErrors: true },
  }
)
