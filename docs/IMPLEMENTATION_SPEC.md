# HEPHAITOS 구현 명세서

> 우선순위별 미구현 기능 상세 설계
> 작성일: 2024-12-24

---

## P0: 결제 웹훅 시스템

### 현황
- 위치: `src/app/api/payments/webhook/route.ts`
- TODO 7개: 상태 처리, 구독 관리, 환불 처리 미구현
- DB 스키마: `payment_orders`, `credit_wallets`, `credit_transactions` 존재

### 구현 명세

#### 1. handlePaymentStatusChanged (결제 상태 변경)

```typescript
// src/app/api/payments/webhook/route.ts

async function handlePaymentStatusChanged(data: WebhookPayload['data']) {
  const supabase = createClient()

  // 1. 결제 정보 조회
  const payment = await client.getPayment(data.paymentKey)

  // 2. payment_orders 업데이트
  const { error: orderError } = await supabase
    .from('payment_orders')
    .update({
      status: mapTossStatusToLocal(payment.status),
      payment_key: payment.paymentKey,
      paid_at: payment.approvedAt,
      raw: payment,
      updated_at: new Date().toISOString()
    })
    .eq('order_id', payment.orderId)

  // 3. 상태별 처리
  switch (payment.status) {
    case 'DONE': // 결제 완료
      await handlePaymentCompleted(payment)
      break
    case 'CANCELED':
      await handlePaymentCanceled(payment)
      break
    case 'PARTIAL_CANCELED':
      await handlePartialRefund(payment)
      break
  }
}

async function handlePaymentCompleted(payment: TossPayment) {
  const supabase = createClient()

  // 1. 주문 정보 조회
  const { data: order } = await supabase
    .from('payment_orders')
    .select('user_id, credits, package_id')
    .eq('order_id', payment.orderId)
    .single()

  // 2. 크레딧 충전
  await supabase.rpc('add_credits', {
    p_user_id: order.user_id,
    p_amount: order.credits,
    p_type: 'purchase',
    p_metadata: {
      order_id: payment.orderId,
      payment_key: payment.paymentKey,
      package_id: order.package_id
    }
  })

  // 3. 이메일 발송 (optional)
  await sendPaymentConfirmationEmail(order.user_id, order.credits)
}
```

#### 2. handleBillingKeyChanged (정기결제 키 변경)

```typescript
async function handleBillingKeyChanged(data: WebhookPayload['data']) {
  const supabase = createClient()

  // billing_keys 테이블 필요 (신규 생성)
  await supabase
    .from('billing_keys')
    .upsert({
      user_id: data.customerId,
      billing_key: data.billingKey,
      status: data.status, // 'READY' | 'STOPPED' | 'EXPIRED'
      card_info: data.card,
      updated_at: new Date().toISOString()
    })
}
```

#### 3. handleDepositCallback (가상계좌 입금)

```typescript
async function handleDepositCallback(data: WebhookPayload['data']) {
  const supabase = createClient()

  // 1. 입금 확인
  if (data.status !== 'DONE') return

  // 2. 주문 완료 처리
  await supabase
    .from('payment_orders')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('order_id', data.orderId)

  // 3. 크레딧 충전 (handlePaymentCompleted와 동일)
  await handlePaymentCompleted(data)
}
```

#### 신규 DB 마이그레이션 필요

```sql
-- billing_keys 테이블
CREATE TABLE billing_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  billing_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'READY',
  card_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## P0: AI 전략/튜터 시스템

### 현황
- 위치: `src/app/api/ai/generate-strategy/route.ts`, `tutor/route.ts`
- TODO 6개: 실제 AI 호출, 크레딧 연동 미구현
- MoA 엔진 존재: `src/lib/moa/engine.ts`

### 구현 명세

#### 1. generate-strategy API

```typescript
// src/app/api/ai/generate-strategy/route.ts

import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { STRATEGY_SYSTEM_PROMPT } from '@/lib/agent/prompts'
import { spendCredits } from '@/lib/credits/spend-helper'
import { validateStrategyOutput } from '@/lib/agent/legal-compliance'

export const POST = withApiMiddleware(async (request: NextRequest) => {
  // 1. 인증 (기존 튜터 로직 참조)
  const { user } = await getAuthUser(request)
  if (!user) return unauthorized()

  // 2. 입력 검증
  const { prompt, type } = await validateRequestBody(request, schema)

  // 3. 크레딧 소비 (10 크레딧)
  await spendCredits({
    userId: user.id,
    feature: 'ai_strategy',
    amount: 10,
    metadata: { prompt, type }
  })

  // 4. AI 전략 생성
  const { text } = await generateText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: STRATEGY_SYSTEM_PROMPT,
    prompt: buildStrategyPrompt(prompt, type),
    maxTokens: 2000,
  })

  // 5. 법률 검증
  const validated = await validateStrategyOutput(text)
  if (!validated.isValid) {
    return createApiResponse({
      error: 'COMPLIANCE_VIOLATION',
      issues: validated.issues
    }, { status: 422 })
  }

  // 6. 전략 파싱 및 저장
  const strategy = parseStrategyFromAI(text)
  const saved = await saveStrategy(user.id, strategy)

  return createApiResponse({ strategy: saved })
})
```

#### 2. tutor API (기존 TODO 해결)

```typescript
// src/app/api/ai/tutor/route.ts - TODO 부분 교체

