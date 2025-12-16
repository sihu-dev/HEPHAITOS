// ============================================
// AI API 호출 래퍼 (자동 비용 추적)
// Loop 11: Observability
// ============================================

import { trackAIUsage, type FeatureName, type ModelName } from './cost-tracking'

/**
 * AI 호출 옵션
 */
export interface AICallOptions {
  userId: string
  feature: FeatureName
  model: ModelName
  prompt: string
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
}

/**
 * AI 호출 결과
 */
export interface AICallResult {
  content: string
  tokensInput: number
  tokensOutput: number
  latencyMs: number
  costKRW: number
}

/**
 * Claude API 호출 (Anthropic SDK)
 */
export async function callClaudeWithTracking(
  options: AICallOptions
): Promise<AICallResult> {
  const startTime = Date.now()
  const { userId, feature, model, prompt, systemPrompt, temperature = 0.7, maxTokens = 4096 } = options

  try {
    const { Anthropic } = await import('@anthropic-ai/sdk')
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

    const response = await anthropic.messages.create({
      model: model.startsWith('claude-') ? model : 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    })

    const latencyMs = Date.now() - startTime
    const tokensInput = response.usage.input_tokens
    const tokensOutput = response.usage.output_tokens
    const content = response.content[0].type === 'text' ? response.content[0].text : ''

    // 비용 추적
    await trackAIUsage({
      userId,
      feature,
      model,
      tokensInput,
      tokensOutput,
      latencyMs,
      success: true,
    })

    const { calculateAICost } = await import('./cost-tracking')
    const costKRW = calculateAICost(model, tokensInput, tokensOutput)

    return {
      content,
      tokensInput,
      tokensOutput,
      latencyMs,
      costKRW,
    }
  } catch (error) {
    const latencyMs = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // 실패 이벤트 추적
    await trackAIUsage({
      userId,
      feature,
      model,
      tokensInput: 0,
      tokensOutput: 0,
      latencyMs,
      success: false,
      errorMessage,
    })

    throw error
  }
}

/**
 * OpenAI API 호출
 * Note: OpenAI SDK가 설치되어 있어야 사용 가능합니다 (npm install openai)
 */
export async function callOpenAIWithTracking(
  options: AICallOptions
): Promise<AICallResult> {
  const startTime = Date.now()
  const { userId, feature, model, prompt, systemPrompt, temperature = 0.7, maxTokens = 4096 } = options

  try {
    // OpenAI SDK 동적 import (선택적 의존성)
    let OpenAI: any
    try {
      const module = await import('openai')
      OpenAI = module.OpenAI
    } catch (e) {
      throw new Error('OpenAI SDK가 설치되지 않았습니다. npm install openai 를 실행하세요.')
    }
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.')
    }

    const response = await openai.chat.completions.create({
      model: model.startsWith('gpt-') ? model : 'gpt-4-turbo',
      messages: [
        ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
        { role: 'user' as const, content: prompt },
      ],
      temperature,
      max_tokens: maxTokens,
    })

    const latencyMs = Date.now() - startTime
    const tokensInput = response.usage?.prompt_tokens || 0
    const tokensOutput = response.usage?.completion_tokens || 0
    const content = response.choices[0]?.message?.content || ''

    // 비용 추적
    await trackAIUsage({
      userId,
      feature,
      model,
      tokensInput,
      tokensOutput,
      latencyMs,
      success: true,
    })

    const { calculateAICost } = await import('./cost-tracking')
    const costKRW = calculateAICost(model, tokensInput, tokensOutput)

    return {
      content,
      tokensInput,
      tokensOutput,
      latencyMs,
      costKRW,
    }
  } catch (error) {
    const latencyMs = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    await trackAIUsage({
      userId,
      feature,
      model,
      tokensInput: 0,
      tokensOutput: 0,
      latencyMs,
      success: false,
      errorMessage,
    })

    throw error
  }
}

/**
 * 사용 예시
 */
export async function exampleUsage() {
  const result = await callClaudeWithTracking({
    userId: 'user_123',
    feature: 'strategy-generation',
    model: 'claude-sonnet-4',
    prompt: 'RSI 30 이하일 때 매수하는 전략을 만들어줘',
    systemPrompt: '너는 트레이딩 전략 전문가야.',
  })

  console.log('Generated strategy:', result.content)
  console.log('Cost:', result.costKRW, 'KRW')
  console.log('Latency:', result.latencyMs, 'ms')
}
