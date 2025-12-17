# HEPHAITOS Production 환경 설정 가이드

> **Loop 6**: Production 환경 설정
> **생성일**: 2025-12-17
> **상태**: 진행 중

---

## 1. 사전 요구사항

### 1.1 계정 및 서비스
- [x] Vercel 계정
- [x] Supabase 프로젝트
- [x] GitHub 리포지토리
- [ ] Toss Payments 상점 (실서비스)
- [ ] Slack Workspace
- [ ] Anthropic API 키 (Production)

### 1.2 DNS 및 도메인
- [ ] 도메인 구매 (hephaitos.io 또는 대안)
- [ ] DNS 설정 (Vercel 연동)
- [ ] SSL 인증서 (Vercel 자동 발급)

---

## 2. Vercel 환경변수 설정

### 2.1 Core 설정

```bash
# App URL
vercel env add NEXT_PUBLIC_APP_URL production
# 값: https://hephaitos.vercel.app (또는 커스텀 도메인)

# Environment
vercel env add NODE_ENV production
# 값: production
```

### 2.2 Supabase 연동

```bash
# Supabase URL
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# 값: https://[project-id].supabase.co

# Supabase Anon Key (공개 가능)
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# 값: eyJ... (Dashboard > Settings > API)

# Supabase Service Role Key (비밀)
vercel env add SUPABASE_SERVICE_ROLE_KEY production
# 값: eyJ... (Dashboard > Settings > API > service_role)
```

### 2.3 AI 서비스

```bash
# Anthropic (Claude)
vercel env add ANTHROPIC_API_KEY production
# 값: sk-ant-... (console.anthropic.com)

# OpenAI (선택)
vercel env add OPENAI_API_KEY production
# 값: sk-... (platform.openai.com)
```

### 2.4 결제 (Toss Payments)

```bash
# Client Key (공개 가능)
vercel env add TOSS_CLIENT_KEY production
# 값: live_ck_... (실서비스 키)

# Secret Key (비밀)
vercel env add TOSS_SECRET_KEY production
# 값: live_sk_... (실서비스 키)

# Test Mode OFF
vercel env add TOSS_TEST production
# 값: false
```

### 2.5 Slack 알림

```bash
# 긴급 알림 (DLQ, Circuit Breaker)
vercel env add SLACK_WEBHOOK_URL_ALERTS production
# 값: https://hooks.slack.com/services/T.../B.../...

# 일일 리포트
vercel env add SLACK_WEBHOOK_URL_REPORTS production
# 값: https://hooks.slack.com/services/T.../B.../...
```

### 2.6 Cron Jobs

```bash
# Cron 인증 시크릿
vercel env add CRON_SECRET production
# 값: (32자 이상 랜덤 문자열)
# 생성: openssl rand -base64 32
```

### 2.7 Redis (Rate Limit)

```bash
# Upstash Redis
vercel env add UPSTASH_REDIS_REST_URL production
# 값: https://[region].upstash.io

vercel env add UPSTASH_REDIS_REST_TOKEN production
# 값: AX...
```

---

## 3. GitHub Secrets 설정

### 3.1 CI/CD용 Secrets

GitHub > Settings > Secrets and variables > Actions

| Secret Name | 설명 | 예시 |
|-------------|------|------|
| `SUPABASE_URL` | Supabase 프로젝트 URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase 공개 키 | `eyJ...` |
| `VERCEL_TOKEN` | Vercel API 토큰 | `xxx...` |
| `VERCEL_ORG_ID` | Vercel 조직 ID | `team_xxx` |
| `VERCEL_PROJECT_ID` | Vercel 프로젝트 ID | `prj_xxx` |

### 3.2 설정 방법

```bash
# GitHub CLI 사용
gh secret set SUPABASE_URL --body "https://xxx.supabase.co"
gh secret set SUPABASE_ANON_KEY --body "eyJ..."

# 또는 웹 UI에서 직접 설정
# https://github.com/[owner]/[repo]/settings/secrets/actions
```

---

## 4. Slack Webhook 설정

### 4.1 Slack App 생성

1. https://api.slack.com/apps 접속
2. "Create New App" > "From scratch"
3. App 이름: `HEPHAITOS Alerts`
4. Workspace 선택

### 4.2 Incoming Webhook 활성화

