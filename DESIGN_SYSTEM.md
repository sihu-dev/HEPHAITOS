# HEPHAITOS Design System v2.0

> **CATALYST AI + Linear Design Language 완전 계승**
> 
> 마지막 업데이트: 2025-12-12
> 버전: 2.0 (Deep Dive 분석 후 개선)

---

## 개요

HEPHAITOS는 CATALYST AI의 Linear-inspired 디자인 시스템을 **완전 계승**하여 
Dark Mode 전용의 고급스러운 Glass Morphism 기반 UI를 제공합니다.

### Design DNA
```
Primary: #5E6AD2 (Linear Purple)
Background: #0D0D0F (Deep Space)
Glass Effect: backdrop-blur-xl
Accent: #7C8AEA
```

---

## Core Design Principles

### 1. Deep Space Dark Theme
- 배경은 항상 #0D0D0F (거의 순수 검정)
- Aurora 그라디언트 효과로 생동감 부여
- 콘텐츠 영역은 subtle한 투명도로 계층 구분

### 2. Glass Morphism First
- 모든 카드/패널에 backdrop-blur 적용
- 반투명 배경으로 깊이감 표현
- 부드러운 테두리로 경계 정의

### 3. Linear Purple Identity
- Primary: #5E6AD2 (Linear 시그니처 퍼플)
- Accent: #7C8AEA (밝은 퍼플)
- 절제된 컬러 사용으로 고급스러움 유지

### 4. Aurora Background Effect
- 다층 radial gradient로 구성
- 은은한 floating 애니메이션
- 노이즈 오버레이로 질감 추가

---

## Color Palette

### Primary Colors (Linear Purple)
| Token | Value | Usage |
|-------|-------|-------|
| primary-DEFAULT | #5E6AD2 | 메인 브랜드 컬러 |
| primary-50 | #F0F1FA | 밝은 배경 |
| primary-500 | #5E6AD2 | 기본값 |
| primary-600 | #4B56C8 | Hover |
| primary-700 | #3A44A8 | Active |
| primary-light | #7C8AEA | 강조 |
| primary-muted | rgba(94,106,210,0.4) | 반투명 |

### Background (Deep Space)
| Token | Value | Usage |
|-------|-------|-------|
| bg-primary | #0D0D0F | 메인 배경 |
| bg-secondary | #111113 | 약간 밝은 배경 |
| bg-tertiary | #151517 | 카드 배경 |
| bg-elevated | #1A1A1D | 모달/팝업 |
| bg-hover | #1E1E21 | 호버 상태 |

### Surface (반투명)
| Token | Value | Usage |
|-------|-------|-------|
| surface-DEFAULT | rgba(255,255,255,0.02) | 기본 |
| surface-raised | rgba(255,255,255,0.04) | 강조 |
| surface-overlay | rgba(255,255,255,0.06) | 오버레이 |
| surface-glass | rgba(255,255,255,0.03) | 글래스 |

### Text
| Token | Value | Usage |
|-------|-------|-------|
| text-primary | #FFFFFF | 메인 텍스트 |
| text-secondary | #A1A1AA | 보조 텍스트 |
| text-tertiary | #71717A | 3차 텍스트 |
| text-muted | #52525B | 비활성 텍스트 |
| text-disabled | #3F3F46 | 비활성화 |

### Status Colors
| Token | Value | Background |
|-------|-------|------------|
| success | #22C55E | rgba(34,197,94,0.1) |
| warning | #F59E0B | rgba(245,158,11,0.1) |
| error | #EF4444 | rgba(239,68,68,0.1) |
| info | #3B82F6 | rgba(59,130,246,0.1) |

### Trading Colors
| Token | Value | Usage |
|-------|-------|-------|
| profit | #22C55E | 수익/상승 |
| loss | #EF4444 | 손실/하락 |

---

## Typography

