# HEPHAITOS Loop 11-15 실행 계획

> **기반**: GPT V1 피드백 재분석
> **작성일**: 2025-12-16
> **상태**: Loop 10 완료 → Loop 11-15 실행 대기

---

## 📊 Loop 1-10 완료 현황 요약

| Loop | 목표 | 완료 날짜 | P0 게이트 |
|------|------|----------|----------|
| Loop 1 | 크레딧 시스템 + 토스 결제 + 멱등성 | 2025-12-14 | ✅ P0-1 |
| Loop 2 | Rate Limit + Circuit Breaker | 2025-12-14 | ✅ P0-2 |
| Loop 3 | Safety Net v2 (연령/면책/금지표현) | 2025-12-14 | ✅ P0-3 |
| Loop 4 | Observability 설계 | 2025-12-14 | - |
| Loop 5 | Broker Abstraction (UnifiedBroker) | 2025-12-14 | - |
| Loop 6 | Strategy Builder UX | 2025-12-15 | - |
| Loop 7 | 모바일 반응형 + PWA | 2025-12-15 | - |
| Loop 8 | Nancy Pelosi 미러링 | 2025-12-15 | - |
| Loop 9 | AI 멘토 + 라이브 코칭 | 2025-12-15 | - |
| Loop 10 | 환불 정책 + 재무 v2 + ARPPU SQL + Attribution | 2025-12-16 | ✅ P0-4,5 |

**P0 게이트**: 5/5 완료 → 베타 출시 가능

---

## 🎯 Loop 11-15 실행 계획

### Loop 11: Observability + Cost Dashboard (P1)

**목표**: API 비용 추적 및 크레딧 원가 대시보드 구축

**GPT 피드백 원문**:
> "비용폭주 방지 핵심은 Observability. 요청당 토큰/비용/지연/실패율, 사용자별 비용 없으면 크레딧 모델이 원가 통제 불능"

**구현 항목**:

#### 11.1. AI 사용량 이벤트 확장
```sql
-- ai_usage_events 테이블 확장
alter table ai_usage_events
  add column if not exists tokens_input integer,
  add column if not exists tokens_output integer,
  add column if not exists model_used text,
  add column if not exists latency_ms integer,
  add column if not exists cost_estimate_krw decimal,
  add column if not exists success boolean default true,
  add column if not exists error_message text;
```

#### 11.2. 기능별 원가 계산 함수
```typescript
// src/lib/ai/cost-tracking.ts
export function calculateCost(
  model: 'gpt-4' | 'claude-sonnet-4' | 'gemini-pro',
  tokensIn: number,
  tokensOut: number
): number {
  const COST_PER_1K_TOKENS = {
    'gpt-4': { input: 30, output: 60 },           // USD
    'claude-sonnet-4': { input: 3, output: 15 },  // USD
    'gemini-pro': { input: 0.5, output: 1.5 },    // USD
  }

  const cost = model.input * tokensIn / 1000 + model.output * tokensOut / 1000
  return cost * 1300 // USD → KRW 환율
}
```

#### 11.3. Cost Dashboard SQL 뷰
```sql
-- 기능별 평균 원가
create or replace view feature_cost_summary as
select
  feature,
  count(*) as usage_count,
  avg(tokens_input) as avg_tokens_in,
  avg(tokens_output) as avg_tokens_out,
  avg(cost_estimate_krw) as avg_cost_krw,
  sum(cost_estimate_krw) as total_cost_krw
from ai_usage_events
where created_at > now() - interval '30 days'
group by feature;

-- 사용자별 월 비용
create or replace view user_monthly_cost as
select
  user_id,
  date_trunc('month', created_at) as month,
  count(*) as total_requests,
  sum(cost_estimate_krw) as total_cost,
  avg(cost_estimate_krw) as avg_cost_per_request
from ai_usage_events
group by user_id, date_trunc('month', created_at);
```

#### 11.4. Grafana/Metabase 대시보드 패널
- **원가 모니터링**:
  - 전략 생성 1회당 평균 원가 (목표: ₩100 이하)
  - MoA 평균 실패율 (목표: 5% 이하)
  - 백테스트 1회당 평균 원가 (목표: ₩50 이하)

- **비용 알림**:
  - 사용자별 월 ₩500 초과 시 알림
  - 전체 월 ₩500,000 초과 시 긴급 알림

**완료 기준**:
- [ ] `ai_usage_events` 테이블 확장 마이그레이션
- [ ] `feature_cost_summary`, `user_monthly_cost` SQL 뷰 생성
- [ ] Grafana 대시보드 3개 패널 구축
- [ ] 비용 알림 로직 구현 (Slack/Email)

**예상 소요**: 2일

---

### Loop 12: Backtest Job Queue (BullMQ) (P1)

