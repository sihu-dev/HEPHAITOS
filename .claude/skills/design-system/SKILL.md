---
name: design-system
description: HEPHAITOS 디자인 시스템 - Linear-inspired Dark Theme with Glass Morphism
tags: [design, ui, tailwind]
version: 1.0.0
---

# Design System Skill

HEPHAITOS의 통일된 디자인 언어를 구현하는 방법입니다.

## 디자인 철학

```
"불꽃이 철을 단련하듯, 데이터가 전략을 단련한다"
```

- **Dark Only**: 트레이딩에 집중할 수 있는 어두운 배경
- **Glass Morphism**: 투명도와 블러로 깊이감 표현
- **Minimal Accent**: Primary 컬러는 중요한 액션에만 사용

---

## 컬러 시스템

### 1. 기본 컬러

```css
/* tailwind.config.ts */
colors: {
  // Primary - Linear Purple
  primary: {
    DEFAULT: '#5E6AD2',
    light: '#7B85DD',
    dark: '#4A56C7',
  },

  // Background - Deep Space
  background: {
    DEFAULT: '#0D0D0F',
    secondary: '#121316',
    tertiary: '#1A1C1F',
  },

  // Glass - Translucent
  glass: {
    light: 'rgba(255, 255, 255, 0.03)',
    medium: 'rgba(255, 255, 255, 0.06)',
    heavy: 'rgba(255, 255, 255, 0.1)',
  },

  // Profit & Loss
  profit: '#22C55E',
  loss: '#EF4444',

  // Text
  text: {
    primary: '#FFFFFF',
    secondary: '#A1A1AA',
    tertiary: '#52525B',
  },
}
```

### 2. 사용 규칙

```tsx
// ✅ Good
<Button className="bg-primary">매수</Button>  // 중요한 액션
<Card className="bg-background-secondary">  // 카드 배경

// ❌ Bad
<div className="bg-primary">일반 텍스트</div>  // Primary는 액션용만
<Card className="bg-white">  // Dark 모드 전용
```

---

## Glass Morphism

### 1. 기본 Glass Card

```tsx
// components/ui/GlassCard.tsx
export function GlassCard({ children, className }: GlassCardProps) {
  return (
    <div
      className={cn(
        // Glass Effect
        "bg-glass-light backdrop-blur-xl",
        // Border
        "border border-glass-medium",
        // Rounded
        "rounded-xl",
        // Padding
        "p-6",
        className
      )}
    >
      {children}
    </div>
  );
}
```

### 2. 사용 예시

```tsx
<GlassCard>
  <h2 className="text-xl font-semibold text-text-primary">
    포트폴리오
  </h2>
  <p className="text-sm text-text-secondary mt-2">
    총 자산: ₩10,000,000
  </p>
</GlassCard>
```

---

## 타이포그래피

### 1. Font Family

```css
/* globals.css */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

body {
  font-family: 'Inter', system-ui, sans-serif;
}
```

### 2. Font Scale

```tsx
// Headings
<h1 className="text-4xl font-bold">  // 36px
<h2 className="text-3xl font-semibold">  // 30px
<h3 className="text-2xl font-semibold">  // 24px

// Body
<p className="text-base">  // 16px
<p className="text-sm">   // 14px
<p className="text-xs">   // 12px

// Numbers (금융 데이터)
<span className="font-mono text-xl tabular-nums">
  +15.2%
</span>
```

---

## 컴포넌트 패턴

### 1. Button

```tsx
// components/ui/Button.tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg font-medium transition-colors",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white hover:bg-primary-dark",
        secondary: "bg-background-tertiary text-text-primary hover:bg-background-secondary",
        ghost: "hover:bg-glass-light text-text-secondary",
        profit: "bg-profit text-white hover:bg-profit/90",
        loss: "bg-loss text-white hover:bg-loss/90",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-base",
        lg: "h-12 px-6 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);
```

**사용 예시:**
```tsx
<Button variant="primary" size="lg">
  매수
</Button>

<Button variant="ghost">
  취소
</Button>
```

### 2. Input

```tsx
<Input
  className={cn(
    "bg-background-tertiary",
    "border border-glass-medium",
    "text-text-primary placeholder:text-text-tertiary",
    "focus:ring-2 focus:ring-primary focus:border-transparent"
  )}
  placeholder="종목명 검색"
/>
```

### 3. Card

```tsx
// 기본 Card
<Card className="bg-background-secondary border-glass-medium">
  <CardHeader>
    <CardTitle>제목</CardTitle>
  </CardHeader>
  <CardContent>내용</CardContent>
</Card>

// Glass Card
<GlassCard>
  <h3>Glass Card</h3>
  <p>투명하고 블러 처리된 카드</p>
</GlassCard>
```

---

## 금융 데이터 표시

### 1. 수익률 색상

