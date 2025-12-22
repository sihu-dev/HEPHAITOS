# HEPHAITOS 프로덕션 배포 가이드

> **Version**: 1.0
> **Last Updated**: 2025-12-22
> **Target**: Private Beta Launch (50 users)

---

## 목차

1. [사전 요구사항](#사전-요구사항)
2. [환경 변수 설정](#환경-변수-설정)
3. [Supabase 설정](#supabase-설정)
4. [Vercel 배포](#vercel-배포)
5. [Worker 프로세스](#worker-프로세스)
6. [모니터링 설정](#모니터링-설정)
7. [배포 체크리스트](#배포-체크리스트)

---

## 사전 요구사항

### 필수 서비스 계정

| 서비스 | 용도 | 플랜 | 비용 |
|--------|------|------|------|
| **Vercel** | 프론트엔드 호스팅 | Pro | $20/월 |
| **Supabase** | 데이터베이스 + Auth | Pro | $25/월 |
| **Upstash Redis** | Queue 시스템 | Pay as you go | ~$10/월 |
| **Toss Payments** | 결제 | 무료 | 수수료만 |
| **GitHub** | 코드 저장소 | Free | $0 |

**Total**: ~$55/월 (베타 단계)

### 로컬 환경

```bash
# Node.js 18+
node --version  # v18.0.0 이상

# pnpm
pnpm --version  # v8.0.0 이상

# Git
git --version
```

---

## 환경 변수 설정

### 1. 프로덕션 .env 파일 생성

```bash
cp .env.example .env.production.local
```

### 2. 필수 환경 변수

#### Supabase
```bash
# Supabase 프로젝트 설정
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # ⚠️ 절대 클라이언트에 노출 금지

# Supabase Auth Redirect (프로덕션 도메인)
NEXT_PUBLIC_SITE_URL=https://hephaitos.io
```

#### Upstash Redis (Loop 11)
```bash
# Upstash Console에서 복사
UPSTASH_REDIS_URL=rediss://default:PASSWORD@seoul-redis.upstash.io:6379

# Worker 설정
WORKER_CONCURRENCY=5
WORKER_MAX_RETRIES=3
```

#### 결제 (Toss Payments)
```bash
# Toss Developers Console
NEXT_PUBLIC_TOSS_CLIENT_KEY=live_ck_...
TOSS_SECRET_KEY=live_sk_...  # ⚠️ 서버 전용
```

#### AI (Claude API)
```bash
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-5
```

#### 모니터링 (선택)
```bash
# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=...

# Vercel Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=...
```

### 3. 환경 변수 검증

```bash
# 필수 변수 확인 스크립트
pnpm check:env
```

---

## Supabase 설정

### 1. 프로젝트 생성

1. https://supabase.com/dashboard 접속
2. **New Project** 클릭
3. 설정:
   - **Name**: `hephaitos-production`
   - **Database Password**: 강력한 비밀번호 (저장 필수)
   - **Region**: `Seoul (ap-northeast-2)`
   - **Pricing Plan**: **Pro** ($25/월)

### 2. Migration 실행

```bash
# Supabase CLI 설치
npm install -g supabase

# 로그인
supabase login

# 프로젝트 연결
supabase link --project-ref <your-project-ref>

# Migration 실행 (모든 테이블 + RLS + Functions)
supabase db push

# 확인
supabase db diff
```

**주요 Migration 파일**:
- `20251216_loop11_backtest_queue.sql` - 백테스트 큐
- `20251216_loop12_strategy_performance.sql` - 전략 리더보드
- `20251222_loop13_refund_automation.sql` - 환불 자동화

### 3. Auth 설정

#### OAuth Providers
```bash
# Google OAuth
# 1. Google Cloud Console에서 OAuth Client 생성
# 2. Supabase > Authentication > Providers > Google
#    - Client ID: ...
#    - Client Secret: ...
#    - Authorized redirect URIs: https://your-project.supabase.co/auth/v1/callback

# Kakao OAuth (한국 사용자)
# 1. Kakao Developers에서 앱 생성
# 2. Supabase > Authentication > Providers > Kakao
```

#### Email Templates
```bash
# Supabase > Authentication > Email Templates
# - Confirm signup
# - Reset password
# - Magic link

# ⚠️ 면책조항 포함 (법률 준수)
```

### 4. Realtime 활성화

```sql
-- Loop 11: 백테스트 큐 Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE backtest_jobs;

-- 확인
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

### 5. Edge Functions 배포

```bash
# Loop 13: 환불 자동화
supabase functions deploy auto-refund

# 환경 변수 설정
supabase secrets set TOSS_SECRET_KEY=live_sk_...

# 테스트
curl -i --location --request POST \
  'https://your-project.supabase.co/functions/v1/auto-refund' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"refund_request_id":"test-id"}'
```

---

## Vercel 배포

### 1. Vercel 프로젝트 생성

```bash
# Vercel CLI 설치
npm install -g vercel

# 로그인
vercel login

# 프로젝트 연결
vercel link

# 프로덕션 배포
vercel --prod
```

### 2. 환경 변수 설정 (Vercel Dashboard)

**Settings > Environment Variables**:
```bash
# 모든 .env.production.local 변수를 추가
# ⚠️ Production 환경만 선택

# 특히 중요:
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
UPSTASH_REDIS_URL
TOSS_SECRET_KEY
```

### 3. 빌드 설정

**vercel.json**:
```json
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["icn1"],
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 60
    }
  }
}
```

### 4. 도메인 설정

```bash
# Custom Domain
# Settings > Domains > Add Domain
hephaitos.io
www.hephaitos.io  # Redirect to hephaitos.io

# SSL 자동 발급 (Let's Encrypt)
```

### 5. 배포 확인

```bash
# Health Check
curl https://hephaitos.io/api/health

# Expected:
{
  "status": "ok",
  "timestamp": "2025-12-22T...",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

---

## Worker 프로세스

### Loop 11 백테스트 Worker 배포

#### Option A: Vercel Background Functions (권장)

```typescript
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/process-queue",
      "schedule": "*/1 * * * *"  // 매분 실행
    }
  ]
}
```

```typescript
// src/app/api/cron/process-queue/route.ts
import { processBacktestQueue } from '@/lib/queue/processor'

export async function GET(req: Request) {
  // Vercel Cron Secret 검증
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  // 큐에서 최대 5개 작업 처리
  await processBacktestQueue({ maxJobs: 5 })

  return new Response('OK', { status: 200 })
}
```

#### Option B: 별도 Node.js 서버 (Railway/Render)

```bash
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --prod
COPY . .
CMD ["node", "dist/worker.js"]

# Railway 배포
railway up
railway open
```

**Worker 코드** (기존 `/src/lib/queue/backtest-worker.ts` 재사용):
```bash
# Worker 프로세스 실행
node --experimental-specifier-resolution=node dist/workers/backtest-worker.js

# PM2로 관리 (재시작 자동화)
pm2 start dist/workers/backtest-worker.js --name backtest-worker
pm2 save
pm2 startup
```

### 모니터링

```bash
# Worker 상태 확인
pm2 status

# 로그 확인
pm2 logs backtest-worker

# 메트릭
pm2 monit
```

---

## 모니터링 설정

### 1. Sentry (에러 추적)

```bash
# 설치
pnpm add @sentry/nextjs

# 초기화
npx @sentry/wizard -i nextjs

# sentry.client.config.ts
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: 'production',
  tracesSampleRate: 1.0,
})
```

### 2. Vercel Analytics

```bash
# vercel.json
{
  "analytics": {
    "enable": true
  }
}
```

### 3. Uptime Monitoring (UptimeRobot)

```bash
# Monitor 설정
URL: https://hephaitos.io/api/health
Interval: 5분
Alert: Email + Slack
```

### 4. Supabase Logs

```bash
# Dashboard > Logs
# - API Logs
# - Database Logs
# - Auth Logs
# - Realtime Logs
```

---

## 배포 체크리스트

### 배포 전

- [ ] 모든 환경 변수 설정 완료
- [ ] Supabase Migration 실행 완료
- [ ] Edge Functions 배포 완료
- [ ] 프로덕션 빌드 성공 (`pnpm build`)
- [ ] TypeScript 에러 없음 (`pnpm type-check`)
- [ ] 법률 검증 통과 (면책조항 포함 확인)

### 배포 후

- [ ] Health Check API 응답 확인
- [ ] 회원가입/로그인 정상 작동
- [ ] 결제 테스트 (토스페이먼츠 실제 결제)
- [ ] 백테스트 큐 동작 확인
- [ ] Realtime 업데이트 확인
- [ ] 환불 자동화 테스트
- [ ] 에러 모니터링 확인 (Sentry)

### 베타 런칭

- [ ] 초대 이메일 발송 (50명)
- [ ] 온보딩 가이드 제공
- [ ] 피드백 수집 채널 오픈 (Discord/Slack)
- [ ] 일일 모니터링 대시보드 확인
- [ ] 주간 리포트 작성

---

## 롤백 프로세스

### Vercel 롤백

```bash
# 이전 배포 버전으로 롤백
vercel rollback <deployment-url>

# 확인
vercel ls
```

### Supabase Migration 롤백

```bash
# Migration 되돌리기
supabase db reset

# 특정 Migration까지 롤백
supabase db reset --to 20251216000000
```

---

## 보안 체크리스트

- [ ] Service Role Key는 서버 전용 (클라이언트 노출 금지)
- [ ] RLS 정책 활성화 (모든 테이블)
- [ ] API Rate Limiting 설정
- [ ] CORS 설정 (허용 도메인만)
- [ ] SSL/TLS 인증서 활성화
- [ ] 환경 변수 암호화 (Vercel/Supabase)

---

## 트러블슈팅

### 문제: Worker가 작업을 처리하지 않음

**원인**: Redis 연결 실패
```bash
# 확인
redis-cli -u $UPSTASH_REDIS_URL ping
# Expected: PONG
```

**해결**: `.env.production.local`에 올바른 `UPSTASH_REDIS_URL` 설정

### 문제: Realtime 업데이트가 안 됨

**원인**: Publication 설정 누락
```sql
-- 확인
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- 추가
ALTER PUBLICATION supabase_realtime ADD TABLE backtest_jobs;
```

### 문제: 환불이 자동 처리되지 않음

**원인**: Edge Function 배포 안 됨
```bash
# 확인
supabase functions list

# 배포
supabase functions deploy auto-refund
```

---

## 참고 링크

- Vercel 문서: https://vercel.com/docs
- Supabase 문서: https://supabase.com/docs
- Upstash 문서: https://docs.upstash.com
- Toss Payments 문서: https://docs.tosspayments.com

---

**작성일**: 2025-12-22
**담당자**: DevOps Team
**승인**: CTO