**목표**: 백테스트 비동기 처리 및 재시도 로직 구현

**GPT 피드백 원문**:
> "백테스팅이 무거워지면 서버리스에서 큐(Queue)/잡 워커 구조가 필요"

**구현 항목**:

#### 12.1. BullMQ 설정
```typescript
// src/lib/queue/backtest-queue.ts
import { Queue, Worker } from 'bullmq'
import { Redis } from 'ioredis'

const redis = new Redis(process.env.UPSTASH_REDIS_URL!)

export const backtestQueue = new Queue('backtest-jobs', { connection: redis })

interface BacktestJobData {
  strategyId: string
  userId: string
  timeframe: string
  startDate: string
  endDate: string
  credits: number
}

// Worker (별도 프로세스 권장)
const backtestWorker = new Worker<BacktestJobData>(
  'backtest-jobs',
  async (job) => {
    const { strategyId, userId, timeframe, startDate, endDate, credits } = job.data

    // 1. 크레딧 차감 (원자적)
    await deductCredits(userId, credits, job.id)

    // 2. 백테스트 실행
    const result = await runBacktest({ strategyId, timeframe, startDate, endDate })

    // 3. 결과 저장
    await saveBacktestResult(userId, strategyId, result)

    return result
  },
  {
    connection: redis,
    concurrency: 5, // 동시 실행 5개
    attempts: 3,    // 실패 시 3회 재시도
    backoff: { type: 'exponential', delay: 5000 },
  }
)
```

#### 12.2. 크레딧 차감 멱등성
```sql
-- 백테스트 잡 테이블
create table backtest_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  strategy_id uuid not null,
  job_id text not null unique, -- BullMQ job ID
  status text not null check (status in ('queued','processing','completed','failed')),
  credits_deducted boolean default false,
  result jsonb,
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- 크레딧 차감 함수 (멱등)
create or replace function deduct_backtest_credits(
  p_user_id uuid,
  p_credits integer,
  p_job_id text
) returns void
language plpgsql
as $$
begin
  -- 이미 차감됐으면 skip
  if exists (select 1 from backtest_jobs where job_id = p_job_id and credits_deducted = true) then
    return;
  end if;

  -- 크레딧 차감
  insert into credit_transactions (user_id, type, amount, metadata)
  values (p_user_id, 'backtest', -p_credits, jsonb_build_object('job_id', p_job_id));

  update credit_wallets set balance = balance - p_credits where user_id = p_user_id;

  -- 차감 플래그
  update backtest_jobs set credits_deducted = true where job_id = p_job_id;
end;
$$;
```

#### 12.3. API 수정
```typescript
// src/app/api/backtest/route.ts (기존)
// 동기 처리 → 큐 추가로 변경

export async function POST(req: Request) {
  const { strategyId, timeframe, startDate, endDate } = await req.json()
  const userId = await requireUserId(req)

  // 크레딧 확인 (차감은 Worker에서)
  const { data: wallet } = await supabase
    .from('credit_wallets')
    .select('balance')
    .eq('user_id', userId)
    .single()

  const BACKTEST_COST = 3
  if (wallet.balance < BACKTEST_COST) {
    return NextResponse.json({ error: 'INSUFFICIENT_CREDITS' }, { status: 402 })
  }

  // 큐에 추가
  const job = await backtestQueue.add('run-backtest', {
    strategyId,
    userId,
    timeframe,
    startDate,
    endDate,
    credits: BACKTEST_COST,
  })

  // 잡 ID 반환 (프론트에서 폴링/SSE로 진행 상황 확인)
  return NextResponse.json({ jobId: job.id, status: 'queued' })
}
```

**완료 기준**:
- [ ] BullMQ 설치 및 Redis 연결
- [ ] `backtest-queue` Worker 구현
- [ ] 크레딧 차감 멱등성 RPC 함수
- [ ] 백테스트 API를 큐 기반으로 변경
- [ ] 진행 상황 조회 API (`GET /api/backtest/:jobId`)

**예상 소요**: 3일

---

### Loop 13: Strategy Performance Network Effect (P2)

**목표**: 전략 성과 데이터 축적 및 공유 플랫폼

**GPT 피드백 원문**:
> "지속 가능한 우위는 전략 성과 데이터 네트워크 효과. 어떤 프롬프트/전략이 어떤 시장에서 통했는지 축적"

**구현 항목**:

#### 13.1. 전략 성과 테이블
```sql
-- 전략 성과 기록
create table strategy_performance (
  id uuid primary key default gen_random_uuid(),
  strategy_id uuid not null references strategies(id),
  user_id uuid not null references auth.users(id),

  -- 성과 지표
  total_return decimal not null,
  sharpe_ratio decimal,
  max_drawdown decimal,
  win_rate decimal,
  total_trades integer,

  -- 시장 컨텍스트
  market_condition text, -- 'bull', 'bear', 'sideways'
  start_date date not null,
  end_date date not null,

  -- 익명화 공유
  is_public boolean default false,

  created_at timestamptz default now()
);

create index if not exists idx_strategy_performance_public on strategy_performance(is_public);
create index if not exists idx_strategy_performance_return on strategy_performance(total_return desc);
```