// 기존 TODO 위치 (line 94)
const { text } = await generateText({
  model: anthropic('claude-haiku-4-20250321'), // 저비용 모델
  system: TUTOR_SYSTEM_PROMPT,
  messages: [
    ...(context ? [{ role: 'user', content: `맥락: ${context}` }] : []),
    { role: 'user', content: question }
  ],
  maxTokens: 1000,
})

// 법률 검증
const sanitized = LegalCompliance.sanitizeAIResponse(text)

const answer = {
  question,
  response: sanitized,
  sources: extractSources(text),
  disclaimer: LEGAL_DISCLAIMER,
}
```

#### 3. 프롬프트 시스템

```typescript
// src/lib/agent/prompts.ts 확장

export const STRATEGY_SYSTEM_PROMPT = `
당신은 HEPHAITOS 트레이딩 전략 생성 AI입니다.

## 역할
- 사용자의 자연어 입력을 구조화된 트레이딩 전략으로 변환
- 진입/청산 조건, 리스크 관리 규칙 생성

## 규칙
1. 투자 조언 금지 - "~하세요" 표현 사용 금지
2. 교육 목적 명시 - 모든 응답에 면책조항 포함
3. 구체적 종목 추천 금지

## 출력 형식
{
  "name": "전략명",
  "description": "설명",
  "entryConditions": [...],
  "exitConditions": [...],
  "riskManagement": {...}
}
`

export const TUTOR_SYSTEM_PROMPT = `
당신은 HEPHAITOS 투자 교육 AI 튜터입니다.

## 역할
- 투자 개념, 기술적 분석, 리스크 관리 교육
- 과거 데이터 기반 설명

## 금지 사항
- 특정 종목 추천
- 매매 타이밍 조언
- 수익 보장 표현

## 필수 포함
- 면책조항: "본 답변은 교육 목적이며 투자 조언이 아닙니다."
`
```

---

## P1: 테스트 수정

### 현황
- 스킵된 테스트: 10개
- 주요 이슈: API 불일치, 구현 미완료

### 수정 명세

#### 1. trade-executor.e2e.test.ts

```typescript
// 문제: TradeExecutor 구현이 테스트 기대와 불일치
// 해결: TradeExecutor 인터페이스 정렬

// 필요 변경사항:
// 1. TradeExecutor.execute() 메서드 시그니처 수정
// 2. 리스크 관리 통합
// 3. 포지션 관리 로직 추가

// src/lib/trading/executor.ts 수정 필요
interface ExecuteOptions {
  strategy: IStrategy
  signal: TradeSignal
  portfolio: Portfolio
  riskConfig: IRiskConfig
}
```

#### 2. legal-compliance.test.ts

```typescript
// 문제: 테스트가 구 API 사용
// 해결: 현재 LegalCompliance 클래스 API에 맞게 수정

// 변경 전
import { checkCompliance } from '@/lib/agent/legal-compliance'

// 변경 후
import { LegalCompliance } from '@/lib/agent/legal-compliance'

describe('LegalCompliance', () => {
  it('should detect forbidden patterns', () => {
    const result = LegalCompliance.isForbiddenPattern('이 종목을 사세요')
    expect(result).toBe(true)
  })

  it('should sanitize AI response', () => {
    const input = '이 종목은 반드시 오릅니다'
    const sanitized = LegalCompliance.sanitizeAIResponse(input)
    expect(sanitized).not.toContain('반드시')
  })
})
```

#### 3. backtest-engine.e2e.test.ts

```typescript
// 스킵된 테스트 4개:
// 1. legal compliance checking - BacktestAgent에 통합 필요
// 2. progress callback 100% - 진행률 계산 수정
// 3. RSI conditions - 테스트 데이터 생성 수정
// 4. strategy comparison - 구현 완료 필요

