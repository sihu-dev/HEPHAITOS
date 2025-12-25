# Server Actions 구현 가이드

> **작성일**: 2025-12-21
> **버전**: 1.0
> **목적**: Next.js 15 Server Actions 구현 및 사용 가이드

---

## 1. 개요

### 1.1 Server Actions란?

**Server Actions**는 Next.js 15 App Router의 핵심 기능으로, 서버에서만 실행되는 비동기 함수입니다.

**주요 특징**:
- ✅ **타입 안전성**: 클라이언트-서버 간 자동 타입 추론
- ✅ **간결한 코드**: API 라우트 대비 50% 코드 감소
- ✅ **자동 최적화**: React Server Components와 완벽 통합
- ✅ **Form 통합**: HTML form action으로 직접 사용 가능
- ✅ **Progressive Enhancement**: JavaScript 없이도 작동

### 1.2 API 라우트 vs Server Actions

| 항목 | API 라우트 | Server Actions |
|------|-----------|---------------|
| **파일 위치** | `app/api/**/route.ts` | `src/actions/*.ts` |
| **선언 방법** | `export async function POST()` | `'use server'` directive |
| **타입 안전성** | 수동 (fetch 호출 시) | 자동 (함수 호출) |
| **에러 처리** | NextResponse.json | try/catch |
| **캐시 무효화** | 수동 | revalidatePath/Tag |
| **코드 양** | 많음 (보일러플레이트) | 적음 (간결) |
| **사용 사례** | Webhook, 외부 API 프록시 | CRUD, Form 제출 |

---

## 2. 구현된 Server Actions

### 2.1 디렉토리 구조

```
src/actions/
├── strategies.ts              # 전략 CRUD
├── user-profile.ts            # 사용자 프로필 및 온보딩
└── utils/
    ├── action-wrapper.ts      # 공통 래퍼 (인증, 에러 처리)
    └── revalidation.ts        # 캐시 무효화 헬퍼
```

### 2.2 strategies.ts

**구현된 Actions**:
- `getStrategiesAction` - 전략 목록 조회
- `getStrategyAction` - 단일 전략 조회
- `createStrategyAction` - 전략 생성
- `updateStrategyAction` - 전략 수정
- `deleteStrategyAction` - 전략 삭제
- `changeStrategyStatusAction` - 전략 상태 변경 (shorthand)

**주요 기능**:
- ✅ 자동 인증 체크 (withAuth 래퍼)
- ✅ 권한 검증 (본인 전략만 수정/삭제 가능)
- ✅ Input validation (Zod 스키마 적용 가능)
- ✅ 자동 캐시 무효화 (revalidatePath)
- ✅ 자동 로깅 (safeLogger)

### 2.3 user-profile.ts

**구현된 Actions**:
- `getUserProfileAction` - 프로필 조회
- `updateUserProfileAction` - 프로필 수정
- `completeOnboardingAction` - 온보딩 완료
- `saveOnboardingProgressAction` - 온보딩 진행 저장
- `checkOnboardingStatusAction` - 온보딩 완료 여부 확인

**주요 기능**:
- ✅ 자동 인증 체크
- ✅ Input sanitization (trim, length check)
- ✅ 자동 캐시 무효화
- ✅ 자동 로깅

---

## 3. 사용 방법

### 3.1 React Server Component에서 사용

```tsx
// app/dashboard/strategies/page.tsx
import { getStrategiesAction } from '@/actions/strategies'

export default async function StrategiesPage() {
  const result = await getStrategiesAction({ page: 1, limit: 10 })

  if (!result.success) {
    return <div>에러: {result.error}</div>
  }

  const { strategies, total, totalPages } = result.data

  return (
    <div>
      <h1>내 전략 ({total}개)</h1>
      {strategies.map(strategy => (
        <div key={strategy.id}>{strategy.name}</div>
      ))}
    </div>
  )
}
```

### 3.2 Client Component에서 사용

```tsx
'use client'

import { useState } from 'react'
import { createStrategyAction } from '@/actions/strategies'
import { useRouter } from 'next/navigation'

export function CreateStrategyForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const description = formData.get('description') as string

    const result = await createStrategyAction({ name, description })

    if (!result.success) {
      setError(result.error)
      setLoading(false)
      return
    }

    // 성공: 상세 페이지로 이동
    router.push(`/dashboard/strategies/${result.data.id}`)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" required />
      <textarea name="description" />
      {error && <p className="text-error">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? '생성 중...' : '전략 생성'}
      </button>
    </form>
  )
}
```

### 3.3 Form Action으로 사용 (Progressive Enhancement)

```tsx
'use client'

import { createStrategyAction } from '@/actions/strategies'
import { useActionState } from 'react'

export function CreateStrategyFormAction() {
  const [state, formAction, pending] = useActionState(
    async (_prevState: unknown, formData: FormData) => {
      const name = formData.get('name') as string
      const description = formData.get('description') as string

      return await createStrategyAction({ name, description })
    },
    null
  )

  return (
    <form action={formAction}>
      <input name="name" required />
      <textarea name="description" />
      {state && !state.success && (
        <p className="text-error">{state.error}</p>
      )}
      <button type="submit" disabled={pending}>
        {pending ? '생성 중...' : '전략 생성'}
      </button>
    </form>
  )
}
```

