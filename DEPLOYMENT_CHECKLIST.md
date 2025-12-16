# 🚀 HEPHAITOS Beta 배포 체크리스트

**Version**: 2.0.0-beta
**Target Date**: 2025-12-20
**Total Time**: 30분 (Critical) + 2시간 (Testing)

---

## ⚡ Quick Start

```bash
# 1. 자동 체크리스트 실행
bash scripts/beta-checklist.sh

# 2. DB 마이그레이션 배포
bash scripts/deploy-migrations.sh

# 3. Edge Function 배포
supabase functions deploy auto-refund-handler

# 4. Vercel 배포
git push origin main
```

---

## ✅ Pre-Deployment Checklist

### 🔴 Critical (필수 - 30분)

#### 1. Upstash Redis 설정 (10분)
- [ ] Upstash 계정 생성 (https://upstash.com)
- [ ] Database 생성: `hephaitos-backtest-queue` (Region: Tokyo)
- [ ] 환경 변수 추가:
  ```bash
  UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
  UPSTASH_REDIS_REST_TOKEN=AXXXxxxxxx...
  ```
- [ ] Worker 연결 테스트: `npm run worker`

#### 2. DB 마이그레이션 실행 (5분)
- [ ] Supabase CLI 설치 확인
- [ ] 프로젝트 링크: `supabase link --project-ref YOUR_REF`
- [ ] 마이그레이션 실행: `bash scripts/deploy-migrations.sh`
- [ ] 검증 SQL 실행:
  ```sql
  SELECT COUNT(*) FROM backtest_jobs;
  SELECT * FROM strategy_performance_agg LIMIT 1;
  SELECT COUNT(*) FROM refund_requests;
  SELECT * FROM cron.job WHERE jobname = 'refresh-strategy-performance';
  ```

#### 3. Edge Function 배포 (10분)
- [ ] Edge Function 파일 확인: `supabase/functions/auto-refund-handler/index.ts`
- [ ] Supabase Secrets 설정:
  ```bash
  TOSS_SECRET_KEY=test_sk_xxx
  SUPABASE_URL=https://xxx.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
  ```
- [ ] 배포 실행: `supabase functions deploy auto-refund-handler`
- [ ] 테스트: cURL 요청 (404 응답 정상)

#### 4. Admin 계정 설정 (5분)
**방법 A: 이메일 화이트리스트** (권장)
- [ ] `src/app/admin/layout.tsx` 수정:
  ```typescript
  const adminEmails = [
    'admin@hephaitos.io',
    'your-email@example.com',  // ← 추가
  ];
  ```
- [ ] Git commit + push

**방법 B: User Metadata**
- [ ] SQL 실행:
  ```sql
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
  WHERE email = 'your-email@example.com';
  ```

#### 5. Vercel 배포 (자동)
- [ ] 환경 변수 설정 (Vercel Dashboard):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
  - `TOSS_CLIENT_KEY`
  - `TOSS_SECRET_KEY`
  - `ANTHROPIC_API_KEY`
- [ ] Git push to main: `git push origin main`
- [ ] 배포 완료 확인 (2-3분)

---

### 🟠 High Priority (권장 - 1시간)

#### 6. Worker 프로세스 실행
- [ ] PM2 설치: `npm i -g pm2`
- [ ] Worker 실행:
  ```bash
  pm2 start npm --name "hephaitos-worker" -- run worker:prod
  pm2 save
  pm2 startup
  ```
- [ ] 로그 확인: `pm2 logs hephaitos-worker`

#### 7. Health Check
- [ ] API Health: `curl https://hephaitos.io/api/health`
- [ ] Leaderboard: `curl https://hephaitos.io/api/strategies/leaderboard?limit=1`
- [ ] 대시보드 접속 테스트
- [ ] Admin 페이지 접속: `https://hephaitos.io/admin/cs`

#### 8. 핵심 기능 테스트 (30분)
- [ ] **회원가입**: `/auth/signup` → 계정 생성 성공
- [ ] **로그인**: `/auth/login` → 로그인 성공
- [ ] **대시보드**: `/dashboard` → 정상 렌더링
- [ ] **전략 생성**: `/dashboard/strategy-builder` → AI 전략 생성
- [ ] **백테스트**: 큐 진입 확인
- [ ] **리더보드**: `/strategies/leaderboard` → 데이터 표시
- [ ] **Admin**: `/admin/cs` → Admin만 접근 가능

---

### 🟡 Medium Priority (선택 - 1시간)

#### 9. E2E 테스트 작성
- [ ] Playwright 설치: `npx playwright install`
- [ ] 테스트 파일 생성: `tests/e2e/beta-flow.spec.ts`
- [ ] 테스트 실행: `npm run test:e2e`
- [ ] 모든 테스트 통과 확인

#### 10. 모니터링 설정
- [ ] Sentry DSN 설정 (선택)
- [ ] Vercel Analytics 확인 (자동)
- [ ] Supabase Logs 확인

---

## 🐛 Troubleshooting Quick Reference

| 문제 | 해결책 |
|------|--------|
| **Worker Redis 연결 실패** | `.env.local` 파일 확인, Upstash Dashboard에서 URL/Token 재확인 |
| **Edge Function 500 에러** | Supabase Dashboard > Edge Functions > Logs 확인, Secrets 재설정 |
| **리더보드 비어있음** | `REFRESH MATERIALIZED VIEW strategy_performance_agg` 수동 실행 |
| **Admin 접근 불가** | User metadata 확인: `SELECT raw_user_meta_data FROM auth.users` |
| **Build 실패** | `npm run build` 로컬 실행, 에러 메시지 확인 |

---

## 📊 배포 완료 기준

### Minimum Viable Beta (최소 요구사항)
```
✅ Critical 체크리스트 5개 모두 완료
✅ High Priority 중 Health Check 완료
✅ 핵심 기능 3개 이상 테스트 통과
   - 회원가입/로그인
   - 전략 생성
   - 백테스트 큐
```

### Production-Ready (완전한 배포)
```
✅ Critical + High 모두 완료
✅ E2E 테스트 80% 이상 통과
✅ 48시간 무중단 운영 확인
```

---

## 🎉 Beta 출시 후 확인사항

### D+0 (배포 당일)
- [ ] 모든 페이지 정상 작동 (수동 테스트)
- [ ] Sentry 에러 0건 확인
- [ ] Worker 프로세스 실행 중 확인
- [ ] Beta 초대 이메일 100명 발송

### D+1 (배포 익일)
- [ ] 24시간 Uptime 확인
- [ ] 누적 사용자 수 확인
- [ ] Supabase 로그 리뷰 (에러 없음)
- [ ] 백테스트 큐 성능 모니터링

### D+7 (배포 1주일 후)
- [ ] 사용자 피드백 수집
- [ ] 버그 리포트 0건 달성
- [ ] Loop 14-15 개발 시작 여부 결정

---

## 📞 긴급 연락처 & 리소스

### Documentation
- **배포 가이드**: `docs/BETA_DEPLOYMENT_GUIDE.md` (상세)
- **프로젝트 현황**: `docs/PROJECT_STATUS_V2_95_PERCENT.md`
- **종합 검수**: `docs/COMPREHENSIVE_AUDIT_LOOP_1_TO_13.md`

### Scripts
- **자동 체크리스트**: `bash scripts/beta-checklist.sh`
- **마이그레이션 배포**: `bash scripts/deploy-migrations.sh`

### External Services
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Upstash Console**: https://console.upstash.com
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Toss Payments**: https://developers.tosspayments.com

---

**Last Updated**: 2025-12-16
**Next Review**: 2025-12-20 (Beta 출시일)

---

## 💡 Pro Tips

1. **마이그레이션은 한 번에**: 3개 파일을 따로 실행하지 말고 `supabase db push`로 한 번에
2. **Worker는 데몬으로**: PM2로 실행해야 서버 재시작 시에도 자동 실행
3. **Admin 이메일 화이트리스트 추천**: DB 수정보다 코드 관리가 더 안전
4. **Materialized View 수동 갱신**: 최초 배포 시 데이터 없으면 수동 REFRESH 필요
5. **환경 변수 이중 체크**: Vercel과 로컬 .env.local 모두 동일하게 설정

---

**Ready to launch?** Run `bash scripts/beta-checklist.sh` to get started! 🚀
