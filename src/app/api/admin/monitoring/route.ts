// ============================================
// Admin Monitoring API
// GPT V1 피드백: 시스템 상태 모니터링
// ============================================

import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { withApiMiddleware, createApiResponse } from '@/lib/api/middleware'
import { safeLogger } from '@/lib/utils/safe-logger'
import { getRedisClient, isRedisConnected } from '@/lib/redis/client'
import {
  aiCircuit,
  paymentCircuit,
  brokerCircuit,
  externalApiCircuit,
} from '@/lib/redis/circuit-breaker'
import { getRateLimiterStatus } from '@/lib/redis/rate-limiter'
import { getPerformanceSummary, getHealthStatus } from '@/lib/monitoring/performance'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/admin/monitoring
 * 시스템 모니터링 대시보드 데이터
 */
export const GET = withApiMiddleware(
  async (request: NextRequest) => {
    // 관리자 인증
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return createApiResponse(
        { error: '로그인이 필요합니다.' },
        401
      )
    }

    // 관리자 권한 확인
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return createApiResponse(
        { error: '관리자 권한이 필요합니다.' },
        403
      )
    }

    safeLogger.info('[Monitoring API] Fetching system status', { userId: user.id })

    // 병렬로 모든 상태 조회
    const [
      circuitStatus,
      dlqStats,
      rateLimiterStatus,
      webhookStats,
      creditStats,
    ] = await Promise.all([
      getCircuitBreakerStatus(),
      getDLQStats(),
      getRateLimiterStatus(),
      getWebhookStats(),
      getCreditStats(),
    ])

    // 성능 메트릭
    const performanceMetrics = getPerformanceSummary()
    const healthStatus = getHealthStatus()

    return createApiResponse({
      timestamp: new Date().toISOString(),
      health: healthStatus,
      circuits: circuitStatus,
      dlq: dlqStats,
      rateLimiter: rateLimiterStatus,
      webhooks: webhookStats,
      credits: creditStats,
      performance: performanceMetrics,
    })
  },
  {
    rateLimit: { category: 'api' },
    errorHandler: { logErrors: true },
  }
)

/**
 * Circuit Breaker 상태 조회
 */
async function getCircuitBreakerStatus() {
  const circuits = {
    ai: await aiCircuit.getStatus('claude-api'),
    payment: await paymentCircuit.getStatus('toss-api'),
    broker: await brokerCircuit.getStatus('kis-api'),
    external: await externalApiCircuit.getStatus('default'),
  }

  return {
    redis: isRedisConnected(),
    circuits,
    summary: {
      total: 4,
      open: Object.values(circuits).filter(c => c.state === 'open').length,
      halfOpen: Object.values(circuits).filter(c => c.state === 'half-open').length,
      closed: Object.values(circuits).filter(c => c.state === 'closed').length,
    },
  }
}

/**
 * DLQ 통계 조회
 */
async function getDLQStats() {
  const { data, error } = await supabaseAdmin.rpc('get_dlq_stats')

  if (error) {
    safeLogger.error('[Monitoring] DLQ stats error', { error })
    return { error: 'Failed to fetch DLQ stats' }
  }

  return data || {
    total: 0,
    pending: 0,
    retrying: 0,
    resolved: 0,
    abandoned: 0,
  }
}

/**
 * 웹훅 통계 조회
 */
async function getWebhookStats() {
  const { data, error } = await supabaseAdmin
    .from('payment_webhook_events')
    .select('process_status')

  if (error) {
    return { error: 'Failed to fetch webhook stats' }
  }

  const stats = {
    total: data?.length || 0,
    pending: 0,
    processed: 0,
    failed: 0,
    dlq: 0,
    ignored: 0,
  }

  data?.forEach(event => {
    const status = event.process_status as keyof typeof stats
    if (status in stats) {
      stats[status]++
    }
  })

  // 최근 24시간 처리량
  const { count: recentCount } = await supabaseAdmin
    .from('payment_webhook_events')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  return {
    ...stats,
    last24h: recentCount || 0,
  }
}

/**
 * 크레딧 시스템 통계 조회
 */
async function getCreditStats() {
  // 전체 사용량
  const { data: transactions } = await supabaseAdmin
    .from('credit_transactions')
    .select('type, amount')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  const stats = {
    last24h: {
      purchased: 0,
      spent: 0,
      refunded: 0,
      bonus: 0,
    },
  }

  transactions?.forEach(tx => {
    const type = tx.type as keyof typeof stats.last24h
    if (type in stats.last24h) {
      stats.last24h[type] += Math.abs(tx.amount)
    }
  })

  // 활성 사용자 수
  const { count: activeUsers } = await supabaseAdmin
    .from('credit_wallets')
    .select('*', { count: 'exact', head: true })
    .gt('balance', 0)

  return {
    ...stats,
    activeUsers: activeUsers || 0,
  }
}
