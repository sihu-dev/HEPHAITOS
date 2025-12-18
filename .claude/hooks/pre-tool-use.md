---
name: pre-tool-use
event: PreToolUse
description: 도구 실행 전 자동 검증 (법률 준수, 타입 안전성)
enabled: true
---

# PreToolUse Hook - 도구 실행 전 검증

## 트리거 조건
모든 Write, Edit 도구 사용 시 자동 실행

## 검증 항목

### 1. 법률 준수 체크 (CRITICAL)
Write 또는 Edit 도구가 다음 파일에 적용될 때:
- `src/components/**/*.tsx`
- `src/app/**/*.tsx`
- `src/lib/ai/**/*.ts`

**자동 검증:**
```
❌ 금지 표현 검사:
- "수익 보장"
- "확실한 수익"
- "~하세요" (권유형)
- 구체적 종목 추천

✅ 면책조항 필수 (투자 관련 UI)
```

### 2. 타입 안전성 체크
TypeScript 파일 수정 시:
```
❌ any 타입 사용 금지
❌ 타입 단언 남용 (as any)
✅ unknown 사용 권장
✅ interface 선호
```

### 3. 디자인 시스템 준수 (컴포넌트)
`src/components/**/*.tsx` 수정 시:
```
❌ 하드코딩 컬러 (bg-red-500)
❌ 인라인 스타일
✅ Tailwind 토큰 사용
✅ Glass Morphism 패턴
```

## 자동 경고 메시지

위반 발견 시:
```
⚠️ PreToolUse Hook 경고:
- 파일: src/components/Strategy.tsx
- 위반: "수익 보장" 표현 발견
- 조치: 법률 준수 표현으로 변경 필요

계속하시겠습니까? [y/n]
```

## 예외 처리

다음 파일은 검증 제외:
- `*.test.ts`, `*.spec.ts` (테스트 파일)
- `*.mock.ts` (Mock 파일)
- `scripts/**/*` (스크립트)
