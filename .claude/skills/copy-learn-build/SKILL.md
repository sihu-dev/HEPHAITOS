---
name: copy-learn-build
description: HEPHAITOS의 핵심 Copy-Learn-Build 3단계 워크플로우 가이드
tags: [workflow, education, trading]
version: 1.0.0
---

# Copy-Learn-Build Skill

HEPHAITOS의 핵심 교육 철학인 Copy-Learn-Build 3단계 모델을 구현하는 워크플로우입니다.

## 개요

```
[완전 초보] → COPY(따라하기) → LEARN(배우기) → BUILD(만들기) → [전문가]
```

이 Skill은 사용자가 단계별로 트레이딩 시스템을 학습하고 구축할 수 있도록 안내합니다.

---

## 1단계: COPY (셀럽 포트폴리오 미러링)

### 목적
완전 초보도 클릭 한 번으로 성공한 투자자의 포트폴리오를 복사할 수 있습니다.

### 주요 기능

#### 1.1 셀럽 목록 조회
```typescript
// src/lib/mirroring/celebrity-portfolio.ts
export async function getCelebrityPortfolios() {
  return [
    {
      id: 'nancy-pelosi',
      name: 'Nancy Pelosi',
      title: '미국 하원의장',
      ytdReturn: 73.2,
      holdings: [...],
    },
    {
      id: 'warren-buffett',
      name: 'Warren Buffett',
      title: 'Berkshire Hathaway CEO',
      ytdReturn: 22.5,
      holdings: [...],
    },
  ];
}
```

#### 1.2 1클릭 미러링
```typescript
// 포트폴리오 복사
async function mirrorPortfolio(
  celebrityId: string,
  investmentAmount: number
) {
  const portfolio = await getCelebrityPortfolio(celebrityId);

  // 비율에 맞춰 자동 계산
  const orders = portfolio.holdings.map(holding => ({
    symbol: holding.symbol,
    quantity: calculateQuantity(
      investmentAmount,
      holding.weight
    ),
  }));

  return orders;
}
```

#### 1.3 실시간 거래 알림
```typescript
// 셀럽이 매수/매도할 때 알림
await subscribeToTrades(celebrityId, (trade) => {
  notify({
    title: `${celebrity.name}님이 ${trade.symbol} ${trade.action}`,
    message: `${trade.quantity}주, $${trade.price}`,
  });
});
```

### 법률 준수 (필수)
```typescript
<Disclaimer>
  ※ 셀럽 포트폴리오는 교육 참고용이며, 투자 권유가 아닙니다.
  ※ 포트폴리오 복사는 본인 책임 하에 진행됩니다.
  ※ 과거 성과가 미래 수익을 보장하지 않습니다.
</Disclaimer>
```

---

## 2단계: LEARN (AI + 멘토 코칭)

### 목적
"왜 이 종목을 샀을까?" - AI와 인간 멘토가 매매 결정의 이유를 설명합니다.

### 주요 기능

#### 2.1 "왜?" AI 분석
```typescript
// src/lib/ai/trade-explainer.ts
export async function explainTrade(trade: Trade) {
  const analysis = await generateObject({
    model: anthropic('claude-sonnet-4'),
    schema: tradeAnalysisSchema,
    prompt: `
      ${trade.celebrity}님이 ${trade.symbol}을 ${trade.action}한 이유를
      초보자도 이해할 수 있게 설명해주세요.

      거래 정보:
      - 종목: ${trade.symbol}
      - 가격: ${trade.price}
      - 수량: ${trade.quantity}
      - 날짜: ${trade.date}
    `,
  });

  return analysis;
}
```

**AI 설명 예시:**
```
워렌 버핏이 Apple(AAPL)을 매수한 이유:

1. **강력한 브랜드 파워**
   - iPhone 생태계에 충성도 높은 고객
   - 서비스 수익 지속 성장 (App Store, iCloud)

2. **재무 건전성**
   - 현금 보유 $160B+
   - 높은 영업이익률 (25%+)

3. **주주 환원**
   - 연 배당 + 자사주 매입
   - 장기 투자에 적합

※ 본 분석은 교육 목적이며, 투자 권유가 아닙니다.
```

#### 2.2 1:1 멘토 코칭
```typescript
// WebSocket 기반 실시간 화면 공유
async function startMentoringSession(
  studentId: string,
  mentorId: string
) {
  // 화면 동기화
  const session = await createCoachingSession({
    student: studentId,
    mentor: mentorId,
    features: [
      'screen-sync',     // 화면 동기화
      'chart-annotation', // 차트 주석
      'voice-chat',      // 음성 채팅
    ],
  });

  return session;
}
```

