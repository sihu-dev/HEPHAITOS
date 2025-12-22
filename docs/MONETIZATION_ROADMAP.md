# HEPHAITOS 수익화 로드맵 (상세 실행 계획서)

> **작성일**: 2025-12-22
> **목표**: 4주 내 수익화 활성화 및 베타 런칭
> **예상 MRR**: ₩62M/월

---

## 전체 타임라인

```
Week 0 (Day 1-2)     Week 1 (Day 3-7)     Week 2 (Day 8-14)    Week 3-4 (Day 15-28)
     │                    │                     │                      │
     ▼                    ▼                     ▼                      ▼
┌─────────┐         ┌──────────┐         ┌───────────┐         ┌────────────┐
│ Phase 0 │────────▶│ Phase 1  │────────▶│ Phase 2   │────────▶│  Phase 3   │
│  기반   │         │ 수익활성 │         │ 소프트런칭│         │   성장     │
└─────────┘         └──────────┘         └───────────┘         └────────────┘
  환경설정            결제+테스트          클로즈드베타          AI멘토+마케팅
```

---

## Phase 0: 기반 설정 (Day 1-2)

### 목표
- [ ] 모든 외부 서비스 연동 활성화
- [ ] 핵심 플로우 수동 테스트 완료

### Task 0.1: API 키 발급 (4시간)

#### 0.1.1 Alpaca (무료 - 미국주식)
```
1. https://app.alpaca.markets/signup 접속
2. 이메일 인증 후 계정 생성
3. Paper Trading 계정 선택 (무료)
4. API Keys 메뉴에서 키 발급
   - API Key ID: ****
   - Secret Key: ****
```

**환경변수:**
```bash
ALPACA_API_KEY=PK***************
ALPACA_API_SECRET=***************
ALPACA_IS_PAPER=true
```

#### 0.1.2 Toss Payments (결제)
```
1. https://developers.tosspayments.com 접속
2. 개발자 등록 (사업자등록증 필요)
3. 테스트 API 키 발급
   - Client Key: test_ck_***
   - Secret Key: test_sk_***
4. 웹훅 URL 등록:
   https://[your-domain]/api/payments/webhook/toss
```

**환경변수:**
```bash
TOSS_CLIENT_KEY=test_ck_***************
TOSS_SECRET_KEY=test_sk_***************
TOSS_TEST=true
```

#### 0.1.3 KIS (한국투자증권 - 한국주식)
```
1. https://apiportal.koreainvestment.com 접속
2. 회원가입 및 API 신청
3. 모의투자 환경 선택
4. 앱키/앱시크릿 발급
```

**환경변수:**
```bash
KIS_APP_KEY=PSk***************
KIS_APP_SECRET=***************
KIS_ACCOUNT_NUMBER=50***-01
KIS_ACCOUNT_PRODUCT_CODE=01
KIS_VIRTUAL=true
```

#### 0.1.4 Anthropic (AI)
```
1. https://console.anthropic.com 접속
2. API Keys 메뉴에서 키 확인/생성
```

**환경변수:**
```bash
ANTHROPIC_API_KEY=sk-ant-api03-***************
```

---

### Task 0.2: 환경변수 설정 (1시간)

**파일 위치:** `/home/user/HEPHAITOS/.env.production`

```bash
# ============================================
# PRODUCTION ENVIRONMENT
# ============================================

# App
NEXT_PUBLIC_APP_URL=https://hephaitos.com
NODE_ENV=production

# Feature Flags
NEXT_PUBLIC_USE_SUPABASE=true
NEXT_PUBLIC_CREDIT_ENABLED=true
NEXT_PUBLIC_WELCOME_BONUS=50
NEXT_PUBLIC_REFERRAL_BONUS=30

# ============================================
# Supabase (이미 설정됨)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://demwsktllidwsxahqyvd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[REDACTED]
SUPABASE_SERVICE_ROLE_KEY=[REDACTED]

# ============================================
# AI Services
# ============================================
ANTHROPIC_API_KEY=sk-ant-api03-[YOUR_KEY]

# ============================================
# US Market - Alpaca
# ============================================
ALPACA_API_KEY=[YOUR_KEY]
ALPACA_API_SECRET=[YOUR_SECRET]
ALPACA_IS_PAPER=true

# ============================================
# Korea Market - KIS
# ============================================
KIS_APP_KEY=[YOUR_KEY]
KIS_APP_SECRET=[YOUR_SECRET]
KIS_ACCOUNT_NUMBER=[YOUR_ACCOUNT]
KIS_ACCOUNT_PRODUCT_CODE=01
KIS_VIRTUAL=true

# ============================================
# Payments - Toss
# ============================================
TOSS_CLIENT_KEY=test_ck_[YOUR_KEY]
TOSS_SECRET_KEY=test_sk_[YOUR_SECRET]
TOSS_TEST=true

# ============================================
# Redis (이미 설정됨)
# ============================================
UPSTASH_REDIS_REST_URL=[EXISTING]
UPSTASH_REDIS_REST_TOKEN=[EXISTING]
```

