# ⚡ HEPHAITOS Beta Quick Start

**시간**: 30분 (배포) + 30분 (테스트)
**목표**: Beta 환경 배포 완료
**상태**: 95% 완성, 배포 준비 완료 ✅

---

## 🚀 30분 배포 가이드

### Option A: 자동 스크립트 (권장)

```bash
# 1. 대화형 Quick Start 실행
bash scripts/quick-start.sh

# 안내에 따라 단계별 진행:
# Step 1: Pre-flight Check
# Step 2: Upstash Redis 설정
# Step 3: Supabase 프로젝트 링크
# Step 4: DB 마이그레이션
# Step 5: Edge Function 배포
# Step 6: Admin 계정 설정
# Step 7: Build 검증
```

### Option B: 수동 실행 (고급)

#### 1. 환경 변수 설정 (5분)
```bash
# .env.local 생성
cp .env.example .env.local

# 필수 변수 설정:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - UPSTASH_REDIS_REST_URL
# - UPSTASH_REDIS_REST_TOKEN
# - ANTHROPIC_API_KEY
```

#### 2. Upstash Redis (10분)
1. https://upstash.com 가입
2. Database 생성 (Tokyo region)
3. REST API URL/Token 복사
4. `.env.local`에 추가

#### 3. DB 마이그레이션 (5분)
```bash
# Supabase 링크
supabase link --project-ref YOUR_PROJECT_REF

# 마이그레이션 실행
bash scripts/deploy-migrations.sh
```

#### 4. Edge Function (5분)
```bash
# Supabase Secrets 설정 (Dashboard)
# 그 다음 배포:
supabase functions deploy auto-refund-handler
```

#### 5. Admin 설정 (5분)
```bash
# 자동 스크립트 실행
bash scripts/setup-admin.sh
```

---

## 📋 배포 전 체크리스트

```bash
# 자동 검증 실행
bash scripts/beta-checklist.sh

# 예상 출력:
# ✓ Passed: 35 checks
# ✗ Failed: 0 checks
# ⚠ Warnings: 2 checks
#
# 🎉 Ready for Beta deployment!
```

### 수동 확인
- [ ] `npm run build` 성공
- [ ] `.env.local` 모든 변수 설정
- [ ] Upstash Redis 연결 가능
- [ ] Supabase 프로젝트 링크 완료
- [ ] Admin 계정 최소 1개

---

## 🧪 로컬 테스트 (30분)

```bash
# 1. 개발 서버 실행
npm run dev

# 2. Worker 실행 (별도 터미널)
npm run worker

# 3. 브라우저 테스트
# http://localhost:3000

# 상세 가이드:
# LOCAL_TESTING_GUIDE.md 참조
```

### 핵심 테스트 항목
- [ ] Health Check: `curl http://localhost:3000/api/health`
- [ ] 회원가입/로그인
- [ ] 전략 생성 (AI)
- [ ] 백테스트 큐
- [ ] 리더보드
- [ ] Admin Dashboard

---

## 🌐 Vercel 배포 (자동)

```bash
# 1. Vercel 환경 변수 설정 (Dashboard)
# .env.local의 모든 변수 추가

# 2. Git Push로 배포 트리거
git add .
git commit -m "feat: Beta deployment ready (95% complete)"
git push origin main

# 3. 배포 완료 대기 (2-3분)
# Vercel Dashboard에서 확인
```

### 배포 후 확인
```bash
# Health Check
curl https://hephaitos.io/api/health

# 메인 페이지
open https://hephaitos.io
```

---

## 📚 문서 인덱스

### 빠른 실행
- **`QUICK_START_BETA.md`** (이 파일) ← START HERE
- **`DEPLOYMENT_CHECKLIST.md`** - 체크리스트
- **`LOCAL_TESTING_GUIDE.md`** - 로컬 테스트

### 상세 가이드
- **`docs/BETA_DEPLOYMENT_GUIDE.md`** - 완전한 배포 가이드
- **`docs/BETA_DEPLOYMENT_READY.md`** - 완성 리포트
- **`docs/PROJECT_STATUS_V2_95_PERCENT.md`** - 프로젝트 현황

