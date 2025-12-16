# ⚡ Upstash Redis 설정 가이드 (10분)

**목적**: HEPHAITOS Backtest Queue를 위한 Redis 설정
**소요 시간**: 10분
**난이도**: ⭐ (매우 쉬움)

---

## 🎯 왜 Upstash Redis가 필요한가?

Loop 11 Backtest Queue System은 Redis를 사용합니다:
- **Queue 관리**: BullMQ로 백테스트 작업 큐 관리
- **Priority 처리**: Free/Basic/Pro 사용자 우선순위
- **실시간 진행률**: Worker → Frontend 상태 업데이트
- **Serverless**: Vercel과 완벽 호환 (Connection Pooling 불필요)

Upstash는 **무료 플랜**으로 시작할 수 있으며, Serverless 환경에 최적화되어 있습니다.

---

## 📋 Step-by-Step 가이드

### Step 1: Upstash 계정 생성 (2분)

1. **브라우저에서 접속**
   ```
   https://upstash.com
   ```

2. **"Get Started for Free" 클릭**

3. **계정 생성 방법 선택**
   - GitHub 계정으로 로그인 (권장)
   - Google 계정으로 로그인
   - 이메일로 가입

4. **로그인 완료**
   - Dashboard로 자동 이동됨

---

### Step 2: Redis Database 생성 (3분)

1. **"Create Database" 버튼 클릭**
   ![Create Database](https://console.upstash.com)

2. **Database 정보 입력**
   ```
   Name: hephaitos-backtest-queue
   ```

3. **Region 선택** (중요!)
   ```
   Region: Asia Pacific (ap-northeast-1) - Tokyo
   ```
   > 💡 한국에서 가장 가까운 Region = 낮은 Latency

4. **Type 선택**
   ```
   Type: Regional
   Plan: Free (10,000 commands/day)
   ```

5. **"Create" 버튼 클릭**
   - 생성 완료까지 10-20초 소요

---

### Step 3: REST API Credentials 복사 (2분)

Database 생성 후 자동으로 Details 페이지로 이동됩니다.

1. **"REST API" 탭 클릭**

2. **필수 정보 2개 복사**
   ```bash
   # 1. UPSTASH_REDIS_REST_URL
   Example: https://us1-merry-firefly-12345.upstash.io

   # 2. UPSTASH_REDIS_REST_TOKEN
   Example: AXXXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

3. **복사 방법**
   - 각 항목 옆의 "Copy" 아이콘 클릭
   - 또는 직접 선택 후 Ctrl+C

---

### Step 4: .env.local에 추가 (3분)

#### 방법 A: 자동 스크립트 (권장)

```bash
# Upstash 환경 변수 추가 헬퍼
bash scripts/add-upstash-env.sh

# 프롬프트가 나타나면:
# 1. UPSTASH_REDIS_REST_URL 붙여넣기
# 2. UPSTASH_REDIS_REST_TOKEN 붙여넣기
# 3. 자동으로 .env.local에 추가됨
```

#### 방법 B: 수동 편집

```bash
# 1. .env.local 파일 열기
notepad .env.local
# 또는
code .env.local

# 2. 파일 끝에 다음 추가:
UPSTASH_REDIS_REST_URL=https://your-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXXxxxxxx...

# 3. 저장 (Ctrl+S)
```

---

### Step 5: 연결 테스트 (1분)

```bash
# Redis 연결 테스트
npm run test:redis

# 예상 출력:
# ✅ Redis connection successful
# ✅ Ping: PONG
# ✅ Set/Get test: OK
```

또는 수동 테스트:

```bash
# Worker 실행으로 연결 확인
npm run worker

# 예상 출력:
# [Worker] Starting backtest worker...
# [Worker] Connected to Redis ✅
# [Worker] Listening for backtest jobs...
```

---

## ✅ 완료 확인

### 체크리스트
- [ ] Upstash 계정 생성 완료
- [ ] Database 생성 (hephaitos-backtest-queue, Tokyo)
- [ ] REST API URL/Token 복사
- [ ] .env.local에 추가
- [ ] 연결 테스트 통과

### 검증 명령어

```bash
# 1. 환경 변수 확인
cat .env.local | grep UPSTASH

# 예상 출력:
# UPSTASH_REDIS_REST_URL=https://...
# UPSTASH_REDIS_REST_TOKEN=AXXXxxxxx...

# 2. 전체 검증
bash scripts/beta-checklist.sh

# 예상 변화:
# ✗ Failed: 2 checks → ✗ Failed: 0 checks
```

---

## 🎁 무료 플랜 제한

Upstash Free 플랜:
```
✅ 10,000 commands/day
✅ 256 MB storage
✅ 100 connections
✅ REST API included
```

HEPHAITOS 사용량 예상:
```
- 백테스트 1회: ~50 commands
- 동시 사용자 10명: ~500 commands/day
- 실시간 진행률: ~1,000 commands/day

총 예상: ~2,000 commands/day (20% 사용)
```

> 💡 Free 플랜으로 충분합니다! 사용자 100명까지 문제없음.

---

## 🐛 문제 해결

### 문제 1: Database 생성 실패
**증상**: "Failed to create database"

**해결**:
1. 브라우저 새로고침
2. 다른 Region 선택 (US East 또는 EU West)
3. 다른 Database Name 사용

### 문제 2: 연결 테스트 실패
**증상**: `npm run worker` → Connection refused

**해결**:
```bash
# 1. 환경 변수 확인
cat .env.local | grep UPSTASH

# 2. URL/Token 정확한지 재확인
# Upstash Console에서 다시 복사

# 3. .env.local 재저장 후 재시작
npm run worker
```

### 문제 3: "REST API not enabled"
**증상**: REST API 탭이 보이지 않음

**해결**:
1. Database Details 페이지에서
2. "Enable REST API" 버튼 클릭
3. REST API 탭 다시 확인

---

## 📊 Upstash Console 주요 기능

생성 후 활용할 수 있는 기능들:

### 1. Data Browser
- Redis 데이터 실시간 조회
- Key/Value 직접 수정
- Queue 상태 확인

### 2. Metrics
- Commands/초 그래프
- Storage 사용량
- Connection 수

### 3. CLI
- 웹 기반 Redis CLI
- 직접 명령 실행 가능

---

## 🔒 보안 주의사항

### ⚠️ 절대 하지 말 것
- ❌ GitHub에 .env.local 커밋
- ❌ Token을 코드에 하드코딩
- ❌ 공개 저장소에 Token 노출

### ✅ 해야 할 것
- ✅ .gitignore에 .env.local 추가 (이미 완료)
- ✅ Vercel 환경 변수로 별도 관리
- ✅ Token 주기적으로 Rotate (3개월마다)

---

## 🚀 다음 단계

Upstash Redis 설정 완료 후:

```bash
# 1. 검증
bash scripts/beta-checklist.sh

# 2. 다음 단계: Supabase CLI 설치
# Windows (Scoop)
scoop install supabase

# 3. 전체 배포 진행
bash scripts/quick-start.sh
```

---

## 💡 Pro Tips

1. **Dashboard Bookmark**: https://console.upstash.com 북마크 추천
2. **Metrics 확인**: 주 1회 사용량 모니터링
3. **Free Tier 충분**: 100명 Beta 사용자까지 무료 플랜 OK
4. **Production 준비**: 필요 시 Pay-as-you-go로 자동 업그레이드

---

**설정 소요 시간**: 실제 5-7분이면 완료 가능! 🎉

*최종 업데이트: 2025-12-16*