---

### Task 0.3: 핵심 플로우 검증 (2시간)

#### 체크리스트

| # | 플로우 | 테스트 방법 | 예상 결과 | 상태 |
|---|--------|------------|----------|------|
| 1 | 로그인 | `/auth/login` 접속 → 이메일/비밀번호 입력 | 대시보드 리다이렉트 | [ ] |
| 2 | 회원가입 | `/auth/signup` → 가입 완료 | 웰컴 크레딧 50 지급 | [ ] |
| 3 | 대시보드 | `/dashboard` 접속 | 포트폴리오 표시 | [ ] |
| 4 | 백테스트 | `/dashboard/backtest` → 전략 실행 | 결과 차트 표시 | [ ] |
| 5 | 전략빌더 | `/dashboard/strategy-builder` → 전략 생성 | 저장 성공 | [ ] |
| 6 | AI 코칭 | `/dashboard/coaching` → 질문 입력 | AI 응답 | [ ] |
| 7 | 설정 | `/dashboard/settings` | 프로필 표시 | [ ] |

**테스트 명령어:**
```bash
# 개발 서버 실행
pnpm dev

# 빌드 테스트
pnpm build

# 타입 체크
pnpm typecheck
```

---

### Task 0.4: 완료 기준 (Definition of Done)

- [ ] 모든 환경변수 설정 완료
- [ ] `pnpm build` 성공
- [ ] 7개 핵심 플로우 수동 테스트 통과
- [ ] 콘솔 에러 0개

---

## Phase 1: 수익 활성화 (Day 3-7)

### 목표
- [ ] 결제 플로우 완전 동작
- [ ] 핵심 E2E 테스트 작성
- [ ] 크레딧 차감 로직 활성화

### Task 1.1: 결제 API 연동 완성 (1일)

#### 1.1.1 결제 생성 API 검증
**파일:** `src/app/api/payments/create/route.ts`

```typescript
// 테스트 요청
POST /api/payments/create
{
  "planId": "starter",
  "billingCycle": "monthly"
}

// 예상 응답
{
  "orderId": "HEPH_xxx_xxx",
  "amount": 9900,
  "checkoutUrl": "https://..."
}
```

#### 1.1.2 결제 확인 API 검증
**파일:** `src/app/api/payments/confirm/route.ts`

```typescript
// Toss 결제 완료 후 콜백
GET /api/payments/confirm?paymentKey=xxx&orderId=xxx&amount=9900

// DB 저장 확인
- payment_orders 테이블에 레코드 생성
- credit_transactions 테이블에 크레딧 지급
```

#### 1.1.3 웹훅 처리 검증
**파일:** `src/app/api/payments/webhook/toss/route.ts`

```typescript
// 웹훅 시뮬레이션
POST /api/payments/webhook/toss
{
  "eventType": "PAYMENT_STATUS_CHANGED",
  "data": { "paymentKey": "xxx", "status": "DONE" }
}
```

---

### Task 1.2: 빌링 UI 완성 (1일)

#### 1.2.1 BillingContent 컴포넌트 확인
**파일:** `src/components/billing/BillingContent.tsx`

**필요 기능:**
- [ ] 현재 플랜 표시
- [ ] 크레딧 잔액 표시
- [ ] 플랜 업그레이드 버튼
- [ ] 결제 히스토리

