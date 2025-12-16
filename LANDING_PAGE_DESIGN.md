# HEPHAITOS 랜딩페이지 설계 (30-40대 재테크족 최적화)

> **타겟**: 30-40대 직장인 재테크족 ("재테크 지영" 페르소나)
> **디자인**: Linear Purple + Glass Morphism (DESIGN_SYSTEM.md 100% 계승)
> **목표**: 첫 방문 → 50 크레딧 무료 가입 전환율 **30%+**

---

## 🎯 핵심 전략

### Pain Point 중심 설계

| Pain Point | 해결 메시지 | 섹션 |
|-----------|-----------|------|
| "시간 없어요" | **3분이면 충분** | Hero |
| "믿을 수 있나요?" | **4명 전문가 공개** | How It Works |
| "손절 타이밍 모름" | **알림 받기** | Features |
| "비싸요" | **월 5천원 ~** (vs 50만원) | Pricing |
| "고수 따라하고 싶어요" | **Nancy 따라하기** | Social Proof |

---

## 📄 섹션 구조 (9개)

```
1. Navigation (Fixed)
2. Hero Section
3. Pain Points Section
4. How It Works (Copy → Learn → Build)
5. Features Grid
6. Social Proof (유튜버 스타일)
7. Pricing Comparison
8. FAQ
9. CTA + Footer
```

---

## 🎨 디자인 시스템 적용

### Color Palette (DESIGN_SYSTEM.md)

```css
/* Primary */
--primary: #5E6AD2; /* Linear Purple */
--primary-light: #7C8AEA;
--primary-glow: rgba(94, 106, 210, 0.4);

/* Background */
--bg-primary: #0D0D0F; /* Deep Space */
--bg-secondary: #111113;
--bg-tertiary: #151517;

/* Surface (Glass) */
--surface-glass: rgba(255, 255, 255, 0.03);
--surface-raised: rgba(255, 255, 255, 0.04);

/* Text */
--text-primary: #FFFFFF;
--text-secondary: #A1A1AA;
--text-tertiary: #71717A;

/* Status */
--profit: #22C55E; /* 수익 */
--loss: #EF4444; /* 손실 */
```

### Typography

```css
--font-sans: 'Inter', sans-serif;
--font-mono: 'JetBrains Mono', monospace;

/* Sizes */
--text-hero: 48px / 1.2;
--text-h1: 36px / 1.2;
--text-h2: 30px / 1.3;
--text-h3: 24px / 1.4;
--text-body: 16px / 1.6;
```

### Components

- **Button**: `.btn-primary` (glow effect)
- **Card**: `.card-glass` (backdrop-blur-xl)
- **Badge**: `.badge-success` (profit), `.badge-error` (loss)
- **Animation**: `.animate-fade-in-up`, `.animate-pulse-glow`

---

## 📐 섹션별 상세 설계

### 1. Navigation (Fixed)

```
┌────────────────────────────────────────────────────────┐
│ [로고] HEPHAITOS    Home  How  Pricing  [50크레딧 시작] │
└────────────────────────────────────────────────────────┘
```

**디자인**:
- Background: `rgba(13, 13, 15, 0.8)` + `backdrop-blur(24px)`
- Border: `1px solid rgba(255,255,255,0.06)` (하단만)
- Fixed top, 스크롤 시 배경 진해짐

**요소**:
- 로고: 텍스트 + 아이콘
- 메뉴: Home, How It Works, Pricing
- CTA: "50 크레딧 무료로 시작" (primary button + glow)

---

### 2. Hero Section (전체 화면)

#### 카피 (실제 pain point 반영)

```
메인 헤드라인 (text-5xl, gradient):
바쁜 직장인도 3분이면 충분합니다.

서브 헤드라인 (text-xl, text-secondary):
Nancy Pelosi가 산 주식,
4명의 AI 전문가가 분석해드려요.

3가지 체크마크 (✅):
✅ 과거 10년 먹혔는지 검증
✅ 손절/익절 타이밍 알림
✅ 쓴 만큼만 지불 (월 5천원~)

CTA 버튼:
[50 크레딧 무료로 시작] (primary, glow)
[2분 영상 보기 ▶] (secondary, ghost)

작은 텍스트:
신용카드 등록 불필요 · 50 크레딧 = 10회 AI 전략 생성
```

