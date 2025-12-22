# HEPHAITOS 개발자 온보딩 가이드

> **신규 개발자를 위한 완벽한 시작 가이드**
>
> **목표**: 첫날부터 PR 날릴 수 있도록!
> **소요 시간**: 4시간 (환경 설정 1시간 + 코드베이스 학습 3시간)
> **업데이트**: 2025-12-22

---

## 📋 목차

1. [환영합니다!](#1-환영합니다)
2. [빠른 시작](#2-빠른-시작-quick-start)
3. [프로젝트 구조](#3-프로젝트-구조)
4. [핵심 개념](#4-핵심-개념)
5. [개발 워크플로우](#5-개발-워크플로우)
6. [코드 스타일](#6-코드-스타일)
7. [테스팅](#7-테스팅)
8. [배포](#8-배포)
9. [FAQ](#9-faq)
10. [도움 받기](#10-도움-받기)

---

## 1. 환영합니다!

### 🎉 HEPHAITOS 팀에 오신 것을 환영합니다!

우리는 **"Replit for Trading"**을 만들고 있습니다.
코딩 없이 누구나 AI 트레이딩 시스템을 만들 수 있는 플랫폼입니다.

### 🎯 우리의 미션

```
"모든 개인 투자자가 기관급 AI 트레이딩 시스템을
 소유할 수 있는 세상을 만든다"
```

### 📚 필수 읽기 자료 (첫 주)

1. **BUSINESS_CONSTITUTION.md** - 사업 헌법 (불변 원칙)
   - Copy-Learn-Build 모델 이해
   - 법률 준수 사항 (투자 조언 금지!)
   - 타겟 페르소나 (민수/지현/영호)

2. **DESIGN_SYSTEM.md** - Linear-inspired Dark Theme
   - 컬러 팔레트, 타이포그래피
   - Glass Morphism 디자인 패턴
   - 컴포넌트 사용법

3. **CLAUDE_FEATURES_INTEGRATION_ANALYSIS.md** - AI 전략
   - Prompt Caching으로 비용 -90%
   - Vision API로 차트 분석
   - 경쟁 우위 핵심

### 🛠️ 개발 환경 요구사항

**필수**:
- Node.js 18+ (권장: 20 LTS)
- pnpm 8+ (`npm install -g pnpm`)
- Git
- VS Code (권장 IDE)

**권장**:
- Docker (선택, 로컬 DB 테스트)
- Postman (API 테스트)

---

## 2. 빠른 시작 (Quick Start)

### ⚡ 5분 안에 로컬 실행하기

```bash
# 1. 레포지토리 클론
git clone https://github.com/your-org/HEPHAITOS.git
cd HEPHAITOS

# 2. 의존성 설치
pnpm install

# 3. 환경 변수 설정
cp .env.example .env.local
# .env.local 파일을 열어 필수 값 입력 (아래 가이드 참조)

# 4. 개발 서버 실행
pnpm dev

# ✅ http://localhost:3000 접속!
```

### 🔑 환경 변수 설정 가이드

**.env.local 파일**:

```bash
# Supabase (필수)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # ⚠️ 서버 전용, 노출 금지!

# Claude API (필수)
ANTHROPIC_API_KEY=sk-ant-api03-...

# Upstash Redis (Loop 11 - 백테스트 큐)
UPSTASH_REDIS_URL=rediss://default:...@...upstash.io:6379

# Toss Payments (환불 자동화)
TOSS_SECRET_KEY=test_sk_...  # 개발: test, 프로덕션: live

# Worker 설정
WORKER_CONCURRENCY=5
WORKER_MAX_RETRIES=3
```

**값 얻는 방법**:
- **Supabase**: [console.supabase.com](https://console.supabase.com) → 프로젝트 → Settings → API
- **Claude**: [console.anthropic.com](https://console.anthropic.com) → API Keys
- **Upstash**: [console.upstash.com](https://console.upstash.com) → Redis → Details
- **Toss**: [developers.tosspayments.com](https://developers.tosspayments.com) → API Keys

### ✅ 설치 확인

```bash
# 타입 체크
pnpm type-check
# ✅ Found 0 errors

# 빌드 테스트
pnpm build
# ✅ Compiled successfully

# 테스트 실행
pnpm test
# ✅ All tests passed
```

---

## 3. 프로젝트 구조

### 📁 디렉토리 구조 (나노팩터 아키텍처)

```
HEPHAITOS/
├── .claude/                    # Claude Code 설정
│   ├── hooks/                  # Pre/Post Tool Hooks
│   └── memory/                 # Core Rules, Architecture
│
├── docs/                       # 문서
│   ├── MASTER_ROADMAP_V2_TO_BETA.md
│   ├── LOOP_11-13_COMPLETE.md
│   ├── DEPLOYMENT_GUIDE.md
│   ├── BETA_LAUNCH_CHECKLIST.md
│   └── CLAUDE_FEATURES_INTEGRATION_ANALYSIS.md
│
├── packages/                   # 모노레포 (나노팩터)
│   ├── types/                  # L0: 기본 타입 정의
│   │   └── src/
│   │       ├── strategy.ts     # StrategyType, Timeframe, Indicator
│   │       ├── backtest.ts     # BacktestConfig, PerformanceMetrics
│   │       ├── order.ts        # ExecutionMode, RiskConfig
│   │       └── exchange.ts     # ExchangeType, EXCHANGE_CONFIGS
│   │
│   ├── utils/                  # L1: 유틸리티 함수
│   │   └── src/
│   │       ├── formatters.ts   # formatCurrency, formatPercentage
│   │       └── validators.ts   # 입력 검증
│   │
│   ├── core/                   # L2: 비즈니스 로직
│   │   └── src/
│   │       ├── services/       # Service Layer
│   │       └── repositories/   # Data Access Layer
│   │
│   └── agents/                 # L3: 자율 에이전트
│       └── src/
│           ├── BacktestAgent.ts      # 645 lines
│           ├── OrderExecutorAgent.ts  # 633 lines
│           └── PortfolioSyncAgent.ts  # 324 lines
│
├── src/
│   ├── app/                    # Next.js 15 App Router
│   │   ├── (auth)/             # 인증 그룹
│   │   │   └── auth/
│   │   │       ├── login/
│   │   │       └── callback/
│   │   │
│   │   ├── (dashboard)/        # 대시보드 그룹
│   │   │   └── dashboard/
│   │   │       ├── page.tsx    # 메인 대시보드
│   │   │       ├── strategies/
│   │   │       ├── backtest/
│   │   │       └── queue/      # Loop 11: Queue Dashboard
│   │   │
│   │   ├── api/                # API Routes
│   │   │   ├── strategies/     # 전략 CRUD
│   │   │   ├── backtest/
│   │   │   │   └── queue/      # Loop 11: Queue API
│   │   │   ├── refunds/        # Loop 13: 환불 자동화
│   │   │   └── ai/
│   │   │       ├── analyze-chart/  # Vision API
│   │   │       └── generate-strategy/
│   │   │
│   │   └── layout.tsx
│   │
│   ├── components/
│   │   ├── ui/                 # 기본 UI (11개)
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Tabs.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/             # 레이아웃 (2개)
│   │   │   ├── Header.tsx
│   │   │   └── Sidebar.tsx
│   │   │
│   │   ├── dashboard/          # 대시보드 (8개)
│   │   │   ├── PortfolioChart.tsx
│   │   │   ├── TradingChart.tsx
│   │   │   └── BacktestProgress.tsx  # Loop 11
│   │   │
│   │   ├── strategy-builder/   # Strategy Builder (8개)
│   │   │   ├── StrategyBuilder.tsx
│   │   │   ├── NodePalette.tsx
│   │   │   └── nodes/
│   │   │       ├── TriggerNode.tsx
│   │   │       ├── ConditionNode.tsx
│   │   │       ├── IndicatorNode.tsx
│   │   │       ├── ActionNode.tsx
│   │   │       └── RiskNode.tsx
│   │   │
│   │   └── settings/           # 설정 (3개)
│   │
│   ├── lib/
│   │   ├── ai/                 # AI 통합
│   │   │   ├── cache-config.ts      # Prompt Caching
│   │   │   ├── strategy-generator.ts
│   │   │   ├── trade-explainer.ts
│   │   │   └── analyze-chart.ts     # Vision API
│   │   │
│   │   ├── queue/              # BullMQ (Loop 11)
│   │   │   ├── index.ts             # Queue 정의
│   │   │   └── backtest-worker.ts   # Worker 프로세스
│   │   │
│   │   ├── exchange/           # 브로커 연동
│   │   │   ├── binance.ts
│   │   │   └── upbit.ts
│   │   │
│   │   └── supabase/           # Supabase 클라이언트
│   │       ├── client.ts
│   │       ├── server.ts
│   │       └── types.ts        # 자동 생성 타입
│   │
│   ├── stores/                 # Zustand 상태 관리
│   │   ├── strategy-store.ts
│   │   ├── exchange-store.ts
│   │   ├── portfolio-store.ts
│   │   └── ui-store.ts
│   │
│   ├── types/                  # TypeScript 타입
│   │   └── index.ts            # 245 lines
│   │
│   └── styles/
│       └── globals.css         # Tailwind + Custom Styles
│
├── supabase/
│   ├── migrations/             # DB 스키마 변경
│   │   ├── 20251216_loop12_strategy_performance.sql
│   │   └── 20251222_loop13_refund_automation.sql
│   │
│   └── functions/              # Edge Functions
│       └── auto-refund/        # Loop 13: 환불 자동화
│           └── index.ts
│
├── scripts/                    # 유틸리티 스크립트
│   ├── load-test-queue.ts      # Loop 11: 부하 테스트
│   └── test-redis-connection.ts
│
├── .env.example                # 환경 변수 템플릿
├── .env.local                  # 로컬 환경 변수 (Git 무시)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── README.md
```

### 🏗️ 나노팩터 아키텍처 (Nano-Factor Hierarchy)

```
L0 (Atoms)     → packages/types/src/     # 기본 타입 정의
L1 (Molecules) → packages/utils/src/     # 유틸리티 함수
L2 (Cells)     → packages/core/src/      # 비즈니스 로직
L3 (Tissues)   → src/agents/             # 자율 에이전트
```

**핵심 원칙**:
- 상위 레벨은 하위 레벨에만 의존
- 하위 레벨은 상위 레벨 몰라야 함
- 순환 의존 절대 금지

---

## 4. 핵심 개념

### 🎯 Copy-Learn-Build 모델

**HEPHAITOS의 핵심 가치 제안**:

```typescript
// Stage 1: COPY (따라하기)
interface CopyMode {
  celebrity: 'Nancy Pelosi' | 'Warren Buffett' | 'Michael Burry'
  portfolioMirroring: '1-click'
  realTimeAlerts: 'push notifications'
  targetUser: '완전 초보'
}

// Stage 2: LEARN (배우기)
interface LearnMode {
  aiMentor: 'Claude 4'
  whyAnalysis: '거래 이유 분석'
  liveCoaching: '1:1 멘토 세션'
  targetUser: '중급자'
}

// Stage 3: BUILD (만들기)
interface BuildMode {
  naturalLanguage: 'RSI 30 이하에서 매수'
  strategyGenerator: 'AI → Python 코드'
  backtesting: '10년 데이터'
  liveTrading: '1클릭 배포'
  targetUser: '고급자'
}
```

### 🤖 Claude AI 통합 (5대 기능)

**1. Prompt Caching** (비용 -90%):
```typescript
// src/lib/ai/cache-config.ts
const SYSTEM_PROMPT_CACHED = {
  type: "text",
  text: "당신은 HEPHAITOS의 AI 멘토입니다...",
  cache_control: { type: "ephemeral" } // 5분 캐시
}

// 2번째 요청부터 90% 할인!
```

**2. Vision API** (차트 분석):
```typescript
// src/lib/ai/analyze-chart.ts
const response = await anthropic.messages.create({
  model: "claude-sonnet-4-5",
  messages: [{
    role: "user",
    content: [
      { type: "image", source: { type: "base64", data: chartImage } },
      { type: "text", text: "이 차트의 패턴을 분석해주세요" }
    ]
  }]
})
// → "헤드앤숄더 패턴이 형성되고 있습니다..."
```

**3. Claude Opus** (Pro 전용):
```typescript
const model = user.tier === 'pro'
  ? 'claude-opus-4-5'      // Pro: 최고 품질
  : 'claude-sonnet-4-5'    // Free: 기본 품질
```

**4. Extended Context** (200K 토큰):
```typescript
// 10년 백테스트 데이터 (50,000 토큰) 한 번에 분석!
const fullData = JSON.stringify(backtestResults) // 50K tokens
// 청킹 불필요!
```

**5. Batch API** (비용 -50%):
```typescript
// 야간 배치 처리
const batch = await anthropic.batches.create({
  requests: strategies.map(s => ({
    custom_id: s.id,
    params: { messages: [{ role: "user", content: `전략 설명: ${s.code}` }] }
  }))
})
// → 다음날 아침 결과 확인
```

### 🔐 법률 준수 (CRITICAL!)

**절대 규칙**: 투자 조언 표현 금지

```typescript
// ❌ 금지된 표현 (투자 조언)
const forbiddenPhrases = [
  '사세요', '팔세요', '~하세요',
  '수익 보장', '확실한 수익', '무조건 수익'
]

// ✅ 허용된 표현 (교육 목적)
const allowedPhrases = [
  '~할 수 있습니다', '참고용입니다', '교육 목적입니다',
  '과거 성과는 미래를 보장하지 않습니다'
]

// 모든 AI 응답 필터링
function checkLegalCompliance(text: string): boolean {
  return !forbiddenPhrases.some(phrase => text.includes(phrase))
}
```

**면책조항 필수**:
```tsx
import { DisclaimerInline } from '@/components/ui/Disclaimer'

<DisclaimerInline />
// → "본 서비스는 투자 조언이 아닌 교육 목적입니다..."
```

### 📊 백테스트 큐 시스템 (Loop 11)

**아키텍처**:
```
Frontend → API Route (Job 생성)
  ↓
BullMQ Queue (Upstash Redis)
  ↓
Worker 프로세스 (별도 Node.js)
  ↓
Supabase Realtime (WebSocket)
  ↓
Frontend (진행률 실시간 표시)
```

**사용 예**:
```typescript
// 1. 백테스트 요청
const response = await fetch('/api/backtest/queue', {
  method: 'POST',
  body: JSON.stringify({ strategyId: 'xxx', params: {...} })
})
const { jobId } = await response.json()

// 2. 진행률 구독 (Realtime)
const channel = supabase.channel(`backtest:${jobId}`)
channel.on('broadcast', { event: 'progress' }, (payload) => {
  console.log(`진행률: ${payload.progress}%`)
})
```

---

## 5. 개발 워크플로우

### 🌿 Git 브랜치 전략

**브랜치 명명 규칙**:
```
main                    # 프로덕션
├─ develop              # 개발 통합
│  ├─ feature/loop-14-live-trading
│  ├─ feature/vision-api-chart-analysis
│  ├─ fix/backtest-timeout-issue
│  └─ chore/update-dependencies
```

**작업 프로세스**:
```bash
# 1. develop 브랜치에서 시작
git checkout develop
git pull origin develop

# 2. 새 브랜치 생성
git checkout -b feature/your-feature-name

# 3. 작업 + 커밋
git add .
git commit -m "feat(module): description"

# 4. Push
git push origin feature/your-feature-name

# 5. PR 생성 (GitHub)
# - develop 브랜치로 PR
# - 리뷰어 지정
# - CI/CD 통과 확인
```

### 📝 커밋 메시지 규칙

**Conventional Commits**:
```
feat(copy): add Pelosi portfolio mirroring
fix(trading): resolve order execution bug
docs: update API documentation
chore(deps): upgrade Next.js to 15.1
refactor(queue): simplify worker logic
test: add backtest unit tests
```

**스코프** (scope):
- `copy`: Copy 모드 기능
- `learn`: Learn 모드 기능
- `build`: Build 모드 기능
- `ai`: AI/Claude 통합
- `queue`: 백테스트 큐 시스템
- `ui`: UI 컴포넌트
- `api`: API 라우트

### 🔍 코드 리뷰 체크리스트

**리뷰어가 확인할 사항**:
- [ ] **법률 준수**: 투자 조언 표현 없음
- [ ] **타입 안전**: `any` 타입 사용 금지
- [ ] **디자인 시스템**: 하드코딩 색상 금지 (`bg-primary` 사용)
- [ ] **에러 핸들링**: try-catch 구현
- [ ] **면책조항**: 트레이딩 관련 UI에 표시
- [ ] **테스트**: 유닛 테스트 추가
- [ ] **문서화**: JSDoc 주석 (복잡한 로직)

---

## 6. 코드 스타일

### 🎨 TypeScript 스타일 가이드

**타입 정의**:
```typescript
// ✅ Good: 구체적 타입
interface Strategy {
  id: string
  name: string
  type: StrategyType
  parameters: StrategyParameters
}

// ❌ Bad: any 사용
interface Strategy {
  id: string
  name: string
  parameters: any  // 절대 금지!
}
```

**함수 정의**:
```typescript
// ✅ Good: 명확한 타입 시그니처
export async function generateStrategy(
  prompt: string,
  tier: 'free' | 'pro'
): Promise<{ code: string; explanation: string }> {
  // ...
}

// ❌ Bad: 암묵적 any 반환
export async function generateStrategy(prompt, tier) {
  // ...
}
```

**에러 핸들링**:
```typescript
// ✅ Good
try {
  const result = await riskyOperation()
  return { success: true, data: result }
} catch (err) {
  const message = err instanceof Error ? err.message : 'Unknown error'
  safeLogger.error('[generateStrategy] Error:', { message })
  return { success: false, error: message }
}

// ❌ Bad: 에러 무시
const result = await riskyOperation() // try-catch 없음!
```

### 🎨 React 컴포넌트 패턴

**함수형 컴포넌트 + Hooks**:
```tsx
'use client' // Next.js App Router

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'

interface Props {
  strategyId: string
  onComplete: (result: BacktestResult) => void
}

export function BacktestRunner({ strategyId, onComplete }: Props) {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Supabase Realtime 구독
    const channel = supabase.channel(`backtest:${strategyId}`)
    channel.on('broadcast', { event: 'progress' }, ({ progress }) => {
      setProgress(progress)
    })
    return () => { channel.unsubscribe() }
  }, [strategyId])

  return (
    <div className="glass-card p-6">
      {loading && <Spinner />}
      <div className="w-full bg-surface-raised rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
```

### 🎨 Tailwind CSS 사용 규칙

```tsx
// ✅ Good: 디자인 토큰 사용
<div className="bg-primary text-white p-4 rounded-lg">

// ❌ Bad: 하드코딩 색상
<div className="bg-[#5E6AD2] text-white p-4 rounded-lg">

// ✅ Good: Glass Morphism
<div className="glass-card">

// ❌ Bad: 인라인 스타일
<div style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)' }}>
```

---

## 7. 테스팅

### 🧪 테스트 전략

**3-Layer Testing**:
```
Unit Tests (Jest)           ← 유틸리티 함수, 비즈니스 로직
Integration Tests (Jest)    ← API 라우트, DB 연동
E2E Tests (Playwright)      ← 사용자 플로우
```

### 🧪 유닛 테스트 예시

```typescript
// src/lib/utils/__tests__/formatters.test.ts
import { formatCurrency, formatPercentage } from '../formatters'

describe('formatCurrency', () => {
  it('should format KRW correctly', () => {
    expect(formatCurrency(1234567, 'KRW')).toBe('₩1,234,567')
  })

  it('should format USD correctly', () => {
    expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56')
  })
})

describe('formatPercentage', () => {
  it('should show positive sign for gains', () => {
    expect(formatPercentage(12.5)).toBe('+12.5%')
  })

  it('should show negative sign for losses', () => {
    expect(formatPercentage(-8.3)).toBe('-8.3%')
  })
})
```

### 🧪 E2E 테스트 예시

```typescript
// e2e/backtest.spec.ts
import { test, expect } from '@playwright/test'

test('백테스트 실행 플로우', async ({ page }) => {
  // 1. 로그인
  await page.goto('/auth/login')
  await page.click('button:has-text("Google 로그인")')

  // 2. Strategy Builder 접속
  await page.goto('/dashboard/strategies/new')

  // 3. 자연어 전략 입력
  await page.fill('textarea[name="prompt"]', 'RSI 30 이하에서 매수')
  await page.click('button:has-text("전략 생성")')

  // 4. 생성 완료 대기
  await expect(page.locator('.strategy-code')).toBeVisible()

  // 5. 백테스트 실행
  await page.click('button:has-text("백테스트 실행")')

  // 6. 진행률 확인
  await expect(page.locator('.progress-bar')).toBeVisible()

  // 7. 결과 확인
  await expect(page.locator('.backtest-result')).toBeVisible({ timeout: 60000 })
})
```

### 🧪 테스트 실행

```bash
# 유닛 테스트
pnpm test

# 특정 파일만
pnpm test formatters.test.ts

# 커버리지
pnpm test --coverage

# E2E 테스트
pnpm test:e2e

# CI 환경 (headless)
pnpm test:e2e --headed=false
```

---

## 8. 배포

### 🚀 Vercel 배포

**자동 배포** (CI/CD):
```
main 브랜치 Push → Vercel 프로덕션 배포
develop 브랜치 Push → Vercel Preview 배포
```

**수동 배포**:
```bash
# 프로덕션 배포
vercel --prod

# Preview 배포
vercel
```

### 🚀 Supabase Migration

**로컬에서 테스트**:
```bash
# Migration 생성
supabase migration new add_new_table

# 로컬 DB에 적용
supabase db reset

# 프로덕션에 적용
supabase db push
```

### 🚀 Worker 배포

**Option A: Vercel Cron** (권장):
```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/process-queue",
    "schedule": "*/1 * * * *"  // 매 1분
  }]
}
```

**Option B: Railway/Render**:
```bash
# Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN pnpm install
CMD ["pnpm", "tsx", "src/lib/queue/backtest-worker.ts"]
```

---

## 9. FAQ

### ❓ 자주 묻는 질문

**Q1. "any 타입을 절대 쓰면 안 되나요?"**
- A: 네, 절대 금지입니다. `unknown`을 사용하고 타입 가드로 좁히세요.

**Q2. "법률 체크는 어떻게 하나요?"**
- A: Pre-commit Hook이 자동으로 체크합니다. "사세요", "수익 보장" 같은 표현 감지 시 커밋 차단.

**Q3. "디자인 시스템 어디서 보나요?"**
- A: `DESIGN_SYSTEM.md` + Storybook (`pnpm storybook`)

**Q4. "로컬에서 Upstash Redis 없이 테스트하려면?"**
- A: In-memory fallback을 사용하세요 (`USE_INMEMORY_QUEUE=true`)

**Q5. "PR이 언제 머지되나요?"**
- A: 2명 이상 승인 + CI 통과 후 자동 머지

### 🐛 트러블슈팅

**문제 1: "pnpm install 실패"**
```bash
# 해결: Node.js 버전 확인
node -v  # 18+ 필요

# pnpm 재설치
npm install -g pnpm@latest
```

**문제 2: "Supabase 연결 실패"**
```bash
# 해결: 환경 변수 확인
echo $NEXT_PUBLIC_SUPABASE_URL
# 비어있으면 .env.local 파일 확인
```

**문제 3: "타입 에러"**
```bash
# 해결: Supabase 타입 재생성
supabase gen types typescript --local > src/lib/supabase/types.ts
```

---

## 10. 도움 받기

### 💬 커뮤니케이션 채널

**Slack Channels**:
- `#general` - 일반 대화
- `#engineering` - 기술 논의
- `#frontend` - 프론트엔드
- `#backend` - 백엔드
- `#help` - 질문/도움

**코드 리뷰**:
- GitHub PR에 코멘트
- Slack `#engineering`에서 논의

**1:1 멘토링**:
- 팀장과 주 1회 1:1 미팅
- Calendly 링크로 예약

### 📚 학습 자료

**필수 읽기**:
- Next.js 15 Docs: https://nextjs.org/docs
- Claude API Docs: https://docs.anthropic.com
- Supabase Docs: https://supabase.com/docs
- Tailwind CSS: https://tailwindcss.com/docs

**추천 강의**:
- "Next.js 15 완벽 가이드" (Udemy)
- "Claude Prompt Engineering" (Anthropic)

### 🎯 첫 주 목표

**Day 1**:
- [ ] 환경 설정 완료
- [ ] 로컬에서 앱 실행 성공
- [ ] 필수 문서 읽기 (BUSINESS_CONSTITUTION, DESIGN_SYSTEM)

**Day 2-3**:
- [ ] 코드베이스 탐색
- [ ] 간단한 버그 수정 PR
- [ ] 팀원들과 1:1 소개

**Day 4-5**:
- [ ] 첫 기능 개발 시작
- [ ] 코드 리뷰 참여
- [ ] 테스트 작성

---

## 🎉 환영합니다!

**준비 완료!** 이제 HEPHAITOS 팀의 일원입니다.

함께 **"Replit for Trading"**을 만들어갑시다! 🚀

질문이 있으면 언제든지 Slack `#help` 채널에 물어보세요!

---

**작성일**: 2025-12-22
**담당자**: Engineering Team
**문의**: dev@hephaitos.io