#### 1.2.2 결제 모달 구현
```typescript
// 필요 컴포넌트
src/components/billing/
├── BillingContent.tsx      // 메인 빌링 페이지
├── PlanCard.tsx            // 플랜 카드
├── PaymentModal.tsx        // 결제 모달
├── CreditBalance.tsx       // 크레딧 잔액
└── PaymentHistory.tsx      // 결제 이력
```

---

### Task 1.3: 크레딧 차감 연동 (1일)

#### 1.3.1 기능별 크레딧 비용
**파일:** `src/lib/credits/spend-helper.ts`

| 기능 | Feature ID | 크레딧 | 마진율 |
|------|-----------|--------|-------|
| 셀럽 미러링 | `celebrity_mirror` | 0 | 100% |
| AI 튜터 | `ai_tutor` | 1 | 96% |
| AI 전략생성 | `ai_strategy` | 10 | 96% |
| 백테스트 1년 | `backtest_1y` | 3 | 96% |
| 백테스트 5년 | `backtest_5y` | 10 | 96% |
| 라이브코칭 30분 | `live_coaching_30m` | 20 | 95% |
| 포트폴리오 분석 | `portfolio_analysis` | 5 | 96% |

#### 1.3.2 백테스트 크레딧 차감 연동
**파일:** `src/app/api/backtest/route.ts`

```typescript
// 크레딧 차감 로직 추가
import { spendCredits, InsufficientCreditsError } from '@/lib/credits/spend-helper'

export async function POST(request: Request) {
  const { userId, config } = await request.json()

  // 기간에 따른 크레딧 비용
  const years = calculateYears(config.startDate, config.endDate)
  const creditCost = years <= 1 ? 3 : 10

  try {
    // 크레딧 차감
    await spendCredits({
      userId,
      feature: years <= 1 ? 'backtest_1y' : 'backtest_5y',
      amount: creditCost,
      metadata: { strategyId: config.strategyId }
    })

    // 백테스트 실행
    // ...
  } catch (error) {
    if (error instanceof InsufficientCreditsError) {
      return Response.json({
        error: 'INSUFFICIENT_CREDITS',
        required: error.required,
        current: error.current
      }, { status: 402 })
    }
    throw error
  }
}
```

#### 1.3.3 전략 생성 크레딧 차감
**파일:** `src/app/api/strategies/route.ts`

```typescript
// AI 전략 생성 시 10 크레딧 차감
await spendCredits({
  userId,
  feature: 'ai_strategy',
  amount: 10,
  metadata: { strategyName: strategy.name }
})
```

---

### Task 1.4: E2E 테스트 작성 (1일)

#### 1.4.1 Playwright 테스트 파일
**파일:** `e2e/payments.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Payment Flow', () => {
  test('should complete starter plan purchase', async ({ page }) => {
    // 1. 로그인
    await page.goto('/auth/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    // 2. 빌링 페이지 이동
    await page.goto('/dashboard/settings/billing')

    // 3. Starter 플랜 선택
    await page.click('[data-plan="starter"]')

    // 4. 결제 버튼 클릭
    await page.click('[data-action="checkout"]')

    // 5. Toss 결제 페이지 확인
    await expect(page).toHaveURL(/tosspayments/)
  })

  test('should show insufficient credits error', async ({ page }) => {
    // 크레딧 0인 상태에서 백테스트 시도
    await page.goto('/dashboard/backtest')
    await page.click('[data-action="run-backtest"]')

    // 크레딧 부족 에러 표시
    await expect(page.locator('[data-error="insufficient-credits"]')).toBeVisible()
  })
})
```

#### 1.4.2 테스트 실행
```bash
# E2E 테스트 실행
pnpm test:e2e

# 특정 테스트만 실행
pnpm test:e2e e2e/payments.spec.ts
```

---

### Task 1.5: 완료 기준

- [ ] Toss 테스트 결제 성공 (실제 카드로 100원 결제 후 환불)
- [ ] 결제 후 크레딧 지급 확인
- [ ] 백테스트 실행 시 크레딧 차감 확인
- [ ] E2E 테스트 3개 이상 통과
- [ ] 크레딧 부족 시 에러 메시지 표시

---

## Phase 2: 소프트 런칭 (Day 8-14)

### 목표
- [ ] 클로즈드 베타 50명 모집
- [ ] 핵심 피드백 수집
- [ ] 랜딩 페이지 최적화

### Task 2.1: 베타 사용자 모집 (2일)