```tsx
// components/ui/ProfitLoss.tsx
export function ProfitLoss({ value }: { value: number }) {
  const isProfit = value >= 0;

  return (
    <span
      className={cn(
        "font-mono tabular-nums font-semibold",
        isProfit ? "text-profit" : "text-loss"
      )}
    >
      {isProfit ? "+" : ""}
      {value.toFixed(2)}%
    </span>
  );
}
```

### 2. 금액 포맷

```tsx
// lib/utils/format.ts
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    minimumFractionDigits: 0,
  }).format(amount);
}

// 사용 예시
<span className="text-2xl font-bold font-mono">
  {formatCurrency(10_000_000)}
</span>
// 출력: ₩10,000,000
```

### 3. 숫자 포맷

```tsx
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ko-KR').format(num);
}

// 사용 예시
<span>{formatNumber(1234567)}</span>
// 출력: 1,234,567
```

---

## 차트 스타일

### 1. TradingView Lightweight Charts

```typescript
// components/charts/PriceChart.tsx
const chartOptions = {
  layout: {
    background: {
      color: '#0D0D0F',  // background.DEFAULT
    },
    textColor: '#A1A1AA',  // text.secondary
  },
  grid: {
    vertLines: {
      color: 'rgba(255, 255, 255, 0.06)',  // glass.medium
    },
    horzLines: {
      color: 'rgba(255, 255, 255, 0.06)',
    },
  },
  crosshair: {
    mode: CrosshairMode.Normal,
  },
};

const series = chart.addCandlestickSeries({
  upColor: '#22C55E',      // profit
  downColor: '#EF4444',    // loss
  borderVisible: false,
  wickUpColor: '#22C55E',
  wickDownColor: '#EF4444',
});
```

### 2. Recharts

```tsx
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    <CartesianGrid
      strokeDasharray="3 3"
      stroke="rgba(255, 255, 255, 0.06)"
    />
    <XAxis
      dataKey="date"
      stroke="#A1A1AA"
      style={{ fontSize: 12 }}
    />
    <YAxis
      stroke="#A1A1AA"
      style={{ fontSize: 12 }}
    />
    <Tooltip
      contentStyle={{
        backgroundColor: '#121316',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '8px',
      }}
    />
    <Line
      type="monotone"
      dataKey="value"
      stroke="#5E6AD2"  // primary
      strokeWidth={2}
    />
  </LineChart>
</ResponsiveContainer>
```

---

## 레이아웃 패턴

### 1. Dashboard Grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <GlassCard>위젯 1</GlassCard>
  <GlassCard>위젯 2</GlassCard>
  <GlassCard>위젯 3</GlassCard>
</div>
```

### 2. Sidebar Layout

```tsx
<div className="flex h-screen">
  {/* Sidebar */}
  <aside className="w-64 bg-background-secondary border-r border-glass-medium">
    <nav>{/* 메뉴 */}</nav>
  </aside>

  {/* Main */}
  <main className="flex-1 bg-background overflow-auto">
    {/* 콘텐츠 */}
  </main>
</div>
```

---

## 애니메이션

### 1. Framer Motion

```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  <GlassCard>내용</GlassCard>
</motion.div>
```

### 2. Hover Effects

```tsx
<motion.button
  className="glass-card"
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
>
  매수
</motion.button>
```

---

## 면책조항 스타일

```tsx
// components/ui/Disclaimer.tsx
export function Disclaimer({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 p-3 bg-background-tertiary border-l-2 border-loss rounded">
      <p className="text-xs text-text-tertiary leading-relaxed">
        {children}
      </p>
    </div>
  );
}

// 사용 예시
<Disclaimer>
  본 플랫폼은 투자 교육 및 도구를 제공하며, 투자 자문을 제공하지 않습니다.
  투자 결정은 본인 책임입니다.
</Disclaimer>
```

---

## 반응형 디자인

```tsx
// 모바일 우선 (Mobile First)
<div className={cn(
  "p-4",           // 모바일: 16px padding
  "md:p-6",        // 태블릿: 24px
  "lg:p-8",        // 데스크톱: 32px
)}>
  {/* 콘텐츠 */}
</div>

// Breakpoints
// sm: 640px
// md: 768px
// lg: 1024px
// xl: 1280px
// 2xl: 1536px
```

---

## 체크리스트

### UI 컴포넌트 개발 시
- [ ] Dark 테마 준수
- [ ] Glass Morphism 적용
- [ ] Primary 컬러 최소 사용
- [ ] 반응형 지원
- [ ] 수익/손실 색상 구분
- [ ] 금액 포맷팅 적용
- [ ] 애니메이션 자연스러움

### 접근성
- [ ] 색상 대비 충분 (WCAG AA)
- [ ] 키보드 네비게이션 지원
- [ ] 스크린 리더 대응

---

**디자인 원칙:**
- Less is More - 최소한의 요소로 최대 효과
- Data First - 데이터가 주인공, UI는 보조
- Consistency - 일관된 경험 제공
- Performance - 빠른 렌더링
