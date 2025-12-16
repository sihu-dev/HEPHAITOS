# HEPHAITOS V2 Beta 배포 가이드

**버전**: V2.0.0-beta
**대상**: Production 환경 배포
**예상 소요 시간**: 30분 (Critical 작업) + 2시간 (테스트)
**배포일**: 2025-12-20

---

## 📋 배포 전 체크리스트

### 코드 상태 확인
- [x] Loop 1-13 완료 (95%)
- [x] TypeScript 컴파일 성공
- [x] npm run build 성공
- [x] Git 커밋 완료
- [ ] Git push to main branch
- [ ] Vercel 자동 배포 트리거

### 외부 서비스 확인
- [ ] Supabase 프로젝트 생성 완료
- [ ] Upstash Redis 계정 생성 완료
- [ ] Toss Payments 가맹점 승인 완료
- [ ] Unusual Whales API 키 발급 완료

---

## 🚀 Step 1: Upstash Redis 설정 (10분)

### 1.1 Upstash 계정 생성

1. https://upstash.com 접속
2. "Get Started for Free" 클릭
3. GitHub/Google 계정으로 로그인

### 1.2 Redis Database 생성

```bash
# Upstash Console에서:
1. "Create Database" 클릭
2. Database Name: hephaitos-backtest-queue
3. Region: Asia Pacific (Tokyo) 선택 (한국과 가장 가까움)
4. Type: Regional (무료 플랜)
5. "Create" 클릭
```

### 1.3 환경 변수 설정

Upstash Console에서 "REST API" 탭으로 이동 후 다음 정보 복사:

```bash
# .env.local 또는 Vercel 환경 변수에 추가
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXXxxxxxx...
```

### 1.4 연결 테스트

```bash
# 로컬에서 테스트
npm run worker

# 콘솔에 다음 메시지가 나오면 성공:
# [Worker] Connected to Redis
# [Worker] Listening for backtest jobs...
```

---

## 🗄️ Step 2: DB 마이그레이션 실행 (5분)

### 2.1 Supabase CLI 설치 (이미 설치된 경우 skip)

```bash
# Windows
scoop install supabase

# macOS
brew install supabase/tap/supabase

# 설치 확인
supabase --version
```

### 2.2 Supabase 프로젝트 링크

```bash
cd C:\Users\sihu2\OneDrive\Desktop\Projects\HEPHAITOS

# Supabase 프로젝트와 로컬 연결
supabase link --project-ref <your-project-ref>
# Project ref는 Supabase Dashboard URL에서 확인: https://supabase.com/dashboard/project/<project-ref>

# 비밀번호 입력 (Supabase 프로젝트 DB 비밀번호)
```

### 2.3 마이그레이션 파일 확인

```bash
# 마이그레이션 파일 목록
ls supabase/migrations/

# 다음 3개 파일 확인:
# - 20251216_loop11_backtest_queue.sql
# - 20251216_loop12_strategy_performance.sql
# - 20251216_loop13_cs_automation.sql
```

### 2.4 마이그레이션 실행

```bash
# Remote DB에 마이그레이션 적용
supabase db push

# 성공 메시지:
# Applying migration 20251216_loop11_backtest_queue.sql...
# Applying migration 20251216_loop12_strategy_performance.sql...
# Applying migration 20251216_loop13_cs_automation.sql...
# ✓ All migrations applied successfully
```

### 2.5 마이그레이션 검증

```bash
# Supabase Dashboard SQL Editor에서 실행:

-- Loop 11: backtest_jobs 테이블 확인
SELECT COUNT(*) FROM backtest_jobs;

-- Loop 12: Materialized View 확인
SELECT * FROM strategy_performance_agg LIMIT 1;

-- Loop 13: refund_requests 테이블 확인
SELECT COUNT(*) FROM refund_requests;

-- pg_cron 작업 확인
SELECT * FROM cron.job;
# 'refresh-strategy-performance' 작업이 있어야 함
```

---

## ⚡ Step 3: Edge Function 배포 (10분)

### 3.1 Edge Function 파일 확인

```bash
# 파일 존재 확인
ls supabase/functions/auto-refund-handler/

# 출력:
# index.ts
```

### 3.2 환경 변수 설정 (Supabase)

```bash
# Supabase Dashboard > Settings > Edge Functions > Secrets

# 다음 환경 변수 추가:
TOSS_SECRET_KEY=test_sk_xxxxxxxxxxxxxxxxxx
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### 3.3 Edge Function 배포

```bash
# Supabase CLI로 배포
supabase functions deploy auto-refund-handler

# 성공 메시지:
# Bundling auto-refund-handler...
# Deploying auto-refund-handler (version xxx)
# ✓ Deployed successfully
# URL: https://xxx.supabase.co/functions/v1/auto-refund-handler
```

### 3.4 Edge Function 테스트

```bash
# cURL로 테스트 (환불 요청 ID 필요)
curl -X POST \
  https://xxx.supabase.co/functions/v1/auto-refund-handler \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"refund_request_id": "test-id"}'

