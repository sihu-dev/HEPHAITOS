# HEPHAITOS Private Beta Launch Checklist

> **Target**: 50 Users (Private Beta)
> **Date**: 2025-01-XX
> **Version**: 1.0

---

## 📋 목차

1. [사전 준비 (Pre-Launch)](#사전-준비-pre-launch)
2. [런칭 당일 (Launch Day)](#런칭-당일-launch-day)
3. [런칭 후 모니터링 (Post-Launch)](#런칭-후-모니터링-post-launch)
4. [긴급 대응 (Emergency Response)](#긴급-대응-emergency-response)
5. [성공 지표 (Success Metrics)](#성공-지표-success-metrics)

---

## 사전 준비 (Pre-Launch)

### 1주일 전

#### ☑️ 인프라 검증

- [ ] **Vercel 배포 성공**
  ```bash
  vercel --prod
  # 배포 URL 확인: https://hephaitos.io
  ```
  - [ ] 프로덕션 빌드 성공
  - [ ] 환경 변수 모두 설정됨
  - [ ] 커스텀 도메인 연결 확인
  - [ ] SSL 인증서 활성화

- [ ] **Supabase 프로덕션 준비**
  - [ ] Pro 플랜 업그레이드 완료 ($25/월)
  - [ ] 모든 Migration 실행 완료
    ```bash
    supabase db push
    supabase db diff  # 빈 결과 확인
    ```
  - [ ] RLS 정책 전체 활성화 확인
    ```sql
    SELECT tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
    AND rowsecurity = false;
    -- 0 rows 반환되어야 함
    ```
  - [ ] Edge Function 배포 완료
    ```bash
    supabase functions list
    # auto-refund 확인
    ```

- [ ] **Upstash Redis 설정**
  - [ ] Pay-as-you-go 플랜 활성화
  - [ ] Redis URL 환경 변수 설정
  - [ ] Queue 연결 테스트
    ```bash
    node scripts/test-redis-connection.js
    ```

- [ ] **Toss Payments 프로덕션**
  - [ ] 실 계좌 등록 완료
  - [ ] Live API Key 발급
  - [ ] 환경 변수 업데이트 (`TOSS_SECRET_KEY=live_sk_...`)
  - [ ] 테스트 결제 1회 실행 (₩100 → 환불)

#### ☑️ 코드 품질 검증

- [ ] **타입 체크 통과**
  ```bash
  pnpm type-check
  # 0 errors
  ```

- [ ] **빌드 성공**
  ```bash
  pnpm build
  # ✓ Compiled successfully
  ```

- [ ] **법률 준수 체크**
  - [ ] 모든 트레이딩 UI에 면책조항 표시
  - [ ] "투자 조언" 표현 전혀 없음
  - [ ] "수익 보장" 표현 전혀 없음
  - [ ] 이용약관 및 개인정보처리방침 작성

- [ ] **보안 검증**
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` 클라이언트 노출 여부 확인
  - [ ] API Rate Limiting 동작 확인
  - [ ] XSS 방지 검증 (DOMPurify 적용)

#### ☑️ 기능 E2E 테스트

- [ ] **인증 플로우**
  - [ ] Google OAuth 로그인 성공
  - [ ] Kakao OAuth 로그인 성공
  - [ ] 로그아웃 성공
  - [ ] 미인증 시 리다이렉트 정상

- [ ] **전략 빌더**
  - [ ] 전략 생성 성공
  - [ ] 전략 저장 성공 (Supabase 확인)
  - [ ] 전략 불러오기 성공
  - [ ] 노드 추가/삭제 정상 작동

- [ ] **백테스트 큐 시스템 (Loop 11)**
  - [ ] 백테스트 요청 성공
  - [ ] Queue에 Job 추가 확인 (Redis)
  - [ ] Worker 처리 확인
  - [ ] Realtime 진행률 업데이트 확인
  - [ ] 대시보드에서 결과 조회 성공

- [ ] **리더보드 (Loop 12)**
  - [ ] `/api/strategies/leaderboard` 응답 정상
  - [ ] Sharpe/CAGR 정렬 정상
  - [ ] 캐싱 동작 확인 (1시간)

- [ ] **환불 자동화 (Loop 13)**
  - [ ] 환불 요청 생성 성공
  - [ ] 자격 검증 정상 (14일, 1회/년)
  - [ ] Edge Function 호출 성공
  - [ ] Toss API 환불 성공 (테스트 결제)
  - [ ] 크레딧 회수 트리거 동작

#### ☑️ 성능 테스트

- [ ] **부하 테스트 (Load Test)**
  ```bash
  node scripts/load-test-queue.ts --jobs=50 --concurrent=10
  ```
  - [ ] 평균 대기시간 <30초
  - [ ] Worker concurrency 5 확인
  - [ ] Redis 연결 안정성 확인

- [ ] **Lighthouse 점수**
  - [ ] Performance: >90
  - [ ] Accessibility: >90
  - [ ] Best Practices: >90
  - [ ] SEO: >90

#### ☑️ 모니터링 설정

- [ ] **Sentry 연동**
  ```bash
  # .env.production.local
  NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
  ```
  - [ ] 에러 발생 시 Sentry에 기록 확인
  - [ ] Slack 알림 연동

- [ ] **Vercel Analytics**
  - [ ] 대시보드 접근 확인
  - [ ] 실시간 방문자 추적 확인

- [ ] **UptimeRobot**
  - [ ] Health Check 모니터 설정 (`/api/health`)
  - [ ] 5분 간격 체크
  - [ ] 이메일 + Slack 알림

#### ☑️ Worker 프로세스 배포

**Option A: Vercel Cron (권장)**
- [ ] `vercel.json`에 Cron 설정 추가
  ```json
  {
    "crons": [
      {
        "path": "/api/cron/process-queue",
        "schedule": "*/1 * * * *"
      }
    ]
  }
  ```
- [ ] `CRON_SECRET` 환경 변수 설정
- [ ] Cron 실행 로그 확인 (Vercel Dashboard)

**Option B: Railway/Render (대안)**
- [ ] Dockerfile 작성
- [ ] Railway/Render 프로젝트 생성
- [ ] 환경 변수 설정
- [ ] Worker 배포 확인
- [ ] 로그 모니터링 설정

---

### 3일 전

#### ☑️ 콘텐츠 준비

- [ ] **온보딩 가이드 작성**
  - [ ] "HEPHAITOS 시작하기" 튜토리얼
  - [ ] 전략 빌더 사용법 영상 (3분)
  - [ ] FAQ 작성 (최소 10개)

- [ ] **초대 이메일 템플릿**
  ```markdown
  제목: [HEPHAITOS] Private Beta 초대장이 도착했습니다 🔥

  안녕하세요, {이름}님!

  HEPHAITOS Private Beta에 초대합니다.
  코딩 없이, 자연어로 AI 트레이딩 봇을 만들 수 있습니다.

  [시작하기] 버튼

  베타 특전:
  - 무제한 백테스트 (정식 출시 후 100회/월)
  - Pro 기능 무료 체험 (3개월)
  - 피드백 제공 시 1년 무료 구독

  기대하겠습니다!
  HEPHAITOS Team
  ```

- [ ] **피드백 수집 채널**
  - [ ] Discord 서버 생성
  - [ ] Google Form 설문 작성
  - [ ] 1:1 피드백 세션 캘린더 공유

#### ☑️ 베타 유저 리스트 준비

- [ ] **50명 선정 완료**
  - [ ] 직장인 개미: 25명
  - [ ] 대학생 퀀트 지망생: 15명
  - [ ] 은퇴 준비 투자자: 10명

- [ ] **초대 우선순위**
  1. Early Adopter (관심 표현한 사용자)
  2. 다양한 투자 경험 (초보~고급)
  3. 피드백 제공 의지 높은 사람

---

### 1일 전

#### ☑️ 최종 점검

- [ ] **프로덕션 환경 최종 확인**
  ```bash
  curl https://hephaitos.io/api/health
  # {"status":"ok","timestamp":"...","services":{"database":"connected","redis":"connected"}}
  ```

- [ ] **데이터베이스 백업**
  ```bash
  supabase db dump > backup-$(date +%Y%m%d).sql
  ```

- [ ] **롤백 계획 준비**
  - [ ] 이전 Vercel 배포 URL 확인
  - [ ] 롤백 명령어 준비
    ```bash
    vercel rollback <previous-deployment-url>
    ```

- [ ] **팀 브리핑**
  - [ ] 런칭 일정 공유
  - [ ] 긴급 연락망 확인
  - [ ] 당직 스케줄 수립

---

## 런칭 당일 (Launch Day)

### D-Day 오전 (10:00 AM)

#### ☑️ 최종 시스템 체크

- [ ] **Health Check**
  ```bash
  curl https://hephaitos.io/api/health
  ```

- [ ] **모니터링 대시보드 오픈**
  - [ ] Vercel Dashboard (배포 상태)
  - [ ] Supabase Dashboard (DB 상태)
  - [ ] Sentry (에러 추적)
  - [ ] UptimeRobot (가동 시간)

- [ ] **Worker 상태 확인**
  ```bash
  # Vercel Cron
  vercel logs --follow

  # Railway/Render
  railway logs --follow
  ```

### D-Day 정오 (12:00 PM)

#### ☑️ 초대 이메일 발송

- [ ] **1차 발송 (25명)**
  - [ ] 이메일 발송 완료
  - [ ] 발송 실패 여부 확인
  - [ ] 오픈율 모니터링 시작

- [ ] **Slack/Discord 공지**
  ```markdown
  🎉 HEPHAITOS Private Beta 런칭!

  첫 25명에게 초대장을 발송했습니다.
  피드백을 기다립니다!
  ```

### D-Day 오후 (14:00 - 18:00)

#### ☑️ 실시간 모니터링

- [ ] **가입 현황 추적**
  - [ ] Supabase > Auth > Users 확인
  - [ ] 목표: 첫 4시간 내 10명 가입

- [ ] **에러 모니터링**
  - [ ] Sentry 대시보드 확인 (에러 0건 유지)
  - [ ] Vercel Logs 확인

- [ ] **사용자 행동 추적**
  - [ ] 첫 전략 생성 수
  - [ ] 첫 백테스트 실행 수
  - [ ] 평균 세션 시간

#### ☑️ 실시간 지원

- [ ] **Discord 채팅 모니터링**
  - [ ] 질문에 즉시 답변 (<5분)
  - [ ] 버그 리포트 즉시 기록

- [ ] **1:1 온보딩 세션**
  - [ ] 첫 10명에게 개별 연락
  - [ ] 화면 공유로 사용법 안내

### D-Day 저녁 (18:00 - 22:00)

#### ☑️ 2차 초대 발송 (25명)

- [ ] **나머지 25명 발송**
  - [ ] 1차 피드백 반영
  - [ ] 이메일 문구 최적화

- [ ] **일일 리포트 작성**
  ```markdown
  ## HEPHAITOS Beta Day 1 리포트

  ### 핵심 지표
  - 초대: 50명
  - 가입: X명 (X%)
  - 전략 생성: X개
  - 백테스트 실행: X회
  - 에러: X건

  ### 주요 피드백
  1. ...
  2. ...

  ### 개선 사항
  - [ ] ...
  ```

---

## 런칭 후 모니터링 (Post-Launch)

### 첫 48시간

#### ☑️ 매 6시간마다

- [ ] **시스템 안정성**
  - [ ] Uptime: 99.9%+ 유지
  - [ ] 응답 시간: <500ms
  - [ ] Worker 정상 작동

- [ ] **사용자 지표**
  - [ ] 누적 가입 수
  - [ ] DAU (Daily Active Users)
  - [ ] 전략 생성 수
  - [ ] 백테스트 실행 수

- [ ] **에러 추적**
  - [ ] Critical: 0건
  - [ ] High: <5건
  - [ ] Medium/Low: 우선순위 분류

#### ☑️ 핫픽스 배포 기준

**즉시 배포 (Critical)**
- 회원가입 불가
- 결제 시스템 오류
- 데이터 손실
- 보안 취약점

**24시간 내 배포 (High)**
- 백테스트 실패율 >10%
- UI 깨짐 (주요 페이지)
- 성능 저하 (응답 >2초)

**다음 배포 (Medium/Low)**
- 작은 UI 버그
- 기능 개선 요청
- 문구 수정

### 첫 1주일

#### ☑️ 매일 체크

- [ ] **일일 리포트 작성**
  - [ ] 가입 수 추이
  - [ ] 활성 사용자 수 (DAU)
  - [ ] 주요 피드백 요약
  - [ ] 긴급 이슈 여부

- [ ] **사용자 인터뷰 (2명/일)**
  - [ ] 첫 인상
  - [ ] 불편한 점
  - [ ] 가장 좋았던 점
  - [ ] 개선 제안

#### ☑️ 주간 회고 (Day 7)

```markdown
## HEPHAITOS Beta Week 1 회고

### 정량 지표
| 지표 | 목표 | 실제 | 달성률 |
|------|------|------|--------|
| 가입 수 | 50명 | X명 | X% |
| DAU | 30명 | X명 | X% |
| 전략 생성 | 100개 | X개 | X% |
| 백테스트 | 500회 | X회 | X% |
| Uptime | 99.9% | X% | X% |

### 정성 피드백
**긍정**
- ...

**부정**
- ...

**개선 우선순위**
1. ...
2. ...
3. ...

### 다음 주 목표
- [ ] ...
```

### 첫 1개월

#### ☑️ 주간 배포 (매주 금요일)

- [ ] **릴리즈 노트 작성**
  ```markdown
  ## v0.2.0 (2025-01-XX)

  ### ✨ New Features
  - ...

  ### 🐛 Bug Fixes
  - ...

  ### 💅 Improvements
  - ...
  ```

- [ ] **베타 유저 공지**
  - [ ] 이메일 발송
  - [ ] Discord 공지
  - [ ] 변경 사항 안내

#### ☑️ 월간 회고 (Day 30)

```markdown
## HEPHAITOS Beta Month 1 총괄

### 성과
- 베타 유저: X명 (목표: 50명)
- 전략 생성: X개
- 백테스트: X회
- 유료 전환 의향: X명

### 학습
- ...

### 피벗 필요 여부
- [ ] 현재 방향 유지
- [ ] 부분 조정 필요
- [ ] 대대적 변경 필요

### 정식 런칭 준비도
- [ ] 베타 테스트 완료
- [ ] 핵심 버그 0건
- [ ] 마케팅 준비 완료
- [ ] 정식 런칭 Go/No-Go 결정
```

---

## 긴급 대응 (Emergency Response)

### Critical 장애 발생 시

#### ☑️ 즉시 조치 (5분 내)

1. **상황 파악**
   ```bash
   # 에러 로그 확인
   vercel logs --follow

   # Sentry 확인
   # DB 상태 확인
   ```

2. **사용자 공지**
   ```markdown
   🚨 긴급 공지

   현재 일시적인 장애가 발생했습니다.
   복구 중이니 잠시만 기다려주세요.

   예상 복구 시간: XX분
   ```

3. **롤백 실행** (복구 불가 시)
   ```bash
   # Vercel 롤백
   vercel rollback <previous-deployment-url>

   # Supabase Migration 롤백
   supabase db reset --to <previous-migration>
   ```

#### ☑️ 복구 후 (1시간 내)

- [ ] **원인 분석 리포트 작성**
  ```markdown
  ## 장애 리포트 (2025-01-XX)

  ### 발생 시간
  XX:XX - XX:XX (총 XX분)

  ### 영향 범위
  - 영향받은 사용자: X명
  - 중단된 기능: ...

  ### 원인
  - ...

  ### 조치
  - ...

  ### 재발 방지
  - [ ] ...
  ```

- [ ] **사용자 사과 공지**
  - [ ] 장애 내용 설명
  - [ ] 재발 방지 약속
  - [ ] 보상 (크레딧 지급 등)

### 보안 사고 발생 시

#### ☑️ 즉시 조치

1. **서비스 일시 중단** (데이터 유출 위험 시)
   ```bash
   vercel --prod --yes --force
   # Maintenance 모드 배포
   ```

2. **DB 액세스 제한**
   ```bash
   # Supabase Dashboard > Settings > Database
   # Connection Pooling 비활성화
   ```

3. **보안 전문가 연락**
   - [ ] 외부 보안 컨설턴트
   - [ ] 법률 자문

4. **영향 범위 파악**
   - [ ] 유출된 데이터 확인
   - [ ] 영향받은 사용자 확인

#### ☑️ 사후 조치

- [ ] **사용자 공지** (투명성)
  - [ ] 사고 내용 상세 공개
  - [ ] 조치 사항 공개
  - [ ] 향후 대책 공개

- [ ] **비밀번호 재설정 요청**
  - [ ] 모든 사용자 강제 로그아웃
  - [ ] 비밀번호 재설정 이메일 발송

- [ ] **보안 강화**
  - [ ] 취약점 패치
  - [ ] 보안 감사 실시
  - [ ] 침투 테스트

---

## 성공 지표 (Success Metrics)

### 베타 목표 (1개월)

| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| **가입률** | 80% (40/50명) | Supabase > Auth > Users |
| **활성 사용자** | 60% (30/50명) | 주 1회 이상 로그인 |
| **전략 생성** | 100개 | Supabase > strategies 테이블 |
| **백테스트** | 500회 | backtest_jobs 테이블 |
| **Uptime** | 99.9% | UptimeRobot |
| **평균 응답 시간** | <500ms | Vercel Analytics |
| **Critical 에러** | 0건 | Sentry |
| **유료 전환 의향** | 20% (10/50명) | 설문조사 |

### 피드백 수집

#### ☑️ 정량 설문 (Google Form)

**질문 예시:**
1. HEPHAITOS를 친구에게 추천하시겠습니까? (NPS)
   - 0-10점 척도

2. 전반적인 만족도는?
   - 1-5점 척도

3. 가장 유용한 기능은?
   - Copy / Learn / Build 중 선택

4. 가장 불편한 점은?
   - 텍스트 입력

5. 월 ₩29,900에 구독하시겠습니까?
   - 예 / 아니요 / 고민 중

#### ☑️ 정성 인터뷰 (1:1 세션)

**질문 예시:**
- 첫 인상은?
- 가장 기대했던 기능은?
- 실제로 사용해보니?
- 어떤 점이 개선되면 좋을까요?
- 경쟁 서비스 대비 장점은?

### 성공 판단 기준

#### ✅ 정식 런칭 Go (다음 단계 진행)

- [x] 가입률 >70%
- [x] DAU >50%
- [x] NPS >40
- [x] Critical 에러 0건
- [x] 유료 전환 의향 >15%

#### ⚠️ 피벗 필요 (일부 조정)

- [ ] 가입률 50-70%
- [ ] DAU 30-50%
- [ ] NPS 20-40
- [ ] Critical 에러 1-2건

#### 🛑 재검토 필요 (대대적 변경)

- [ ] 가입률 <50%
- [ ] DAU <30%
- [ ] NPS <20
- [ ] Critical 에러 >3건

---

## 부록: 긴급 연락망

| 역할 | 이름 | 연락처 | 담당 영역 |
|------|------|--------|----------|
| **CTO** | ... | ... | 전체 기술 총괄 |
| **DevOps** | ... | ... | 인프라, 배포 |
| **Backend** | ... | ... | API, DB |
| **Frontend** | ... | ... | UI, UX |
| **CS** | ... | ... | 사용자 지원 |

### 에스컬레이션 프로세스

```
Level 1 (Low) → Discord 채팅
  ↓ (해결 안되면)
Level 2 (Medium) → Slack @channel
  ↓ (해결 안되면)
Level 3 (High) → CTO 전화
  ↓ (해결 안되면)
Level 4 (Critical) → 전체 팀 긴급 소집
```

---

**작성일**: 2025-12-22
**담당자**: DevOps Team
**승인**: CTO