// 수정 방향
it('should emit progress events', async () => {
  const progressEvents: number[] = []
  const agent = new BacktestAgent(/* ... */, {
    onProgress: (progress) => progressEvents.push(progress)
  })

  await agent.runBacktest(config)

  expect(progressEvents).toContain(100) // 마지막에 100% 도달
  expect(progressEvents[progressEvents.length - 1]).toBe(100)
})
```

---

## P2: 실시간 데이터 연동

### 현황
- 위치: `src/lib/ai/report-generator.ts`, `lib/agent/risk-profiler.ts`
- TODO 3개: 시장 데이터, 뉴스, 주식 데이터 페칭

### 구현 명세

#### 1. 시장 데이터 서비스

```typescript
// src/lib/data/market-data.ts (신규)

import { createClient } from '@/lib/supabase/server'

interface MarketData {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
  timestamp: string
}

export class MarketDataService {
  private polygon: PolygonClient
  private kis: KISClient

  constructor() {
    this.polygon = new PolygonClient(process.env.POLYGON_API_KEY!)
    this.kis = new KISClient(/* ... */)
  }

  // 미국 주식
  async getUSStockPrice(symbol: string): Promise<MarketData> {
    const data = await this.polygon.getLastTrade(symbol)
    return {
      symbol,
      price: data.p,
      change: data.c,
      changePercent: data.cp,
      volume: data.v,
      timestamp: new Date(data.t).toISOString()
    }
  }

  // 한국 주식
  async getKRStockPrice(symbol: string): Promise<MarketData> {
    const data = await this.kis.getStockPrice(symbol)
    return {
      symbol,
      price: data.stck_prpr,
      change: data.prdy_vrss,
      changePercent: data.prdy_ctrt,
      volume: data.acml_vol,
      timestamp: new Date().toISOString()
    }
  }

  // 섹터 데이터
  async getSectorPerformance(): Promise<SectorData[]> {
    // Polygon Sector API 또는 자체 집계
    return this.polygon.getSectors()
  }
}
```

#### 2. 뉴스 크롤링 서비스

```typescript
// src/lib/data/news-service.ts (신규)

interface NewsItem {
  title: string
  summary: string
  source: string
  url: string
  publishedAt: string
  sentiment?: 'positive' | 'negative' | 'neutral'
  symbols?: string[]
}

export class NewsService {
  // Polygon News API
  async getMarketNews(limit = 10): Promise<NewsItem[]> {
    const response = await fetch(
      `https://api.polygon.io/v2/reference/news?limit=${limit}&apiKey=${process.env.POLYGON_API_KEY}`
    )
    const data = await response.json()
    return data.results.map(this.mapToNewsItem)
  }

  // 종목별 뉴스
  async getStockNews(symbol: string): Promise<NewsItem[]> {
    const response = await fetch(
      `https://api.polygon.io/v2/reference/news?ticker=${symbol}&apiKey=${process.env.POLYGON_API_KEY}`
    )
    const data = await response.json()
    return data.results.map(this.mapToNewsItem)
  }
}
```

#### 3. report-generator.ts 수정

```typescript
// src/lib/ai/report-generator.ts

import { MarketDataService } from '@/lib/data/market-data'
import { NewsService } from '@/lib/data/news-service'

class AIReportGenerator {
  private marketData = new MarketDataService()
  private newsService = new NewsService()

  // 기존 TODO 대체 (line 179)
  private async getMarketOverview() {
    const [indices, sectors] = await Promise.all([
      this.marketData.getIndices(['SPY', 'QQQ', 'KOSPI']),
      this.marketData.getSectorPerformance()
    ])
    return { indices, sectors }
  }

  // 기존 TODO 대체 (line 199)
  private async getRecentNews() {
    const news = await this.newsService.getMarketNews(10)
    return news.map(n => ({
      title: n.title,
      summary: n.summary,
      sentiment: n.sentiment,
      symbols: n.symbols
    }))
  }

  // 기존 TODO 대체 (line 222)
  private async getStockData(symbol: string) {
    const isKR = symbol.match(/^\d{6}$/)
    return isKR
      ? this.marketData.getKRStockPrice(symbol)
      : this.marketData.getUSStockPrice(symbol)
  }
}
```

---

## 구현 우선순위 및 예상 작업량

| 우선순위 | 항목 | 예상 파일 수 | 복잡도 |
|---------|------|------------|--------|
| P0-1 | 결제 웹훅 | 3개 | 중 |
| P0-2 | AI 전략/튜터 | 4개 | 상 |
| P1 | 테스트 수정 | 5개 | 중 |
| P2 | 실시간 데이터 | 3개 | 상 |

---

## 의존성 관계

```
P0 결제 웹훅
  └── DB 마이그레이션 (billing_keys)

P0 AI 전략/튜터
  ├── 프롬프트 시스템
  └── 법률 검증 (기존 LegalCompliance)

P1 테스트
  └── P0 구현 완료 후 진행

P2 실시간 데이터
  ├── Polygon API 키 필요
  └── KIS API 연동 (기존 broker 활용)
```

---

*이 명세서는 구현 진행 시 참조용으로 사용됩니다.*
