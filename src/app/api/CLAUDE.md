# HEPHAITOS API Routes Guide

> **API 라우트 작업 시 필수 컨텍스트**

## API 설계 원칙

### 1. 통합 응답 포맷
```typescript
// ✅ 성공 응답
return NextResponse.json({
  success: true,
  data: { ... }
}, { status: 200 })

// ✅ 에러 응답
return NextResponse.json({
  success: false,
  error: {
    code: 'RATE_LIMITED',
    message: '요청 한도 초과'
  }
}, { status: 429 })
```

### 2. Rate Limiting (필수)
```typescript
import { withRateLimit } from '@/lib/api/middleware/rate-limit'

export const GET = withRateLimit(
  async (request) => { ... },
  { category: 'ai' }  // ai, exchange, backtest 등
)
```

### 3. 에러 핸들링
```typescript
import { withErrorHandler } from '@/lib/api/middleware/error-handler'

export const POST = withErrorHandler(
  async (request) => {
    // 에러 발생 시 자동으로 500 응답
  }
)
```

### 4. 인증 (Supabase)
```typescript
import { createClient } from '@/lib/supabase/server'

const supabase = createClient()
const { data: { user }, error } = await supabase.auth.getUser()

if (!user) {
  return NextResponse.json(
    { success: false, error: { code: 'UNAUTHORIZED' } },
    { status: 401 }
  )
}
```

## API 라우트 구조
```
api/
├── ai/              # Claude API (strategy, report, tutor)
├── backtest/        # 백테스팅
├── broker/          # UnifiedBroker 연동
├── celebrities/     # 셀럽 미러링
├── exchange/        # 실시간 시세
├── payments/        # Tosspayments
└── strategies/      # 전략 CRUD
```

## 성능 최적화
- Redis 캐싱 (exchange/ 라우트)
- BullMQ (backtest/ 큐 시스템)
- Streaming 응답 (ai/ 라우트)

## 법률 준수
- AI 응답에 면책조언 포함
- "투자 조언" 표현 금지
- 사용자 동의 확인 (consent API)

## Rate Limit 카테고리
```typescript
'api'      → 100 req/min (기본)
'exchange' → 30 req/min  (외부 API 제한)
'ai'       → 20 req/min  (Claude API 비용)
'auth'     → 10 req/min  (보안)
'backtest' → 10 req/min  (연산 집약적)
'strategy' → 50 req/min  (자주 사용)
```

## 필수 참조
- `../lib/api/middleware/` - Rate limit + Error handler
- `../lib/supabase/server.ts` - Supabase 클라이언트