#### 2.3 내 스타일 학습 (AI)
```typescript
// 사용자 매매 패턴 분석
async function analyzeTradingStyle(userId: string) {
  const trades = await getUserTrades(userId);

  const style = await generateObject({
    model: anthropic('claude-sonnet-4'),
    schema: tradingStyleSchema,
    prompt: `
      다음 거래 내역을 분석하여 사용자의 투자 스타일을 파악해주세요:
      ${JSON.stringify(trades)}

      분석 항목:
      - 리스크 성향 (공격적/중립/보수적)
      - 선호 종목 (성장주/가치주/배당주)
      - 평균 보유 기간
      - 손절/익절 패턴
    `,
  });

  return style;
}
```

---

## 3단계: BUILD (자연어 전략 빌더)

### 목적
코딩 없이 자연어로 나만의 AI 트레이딩 봇을 만듭니다.

### 주요 기능

#### 3.1 자연어 → 전략 변환
```typescript
// src/lib/agent/strategy-generator.ts
async function generateStrategy(userInput: string) {
  const strategy = await generateObject({
    model: anthropic('claude-sonnet-4.5'),
    schema: strategySchema,
    prompt: `
      사용자 요청을 트레이딩 전략으로 변환해주세요:
      "${userInput}"

      다음 형식으로 출력:
      - 전략 이름
      - 진입 조건
      - 청산 조건
      - 리스크 관리
      - 백테스팅 가능 여부
    `,
  });

  return strategy;
}
```

**입력 예시:**
```
"이동평균선 20일선이 50일선을 상향 돌파하면 매수,
 RSI가 70 이상이면 매도하는 전략을 만들어줘"
```

**출력 예시:**
```typescript
{
  name: "MA Cross + RSI Exit",
  entry: {
    conditions: [
      "MA(20) > MA(50)",
      "MA(20)[-1] <= MA(50)[-1]"
    ],
    logic: "AND"
  },
  exit: {
    conditions: ["RSI(14) >= 70"],
    logic: "OR"
  },
  riskManagement: {
    stopLoss: 0.05,
    positionSize: 0.1
  }
}
```

#### 3.2 Visual Strategy Builder
```typescript
// ReactFlow 기반 드래그앤드롭
const nodes = [
  {
    id: '1',
    type: 'indicator',
    data: { name: 'MA', period: 20 },
  },
  {
    id: '2',
    type: 'indicator',
    data: { name: 'MA', period: 50 },
  },
  {
    id: '3',
    type: 'condition',
    data: { operator: 'crossover' },
  },
  {
    id: '4',
    type: 'action',
    data: { type: 'buy' },
  },
];
```

#### 3.3 백테스팅
```typescript
// 과거 데이터로 전략 검증
const result = await runBacktest({
  strategy,
  symbol: '005930',
  startDate: '2023-01-01',
  endDate: '2024-12-31',
  initialCapital: 10_000_000,
});

console.log({
  totalReturn: result.totalReturn,      // +15.2%
  sharpeRatio: result.sharpeRatio,      // 1.2
  maxDrawdown: result.maxDrawdown,      // -8.5%
  winRate: result.winRate,              // 58.3%
});
```

---

## 워크플로우 전체 흐름

```typescript
async function copyLearnBuildWorkflow(userId: string) {
  // 1단계: COPY
  const mirrored = await mirrorPortfolio('nancy-pelosi', 10_000_000);

  // 2단계: LEARN
  const explanation = await explainTrade(mirrored.trades[0]);
  const style = await analyzeTradingStyle(userId);

  // 3단계: BUILD
  const userStrategy = await generateStrategy(
    "워렌 버핏 스타일 가치투자 전략"
  );
  const backtestResult = await runBacktest(userStrategy);

  return {
    mirrored,
    explanation,
    style,
    strategy: userStrategy,
    backtest: backtestResult,
  };
}
```

---

## 사용자 여정 (User Journey)

### Day 1-7: COPY
- 셀럽 포트폴리오 둘러보기
- Nancy Pelosi 포트폴리오 1클릭 미러링
- 실시간 거래 알림 받기

### Day 8-30: LEARN
- AI가 설명하는 "왜 샀을까?"
- 멘토와 1:1 코칭 (주 1회)
- 내 매매 패턴 분석 받기

### Day 31+: BUILD
- 자연어로 첫 전략 만들기
- Visual Builder로 전략 수정
- 백테스팅 후 실전 투입

---

## 체크리스트

### COPY 구현 시
- [ ] 셀럽 목록 API 완료
- [ ] 1클릭 미러링 기능 완료
- [ ] 실시간 알림 구독 완료
- [ ] 면책조항 표시 완료

### LEARN 구현 시
- [ ] AI 설명 생성 완료
- [ ] 멘토링 세션 기능 완료
- [ ] 스타일 분석 완료
- [ ] 교육 콘텐츠 준비 완료

### BUILD 구현 시
- [ ] 자연어 전략 생성 완료
- [ ] Visual Builder 완료
- [ ] 백테스팅 엔진 완료
- [ ] 전략 마켓플레이스 완료

---

**항상 기억하세요:**
- Copy-Learn-Build는 HEPHAITOS의 정체성
- 각 단계는 독립적으로도 가치 있어야 함
- 법률 준수 (투자 조언 금지) 필수
- 사용자 경험 최우선
