---
name: post-tool-use
event: PostToolUse
description: 도구 실행 후 자동 검증 및 후속 작업
enabled: true
---

# PostToolUse Hook - 도구 실행 후 검증

## 트리거 조건
Write, Edit, Bash 도구 실행 완료 후

## 자동 실행 작업

### 1. 파일 수정 후 (Write, Edit)

#### TypeScript 파일
```bash
# 자동 포맷팅
npx prettier --write [파일명]

# 타입 체크 (해당 파일만)
npx tsc --noEmit [파일명]
```

**에러 발생 시:**
```
⚠️ PostToolUse Hook:
- 타입 오류 발견: src/lib/strategy.ts:42
- 오류: Property 'foo' does not exist on type 'Strategy'
- 자동 수정을 시도합니까? [y/n]
```

#### 컴포넌트 파일
```bash
# 스타일 린트
npx eslint [파일명] --fix
```

### 2. 테스트 파일 수정 후
```bash
# 해당 테스트만 실행
npm test -- [테스트파일]
```

**실패 시:**
```
⚠️ 테스트 실패:
- 파일: src/__tests__/lib/strategy.test.ts
- 실패: 2/10 tests
- 자동 수정을 시도합니까? [y/n]
```

### 3. API 라우트 수정 후
```bash
# 해당 API 헬스 체크
curl -s http://localhost:3000/api/health
```

### 4. 스키마 파일 수정 후
```bash
# Supabase 타입 재생성
npx supabase gen types typescript --local
```

## 자동 커밋 제안

5개 이상 파일 수정 완료 시:
```
💡 PostToolUse Hook 제안:
- 수정된 파일: 7개
- 추천: 중간 커밋 생성

커밋 메시지 제안:
"feat(strategy): AI 전략 생성 로직 개선"

커밋하시겠습니까? [y/n]
```

## 성능 모니터링

빌드 시간 측정:
```
📊 빌드 성능:
- 이전: 18.8s
- 현재: 19.2s (+0.4s)
- 경고: 빌드 시간 5% 증가
```