**디자인**:
```
┌─────────────────────────────────────────────────┐
│                                                 │
│   [Aurora Background - Purple Gradient]        │
│                                                 │
│       바쁜 직장인도 3분이면 충분합니다.          │
│                                                 │
│       Nancy Pelosi가 산 주식,                   │
│       4명의 AI 전문가가 분석해드려요.            │
│                                                 │
│       ✅ 과거 10년 먹혔는지 검증                 │
│       ✅ 손절/익절 타이밍 알림                   │
│       ✅ 쓴 만큼만 지불 (월 5천원~)              │
│                                                 │
│   [50 크레딧 무료로 시작]  [2분 영상 보기 ▶]   │
│                                                 │
│   신용카드 등록 불필요 · 50 크레딧 = 10회      │
│                                                 │
│   [스크린샷: 4-AI 분석 화면]                    │
│                                                 │
└─────────────────────────────────────────────────┘
```

**기술 구현**:
```tsx
<section className="relative h-screen flex items-center">
  {/* Aurora Background */}
  <div className="absolute inset-0 overflow-hidden">
    <div className="aurora-blob aurora-blob-1" />
    <div className="aurora-blob aurora-blob-2" />
    <div className="noise-overlay" />
  </div>

  <div className="container mx-auto px-4 relative z-10">
    <div className="max-w-4xl mx-auto text-center">
      {/* 헤드라인 */}
      <h1 className="text-gradient-hero text-5xl font-bold mb-6 animate-fade-in-up">
        바쁜 직장인도 3분이면 충분합니다.
      </h1>

      {/* 서브 헤드라인 */}
      <p className="text-xl text-secondary mb-8 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
        Nancy Pelosi가 산 주식,<br />
        4명의 AI 전문가가 분석해드려요.
      </p>

      {/* 체크리스트 */}
      <div className="flex flex-col items-center gap-3 mb-12">
        <div className="flex items-center gap-3 text-lg">
          <Badge variant="success">✅</Badge>
          과거 10년 먹혔는지 검증
        </div>
        {/* ... */}
      </div>

      {/* CTA */}
      <div className="flex gap-4 justify-center mb-4">
        <Button variant="primary" size="lg" glow>
          50 크레딧 무료로 시작
        </Button>
        <Button variant="ghost" size="lg">
          2분 영상 보기 ▶
        </Button>
      </div>

      <p className="text-sm text-tertiary">
        신용카드 등록 불필요 · 50 크레딧 = 10회 AI 전략 생성
      </p>
    </div>

    {/* 스크린샷 */}
    <div className="mt-16 animate-fade-in-up" style={{animationDelay: '0.3s'}}>
      <Card variant="glass" className="overflow-hidden">
        <img src="/screenshots/4-ai-analysis.png" alt="4-AI 분석" />
      </Card>
    </div>
  </div>
</section>
```

---

### 3. Pain Points Section

#### 카피

```
섹션 제목 (text-3xl):
30-40대 직장인, 이런 고민 하시죠?

5개 카드 (2열):
┌─────────────────────────────────────────┐
│ ⏰ "퇴근하면 애들 봐야 하는데..."        │
│ → 3분이면 끝. 출퇴근 시간에 전략 완성   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 🤔 "AI가 주식? 진짜 믿을 수 있나요?"    │
│ → 4명 전문가 의견 모두 공개. 투명성    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 📉 "손절 타이밍을 자꾸 놓쳐요..."       │
│ → 카톡 알림: "손절 타이밍이에요!"       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 💸 "투자 자문 월 50만원? 너무 비싸요"   │
│ → 쓴 만큼만 5천원~. 구독 NO            │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 👥 "Nancy Pelosi 따라하고 싶어요"       │
│ → 무료 공개. 클릭 한 번에 미러링       │
└─────────────────────────────────────────┘
```

**디자인**:
```tsx
<section className="py-24 relative">
  <div className="container mx-auto px-4">
    <h2 className="text-3xl font-bold text-center mb-16">
      30-40대 직장인, <span className="text-gradient-accent">이런 고민</span> 하시죠?
    </h2>

    <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
      {painPoints.map((point, i) => (
        <Card
          key={i}
          variant="glass"
          className="p-6 hover:border-primary transition-all animate-fade-in-up"
          style={{animationDelay: `${i * 0.1}s`}}
        >
          <div className="text-4xl mb-4">{point.icon}</div>
          <p className="text-lg text-secondary mb-3">"{point.problem}"</p>
          <p className="text-primary font-medium">→ {point.solution}</p>
        </Card>
      ))}
    </div>
  </div>
</section>
```

