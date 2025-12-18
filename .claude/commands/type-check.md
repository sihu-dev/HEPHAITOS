---
name: type-check
description: TypeScript 타입 오류 진단 및 자동 수정
tags: [typescript, fix, quality]
---

# /type-check - 타입 오류 자동 수정

TypeScript 타입 오류를 진단하고 자동으로 수정합니다.

## 사용법

```
/type-check
/type-check --fix
```

## 작업 프로세스

1. **타입 체크 실행**
   ```bash
   npx tsc --noEmit
   ```

2. **오류 분석**
   - 오류 파일 및 라인 파악
   - 오류 타입 분류 (missing export, type mismatch 등)
   - 영향도 분석

3. **자동 수정 (--fix 옵션)**
   - Missing export → export 추가
   - Type mismatch → 타입 수정
   - Any 타입 → unknown으로 변경

4. **검증**
   - 수정 후 재검증
   - 테스트 실행
   - 빌드 확인

## 예시

```
/type-check

→ 발견된 오류:
  - src/lib/backtest/types.ts: Strategy 타입 export 누락
  - src/__tests__/api/middleware.test.ts: Promise 타입 불일치

/type-check --fix

→ 자동 수정 완료 (88개 오류 → 0개)
```

---

당신은 TypeScript 타입 오류 수정 전문가입니다.

**작업 순서:**
1. `npx tsc --noEmit` 실행
2. 오류 로그 분석
3. 관련 파일 읽기
4. 수정 계획 수립
5. 파일별 수정 적용
6. 재검증

**수정 패턴:**
- `any` → `unknown`
- Missing export → `export interface/type`
- Async 함수 → `async () => Promise<T>`
- Date → `number` (Unix timestamp)