#### 13.2. 전략 랭킹 뷰
```sql
-- 공개 전략 랭킹 (익명)
create or replace view public_strategy_ranking as
select
  s.name,
  s.description,
  avg(sp.total_return) as avg_return,
  avg(sp.sharpe_ratio) as avg_sharpe,
  count(sp.id) as usage_count,
  max(sp.created_at) as last_used
from strategies s
join strategy_performance sp on sp.strategy_id = s.id
where sp.is_public = true
group by s.id, s.name, s.description
order by avg_return desc
limit 50;
```

#### 13.3. 전략 마켓플레이스 UI
```typescript
// src/app/dashboard/strategies/marketplace/page.tsx
export default function StrategyMarketplace() {
  const { data: topStrategies } = useSWR('/api/strategies/ranking')

  return (
    <div>
      <h1>전략 마켓플레이스</h1>
      <p>커뮤니티가 검증한 전략을 살펴보세요</p>

      {topStrategies.map(strategy => (
        <StrategyCard
          key={strategy.id}
          name={strategy.name}
          avgReturn={strategy.avg_return}
          avgSharpe={strategy.avg_sharpe}
          usageCount={strategy.usage_count}
          onCopy={() => copyStrategy(strategy.id)}
        />
      ))}
    </div>
  )
}
```

#### 13.4. 프롬프트 인사이트
```sql
-- 프롬프트 성과 집계 (익명)
create or replace view prompt_insights as
select
  -- 프롬프트 해시 (개인정보 보호)
  md5(s.prompt) as prompt_hash,
  count(distinct sp.user_id) as unique_users,
  avg(sp.total_return) as avg_return,
  avg(sp.sharpe_ratio) as avg_sharpe,
  count(sp.id) as total_runs
from strategies s
join strategy_performance sp on sp.strategy_id = s.id
where sp.is_public = true
group by md5(s.prompt)
having count(sp.id) >= 5  -- 최소 5회 이상 사용된 프롬프트만
order by avg_return desc;
```

**완료 기준**:
- [ ] `strategy_performance` 테이블 생성
- [ ] 백테스트 완료 시 성과 자동 기록
- [ ] 전략 랭킹 API (`GET /api/strategies/ranking`)
- [ ] 마켓플레이스 UI 구현
- [ ] 프롬프트 인사이트 대시보드 (관리자용)

**예상 소요**: 4일

---

### Loop 14: Webhook Event System (P1)

**목표**: 토스 웹훅 재처리 및 이벤트 로깅 완성

**GPT 피드백 원문**:
> "웹훅 이벤트 저장(재처리/증적). Confirm 실패 시에도 최종 정합성 맞추는 용도"

**구현 항목**:

#### 14.1. 웹훅 엔드포인트
```typescript
// src/app/api/payments/webhook/toss/route.ts
export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get('toss-signature')

  // 1. 서명 검증
  if (!verifyTossSignature(body, signature)) {
    return NextResponse.json({ error: 'INVALID_SIGNATURE' }, { status: 401 })
  }

  const payload = JSON.parse(body)
  const eventId = payload.eventId || crypto.randomUUID()

  // 2. 웹훅 이벤트 저장
  const { error } = await supabaseAdmin.from('payment_webhook_events').insert({
    provider: 'toss',
    event_id: eventId,
    order_id: payload.orderId,
    payload,
    process_status: 'pending',
  })

  if (error && error.code === '23505') {
    // 중복 이벤트 (멱등)
    return NextResponse.json({ received: true })
  }

  // 3. 비동기 처리 큐에 추가
  await webhookQueue.add('process-toss-webhook', { eventId })

  return NextResponse.json({ received: true })
}
```

#### 14.2. 웹훅 재처리 로직
```typescript
// src/lib/queue/webhook-worker.ts
const webhookWorker = new Worker('webhook-processing', async (job) => {
  const { eventId } = job.data

  const { data: event } = await supabase
    .from('payment_webhook_events')
    .select('*')
    .eq('event_id', eventId)
    .single()

  if (event.process_status !== 'pending') {
    return // 이미 처리됨
  }

  try {
    // Confirm API가 실패했을 때 웹훅으로 보완
    await supabase.rpc('grant_credits_for_paid_order', {
      p_order_id: event.order_id,
      p_payment_key: event.payload.paymentKey,
      p_paid_amount: event.payload.totalAmount,
      p_raw: event.payload,
    })

    // 성공
    await supabase
      .from('payment_webhook_events')
      .update({ process_status: 'processed', processed_at: new Date() })
      .eq('event_id', eventId)
  } catch (err) {
    await supabase
      .from('payment_webhook_events')
      .update({ process_status: 'failed', error: err.message })
      .eq('event_id', eventId)

    throw err // 재시도
  }
})
```