### 3.4 useTransition과 함께 사용 (Optimistic UI)

```tsx
'use client'

import { useTransition } from 'react'
import { deleteStrategyAction } from '@/actions/strategies'
import { useRouter } from 'next/navigation'

export function DeleteStrategyButton({ strategyId }: { strategyId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  async function handleDelete() {
    if (!confirm('정말 삭제하시겠습니까?')) return

    startTransition(async () => {
      const result = await deleteStrategyAction(strategyId)

      if (result.success) {
        router.push('/dashboard/strategies')
        router.refresh() // 캐시 강제 새로고침
      } else {
        alert(result.error)
      }
    })
  }

  return (
    <button onClick={handleDelete} disabled={isPending}>
      {isPending ? '삭제 중...' : '전략 삭제'}
    </button>
  )
}
```

---

## 4. 공통 유틸리티

### 4.1 action-wrapper.ts

#### withAuth 래퍼

**목적**: 인증 필수 액션에 자동으로 인증 체크 적용

```typescript
export const myAction = withAuth(
  async (userId: string, arg1: string, arg2: number) => {
    // userId는 자동으로 주입됨
    // 인증되지 않은 경우 자동으로 에러 반환
    return await doSomething(userId, arg1, arg2)
  },
  'myActionName'
)
```

#### withErrorHandling 래퍼

**목적**: 인증 불필요한 액션에 에러 처리 적용

```typescript
export const publicAction = withErrorHandling(
  async (arg1: string) => {
    return await doSomething(arg1)
  },
  'publicActionName'
)
```

#### ActionResponse 타입

```typescript
type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string }
```

**사용 예**:
```typescript
const result = await myAction('arg1', 123)

if (result.success) {
  console.log(result.data) // 타입 안전
} else {
  console.error(result.error, result.code)
}
```

### 4.2 revalidation.ts

**캐시 무효화 헬퍼**:
- `revalidateStrategies(userId?)` - 전략 목록 재검증
- `revalidateStrategy(strategyId)` - 단일 전략 재검증
- `revalidatePortfolio(userId?)` - 포트폴리오 재검증
- `revalidateUserProfile(userId)` - 사용자 프로필 재검증
- `revalidateDashboard()` - 대시보드 전체 재검증

**사용 예**:
```typescript
export const updateStrategyAction = withAuth(
  async (userId: string, strategyId: string, updates: UpdateInput) => {
    const updated = await updateStrategyService(strategyId, updates)

    // 캐시 무효화
    await revalidateStrategy(strategyId)
    await revalidateStrategies(userId)

    return updated
  },
  'updateStrategyAction'
)
```

---

## 5. 마이그레이션 가이드

### 5.1 API 라우트에서 Server Actions로 변환

#### Before (API 라우트)

```typescript
// app/api/strategies/route.ts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const userId = await getCurrentUserId()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const strategy = await createStrategy({ userId, ...body })

    return NextResponse.json({ success: true, data: strategy })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    )
  }
}
```

```tsx
// Client
const response = await fetch('/api/strategies', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name, description }),
})
const result = await response.json()
```

#### After (Server Actions)

```typescript
// src/actions/strategies.ts
export const createStrategyAction = withAuth(
  async (userId: string, input: CreateStrategyInput) => {
    const strategy = await createStrategy({ userId, ...input })
    await revalidateStrategies(userId)
    return strategy
  },
  'createStrategyAction'
)
```

```tsx
// Client
const result = await createStrategyAction({ name, description })
```

**개선 사항**:
- ✅ 50% 코드 감소
- ✅ 자동 타입 추론 (result.data가 Strategy 타입)
- ✅ fetch 호출 불필요
- ✅ 자동 인증 체크
- ✅ 자동 에러 처리

### 5.2 마이그레이션 우선순위

**Phase 1 (High Priority)** - 완료:
- ✅ Strategy CRUD
- ✅ User Profile

**Phase 2 (Medium Priority)**:
- [ ] Portfolio (포트폴리오 조회/수정)
- [ ] Trades (거래 기록)
- [ ] Simulation (시뮬레이션)

