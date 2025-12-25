# HEPHAITOS 접근성 가이드 (WCAG 2.1 AA)

> **작성일**: 2025-12-21
> **목적**: 웹 접근성 준수 및 사용자 경험 향상
> **Phase**: 5 P2
> **기준**: WCAG 2.1 Level AA

---

## 📊 현재 접근성 상태

### ✅ 이미 구현된 기능

1. **Skip to Main Content** (layout.tsx:83-88)
   ```tsx
   <a href="#main-content" className="sr-only focus:not-sr-only ...">
     메인 콘텐츠로 건너뛰기
   </a>
   ```
   - 키보드 사용자를 위한 스킵 링크
   - 포커스 시에만 표시

2. **ARIA 속성** (30개 파일)
   - `aria-label`, `aria-labelledby`, `role`, `alt` 사용
   - 주요 컴포넌트에 적용됨

3. **시맨틱 HTML**
   - `<button>`, `<input>`, `<label>` 등 적절한 태그 사용

---

## 🎯 WCAG 2.1 AA 준수 체크리스트

### 1. 인식 가능성 (Perceivable)

#### 1.1 텍스트 대안
- [x] 이미지에 alt 속성
- [x] 아이콘 버튼에 aria-label
- [ ] **개선 필요**: 차트/그래프 설명 추가
- [ ] **개선 필요**: SVG 아이콘 title 추가

**예시**:
```tsx
// ❌ 나쁜 예
<button><ChartIcon /></button>

// ✅ 좋은 예
<button aria-label="View chart">
  <ChartIcon aria-hidden="true" />
</button>
```

#### 1.2 시간 기반 미디어
- [x] 비디오 없음 (해당 없음)
- [ ] **향후**: 데모 비디오 추가 시 자막 필요

#### 1.3 적응 가능성
- [x] 반응형 레이아웃 (Tailwind)
- [x] 논리적 콘텐츠 순서
- [ ] **개선 필요**: ARIA landmarks 추가

**권장 랜드마크**:
```tsx
<header role="banner">...</header>
<nav role="navigation" aria-label="Main navigation">...</nav>
<main role="main" id="main-content">...</main>
<aside role="complementary">...</aside>
<footer role="contentinfo">...</footer>
```

#### 1.4 구별 가능성

**색상 대비** (WCAG AA 기준):
| 텍스트 크기 | 배경 대비 | 현재 상태 |
|------------|----------|----------|
| 일반 텍스트 (16px+) | 4.5:1 | ⚠️ 일부 zinc-500 미달 |
| 큰 텍스트 (18px+) | 3:1 | ✅ 대부분 통과 |
| UI 컴포넌트 | 3:1 | ✅ 통과 |

**문제 영역**:
```tsx
// ❌ 대비 불충분 (zinc-500 on bg-primary)
<p className="text-zinc-500">보조 텍스트</p>

// ✅ 개선 (zinc-400 사용)
<p className="text-zinc-400">보조 텍스트</p>
```

---

### 2. 운용 가능성 (Operable)

#### 2.1 키보드 접근성
- [x] 모든 인터랙티브 요소 키보드 접근 가능
- [x] Tab 순서 논리적
- [ ] **개선 필요**: 모달 포커스 트랩
- [ ] **개선 필요**: 드롭다운 키보드 네비게이션

**모달 포커스 트랩 구현**:
```tsx
import { useEffect, useRef } from 'react'

function Modal({ isOpen, onClose, children }) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    const firstElement = focusableElements?.[0] as HTMLElement
    const lastElement = focusableElements?.[focusableElements.length - 1] as HTMLElement

    firstElement?.focus()

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault()
        lastElement?.focus()
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault()
        firstElement?.focus()
      }
    }

    document.addEventListener('keydown', handleTab)
    return () => document.removeEventListener('keydown', handleTab)
  }, [isOpen])

  return <div ref={modalRef}>{children}</div>
}
```

#### 2.2 충분한 시간
- [x] 자동 슬라이드 없음
- [ ] **확인 필요**: 세션 타임아웃 경고

#### 2.3 발작 예방
- [x] 깜빡임 없음
- [x] 플래시 효과 없음

#### 2.4 탐색 가능성
- [x] Skip link
- [x] 페이지 제목
- [ ] **개선 필요**: Breadcrumb 네비게이션
- [ ] **개선 필요**: 포커스 표시자 강화

**포커스 표시자 개선**:
```css
/* globals.css에 추가 */
*:focus-visible {
  outline: 2px solid #5E6AD2; /* Primary color */
  outline-offset: 2px;
  border-radius: 4px;
}

button:focus-visible,
a:focus-visible {
  outline: 2px solid #5E6AD2;
  outline-offset: 2px;
}
```

---

### 3. 이해 가능성 (Understandable)

#### 3.1 가독성
- [x] HTML lang 속성 (ko)
- [x] 명확한 레이블
- [ ] **개선 필요**: 복잡한 용어 설명 (툴팁)

#### 3.2 예측 가능성
- [x] 일관된 네비게이션
- [x] 일관된 UI 패턴
- [ ] **개선 필요**: 컨텍스트 변경 경고

#### 3.3 입력 지원
- [x] 폼 레이블
- [x] 에러 메시지
- [ ] **개선 필요**: 입력 제안 (autocomplete)