---

### 4. How It Works (Copy → Learn → Build)

#### 카피

```
섹션 제목:
누구나 쉽게, 3단계로 시작하세요

3개 스텝 (가로 정렬):

┌────────────────────┐
│ 1. COPY            │
│ 셀럽 따라하기       │
│                    │
│ Nancy Pelosi,      │
│ Warren Buffett     │
│ 포트폴리오 미러링   │
│                    │
│ 💰 0 크레딧 (무료) │
└────────────────────┘

┌────────────────────┐
│ 2. LEARN           │
│ AI에게 배우기       │
│                    │
│ "이 주식 왜 샀어요?"│
│ "손절은 언제?"      │
│ AI 선생님 답변      │
│                    │
│ 💰 1 크레딧/질문    │
└────────────────────┘

┌────────────────────┐
│ 3. BUILD           │
│ 나만의 전략        │
│                    │
│ 자연어 입력 or     │
│ 드래그앤드롭        │
│ → AI 4명 분석      │
│                    │
│ 💰 5 크레딧~       │
└────────────────────┘
```

**디자인**:
```tsx
<section className="py-24 bg-bg-secondary">
  <div className="container mx-auto px-4">
    <h2 className="text-3xl font-bold text-center mb-4">
      누구나 쉽게, <span className="text-gradient-accent">3단계</span>로 시작하세요
    </h2>
    <p className="text-center text-secondary mb-16">
      코딩 0%, 시간 3분
    </p>

    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
      {/* Step 1: COPY */}
      <Card variant="glass" className="p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl font-bold text-primary">1</span>
        </div>
        <h3 className="text-xl font-bold mb-2">COPY</h3>
        <p className="text-sm text-primary mb-4">셀럽 따라하기</p>

        <div className="mb-6">
          <p className="text-secondary mb-2">Nancy Pelosi,</p>
          <p className="text-secondary mb-2">Warren Buffett</p>
          <p className="text-secondary">포트폴리오 미러링</p>
        </div>

        <Badge variant="success">💰 0 크레딧 (무료)</Badge>
      </Card>

      {/* Step 2: LEARN */}
      {/* ... */}

      {/* Step 3: BUILD */}
      {/* ... */}
    </div>

    {/* 화살표 (모바일에서는 숨김) */}
    <div className="hidden md:flex justify-center mt-8 gap-16">
      <span className="text-primary text-4xl">→</span>
      <span className="text-primary text-4xl">→</span>
    </div>
  </div>
</section>
```

---

### 5. Features Grid (4명 전문가 강조)

#### 카피

```
섹션 제목:
왜 HEPHAITOS일까요?

4개 카드 (2×2):

┌──────────────────────────────┐
│ 📈 4명 AI 전문가 협업         │
│                              │
│ 기술 분석가: RSI, MACD       │
│ 리스크 관리자: 손절, 포지션   │
│ 패턴 전문가: 차트 패턴       │
│ 펀더멘털: P/E, ROE           │
│                              │
│ → 의견 모두 공개 (투명성)    │
└──────────────────────────────┘

┌──────────────────────────────┐
│ ✅ 과거 10년 검증            │
│                              │
│ "이 전략, 2014년부터 하면?"  │
│ Sharpe Ratio: 1.34           │
│ 최대 손실: -18%              │
│                              │
│ → 백테스팅 결과 공개         │
└──────────────────────────────┘

┌──────────────────────────────┐
│ 📱 실시간 알림              │
│                              │
│ 카카오톡: "손절 타이밍!"     │
│ 이메일: "익절 추천"          │
│                              │
│ → 감정 개입 0%               │
└──────────────────────────────┘

┌──────────────────────────────┐
│ 💎 쓴 만큼만 지불            │
│                              │
│ 월 구독 NO                   │
│ AI 전략 1회: 5,000원~        │
│                              │
│ → vs 투자 자문 50만원        │
└──────────────────────────────┘
```

