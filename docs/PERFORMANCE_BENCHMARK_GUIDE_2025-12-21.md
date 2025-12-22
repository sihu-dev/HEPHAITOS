# HEPHAITOS 성능 벤치마크 가이드

> **작성일**: 2025-12-21
> **목적**: 프로덕션 성능 모니터링 및 자동화
> **Phase**: 5 P1

---

## 📊 개요

HEPHAITOS 성능 벤치마크 시스템은 빌드 성능, 번들 크기, 메모리 사용량을 자동으로 측정하고 리포트를 생성합니다.

### 측정 지표

| 지표 | 임계값 | 설명 |
|------|--------|------|
| **Build Time** | 120초 | Next.js 프로덕션 빌드 시간 |
| **Bundle Size** | 500KB | 메인 번들 크기 (main-*.js) |
| **Memory Usage** | 2GB | Node.js 메모리 제한 |
| **Lighthouse** | 85점 | 성능 점수 (선택적) |

---

## 🚀 사용법

### 로컬 실행

```bash
# 전체 벤치마크 실행
pnpm performance

# 또는 직접 실행
bash scripts/performance-monitor.sh
```

**출력 예시**:
```
📊 HEPHAITOS Performance Monitor
=================================

⏱️ Measuring build time...
Build time: 87s
✅ Build time OK

📦 Analyzing bundle size...
Main bundle: 234KB
✅ Bundle size OK

💾 Checking memory usage...
✅ Memory usage OK

📝 Generating performance report...
✅ Report saved: performance-report-20251221-143052.md

=================================
🎉 All performance checks passed!
```

### 생성된 리포트

`performance-report-{timestamp}.md` 파일이 자동 생성됩니다:

```markdown
# HEPHAITOS Performance Report

**Generated**: Sat Dec 21 14:30:52 KST 2025

## Metrics

| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Build Time | 87s | 120s | ✅ PASS |
| Bundle Size | 234KB | 500KB | ✅ PASS |
| Lighthouse | N/A | 85 | ⏸️ SKIP |

## Recommendations

- ✅ Build time is optimal
- ✅ Bundle size is optimal
- ⏸️ Lighthouse audit skipped (enable in script line 154)
```

---

## 🔧 스크립트 구조

### 주요 함수

#### 1. `measure_build_time()`
```bash
# Next.js 프로덕션 빌드 시간 측정
START_TIME=$(date +%s)
npm run build > /dev/null 2>&1
END_TIME=$(date +%s)
BUILD_TIME=$((END_TIME - START_TIME))
```

#### 2. `analyze_bundle_size()`
```bash
# 메인 번들 크기 분석
BUNDLE_SIZE=$(du -sk .next/static/chunks/main-*.js | cut -f1)
```

#### 3. `check_memory_usage()`
```bash
# 메모리 사용량 체크 (OOM 감지)
NODE_OPTIONS="--max-old-space-size=2048" npm run build
```

#### 4. `run_lighthouse()` (주석 처리됨)
```bash
# Lighthouse 성능 감사 (선택적)
npx lighthouse http://localhost:3000 --output json
```

---

## ⚙️ CI/CD 통합

### GitHub Actions 워크플로우

`.github/workflows/performance.yml` 생성:

```yaml
name: Performance Benchmark

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  performance:
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run performance benchmark
        run: bash scripts/performance-monitor.sh
        continue-on-error: true

      - name: Upload performance report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: performance-report
          path: performance-report-*.md
          retention-days: 30

      - name: Comment PR with results
        uses: actions/github-script@v7
        if: github.event_name == 'pull_request'
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync(
              fs.readdirSync('.').find(f => f.startsWith('performance-report-')),
              'utf8'
            );
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## 📊 Performance Benchmark\n\n${report}`
            });
```

### Vercel 통합

`vercel.json`에 추가:

```json
{
  "buildCommand": "pnpm build && bash scripts/performance-monitor.sh",
  "installCommand": "pnpm install"
}
```

---

## 📈 성능 회귀 방지

### 1. Pre-commit Hook

`.husky/pre-push` 생성:

```bash
#!/bin/sh