1. Features > Incoming Webhooks > On
2. "Add New Webhook to Workspace"
3. 채널 선택:
   - `#hephaitos-alerts` (긴급 알림)
   - `#hephaitos-reports` (일일 리포트)
4. Webhook URL 복사

### 4.3 채널 설정 권장

```
#hephaitos-alerts    → 긴급 알림 (DLQ, Circuit Breaker, 결제 실패)
#hephaitos-reports   → 일일 요약 리포트
#hephaitos-logs      → 상세 로그 (선택)
```

---

## 5. Supabase Production 설정

### 5.1 RLS (Row Level Security) 확인

```sql
-- 모든 테이블 RLS 활성화 확인
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- RLS 정책 확인
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
```

### 5.2 인덱스 최적화

```sql
-- 자주 사용되는 쿼리에 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user
ON credit_transactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_strategies_user
ON strategies(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_orders_status
ON payment_orders(status, created_at DESC);
```

### 5.3 Database Backup

- Dashboard > Database > Backups
- Point-in-time Recovery 활성화
- 일일 백업 확인

---

## 6. 배포 체크리스트

### 6.1 배포 전 확인

- [ ] 모든 환경변수 설정 완료
- [ ] Supabase RLS 정책 확인
- [ ] 테스트 결제 성공
- [ ] Slack 알림 테스트
- [ ] Health check 엔드포인트 확인

### 6.2 배포 명령

```bash
# Vercel 배포
cd /path/to/HEPHAITOS
vercel --prod

# 또는 Git push로 자동 배포
git push origin master
```

### 6.3 배포 후 확인

```bash
# Health check
curl https://hephaitos.vercel.app/api/health

# 예상 응답
# {"status":"healthy","timestamp":"2025-12-17T..."}
```

---

## 7. 모니터링 설정

### 7.1 Vercel Analytics

- Dashboard > Analytics 탭 활성화
- Web Vitals 모니터링

### 7.2 Error Tracking (선택)

```bash
# Sentry 설정 (선택)
vercel env add SENTRY_DSN production
vercel env add NEXT_PUBLIC_SENTRY_DSN production
```

### 7.3 Uptime Monitoring (선택)

- UptimeRobot, Pingdom, 또는 Vercel 내장 기능
- Health check 엔드포인트: `/api/health`
- 알림: Slack #hephaitos-alerts

---

## 8. 롤백 전략

### 8.1 Vercel 롤백

```bash
# 이전 배포로 롤백
vercel rollback [deployment-url]

# 또는 Dashboard에서 직접 롤백
# Deployments > ... > Promote to Production
```

### 8.2 Database 롤백

- Supabase Dashboard > Database > Backups
- Point-in-time Recovery 사용

---

## 9. 체크리스트 요약

### 환경변수 (13개)

| 변수 | 상태 | 비고 |
|------|------|------|
| NEXT_PUBLIC_APP_URL | ⬜ | |
| NEXT_PUBLIC_SUPABASE_URL | ⬜ | |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | ⬜ | |
| SUPABASE_SERVICE_ROLE_KEY | ⬜ | |
| ANTHROPIC_API_KEY | ⬜ | |
| TOSS_CLIENT_KEY | ⬜ | 실서비스 키 |
| TOSS_SECRET_KEY | ⬜ | 실서비스 키 |
| TOSS_TEST | ⬜ | `false` |
| SLACK_WEBHOOK_URL_ALERTS | ⬜ | |
| SLACK_WEBHOOK_URL_REPORTS | ⬜ | |
| CRON_SECRET | ⬜ | |
| UPSTASH_REDIS_REST_URL | ⬜ | |
| UPSTASH_REDIS_REST_TOKEN | ⬜ | |

### GitHub Secrets (5개)

| Secret | 상태 |
|--------|------|
| SUPABASE_URL | ⬜ |
| SUPABASE_ANON_KEY | ⬜ |
| VERCEL_TOKEN | ⬜ |
| VERCEL_ORG_ID | ⬜ |
| VERCEL_PROJECT_ID | ⬜ |

---

## 다음 단계

Loop 6 완료 후:
1. **Loop 7**: Slack Webhook 연동 테스트
2. **Loop 8**: GitHub Secrets 설정 및 CI 확인
3. **Loop 9**: 베타 초대코드 100개 생성

---

*이 문서는 Production 배포 시 참조용입니다.*
*생성: 2025-12-17*
