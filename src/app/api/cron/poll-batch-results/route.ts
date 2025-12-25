/**
 * Batch Results Polling Cron
 *
 * Vercel Cron: 매 15분마다 실행
 * - 처리 중인 배치 상태 확인
 * - 완료된 배치 결과 저장
 * - 실패한 배치 처리
 *
 * Vercel cron 설정:
 * ```json
 * {
 *   "crons": [{
 *     "path": "/api/cron/poll-batch-results",
 *     "schedule": "*/15 * * * *"
 *   }]
 * }
 * ```
 */

import { NextResponse } from 'next/server'
import { checkPendingBatches } from '@/lib/queue/batch-processor'
import { supabase } from '@/lib/supabase/server'

// Vercel Cron은 환경 변수로 인증
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/cron/poll-batch-results
 *
 * 매 15분마다 실행되어 대기 중인 배치 확인 및 결과 처리
 */
export async function GET(request: Request) {
  // Verify Cron Secret (Vercel 보안)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[PollBatchResults] Starting batch polling...')

    // 1. 모든 대기 중인 배치 확인
    const results = await checkPendingBatches()

    if (results.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No batches to process',
        checked_at: new Date().toISOString(),
      })
    }

    console.log(`[PollBatchResults] Found ${results.length} batch(es) to process`)

    // 2. 완료된 배치 처리
    let completedCount = 0
    let failedCount = 0
    let stillProcessingCount = 0

    for (const result of results) {
      if (result.status === 'completed' && result.results) {
        try {
          await saveResults(result.batch_id, result.results)
          completedCount++
        } catch (error) {
          console.error(`[PollBatchResults] Failed to save results for batch ${result.batch_id}:`, error)
          failedCount++
        }
      } else if (result.status === 'failed') {
        console.error(`[PollBatchResults] Batch ${result.batch_id} failed`)
        failedCount++
      } else {
        stillProcessingCount++
      }
    }

    // 3. 응답
    return NextResponse.json({
      success: true,
      summary: {
        total_checked: results.length,
        completed: completedCount,
        failed: failedCount,
        still_processing: stillProcessingCount,
      },
      checked_at: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[PollBatchResults] Polling failed:', err)
    return NextResponse.json(
      {
        error: 'Polling failed',
        message: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 배치 결과를 적절한 테이블에 저장
 */
async function saveResults(batchId: string, results: Array<{
  custom_id: string
  data: unknown
}>) {
  // batch_id로 배치 타입 확인
  const { data: batchJob } = await supabase
    .from('batch_jobs')
    .select('type')
    .eq('batch_id', batchId)
    .single()

  if (!batchJob) {
    console.warn(`[PollBatchResults] Batch job not found for ${batchId}`)
    return
  }

  // 배치 타입에 따라 다른 테이블에 저장
  switch (batchJob.type) {
    case 'backtest':
      await saveBacktestResults(batchId, results)
      break
    case 'market_analysis':
      await saveMarketAnalysisResults(batchId, results)
      break
    case 'legal_check':
      await saveLegalCheckResults(batchId, results)
      break
    case 'strategy_generation':
      await saveStrategyGenerationResults(batchId, results)
      break
    default:
      console.warn(`[PollBatchResults] Unknown batch type: ${batchJob.type}`)
  }

  console.log(`[PollBatchResults] Saved ${results.length} results for batch ${batchId} (${batchJob.type})`)
}

/**
 * 백테스트 결과 저장
 */
async function saveBacktestResults(batchId: string, results: Array<{
  custom_id: string
  data: unknown
}>) {
  for (const result of results) {
    // custom_id 형식: "backtest-{strategy_id}-{timestamp}"
    const strategyId = result.custom_id.split('-')[1]

    const { error } = await supabase.from('backtest_results').insert({
      strategy_id: strategyId,
      batch_id: batchId,
      result_data: result.data,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error(`[PollBatchResults] Failed to save backtest result for ${strategyId}:`, error)
    }
  }
}

/**
 * 시장 분석 결과 저장
 */
async function saveMarketAnalysisResults(batchId: string, results: Array<{
  custom_id: string
  data: unknown
}>) {
  for (const result of results) {
    // custom_id 형식: "analysis-{symbol}-{timestamp}"
    const symbol = result.custom_id.split('-')[1]

    const { error } = await supabase.from('market_analysis_results').insert({
      symbol,
      batch_id: batchId,
      analysis_data: result.data,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error(`[PollBatchResults] Failed to save market analysis result for ${symbol}:`, error)
    }
  }
}

/**
 * 법률 체크 결과 저장 (향후 구현)
 */
async function saveLegalCheckResults(batchId: string, results: Array<{
  custom_id: string
  data: unknown
}>) {
  console.log(`[PollBatchResults] Legal check results not yet implemented (${results.length} results)`)
  // TODO: legal_check_results 테이블 구현
}

/**
 * 전략 생성 결과 저장 (향후 구현)
 */
async function saveStrategyGenerationResults(batchId: string, results: Array<{
  custom_id: string
  data: unknown
}>) {
  console.log(`[PollBatchResults] Strategy generation results not yet implemented (${results.length} results)`)
  // TODO: strategy_generation_results 테이블 구현
}
