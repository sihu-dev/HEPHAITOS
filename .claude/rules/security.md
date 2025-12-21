# Security Rules

> 전역 적용

## 보안 필수 사항

### 1. 인증 검증
모든 API 라우트:
```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) return { error: 'Unauthorized', status: 401 }
```

### 2. XSS 방지
```typescript
import DOMPurify from 'isomorphic-dompurify'

// dangerouslySetInnerHTML 사용 시
<div dangerouslySetInnerHTML={{
  __html: DOMPurify.sanitize(userContent)
}} />
```

### 3. SQL Injection 방지
```typescript
// ✅ Parameterized query (Supabase)
await supabase
  .from('users')
  .select()
  .eq('id', userId)  // 안전

// ❌ 직접 문자열 삽입 금지
await supabase.rpc('raw_query', {
  query: `SELECT * FROM users WHERE id = ${userId}`
})
```

### 4. 환경 변수 보호
```typescript
// .env.local (git에 포함 안됨)
SECRET_KEY=xxx
API_SECRET=xxx

// 코드에서
const secret = process.env.SECRET_KEY
// ❌ 클라이언트에 노출 금지
```

### 5. Rate Limiting
```typescript
import { checkRateLimit } from '@/lib/redis/rate-limiter'

const result = await checkRateLimit(req, 'api')
if (!result.success) {
  return { error: 'Too many requests', status: 429 }
}
```

### 6. CORS 제한
```typescript
const allowedOrigins = [
  process.env.NEXT_PUBLIC_APP_URL,
  'https://hephaitos.ai'
]

if (!allowedOrigins.includes(origin)) {
  return { error: 'Forbidden', status: 403 }
}
```

### 7. 민감 데이터 로깅 금지
```typescript
// ❌ 금지
console.log('User password:', password)
console.log('API key:', apiKey)

// ✅ 허용
safeLogger.info('User logged in', { userId: user.id })
```

### 8. 파일 업로드 검증
```typescript
const allowedTypes = ['image/jpeg', 'image/png']
const maxSize = 5 * 1024 * 1024  // 5MB

if (!allowedTypes.includes(file.type)) {
  throw new Error('Invalid file type')
}
```
