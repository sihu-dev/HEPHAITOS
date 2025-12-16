# HEPHAITOS 모바일 퍼스트 와이어프레임

> **디바이스**: iPhone SE 기준 (375px × 667px)
> **스크롤**: 세로 무한 스크롤
> **디자인**: Linear Purple + Glass Morphism (100% 계승)

---

## 📱 화면 구성 (세로 스크롤)

```
┌───────────────────────────────────┐ 375px
│ 1. Navigation (Fixed Top)         │
├───────────────────────────────────┤
│ 2. Hero Section                   │ ↓ 스크롤
│    (전체 화면 - 667px)             │
├───────────────────────────────────┤
│ 3. Trust Badge                    │
│    (슈카월드 350만 구독자)         │
├───────────────────────────────────┤
│ 4. Pain Point Cards               │
│    (1개씩 세로로)                  │
├───────────────────────────────────┤
│ 5. How It Works                   │
│    (Copy → Learn → Build)          │
├───────────────────────────────────┤
│ 6. Features (4-AI)                │
│    (1개씩 세로로)                  │
├───────────────────────────────────┤
│ 7. Social Proof                   │
│    (추천 3개)                      │
├───────────────────────────────────┤
│ 8. Pricing                        │
│    (크레딧 카드 3개)               │
├───────────────────────────────────┤
│ 9. FAQ (접기/펼치기)              │
├───────────────────────────────────┤
│ 10. Final CTA                     │
├───────────────────────────────────┤
│ 11. Footer                        │
└───────────────────────────────────┘

Sticky CTA (하단 고정):
┌───────────────────────────────────┐
│ [50 크레딧 무료로 시작] 버튼      │ 60px
└───────────────────────────────────┘
```

---

## 1️⃣ Navigation (Fixed Top - 56px)

```
┌───────────────────────────────────┐
│ ☰  HEPHAITOS       [무료 시작] │ 56px
└───────────────────────────────────┘
  16px   로고(140px)        80px

Background: rgba(13,13,15,0.9) + backdrop-blur(24px)
Border-bottom: 1px solid rgba(255,255,255,0.06)
```

**요소**:
- **햄버거 메뉴** (왼쪽 16px)
  - Tap 영역: 44×44px
  - 메뉴 펼치면: How, Pricing, FAQ

- **로고** (중앙)
  - Text: "HEPHAITOS"
  - Font: 18px, Bold
  - Color: #FFFFFF

- **CTA** (오른쪽 16px)
  - Text: "무료 시작"
  - Size: 80×32px
  - Border: 1px solid #5E6AD2
  - Color: #5E6AD2

---

## 2️⃣ Hero Section (전체 화면 - 667px)

```
┌───────────────────────────────────┐
│                                   │ 56px (Nav 높이)
│   ┌─ Aurora Background ─┐       │
│   │                       │       │
│   │   바쁜 직장인도       │       │ 32px (Heading)
│   │   3분이면 충분합니다 │       │
│   │                       │       │
│   │   Nancy Pelosi가     │       │
│   │   산 주식,            │       │
│   │   4명의 AI 전문가가  │       │ 20px (Sub)
│   │   분석해드려요        │       │
│   │                       │       │
│   │   ✅ 과거 10년 검증  │       │
│   │   ✅ 손절/익절 알림  │       │ 16px (체크)
│   │   ✅ 월 5천원~      │       │
│   │                       │       │
│   │ ┌─────────────────┐ │       │
│   │ │ 50 크레딧       │ │       │ 52px
│   │ │ 무료로 시작     │ │       │ (버튼)
│   │ └─────────────────┘ │       │
│   │                       │       │
│   │  신용카드 불필요     │       │ 14px (작은 텍스트)
│   │                       │       │
│   │ [스크린샷 이미지]    │       │ 200px
│   │                       │       │
│   └───────────────────────┘       │
│                                   │
└───────────────────────────────────┘
  좌우 패딩: 24px
```

**디자인 상세**:

