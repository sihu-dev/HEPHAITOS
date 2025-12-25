// ============================================
// Claude Prompt Caching Metrics Tracker
// 비용 절감 추적 및 모니터링
// ============================================

import { createClient } from '@/lib/supabase/client'

/**
 * 캐시 메트릭 타입
 */
export interface CacheMetrics {
  cache_creation_tokens: number // 캐시 생성 시 입력 토큰
  cache_read_tokens: number // 캐시 읽기 시 토큰
  input_tokens: number // 일반 입력 토큰
  output_tokens: number // 출력 토큰
  endpoint: string // API 엔드포인트 (/api/ai/strategy 등)
  model: string // 사용 모델
  user_tier?: 'free' | 'starter' | 'pro' // 사용자 티어
  user_id?: string // 사용자 ID (있는 경우)
}

/**
 * 캐시 비용 계산 (USD)
 * - 캐시 생성: $3.75/MTok (첫 요청)
 * - 캐시 읽기: $0.375/MTok (90% 할인!)
 * - 일반 입력: $3/MTok
 * - 출력: $15/MTok
 */
export function calculateCacheCost(metrics: CacheMetrics): {
  total_cost: number
  cost_without_cache: number
  cost_saved: number
  savings_percent: number
} {
  const CACHE_CREATION_COST = 3.75 / 1_000_000 // per token
  const CACHE_READ_COST = 0.375 / 1_000_000 // 90% 할인
  const INPUT_COST = 3 / 1_000_000
  const OUTPUT_COST = 15 / 1_000_000

  // 실제 비용 (캐싱 적용)
  const cache_creation_cost = metrics.cache_creation_tokens * CACHE_CREATION_COST
  const cache_read_cost = metrics.cache_read_tokens * CACHE_READ_COST
  const input_cost = metrics.input_tokens * INPUT_COST
  const output_cost = metrics.output_tokens * OUTPUT_COST
  const total_cost = cache_creation_cost + cache_read_cost + input_cost + output_cost

  // 캐싱 없었을 경우 비용
  const total_input_tokens =
    metrics.cache_creation_tokens + metrics.cache_read_tokens + metrics.input_tokens
  const cost_without_cache = total_input_tokens * INPUT_COST + output_cost

  // 절감액
  const cost_saved = cost_without_cache - total_cost
  const savings_percent = cost_without_cache > 0 ? (cost_saved / cost_without_cache) * 100 : 0

  return {
    total_cost: Math.round(total_cost * 10000) / 10000, // 소수점 4자리
    cost_without_cache: Math.round(cost_without_cache * 10000) / 10000,
    cost_saved: Math.round(cost_saved * 10000) / 10000,
    savings_percent: Math.round(savings_percent * 100) / 100,
  }
}

/**
 * Supabase에 캐시 메트릭 저장
 */
export async function saveCacheMetrics(metrics: CacheMetrics): Promise<void> {
  try {
    const supabase = createClient()
    const costs = calculateCacheCost(metrics)

    const { error } = await supabase.from('cache_metrics').insert({
      cache_creation_tokens: metrics.cache_creation_tokens,
      cache_read_tokens: metrics.cache_read_tokens,
      input_tokens: metrics.input_tokens,
      output_tokens: metrics.output_tokens,
      total_cost: costs.total_cost,
      cost_without_cache: costs.cost_without_cache,
      cost_saved: costs.cost_saved,
      savings_percent: costs.savings_percent,
      endpoint: metrics.endpoint,
      model: metrics.model,
      user_id: metrics.user_id || null,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error('[Cache Metrics] Failed to save:', error)
    }
  } catch (err) {
    console.error('[Cache Metrics] Unexpected error:', err)
  }
}

/**
 * 캐시 히트율 계산
 */
export async function getCacheHitRate(
  startDate: Date,
  endDate: Date
): Promise<{
  total_requests: number
  cache_hits: number
  hit_rate: number
}> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('cache_metrics')
      .select('cache_read_tokens')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    if (error) throw error

    const total_requests = data?.length || 0
    const cache_hits = data?.filter((row) => row.cache_read_tokens > 0).length || 0
    const hit_rate = total_requests > 0 ? (cache_hits / total_requests) * 100 : 0

    return {
      total_requests,
      cache_hits,
      hit_rate: Math.round(hit_rate * 100) / 100,
    }
  } catch (err) {
    console.error('[Cache Metrics] Failed to get hit rate:', err)
    return { total_requests: 0, cache_hits: 0, hit_rate: 0 }
  }
}

/**
 * 총 비용 절감액 계산
 */
export async function getTotalSavings(
  startDate: Date,
  endDate: Date
): Promise<{
  total_cost: number
  total_cost_without_cache: number
  total_saved: number
  savings_percent: number
}> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('cache_metrics')
      .select('total_cost, cost_without_cache, cost_saved')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    if (error) throw error

    const total_cost = data?.reduce((sum, row) => sum + (row.total_cost || 0), 0) || 0
    const total_cost_without_cache =
      data?.reduce((sum, row) => sum + (row.cost_without_cache || 0), 0) || 0
    const total_saved = data?.reduce((sum, row) => sum + (row.cost_saved || 0), 0) || 0
    const savings_percent =
      total_cost_without_cache > 0 ? (total_saved / total_cost_without_cache) * 100 : 0

    return {
      total_cost: Math.round(total_cost * 100) / 100,
      total_cost_without_cache: Math.round(total_cost_without_cache * 100) / 100,
      total_saved: Math.round(total_saved * 100) / 100,
      savings_percent: Math.round(savings_percent * 100) / 100,
    }
  } catch (err) {
    console.error('[Cache Metrics] Failed to get total savings:', err)
    return {
      total_cost: 0,
      total_cost_without_cache: 0,
      total_saved: 0,
      savings_percent: 0,
    }
  }
}

