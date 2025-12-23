// ============================================
// AI 비용 추적 라이브러리
// Loop 11: Observability
// ============================================

/**
 * AI 모델별 비용 (USD per 1K tokens)
 * 출처: 각 제공사 공식 가격표
 */
export const MODEL_COSTS = {
  // OpenAI
  'gpt-4-turbo': { input: 10, output: 30 },
  'gpt-4': { input: 30, output: 60 },
  'gpt-3.5-turbo': { input: 0.5, output: 1.5 },

  // Anthropic
  'claude-opus-4': { input: 15, output: 75 },
  'claude-sonnet-4': { input: 3, output: 15 },
  'claude-sonnet-3.5': { input: 3, output: 15 },
  'claude-haiku-3': { input: 0.25, output: 1.25 },

  // Google
  'gemini-pro': { input: 0.5, output: 1.5 },
  'gemini-ultra': { input: 10, output: 30 },
} as const

export type ModelName = keyof typeof MODEL_COSTS

/**
 * USD → KRW 환율 (기본값: 1300)
 */
const USD_TO_KRW = 1300

/**
 * AI 모델 호출 비용 계산
 * @param model - 모델명
 * @param tokensInput - 입력 토큰 수
 * @param tokensOutput - 출력 토큰 수
 * @returns 비용 (KRW)
 */
export function calculateAICost(
  model: ModelName,
  tokensInput: number,
  tokensOutput: number
): number {
  const costs = MODEL_COSTS[model]

  if (!costs) {
    safeLogger.warn(`[Cost Tracking] Unknown model: ${model}, using default cost`)
    return 0
  }

  const inputCostUSD = (costs.input * tokensInput) / 1000
  const outputCostUSD = (costs.output * tokensOutput) / 1000
  const totalCostUSD = inputCostUSD + outputCostUSD

  return Math.round(totalCostUSD * USD_TO_KRW * 100) / 100 // 소수점 2자리
}

/**
 * 기능별 예상 크레딧 원가 (고정 비용)
 */
export const FEATURE_CREDIT_COSTS = {
  'strategy-generation': 10,
  'backtest': 3,
  'ai-tutor': 1,
  'live-coaching': 20,
  'portfolio-analysis': 5,
} as const

export type FeatureName = keyof typeof FEATURE_CREDIT_COSTS

/**
 * 크레딧당 KRW 환산 (평균)
 * 스타터: ₩9,900 / 100 = ₩99/크레딧
 * 베이직: ₩39,000 / 500 = ₩78/크레딧
 * 프로: ₩69,000 / 1,000 = ₩69/크레딧
 * → 가중평균: ₩82/크레딧
 */
const KRW_PER_CREDIT = 82

/**
 * 기능별 크레딧 원가 계산
 * @param feature - 기능명
 * @returns 원가 (KRW)
 */
export function calculateFeatureCreditCost(feature: FeatureName): number {
  const credits = FEATURE_CREDIT_COSTS[feature]
  return credits * KRW_PER_CREDIT
}

/**
 * AI 사용량 이벤트 타입
 */
export interface AIUsageEvent {
  userId: string
  feature: FeatureName
  model: ModelName
  tokensInput: number
  tokensOutput: number
  latencyMs: number
  success: boolean
  errorMessage?: string
}

/**
 * AI 사용량 이벤트를 Supabase에 기록
 * @param event - AI 사용량 이벤트
 */
export async function trackAIUsage(event: AIUsageEvent): Promise<void> {
  const { createClient } = await import('@supabase/supabase-js')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const costEstimateKRW = calculateAICost(
    event.model,
    event.tokensInput,
    event.tokensOutput
  )

  const { error } = await supabase.from('ai_usage_events').insert({
    user_id: event.userId,
    feature: event.feature,
    model_used: event.model,
    tokens_input: event.tokensInput,
    tokens_output: event.tokensOutput,
    latency_ms: event.latencyMs,
    cost_estimate_krw: costEstimateKRW,
    success: event.success,
    error_message: event.errorMessage,
  })

  if (error) {
    safeLogger.error('[AI Usage Tracking] Failed to insert event:', error)
  }
}

/**
 * 비용 마진 계산
 * @param feature - 기능명
 * @param actualCostKRW - 실제 API 비용 (KRW)
 * @returns 마진 정보
 */
export function calculateMargin(feature: FeatureName, actualCostKRW: number) {
  const revenueKRW = calculateFeatureCreditCost(feature)
  const marginKRW = revenueKRW - actualCostKRW
  const marginPct = (marginKRW / revenueKRW) * 100

  return {
    revenue: revenueKRW,
    cost: actualCostKRW,
    margin: marginKRW,
    marginPct: Math.round(marginPct * 100) / 100,
  }
}

/**
 * 사용 예시
 */
export async function exampleTrackAIUsage() {
  await trackAIUsage({
    userId: 'user_123',
    feature: 'strategy-generation',
    model: 'claude-sonnet-4',
    tokensInput: 2000,
    tokensOutput: 1500,
    latencyMs: 3500,
    success: true,
  })

  // 비용: (3 * 2000 / 1000) + (15 * 1500 / 1000) = 6 + 22.5 = 28.5 USD
  // KRW: 28.5 * 1300 = ₩37,050
  // 크레딧 수익: 10 크레딧 × ₩82 = ₩820
  // 마진: ₩820 - ₩37,050 = -₩36,230 (⚠️ 적자!)
}
