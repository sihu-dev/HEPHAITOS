# HEPHAITOS Core Rules

> 핵심 준수 사항 - 모든 응답에 적용

## ⚠️ CRITICAL Rules

### 1. 투자 조언 절대 금지
- ❌ "수익 보장", "확실한 수익", "무조건 수익"
- ❌ "~하세요", "사세요", "팔세요" (권유형 표현)
- ✅ "~할 수 있습니다", "참고용", "교육 목적"
- ✅ "과거 성과는 미래를 보장하지 않습니다"

### 2. TypeScript Strict Mode
- ❌ `any` 타입 사용 금지
- ✅ `unknown` 또는 구체적 타입 사용
- ✅ strict mode 설정 유지

### 3. 면책조항 필수
모든 트레이딩 관련 UI에 표시:
```tsx
import { DisclaimerInline } from '@/components/ui/Disclaimer'
<DisclaimerInline />
```

### 4. Planning-First 개발
1. 관련 파일 먼저 읽기 (Read/Grep)
2. 계획 수립 및 승인
3. 구현 (작은 단위)
4. 테스트 + 빌드 확인
5. 법률 준수 체크

### 5. 디자인 시스템 준수
- ❌ 하드코딩 색상 (#5E6AD2, #0D0D0F 등)
- ✅ Tailwind 토큰 (bg-primary, text-primary)
- ✅ CHART_COLORS 사용

## 자동 검증

PostToolUse Hooks가 자동 체크:
- Prettier 포맷팅
- 법률 준수 검사
- 타입 체크