### Font Family
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
```

### Font Sizes
| Token | Size | Line Height | Usage |
|-------|------|-------------|-------|
| xs | 12px | 16px | 캡션, 라벨 |
| sm | 14px | 20px | 보조 텍스트, 버튼 |
| base | 16px | 24px | 본문 |
| lg | 18px | 28px | 서브헤딩 |
| xl | 20px | 28px | 헤딩 |
| 2xl | 24px | 32px | 섹션 헤딩 |
| 3xl | 30px | 36px | 페이지 타이틀 |
| 4xl | 36px | 40px | 히어로 |
| 5xl | 48px | 1.2 | 대형 헤딩 |

---

## Components (v2.0)

### 기본 UI 컴포넌트

| Component | Variants | File |
|-----------|----------|------|
| **Button** | primary, secondary, ghost, danger, outline | Button.tsx |
| **Card** | default, elevated, glass, interactive, primary | Card.tsx |
| **Input** | default, glass + error states | Input.tsx |
| **Textarea** | default, glass + resize options | Textarea.tsx |
| **Select** | default, glass | Select.tsx |
| **Checkbox** | with label, description, error | Checkbox.tsx |
| **Badge** | default, primary, success, warning, error, info, profit, loss | Badge.tsx |
| **GlassPanel** | light, medium, strong, ultra | GlassPanel.tsx |
| **Spinner** | xs, sm, md, lg, xl | Spinner.tsx |
| **Tabs** | default, pills, underline | Tabs.tsx |
| **Modal** | sm, md, lg, xl, full | Modal.tsx |
| **Tooltip** | top, bottom, left, right | Tooltip.tsx |

### 사용 예시

```tsx
import { 
  Button, 
  Card, 
  Input, 
  Badge, 
  Modal, 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent 
} from '@/components/ui'

// Button
<Button variant="primary" glow>시작하기</Button>
<Button variant="secondary" leftIcon={<Icon />}>취소</Button>

// Card
<Card variant="glass" padding="lg">
  <CardHeader>
    <CardTitle>제목</CardTitle>
    <CardDescription>설명</CardDescription>
  </CardHeader>
  <CardContent>내용</CardContent>
</Card>

// Tabs
<Tabs defaultValue="overview">
  <TabsList variant="default">
    <TabsTrigger value="overview" icon={<LayoutIcon />}>Overview</TabsTrigger>
    <TabsTrigger value="code">Code</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">...</TabsContent>
  <TabsContent value="code">...</TabsContent>
</Tabs>

// Modal
<Modal isOpen={open} onClose={onClose} title="확인">
  <p>모달 내용</p>
  <ModalFooter>
    <Button variant="ghost" onClick={onClose}>취소</Button>
    <Button variant="primary">확인</Button>
  </ModalFooter>
</Modal>
```

---

## Glass Effects

### 강도별 Glass
```css
/* Light */
.glass {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

/* Strong */
.glass-strong {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

/* Ultra (Modals) */
.glass-ultra {
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(40px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Primary Tinted */
.glass-primary {
  background: rgba(94, 106, 210, 0.08);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(94, 106, 210, 0.2);
}
```

---

## CSS Utility Classes

### Card Styles
- `.card` - 기본 카드
- `.card-glass` - 글래스 카드 + 그라디언트 테두리
- `.card-elevated` - 다층 그림자 + 호버 효과
- `.card-interactive` - 클릭 가능한 카드
- `.feature-card` - 마우스 추적 glow 효과
- `.stat-card` - 통계 카드
- `.pricing-card` - 가격 카드
- `.pricing-card-featured` - 강조 가격 카드

### Button Styles
- `.btn-primary` - 그라디언트 + glow
- `.btn-secondary` - 테두리 + 반투명
- `.btn-ghost` - 투명 배경
- `.btn-danger` - 위험 액션

### Text Gradients
- `.text-gradient-hero` - 흰색 → 회색 그라디언트
- `.text-gradient-accent` - 퍼플 그라디언트
- `.text-gradient-subtle` - 은은한 그라디언트

### Glow Effects
- `.glow-primary` - 퍼플 glow
- `.glow-success` - 그린 glow
- `.glow-error` - 레드 glow

### Animations
- `.animate-fade-in` - 페이드 인
- `.animate-scale-in` - 스케일 인
- `.animate-slide-up` - 슬라이드 업
- `.animate-fade-in-up` - 페이드 + 슬라이드 업
- `.animate-pulse-glow` - 펄스 glow
- `.animate-float` - 부유 효과
- `.animate-shimmer` - 쉬머 로딩

---

## Animations & Keyframes

### 주요 애니메이션
```css
/* Fade In Up */
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Aurora Float */
@keyframes aurora-float {
  0%, 100% { transform: translate(0, 0) scale(1); filter: blur(60px); }
  50% { transform: translate(-1%, 1%) scale(0.98); filter: blur(65px); }
}

/* Pulse Glow */
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px -5px var(--color-primary-glow); }
  50% { box-shadow: 0 0 40px -5px var(--color-primary-glow); }
}

/* Status Pulse */
@keyframes status-pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.3; transform: scale(1.2); }
}
```

---

## Utility Functions

### cn() - Class Merger
```tsx
import { cn } from '@/lib/utils'

