---
name: 10h-automation
description: HEPHAITOS 10시간 개발 워크플로우 자동화
version: 1.0.0
created: 2025-12-15
---

# 10시간 개발 워크플로우 자동화

HEPHAITOS 프로젝트의 전체 개발 사이클을 10시간 단위로 자동화합니다.

## 🎯 워크플로우 개요

```
Hour 0-2: 기획 & 설계
Hour 2-6: 핵심 기능 개발
Hour 6-8: 테스트 & 품질 검증
Hour 8-9: 법률 검토 & 보안
Hour 9-10: 배포 준비 & 문서화
```

---

## ⏱️ Hour 0-2: 기획 & 설계

### 2.1 비즈니스 요구사항 확인 (30분)

```bash
# BUSINESS_CONSTITUTION.md 핵심 각인
cat BUSINESS_CONSTITUTION.md | grep "핵심 각인" -A 10

# Copy-Learn-Build 확인
echo "✅ COPY - 셀럽 포트폴리오 미러링"
echo "✅ LEARN - AI + 멘토 코칭"
echo "✅ BUILD - 자연어 전략 생성"
```

**체크리스트:**
- [ ] 투자 조언 금지 원칙 확인
- [ ] 면책조항 필수 표시 확인
- [ ] Copy-Learn-Build 모델 적용 확인

### 2.2 기술 아키텍처 설계 (60분)

```bash
# Agent: trading-architect 호출
# "UnifiedBroker API 설계를 검토해줘"
# "백테스팅 엔진 아키텍처를 확인해줘"
```

**작업 항목:**
1. **UnifiedBroker 인터페이스 검토**
   - `src/lib/broker/UnifiedBroker.ts`
   - KIS, Kiwoom, Alpaca 어댑터 확인

2. **데이터베이스 스키마 검토**
   - Supabase 테이블 구조
   - RLS 정책 확인

3. **API 엔드포인트 설계**
   - `/api/strategies` - 전략 CRUD
   - `/api/backtest` - 백테스팅 실행
   - `/api/broker` - 브로커 연동

### 2.3 UI/UX 디자인 확인 (30분)

```bash
# Skill: design-system 참조
# "디자인 시스템을 확인해줘"
```