**완료 기준**:
- [ ] `/api/payments/webhook/toss` 엔드포인트
- [ ] 토스 서명 검증 함수
- [ ] 웹훅 재처리 Worker
- [ ] 실패 이벤트 재시도 (3회, exponential backoff)

**예상 소요**: 2일

---

### Loop 15: E2E Testing (Playwright) (P1)

**목표**: 핵심 플로우 E2E 테스트 작성

**GPT 피드백 원문**:
> "테스트 최소세트: 결제, 크레딧 차감, 브로커 주문, Safety Net 출력"

**구현 항목**:

#### 15.1. 결제 멱등성 테스트
```typescript
// tests/e2e/payment.spec.ts
import { test, expect } from '@playwright/test'

test('결제 멱등성: 동일 웹훅 3회 → 크레딧 1번만 지급', async ({ page }) => {
  await page.goto('/pricing')
  await page.click('text=스타터 100')

  // 결제 완료 (Mock Toss)
  await page.click('text=결제하기')
  await page.waitForURL('/payments/success')

  // 웹훅 3회 전송 (서버 직접 호출)
  for (let i = 0; i < 3; i++) {
    await fetch('http://localhost:3000/api/payments/webhook/toss', {
      method: 'POST',
      body: JSON.stringify(mockWebhookPayload),
    })
  }

  // 크레딧 확인
  const balance = await page.locator('[data-testid="credit-balance"]').textContent()
  expect(balance).toBe('100') // 300이 아님
})
```

#### 15.2. Rate Limiting 테스트
```typescript
// tests/e2e/rate-limit.spec.ts
test('Rate Limit: 100 req/10min 초과 시 429', async ({ request }) => {
  const userId = 'test-user-123'

  // 100회 요청
  for (let i = 0; i < 100; i++) {
    await request.post('/api/ai/strategy', {
      headers: { 'x-user-id': userId },
      data: { prompt: 'test' },
    })
  }

  // 101번째 요청 → 429
  const res = await request.post('/api/ai/strategy', {
    headers: { 'x-user-id': userId },
    data: { prompt: 'test' },
  })

  expect(res.status()).toBe(429)
})
```

#### 15.3. Safety Net 테스트
```typescript
// tests/e2e/safety-net.spec.ts
test('Safety Net: 금지 표현 차단', async ({ page }) => {
  await page.goto('/dashboard/ai-strategy')
  await page.fill('textarea', '이 종목은 반드시 오릅니다. 수익 보장합니다.')
  await page.click('text=생성')

  // 경고 모달 확인
  await expect(page.locator('text=투자 조언 금지')).toBeVisible()
})
```

**완료 기준**:
- [ ] 결제 멱등성 E2E 테스트
- [ ] Rate Limiting E2E 테스트
- [ ] Safety Net E2E 테스트
- [ ] 브로커 주문 E2E 테스트 (Mock KIS)
- [ ] CI에서 자동 실행 (GitHub Actions)

**예상 소요**: 3일

---

## 📈 Loop 11-15 실행 타임라인

| 기간 | Loop | 우선순위 | 담당 |
|------|------|---------|------|
| Week 1 (12/17-12/23) | Loop 11 (Observability) | P1 | Backend |
| Week 2 (12/24-12/30) | Loop 12 (Backtest Queue) | P1 | Backend |
| Week 3 (12/31-01/06) | Loop 14 (Webhook System) | P1 | Backend |
| Week 4 (01/07-01/13) | Loop 15 (E2E Testing) | P1 | QA |
| Week 5 (01/14-01/20) | Loop 13 (Network Effect) | P2 | Full Stack |

---

## 🎯 Loop 11-15 완료 시 달성되는 것

1. **비용 통제**: 기능별 원가 투명화, 비정상 사용 감지
2. **안정성**: 백테스트 비동기 처리, 재시도 로직
3. **네트워크 효과**: 전략 성과 데이터 축적, 경쟁 우위
4. **정합성**: 웹훅 재처리, 결제 최종 정합성 보장
5. **품질 보증**: E2E 테스트 자동화, 회귀 방지

---

## ✅ Loop 11-15 실행 승인

**현재 상태**: Loop 10 완료 (P0 게이트 5/5)
**다음 단계**: Loop 11 (Observability) 착수

**승인 권고**: ✅ **Loop 11부터 순차 진행**

---

*문서 생성일: 2025-12-16*
*작성자: Claude Code (Sonnet 4.5)*
*버전: Loop 11-15 Plan v1*
