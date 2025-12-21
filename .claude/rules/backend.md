# Backend Rules

> src/app/api/**에 적용

## API 라우트 규칙

### 1. 인증 필수
```typescript
import { createServerSupabaseClient } from '@/lib/supabase/server'

const supabase = await createServerSupabaseClient()
const { data: { user }, error } = await supabase.auth.getUser()

if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

### 2. Rate Limiting
```typescript
import { checkRateLimit } from '@/lib/redis/rate-limiter'

const rateLimitResult = await checkRateLimit(req, 'api')
if (!rateLimitResult.success) {
  return NextResponse.json(
    { error: 'Too many requests' },
    { status: 429 }
  )
}
```

### 3. Error Handling
```typescript
try {
  // API logic
} catch (err) {
  const message = err instanceof Error ? err.message : 'Unknown error'
  safeLogger.error('[API] Error:', { message, userId: user.id })

  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}
```

### 4. Validation
```typescript
import { validateRequestBody } from '@/lib/api/middleware'
import { strategySchema } from '@/lib/validations/strategy'

const validation = await validateRequestBody(req, strategySchema)
if ('error' in validation) return validation.error
```

### 5. CORS
```typescript
const headers = {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL,
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type',
}
```

## 보안

### 민감 정보 보호
```typescript
// ❌ 금지
const apiKey = process.env.SECRET_KEY

// ✅ 허용
const apiKey = process.env.SECRET_KEY
// 로그에 노출 금지, 암호화 저장
```

### Input Sanitization
```typescript
import DOMPurify from 'isomorphic-dompurify'

const sanitized = DOMPurify.sanitize(userInput)
```

## 성능

### Database Query 최적화
```typescript
// RLS 정책 활용
const { data } = await supabase
  .from('strategies')
  .select('*')
  .eq('user_id', user.id)  // RLS가 자동 체크
```
