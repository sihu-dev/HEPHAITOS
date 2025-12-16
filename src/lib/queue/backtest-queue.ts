// ============================================
// Backtest Job Queue (BullMQ)
// Loop 12: 백테스트 비동기 처리
// ============================================

import { Queue, Worker, Job } from 'bullmq'
import { Redis } from 'ioredis'

/**
 * Redis 연결 (Upstash)
 */
const redis = new Redis(process.env.UPSTASH_REDIS_URL!, {
  maxRetriesPerRequest: null, // BullMQ 요구사항
})

/**
 * 백테스트 잡 데이터
 */
export interface BacktestJobData {
  strategyId: string
  userId: string
  timeframe: '1m' | '5m' | '15m' | '1h' | '1d'
  startDate: string
  endDate: string
  credits: number
  symbol: string
}

/**
 * 백테스트 결과
 */
export interface BacktestResult {
  totalReturn: number
  sharpeRatio: number
  maxDrawdown: number
  winRate: number
  totalTrades: number
  profitableTrades: number
  losingTrades: number
  avgWin: number
  avgLoss: number
}

/**
 * Backtest Queue 생성
 */
export const backtestQueue = new Queue<BacktestJobData>('backtest-jobs', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      count: 100, // 최근 100개만 보관
    },
    removeOnFail: {
      count: 50, // 최근 50개 실패 보관
    },
  },
})

/**
 * 백테스트 잡 추가
 */
export async function addBacktestJob(data: BacktestJobData): Promise<string> {
  const job = await backtestQueue.add('run-backtest', data, {
    jobId: `backtest_${data.userId}_${Date.now()}`,
  })

  return job.id!
}

/**
 * 잡 상태 조회
 */
export async function getJobStatus(jobId: string) {
  const job = await backtestQueue.getJob(jobId)

  if (!job) {
    return { status: 'not_found' }
  }

  const state = await job.getState()
  const progress = job.progress

  return {
    status: state,
    progress,
    data: job.data,
    result: job.returnvalue,
    failedReason: job.failedReason,
  }
}

/**
 * 사용자의 대기 중인 잡 목록
 */
export async function getUserPendingJobs(userId: string) {
  const waiting = await backtestQueue.getWaiting()
  const active = await backtestQueue.getActive()

  const userJobs = [...waiting, ...active].filter((job) => job.data.userId === userId)

  return userJobs.map((job) => ({
    jobId: job.id,
    strategyId: job.data.strategyId,
    state: job.getState(),
  }))
}

/**
 * 큐 통계
 */
export async function getQueueStats() {
  const counts = await backtestQueue.getJobCounts()

  return {
    waiting: counts.waiting,
    active: counts.active,
    completed: counts.completed,
    failed: counts.failed,
  }
}
