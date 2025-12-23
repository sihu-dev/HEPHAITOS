// ============================================
// Daily Summary Cron Job
// GPT V1 피드백: 일일 시스템 요약 리포트
// Vercel Cron: 매일 오전 9시 (KST)
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { notifyDailySummary } from '@/lib/notifications/slack'
import { getPerformanceSummary } from '@/lib/monitoring/performance'
import { safeLogger } from '@/lib/utils/safe-logger'
import { withRateLimit } from '@/lib/api/middleware/rate-limit'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Vercel Cron 인증
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return false

  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    safeLogger.warn('[Cron] CRON_SECRET not configured')
    return false
  }

  return authHeader === `Bearer ${cronSecret}`
}

async function GETHandler(request: NextRequest) {
  // 개발 환경에서는 인증 스킵
  if (process.env.NODE_ENV === 'production' && !verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const dateStr = yesterday.toISOString().split('T')[0]

  try {
    // 웹훅 이벤트 통계
    const { data: webhookStats } = await supabase
      .from('webhook_events')
      .select('status')
      .gte('created_at', `${dateStr}T00:00:00Z`)
      .lt('created_at', `${today.toISOString().split('T')[0]}T00:00:00Z`)

    const webhooks = {
      total: webhookStats?.length || 0,
      processed: webhookStats?.filter(e => e.status === 'processed').length || 0,
      failed: webhookStats?.filter(e => e.status === 'failed').length || 0,
      dlq: webhookStats?.filter(e => e.status === 'dlq').length || 0,
    }

    // 크레딧 통계
    const { data: creditStats } = await supabase
      .from('credit_transactions')
      .select('type, amount')
      .gte('created_at', `${dateStr}T00:00:00Z`)
      .lt('created_at', `${today.toISOString().split('T')[0]}T00:00:00Z`)

    const credits = {
      purchased: creditStats
        ?.filter(t => t.type === 'purchase')
        .reduce((sum, t) => sum + (t.amount || 0), 0) || 0,
      spent: creditStats
        ?.filter(t => t.type === 'usage')
        .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0) || 0,
    }

    // Circuit Breaker 오픈 횟수 (로그 기반 추정)
    const performanceSummary = getPerformanceSummary()

    const circuits = {
      openCount: performanceSummary.topErrors.length, // 에러가 많은 경로 수
    }

    // Slack 알림 전송
    const success = await notifyDailySummary({
      date: dateStr,
      webhooks,
      credits,
      circuits,
    })

    if (success) {
      safeLogger.info('[Cron] Daily summary sent', {
        date: dateStr,
        webhooks,
        credits,
      })
    }

    return NextResponse.json({
      success,
      date: dateStr,
      webhooks,
      credits,
      circuits,
    })
  } catch (error) {
    safeLogger.error('[Cron] Daily summary job failed', { error })
    return NextResponse.json(
      { error: 'Cron job failed', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}

// Vercel Cron 설정
export const dynamic = 'force-dynamic'
export const maxDuration = 30

export const GET = withRateLimit(GETHandler, { category: 'api' })
