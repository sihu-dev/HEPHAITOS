# HEPHAITOS UI Components Guide

> **이 폴더 작업 시 반드시 읽을 것**

## 디자인 시스템 준수

### 필수 체크사항
- [ ] Glass Morphism 적용 (`backdrop-filter: blur(16px)`)
- [ ] Dark Mode Only (배경: #0D0D0F)
- [ ] Primary Color (#5E6AD2) - CTA만 사용
- [ ] 반응형 (mobile-first)
- [ ] 접근성 (ARIA labels, keyboard navigation)

### 컬러 사용 규칙
```tsx
// ✅ 올바른 예
<Button className="bg-primary text-white">매수</Button>
<div className="text-profit">+12.5%</div>

// ❌ 잘못된 예
<Button className="bg-red-500">매수</Button> // 하드코딩
<span style={{ color: '#22C55E' }}>수익</span> // 인라인 스타일
```

### 컴포넌트 구조
```
components/
├── ui/              # Shadcn/ui 기본 컴포넌트
├── dashboard/       # 대시보드 전용
├── strategy-builder/ # 전략 빌더
└── layout/          # 레이아웃
```

### 타입 안전성
- `any` 타입 절대 금지
- Props 인터페이스 반드시 정의
- `children?: React.ReactNode` 사용

### 법률 준수
- 트레이딩 관련 컴포넌트에 면책조항 필수
- "투자 조언" 표현 금지
- "~할 수 있습니다" (설명형) 사용

## 참고 파일
- `../../DESIGN_SYSTEM.md` - 전체 디자인 규칙
- `./ui/` - 재사용 가능한 기본 컴포넌트
