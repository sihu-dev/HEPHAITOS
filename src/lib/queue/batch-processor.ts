/**
 * Claude Batch API Processor
 *
 * 야간 대량 처리를 위한 Batch API 통합
 * - 50% 비용 절감
 * - 배치당 최대 10,000건 처리
 * - 대부분 1시간 이내 완료, 최대 24시간
 *
 * @see https://platform.claude.com/docs/en/build-with-claude/batch-processing
 */

import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '@/lib/supabase/client'
import type { MessageBatch } from '@anthropic-ai/sdk/resources/beta/messages/batches'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// ============================================================================
// Types
// ============================================================================

export interface BatchRequest {
  custom_id: string
  params: {
    model: string
    max_tokens: number
    messages: Array<{
      role: 'user' | 'assistant'
      content: string
    }>
    system?: string
  }
}

export interface BatchJob {
  id: string
  batch_id: string
  type: 'backtest' | 'market_analysis' | 'legal_check' | 'strategy_generation'
  status: 'processing' | 'ended' | 'expired' | 'failed'
  request_count: number
  created_at: string
  completed_at?: string
  results_url?: string
}

export interface BacktestBatchInput {
  strategy_id: string
  strategy_name: string
  strategy_config: Record<string, unknown>
  timeframe: string
  start_date: string
  end_date: string
}

export interface MarketAnalysisBatchInput {
  symbol: string
  market: 'KR' | 'US' | 'CRYPTO'
  data: {
    price: number
    volume: number
    change_percent: number
    indicators?: Record<string, number>
  }
}

// ============================================================================
// Batch Submission
// ============================================================================

/**
 * 백테스트 배치 제출
 *
 * @example
 * const batchId = await submitBacktestBatch([
 *   { strategy_id: '123', strategy_name: 'RSI Strategy', ... },
 *   { strategy_id: '124', strategy_name: 'MACD Strategy', ... }
 * ])
 */
export async function submitBacktestBatch(
  inputs: BacktestBatchInput[]
): Promise<string> {
  const requests: BatchRequest[] = inputs.map((input) => ({
    custom_id: `backtest-${input.strategy_id}-${Date.now()}`,
    params: {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: buildBacktestPrompt(input),
        },
      ],
    },
  }))

  const batch = await anthropic.beta.messages.batches.create({
    requests,
  })

  // Save batch job to database
  await saveBatchJob({
    batch_id: batch.id,
    type: 'backtest',
    status: 'processing',
    request_count: requests.length,
  })

  return batch.id
}

/**
 * 시장 분석 배치 제출
 *
 * @example
 * const batchId = await submitMarketAnalysisBatch([
 *   { symbol: 'AAPL', market: 'US', data: { price: 150, ... } },
 *   { symbol: 'TSLA', market: 'US', data: { price: 200, ... } }
 * ])
 */
export async function submitMarketAnalysisBatch(
  inputs: MarketAnalysisBatchInput[]
): Promise<string> {
  const requests: BatchRequest[] = inputs.map((input) => ({
    custom_id: `analysis-${input.symbol}-${Date.now()}`,
    params: {
      model: 'claude-opus-4-5-20251101',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: buildMarketAnalysisPrompt(input),
        },
      ],
    },
  }))

  const batch = await anthropic.beta.messages.batches.create({
    requests,
  })

  await saveBatchJob({
    batch_id: batch.id,
    type: 'market_analysis',
    status: 'processing',
    request_count: requests.length,
  })

  return batch.id
}

// ============================================================================
// Batch Results Retrieval
// ============================================================================

/**
 * 배치 결과 확인 (폴링)
 *
 * @returns null if still processing, results if completed
 */
export async function checkBatchResults(batchId: string) {
  const batch = await anthropic.beta.messages.batches.retrieve(batchId)

  if (batch.processing_status === 'ended') {
    // Update database
    await updateBatchJobStatus(batchId, 'ended', batch.results_url)

    // Download and parse results
    const results = await anthropic.beta.messages.batches.results(batchId)

    return {
      batch_id: batchId,
      status: 'completed',
      results: await parseResults(results),
    }
  }

  if (batch.processing_status === 'expired' || batch.processing_status === 'canceling') {
    await updateBatchJobStatus(batchId, 'failed')
    return {
      batch_id: batchId,
      status: 'failed',
      error: 'Batch expired or was canceled',
    }
  }

  // Still processing
  return null
}

/**
 * 모든 대기 중인 배치 확인
 */
export async function checkPendingBatches() {
  const { data: jobs } = await supabase
    .from('batch_jobs')
    .select('*')
    .eq('status', 'processing')

  if (!jobs) return []

  const results = []
  for (const job of jobs) {
    const result = await checkBatchResults(job.batch_id)
    if (result) {
      results.push(result)
    }
  }

  return results
}