**확인 사항:**
- [ ] Glass Morphism 적용
- [ ] Primary 컬러 (#5E6AD2) 최소 사용
- [ ] 수익/손실 색상 구분
- [ ] 반응형 디자인

---

## ⏱️ Hour 2-6: 핵심 기능 개발 (4시간)

### 6.1 COPY - 셀럽 포트폴리오 미러링 (90분)

```typescript
// src/lib/mirroring/celebrity-portfolio.ts
export async function mirrorPortfolio(
  celebrityId: string,
  amount: number
) {
  // 1. 셀럽 포트폴리오 조회 (Unusual Whales API)
  const portfolio = await fetchCelebrityPortfolio(celebrityId);

  // 2. 비율 계산
  const orders = portfolio.holdings.map(holding => ({
    symbol: holding.symbol,
    quantity: calculateQuantity(amount, holding.weight),
  }));

  // 3. 주문 생성 (실행은 사용자 확인 후)
  return { portfolio, orders };
}
```

**테스트:**
```bash
npm run test src/lib/mirroring/*.test.ts
```

### 6.2 LEARN - AI 거래 분석 (60분)

```typescript
// src/lib/ai/trade-explainer.ts
import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

export async function explainTrade(trade: Trade) {
  const { object: analysis } = await generateObject({
    model: anthropic('claude-sonnet-4'),
    schema: tradeAnalysisSchema,
    prompt: `
      ${trade.celebrity}님이 ${trade.symbol}을 ${trade.action}한 이유를
      초보자도 이해할 수 있게 설명해주세요.

      ※ 투자 조언이 아닌 교육 목적으로만 설명
    `,
  });

  return analysis;
}
```

**테스트:**
```bash
npm run test src/lib/ai/*.test.ts
```

### 6.3 BUILD - AI 전략 생성 (90분)

```bash
# Command: /strategy 사용
/strategy 이동평균선 20일선이 50일선을 상향 돌파하면 매수
```

```typescript
// src/lib/agent/strategy-generator.ts
export async function generateStrategy(userInput: string) {
  const { object: strategy } = await generateObject({
    model: anthropic('claude-sonnet-4.5'),
    schema: strategySchema,
    prompt: `
      자연어 입력을 트레이딩 전략으로 변환:
      "${userInput}"

      출력 형식:
      - 전략 이름
      - 진입 조건
      - 청산 조건
      - 리스크 관리
    `,
  });

  return strategy;
}
```

**테스트:**
```bash
npm run test src/lib/agent/*.test.ts
```

---

## ⏱️ Hour 6-8: 테스트 & 품질 검증 (2시간)

### 8.1 단위 테스트 실행 (30분)

```bash
# Vitest 실행
npm run test

# 커버리지 확인
npm run test:coverage

# 목표: 80% 이상
```

**Critical Paths 테스트:**
- [ ] UnifiedBroker 연결
- [ ] 전략 생성
- [ ] 백테스팅 엔진
- [ ] AI 분석

### 8.2 통합 테스트 (30분)

```bash
# E2E 테스트 (Playwright)
npm run test:e2e

# 주요 플로우:
# 1. 회원가입 → 로그인
# 2. 셀럽 포트폴리오 조회
# 3. 전략 생성
# 4. 백테스팅
```

### 8.3 성능 테스트 (30분)

```typescript
// src/__tests__/performance/backtest-performance.test.ts
describe('백테스팅 성능', () => {
  it('1년 데이터 백테스팅 < 5초', async () => {
    const start = Date.now();
    await runBacktest({ ... });
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(5000); // 5초 이내
  });
});
```

### 8.4 코드 품질 검사 (30분)

```bash
# ESLint
npm run lint

# TypeScript 타입 체크
npx tsc --noEmit

# Prettier 포맷팅
npm run format
```

---

## ⏱️ Hour 8-9: 법률 검토 & 보안 (1시간)

### 9.1 법률 준수 검토 (30분)

```bash
# Command: /legal 실행
/legal src/components
/legal src/lib

# Agent: legal-guardian 자동 활성화
```

**검토 항목:**
- [ ] 투자 조언 표현 없음
- [ ] 면책조항 모든 화면에 표시
- [ ] 금지 표현 사용 안 함
- [ ] 허용 표현만 사용

**자동 수정:**
```bash
/legal --fix src/
```

### 9.2 보안 검사 (30분)

```bash
# 1. 의존성 취약점 스캔
npm audit

# 2. 환경 변수 검증
grep -r "process.env" src/ | grep -v ".env"

# 3. API 키 하드코딩 확인
grep -r "sk-" src/
grep -r "Bearer " src/

# 4. SQL Injection 방지
# → Supabase RLS 정책 확인
```

**체크리스트:**
- [ ] 의존성 취약점 0건
- [ ] API 키 하드코딩 없음
- [ ] 환경 변수 암호화
- [ ] HTTPS 통신만 사용

---

## ⏱️ Hour 9-10: 배포 준비 & 문서화 (1시간)

### 10.1 빌드 & 배포 테스트 (30분)

```bash
# 1. Next.js 빌드
npm run build

# 2. 빌드 결과 확인
ls -lh .next/static

# 3. Vercel 배포 (Preview)
vercel --prod=false

# 4. Lighthouse 성능 측정
npx lighthouse https://preview-url.vercel.app --view
```

**목표 점수:**
- Performance: 90+
- Accessibility: 100
- Best Practices: 90+
- SEO: 90+

### 10.2 문서화 (30분)

```bash
# 1. API 문서 생성
npx typedoc src/

# 2. README 업데이트
echo "## 최신 업데이트" >> README.md

# 3. CHANGELOG 생성
npx conventional-changelog -p angular -i CHANGELOG.md -s
```

**문서 체크리스트:**
- [ ] README.md 업데이트
- [ ] API 문서 최신화
- [ ] CHANGELOG.md 생성
- [ ] 면책조항 포함

---

## 🤖 자동화 스크립트

### 전체 워크플로우 자동 실행

```bash
#!/bin/bash
# scripts/10h-workflow.sh

echo "🚀 HEPHAITOS 10시간 워크플로우 시작"
echo "========================================"

# Hour 0-2: 기획 & 설계
echo "\n⏰ Hour 0-2: 기획 & 설계"
cat BUSINESS_CONSTITUTION.md | grep "핵심 각인" -A 5
echo "✅ 비즈니스 요구사항 확인 완료"

# Hour 2-6: 핵심 기능 개발
echo "\n⏰ Hour 2-6: 핵심 기능 개발"
npm run test -- src/lib/mirroring
npm run test -- src/lib/ai
npm run test -- src/lib/agent
echo "✅ 핵심 기능 테스트 완료"

# Hour 6-8: 테스트 & 품질 검증
echo "\n⏰ Hour 6-8: 테스트 & 품질 검증"
npm run test:coverage
npm run lint
npx tsc --noEmit
echo "✅ 품질 검증 완료"

# Hour 8-9: 법률 검토 & 보안
echo "\n⏰ Hour 8-9: 법률 검토 & 보안"
# /legal src/ (수동 실행 필요)
npm audit
echo "✅ 보안 검사 완료"

# Hour 9-10: 배포 준비 & 문서화
echo "\n⏰ Hour 9-10: 배포 준비"
npm run build
echo "✅ 빌드 완료"

echo "\n🎉 10시간 워크플로우 완료!"
echo "========================================"
```

### CI/CD 파이프라인 (GitHub Actions)

```yaml
# .github/workflows/10h-automation.yml
name: 10h Workflow Automation

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  workflow:
    runs-on: ubuntu-latest
    timeout-minutes: 600  # 10시간

    steps:
      # Hour 0-2: 기획 & 설계
      - name: 📋 Checkout
        uses: actions/checkout@v4

      - name: 🔍 Business Requirements Check
        run: |
          grep "투자 조언 절대 금지" BUSINESS_CONSTITUTION.md
          grep "면책조항 필수" BUSINESS_CONSTITUTION.md

      # Hour 2-6: 핵심 기능 개발
      - name: 📦 Install Dependencies
        run: npm ci

      - name: 🧪 Unit Tests
        run: npm run test:coverage

      # Hour 6-8: 테스트 & 품질 검증
      - name: 🎯 E2E Tests
        run: npm run test:e2e

      - name: 🔍 Code Quality
        run: |
          npm run lint
          npx tsc --noEmit

      # Hour 8-9: 법률 검토 & 보안
      - name: 🔒 Security Audit
        run: npm audit --audit-level=moderate

      # Hour 9-10: 배포 준비
      - name: 🏗️ Build
        run: npm run build

      - name: 🚀 Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## 📊 모니터링 & 알림

### Sentry 에러 모니터링

```typescript
// src/lib/monitoring/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

### Slack 알림

```bash
# 워크플로우 완료 알림
curl -X POST $SLACK_WEBHOOK_URL \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "🎉 HEPHAITOS 10시간 워크플로우 완료!",
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "*배포 성공*\nURL: https://hephaitos.vercel.app"
        }
      }
    ]
  }'
```

---

## ✅ 체크리스트 (매 사이클)

### Before Start
- [ ] BUSINESS_CONSTITUTION.md 확인
- [ ] Copy-Learn-Build 각인
- [ ] 법률 준수 원칙 확인

### During Development
- [ ] 투자 조언 표현 사용 안 함
- [ ] 면책조항 추가
- [ ] 타입 안전성 유지
- [ ] 테스트 작성

### Before Deploy
- [ ] 모든 테스트 통과
- [ ] 법률 검토 완료
- [ ] 보안 검사 완료
- [ ] 빌드 성공

---

**자동화의 핵심:**
- 반복 작업 최소화
- 품질 기준 자동 검증
- 법률 준수 자동 체크
- 빠른 피드백 사이클