echo "🔍 Running performance check..."

# 빠른 번들 사이즈만 체크
if [ -d ".next" ]; then
  BUNDLE_SIZE=$(du -sk .next/static/chunks/main-*.js 2>/dev/null | cut -f1 || echo "0")

  if [ $BUNDLE_SIZE -gt 500 ]; then
    echo "❌ Bundle size ($BUNDLE_SIZE KB) exceeds threshold (500 KB)"
    echo "💡 Consider code splitting or removing unused dependencies"
    exit 1
  fi
fi
```

### 2. Bundle Analyzer 활용

```bash
# 번들 분석 실행
ANALYZE=true pnpm build

# 브라우저에서 자동으로 열림
# 큰 패키지를 식별하고 최적화
```

---

## 🎯 최적화 가이드

### Build Time 개선

**문제**: 빌드 시간 > 120초

**해결책**:
1. **Webpack 캐싱 활성화**
   ```javascript
   // next.config.js
   experimental: {
     turbotrace: {
       logLevel: 'error'
     }
   }
   ```

2. **병렬 빌드**
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" pnpm build
   ```

3. **불필요한 플러그인 제거**

### Bundle Size 개선

**문제**: 번들 크기 > 500KB

**해결책**:
1. **Dynamic Import**
   ```typescript
   const HeavyComponent = dynamic(() => import('./HeavyComponent'))
   ```

2. **Tree Shaking 확인**
   ```bash
   ANALYZE=true pnpm build
   # lodash → lodash-es
   # moment → date-fns
   ```

3. **Code Splitting**
   ```javascript
   // next.config.js
   webpack: (config) => {
     config.optimization.splitChunks.maxSize = 150000
   }
   ```

### Memory Usage 개선

**문제**: Out of Memory 에러

**해결책**:
1. **메모리 제한 증가**
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" pnpm build
   ```

2. **소스맵 비활성화** (프로덕션)
   ```javascript
   // next.config.js
   productionBrowserSourceMaps: false
   ```

3. **이미지 최적화**
   - next/image 사용
   - WebP/AVIF 포맷

---

## 📊 벤치마크 히스토리

### 베이스라인 (2025-12-21)

| 지표 | 값 | 상태 |
|------|-----|------|
| Build Time | ~90초 | ✅ 양호 |
| Bundle Size | ~250KB | ✅ 양호 |
| Memory | ~1.5GB | ✅ 양호 |

### 목표 (2026 Q1)

| 지표 | 현재 | 목표 | 개선율 |
|------|------|------|--------|
| Build Time | 90s | 60s | **33% ↓** |
| Bundle Size | 250KB | 200KB | **20% ↓** |
| Lighthouse | N/A | 90+ | **신규** |

---

## 🔍 트러블슈팅

### 빌드 실패 (Google Fonts 에러)

**증상**: `Failed to fetch font 'Inter'`

**원인**: 네트워크 불안정

**해결**: 로컬 폰트로 대체
```typescript
// src/app/layout.tsx
import localFont from 'next/font/local'

const inter = localFont({
  src: '../fonts/Inter-Variable.woff2',
  variable: '--font-inter'
})
```

### Bundle Size 측정 실패

**증상**: `BUNDLE_SIZE=0`

**원인**: .next 디렉토리 없음

**해결**: 빌드 먼저 실행
```bash
pnpm build && bash scripts/performance-monitor.sh
```

---

## 📚 참고 자료

- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)

---

## ✅ 체크리스트

- [x] 성능 모니터링 스크립트 구현
- [x] 자동 리포트 생성
- [ ] CI/CD 통합 (GitHub Actions)
- [ ] Lighthouse 감사 활성화
- [ ] 성능 회귀 방지 훅
- [ ] 히스토리 트래킹 시스템

---

**작성자**: Claude Sonnet 4.5
**최종 수정**: 2025-12-21