**디자인**:
```tsx
<section className="py-24">
  <div className="container mx-auto px-4">
    <h2 className="text-3xl font-bold text-center mb-16">
      왜 <span className="text-gradient-accent">HEPHAITOS</span>일까요?
    </h2>

    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
      {features.map((feature, i) => (
        <Card
          key={i}
          variant="glass"
          className="p-8 feature-card"
        >
          <div className="text-5xl mb-4">{feature.icon}</div>
          <h3 className="text-xl font-bold mb-3">{feature.title}</h3>

          <div className="text-secondary mb-4 space-y-1">
            {feature.details.map((detail, j) => (
              <p key={j}>{detail}</p>
            ))}
          </div>

          <p className="text-primary font-medium">→ {feature.benefit}</p>
        </Card>
      ))}
    </div>
  </div>
</section>
```

---

### 6. Social Proof (유튜버 스타일)

#### 카피

```
섹션 제목:
이미 1,000명이 사용 중입니다

3개 추천 카드:

┌────────────────────────────────────────┐
│ "3분 만에 전략 만들어서 깜짝 놀랐어요" │
│                                        │
│ 김** 님 (37세, 마케팅 팀장)           │
│ ⭐⭐⭐⭐⭐                              │
│                                        │
│ "퇴근 후 30분도 못 보는 저한테        │
│  딱이에요. Nancy 포트폴리오 보고      │
│  따라했더니 이번 달 +5%!"             │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ "투자 자문 50만원 해지하고 왔어요"     │
│                                        │
│ 박** 님 (42세, 회사원)                │
│ ⭐⭐⭐⭐⭐                              │
│                                        │
│ "월 50만원 내던 투자 자문 해지했어요. │
│  HEPHAITOS는 월 1만원인데 더 투명해요.│
│  4명 전문가 의견 다 보니까 신뢰가요!" │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ "손절 타이밍 알림 받고 -30% 방어"     │
│                                        │
│ 이** 님 (35세, 개발자)                │
│ ⭐⭐⭐⭐⭐                              │
│                                        │
│ "카톡으로 '손절 타이밍!' 알림 받고    │
│  바로 매도했어요. -30% 손실 방어.     │
│  감정 개입 없이 기계적으로 실행!"      │
└────────────────────────────────────────┘

YouTube 영상 임베드:
[슈카월드 스타일 2분 영상]
```

**디자인**:
```tsx
<section className="py-24 bg-bg-secondary">
  <div className="container mx-auto px-4">
    <h2 className="text-3xl font-bold text-center mb-4">
      이미 <span className="text-gradient-accent">1,000명</span>이 사용 중입니다
    </h2>
    <p className="text-center text-secondary mb-16">
      평균 평점 4.8/5.0 ⭐
    </p>

    <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
      {testimonials.map((t, i) => (
        <Card key={i} variant="glass" className="p-6">
          <p className="text-lg font-bold mb-3">"{t.quote}"</p>

          <div className="mb-3">
            <p className="text-sm text-secondary">{t.name}</p>
            <div className="flex gap-1 mt-1">
              {[...Array(5)].map((_, j) => (
                <span key={j} className="text-yellow-400">⭐</span>
              ))}
            </div>
          </div>

          <p className="text-sm text-tertiary">{t.detail}</p>
        </Card>
      ))}
    </div>

    {/* YouTube 영상 */}
    <div className="max-w-3xl mx-auto">
      <Card variant="glass" className="aspect-video overflow-hidden">
        <iframe
          src="https://www.youtube.com/embed/..."
          title="HEPHAITOS 2분 소개"
          className="w-full h-full"
        />
      </Card>
    </div>
  </div>
</section>
```

---

### 7. Pricing Comparison

#### 카피

```
섹션 제목:
합리적 가격, 투명한 사용료

비교 테이블:

┌─────────────────────────────────────────────────────┐
│          | 투자 자문      | 자동매매 프로그램 | HEPHAITOS │
│──────────────────────────────────────────────────────│
│ 가격     | 월 50만원      | 15만원~          | 5천원~    │
│ 시간     | 상담 1시간     | 개발 1주         | 3분       │
│ 투명성   | 블랙박스       | 코드 공개        | 4-AI 공개 │
│ 검증     | X              | X                | 백테스팅 ✅│
│ 구독     | 월 계약        | 일회성           | 쓴만큼    │
└─────────────────────────────────────────────────────┘

크레딧 가격:

┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ 스타터          │  │ 베이직          │  │ 프로             │
│                  │  │                  │  │                  │
│ 100 크레딧      │  │ 500 크레딧      │  │ 1,000 크레딧    │
│ ₩9,900          │  │ ₩39,000         │  │ ₩69,000         │
│ (₩99/개)        │  │ (+50 보너스)    │  │ (+150 보너스)   │
│                  │  │ (₩71/개)        │  │ (₩60/개)        │
│                  │  │                  │  │                  │
│ AI 전략 20회    │  │ AI 전략 110회   │  │ AI 전략 230회   │
│ 백테스팅 33회   │  │ 백테스팅 183회  │  │ 백테스팅 383회  │
│                  │  │                  │  │                  │
│ [선택]          │  │ [선택] ⭐인기   │  │ [선택]          │
└──────────────────┘  └──────────────────┘  └──────────────────┘

사용 예시:
• AI 전략 생성 (초안): 5 크레딧
• AI 전략 생성 (정제): 10 크레딧
• AI 전략 생성 (종합): 20 크레딧
• 백테스팅 (1년): 3 크레딧
• AI 튜터 질문: 1 크레딧
```

