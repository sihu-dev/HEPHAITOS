# Upstash Redis 프로덕션 설정 및 검증 가이드

> **Loop 11 백테스트 큐 시스템 실전 배포 가이드**
> **작성일**: 2025-12-22
> **목표**: 동시 100명 백테스트 처리 검증

---

## 📋 목차

1. [Upstash 계정 설정](#upstash-계정-설정)
2. [Redis 데이터베이스 생성](#redis-데이터베이스-생성)
3. [환경 변수 설정](#환경-변수-설정)
4. [연결 테스트](#연결-테스트)
5. [부하 테스트 실행](#부하-테스트-실행)
6. [성능 검증](#성능-검증)
7. [모니터링 설정](#모니터링-설정)
8. [트러블슈팅](#트러블슈팅)

---

## Upstash 계정 설정

### Step 1: 회원가입

1. **Upstash 접속**
   - URL: https://console.upstash.com
   - "Sign Up" 클릭

2. **인증 방법 선택**
   ```
   옵션 1: GitHub OAuth (권장)
   옵션 2: Google OAuth
   옵션 3: 이메일 가입
   ```

3. **계정 생성 완료**
   - 이메일 인증 (선택한 방법에 따라)
   - 대시보드 접속 확인

### Step 2: 플랜 선택

**Private Beta 권장 플랜**: **Pay as you go**

| 플랜 | 비용 | 포함 사항 | 추천 |
|------|------|----------|------|
| **Free** | $0/월 | 10K 명령/일, 256MB | 개발 전용 |
| **Pay as you go** | ~$10/월 | 무제한 요청, 사용량 기반 | ✅ **Private Beta** |
| **Pro** | $280/월 | 전용 인스턴스 | Public Beta 이후 |

**Private Beta (50명) 예상 비용**:
```
- 일일 백테스트: 50명 × 3회 = 150 jobs
- 월간 총 요청: 150 × 30일 × 100 ops/job = 450K ops
- 예상 비용: ~$8-12/월
```

---

## Redis 데이터베이스 생성

### Step 1: 새 데이터베이스 생성

1. **Dashboard > Create Database 클릭**

2. **설정 입력**
   ```yaml
   Name: hephaitos-queue-prod
   Type: Regional
   Region: Seoul (ap-northeast-2)  # 한국 리전 (Vercel과 동일)
   Primary Region: ap-northeast-2
   Read Region: (선택 안함 - 불필요)
   Eviction: allkeys-lru  # 메모리 부족 시 LRU 삭제
   TLS: Enabled  # 필수
   ```

3. **Create 버튼 클릭**
   - 생성 시간: ~30초

### Step 2: 연결 정보 확인

1. **Database Details 페이지에서 확인**

**REST API 정보** (BullMQ 사용 시 불필요):
```bash
UPSTASH_REDIS_REST_URL=https://unique-id.upstash.io
UPSTASH_REDIS_REST_TOKEN=AY...
```

**Redis 연결 정보** (BullMQ에서 사용):
```bash
# Redis URL 형식
UPSTASH_REDIS_URL=rediss://default:YOUR_PASSWORD@unique-id.upstash.io:6379

# 또는 개별 값
UPSTASH_REDIS_HOST=unique-id.upstash.io
UPSTASH_REDIS_PORT=6379
UPSTASH_REDIS_PASSWORD=YOUR_PASSWORD
```

**⚠️ 보안 주의사항**:
- `UPSTASH_REDIS_URL`에 비밀번호가 포함됨
- `.env.local`에만 저장 (절대 Git 커밋 금지)
- Vercel 환경 변수에 등록 시 "Production" 환경만 선택

---

## 환경 변수 설정

### 로컬 개발 환경

1. **`.env.local` 파일 업데이트**
   ```bash
   # Upstash Redis (Loop 11 - Backtest Queue)
   UPSTASH_REDIS_URL=rediss://default:YOUR_PASSWORD@unique-id.upstash.io:6379

   # Worker 설정
   WORKER_CONCURRENCY=5
   WORKER_MAX_RETRIES=3
   WORKER_RETRY_DELAY=5000  # 5초
   ```

2. **환경 변수 로드 확인**
   ```bash
   node -e "console.log(process.env.UPSTASH_REDIS_URL)"
   # 출력: rediss://default:...
   ```

### Vercel 프로덕션 환경

1. **Vercel Dashboard 접속**
   - Project Settings > Environment Variables

2. **환경 변수 추가**
   ```
   Key: UPSTASH_REDIS_URL
   Value: rediss://default:YOUR_PASSWORD@unique-id.upstash.io:6379
   Environments: ✅ Production (ONLY)
   ```

3. **Worker 설정 추가**
   ```
   WORKER_CONCURRENCY=5
   WORKER_MAX_RETRIES=3
   WORKER_RETRY_DELAY=5000
   ```

4. **재배포**
   ```bash
   vercel --prod
   ```

---

## 연결 테스트

### Step 1: 간단한 연결 테스트

**스크립트 생성**: `scripts/test-redis-connection.ts`

```typescript
import Redis from 'ioredis'

async function testRedisConnection() {
  const redisUrl = process.env.UPSTASH_REDIS_URL

  if (!redisUrl) {
    console.error('❌ UPSTASH_REDIS_URL 환경 변수가 설정되지 않았습니다.')
    process.exit(1)
  }

  console.log('🔄 Redis 연결 테스트 시작...')
  console.log(`📡 URL: ${redisUrl.replace(/:[^:]*@/, ':****@')}`) // 비밀번호 숨김

  const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  })

  try {
    // PING 테스트
    const pong = await redis.ping()
    console.log(`✅ PING 성공: ${pong}`)

    // SET/GET 테스트
    await redis.set('test:connection', 'Hello Upstash!')
    const value = await redis.get('test:connection')
    console.log(`✅ SET/GET 성공: ${value}`)

    // 삭제
    await redis.del('test:connection')
    console.log('✅ 테스트 데이터 삭제 완료')

    // 연결 종료
    await redis.quit()
    console.log('✅ Redis 연결 테스트 성공!')
  } catch (error) {
    console.error('❌ Redis 연결 실패:', error)
    process.exit(1)
  }
}

testRedisConnection()
```

**실행**:
```bash
pnpm tsx scripts/test-redis-connection.ts

# 예상 출력:
# 🔄 Redis 연결 테스트 시작...
# 📡 URL: rediss://default:****@unique-id.upstash.io:6379
# ✅ PING 성공: PONG
# ✅ SET/GET 성공: Hello Upstash!
# ✅ 테스트 데이터 삭제 완료
# ✅ Redis 연결 테스트 성공!
```

### Step 2: BullMQ Queue 연결 테스트

**스크립트 생성**: `scripts/test-bullmq-queue.ts`

```typescript
import { Queue, Worker } from 'bullmq'
import Redis from 'ioredis'

const connection = new Redis(process.env.UPSTASH_REDIS_URL!, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
})

async function testBullMQQueue() {
  console.log('🔄 BullMQ Queue 테스트 시작...')

  // Queue 생성
  const queue = new Queue('test-queue', { connection })

  // Worker 생성
  const worker = new Worker(
    'test-queue',
    async (job) => {
      console.log(`✅ Job 처리 중: ${job.id}`)
      return { processed: true }
    },
    { connection }
  )

  try {
    // Job 추가
    const job = await queue.add('test-job', { message: 'Hello BullMQ!' })
    console.log(`✅ Job 추가 성공: ${job.id}`)

    // Job 완료 대기 (최대 5초)
    await job.waitUntilFinished(queue.events, 5000)
    console.log('✅ Job 처리 완료')

    // Queue 정리
    await queue.obliterate({ force: true })
    console.log('✅ Queue 정리 완료')

    await worker.close()
    await queue.close()
    await connection.quit()

    console.log('✅ BullMQ Queue 테스트 성공!')
  } catch (error) {
    console.error('❌ BullMQ Queue 테스트 실패:', error)
    process.exit(1)
  }
}

testBullMQQueue()
```

**실행**:
```bash
pnpm tsx scripts/test-bullmq-queue.ts

# 예상 출력:
# 🔄 BullMQ Queue 테스트 시작...
# ✅ Job 추가 성공: 1
# ✅ Job 처리 중: 1
# ✅ Job 처리 완료
# ✅ Queue 정리 완료
# ✅ BullMQ Queue 테스트 성공!
```

---

## 부하 테스트 실행

### 준비 사항

1. **부하 테스트 스크립트 확인**
   - 파일: `/scripts/load-test-queue.ts` (Loop 11에서 생성됨)

2. **Worker 프로세스 시작**
   ```bash
   # 터미널 1: Worker 실행
   pnpm tsx src/lib/queue/backtest-worker.ts
   ```

### 테스트 시나리오

#### 시나리오 1: 기본 부하 테스트 (50 jobs)

**목표**: Private Beta 규모 (50명 × 1회 백테스트)

```bash
# 터미널 2: 부하 테스트 실행
node scripts/load-test-queue.ts --jobs=50 --concurrent=10

# 파라미터:
# --jobs=50         : 총 50개 백테스트 Job
# --concurrent=10   : 동시 10개씩 제출
```

**예상 결과**:
```
🔄 부하 테스트 시작...
📊 설정: 50 jobs, 동시성 10

✅ [1/50] Job 추가 성공 (1.2s)
✅ [2/50] Job 추가 성공 (1.3s)
...
✅ [50/50] Job 추가 성공 (15.8s)

📈 통계:
- 총 Job 수: 50개
- 평균 대기시간: 12.3초
- 최대 대기시간: 28.5초
- 성공률: 100%
- Worker 처리량: 4.1 jobs/sec

✅ 테스트 성공! (평균 대기시간 <30초)
```

#### 시나리오 2: 피크 부하 테스트 (100 jobs)

**목표**: Public Beta 초기 규모 (100명 × 1회)

```bash
node scripts/load-test-queue.ts --jobs=100 --concurrent=20
```

**예상 결과**:
```
📈 통계:
- 총 Job 수: 100개
- 평균 대기시간: 18.7초
- 최대 대기시간: 45.2초
- 성공률: 100%
- Worker 처리량: 5.3 jobs/sec

⚠️ 최대 대기시간 45초 > 목표 30초
→ Worker concurrency 증가 권장 (5 → 8)
```

#### 시나리오 3: 스트레스 테스트 (200 jobs)

**목표**: 시스템 한계 확인

```bash
node scripts/load-test-queue.ts --jobs=200 --concurrent=50
```

**예상 결과**:
```
📈 통계:
- 총 Job 수: 200개
- 평균 대기시간: 35.4초
- 최대 대기시간: 89.3초
- 성공률: 98%
- 실패: 4개 (타임아웃)
- Worker 처리량: 5.6 jobs/sec

❌ 시스템 한계 도달
→ Worker 수평 확장 필요 (1개 → 2개 인스턴스)
```

---

## 성능 검증

### 목표 지표 (Loop 11)

| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| **동시 처리 능력** | 100명 | 100 jobs 테스트 |
| **평균 대기시간** | <30초 | 부하 테스트 결과 |
| **성공률** | >99% | 실패 Job 수 / 총 Job 수 |
| **Worker 처리량** | >3 jobs/sec | 총 Job / 총 시간 |

### 검증 체크리스트

- [ ] **50 jobs 테스트 통과**
  - [ ] 평균 대기시간 <30초
  - [ ] 성공률 100%

- [ ] **100 jobs 테스트 통과**
  - [ ] 평균 대기시간 <30초
  - [ ] 성공률 >99%

- [ ] **200 jobs 테스트** (선택)
  - [ ] 시스템 한계 확인
  - [ ] 확장 계획 수립

### 성능 튜닝

#### Worker Concurrency 조정

**현재 설정**: `WORKER_CONCURRENCY=5`

**성능 개선**:
```bash
# .env.local
WORKER_CONCURRENCY=8  # 5 → 8로 증가

# 재시작
pnpm tsx src/lib/queue/backtest-worker.ts
```

**효과**:
- 처리량: 4.1 jobs/sec → 6.5 jobs/sec (+58%)
- 평균 대기시간: 18.7초 → 12.1초 (-35%)

**주의사항**:
- CPU 사용률 모니터링 (>80% 시 감소)
- 메모리 사용량 확인 (>2GB 시 위험)

#### Redis 연결 풀 최적화

```typescript
// src/lib/queue/index.ts
const connection = new Redis(process.env.UPSTASH_REDIS_URL!, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,

  // 추가 최적화
  lazyConnect: false,        // 즉시 연결
  keepAlive: 30000,          // 30초 keep-alive
  connectTimeout: 10000,     // 10초 타임아웃
  retryStrategy: (times) => {
    if (times > 3) return null
    return Math.min(times * 200, 1000)
  },
})
```

---

## 모니터링 설정

### Upstash Dashboard 모니터링

1. **Metrics 페이지 확인**
   - URL: https://console.upstash.com/redis/{db-id}/metrics

2. **주요 지표**
   ```
   - Commands/sec: 목표 <1000 (Free tier 제한)
   - Connections: 목표 <50
   - Memory Usage: 목표 <100MB (256MB 제한)
   - Hit Rate: 목표 >90%
   ```

3. **알림 설정**
   - Settings > Alerts
   - Memory Usage > 80% → 이메일 알림
   - Commands/sec > 900 → Slack 알림

### Worker 로그 모니터링

**로그 수집**:
```bash
# Worker 실행 시 로그 파일 생성
pnpm tsx src/lib/queue/backtest-worker.ts > logs/worker.log 2>&1 &

# 실시간 모니터링
tail -f logs/worker.log
```

**로그 분석**:
```bash
# 에러 로그 확인
grep ERROR logs/worker.log

# 처리 시간 통계
grep "Job completed" logs/worker.log | awk '{print $NF}' | \
  awk '{sum+=$1; count++} END {print "평균:", sum/count, "ms"}'
```

### Vercel 로그 모니터링 (프로덕션)

```bash
# API Route 로그 확인
vercel logs --follow --filter=/api/backtest/queue

# Cron Worker 로그 확인 (Vercel Cron 사용 시)
vercel logs --follow --filter=/api/cron/process-queue
```

---

## 트러블슈팅

### 문제 1: 연결 실패 (ECONNREFUSED)

**증상**:
```
Error: connect ECONNREFUSED
```

**원인**:
- `UPSTASH_REDIS_URL` 환경 변수 누락
- 잘못된 URL 형식
- TLS 미사용 (http:// 대신 https://)

**해결**:
```bash
# 환경 변수 확인
echo $UPSTASH_REDIS_URL
# 예상: rediss://default:...  (https가 아님!)

# .env.local 다시 확인
cat .env.local | grep UPSTASH

# Redis URL 형식 검증
node -e "const url = process.env.UPSTASH_REDIS_URL; \
  console.log(url.startsWith('rediss://') ? '✅ 올바름' : '❌ rediss:// 누락')"
```

### 문제 2: Job 처리 안됨 (Worker 미실행)

**증상**:
```
Job 추가는 성공하지만 완료 안됨
```

**원인**:
- Worker 프로세스가 실행되지 않음
- Queue 이름 불일치 (`backtest-queue` vs `backtest`)

**해결**:
```bash
# Worker 실행 확인
ps aux | grep backtest-worker
# 없으면 실행
pnpm tsx src/lib/queue/backtest-worker.ts &

# Queue 이름 확인
grep "new Queue" src/lib/queue/index.ts
grep "new Worker" src/lib/queue/backtest-worker.ts
# 둘 다 'backtest-queue'여야 함
```

### 문제 3: 메모리 부족 (OOM)

**증상**:
```
FATAL ERROR: Reached heap limit
```

**원인**:
- Worker concurrency 너무 높음 (>10)
- 백테스트 데이터 크기 과다

**해결**:
```bash
# Worker concurrency 감소
WORKER_CONCURRENCY=3  # 5 → 3

# Node.js 힙 메모리 증가
node --max-old-space-size=4096 src/lib/queue/backtest-worker.ts
```

### 문제 4: 부하 테스트 타임아웃

**증상**:
```
⚠️ 일부 Job 타임아웃 (60초 초과)
```

**원인**:
- Worker 처리 속도 < Job 제출 속도
- Redis 연결 지연

**해결**:
```bash
# 동시 제출 수 감소
node scripts/load-test-queue.ts --jobs=100 --concurrent=5  # 20 → 5

# Worker 수평 확장 (2개 인스턴스)
pnpm tsx src/lib/queue/backtest-worker.ts &
pnpm tsx src/lib/queue/backtest-worker.ts &
```

### 문제 5: Upstash Free Tier 제한 초과

**증상**:
```
Error: ERR max number of clients reached
```

**원인**:
- 동시 연결 수 > 10 (Free tier 제한)

**해결**:
```bash
# Pay-as-you-go 플랜으로 업그레이드
# Upstash Console > Database > Settings > Upgrade Plan
```

---

## 검증 완료 체크리스트

### 연결 테스트

- [ ] `test-redis-connection.ts` 성공
- [ ] `test-bullmq-queue.ts` 성공
- [ ] Vercel 프로덕션 환경에서 연결 확인

### 부하 테스트

- [ ] 50 jobs 테스트 통과 (Private Beta)
- [ ] 100 jobs 테스트 통과 (Public Beta 목표)
- [ ] 평균 대기시간 <30초
- [ ] 성공률 >99%

### 모니터링

- [ ] Upstash Metrics 대시보드 확인
- [ ] Worker 로그 수집 설정
- [ ] Vercel 로그 모니터링 확인
- [ ] 알림 설정 완료 (Memory, Commands/sec)

### 문서화

- [ ] 부하 테스트 결과 기록
- [ ] 성능 튜닝 파라미터 문서화
- [ ] 트러블슈팅 가이드 업데이트

---

## 다음 단계

**검증 완료 후**:

1. **Private Beta 런칭**
   - 50명 초대 이메일 발송
   - Discord 서버 오픈
   - 실시간 모니터링 시작

2. **피드백 수집**
   - 백테스트 대기시간 만족도
   - 에러 발생 횟수 추적
   - 성능 개선 제안 수집

3. **Public Beta 준비**
   - 100+ jobs 부하 테스트
   - Worker 수평 확장 (필요 시)
   - Upstash 플랜 업그레이드 검토

---

**작성일**: 2025-12-22
**담당자**: DevOps Team
**승인**: CTO
