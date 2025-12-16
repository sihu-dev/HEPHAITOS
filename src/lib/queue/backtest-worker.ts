// ============================================
// Backtest Worker (BullMQ)
// Loop 11: 백테스트 실행 Worker + Realtime Progress
// ============================================

import { Worker, Job } from 'bullmq'
import { Redis } from 'ioredis'
import { createClient } from '@supabase/supabase-js'
import type { BacktestJob } from '@/types/queue'
import type { BacktestJobData, BacktestResult } from './backtest-queue'

const redis = new Redis(process.env.UPSTASH_REDIS_URL!, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
})

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Realtime 진행률 브로드캐스트 (Loop 11)
 */
async function broadcastProgress(
  jobId: string,
  progress: number,
  status: 'pending' | 'active' | 'completed' | 'failed',
  message?: string
) {
  await supabaseAdmin
    .from('backtest_jobs')
    .upsert({
      job_id: jobId,
      progress,
      status,
      message,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'job_id'
    })
}

/**
 * 크레딧 차감 (멱등성 보장)
 */
async function deductCredits(userId: string, credits: number, jobId: string): Promise<void> {
  const { error } = await supabaseAdmin.rpc('deduct_backtest_credits', {
    p_user_id: userId,
    p_credits: credits,
    p_job_id: jobId,
  })

  if (error) {
    console.error('[Backtest Worker] Credit deduction failed:', error)
    throw new Error(`CREDIT_DEDUCTION_FAILED: ${error.message}`)
  }
}

/**
 * 백테스트 실행 (실제 로직)
 */
async function runBacktest(data: BacktestJobData): Promise<BacktestResult> {
  const { strategyId, timeframe, startDate, endDate, symbol } = data

  // TODO: 실제 백테스트 로직 구현
  // 1. strategy 조회
  // 2. 시장 데이터 fetch (Polygon.io)
  // 3. 시뮬레이션 실행
  // 4. 성과 지표 계산

  // 임시 Mock 결과
  await new Promise((resolve) => setTimeout(resolve, 5000)) // 5초 시뮬레이션

  return {
    totalReturn: 15.5,
    sharpeRatio: 1.8,
    maxDrawdown: -8.2,
    winRate: 62.5,
    totalTrades: 120,
    profitableTrades: 75,
    losingTrades: 45,
    avgWin: 2.3,
    avgLoss: -1.5,
  }
}

/**
 * 백테스트 결과 저장
 */
async function saveBacktestResult(
  userId: string,
  strategyId: string,
  jobId: string,
  result: BacktestResult
): Promise<void> {
  const { error } = await supabaseAdmin.from('backtest_jobs').update({
    status: 'completed',
    result,
    completed_at: new Date().toISOString(),
  }).eq('job_id', jobId)

  if (error) {
    console.error('[Backtest Worker] Result save failed:', error)
    throw new Error(`RESULT_SAVE_FAILED: ${error.message}`)
  }
}

/**
 * Backtest Worker
 */
export const backtestWorker = new Worker<BacktestJobData, BacktestResult>(
  'backtest-jobs',
  async (job: Job<BacktestJobData>) => {
    const { userId, strategyId, credits } = job.data
    const jobId = job.id!

    console.log(`[Backtest Worker] Starting job ${jobId} for user ${userId}`)

    // 진행 상황 업데이트 + Realtime Broadcast
    await job.updateProgress(10)
    await broadcastProgress(jobId, 10, 'active', '크레딧 차감 중...')

    // 1. 크레딧 차감 (멱등)
    try {
      await deductCredits(userId, credits, jobId)
      await job.updateProgress(20)
      await broadcastProgress(jobId, 20, 'active', '데이터 로딩 중...')
    } catch (error) {
      console.error('[Backtest Worker] Credit deduction error:', error)
      await broadcastProgress(jobId, 0, 'failed', `크레딧 차감 실패: ${(error as Error).message}`)
      throw error // 재시도
    }

    // 2. 백테스트 실행
    try {
      await job.updateProgress(30)
      await broadcastProgress(jobId, 30, 'active', '백테스트 실행 중...')

      const result = await runBacktest(job.data)

      await job.updateProgress(80)
      await broadcastProgress(jobId, 80, 'active', '결과 저장 중...')

      // 3. 결과 저장
      await saveBacktestResult(userId, strategyId, jobId, result)
      await job.updateProgress(100)
      await broadcastProgress(jobId, 100, 'completed', '완료!')

      console.log(`[Backtest Worker] Job ${jobId} completed successfully`)
      return result
    } catch (error) {
      console.error('[Backtest Worker] Backtest execution error:', error)

      // 실패 시 잡 상태 업데이트
      await supabaseAdmin.from('backtest_jobs').update({
        status: 'failed',
        result: { error: error instanceof Error ? error.message : 'Unknown error' },
      }).eq('job_id', jobId)

      await broadcastProgress(jobId, 0, 'failed', `실행 실패: ${(error as Error).message}`)

      throw error
    }
  },
  {
    connection: redis,
    concurrency: 5, // 동시 실행 5개
    limiter: {
      max: 10, // 10개/초
      duration: 1000,
    },
  }
)

/**
 * Worker 이벤트 핸들러
 */
backtestWorker.on('completed', (job) => {
  console.log(`[Backtest Worker] Job ${job.id} completed with result:`, job.returnvalue)
})

backtestWorker.on('failed', (job, err) => {
  console.error(`[Backtest Worker] Job ${job?.id} failed:`, err.message)
})

backtestWorker.on('active', (job) => {
  console.log(`[Backtest Worker] Job ${job.id} is now active`)
})

/**
 * Graceful shutdown
 */
process.on('SIGTERM', async () => {
  console.log('[Backtest Worker] Shutting down gracefully...')
  await backtestWorker.close()
  process.exit(0)
})