### 메인 헤드라인
```css
font-size: 32px;
line-height: 1.2;
font-weight: 700;
text-align: center;
color: #FFFFFF;
background: linear-gradient(180deg, #FFF, #A1A1AA);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
margin-bottom: 20px;
```

### 서브 헤드라인
```css
font-size: 18px;
line-height: 1.4;
color: #A1A1AA;
text-align: center;
margin-bottom: 24px;
```

### 체크리스트
```css
font-size: 16px;
line-height: 1.6;
color: #FFFFFF;
display: flex;
flex-direction: column;
gap: 12px;
margin-bottom: 32px;
```

### 메인 CTA 버튼
```css
width: 100%;
height: 52px;
background: linear-gradient(135deg, #5E6AD2, #7C8AEA);
border-radius: 12px;
font-size: 18px;
font-weight: 600;
color: #FFFFFF;
box-shadow: 0 8px 24px rgba(94, 106, 210, 0.4);
margin-bottom: 12px;

/* Touch State */
&:active {
  transform: scale(0.98);
}
```

### 스크린샷
```css
width: calc(100% - 48px); /* 양쪽 24px 패딩 */
height: 200px;
border-radius: 12px;
overflow: hidden;
background: rgba(255, 255, 255, 0.03);
backdrop-filter: blur(16px);
border: 1px solid rgba(255, 255, 255, 0.06);
```

---

## 3️⃣ Trust Badge (80px)

```
┌───────────────────────────────────┐
│                                   │
│  ⭐ 슈카월드 350만 구독자 스타일  │ 16px
│  "투명한 AI 투자 교육"            │ 14px
│                                   │
└───────────────────────────────────┘
  Background: rgba(94, 106, 210, 0.1)
  좌우 패딩: 24px
```

---

## 4️⃣ Pain Point Cards (각 180px × 5개)

**1개 카드 구조**:
```
┌───────────────────────────────────┐
│                                   │ 24px (상단)
│  ⏰                              │ 40px (아이콘)
│                                   │
│  "퇴근하면 애들 봐야 하는데..."   │ 18px (문제)
│                                   │
│  → 3분이면 끝. 출퇴근 시간에    │ 16px (해결)
│     전략 완성                     │
│                                   │
└───────────────────────────────────┘
  180px 높이
  좌우 패딩: 24px
```

**5개 카드 (세로로 나열)**:

1. ⏰ "퇴근하면 애들 봐야 하는데..."
   → 3분이면 끝. 출퇴근 시간에 전략 완성

2. 🤔 "AI가 주식? 진짜 믿을 수 있나요?"
   → 4명 전문가 의견 모두 공개. 투명성

3. 📉 "손절 타이밍을 자꾸 놓쳐요..."
   → 카톡 알림: "손절 타이밍이에요!"

4. 💸 "투자 자문 월 50만원? 너무 비싸요"
   → 쓴 만큼만 5천원~. 구독 NO

5. 👥 "Nancy Pelosi 따라하고 싶어요"
   → 무료 공개. 클릭 한 번에 미러링

**카드 간 간격**: 16px

**Card 디자인**:
```css
background: rgba(255, 255, 255, 0.03);
backdrop-filter: blur(16px);
border: 1px solid rgba(255, 255, 255, 0.06);
border-radius: 16px;
padding: 20px;

/* Hover → Touch */
&:active {
  border-color: rgba(94, 106, 210, 0.4);
  background: rgba(255, 255, 255, 0.04);
}
```

---

## 5️⃣ How It Works (500px)

