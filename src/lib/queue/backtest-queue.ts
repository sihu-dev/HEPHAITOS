// ============================================
// Backtest Job Queue (BullMQ)
// Loop 11: 백테스트 큐 시스템 (Priority + Realtime)
// ============================================

import { Queue } from 'bullmq'
import { Redis } from 'ioredis'
import type { BacktestJob, BacktestJobResult } from '@/types/queue'

/**
 * Redis 연결 (Upstash)
 */
const redis = new Redis(process.env.UPSTASH_REDIS_URL!, {
  maxRetriesPerRequest: null, // BullMQ 요구사항
  enableReadyCheck: false,
  tls: process.env.NODE_ENV === 'production' ? {} : undefined,
})

/**
 * 백테스트 잡 데이터 (legacy compatibility)
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
 * Backtest Queue 생성 (Loop 11 upgraded)
 */
export const backtestQueue = new Queue<BacktestJob, BacktestJobResult>('backtest-queue', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000, // 2초부터 시작
    },
    removeOnComplete: {
      count: 100, // 최근 100개만 보관
      age: 86400, // 24시간
    },
    removeOnFail: {
      count: 200, // 최근 200개 실패 보관
      age: 172800, // 48시간
    },
  },
})

/**
 * 백테스트 잡 추가 (Loop 11: Priority 지원)
 */
export async function addBacktestJob(
  data: BacktestJob,
  priority: number = 0
): Promise<string> {
  const job = await backtestQueue.add('run-backtest', data, {
    jobId: `backtest-${data.userId}-${Date.now()}`,
    priority, // 높을수록 우선 (Pro=2, Basic=1, Free=0)
  })

  return job.id!
}

/**
 * Legacy: 이전 인터페이스 지원
 */
export async function addLegacyBacktestJob(data: BacktestJobData): Promise<string> {
  const jobData: BacktestJob = {
    userId: data.userId,
    strategyId: data.strategyId,
    backtestParams: {
      symbol: data.symbol,
      startDate: data.startDate,
      endDate: data.endDate,
      initialCapital: 100000,
      commission: 0.001,
      slippage: 0.0005,
    },
    priority: 0,
    createdAt: Date.now(),
  }
  return addBacktestJob(jobData, 0)
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