#### 2.1.1 모집 채널
| 채널 | 타겟 | 목표 인원 |
|------|------|----------|
| 주식 커뮤니티 (클리앙, 디시) | 개인투자자 | 20명 |
| 개발자 커뮤니티 (GeekNews) | 퀀트 지망생 | 15명 |
| 지인 추천 | 얼리어답터 | 10명 |
| SNS (트위터, 링크드인) | 스타트업 관계자 | 5명 |

#### 2.1.2 베타 혜택
```
🎁 클로즈드 베타 참여자 혜택
├── 영구 Pro 플랜 50% 할인
├── 웰컴 크레딧 500 (일반 50)
├── 피드백 제출 시 추가 크레딧 100
└── 정식 출시 후 '얼리버드' 배지
```

#### 2.1.3 베타 코드 시스템
**파일:** `src/lib/beta/invite-code.ts`

```typescript
// 베타 초대 코드 생성
export function generateBetaCode(): string {
  const prefix = 'HEPH-BETA'
  const random = crypto.randomUUID().substring(0, 8).toUpperCase()
  return `${prefix}-${random}`
}

// 베타 코드 검증
export async function validateBetaCode(code: string): Promise<boolean> {
  const { data } = await supabase
    .from('beta_codes')
    .select('*')
    .eq('code', code)
    .eq('used', false)
    .single()

  return !!data
}
```

---

### Task 2.2: 피드백 시스템 구축 (1일)

#### 2.2.1 인앱 피드백 위젯
**파일:** `src/components/feedback/FeedbackWidget.tsx`

```typescript
// 모든 페이지 하단에 피드백 버튼
export function FeedbackWidget() {
  return (
    <div className="fixed bottom-4 right-4">
      <Button onClick={openFeedbackModal}>
        💬 피드백
      </Button>
    </div>
  )
}
```

#### 2.2.2 피드백 카테고리
| 카테고리 | 설명 | 우선순위 |
|---------|------|---------|
| 버그 리포트 | 오류 발생 | P0 |
| 기능 요청 | 새 기능 제안 | P1 |
| UX 개선 | 사용성 문제 | P2 |
| 일반 의견 | 기타 | P3 |

#### 2.2.3 피드백 저장
**테이블:** `supabase/migrations/xxx_feedback.sql`

```sql
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  page_url TEXT,
  screenshot_url TEXT,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Task 2.3: 랜딩 페이지 최적화 (2일)

#### 2.3.1 현재 랜딩 페이지 분석
**파일:** `src/app/page.tsx`

**최적화 포인트:**
- [ ] 히어로 섹션 CTA 강화
- [ ] 소셜 프루프 추가 (베타 사용자 수)
- [ ] 가격 섹션 명확화
- [ ] FAQ 추가
- [ ] 면책조항 추가

#### 2.3.2 A/B 테스트 설정
```typescript
// 두 가지 CTA 테스트
const variants = {
  A: '무료로 시작하기',      // 기존
  B: '지금 바로 전략 만들기'  // 행동 유도
}
```

#### 2.3.3 전환율 추적
**PostHog 이벤트:**
```typescript
posthog.capture('landing_cta_click', {
  variant: 'A',
  button_text: '무료로 시작하기',
  section: 'hero'
})
```

---

### Task 2.4: 모니터링 대시보드 (1일)

#### 2.4.1 핵심 메트릭
| 메트릭 | 계산 방식 | 목표 |
|--------|----------|------|
| DAU | 일일 활성 사용자 | 30명 |
| Activation Rate | 회원가입 → 백테스트 실행 | 40% |
| Retention D7 | 7일 후 재방문 | 30% |
| Conversion | Free → Paid | 10% |

#### 2.4.2 Supabase RPC
**파일:** `supabase/migrations/xxx_analytics.sql`

```sql
-- DAU 조회
CREATE FUNCTION get_dau(target_date DATE)
RETURNS INTEGER AS $$
  SELECT COUNT(DISTINCT user_id)
  FROM analytics_events
  WHERE DATE(created_at) = target_date;
$$ LANGUAGE SQL;