```
┌───────────────────────────────────┐
│                                   │
│  누구나 쉽게, 3단계로 시작하세요  │ 28px (Title)
│  코딩 0%, 시간 3분                │ 16px (Sub)
│                                   │
│  ┌─────────────────────────────┐ │
│  │ 1  COPY                     │ │
│  │    셀럽 따라하기            │ │
│  │                             │ │
│  │    Nancy Pelosi,            │ │
│  │    Warren Buffett           │ │
│  │    포트폴리오 미러링        │ │
│  │                             │ │
│  │    💰 0 크레딧 (무료)      │ │
│  └─────────────────────────────┘ │ 160px
│         ↓                         │
│  ┌─────────────────────────────┐ │
│  │ 2  LEARN                    │ │
│  │    AI에게 배우기            │ │
│  │                             │ │
│  │    "이 주식 왜 샀어요?"     │ │
│  │    "손절은 언제?"           │ │
│  │    AI 선생님 답변           │ │
│  │                             │ │
│  │    💰 1 크레딧/질문        │ │
│  └─────────────────────────────┘ │ 160px
│         ↓                         │
│  ┌─────────────────────────────┐ │
│  │ 3  BUILD                    │ │
│  │    나만의 전략              │ │
│  │                             │ │
│  │    자연어 입력 or           │ │
│  │    드래그앤드롭              │ │
│  │    → AI 4명 분석            │ │
│  │                             │ │
│  │    💰 5 크레딧~            │ │
│  └─────────────────────────────┘ │ 160px
│                                   │
└───────────────────────────────────┘
  좌우 패딩: 24px
  카드 간 간격: 20px
```

**스텝 카드 디자인**:
```css
background: rgba(255, 255, 255, 0.03);
backdrop-filter: blur(16px);
border: 1px solid rgba(255, 255, 255, 0.06);
border-radius: 16px;
padding: 24px;
text-align: center;

/* 번호 */
.step-number {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(94, 106, 210, 0.2);
  color: #5E6AD2;
  font-size: 24px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
}

/* 화살표 */
.arrow {
  font-size: 32px;
  color: #5E6AD2;
  text-align: center;
  margin: 12px 0;
}
```

---

## 6️⃣ Features (4-AI) (각 220px × 4개)

**1개 Feature 카드**:
```
┌───────────────────────────────────┐
│                                   │
│  📈                              │ 48px (아이콘)
│                                   │
│  4명 AI 전문가 협업              │ 20px (Title)
│                                   │
│  기술 분석가: RSI, MACD          │ 14px
│  리스크 관리자: 손절, 포지션      │
│  패턴 전문가: 차트 패턴          │
│  펀더멘털: P/E, ROE              │
│                                   │
│  → 의견 모두 공개 (투명성)       │ 16px (Benefit)
│                                   │
└───────────────────────────────────┘
  220px 높이
  좌우 패딩: 24px
```

**4개 Feature (세로 나열)**:

1. **📈 4명 AI 전문가 협업**
   - 기술 분석가: RSI, MACD
   - 리스크 관리자: 손절, 포지션
   - 패턴 전문가: 차트 패턴
   - 펀더멘털: P/E, ROE
   → 의견 모두 공개 (투명성)

2. **✅ 과거 10년 검증**
   - "이 전략, 2014년부터 하면?"
   - Sharpe Ratio: 1.34
   - 최대 손실: -18%
   → 백테스팅 결과 공개

3. **📱 실시간 알림**
   - 카카오톡: "손절 타이밍!"
   - 이메일: "익절 추천"
   → 감정 개입 0%

4. **💎 쓴 만큼만 지불**
   - 월 구독 NO
   - AI 전략 1회: 5,000원~
   → vs 투자 자문 50만원

**카드 간 간격**: 16px

---

## 7️⃣ Social Proof (각 200px × 3개)

**1개 추천 카드**:
```
┌───────────────────────────────────┐
│                                   │
│  "3분 만에 전략 만들어서         │ 18px (Quote)
│   깜짝 놀랐어요"                  │
│                                   │
│  김** 님 (37세, 마케팅 팀장)    │ 14px (Name)
│  ⭐⭐⭐⭐⭐                      │ 16px (Stars)
│                                   │
│  "퇴근 후 30분도 못 보는 저한테  │ 14px (Detail)
│   딱이에요. Nancy 포트폴리오     │
│   보고 따라했더니 이번 달 +5%!" │
│                                   │
└───────────────────────────────────┘
  200px 높이
  좌우 패딩: 24px
```

**3개 추천 (세로 나열)**:
1. 김** (37세) - "3분 만에..."
2. 박** (42세) - "월 50만원 해지..."
3. 이** (35세) - "손절 타이밍 알림..."

