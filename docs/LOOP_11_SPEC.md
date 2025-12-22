# Loop 11: 백테스트 큐 시스템 상세 스펙

> **Version**: 2.0
> **Date**: 2025-12-22
> **Status**: 🔄 In Progress
> **Priority**: P0 (베타 블로커)

---

## 1. 개요

### 1.1 문제 정의

**현재 상황**:
- 백테스트가 동기식으로 실행되어 10명 이상 동시 접속 시 서버 과부하
- 평균 백테스트 시간 2-5분 × 10명 = 20-50분 대기
- 진행 상황 표시 없음 → 사용자 이탈률 증가
- Worker 장애 시 복구 메커니즘 없음

**목표**:
- 동시 100명 백테스트 처리 (현재 10명 → 10배 향상)
- 평균 대기시간 <30초
- 실시간 진행률 표시 (WebSocket)
- Worker 자동 복구 및 재시도

### 1.2 ROI 분석

| 항목 | 개선 전 | 개선 후 | 효과 |
|------|---------|---------|------|
| 동시 사용자 | 10명 | 100명 | **10배** |
| 평균 대기시간 | 5분 | <30초 | **10배 개선** |
| 서버 비용 | $200/월 | $150/월 | **25% 절감** |
| 사용자 이탈률 | 45% | <15% | **67% 감소** |

**투자 회수 기간**: 첫 달 (33배 ROI)

---

## 2. 시스템 아키텍처

### 2.1 전체 플로우

```
┌──────────────────────────────────────────────────────────────────┐
│                     백테스트 큐 시스템 플로우                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Frontend]                                                      │
│     │                                                            │
│     │ POST /api/backtest/queue                                   │
│     ├──────────────────────────────────────────────────────────► │
│     │                                                            │
│  [API Route]                                                     │
│     │                                                            │
│     │ addBacktestJob()                                           │
│     ├──────────────────────────────────────────────────────────► │
│     │                                                            │
│  [BullMQ Queue] (Upstash Redis)                                  │
│     │                                                            │
│     │ Job: { userId, strategyId, params, priority }              │
│     ├──────────────────────────────────────────────────────────► │
│     │                                                            │
│  [Worker Process]                                                │
│     │                                                            │
│     │ 1. 데이터 다운로드 (0-20%)                                  │
│     │ 2. 지표 계산 (20-50%)                                       │
│     │ 3. 백테스트 실행 (50-90%)                                   │
│     │ 4. 결과 저장 (90-100%)                                      │
│     │                                                            │
│     │ 진행률 업데이트 → Supabase Realtime                         │
│     ├──────────────────────────────────────────────────────────► │
│     │                                                            │
│  [Supabase Realtime]                                             │
│     │                                                            │
│     │ WebSocket Push                                             │
│     └──────────────────────────────────────────────────────────► │
│                                                                  │
│  [Frontend] <BacktestProgress />                                 │
│     │                                                            │
│     │ "Processing... 67%"                                        │
│     │ ████████████░░░░░░                                         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 기술 스택

| 레이어 | 기술 | 역할 |
|--------|------|------|
| **Queue** | BullMQ | Job 스케줄링, 우선순위 관리 |
| **Storage** | Upstash Redis | 큐 데이터 저장 (Serverless) |
| **Worker** | Node.js Worker | 백테스트 실행 엔진 |
| **Realtime** | Supabase Realtime | 진행률 WebSocket 푸시 |
| **Frontend** | React + TanStack Query | 실시간 진행률 구독 |

---

## 3. 데이터 모델

### 3.1 BacktestJobData (Queue 입력)

```typescript
export interface BacktestJobData {
  userId: string              // 사용자 ID
  strategyId: string          // 전략 ID
  params: {
    symbol: string            // 종목 코드 (예: "AAPL")
    startDate: string         // 시작일 "2020-01-01"
    endDate: string           // 종료일 "2025-12-22"
    initialCapital: number    // 초기 자본 (예: 10000)
  }
  priority: number            // 1-10 (10이 최고 우선순위)
}
```

### 3.2 BacktestJobResult (Queue 출력)

```typescript
export interface BacktestJobResult {
  status: 'completed' | 'failed'
  metrics?: {
    // 성과 지표
    sharpeRatio: number       // 샤프 비율
    cagr: number              // 연평균 성장률
    maxDrawdown: number       // 최대 낙폭
    winRate: number           // 승률
    totalTrades: number       // 총 거래 수
    profitFactor: number      // 이익 팩터
  }
  error?: string              // 에러 메시지
}
```

### 3.3 BacktestProgress (Realtime 업데이트)

```typescript
export interface BacktestProgress {
  jobId: string
  userId: string
  status: 'waiting' | 'processing' | 'completed' | 'failed'
  progress: number            // 0-100
  currentStep: string         // "데이터 다운로드 중..."
  estimatedTimeRemaining?: number  // 초 단위
}
```

---

## 4. 구현 상세

### 4.1 Week 1: 기초 인프라 (12/22-12/28)

#### Task 1: Upstash Redis 계정 설정 (30분)

**Step 1**: Upstash 계정 생성
- https://console.upstash.com/login
- GitHub OAuth 로그인

**Step 2**: Redis 데이터베이스 생성
- Region: Seoul (ap-northeast-2)
- Type: Regional (Edge는 비싸고 불필요)
- Eviction: noeviction (데이터 손실 방지)

**Step 3**: 환경 변수 설정
```bash
# .env.local
UPSTASH_REDIS_URL=rediss://default:***@***-seoul-1.upstash.io:6379
```

**Step 4**: 연결 테스트
```bash
node -e "const IORedis = require('ioredis'); const redis = new IORedis(process.env.UPSTASH_REDIS_URL); redis.ping().then(console.log)"
# Expected: PONG
```

#### Task 2: API Route 구현 (2시간)

**파일**: `src/app/api/backtest/queue/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { addBacktestJob, getQueueMetrics } from '@/lib/queue'
import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

