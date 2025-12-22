#!/usr/bin/env tsx

/**
 * Loop 11 Load Test - Backtest Queue System
 *
 * 목표: 동시 100명 백테스트 처리 검증
 *
 * 테스트 시나리오:
 * 1. 100개의 백테스트 작업을 동시에 큐에 추가
 * 2. 평균 대기시간 측정
 * 3. 처리 성공률 측정
 * 4. Worker 장애 복구 테스트
 *
 * 실행:
 * npx tsx scripts/load-test-queue.ts
 */

import { createClient } from '@supabase/supabase-js'

const TOTAL_JOBS = 100
const BATCH_SIZE = 10 // 동시 요청 배치 크기
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface LoadTestResult {
  jobId: string
  submitTime: number
  startTime?: number
  completeTime?: number
  waitTime?: number // 대기 시간 (ms)
  processTime?: number // 처리 시간 (ms)
  status: 'submitted' | 'active' | 'completed' | 'failed'
  error?: string
}

const results: LoadTestResult[] = []

/**
 * 백테스트 작업 생성
 */
async function createBacktestJob(index: number): Promise<LoadTestResult> {
  const submitTime = Date.now()

  try {
    const response = await fetch('http://localhost:3000/api/backtest/queue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 테스트용 인증 토큰 (실제 환경에서는 유효한 토큰 필요)
      },
      body: JSON.stringify({
        strategyId: `test-strategy-${index}`,
        timeframe: '1d',
        startDate: '2020-01-01',
        endDate: '2024-12-31',
        symbol: 'AAPL',
      }),
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    const data = await response.json()

    return {
      jobId: data.jobId,
      submitTime,
      status: 'submitted',
    }
  } catch (error) {
    console.error(`[Job ${index}] Submit failed:`, error)
    return {
      jobId: `failed-${index}`,
      submitTime,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 작업 상태 모니터링
 */
async function monitorJob(result: LoadTestResult): Promise<void> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  return new Promise((resolve) => {
    const channel = supabase
      .channel(`test-${result.jobId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'backtest_jobs',
          filter: `job_id=eq.${result.jobId}`,
        },
        (payload) => {
          const data = payload.new as any

          // 첫 active 전환 시 대기 시간 기록
          if (data.status === 'active' && !result.startTime) {
            result.startTime = Date.now()
            result.waitTime = result.startTime - result.submitTime
            result.status = 'active'
            console.log(`[${result.jobId}] Started (wait: ${result.waitTime}ms)`)
          }

          // 완료 시 처리 시간 기록
          if (data.status === 'completed') {
            result.completeTime = Date.now()
            result.processTime = result.startTime
              ? result.completeTime - result.startTime
              : 0
            result.status = 'completed'
            console.log(`[${result.jobId}] Completed (process: ${result.processTime}ms)`)
            channel.unsubscribe()
            resolve()
          }

          // 실패 시 기록
          if (data.status === 'failed') {
            result.status = 'failed'
            result.error = data.result?.error || 'Unknown error'
            console.error(`[${result.jobId}] Failed:`, result.error)
            channel.unsubscribe()
            resolve()
          }
        }
      )
      .subscribe()

    // 타임아웃 (5분)
    setTimeout(() => {
      console.warn(`[${result.jobId}] Timeout (5 minutes)`)
      channel.unsubscribe()
      resolve()
    }, 5 * 60 * 1000)
  })
}

/**
 * 통계 계산
 */
function calculateStats() {
  const completed = results.filter((r) => r.status === 'completed')
  const failed = results.filter((r) => r.status === 'failed')
  const pending = results.filter(
    (r) => r.status !== 'completed' && r.status !== 'failed'
  )

  const waitTimes = completed.map((r) => r.waitTime || 0).filter((t) => t > 0)
  const processTimes = completed
    .map((r) => r.processTime || 0)
    .filter((t) => t > 0)

  const avgWaitTime = waitTimes.length
    ? waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length
    : 0
  const maxWaitTime = waitTimes.length ? Math.max(...waitTimes) : 0
  const minWaitTime = waitTimes.length ? Math.min(...waitTimes) : 0

  const avgProcessTime = processTimes.length
    ? processTimes.reduce((a, b) => a + b, 0) / processTimes.length
    : 0

  console.log('\n========================================')
  console.log('         Load Test Results')
  console.log('========================================\n')
  console.log(`Total Jobs: ${TOTAL_JOBS}`)
  console.log(`Completed:  ${completed.length} (${((completed.length / TOTAL_JOBS) * 100).toFixed(1)}%)`)
  console.log(`Failed:     ${failed.length} (${((failed.length / TOTAL_JOBS) * 100).toFixed(1)}%)`)
  console.log(`Pending:    ${pending.length} (${((pending.length / TOTAL_JOBS) * 100).toFixed(1)}%)`)
  console.log('\n--- Wait Time Statistics ---')
  console.log(`Average:    ${(avgWaitTime / 1000).toFixed(2)}s`)
  console.log(`Min:        ${(minWaitTime / 1000).toFixed(2)}s`)
  console.log(`Max:        ${(maxWaitTime / 1000).toFixed(2)}s`)
  console.log(`Target:     <30s ✅`)
  console.log('\n--- Process Time Statistics ---')
  console.log(`Average:    ${(avgProcessTime / 1000).toFixed(2)}s`)
  console.log('\n========================================')

  // 목표 달성 여부
  const passWaitTime = avgWaitTime < 30000
  const passSuccessRate = (completed.length / TOTAL_JOBS) * 100 >= 95

  console.log('\n--- Goal Achievement ---')
  console.log(`Average Wait < 30s: ${passWaitTime ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`Success Rate >= 95%: ${passSuccessRate ? '✅ PASS' : '❌ FAIL'}`)
  console.log('========================================\n')

  return {
    totalJobs: TOTAL_JOBS,
    completed: completed.length,
    failed: failed.length,
    pending: pending.length,
    avgWaitTime: avgWaitTime / 1000,
    maxWaitTime: maxWaitTime / 1000,
    minWaitTime: minWaitTime / 1000,
    avgProcessTime: avgProcessTime / 1000,
    passWaitTime,
    passSuccessRate,
  }
}

/**
 * 메인 로드 테스트 실행
 */
async function runLoadTest() {
  console.log('========================================')
  console.log('   Loop 11 Queue Load Test Starting')
  console.log('========================================\n')
  console.log(`Target: ${TOTAL_JOBS} concurrent jobs`)
  console.log(`Goal: Average wait time < 30 seconds`)
  console.log(`Goal: Success rate >= 95%\n`)
  console.log('⚠️  Make sure worker is running: pnpm worker\n')

  const startTime = Date.now()

  // 배치로 작업 제출 (서버 부하 방지)
  for (let i = 0; i < TOTAL_JOBS; i += BATCH_SIZE) {
    const batch = Array.from({ length: Math.min(BATCH_SIZE, TOTAL_JOBS - i) }, (_, j) =>
      createBacktestJob(i + j)
    )

    const batchResults = await Promise.all(batch)
    results.push(...batchResults)

    console.log(`[Submit] Batch ${i / BATCH_SIZE + 1}/${Math.ceil(TOTAL_JOBS / BATCH_SIZE)} submitted`)

    // 배치 간 짧은 딜레이
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  console.log(`\n✅ All ${TOTAL_JOBS} jobs submitted\n`)

  // 모든 작업 모니터링
  console.log('⏳ Monitoring job progress...\n')
  await Promise.all(results.map(monitorJob))

  const totalTime = (Date.now() - startTime) / 1000
  console.log(`\n⏱️  Total test time: ${totalTime.toFixed(2)}s\n`)

  // 통계 출력
  const stats = calculateStats()

  // 결과 파일 저장
  const reportPath = './load-test-report.json'
  const fs = await import('fs/promises')
  await fs.writeFile(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        config: { totalJobs: TOTAL_JOBS, batchSize: BATCH_SIZE },
        stats,
        results,
      },
      null,
      2
    )
  )

  console.log(`📊 Detailed report saved to: ${reportPath}\n`)
}

// 실행
runLoadTest().catch((error) => {
  console.error('Load test failed:', error)
  process.exit(1)
})