**디자인**:
```tsx
<section className="py-24">
  <div className="container mx-auto px-4">
    <h2 className="text-3xl font-bold text-center mb-4">
      합리적 가격, <span className="text-gradient-accent">투명한</span> 사용료
    </h2>
    <p className="text-center text-secondary mb-16">
      쓴 만큼만 지불. 월 구독 NO.
    </p>

    {/* 비교 테이블 */}
    <div className="max-w-4xl mx-auto mb-16">
      <Card variant="glass" className="overflow-hidden">
        <table className="w-full text-left">
          <thead className="border-b border-white/10">
            <tr>
              <th className="p-4"></th>
              <th className="p-4">투자 자문</th>
              <th className="p-4">자동매매</th>
              <th className="p-4 text-primary">HEPHAITOS</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-white/5">
              <td className="p-4 text-secondary">가격</td>
              <td className="p-4">월 50만원</td>
              <td className="p-4">15만원~</td>
              <td className="p-4 text-primary font-bold">5천원~</td>
            </tr>
            {/* ... */}
          </tbody>
        </table>
      </Card>
    </div>

    {/* 크레딧 카드 */}
    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
      {pricingTiers.map((tier, i) => (
        <Card
          key={i}
          variant={tier.featured ? "primary" : "glass"}
          className="p-8 pricing-card"
        >
          {tier.featured && (
            <Badge variant="success" className="mb-4">⭐ 가장 인기</Badge>
          )}

          <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>

          <div className="mb-6">
            <span className="text-4xl font-bold">{tier.credits}</span>
            <span className="text-secondary ml-2">크레딧</span>
          </div>

          <div className="text-3xl font-bold mb-2">
            {tier.price}
          </div>
          <p className="text-sm text-secondary mb-6">
            {tier.bonus && `+${tier.bonus} 보너스`}
            ({tier.perCredit}/개)
          </p>

          <ul className="space-y-2 mb-8 text-sm text-secondary">
            <li>✓ AI 전략 {tier.aiStrategies}회</li>
            <li>✓ 백테스팅 {tier.backtests}회</li>
          </ul>

          <Button
            variant={tier.featured ? "secondary" : "primary"}
            className="w-full"
          >
            선택
          </Button>
        </Card>
      ))}
    </div>
  </div>
</section>
```

---

### 8. FAQ

#### 카피

```
섹션 제목:
자주 묻는 질문

Q&A (6개):

Q1: "투자 조언인가요? 불법 아닌가요?"
A: 아닙니다. HEPHAITOS는 교육 및 분석 도구입니다.
   투자 결정은 본인의 판단과 책임입니다.
   (금융감독원 확인 완료)

Q2: "AI가 만든 전략, 진짜 먹혀요?"
A: 과거 10년 백테스팅 결과를 공개합니다.
   단, 과거 성과가 미래를 보장하지 않습니다.
   3개월 모의투자 후 실전을 권장합니다.

Q3: "크레딧은 어떻게 쓰나요?"
A: AI 전략 생성 (5~20 크레딧)
   백테스팅 (3 크레딧)
   AI 튜터 질문 (1 크레딧)
   *Nancy 따라하기는 무료 (0 크레딧)

Q4: "환불 가능한가요?"
A: 사용하지 않은 크레딧은 전액 환불 가능합니다.
   (구매일로부터 7일 이내)

Q5: "증권사 연동이 안전한가요?"
A: KIS, 키움 공식 API를 사용합니다.
   비밀번호는 저장하지 않으며,
   모든 거래는 사용자 승인 필요합니다.

Q6: "코딩 몰라도 되나요?"
A: 네! 자연어로 "RSI 30 이하면 매수" 입력하거나
   드래그앤드롭만으로 전략을 만들 수 있습니다.
```

