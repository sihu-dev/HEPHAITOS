/**
 * Overnight Backtest Batch Cron
 *
 * Vercel Cron: 매일 22:00 실행
 * - 대기 중인 백테스트 요청을 배치로 처리
 * - 50% 비용 절감 (Batch API 활용)
 * - 다음날 06:00 결과 제공
 *
 * Vercel cron 설정:
 * ```json
 * {
 *   "crons": [{
 *     "path": "/api/cron/batch-backtest",
 *     "schedule": "0 22 * * *"
 *   }]
 * }
 * ```
 */

import { NextResponse } from 'next/server'
import { submitBacktestBatch, type BacktestBatchInput } from '@/lib/queue/batch-processor'
import { supabase } from '@/lib/supabase/server'

// Vercel Cron은 환경 변수로 인증
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/cron/batch-backtest?action=submit (default)
 * POST /api/cron/batch-backtest
 *
 * 매일 22:00 실행되어 대기 중인 백테스트를 배치 처리
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'submit'

  if (action === 'retrieve') {
    return handleRetrieveResults(request)
  }

  return handleSubmitBatch(request)
}

export async function POST(request: Request) {
  return handleSubmitBatch(request)
}

async function handleSubmitBatch(request: Request) {
  // Verify Cron Secret (Vercel 보안)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. 대기 중인 백테스트 요청 가져오기
    const { data: pendingBacktests, error } = await supabase
      .from('backtest_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1000) // 최대 1000개 (배치 제한 10,000개)

    if (error) throw error

    if (!pendingBacktests || pendingBacktests.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending backtests',
        count: 0,
      })
    }

    // 2. Batch API 형식으로 변환
    const batchInputs: BacktestBatchInput[] = pendingBacktests.map((bt) => ({
      strategy_id: bt.strategy_id,
      strategy_name: bt.strategy_name || 'Unnamed Strategy',
      strategy_config: bt.strategy_config || {},
      timeframe: bt.timeframe || '1d',
      start_date: bt.start_date || '2020-01-01',
      end_date: bt.end_date || new Date().toISOString().split('T')[0],
    }))

    // 3. Batch 제출
    const batchId = await submitBacktestBatch(batchInputs)

    // 4. 대기 요청 상태 업데이트
    const { error: updateError } = await supabase
      .from('backtest_queue')
      .update({
        status: 'batch_submitted',
        batch_id: batchId,
        submitted_at: new Date().toISOString(),
      })
      .in(
        'id',
        pendingBacktests.map((bt) => bt.id)
      )

    if (updateError) {
      console.error('[BatchBacktest] Failed to update queue status:', updateError)
    }

    // 5. 성공 응답
    return NextResponse.json({
      success: true,
      batch_id: batchId,
      request_count: batchInputs.length,
      estimated_completion: '06:00 AM next day',
      cost_savings: `50% ($${(batchInputs.length * 0.15 * 0.5).toFixed(2)} saved)`,
    })
  } catch (err) {
    console.error('[BatchBacktest] Cron job failed:', err)
    return NextResponse.json(
      {
        error: 'Failed to submit batch',
        message: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

async function handleRetrieveResults(request: Request) {
  // Verify Cron Secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { checkPendingBatches } = await import('@/lib/queue/batch-processor')

    // 모든 대기 중인 배치 확인
    const results = await checkPendingBatches()

    if (results.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No completed batches',
        count: 0,
      })
    }

    // 결과를 데이터베이스에 저장
    for (const result of results) {
      if (result.status === 'completed' && result.results) {
        await saveBacktestResults(result.batch_id, result.results)
      }
    }

    return NextResponse.json({
      success: true,
      completed_batches: results.length,
      total_results: results.reduce((sum, r) => sum + (r.results?.length || 0), 0),
    })
  } catch (err) {
    console.error('[BatchBacktest] Results retrieval failed:', err)
    return NextResponse.json(
      {
        error: 'Failed to retrieve results',
        message: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

async function saveBacktestResults(batchId: string, results: Array<{
  custom_id: string
  data: unknown
}>) {
  for (const result of results) {
    // custom_id 형식: "backtest-{strategy_id}-{timestamp}"
    const strategyId = result.custom_id.split('-')[1]

    // 결과 저장
    const { error } = await supabase.from('backtest_results').insert({
      strategy_id: strategyId,
      batch_id: batchId,
      result_data: result.data,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error(`[BatchBacktest] Failed to save result for ${strategyId}:`, error)
    }
  }
}