### 자동화 스크립트
- **`scripts/quick-start.sh`** - 대화형 배포
- **`scripts/beta-checklist.sh`** - 자동 검증
- **`scripts/deploy-migrations.sh`** - DB 마이그레이션
- **`scripts/setup-admin.sh`** - Admin 설정

---

## 🎯 단계별 실행 (권장 순서)

### Phase 1: 로컬 준비 (10분)
```bash
1. git clone 또는 git pull
2. npm install
3. bash scripts/beta-checklist.sh
4. 실패 항목 수정
```

### Phase 2: 외부 서비스 (15분)
```bash
5. Upstash Redis 생성
6. Supabase 프로젝트 링크
7. 환경 변수 설정 (.env.local)
```

### Phase 3: 배포 (5분)
```bash
8. bash scripts/deploy-migrations.sh
9. supabase functions deploy auto-refund-handler
10. bash scripts/setup-admin.sh
```

### Phase 4: 로컬 테스트 (30분)
```bash
11. npm run dev
12. npm run worker (별도 터미널)
13. LOCAL_TESTING_GUIDE.md 따라 테스트
```

### Phase 5: Production 배포 (5분)
```bash
14. Vercel 환경 변수 설정
15. git push origin main
16. 배포 완료 대기
```

### Phase 6: 검증 (10분)
```bash
17. Health Check
18. 핵심 기능 테스트
19. Worker 실행 (Production)
20. Beta 사용자 초대
```

---

## ⚠️ 중요 주의사항

### 필수 환경 변수
```bash
# Critical (없으면 작동 안 함)
NEXT_PUBLIC_SUPABASE_URL=✅
NEXT_PUBLIC_SUPABASE_ANON_KEY=✅
SUPABASE_SERVICE_ROLE_KEY=✅
UPSTASH_REDIS_REST_URL=✅
UPSTASH_REDIS_REST_TOKEN=✅
ANTHROPIC_API_KEY=✅

# High (일부 기능 제한)
TOSS_CLIENT_KEY=⚠️
TOSS_SECRET_KEY=⚠️
```

### 배포 순서 (반드시 지킬 것)
1. Upstash Redis 먼저
2. DB 마이그레이션 두 번째
3. Edge Function 세 번째
4. Vercel 배포 마지막

### Worker 실행 (필수)
```bash
# Production 서버에서 반드시 실행:
pm2 start npm --name "hephaitos-worker" -- run worker:prod
pm2 save
pm2 startup
```

---

## 🐛 문제 해결 Quick Reference

| 문제 | 해결책 |
|------|--------|
| Build 실패 | `npm install` 재실행, TypeScript 에러 확인 |
| Worker 연결 실패 | `.env.local` Redis 변수 확인 |
| API 401 에러 | Supabase 환경 변수 재확인 |
| Admin 접근 불가 | `bash scripts/setup-admin.sh` 실행 |
| Migration 실패 | `supabase link` 재실행 |

---

## 📞 도움말

### 상세 가이드가 필요하면
```bash
# 완전한 Step-by-step 가이드
cat docs/BETA_DEPLOYMENT_GUIDE.md

# 문제 해결
cat docs/BETA_DEPLOYMENT_GUIDE.md | grep -A 20 "트러블슈팅"
```

### 자동화가 필요하면
```bash
# 대화형 가이드 (권장)
bash scripts/quick-start.sh

# 자동 검증
bash scripts/beta-checklist.sh

# Admin 설정
bash scripts/setup-admin.sh
```

---

## 🎉 완료 확인

### 모든 단계 완료 시
```
✅ Upstash Redis 연결 성공
✅ DB 마이그레이션 3개 적용
✅ Edge Function 배포 완료
✅ Admin 계정 설정 완료
✅ Vercel 배포 성공
✅ Worker 실행 중
✅ Health Check 200 응답
✅ 핵심 기능 정상 작동

🚀 Beta 출시 완료!
```

### 다음 단계
1. Beta 사용자 100명 초대
2. 사용자 피드백 수집
3. 버그 수정 (Hot fix)
4. Loop 14-15 개발 시작 여부 결정

---

**Let's ship it!** 🚀

*최종 업데이트: 2025-12-16*
*예상 출시일: 2025-12-20*