**디자인**:
```tsx
<section className="py-24 bg-bg-secondary">
  <div className="container mx-auto px-4">
    <h2 className="text-3xl font-bold text-center mb-16">
      자주 묻는 질문
    </h2>

    <div className="max-w-3xl mx-auto space-y-4">
      {faqs.map((faq, i) => (
        <Card key={i} variant="glass" className="p-6">
          <h3 className="text-lg font-bold mb-3 flex items-start gap-3">
            <Badge variant="primary">Q{i+1}</Badge>
            {faq.question}
          </h3>
          <p className="text-secondary pl-11">
            {faq.answer}
          </p>
        </Card>
      ))}
    </div>
  </div>
</section>
```

---

### 9. CTA + Footer

#### CTA 카피

```
┌─────────────────────────────────────────────┐
│                                             │
│   지금 바로 시작하세요                      │
│   50 크레딧 무료                            │
│                                             │
│   [이메일 입력창]                           │
│   [50 크레딧 무료로 시작]                   │
│                                             │
│   신용카드 등록 불필요                      │
│   3분이면 첫 전략 완성                      │
│                                             │
└─────────────────────────────────────────────┘
```

#### Footer

```
┌────────────────────────────────────────────────┐
│ HEPHAITOS                                      │
│ 바쁜 직장인의 AI 투자 코치                    │
│                                                │
│ 제품          회사          법률               │
│ - How It Works  - About Us    - 개인정보처리  │
│ - Pricing       - Contact     - 이용약관      │
│ - FAQ           - Blog        - 면책조항      │
│                                                │
│ © 2025 HEPHAITOS. All rights reserved.        │
└────────────────────────────────────────────────┘
```

**디자인**:
```tsx
{/* Final CTA */}
<section className="py-24 relative overflow-hidden">
  <div className="aurora-blob aurora-blob-3" />

  <div className="container mx-auto px-4 relative z-10">
    <div className="max-w-2xl mx-auto text-center">
      <h2 className="text-4xl font-bold mb-4">
        지금 바로 시작하세요
      </h2>
      <p className="text-xl text-primary mb-8">
        50 크레딧 무료
      </p>

      <div className="flex gap-4 max-w-md mx-auto mb-4">
        <Input
          type="email"
          placeholder="이메일 주소"
          variant="glass"
          className="flex-1"
        />
        <Button variant="primary" size="lg" glow>
          시작하기
        </Button>
      </div>

      <p className="text-sm text-tertiary">
        신용카드 등록 불필요 · 3분이면 첫 전략 완성
      </p>
    </div>
  </div>
</section>

{/* Footer */}
<footer className="border-t border-white/10 py-12">
  <div className="container mx-auto px-4">
    <div className="grid md:grid-cols-4 gap-8 mb-8">
      <div>
        <h3 className="font-bold mb-4">HEPHAITOS</h3>
        <p className="text-sm text-secondary">
          바쁜 직장인의 AI 투자 코치
        </p>
      </div>

      <div>
        <h4 className="font-bold mb-4">제품</h4>
        <ul className="space-y-2 text-sm text-secondary">
          <li><a href="#how">How It Works</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="#faq">FAQ</a></li>
        </ul>
      </div>

      {/* ... */}
    </div>

    <div className="border-t border-white/5 pt-8 text-center text-sm text-tertiary">
      © 2025 HEPHAITOS. All rights reserved.
    </div>
  </div>
</footer>
```

---

## 🎨 애니메이션 & 인터랙션

### Scroll 기반 애니메이션

```typescript
// useScrollAnimation.ts
export function useScrollAnimation() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('[data-animate]').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);
}
```

### Feature Card Glow Effect

```css
.feature-card {
  position: relative;
  transition: all 0.3s ease;
}

.feature-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(
    135deg,
    transparent,
    rgba(94, 106, 210, 0.5),
    transparent
  );
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.feature-card:hover::before {
  opacity: 1;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px -10px rgba(94, 106, 210, 0.3);
}
```

---

## 📱 반응형 디자인

### 브레이크포인트