// clsx + tailwind-merge 조합
<div className={cn(
  'base-class',
  condition && 'conditional-class',
  className
)} />
```

### 기타 유틸리티
- `formatCompactNumber()` - 숫자 축약 (K/M/B)
- `formatCurrency()` - 통화 포맷 (KRW)
- `formatPercentage()` - 퍼센트 포맷 (+/-)
- `debounce()` - 디바운스
- `throttle()` - 스로틀
- `delay()` - 비동기 딜레이
- `generateId()` - 유니크 ID 생성

---

## File Structure

```
HEPHAITOS/
├── src/
│   ├── lib/
│   │   ├── design-tokens.ts     # 디자인 토큰 정의
│   │   └── utils.ts             # 유틸리티 함수 (cn 등)
│   ├── styles/
│   │   └── globals.css          # 글로벌 스타일 (v2.0)
│   └── components/
│       └── ui/
│           ├── index.ts         # 컴포넌트 exports
│           ├── Button.tsx       # 버튼
│           ├── Card.tsx         # 카드
│           ├── Input.tsx        # 입력
│           ├── Textarea.tsx     # 텍스트에어리어
│           ├── Select.tsx       # 셀렉트
│           ├── Checkbox.tsx     # 체크박스
│           ├── Badge.tsx        # 뱃지
│           ├── GlassPanel.tsx   # 글래스 패널
│           ├── Spinner.tsx      # 스피너
│           ├── Tabs.tsx         # 탭
│           ├── Modal.tsx        # 모달
│           └── Tooltip.tsx      # 툴팁
├── tailwind.config.ts           # Tailwind 설정
├── tsconfig.json                # TypeScript 설정
├── postcss.config.js            # PostCSS 설정
└── package.json                 # 의존성
```

---

## v2.0 개선 사항 (Deep Dive 분석 결과)

### 추가된 항목

| 카테고리 | 항목 |
|---------|------|
| **CSS** | Aurora 배경 효과 |
| **CSS** | Noise Overlay |
| **CSS** | feature-card, stat-card, pricing-card |
| **CSS** | text-gradient-hero, text-gradient-accent |
| **CSS** | nav-link, section-label |
| **CSS** | status-dot with glow animation |
| **CSS** | badge-shimmer animation |
| **컴포넌트** | Textarea |
| **컴포넌트** | Select |
| **컴포넌트** | Checkbox |
| **컴포넌트** | Spinner |
| **컴포넌트** | Tabs |
| **컴포넌트** | Modal |
| **컴포넌트** | Tooltip |
| **유틸리티** | cn() 함수 (clsx + tailwind-merge) |
| **유틸리티** | formatCompactNumber, formatCurrency 등 |
| **설정** | PostCSS 설정 |
| **설정** | tsconfig paths (@/*) |

---

## Usage Guidelines

### DO
- Glass 효과는 중요한 콘텐츠 영역에만 사용
- Primary 컬러는 CTA와 중요 액션에만 사용
- 충분한 컨트라스트 유지 (WCAG AA 기준)
- 애니메이션은 절제하여 사용
- cn() 함수로 조건부 클래스 관리

### DON'T
- 밝은 배경색 사용 금지 (Dark Mode Only)
- 과도한 Glow 효과 사용 금지
- 3개 이상의 컬러 동시 사용 금지
- 불필요한 테두리 추가 금지

---

## Credits

- **Design Inspiration**: Linear App
- **Base System**: CATALYST AI
- **Color System**: Linear Purple (#5E6AD2)
- **Glass Effects**: Apple Design Guidelines

---

*© 2025 HEPHAITOS. All rights reserved.*