// 입력 검증 스키마
const BacktestRequestSchema = z.object({
  strategyId: z.string().uuid(),
  params: z.object({
    symbol: z.string().min(1).max(10),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    initialCapital: z.number().min(100).max(10000000),
  }),
  priority: z.number().min(1).max(10).default(5),
})

export async function POST(request: NextRequest) {
  try {
    // 1. 인증 확인
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. 입력 검증
    const body = await request.json()
    const validated = BacktestRequestSchema.parse(body)

    // 3. 큐에 Job 추가
    const jobId = await addBacktestJob({
      userId: user.id,
      strategyId: validated.strategyId,
      params: validated.params,
      priority: validated.priority,
    })

    // 4. 초기 진행 상태 저장
    await supabase.from('backtest_progress').insert({
      job_id: jobId,
      user_id: user.id,
      status: 'waiting',
      progress: 0,
      current_step: 'Queued',
    })

    return NextResponse.json({
      jobId,
      status: 'queued',
      estimatedWaitTime: 30, // TODO: 실제 큐 길이 기반 계산
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Queue API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // 큐 상태 조회
    const metrics = await getQueueMetrics()

    return NextResponse.json({
      waiting: metrics.waiting,
      active: metrics.active,
      estimatedWaitTime: Math.ceil(metrics.waiting * 2.5), // 평균 2.5분/job
    })
  } catch (error) {
    console.error('Queue Metrics Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}
```

#### Task 3: Worker 프로세스 구현 (4시간)

**파일**: `src/workers/backtest-worker.ts`

```typescript
import { Worker, Job } from 'bullmq'
import IORedis from 'ioredis'
import { BacktestJobData, BacktestJobResult } from '@/lib/queue'
import { createClient } from '@supabase/supabase-js'
import { runBacktest } from '@/lib/backtest/engine' // 기존 백테스트 로직

const connection = new IORedis(process.env.UPSTASH_REDIS_URL || '', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Worker는 Service Role 사용
)

const worker = new Worker<BacktestJobData, BacktestJobResult>(
  'backtest-queue',
  async (job: Job<BacktestJobData>) => {
    const { userId, strategyId, params } = job.data

    try {
      // 1. 데이터 다운로드 (0-20%)
      await updateProgress(job.id!, userId, 10, '데이터 다운로드 중...')
      const marketData = await fetchMarketData(params.symbol, params.startDate, params.endDate)

      // 2. 지표 계산 (20-50%)
      await updateProgress(job.id!, userId, 35, '기술 지표 계산 중...')
      const indicators = await calculateIndicators(marketData)

      // 3. 백테스트 실행 (50-90%)
      await updateProgress(job.id!, userId, 70, '백테스트 실행 중...')
      const result = await runBacktest({
        strategyId,
        marketData,
        indicators,
        initialCapital: params.initialCapital,
      })

      // 4. 결과 저장 (90-100%)
      await updateProgress(job.id!, userId, 95, '결과 저장 중...')
      await supabase.from('backtest_results').insert({
        user_id: userId,
        strategy_id: strategyId,
        job_id: job.id,
        metrics: result.metrics,
        trades: result.trades,
      })

      await updateProgress(job.id!, userId, 100, '완료', 'completed')

      return {
        status: 'completed',
        metrics: result.metrics,
      }
    } catch (error) {
      console.error(`Backtest Job ${job.id} failed:`, error)

      await updateProgress(
        job.id!,
        userId,
        0,
        '오류 발생',
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      )

      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  },
  {
    connection,
    concurrency: 5, // 동시 5개 처리
    limiter: {
      max: 10,      // 10초당
      duration: 10000, // 최대 10개 처리
    },
  }
)

async function updateProgress(
  jobId: string,
  userId: string,
  progress: number,
  currentStep: string,
  status: 'waiting' | 'processing' | 'completed' | 'failed' = 'processing',
  error?: string
) {
  await supabase.from('backtest_progress').upsert({
    job_id: jobId,
    user_id: userId,
    status,
    progress,
    current_step: currentStep,
    error,
    updated_at: new Date().toISOString(),
  })
}

worker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed`)
})

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message)
})

console.log('🚀 Backtest Worker started')
```

**실행 방법**:
```bash
# package.json
{
  "scripts": {
    "worker": "tsx src/workers/backtest-worker.ts"
  }
}

# 실행
pnpm worker
```

---

### 4.2 Week 2: 실시간 통합 (12/29-1/5)

#### Task 4: Supabase Realtime 채널 설정 (2시간)

**Step 1**: 데이터베이스 테이블 생성

```sql
-- backtest_progress 테이블
CREATE TABLE backtest_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL CHECK (status IN ('waiting', 'processing', 'completed', 'failed')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  current_step TEXT NOT NULL,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_backtest_progress_user_id ON backtest_progress(user_id);
CREATE INDEX idx_backtest_progress_job_id ON backtest_progress(job_id);

-- RLS 정책
ALTER TABLE backtest_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON backtest_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert/update"
  ON backtest_progress FOR ALL
  USING (auth.role() = 'service_role');

-- Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE backtest_progress;
```

**Step 2**: Worker에서 Realtime 푸시

위의 `updateProgress()` 함수가 자동으로 Realtime 푸시됨 (upsert 시 자동)

#### Task 5: Frontend 구독 컴포넌트 (3시간)

**파일**: `src/components/backtest/BacktestProgress.tsx`

```tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/utils'

interface BacktestProgressProps {
  jobId: string
  onComplete?: (result: any) => void
}

export function BacktestProgress({ jobId, onComplete }: BacktestProgressProps) {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<'waiting' | 'processing' | 'completed' | 'failed'>('waiting')
  const [currentStep, setCurrentStep] = useState('Initializing...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    // 1. 초기 상태 로드
    supabase
      .from('backtest_progress')
      .select('*')
      .eq('job_id', jobId)
      .single()
      .then(({ data }) => {
        if (data) {
          setProgress(data.progress)
          setStatus(data.status)
          setCurrentStep(data.current_step)
          setError(data.error)
        }
      })

    // 2. Realtime 구독
    const channel = supabase
      .channel(`backtest:${jobId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'backtest_progress',
          filter: `job_id=eq.${jobId}`,
        },
        (payload) => {
          const data = payload.new as any
          setProgress(data.progress)
          setStatus(data.status)
          setCurrentStep(data.current_step)
          setError(data.error)

          if (data.status === 'completed' && onComplete) {
            onComplete(data)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [jobId, onComplete])

  return (
    <div className="w-full max-w-md p-6 bg-white/[0.02] border border-white/[0.06] rounded-xl">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white">
          {status === 'completed' ? '✅ Complete' : status === 'failed' ? '❌ Failed' : '🔄 Running'}
        </h3>
        {status === 'processing' && <Spinner size="sm" variant="primary" />}
      </div>

      {/* 진행률 바 */}
      <div className="mb-3">
        <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-500',
              status === 'completed'
                ? 'bg-emerald-500'
                : status === 'failed'
                ? 'bg-red-500'
                : 'bg-primary-500'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-zinc-400 text-right">{progress}%</p>
      </div>

      {/* 현재 단계 */}
      <p className="text-sm text-zinc-300">{currentStep}</p>

      {/* 에러 메시지 */}
      {error && (
        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}
    </div>
  )
}
```

**사용 예시**:
```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { BacktestProgress } from '@/components/backtest/BacktestProgress'

export function BacktestRunner() {
  const [jobId, setJobId] = useState<string | null>(null)

  const handleStart = async () => {
    const response = await fetch('/api/backtest/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        strategyId: 'uuid-here',
        params: {
          symbol: 'AAPL',
          startDate: '2020-01-01',
          endDate: '2025-12-22',
          initialCapital: 10000,
        },
        priority: 5,
      }),
    })

    const data = await response.json()
    setJobId(data.jobId)
  }

  return (
    <div>
      {!jobId ? (
        <Button onClick={handleStart}>Start Backtest</Button>
      ) : (
        <BacktestProgress
          jobId={jobId}
          onComplete={(result) => {
            console.log('Backtest completed:', result)
            // 결과 페이지로 이동
          }}
        />
      )}
    </div>
  )
}
```

---

## 5. 테스트 계획

### 5.1 부하 테스트 (2시간)

**도구**: k6 (https://k6.io/)

**시나리오**: 100명 동시 백테스트 제출

```javascript
// k6-load-test.js
import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp-up to 50 users
    { duration: '2m', target: 100 },  // Ramp-up to 100 users
    { duration: '3m', target: 100 },  // Stay at 100 users
    { duration: '1m', target: 0 },    // Ramp-down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'], // 95% 요청이 3초 이내
    http_req_failed: ['rate<0.1'],     // 실패율 10% 이하
  },
}

export default function () {
  const payload = JSON.stringify({
    strategyId: '123e4567-e89b-12d3-a456-426614174000',
    params: {
      symbol: 'AAPL',
      startDate: '2020-01-01',
      endDate: '2025-12-22',
      initialCapital: 10000,
    },
    priority: 5,
  })

  const response = http.post(
    'https://hephaitos.vercel.app/api/backtest/queue',
    payload,
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${__ENV.AUTH_TOKEN}`,
      },
    }
  )

  check(response, {
    'status is 200': (r) => r.status === 200,
    'has jobId': (r) => JSON.parse(r.body).jobId !== undefined,
  })

  sleep(1)
}
```

**실행**:
```bash
k6 run k6-load-test.js
```

**예상 결과**:
- ✅ 100명 동시 처리 가능
- ✅ p95 응답시간 <3초
- ✅ 실패율 <10%

---

## 6. 모니터링

### 6.1 BullMQ Admin UI

**설치**:
```bash
pnpm add @bull-board/api @bull-board/nextjs
```

**파일**: `src/app/api/admin/queues/[[...slug]]/route.ts`

```typescript
import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { NextAdapter } from '@bull-board/nextjs'
import { backtestQueue } from '@/lib/queue'

const serverAdapter = new NextAdapter()

createBullBoard({
  queues: [new BullMQAdapter(backtestQueue)],
  serverAdapter,
})

serverAdapter.setBasePath('/api/admin/queues')

export const GET = serverAdapter.registerPlugin()
export const POST = serverAdapter.registerPlugin()
```

**접속**: https://hephaitos.vercel.app/api/admin/queues

### 6.2 Upstash 대시보드

- Queue 길이: https://console.upstash.com/redis/{db-id}/browser
- 메모리 사용량: https://console.upstash.com/redis/{db-id}/metrics

---

## 7. 배포 체크리스트

### 7.1 Week 1 완료 기준

- [ ] Upstash Redis 연결 성공 (PONG 응답)
- [ ] `/api/backtest/queue` POST 200 응답
- [ ] Worker 프로세스 정상 실행
- [ ] 진행률 업데이트 Supabase에 저장 확인

### 7.2 Week 2 완료 기준

- [ ] Realtime 채널 구독 성공
- [ ] `<BacktestProgress />` 컴포넌트 렌더링
- [ ] 부하 테스트 통과 (100명, p95 <3초)
- [ ] BullMQ Admin UI 접속 가능

---

## 8. FAQ

### Q1: Worker를 어디에 배포하나요?
**A**: Vercel에서는 Worker를 직접 실행할 수 없으므로 다음 중 선택:
- **Option A**: Railway.app (추천) - $5/월, 자동 재시작
- **Option B**: Render.com - 무료 티어 가능
- **Option C**: AWS Lambda (Scheduled) - 복잡하지만 저렴

### Q2: Upstash 비용은?
**A**: Free Tier - 10,000 commands/day (충분함)
- 초과 시: Pay-as-you-go $0.2 per 100K commands

### Q3: Realtime 동시 접속 제한은?
**A**: Supabase Free Tier - 200 동시 접속
- Pro Plan ($25/월) - 500 동시 접속

---

*이 문서는 Loop 11 구현의 단일 소스(SSOT)입니다.*
*구현 중 변경사항은 이 문서에 즉시 반영합니다.*
