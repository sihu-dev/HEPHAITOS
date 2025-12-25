/**
 * HEPHAITOS Backtest Queue System
 * Loop 11: 동시 100명 백테스트 처리
 */

import { Queue, QueueOptions } from 'bullmq'
import IORedis from 'ioredis'

// Redis Connection
const connection = new IORedis(process.env.UPSTASH_REDIS_URL || '', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
})

// Job Types
export interface BacktestJobData {
  userId: string
  strategyId: string
  params: {
    symbol: string
    startDate: string
    endDate: string
    initialCapital: number
  }
  priority: number
}

export interface BacktestJobResult {
  status: 'completed' | 'failed'
  metrics?: {
    sharpeRatio: number
    cagr: number
    maxDrawdown: number
  }
  error?: string
}

// Queue
export const backtestQueue = new Queue<BacktestJobData, BacktestJobResult>(
  'backtest-queue',
  {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: { age: 3600, count: 1000 },
    },
  }
)

export async function addBacktestJob(data: BacktestJobData) {
  const job = await backtestQueue.add('backtest', data, {
    priority: 10 - data.priority,
  })
  return job.id as string
}

export async function getQueueMetrics() {
  return {
    waiting: await backtestQueue.getWaitingCount(),
    active: await backtestQueue.getActiveCount(),
  }
}
