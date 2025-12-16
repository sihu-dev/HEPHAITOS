// ============================================
// Performance Monitoring Middleware
// GPT V1 피드백: API 성능 추적
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { safeLogger } from '@/lib/utils/safe-logger'

export interface PerformanceMetrics {
  path: string
  method: string
  statusCode: number
  duration: number
  timestamp: number
  userId?: string
  error?: string
}

export interface AggregatedMetrics {
  path: string
  count: number
  avgDuration: number
  minDuration: number
  maxDuration: number
  p95Duration: number
  errorCount: number
  errorRate: number
}

// In-memory metrics buffer (for batch processing)
const metricsBuffer: PerformanceMetrics[] = []
const MAX_BUFFER_SIZE = 1000

// Path-based aggregation
const pathMetrics: Map<string, {
  durations: number[]
  errorCount: number
  lastReset: number
}> = new Map()

const RESET_INTERVAL_MS = 5 * 60 * 1000 // 5분마다 리셋

/**
 * 성능 메트릭 기록
 */
export function recordMetric(metric: PerformanceMetrics): void {
  // Buffer에 추가
  metricsBuffer.push(metric)

  // 버퍼 크기 제한
  if (metricsBuffer.length > MAX_BUFFER_SIZE) {
    metricsBuffer.shift()
  }

  // Path별 집계
  const pathKey = `${metric.method}:${metric.path}`
  const existing = pathMetrics.get(pathKey) || {
    durations: [],
    errorCount: 0,
    lastReset: Date.now(),
  }

  // 주기적 리셋
  if (Date.now() - existing.lastReset > RESET_INTERVAL_MS) {
    existing.durations = []
    existing.errorCount = 0
    existing.lastReset = Date.now()
  }

  existing.durations.push(metric.duration)
  if (metric.statusCode >= 400) {
    existing.errorCount++
  }

  // 최대 1000개 유지
  if (existing.durations.length > 1000) {
    existing.durations.shift()
  }

  pathMetrics.set(pathKey, existing)

  // 느린 요청 로깅 (1초 이상)
  if (metric.duration > 1000) {
    safeLogger.warn('[Performance] Slow request detected', {
      path: metric.path,
      method: metric.method,
      duration: metric.duration,
      userId: metric.userId,
    })
  }

  // 에러 로깅
  if (metric.statusCode >= 500) {
    safeLogger.error('[Performance] Server error', {
      path: metric.path,
      method: metric.method,
      statusCode: metric.statusCode,
      error: metric.error,
      userId: metric.userId,
    })
  }
}

/**
 * 집계된 메트릭 조회
 */
export function getAggregatedMetrics(): AggregatedMetrics[] {
  const result: AggregatedMetrics[] = []

  pathMetrics.forEach((data, pathKey) => {
    const [method, ...pathParts] = pathKey.split(':')
    const path = pathParts.join(':')

    if (data.durations.length === 0) return

    const sorted = [...data.durations].sort((a, b) => a - b)
    const count = sorted.length
    const sum = sorted.reduce((a, b) => a + b, 0)
    const p95Index = Math.floor(count * 0.95)

    result.push({
      path,
      count,
      avgDuration: Math.round(sum / count),
      minDuration: sorted[0],
      maxDuration: sorted[count - 1],
      p95Duration: sorted[p95Index] || sorted[count - 1],
      errorCount: data.errorCount,
      errorRate: count > 0 ? (data.errorCount / count) * 100 : 0,
    })
  })

  // 요청 수 기준 정렬
  return result.sort((a, b) => b.count - a.count)
}

/**
 * 최근 메트릭 조회
 */
export function getRecentMetrics(limit = 100): PerformanceMetrics[] {
  return metricsBuffer.slice(-limit)
}

/**
 * 특정 경로 메트릭 조회
 */
export function getPathMetrics(path: string): AggregatedMetrics | null {
  const all = getAggregatedMetrics()
  return all.find(m => m.path === path) || null
}

/**
 * 성능 요약
 */
export function getPerformanceSummary(): {
  totalRequests: number
  avgDuration: number
  errorRate: number
  slowRequests: number
  topErrors: Array<{ path: string; count: number }>
} {
  const metrics = getAggregatedMetrics()

  let totalRequests = 0
  let totalDuration = 0
  let totalErrors = 0
  let slowRequests = 0

  metrics.forEach(m => {
    totalRequests += m.count
    totalDuration += m.avgDuration * m.count
    totalErrors += m.errorCount
    if (m.avgDuration > 500) {
      slowRequests += m.count
    }
  })

  const topErrors = metrics
    .filter(m => m.errorCount > 0)
    .sort((a, b) => b.errorCount - a.errorCount)
    .slice(0, 5)
    .map(m => ({ path: m.path, count: m.errorCount }))

  return {
    totalRequests,
    avgDuration: totalRequests > 0 ? Math.round(totalDuration / totalRequests) : 0,
    errorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0,
    slowRequests,
    topErrors,
  }
}

/**
 * 성능 모니터링 미들웨어 래퍼
 */
export function withPerformanceMonitoring<T extends NextResponse>(
  handler: (request: NextRequest) => Promise<T>,
  options: {
    path: string
    getUserId?: (request: NextRequest) => string | undefined
  }
): (request: NextRequest) => Promise<T> {
  return async (request: NextRequest) => {
    const startTime = Date.now()
    let statusCode = 200
    let error: string | undefined

    try {
      const response = await handler(request)
      statusCode = response.status
      return response
    } catch (err) {
      statusCode = 500
      error = err instanceof Error ? err.message : 'Unknown error'
      throw err
    } finally {
      const duration = Date.now() - startTime
      const userId = options.getUserId?.(request)

      recordMetric({
        path: options.path,
        method: request.method,
        statusCode,
        duration,
        timestamp: Date.now(),
        userId,
        error,
      })
    }
  }
}

/**
 * API Route에서 수동으로 메트릭 기록
 */
export function createPerformanceTracker(
  path: string,
  method: string
): {
  start: () => void
  end: (statusCode: number, userId?: string, error?: string) => void
} {
  let startTime = 0

  return {
    start: () => {
      startTime = Date.now()
    },
    end: (statusCode: number, userId?: string, error?: string) => {
      const duration = Date.now() - startTime

      recordMetric({
        path,
        method,
        statusCode,
        duration,
        timestamp: Date.now(),
        userId,
        error,
      })
    },
  }
}

/**
 * 헬스체크용 성능 상태
 */
export function getHealthStatus(): {
  status: 'healthy' | 'degraded' | 'unhealthy'
  details: string
} {
  const summary = getPerformanceSummary()

  if (summary.errorRate > 10) {
    return {
      status: 'unhealthy',
      details: `High error rate: ${summary.errorRate.toFixed(1)}%`,
    }
  }

  if (summary.errorRate > 5 || summary.avgDuration > 1000) {
    return {
      status: 'degraded',
      details: `Error rate: ${summary.errorRate.toFixed(1)}%, Avg duration: ${summary.avgDuration}ms`,
    }
  }

  return {
    status: 'healthy',
    details: `Normal operation. Avg response time: ${summary.avgDuration}ms`,
  }
}
