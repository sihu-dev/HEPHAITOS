# 🧪 HEPHAITOS 로컬 테스트 가이드

**대상**: 배포 전 로컬 환경에서 검증
**소요 시간**: 30분
**목적**: 배포 전 오류 사전 발견

---

## 🚀 Quick Start

```bash
# 1. 환경 변수 설정
cp .env.example .env.local
# .env.local 파일 수정 (Supabase, Anthropic 등)

# 2. 의존성 설치
npm install

# 3. 개발 서버 실행
npm run dev

# 4. Worker 실행 (별도 터미널)
npm run worker

# 5. 브라우저 접속
open http://localhost:3000
```

---

## 📋 테스트 체크리스트

### 1. 빌드 테스트 (5분)

#### 개발 빌드
```bash
npm run dev

# 예상 출력:
#   ▲ Next.js 16.0.10
#   - Local: http://localhost:3000
#   ✓ Ready in 2.3s
```

#### 프로덕션 빌드
```bash
npm run build

# 예상 출력:
#   ✓ Compiled successfully in 9.8s
#   Route (app)
#   ├ ƒ /
#   ├ ƒ /admin/cs
#   ├ ƒ /api/cs/refund
#   └ ...
```

**확인사항**:
- [ ] 빌드 에러 없음
- [ ] TypeScript 컴파일 성공
- [ ] 모든 Routes 생성됨

---

### 2. API 테스트 (10분)

#### Health Check
```bash
# 개발 서버 실행 후
curl http://localhost:3000/api/health

# 예상 응답:
# {"status":"ok","timestamp":"2025-12-16T..."}
```

#### Leaderboard API
```bash
curl http://localhost:3000/api/strategies/leaderboard?limit=5

# 예상 응답 (데이터 없어도 OK):
# {"success":true,"data":{"strategies":[],"pagination":{...}}}
```

#### 환불 API (인증 필요)
```bash
# 로그인 후 Access Token 필요
curl -X GET http://localhost:3000/api/cs/refund \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 예상 응답:
# {"success":true,"data":{"history":[]}}
```

**확인사항**:
- [ ] Health Check 200 응답
- [ ] API 응답 형식 정상 (`{"success": true}`)
- [ ] 에러 처리 정상 (인증 실패 시 401)

---

### 3. Worker 테스트 (5분)

#### Worker 실행
```bash
# 별도 터미널에서
npm run worker

# 예상 출력:
# [Worker] Starting backtest worker...
# [Worker] Connected to Redis
# [Worker] Listening for backtest jobs...
```

#### Redis 연결 테스트
```typescript
// scripts/test-redis.ts (생성 필요)
import IORedis from 'ioredis';

const redis = new IORedis(process.env.UPSTASH_REDIS_REST_URL!);

async function test() {
  await redis.set('test-key', 'hello');
  const value = await redis.get('test-key');
  console.log('Redis test:', value); // 'hello'
  await redis.del('test-key');
  redis.disconnect();
}

test();
```

```bash
npx tsx scripts/test-redis.ts

# 예상 출력:
# Redis test: hello
```

**확인사항**:
- [ ] Worker 시작 성공
- [ ] Redis 연결 성공
- [ ] 에러 로그 없음

---

### 4. 페이지 테스트 (10분)

#### 메인 페이지들
```bash
# 브라우저에서 테스트
1. http://localhost:3000/                    # 홈
2. http://localhost:3000/auth/signup         # 회원가입
3. http://localhost:3000/auth/login          # 로그인
4. http://localhost:3000/dashboard           # 대시보드 (로그인 필요)
5. http://localhost:3000/strategies/leaderboard  # 리더보드
6. http://localhost:3000/admin/cs            # Admin (Admin 계정 필요)
```

#### 체크 항목
- [ ] 모든 페이지 렌더링 성공
- [ ] CSS 정상 적용 (Dark Mode, Glass Morphism)
- [ ] 로딩 상태 표시
- [ ] 에러 페이지 정상 작동 (404, 401)

---

### 5. 전략 생성 & 백테스트 플로우 (10분)

#### Step 1: 회원가입
1. `/auth/signup` 접속
2. 이메일/비밀번호 입력
3. 회원가입 성공 확인

#### Step 2: 전략 생성
1. `/dashboard/strategy-builder` 접속
2. 자연어 입력: "이동평균선 골든크로스 전략"
3. "생성" 버튼 클릭
4. AI 응답 확인 (Claude API 필요)