-- 전환율 조회
CREATE FUNCTION get_conversion_rate(start_date DATE, end_date DATE)
RETURNS NUMERIC AS $$
  WITH signups AS (
    SELECT COUNT(*) as total FROM auth.users
    WHERE DATE(created_at) BETWEEN start_date AND end_date
  ),
  paid AS (
    SELECT COUNT(DISTINCT user_id) as total
    FROM payment_orders
    WHERE status = 'completed'
    AND DATE(created_at) BETWEEN start_date AND end_date
  )
  SELECT ROUND(paid.total::numeric / NULLIF(signups.total, 0) * 100, 2)
  FROM signups, paid;
$$ LANGUAGE SQL;
```

---

### Task 2.5: 완료 기준

- [ ] 베타 사용자 50명 모집 완료
- [ ] 피드백 10건 이상 수집
- [ ] 랜딩 페이지 전환율 측정 시작
- [ ] DAU 30명 달성
- [ ] 크리티컬 버그 0건

---

## Phase 3: 성장 (Day 15-28)

### 목표
- [ ] AI 멘토 코칭 기능 완성
- [ ] 퍼블릭 런칭
- [ ] MRR ₩10M 달성

### Task 3.1: AI 멘토 코칭 완성 (5일)

#### 3.1.1 현재 상태
**파일:** `src/components/coaching/`

```
현재 구현:
✅ 코칭 UI 컴포넌트
✅ 스크린 공유 위젯
⚠️ AI 튜터 통합 (60%)
❌ 실시간 채팅
❌ 세션 관리
```

#### 3.1.2 필요 구현
**파일:** `src/lib/coaching/ai-mentor.ts`

```typescript
export class AIMentor {
  private anthropic: Anthropic

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    })
  }

  /**
   * 투자 질문에 대한 AI 멘토 응답
   * @important 투자 조언 금지 - 교육 목적만
   */
  async chat(message: string, context: MentorContext): Promise<string> {
    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: `당신은 HEPHAITOS의 AI 투자 교육 멘토입니다.

        중요 규칙:
        - 투자 조언 절대 금지 (법적 문제)
        - "~하세요" 권유형 금지
        - 교육 목적으로만 설명
        - "과거 성과는 미래를 보장하지 않습니다" 항상 언급

        사용자 컨텍스트:
        - 투자 경험: ${context.experience}
        - 관심 분야: ${context.interests}
        - 현재 학습 단계: ${context.learningStage}`,
      messages: [{ role: 'user', content: message }]
    })

    return response.content[0].text
  }

  /**
   * 전략 분석 피드백
   */
  async analyzeStrategy(strategy: Strategy): Promise<StrategyFeedback> {
    // 전략의 강점/약점 분석
    // 교육적 관점에서 설명
  }

  /**
   * 백테스트 결과 해석
   */
  async interpretBacktest(result: BacktestResult): Promise<string> {
    // 결과 해석
    // 개선 포인트 제안 (교육적)
  }
}
```

#### 3.1.3 실시간 채팅 구현
**파일:** `src/lib/coaching/realtime-chat.ts`

```typescript
// Supabase Realtime 사용
export function useCoachingChat(sessionId: string) {
  const supabase = createClientComponentClient()

  useEffect(() => {
    const channel = supabase
      .channel(`coaching:${sessionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'coaching_messages',
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        // 새 메시지 수신
        addMessage(payload.new)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [sessionId])
}
```

#### 3.1.4 세션 관리
**테이블:** `coaching_sessions`

```sql
CREATE TABLE coaching_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  mentor_type TEXT DEFAULT 'ai', -- 'ai' | 'human'
  status TEXT DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  credits_spent INTEGER DEFAULT 0,
  rating INTEGER,
  feedback TEXT
);

CREATE TABLE coaching_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES coaching_sessions(id),
  role TEXT NOT NULL, -- 'user' | 'assistant'
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Task 3.2: 마케팅 준비 (3일)

#### 3.2.1 콘텐츠 마케팅
| 채널 | 콘텐츠 | 빈도 |
|------|--------|------|
| 블로그 | "자연어로 만드는 트레이딩 봇" | 주 2회 |
| 유튜브 | 백테스트 튜토리얼 | 주 1회 |
| 뉴스레터 | 주간 시장 분석 (면책조항 포함) | 주 1회 |

#### 3.2.2 SEO 키워드
| 키워드 | 검색량 | 난이도 | 우선순위 |
|--------|--------|--------|---------|
| 자동매매 프로그램 | 2,400 | 중 | P1 |
| 백테스트 사이트 | 880 | 낮음 | P1 |
| AI 주식 분석 | 1,600 | 높음 | P2 |
| 퀀트 투자 배우기 | 590 | 낮음 | P1 |

#### 3.2.3 레퍼럴 프로그램
```typescript
// 추천인 보상 시스템
const REFERRAL_REWARDS = {
  referrer: 30,  // 추천한 사람
  referee: 50,   // 추천받은 사람 (웰컴 보너스에 추가)
}
```

---

### Task 3.3: 퍼블릭 런칭 (2일)

#### 3.3.1 런칭 체크리스트
- [ ] 모든 E2E 테스트 통과
- [ ] 부하 테스트 완료 (100 concurrent users)
- [ ] 면책조항 모든 페이지 확인
- [ ] 환불 정책 페이지 확인
- [ ] 고객지원 채널 준비 (이메일, 채팅)
- [ ] 에러 모니터링 (Sentry) 활성화
- [ ] 백업 시스템 확인

#### 3.3.2 런칭 일정
```
D-3: 최종 QA
D-2: 스테이징 환경 테스트
D-1: 마케팅 자료 준비
D-Day: 프로덕션 배포
D+1: 모니터링 강화
D+7: 첫 주 회고
```

#### 3.3.3 롤백 계획
```bash
# 긴급 롤백 명령
vercel rollback [deployment-id]

# 또는 Git 롤백
git revert HEAD
git push origin main
```

---

### Task 3.4: 완료 기준

- [ ] AI 멘토 코칭 정상 동작
- [ ] 퍼블릭 런칭 완료
- [ ] MRR ₩10M 달성
- [ ] NPS 40+ 달성
- [ ] 크리티컬 버그 0건

---

## 부록 A: 파일 변경 목록

### Phase 0
| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `.env.production` | 수정 | 환경변수 추가 |

### Phase 1
| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `src/app/api/backtest/route.ts` | 수정 | 크레딧 차감 추가 |
| `src/app/api/strategies/route.ts` | 수정 | 크레딧 차감 추가 |
| `src/components/billing/PaymentModal.tsx` | 신규 | 결제 모달 |
| `e2e/payments.spec.ts` | 신규 | E2E 테스트 |

### Phase 2
| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `src/lib/beta/invite-code.ts` | 신규 | 베타 코드 시스템 |
| `src/components/feedback/FeedbackWidget.tsx` | 신규 | 피드백 위젯 |
| `supabase/migrations/xxx_feedback.sql` | 신규 | 피드백 테이블 |

### Phase 3
| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `src/lib/coaching/ai-mentor.ts` | 신규 | AI 멘토 클래스 |
| `src/lib/coaching/realtime-chat.ts` | 신규 | 실시간 채팅 |
| `supabase/migrations/xxx_coaching.sql` | 신규 | 코칭 테이블 |

---

## 부록 B: 리스크 및 대응

| 리스크 | 영향 | 확률 | 대응 |
|--------|------|------|------|
| Toss API 장애 | 결제 불가 | 낮음 | 대체 결제 수단 (카카오페이) 준비 |
| AI API 비용 초과 | 마진 감소 | 중간 | Rate limiting, 캐싱 |
| 베타 피드백 부정적 | 런칭 지연 | 중간 | 빠른 대응, 핫픽스 |
| 법률 이슈 | 서비스 중단 | 낮음 | 법무 검토 선행 |

---

## 부록 C: 성공 메트릭

### 4주 후 목표

| 메트릭 | 목표 | 측정 방법 |
|--------|------|----------|
| MAU | 500명 | Supabase Auth |
| 유료 전환 | 50명 (10%) | payment_orders |
| MRR | ₩500,000 | SUM(amount) |
| NPS | 40+ | 설문조사 |
| Churn | <5% | 월간 이탈률 |

### 12주 후 목표

| 메트릭 | 목표 |
|--------|------|
| MAU | 5,000명 |
| 유료 전환 | 500명 |
| MRR | ₩12,500,000 |
| ARR | ₩150,000,000 |

---

**문서 끝**

*이 로드맵은 HEPHAITOS 사업 헌법(BUSINESS_CONSTITUTION.md)을 준수합니다.*
*최종 수정: 2025-12-22*