**카드 간 간격**: 16px

---

## 8️⃣ Pricing (각 380px × 3개)

**1개 가격 카드**:
```
┌───────────────────────────────────┐
│                                   │
│  ⭐ 가장 인기                    │ 24px (Badge)
│                                   │
│  베이직                           │ 24px (Title)
│                                   │
│  500                              │ 40px (Credits)
│  크레딧                           │
│                                   │
│  ₩39,000                         │ 36px (Price)
│  (+50 보너스)                     │ 14px
│  (₩71/개)                        │
│                                   │
│  ✓ AI 전략 110회                │ 14px
│  ✓ 백테스팅 183회                │
│                                   │
│  ┌─────────────────────────────┐ │
│  │        선택하기             │ │ 48px (Button)
│  └─────────────────────────────┘ │
│                                   │
└───────────────────────────────────┘
  380px 높이
  좌우 패딩: 24px
```

**3개 가격 (세로 나열)**:

1. **스타터** (100 크레딧 / ₩9,900)
2. **베이직** (500 크레딧 / ₩39,000) ⭐ 인기
3. **프로** (1,000 크레딧 / ₩69,000)

**카드 간 간격**: 16px

**인기 카드 (베이직) 강조**:
```css
border: 2px solid #5E6AD2;
box-shadow: 0 12px 32px rgba(94, 106, 210, 0.3);
```

---

## 9️⃣ FAQ (접기/펼치기)

**접혀 있을 때 (각 60px)**:
```
┌───────────────────────────────────┐
│ Q1 "투자 조언인가요?"        ▼  │ 60px
└───────────────────────────────────┘

┌───────────────────────────────────┐
│ Q2 "AI 전략, 진짜 먹혀요?"   ▼  │ 60px
└───────────────────────────────────┘
```

**펼쳤을 때 (높이 가변)**:
```
┌───────────────────────────────────┐
│ Q1 "투자 조언인가요?"        ▲  │
│                                   │
│ 아닙니다. HEPHAITOS는 교육 및   │
│ 분석 도구입니다.                  │
│ 투자 결정은 본인의 판단과 책임... │
│                                   │
└───────────────────────────────────┘
  좌우 패딩: 20px
  상하 패딩: 16px
```

**6개 FAQ (세로 나열)**

**Accordion 인터랙션**:
```typescript
const [openIndex, setOpenIndex] = useState<number | null>(null);

const toggleFAQ = (index: number) => {
  setOpenIndex(openIndex === index ? null : index);
};
```

---

## 🔟 Final CTA (280px)

```
┌───────────────────────────────────┐
│                                   │
│  [Aurora Background]              │
│                                   │
│  지금 바로 시작하세요             │ 32px (Title)
│  50 크레딧 무료                   │ 20px (Sub)
│                                   │
│  ┌─────────────────────────────┐ │
│  │ 이메일 주소                 │ │ 52px (Input)
│  └─────────────────────────────┘ │
│                                   │
│  ┌─────────────────────────────┐ │
│  │ 50 크레딧 무료로 시작       │ │ 52px (Button)
│  └─────────────────────────────┘ │
│                                   │
│  신용카드 등록 불필요             │ 14px
│  3분이면 첫 전략 완성             │
│                                   │
└───────────────────────────────────┘
  280px 높이
  좌우 패딩: 24px
```

---

## 1️⃣1️⃣ Footer (240px)

```
┌───────────────────────────────────┐
│                                   │
│  HEPHAITOS                        │ 20px (로고)
│  바쁜 직장인의 AI 투자 코치       │ 14px
│                                   │
│  제품                             │ 16px (Section)
│  - How It Works                   │ 14px
│  - Pricing                        │
│  - FAQ                            │
│                                   │
│  회사                             │
│  - About Us                       │
│  - Blog                           │
│  - Contact                        │
│                                   │
│  법률                             │
│  - 개인정보처리방침               │
│  - 이용약관                       │
│  - 면책조항                       │
│                                   │
│  © 2025 HEPHAITOS.                │ 12px
│  All rights reserved.             │
│                                   │
└───────────────────────────────────┘
  240px 높이
  좌우 패딩: 24px
```