// ============================================================================
// Prompt Builders
// ============================================================================

function buildBacktestPrompt(input: BacktestBatchInput): string {
  return `# 백테스트 분석 요청

전략: ${input.strategy_name}
기간: ${input.start_date} ~ ${input.end_date}
타임프레임: ${input.timeframe}

전략 설정:
${JSON.stringify(input.strategy_config, null, 2)}

다음 형식으로 백테스트 결과를 분석해주세요:

{
  "performance": {
    "total_return": number,
    "sharpe_ratio": number,
    "max_drawdown": number,
    "win_rate": number
  },
  "analysis": {
    "strengths": string[],
    "weaknesses": string[],
    "recommendations": string[]
  },
  "risk_assessment": "low" | "medium" | "high"
}

※ 법률 준수: "과거 성과는 미래를 보장하지 않습니다", "참고용" 표현 사용`
}

function buildMarketAnalysisPrompt(input: MarketAnalysisBatchInput): string {
  return `# 시장 분석 요청

종목: ${input.symbol} (${input.market})
현재가: $${input.data.price}
변동률: ${input.data.change_percent > 0 ? '+' : ''}${input.data.change_percent}%
거래량: ${input.data.volume}

${input.data.indicators ? `기술적 지표:\n${JSON.stringify(input.data.indicators, null, 2)}` : ''}

다음 형식으로 분석해주세요:

{
  "trend": "bullish" | "bearish" | "neutral",
  "support_levels": number[],
  "resistance_levels": number[],
  "key_insights": string[],
  "risk_factors": string[]
}

※ 법률 준수: "~할 수 있습니다", "참고용", 투자 권유 표현 금지`
}

// ============================================================================
// Database Operations
// ============================================================================

async function saveBatchJob(job: Omit<BatchJob, 'id' | 'created_at'>) {
  const { error } = await supabase.from('batch_jobs').insert({
    batch_id: job.batch_id,
    type: job.type,
    status: job.status,
    request_count: job.request_count,
    created_at: new Date().toISOString(),
  })

  if (error) {
    console.error('[BatchProcessor] Failed to save batch job:', error)
    throw error
  }
}

async function updateBatchJobStatus(
  batchId: string,
  status: 'ended' | 'failed',
  resultsUrl?: string
) {
  const { error } = await supabase
    .from('batch_jobs')
    .update({
      status,
      completed_at: new Date().toISOString(),
      results_url: resultsUrl,
    })
    .eq('batch_id', batchId)

  if (error) {
    console.error('[BatchProcessor] Failed to update batch job:', error)
  }
}

async function parseResults(results: AsyncIterable<unknown>) {
  const parsed = []

  for await (const result of results) {
    try {
      // Type assertion - results are message response objects
      const messageResult = result as {
        custom_id: string
        result: {
          type: 'succeeded' | 'errored'
          message?: {
            content: Array<{ type: string; text?: string }>
          }
          error?: { message: string }
        }
      }

      if (messageResult.result.type === 'succeeded' && messageResult.result.message) {
        const textContent = messageResult.result.message.content.find((c) => c.type === 'text')
        if (textContent && textContent.text) {
          parsed.push({
            custom_id: messageResult.custom_id,
            data: JSON.parse(textContent.text),
          })
        }
      } else if (messageResult.result.type === 'errored') {
        console.error(
          `[BatchProcessor] Request ${messageResult.custom_id} failed:`,
          messageResult.result.error
        )
      }
    } catch (err) {
      console.error('[BatchProcessor] Failed to parse result:', err)
    }
  }

  return parsed
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * 배치 비용 계산
 *
 * Batch API는 50% 할인 제공
 */
export function calculateBatchCost(requestCount: number, tokensPerRequest: number): {
  regular_cost: number
  batch_cost: number
  savings: number
  savings_percent: number
} {
  // Sonnet 4 가격: $3/MTok input, $15/MTok output
  const INPUT_COST = 3 / 1_000_000
  const OUTPUT_COST = 15 / 1_000_000

  const totalTokens = requestCount * tokensPerRequest
  const regularCost = totalTokens * (INPUT_COST + OUTPUT_COST)
  const batchCost = regularCost * 0.5 // 50% 할인

  return {
    regular_cost: regularCost,
    batch_cost: batchCost,
    savings: regularCost - batchCost,
    savings_percent: 50,
  }
}

/**
 * 배치 처리 시간 예측
 */
export function estimateBatchDuration(requestCount: number): {
  min_hours: number
  max_hours: number
  expected_hours: number
} {
  // 대부분 1시간 이내, 최대 24시간
  return {
    min_hours: 0.25,
    max_hours: 24,
    expected_hours: requestCount < 100 ? 0.5 : requestCount < 1000 ? 1 : 2,
  }
}