**유지할 API 라우트**:
- Webhooks (payments/webhook/*, cron/*)
- Streaming (ai/*)
- External proxies (exchange/*)
- Health checks

---

## 6. 보안 고려사항

### 6.1 자동 인증 체크

```typescript
export const myAction = withAuth(async (userId: string) => {
  // userId는 검증된 사용자만 주입됨
  // 인증되지 않은 경우 자동 차단
})
```

### 6.2 권한 검증 예제

```typescript
export const deleteStrategyAction = withAuth(
  async (userId: string, strategyId: string) => {
    const strategy = await getStrategyById(strategyId)

    // 본인의 전략만 삭제 가능
    if (strategy.userId !== userId) {
      throw new Error('권한이 없습니다')
    }

    await deleteStrategy(strategyId)
    return { deleted: true }
  },
  'deleteStrategyAction'
)
```

### 6.3 Input Validation

```typescript
export const createStrategyAction = withAuth(
  async (userId: string, input: CreateStrategyInput) => {
    // 필수 값 검증
    const nameError = validateRequired(input.name, '전략 이름')
    if (nameError) throw new Error(nameError.error)

    // 길이 검증
    if (input.name.length > 100) {
      throw new Error('전략 이름은 100자 이내로 입력해주세요')
    }

    // Sanitization
    const sanitized = {
      ...input,
      name: input.name.trim(),
      description: input.description?.trim(),
    }

    return await createStrategy({ userId, ...sanitized })
  },
  'createStrategyAction'
)
```

### 6.4 Rate Limiting

**TODO**: Server Actions에도 rate limiting 적용 필요

```typescript
import { checkRateLimit } from '@/lib/api/middleware/rate-limit'

export const sensitiveAction = withAuth(
  async (userId: string) => {
    // TODO: Rate limiting 적용
    // const rateLimit = await checkRateLimitAction(userId, 'strategy')
    // if (!rateLimit.allowed) throw new Error('Too many requests')

    // ... action logic
  },
  'sensitiveAction'
)
```

---

## 7. 성능 최적화

### 7.1 캐시 전략

```typescript
// Aggressive caching for static data
export async function getPublicStrategy(id: string) {
  'use server'

  const strategy = await fetch(`https://api.example.com/strategies/${id}`, {
    next: { revalidate: 3600 }, // 1시간 캐시
  })

  return strategy.json()
}

// No caching for dynamic data
export const getUserStrategies = withAuth(
  async (userId: string) => {
    // 항상 최신 데이터 반환
    return await getStrategies({ userId })
  },
  'getUserStrategies'
)
```

### 7.2 Selective Revalidation

```typescript
// 필요한 경로만 재검증
await revalidatePath(`/dashboard/strategies/${strategyId}`) // 특정 전략만

// vs 전체 재검증 (비효율적)
await revalidatePath('/dashboard', 'layout') // 모든 대시보드
```

### 7.3 Parallel Execution

```typescript
export const createMultipleStrategies = withAuth(
  async (userId: string, strategies: CreateStrategyInput[]) => {
    // 병렬 실행
    const results = await Promise.all(
      strategies.map(strategy =>
        createStrategy({ userId, ...strategy })
      )
    )

    // 한 번만 재검증
    await revalidateStrategies(userId)

    return results
  },
  'createMultipleStrategies'
)
```

---

## 8. 테스트

### 8.1 Server Actions 테스트

```typescript
import { createStrategyAction } from '@/actions/strategies'
import { describe, it, expect, vi } from 'vitest'

describe('createStrategyAction', () => {
  it('should create strategy successfully', async () => {
    // Mock getCurrentUserId
    vi.mock('@/actions/utils/action-wrapper', () => ({
      getCurrentUserId: vi.fn().mockResolvedValue('user-123'),
    }))

    const result = await createStrategyAction({
      name: 'Test Strategy',
      description: 'Test description',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Test Strategy')
    }
  })

  it('should return error when not authenticated', async () => {
    vi.mock('@/actions/utils/action-wrapper', () => ({
      getCurrentUserId: vi.fn().mockResolvedValue(null),
    }))

    const result = await createStrategyAction({ name: 'Test' })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('로그인')
    }
  })
})
```

---

## 9. FAQ

### Q1: Server Actions는 언제 사용해야 하나요?

**A**: 다음 경우에 사용:
- ✅ Form 제출 및 데이터 변경 (POST/PUT/DELETE)
- ✅ 인증이 필요한 작업
- ✅ 타입 안전성이 중요한 작업
- ✅ 간단한 데이터 조회 (GET)

**API 라우트 유지**:
- ❌ Webhook 엔드포인트
- ❌ 외부 API 프록시
- ❌ 스트리밍 응답 (AI)
- ❌ 복잡한 HTTP 헤더 제어

### Q2: Server Actions에서 에러를 어떻게 처리하나요?

**A**: `ActionResponse<T>` 타입 사용:
```typescript
const result = await myAction()

if (result.success) {
  // result.data 사용
} else {
  // result.error, result.code 사용
  console.error(result.error)
}
```

### Q3: 캐시는 어떻게 무효화하나요?

**A**: `revalidatePath` 또는 `revalidateTag` 사용:
```typescript
await revalidatePath('/dashboard/strategies')
await revalidateTag('strategies')
```

### Q4: Server Actions에서 파일 업로드는 어떻게 하나요?

**A**: FormData 사용:
```typescript
export const uploadFileAction = withAuth(
  async (userId: string, formData: FormData) => {
    const file = formData.get('file') as File
    // ... 파일 처리
  },
  'uploadFileAction'
)
```

---

## 10. 참고 자료

- [Next.js Server Actions 공식 문서](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [React useActionState Hook](https://react.dev/reference/react/useActionState)
- [Next.js Caching](https://nextjs.org/docs/app/building-your-application/caching)

---

**작성자**: Claude Sonnet 4.5
**최종 수정**: 2025-12-21
