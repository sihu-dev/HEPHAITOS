# Loop 11 Load Test Guide

## 목표

- 동시 100명 백테스트 처리 검증
- 평균 대기시간 <30초 달성
- 처리 성공률 >= 95% 달성

## Prerequisites

### 1. Upstash Redis 설정

```bash
# .env.local 파일에 추가
UPSTASH_REDIS_URL=rediss://default:YOUR_PASSWORD@REGION.upstash.io:6379
```

참고: `.env.local.upstash-setup.md`

### 2. Supabase Service Role Key

```bash
# .env.local 확인
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Worker 프로세스 실행

```bash
# Terminal 1: Next.js 개발 서버
pnpm dev

# Terminal 2: Backtest Worker
pnpm worker
```

## 실행 방법

### 기본 테스트 (100개 작업)

```bash
npx tsx scripts/load-test-queue.ts
```

### 결과 해석

```
========================================
         Load Test Results
========================================

Total Jobs: 100
Completed:  98 (98.0%)
Failed:     2 (2.0%)
Pending:    0 (0.0%)

--- Wait Time Statistics ---
Average:    18.45s
Min:        2.31s
Max:        45.67s
Target:     <30s ✅

--- Process Time Statistics ---
Average:    5.23s

========================================

--- Goal Achievement ---
Average Wait < 30s: ✅ PASS
Success Rate >= 95%: ✅ PASS
========================================
```

### 성공 기준

| Metric | Target | Status |
|--------|--------|--------|
| Average Wait Time | < 30s | ✅ |
| Success Rate | >= 95% | ✅ |

## 문제 해결

### Error: Worker not running

```bash
# Worker 프로세스가 실행 중인지 확인
ps aux | grep "backtest-worker"

# Worker 재시작
pnpm worker
```

### Error: Redis connection failed

```bash
# .env.local에 UPSTASH_REDIS_URL이 설정되었는지 확인
grep UPSTASH_REDIS_URL .env.local

# Redis 연결 테스트
node -e "const IORedis = require('ioredis'); const redis = new IORedis(process.env.UPSTASH_REDIS_URL); redis.ping().then(console.log)"
# Expected: PONG
```

### Error: Too many pending jobs

```bash
# Redis에서 오래된 작업 정리
npx tsx scripts/clear-queue.ts
```

## 커스터마이징

### 작업 수 조정

```typescript
// scripts/load-test-queue.ts
const TOTAL_JOBS = 200 // 100 → 200으로 변경
```

### 배치 크기 조정

```typescript
const BATCH_SIZE = 20 // 10 → 20으로 변경 (서버 부하 증가)
```

### 타임아웃 조정

```typescript
// 5분 → 10분
setTimeout(() => {
  // ...
}, 10 * 60 * 1000)
```

## 성능 최적화 팁

### Worker Concurrency 증가

```bash
# .env.local
WORKER_CONCURRENCY=10 # 기본값 5 → 10
```

### Redis Connection Pool

```typescript
// backtest-worker.ts
const redis = new Redis(process.env.UPSTASH_REDIS_URL!, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: false,
  keepAlive: 30000, // Keep-alive 추가
})
```

### Rate Limiting 조정

```typescript
// backtest-queue.ts
limiter: {
  max: 20, // 10 → 20
  duration: 1000,
}
```

## 보고서

테스트 완료 후 자동으로 생성됨:

```bash
cat load-test-report.json
```

### 보고서 구조

```json
{
  "timestamp": "2025-12-22T12:00:00.000Z",
  "config": {
    "totalJobs": 100,
    "batchSize": 10
  },
  "stats": {
    "totalJobs": 100,
    "completed": 98,
    "failed": 2,
    "avgWaitTime": 18.45,
    "maxWaitTime": 45.67,
    "passWaitTime": true,
    "passSuccessRate": true
  },
  "results": [...]
}
```

## CI/CD 통합

### GitHub Actions 예시

```yaml
name: Loop 11 Load Test

on:
  push:
    branches: [main]

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: pnpm install
      - run: pnpm worker & # Worker 백그라운드 실행
      - run: npx tsx scripts/load-test-queue.ts
        env:
          UPSTASH_REDIS_URL: ${{ secrets.UPSTASH_REDIS_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
      - uses: actions/upload-artifact@v4
        with:
          name: load-test-report
          path: load-test-report.json
```

## 다음 단계

Load Test 통과 후:

1. Week 2 완료 체크 (TASKS.md)
2. Loop 11 전체 마무리
3. 베타 런칭 준비