/**
 * 엔드포인트별 캐시 성능
 */
export async function getCachePerformanceByEndpoint(
  startDate: Date,
  endDate: Date
): Promise<
  Array<{
    endpoint: string
    requests: number
    cache_hit_rate: number
    total_saved: number
  }>
> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('cache_metrics')
      .select('endpoint, cache_read_tokens, cost_saved')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    if (error) throw error

    // 엔드포인트별로 그룹화
    const grouped = data?.reduce(
      (acc, row) => {
        const endpoint = row.endpoint
        if (!acc[endpoint]) {
          acc[endpoint] = { requests: 0, cache_hits: 0, total_saved: 0 }
        }
        acc[endpoint].requests += 1
        if (row.cache_read_tokens > 0) {
          acc[endpoint].cache_hits += 1
        }
        acc[endpoint].total_saved += row.cost_saved || 0
        return acc
      },
      {} as Record<string, { requests: number; cache_hits: number; total_saved: number }>
    )

    return Object.entries(grouped || {}).map(([endpoint, stats]) => ({
      endpoint,
      requests: stats.requests,
      cache_hit_rate:
        stats.requests > 0
          ? Math.round((stats.cache_hits / stats.requests) * 10000) / 100
          : 0,
      total_saved: Math.round(stats.total_saved * 100) / 100,
    }))
  } catch (err) {
    console.error('[Cache Metrics] Failed to get performance by endpoint:', err)
    return []
  }
}

/**
 * 실시간 캐시 통계 (대시보드용)
 */
export async function getRealTimeCacheStats(): Promise<{
  today: {
    requests: number
    cache_hits: number
    hit_rate: number
    saved_usd: number
  }
  this_week: {
    requests: number
    cache_hits: number
    hit_rate: number
    saved_usd: number
  }
  this_month: {
    requests: number
    cache_hits: number
    hit_rate: number
    saved_usd: number
  }
}> {
  const now = new Date()
  const today_start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const week_start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const month_start = new Date(now.getFullYear(), now.getMonth(), 1)

  const [today, this_week, this_month] = await Promise.all([
    getCacheHitRate(today_start, now),
    getCacheHitRate(week_start, now),
    getCacheHitRate(month_start, now),
  ])

  const [today_savings, week_savings, month_savings] = await Promise.all([
    getTotalSavings(today_start, now),
    getTotalSavings(week_start, now),
    getTotalSavings(month_start, now),
  ])

  return {
    today: {
      requests: today.total_requests,
      cache_hits: today.cache_hits,
      hit_rate: today.hit_rate,
      saved_usd: today_savings.total_saved,
    },
    this_week: {
      requests: this_week.total_requests,
      cache_hits: this_week.cache_hits,
      hit_rate: this_week.hit_rate,
      saved_usd: week_savings.total_saved,
    },
    this_month: {
      requests: this_month.total_requests,
      cache_hits: this_month.cache_hits,
      hit_rate: this_month.hit_rate,
      saved_usd: month_savings.total_saved,
    },
  }
}

/**
 * 캐시 효율성 검증
 * - 캐시 히트율이 60% 이상인지
 * - 비용 절감이 실제로 이루어지는지
 */
export async function validateCacheEfficiency(): Promise<{
  is_efficient: boolean
  hit_rate: number
  savings_percent: number
  recommendations: string[]
}> {
  const now = new Date()
  const week_ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const hit_rate_data = await getCacheHitRate(week_ago, now)
  const savings_data = await getTotalSavings(week_ago, now)

  const recommendations: string[] = []

  // 히트율 검증
  if (hit_rate_data.hit_rate < 60) {
    recommendations.push(
      `캐시 히트율이 ${hit_rate_data.hit_rate.toFixed(1)}%로 낮습니다. 목표: 60% 이상`
    )
    recommendations.push('시스템 프롬프트 재사용 빈도를 높이세요')
  }

  // 절감율 검증
  if (savings_data.savings_percent < 50) {
    recommendations.push(
      `비용 절감률이 ${savings_data.savings_percent.toFixed(1)}%로 낮습니다. 목표: 50% 이상`
    )
    recommendations.push('더 많은 프롬프트에 cache_control을 적용하세요')
  }

  // 요청 수 검증
  if (hit_rate_data.total_requests < 100) {
    recommendations.push('주간 요청 수가 적어 통계적 신뢰도가 낮습니다')
  }

  const is_efficient =
    hit_rate_data.hit_rate >= 60 &&
    savings_data.savings_percent >= 50 &&
    hit_rate_data.total_requests >= 100

  return {
    is_efficient,
    hit_rate: hit_rate_data.hit_rate,
    savings_percent: savings_data.savings_percent,
    recommendations,
  }
}
