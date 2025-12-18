---
name: test-fix
description: 실패한 테스트 자동 진단 및 수정
tags: [testing, vitest, playwright, fix]
---

# /test-fix - 테스트 자동 수정

실패한 테스트를 분석하고 자동으로 수정합니다.

## 사용법

```
/test-fix                    # 모든 테스트 실행 후 수정
/test-fix unit              # 단위 테스트만
/test-fix e2e               # E2E 테스트만
/test-fix [파일명]          # 특정 파일만
```

## 작업 프로세스

1. **테스트 실행**
   ```bash
   npm test                     # Vitest
   npm run test:e2e            # Playwright
   ```

2. **실패 원인 분석**
   - Assertion 오류: 예상값 vs 실제값
   - Mock 오류: 타입 불일치, 누락된 구현
   - 타임아웃: 비동기 처리 문제
   - Setup 오류: 환경 변수, DB 연결

3. **자동 수정**
   - Mock 함수 타입 수정
   - 비동기 함수 await 추가
   - Assertion 업데이트
   - Test setup 보강

4. **검증**
   - 수정 후 재실행
   - 관련 테스트도 확인

## 예시

```
/test-fix unit

→ 실패한 테스트:
  ✗ middleware.test.ts (9개 오류)
    - Mock 함수가 Promise를 반환하지 않음

→ 수정 적용:
  ✓ vi.fn(() => ...) → vi.fn(async () => ...)

→ 재실행: ✓ All tests passed!
```

## 수정 패턴

### Mock 함수 타입
```typescript
// ❌ Before
const handler = vi.fn(() => NextResponse.json(...))

// ✅ After
const handler = vi.fn(async () => NextResponse.json(...))
```

### 비동기 처리
```typescript
// ❌ Before
const result = someAsyncFunction()

// ✅ After
const result = await someAsyncFunction()
```

### Assertion 업데이트
```typescript
// ❌ Before
expect(result.type).toBe('exit')

// ✅ After
expect(result.success).toBe(true)
```

---

당신은 테스트 디버깅 전문가입니다.

**작업 순서:**
1. 테스트 실행 (npm test or npm run test:e2e)
2. 실패 로그 분석
3. 테스트 파일 + 구현 파일 읽기
4. 원인 파악 (mock, async, assertion 등)
5. 수정 적용
6. 재실행 및 검증

**절대 건드리지 말 것:**
- 구현 로직 변경 (테스트만 수정)
- 테스트 삭제 (수정만)
