/**
 * Overnight Market Analysis Batch Cron
 *
 * Vercel Cron: 매일 22:00 실행
 * - 500개 종목 시장 분석을 배치로 처리
 * - 50% 비용 절감 (Batch API 활용)
 * - 다음날 06:00 결과 제공
 *
 * Vercel cron 설정:
 * ```json
 * {
 *   "crons": [{
 *     "path": "/api/cron/batch-analysis",
 *     "schedule": "0 22 * * *"
 *   }]
 * }
 * ```
 */

import { NextResponse } from 'next/server'
import { submitMarketAnalysisBatch, type MarketAnalysisBatchInput } from '@/lib/queue/batch-processor'
import { supabase } from '@/lib/supabase/server'

// Vercel Cron은 환경 변수로 인증
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// 분석 대상 종목 목록 (예시)
const TOP_500_SYMBOLS = [
  // US Tech Giants
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'AMD', 'INTC', 'CRM',
  // Korean Stocks
  '005930', // 삼성전자
  '000660', // SK하이닉스
  '035420', // NAVER
  '035720', // 카카오
  '051910', // LG화학
  // ... 나머지 495개 (실제로는 DB에서 가져오기)
]

/**
 * GET /api/cron/batch-analysis?action=submit (default)
 * POST /api/cron/batch-analysis
 *
 * 매일 22:00 실행되어 500개 종목 시장 분석을 배치 처리
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
    // 1. 분석 대상 종목 가져오기 (실제로는 DB에서 조회)
    // 예: 사용자들이 많이 보는 상위 500개, 또는 전체 상장 종목
    const symbolsToAnalyze = TOP_500_SYMBOLS.slice(0, 500) // 최대 500개

    // 2. 각 종목의 최신 시장 데이터 가져오기
    const batchInputs: MarketAnalysisBatchInput[] = await Promise.all(
      symbolsToAnalyze.map(async (symbol) => {
        // TODO: 실제로는 Exchange API에서 최신 데이터 가져오기
        const mockData = {
          price: 150.0,
          volume: 1000000,
          change_percent: 2.5,
          indicators: {
            rsi_14: 65,
            macd: 1.2,
            bb_upper: 155,
            bb_lower: 145,
          },
        }

        return {
          symbol,
          market: symbol.length === 6 ? ('KR' as const) : ('US' as const), // 6자리면 한국, 아니면 미국
          data: mockData,
        }
      })
    )

    // 3. Batch 제출
    const batchId = await submitMarketAnalysisBatch(batchInputs)

    // 4. 배치 제출 기록
    const { error: logError } = await supabase.from('market_analysis_queue').insert({
      batch_id: batchId,
      symbol_count: batchInputs.length,
      status: 'batch_submitted',
      submitted_at: new Date().toISOString(),
    })

    if (logError) {
      console.error('[BatchAnalysis] Failed to log batch submission:', logError)
    }

    // 5. 성공 응답
    return NextResponse.json({
      success: true,
      batch_id: batchId,
      symbol_count: batchInputs.length,
      estimated_completion: '06:00 AM next day',
      cost_savings: `50% ($${(batchInputs.length * 0.1 * 0.5).toFixed(2)} saved)`,
    })
  } catch (err) {
    console.error('[BatchAnalysis] Cron job failed:', err)
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
        await saveMarketAnalysisResults(result.batch_id, result.results)
      }
    }

    return NextResponse.json({
      success: true,
      completed_batches: results.length,
      total_results: results.reduce((sum, r) => sum + (r.results?.length || 0), 0),
    })
  } catch (err) {
    console.error('[BatchAnalysis] Results retrieval failed:', err)
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

async function saveMarketAnalysisResults(batchId: string, results: Array<{
  custom_id: string
  data: unknown
}>) {
  for (const result of results) {
    // custom_id 형식: "analysis-{symbol}-{timestamp}"
    const symbol = result.custom_id.split('-')[1]

    // 결과 저장
    const { error } = await supabase.from('market_analysis_results').insert({
      symbol,
      batch_id: batchId,
      analysis_data: result.data,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error(`[BatchAnalysis] Failed to save result for ${symbol}:`, error)
    }
  }
}