# 응답 (404 expected, 함수는 정상 작동):
# {"error": "REFUND_REQUEST_NOT_FOUND"}
```

---

## 👤 Step 4: Admin 계정 설정 (5분)

### 방법 1: 이메일 화이트리스트 (권장)

```bash
# src/app/admin/layout.tsx 파일 수정
const adminEmails = [
  'admin@hephaitos.io',
  'your-email@example.com',  # ← 여기에 실제 관리자 이메일 추가
];
```

재배포 필요:
```bash
git add src/app/admin/layout.tsx
git commit -m "feat(admin): Add admin email to whitelist"
git push origin main
# Vercel 자동 배포
```

### 방법 2: User Metadata 설정 (DB에서)

```sql
-- Supabase SQL Editor에서 실행:

-- 1. 먼저 사용자 생성 (Supabase Dashboard > Authentication > Users)
-- 또는 회원가입으로 계정 생성

-- 2. 해당 사용자에게 admin role 부여
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'your-email@example.com';

-- 3. 확인
SELECT id, email, raw_user_meta_data
FROM auth.users
WHERE email = 'your-email@example.com';
```

### 4.3 Admin 접근 테스트

```bash
# 1. https://hephaitos.io/admin/cs 접속
# 2. 로그인 (위에서 설정한 admin 이메일)
# 3. Admin Dashboard 정상 표시 확인
# 4. 환불 요청 목록 조회 테스트
```

---

## 🌐 Step 5: Vercel 배포 (자동)

### 5.1 Vercel 프로젝트 생성 (최초 1회)

```bash
# Vercel CLI 설치
npm i -g vercel

# 로그인
vercel login

# 프로젝트 링크
cd C:\Users\sihu2\OneDrive\Desktop\Projects\HEPHAITOS
vercel link

# 프로젝트 선택 또는 새로 생성
```

### 5.2 환경 변수 설정 (Vercel Dashboard)

```bash
# https://vercel.com/dashboard
# Your Project > Settings > Environment Variables

# 다음 환경 변수 추가:
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXXxxxxxx...

TOSS_CLIENT_KEY=test_ck_xxxxxxxxx
TOSS_SECRET_KEY=test_sk_xxxxxxxxx

ANTHROPIC_API_KEY=sk-ant-xxxxx
UNUSUAL_WHALES_API_KEY=xxx
```

### 5.3 배포 트리거

```bash
# Git push로 자동 배포
git add .
git commit -m "feat: Beta deployment ready (95% complete)"
git push origin main

# 또는 수동 배포
vercel --prod
```

### 5.4 배포 확인

```bash
# Vercel Dashboard에서:
# 1. Deployments 탭 확인
# 2. "Building" → "Ready" 상태 확인 (2-3분)
# 3. Production URL 클릭
# 4. https://hephaitos.io 정상 접속 확인
```

---

## ✅ Step 6: 배포 후 검증 (20분)

### 6.1 Health Check

```bash
# 1. API Health Check
curl https://hephaitos.io/api/health

# 응답:
# {"status": "ok", "timestamp": "..."}

# 2. Database 연결 확인
curl https://hephaitos.io/api/strategies/leaderboard?limit=1

# 응답:
# {"success": true, "data": {...}}
```

### 6.2 핵심 기능 테스트

| 기능 | URL | 확인 사항 |
|------|-----|-----------|
| **회원가입** | /auth/signup | 계정 생성 가능 |
| **로그인** | /auth/login | 로그인 성공 |
| **대시보드** | /dashboard | 정상 렌더링 |
| **전략 생성** | /dashboard/strategy-builder | AI 전략 생성 가능 |
| **백테스트** | /dashboard/backtest | 백테스트 큐 진입 |
| **리더보드** | /strategies/leaderboard | Materialized View 조회 |
| **Admin** | /admin/cs | Admin만 접근 가능 |

### 6.3 Worker 실행 (백테스트 큐)

```bash
# 별도 서버 또는 로컬에서 Worker 실행
npm run worker:prod

# PM2로 데몬화 (권장)
pm2 start npm --name "hephaitos-worker" -- run worker:prod
pm2 save
pm2 startup
```

---

## 🧪 Step 7: E2E 테스트 (2시간)

### 7.1 Playwright 설치 (이미 설치됨)

```bash
# 이미 package.json에 포함됨
# @playwright/test: ^1.57.0

# 브라우저 설치
npx playwright install
```

### 7.2 E2E 테스트 시나리오 작성

```bash
# tests/e2e/beta-flow.spec.ts 파일 생성
```

```typescript
import { test, expect } from '@playwright/test';

