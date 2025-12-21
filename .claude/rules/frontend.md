# Frontend Rules

> src/components/**, src/app/**/page.tsx에 적용

## UI/UX 규칙

### 1. 디자인 시스템 필수
```tsx
// ❌ 하드코딩
<div className="bg-[#5E6AD2]" />
<div style={{ color: '#0D0D0F' }} />

// ✅ 토큰 사용
<div className="bg-primary" />
<div className="bg-background-primary" />
```

### 2. Glass Morphism 패턴
모든 카드/패널 컴포넌트:
```tsx
className="bg-white/3 backdrop-blur-md border border-white/6"
```

### 3. 면책조항 필수
트레이딩 관련 모든 화면:
```tsx
import { DisclaimerInline } from '@/components/ui/Disclaimer'

// 화면 하단에 추가
<DisclaimerInline className="mt-6" />
```

### 4. 반응형 필수
```tsx
// 모바일 우선
className="flex flex-col md:flex-row"
className="text-sm md:text-base"
```

### 5. 접근성
```tsx
// data-testid 필수
<button data-testid="submit-button">

// aria-label 추가
<button aria-label="닫기" />
```

## 법률 준수

### 투자 조언 금지
```tsx
// ❌ 금지
<p>이 전략을 사용하세요</p>
<p>수익 보장</p>

// ✅ 허용
<p>이 전략은 ~한 특징이 있습니다</p>
<p>과거 성과는 미래를 보장하지 않습니다</p>
```

## 성능 최적화

### React.memo 사용
```tsx
export const HeavyComponent = memo(function HeavyComponent() {
  // ...
})
```

### useMemo/useCallback
```tsx
const expensiveValue = useMemo(() => computeValue(data), [data])
const handleClick = useCallback(() => {}, [])
```