```css
/* Mobile First */
.container {
  max-width: 100%;
  padding: 0 16px;
}

/* Tablet */
@media (min-width: 768px) {
  .container {
    max-width: 768px;
    padding: 0 24px;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    max-width: 1024px;
  }
}

/* Large Desktop */
@media (min-width: 1280px) {
  .container {
    max-width: 1280px;
  }
}
```

### 모바일 최적화

```tsx
// Hero Section - Mobile
<section className="h-screen md:h-auto py-24">
  <h1 className="text-3xl md:text-5xl">
    바쁜 직장인도<br className="md:hidden" />
    3분이면 충분합니다.
  </h1>

  <div className="flex flex-col md:flex-row gap-4">
    <Button size="lg" className="w-full md:w-auto">
      50 크레딧 무료로 시작
    </Button>
    <Button variant="ghost" size="lg" className="w-full md:w-auto">
      2분 영상 보기 ▶
    </Button>
  </div>
</section>
```

---

## 🔍 SEO & Meta Tags

```tsx
// app/page.tsx
export const metadata: Metadata = {
  title: 'HEPHAITOS - 바쁜 직장인의 AI 투자 코치',
  description:
    '3분이면 충분합니다. Nancy Pelosi 포트폴리오 따라하고, ' +
    '4명 AI 전문가가 전략 분석. 과거 10년 백테스팅 검증. ' +
    '쓴 만큼만 지불 (월 5천원~).',
  keywords: [
    '주식 AI',
    '자동매매',
    '백테스팅',
    'Nancy Pelosi',
    '투자 전략',
    '재테크',
    '직장인 투자',
    'AI 투자 코치',
  ],
  openGraph: {
    title: 'HEPHAITOS - 바쁜 직장인의 AI 투자 코치',
    description: '3분이면 충분합니다. 4명 AI 전문가가 전략 분석.',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HEPHAITOS - 바쁜 직장인의 AI 투자 코치',
    description: '3분이면 충분합니다. 4명 AI 전문가가 전략 분석.',
    images: ['/og-image.png'],
  },
};
```

---

## 📊 전환 최적화 (CRO)

### A/B 테스트 항목

1. **Hero CTA**:
   - A: "50 크레딧 무료로 시작"
   - B: "Nancy 따라하기 (무료)"

2. **가격 프레이밍**:
   - A: "₩9,900 (100 크레딧)"
   - B: "₩99/개 (AI 전략 20회)"

3. **Social Proof 위치**:
   - A: Features 후
   - B: Hero 직후

### 트래킹 이벤트

```typescript
// analytics.ts
export const trackEvent = {
  signupClick: () => {
    gtag('event', 'signup_click', {
      location: 'hero_cta',
    });
  },

  videoPlay: () => {
    gtag('event', 'video_play', {
      video_title: '2분 소개 영상',
    });
  },

  pricingView: (tier: string) => {
    gtag('event', 'pricing_view', {
      tier: tier,
    });
  },
};
```

---

## ✅ 체크리스트

### 디자인 시스템 준수

- [ ] Linear Purple (#5E6AD2) 사용
- [ ] Glass Morphism 모든 카드
- [ ] Deep Space 배경 (#0D0D0F)
- [ ] Aurora 효과 Hero + CTA
- [ ] Inter 폰트
- [ ] 애니메이션 (fade-in-up)

### Pain Point 반영

- [ ] "시간 없어요" → "3분"
- [ ] "믿을 수 있나요?" → "4명 전문가 공개"
- [ ] "손절 타이밍" → "알림"
- [ ] "비싸요" → "5천원~ vs 50만원"
- [ ] "고수 따라하기" → "Nancy 무료"

### 실제 용어 사용

- [ ] "백테스팅" → "과거 10년 검증"
- [ ] "MoA" → "4명 전문가"
- [ ] "크레딧" → "쓴 만큼만"
- [ ] 기술 용어 숨김 (VectorBT 등)

### CTA 최적화

- [ ] Hero에 2개 CTA
- [ ] 50 크레딧 무료 강조
- [ ] "신용카드 불필요" 명시
- [ ] 스크롤 70% 지점에 Sticky CTA

---

**다음 단계**:
1. 와이어프레임 ASCII art 작성
2. React 컴포넌트 구현
3. 랜딩페이지 배포

---

**작성일**: 2025-12-16
**버전**: 1.0
**디자인 시스템**: DESIGN_SYSTEM.md v2.0 기반
