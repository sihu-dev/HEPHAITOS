// ============================================
// Backtest Queue API
// Loop 12: 백테스트 큐 시스템
// P-1 CRITICAL: 크레딧 소비 통합
// P2: Rate limiting 적용
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { addBacktestJob, getJobStatus } from '@/lib/queue/backtest-queue'
import { spendCredits, InsufficientCreditsError } from '@/lib/credits/spend-helper'
import { withRateLimit } from '@/lib/api/middleware/rate-limit'
import { safeLogger } from '@/lib/utils/safe-logger'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/backtest/queue
 * 백테스트 잡을 큐에 추가
 */
async function backtestQueueHandler(req: NextRequest) {
  try {
    const { strategyId, timeframe, startDate, endDate, symbol } = await req.json()

    // 1. 사용자 인증
    const userId = await requireUserId(req)

    // 2. 백테스트 기간에 따른 크레딧 비용 계산
    const startDateObj = new Date(startDate)
    const endDateObj = new Date(endDate)
    const durationDays = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24))
    const durationYears = durationDays / 365

    // 1년 이하: 3 크레딧, 1년 초과: 10 크레딧
    const BACKTEST_COST = durationYears <= 1 ? 3 : 10
    const creditFeature = durationYears <= 1 ? 'backtest_1y' : 'backtest_5y'

    safeLogger.info('[Backtest Queue] Credit calculation', {
      userId,
      durationDays,
      durationYears,
      creditCost: BACKTEST_COST,
    })

    // P-1 CRITICAL: 크레딧 소비 (API 요청 시점에 차감)
    try {
      await spendCredits({
        userId,
        feature: creditFeature,
        amount: BACKTEST_COST,
        metadata: {
          strategyId,
          timeframe,
          startDate,
          endDate,
          symbol: symbol || 'AAPL',
          durationDays,
        },
      })
    } catch (error) {
      if (error instanceof InsufficientCreditsError) {
        safeLogger.warn('[Backtest Queue] Insufficient credits', {
          userId,
          required: error.required,
          current: error.current,
        })
        return NextResponse.json(
          {
            error: 'INSUFFICIENT_CREDITS',
            message: '크레딧이 부족합니다',
            required: error.required,
            current: error.current,
          },
          { status: 402 }
        )
      }
      safeLogger.error('[Backtest Queue] Credit spend failed', { error })
      return NextResponse.json(
        { error: 'CREDIT_PROCESSING_ERROR' },
        { status: 500 }
      )
    }

    // 3. 전략 존재 확인
    const { data: strategy } = await supabaseAdmin
      .from('strategies')
      .select('id, name')
      .eq('id', strategyId)
      .eq('user_id', userId)
      .single()

    if (!strategy) {
      return NextResponse.json({ error: 'STRATEGY_NOT_FOUND' }, { status: 404 })
    }

    // 4. 큐에 추가
    const jobId = await addBacktestJob({
      strategyId,
      userId,
      backtestParams: {
        symbol: symbol || 'AAPL',
        startDate,
        endDate,
        initialCapital: 100000,
        commission: 0.001,
        slippage: 0.0005,
      },
      priority: 0,
      createdAt: Date.now(),
    })

    // 5. DB에 잡 기록
    const { error: rpcErr } = await supabaseAdmin.rpc('create_backtest_job', {
      p_user_id: userId,
      p_strategy_id: strategyId,
      p_job_id: jobId,
      p_timeframe: timeframe,
      p_start_date: startDate,
      p_end_date: endDate,
      p_symbol: symbol || 'AAPL',
    })

    if (rpcErr) {
      safeLogger.error('[Backtest Queue] Job creation error:', rpcErr)
      return NextResponse.json({ error: 'JOB_CREATION_FAILED' }, { status: 500 })
    }

    return NextResponse.json({
      jobId,
      status: 'queued',
      message: '백테스트가 큐에 추가되었습니다. 잠시 후 결과를 확인하세요.',
    })
  } catch (error) {
    safeLogger.error('[Backtest Queue] POST error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/backtest/queue?jobId=xxx
 * 잡 상태 조회
 */
async function backtestStatusHandler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json({ error: 'JOB_ID_REQUIRED' }, { status: 400 })
    }

    const userId = await requireUserId(req)

    // 1. DB에서 잡 조회 (권한 확인)
    const { data: job, error } = await supabaseAdmin
      .from('backtest_jobs')
      .select('*')
      .eq('job_id', jobId)
      .single()

    if (error || !job) {
      return NextResponse.json({ error: 'JOB_NOT_FOUND' }, { status: 404 })
    }

    if (job.user_id !== userId) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    }

    // 2. BullMQ에서 실시간 상태 조회
    const queueStatus = await getJobStatus(jobId)

    return NextResponse.json({
      jobId,
      status: job.status,
      progress: queueStatus.progress || 0,
      result: job.result,
      createdAt: job.created_at,
      completedAt: job.completed_at,
    })
  } catch (error) {
    safeLogger.error('[Backtest Queue] GET error:', error)
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}

/**
 * 사용자 인증 (TODO: 실제 구현)
 */
async function requireUserId(req: NextRequest): Promise<string> {
  const userId = req.headers.get('x-user-id')
  if (!userId) {
    throw new Error('UNAUTHORIZED')
  }
  return userId
}

// Apply rate limiting
export const POST = withRateLimit(backtestQueueHandler, { category: 'backtest' })
export const GET = withRateLimit(backtestStatusHandler, { category: 'api' })