**폼 접근성 개선**:
```tsx
// ❌ 나쁜 예
<input type="email" placeholder="Email" />

// ✅ 좋은 예
<div>
  <label htmlFor="email" className="block text-sm font-medium">
    Email
  </label>
  <input
    id="email"
    type="email"
    autoComplete="email"
    aria-describedby="email-error"
    aria-invalid={!!error}
    required
  />
  {error && (
    <p id="email-error" className="text-error text-sm" role="alert">
      {error}
    </p>
  )}
</div>
```

---

### 4. 견고성 (Robust)

#### 4.1 호환성
- [x] 유효한 HTML
- [x] ARIA 사용
- [ ] **개선 필요**: ARIA 검증 (axe-core)

---

## 🛠️ 구체적인 개선 사항

### 1. 색상 대비 개선

**파일**: `src/styles/globals.css`

```css
/* 기존 */
.text-muted {
  color: #71717A; /* zinc-500, 대비 4.2:1 (미달) */
}

/* 개선 */
.text-muted {
  color: #A1A1AA; /* zinc-400, 대비 7.1:1 (통과) */
}
```

### 2. 아이콘 버튼 접근성

**파일**: `src/components/ui/IconButton.tsx` (신규 생성)

```tsx
interface IconButtonProps {
  icon: React.ReactNode
  label: string // 필수!
  onClick: () => void
  variant?: 'primary' | 'secondary'
}

export function IconButton({ icon, label, onClick, variant = 'secondary' }: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn('icon-button', variant)}
    >
      <span aria-hidden="true">{icon}</span>
      <span className="sr-only">{label}</span>
    </button>
  )
}
```

### 3. ARIA Live Regions

**토스트 알림 개선**:

```tsx
// src/components/ui/Toast.tsx
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="toast"
>
  {message}
</div>

// 에러 알림 (더 긴급함)
<div
  role="alert"
  aria-live="assertive"
  aria-atomic="true"
  className="toast-error"
>
  {error}
</div>
```

### 4. 랜드마크 역할 추가

**파일**: `src/app/layout.tsx`

```tsx
<body>
  <a href="#main-content" className="skip-link">메인 콘텐츠로 건너뛰기</a>

  <header role="banner">
    <Navbar />
  </header>

  <nav role="navigation" aria-label="Main navigation">
    <Sidebar />
  </nav>

  <main role="main" id="main-content">
    {children}
  </main>

  <footer role="contentinfo">
    <Footer />
  </footer>
</body>
```

---

## 🧪 접근성 테스트 도구

### 1. 자동화 도구

#### axe DevTools (Chrome Extension)
```bash
# 설치
chrome://extensions

# 사용법
1. F12 (개발자 도구)
2. "axe DevTools" 탭
3. "Scan ALL of my page" 클릭
```

#### Lighthouse (내장)
```bash
# Chrome DevTools → Lighthouse 탭
# Accessibility 체크박스 선택
# Generate report

# 목표 점수: 90+
```

#### eslint-plugin-jsx-a11y
```bash
pnpm add -D eslint-plugin-jsx-a11y

# .eslintrc.json
{
  "extends": [
    "plugin:jsx-a11y/recommended"
  ]
}
```

### 2. 수동 테스트

#### 키보드 테스트
- [ ] Tab으로 모든 요소 접근 가능
- [ ] Enter/Space로 버튼 활성화
- [ ] Esc로 모달 닫기
- [ ] 화살표로 드롭다운 네비게이션

#### 스크린 리더 테스트
- [ ] NVDA (Windows 무료)
- [ ] JAWS (Windows 유료)
- [ ] VoiceOver (macOS 내장)
- [ ] TalkBack (Android)

#### 색상 대비 테스트
```bash
# WebAIM Contrast Checker
https://webaim.org/resources/contrastchecker/

# 목표
- 일반 텍스트: 4.5:1 이상
- 큰 텍스트: 3:1 이상
- UI 컴포넌트: 3:1 이상
```

---

## 📊 접근성 점수 목표

| 도구 | 현재 (추정) | 목표 | 개선 |
|------|------------|------|------|
| Lighthouse | 75-80 | 95+ | +20% |
| axe DevTools | 10개 이슈 | 0개 | -100% |
| WAVE | 5개 에러 | 0개 | -100% |

---

## 🚀 구현 우선순위

### P0 (즉시) - 30분
- [x] 접근성 가이드 문서 작성
- [ ] 색상 대비 개선 (zinc-500 → zinc-400)
- [ ] 누락된 aria-label 추가 (5개 버튼)

### P1 (1주일) - 2시간
- [ ] 모달 포커스 트랩 구현
- [ ] 포커스 표시자 강화
- [ ] ARIA landmarks 추가

### P2 (2주일) - 4시간
- [ ] eslint-plugin-jsx-a11y 통합
- [ ] 자동화 테스트 (Playwright + axe-core)
- [ ] 키보드 네비게이션 전수 검사

---

## ✅ 체크리스트

- [x] 접근성 가이드 작성
- [ ] 색상 대비 개선
- [ ] 아이콘 버튼 aria-label
- [ ] 모달 포커스 트랩
- [ ] ARIA landmarks
- [ ] 포커스 표시자 강화
- [ ] Lighthouse 감사 (95+ 목표)

---

**작성자**: Claude Sonnet 4.5
**최종 수정**: 2025-12-21
**참고**: WCAG 2.1 Level AA, Section 508