#### Step 3: 백테스트 실행
1. 생성된 전략에서 "백테스트" 클릭
2. 백테스트 설정 (기간, 초기 자본 등)
3. "실행" 클릭
4. Queue 진입 확인
5. 진행률 실시간 업데이트 확인 (BacktestProgress 컴포넌트)

**확인사항**:
- [ ] AI 전략 생성 성공
- [ ] 백테스트 큐 진입 성공
- [ ] Worker가 Job 처리 (콘솔 로그 확인)
- [ ] Realtime 진행률 업데이트 (<1초)

---

### 6. Admin Dashboard 테스트 (5분)

#### Admin 계정 설정 (먼저 필요)
```bash
# 방법 1: 이메일 화이트리스트
# src/app/admin/layout.tsx 수정
const adminEmails = [
  'admin@hephaitos.io',
  'test@example.com',  // ← 테스트 계정 추가
];

# 방법 2: SQL (Supabase Local)
supabase db execute --sql "
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{\"role\": \"admin\"}'::jsonb
WHERE email = 'test@example.com';
"
```

#### Admin 페이지 접속
1. Admin 계정으로 로그인
2. `/admin/cs` 접속
3. 환불 요청 목록 확인 (비어있어도 OK)
4. 통계 카드 확인 (모두 0이어도 OK)

**확인사항**:
- [ ] Admin만 접근 가능
- [ ] Non-admin 접근 시 redirect
- [ ] Realtime 구독 정상 (콘솔 로그 확인)
- [ ] 통계 카드 렌더링

---

## 🐛 문제 해결

### 문제 1: Build 실패
```bash
# 에러: Module not found
npm install

# 에러: TypeScript 타입 에러
npm run build 2>&1 | grep error
# 에러 메시지 확인 후 해당 파일 수정
```

### 문제 2: Worker Redis 연결 실패
```bash
# .env.local 확인
cat .env.local | grep UPSTASH

# Redis URL/Token 재확인
# Upstash Dashboard에서 복사 후 재설정
```

### 문제 3: API 401 Unauthorized
```bash
# Supabase 환경 변수 확인
cat .env.local | grep SUPABASE

# Supabase Dashboard에서 Anon Key 재확인
```

### 문제 4: AI 응답 없음
```bash
# Anthropic API Key 확인
cat .env.local | grep ANTHROPIC

# API Key 유효성 확인
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 10,
    "messages": [{"role": "user", "content": "test"}]
  }'
```

---

## 📊 로컬 성능 기준

| 항목 | 목표 | 측정 방법 |
|------|------|-----------|
| **Dev Server Start** | <5초 | `time npm run dev` |
| **Build Time** | <30초 | `time npm run build` |
| **API Response** | <200ms | `curl -w "@curl-format.txt" URL` |
| **Worker Processing** | <10분/Job | Worker 콘솔 로그 |

### curl-format.txt
```
time_namelookup:  %{time_namelookup}\n
time_connect:     %{time_connect}\n
time_appconnect:  %{time_appconnect}\n
time_pretransfer: %{time_pretransfer}\n
time_redirect:    %{time_redirect}\n
time_starttransfer: %{time_starttransfer}\n
time_total:       %{time_total}\n
```

---

## ✅ 최종 체크리스트

### Critical
- [ ] `npm run build` 성공
- [ ] Health Check API 200 응답
- [ ] Worker Redis 연결 성공
- [ ] 로그인/회원가입 정상

### High
- [ ] 전략 생성 성공 (AI API)
- [ ] 백테스트 큐 진입 성공
- [ ] 리더보드 페이지 렌더링
- [ ] Admin Dashboard 접근 제어

### Medium
- [ ] Realtime 진행률 업데이트
- [ ] 모든 API Routes 응답
- [ ] 에러 처리 정상
- [ ] 성능 기준 충족

---

## 🎯 다음 단계

### 로컬 테스트 통과 시
```bash
# 1. 최종 커밋
git add .
git commit -m "test: Local testing passed - ready for deployment"

# 2. 배포 진행
bash scripts/quick-start.sh
```

### 로컬 테스트 실패 시
1. 에러 메시지 확인
2. 위 "문제 해결" 섹션 참조
3. 수정 후 재테스트
4. 문제 지속 시 docs/BETA_DEPLOYMENT_GUIDE.md 참조

---

**로컬 테스트는 배포 전 필수 단계입니다!** ✅

*최종 업데이트: 2025-12-16*
