// ============================================
// Backtest Job Queue (BullMQ)
// Loop 11: 백테스트 큐 시스템 (Priority + Realtime)
// ============================================

import { Queue } from 'bullmq'
import type { BacktestJob, BacktestJobResult } from '@/types/queue'

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

// Lazy initialization for Redis and Queue
let redis: import('ioredis').Redis | null = null
let queue: Queue<BacktestJob, BacktestJobResult> | null = null

/**
 * Redis 연결 가져오기 (lazy initialization)
 */
async function getRedisConnection() {
  if (redis) return redis

  const redisUrl = process.env.UPSTASH_REDIS_URL
  if (!redisUrl) {
    throw new Error('UPSTASH_REDIS_URL is not configured')
  }

  const { default: Redis } = await import('ioredis')
  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: null, // BullMQ 요구사항
    enableReadyCheck: false,
    tls: process.env.NODE_ENV === 'production' ? {} : undefined,
  })

  return redis
}

/**
 * Backtest Queue 가져오기 (lazy initialization)
 */
export async function getBacktestQueue(): Promise<Queue<BacktestJob, BacktestJobResult>> {
  if (queue) return queue

  const connection = await getRedisConnection()
  queue = new Queue<BacktestJob, BacktestJobResult>('backtest-queue', {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: {
        count: 100,
        age: 86400,
      },
      removeOnFail: {
        count: 200,
        age: 172800,
      },
    },
  })

  return queue
}

// Legacy export for backward compatibility (will throw if not initialized)
export const backtestQueue = {
  async add(...args: Parameters<Queue<BacktestJob, BacktestJobResult>['add']>) {
    const q = await getBacktestQueue()
    return q.add(...args)
  },
  async getJob(jobId: string) {
    const q = await getBacktestQueue()
    return q.getJob(jobId)
  },
  async getWaiting() {
    const q = await getBacktestQueue()
    return q.getWaiting()
  },
  async getActive() {
    const q = await getBacktestQueue()
    return q.getActive()
  },
  async getJobCounts() {
    const q = await getBacktestQueue()
    return q.getJobCounts()
  },
}

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