test.describe('Beta 핵심 플로우', () => {
  test('1. 회원가입 → 로그인 → 전략 생성 → 백테스트', async ({ page }) => {
    // 1. 회원가입
    await page.goto('https://hephaitos.io/auth/signup');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // 2. 대시보드 접근
    await expect(page).toHaveURL('/dashboard');

    // 3. 전략 빌더
    await page.goto('/dashboard/strategy-builder');
    await page.fill('textarea[name="prompt"]', '이동평균선 골든크로스 전략');
    await page.click('button:has-text("생성")');

    // 4. 백테스트 실행
    await page.waitForSelector('button:has-text("백테스트")', { timeout: 30000 });
    await page.click('button:has-text("백테스트")');

    // 5. 큐 진입 확인
    await expect(page.locator('text=백테스트 대기 중')).toBeVisible();
  });

  test('2. 리더보드 조회', async ({ page }) => {
    await page.goto('https://hephaitos.io/strategies/leaderboard');

    // Materialized View 데이터 로드 확인
    await expect(page.locator('table')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('tr').count()).toBeGreaterThan(0);
  });

  test('3. Admin 페이지 접근 제어', async ({ page }) => {
    // Non-admin 사용자로 접근 시도
    await page.goto('https://hephaitos.io/admin/cs');

    // Redirect 확인
    await expect(page).toHaveURL(/\/dashboard\?error=unauthorized/);
  });
});
```

### 7.3 E2E 테스트 실행

```bash
# Headless mode
npm run test:e2e

# UI mode (디버깅용)
npm run test:e2e:ui

# 특정 테스트만
npx playwright test tests/e2e/beta-flow.spec.ts
```

---

## 📊 Step 8: 모니터링 설정 (선택 사항)

### 8.1 Sentry 통합 (이미 설치됨)

```bash
# sentry.client.config.ts에 DSN 추가
Sentry.init({
  dsn: 'https://xxx@xxx.ingest.sentry.io/xxx',
  environment: 'production',
  tracesSampleRate: 1.0,
});
```

### 8.2 Vercel Analytics

```bash
# Vercel Dashboard > Analytics 탭
# 자동으로 활성화됨 (무료 플랜 포함)
```

### 8.3 Supabase Logs

```bash
# Supabase Dashboard > Logs
# - API Logs
# - Database Logs
# - Edge Function Logs
```

---

## 🔥 트러블슈팅

### 문제 1: Worker가 Redis에 연결되지 않음

**증상**: `[Worker] Redis connection failed`

**해결**:
```bash
# .env.local 파일 확인
cat .env.local | grep UPSTASH

# 환경 변수가 정확한지 확인
# Upstash Dashboard에서 재확인
```

### 문제 2: Edge Function 실행 실패

**증상**: `500 Internal Server Error`

**해결**:
```bash
# Supabase Dashboard > Edge Functions > Logs 확인
# 환경 변수 누락 여부 확인

# 재배포
supabase functions deploy auto-refund-handler --no-verify-jwt
```

### 문제 3: Materialized View 데이터 없음

**증상**: 리더보드 비어있음

**해결**:
```sql
-- 수동으로 View Refresh
REFRESH MATERIALIZED VIEW CONCURRENTLY strategy_performance_agg;

-- Cron 작업 확인
SELECT * FROM cron.job WHERE jobname = 'refresh-strategy-performance';

-- 없으면 재생성
SELECT cron.schedule(
  'refresh-strategy-performance',
  '0 * * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY strategy_performance_agg'
);
```

### 문제 4: Admin 접근 불가

**증상**: Redirect to /dashboard?error=unauthorized

**해결**:
```sql
-- User metadata 확인
SELECT email, raw_user_meta_data
FROM auth.users
WHERE email = 'your-email@example.com';

-- role 추가
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'your-email@example.com';
```

---

## 📝 배포 완료 체크리스트

### Critical (필수)
- [ ] Upstash Redis 연결 성공
- [ ] DB 마이그레이션 3개 적용 완료
- [ ] Edge Function 배포 성공
- [ ] Admin 계정 1개 이상 설정
- [ ] Vercel 배포 성공 (빌드 통과)

### High (권장)
- [ ] Worker 프로세스 실행 중 (PM2 데몬)
- [ ] Health Check API 정상 응답
- [ ] 회원가입/로그인 테스트 통과
- [ ] 전략 생성 테스트 통과
- [ ] 백테스트 큐 테스트 통과

### Medium (선택)
- [ ] E2E 테스트 작성 완료
- [ ] Sentry 모니터링 활성화
- [ ] pg_cron Materialized View Refresh 작동 확인
- [ ] Admin Dashboard 환불 승인/거절 테스트

---

## 🎉 Beta 출시 선언

모든 Critical + High 체크리스트 완료 시 **Beta 출시 준비 완료**입니다.

### 출시 전 최종 확인
```bash
# 1. 프로덕션 URL 접속
open https://hephaitos.io

# 2. 모든 페이지 정상 작동 확인
# - /dashboard
# - /strategies/leaderboard
# - /admin/cs (admin 계정)

# 3. Worker 로그 확인
pm2 logs hephaitos-worker

# 4. Supabase Logs 확인
# Dashboard > Logs > 최근 5분 에러 없음
```

### Beta 사용자 초대
```bash
# 초대 코드 생성 (100명)
# Supabase Dashboard > Authentication > Users
# Invite User로 100명 초대 이메일 발송
```

---

**예상 Beta 출시일**: 2025-12-20
**목표 Beta 사용자**: 100명
**Beta 기간**: 2주 (2025-12-20 ~ 2026-01-03)

*작성자: Claude Code*
*최종 업데이트: 2025-12-16*
