---
name: progressive-analysis
description: 콘솔/CSS/E2E 점진적 반복 분석 및 개선. 품질 자동화, 자가 개선 루프에 사용.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# 점진적 분석 및 개선 스킬

## 사용 시점
- 콘솔 에러/경고 분석 시
- CSS 스타일 최적화 시
- E2E 테스트 분석/개선 시
- 코드 품질 점진적 개선 시

## 3축 분석 프레임워크

```
┌─────────────────────────────────────────────────────────────────┐
│                    점진적 분석 3축                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [1. 콘솔 분석]                                                 │
│  ├─ Error: 즉시 수정 필수                                       │
│  ├─ Warning: 우선순위 판단 후 수정                              │
│  └─ Info: 선택적 개선                                           │
│                                                                 │
│  [2. CSS 분석]                                                  │
│  ├─ Unused CSS: PurgeCSS 또는 수동 제거                        │
│  ├─ Duplicate: 통합 필요                                        │
│  └─ Performance: 최적화 대상                                    │
│                                                                 │
│  [3. E2E 분석]                                                  │
│  ├─ Flaky Tests: 안정화 필요                                    │
│  ├─ Slow Tests: 최적화 대상                                     │
│  └─ Missing Coverage: 추가 테스트 작성                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 점진적 개선 루프

```
┌─────────────────────────────────────────────────────────────────┐
│                    자가 개선 사이클                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [SCAN] ─────► [ANALYZE] ─────► [FIX] ─────► [VERIFY]          │
│    │              │               │              │              │
│    ▼              ▼               ▼              ▼              │
│  문제 감지     우선순위 지정    자동/수동 수정   테스트 확인     │
│                                                                 │
│                        ◄──────────────────────┘                 │
│                           반복 (문제 없을 때까지)                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 콘솔 분석 명령어

```bash
# 빌드 로그 분석
pnpm build 2>&1 | tee build.log

# 에러만 추출
grep -E "error|Error|ERROR" build.log

# 경고 추출 (우선순위별)
grep -E "warn|Warning|WARN" build.log | sort | uniq -c | sort -rn
```

## CSS 분석 명령어

```bash
# 사용되지 않는 CSS 클래스 찾기
npx purgecss --css src/styles/*.css --content src/**/*.tsx --output purge-report

# Tailwind 클래스 분석
grep -roh "className=\"[^\"]*\"" src/ | sort | uniq -c | sort -rn | head -50

# 중복 스타일 찾기
grep -rh "@apply" src/ | sort | uniq -d
```

## E2E 분석 명령어

```bash
# Playwright 테스트 실행 (상세 로그)
npx playwright test --reporter=line 2>&1 | tee e2e.log

# 실패한 테스트 목록
grep -E "✘|failed|FAILED" e2e.log

# 느린 테스트 찾기 (5초 이상)
grep -E "[0-9]{5,}ms" e2e.log
```

## 자동 수정 전략

### 1. 콘솔 에러 자동 수정
```typescript
// TypeScript 에러 패턴
const errorPatterns = {
  'TS2322': 'Type mismatch - 타입 명시 필요',
  'TS2339': 'Property missing - 인터페이스 확장',
  'TS7006': 'Implicit any - 타입 추가',
};
```

### 2. CSS 자동 최적화
```bash
# Tailwind 최적화
npx tailwindcss -i src/styles/globals.css -o dist/output.css --minify
```

### 3. E2E 안정화
```typescript
// Flaky 테스트 패턴
await page.waitForSelector('[data-testid="component"]', {
  state: 'visible',
  timeout: 10000
});
```

## 통합 분석 스크립트

```bash
#!/bin/bash
# progressive-analysis.sh

echo "=== 1. Console Analysis ==="
pnpm build 2>&1 | grep -E "error|warn" | head -20

echo "=== 2. CSS Analysis ==="
find src -name "*.css" -exec wc -l {} + | tail -1

echo "=== 3. E2E Analysis ==="
npx playwright test --list 2>/dev/null | wc -l

echo "=== Summary ==="
echo "Build errors: $(pnpm build 2>&1 | grep -c 'error')"
echo "CSS files: $(find src -name '*.css' | wc -l)"
echo "E2E tests: $(npx playwright test --list 2>/dev/null | wc -l)"
```

## 사용 예시

```bash
# 전체 분석 실행
/analyze progressive 콘솔+CSS+E2E

# 콘솔만 분석
/analyze console errors and warnings

# E2E 안정화
/test-fix flaky tests
```