---

## 🔵 Sticky CTA (하단 고정 - 60px)

```
┌───────────────────────────────────┐
│ [50 크레딧 무료로 시작] 버튼      │ 60px
└───────────────────────────────────┘
  Background: rgba(94, 106, 210, 1)
  Box-shadow: 0 -4px 16px rgba(0,0,0,0.2)
  좌우 패딩: 16px
```

**CSS**:
```css
.sticky-cta {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: #5E6AD2;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  z-index: 999;

  /* 스크롤 시 나타남/사라짐 */
  transition: transform 0.3s ease;
}

.sticky-cta.hidden {
  transform: translateY(100%);
}

.sticky-cta button {
  width: 100%;
  height: 48px;
  background: #FFFFFF;
  color: #5E6AD2;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  border: none;
}
```

**JavaScript 로직**:
```typescript
const [showStickyCTA, setShowStickyCTA] = useState(false);

useEffect(() => {
  const handleScroll = () => {
    // Hero 지나면 Sticky CTA 표시
    const heroHeight = window.innerHeight;
    setShowStickyCTA(window.scrollY > heroHeight);
  };

  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

---

## 📐 전체 높이 계산

```
1. Navigation:        56px (fixed)
2. Hero:             667px
3. Trust Badge:       80px
4. Pain Points:      900px (180px × 5개)
5. How It Works:     500px
6. Features:         880px (220px × 4개)
7. Social Proof:     600px (200px × 3개)
8. Pricing:        1,140px (380px × 3개)
9. FAQ:             600px (접혔을 때)
10. Final CTA:       280px
11. Footer:          240px

총 높이: 약 5,943px (스크롤 길이)
```

---

## 🎨 모바일 전용 디자인 토큰

```css
/* Mobile Typography */
--text-hero-mobile: 32px / 1.2;
--text-h1-mobile: 28px / 1.3;
--text-h2-mobile: 24px / 1.4;
--text-h3-mobile: 20px / 1.4;
--text-body-mobile: 16px / 1.6;
--text-small-mobile: 14px / 1.6;
--text-tiny-mobile: 12px / 1.5;

/* Mobile Spacing */
--padding-page-mobile: 24px; /* 좌우 패딩 */
--padding-section-mobile: 40px 0; /* 섹션 상하 패딩 */
--gap-card-mobile: 16px; /* 카드 간 간격 */

/* Mobile Touch Targets */
--touch-min-height: 44px; /* Apple 권장 최소 터치 영역 */
--button-height-mobile: 52px;
--input-height-mobile: 52px;

/* Mobile Border Radius */
--radius-card-mobile: 16px;
--radius-button-mobile: 12px;
--radius-input-mobile: 12px;
```

---

## 🔧 모바일 최적화 체크리스트

### 성능
- [ ] 이미지 WebP 포맷 (+ PNG fallback)
- [ ] Lazy Loading (Intersection Observer)
- [ ] 초기 로딩 크기 < 500KB
- [ ] Lighthouse Mobile 점수 90+

### UX
- [ ] 터치 영역 최소 44×44px
- [ ] 스크롤 부드럽게 (smooth scroll)
- [ ] Sticky CTA 스크롤 70% 지점에 표시
- [ ] 입력창 포커스 시 화면 확대 방지

### 접근성
- [ ] 대비율 WCAG AA 기준 (4.5:1)
- [ ] 폰트 크기 최소 14px
- [ ] 터치 타겟 간 간격 8px+
- [ ] VoiceOver / TalkBack 지원

---

## 📱 다음 단계

1. ✅ 모바일 와이어프레임 완성
2. ⏭️ React 컴포넌트 구현
   - `app/page.tsx` (Mobile First)
   - `components/landing/` (모바일 전용 컴포넌트)
3. ⏭️ 반응형 확장 (Tablet, Desktop)

---

**작성일**: 2025-12-16
**화면 기준**: iPhone SE (375×667px)
**디자인 시스템**: DESIGN_SYSTEM.md v2.0 (100% 계승)
