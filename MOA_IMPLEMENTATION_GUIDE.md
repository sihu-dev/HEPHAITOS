# 🤖 MoA (Mixture-of-Agents) 구현 가이드

> **완료일**: 2025-12-16
> **버전**: 1.0.0
> **상태**: ✅ 구현 완료 (PoC + Full Engine)

---

## 📊 개요

**Mixture-of-Agents (MoA)**는 여러 AI 모델이 협업하여 더 나은 결과를 생성하는 아키텍처입니다.

### 핵심 아이디어
- **Collaborativeness**: LLM들은 다른 모델의 출력을 보면 더 나은 답변을 생성
- **논문**: arXiv:2406.04692 (Together AI, 2024년 6월)
- **벤치마크**: AlpacaEval 2.0에서 65.1% (GPT-4의 57.5% 대비 13% 향상)

### HEPHAITOS 적용 목표
1. **전략 품질 향상**: Sharpe Ratio +12% 목표
2. **차별화 요소**: "4명의 전문가 AI가 전략 검토"
3. **프리미엄 가격**: 3-Tier 크레딧 시스템 (5/10/20 크레딧)

---

## 🏗️ 아키텍처

### 3-Layer Structure

```
┌─────────────────────────────────────────────────┐
│  Layer 3: Safety Net Validator                  │
│  ✅ 필수 요소 체크 (진입/청산/리스크)              │
│  ✅ 투자 조언 금지 표현 체크                       │
│  ✅ 면책조항 검증                                 │
└─────────────────────────────────────────────────┘
                      ▲
┌─────────────────────────────────────────────────┐
│  Layer 2: AI Aggregator (Claude Sonnet)         │
│  ✨ 4명의 의견을 종합하여 최종 전략 생성           │
│  ✨ 충돌 해결 (보수적 선택 우선)                   │
│  ✨ 면책조항 자동 추가                            │
└─────────────────────────────────────────────────┘
                      ▲
┌──────────┬──────────┬──────────┬──────────────┐
│ 📈 기술적 │ 🛡️ 리스크 │ 🔍 패턴  │ 💼 펀더멘털 │
│ 분석가   │ 관리자   │ 인식     │ 분석가       │
│          │          │          │              │
│ Technical│ Risk     │ Pattern  │ Fundamental  │
│ Analyst  │ Manager  │ Expert   │ Analyst      │
└──────────┴──────────┴──────────┴──────────────┘
          Layer 1: 4 Perspectives (병렬 실행)
```

---

## 💎 3-Tier 크레딧 시스템

| Tier | 크레딧 | 가격 | 전문가 | 특징 |
|------|--------|------|--------|------|
| **초안** | 5 | ₩355 | 1명 | 기술적 분석만, 빠른 검증 |
| **정제** | 10 | ₩710 | 2명 | 기술 + 리스크, 균형잡힌 전략 |
| **종합** | 20 | ₩1,420 | 4명 | 전체 전문가 + 이중 검증 |

### Freemium Hook
- 신규 가입 시 50 크레딧 지급
- 초안(5 크레딧) → 10회 무료 체험 가능
- 만족도 높으면 종합(20 크레딧)으로 업그레이드 유도

---

## 📁 파일 구조

```
HEPHAITOS/
├── src/
│   ├── lib/
│   │   └── moa/
│   │       ├── proof-of-concept.ts    # ✅ PoC (2-Persona)
│   │       ├── engine.ts               # ✅ Full MoA Engine (4-Persona)
│   │       └── together-ai.ts          # ✅ Together AI Integration
│   ├── components/
│   │   └── strategy-builder/
│   │       └── MoAStrategyGenerator.tsx # ✅ UI Component
│   └── app/
│       └── api/
│           └── ai/
│               └── moa-strategy/
│                   └── route.ts         # ✅ API Route
├── scripts/
│   └── test-moa.js                      # ✅ Test Script
└── MOA_IMPLEMENTATION_GUIDE.md          # 이 파일
```

---

## 🚀 빠른 시작

### 1. 환경변수 설정

`.env.local`:
```env
# Claude API (필수)
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Together AI (선택 - 비용 최적화)
NEXT_PUBLIC_USE_TOGETHER_AI=false
TOGETHER_API_KEY=
```

### 2. PoC 테스트 (2-Persona)

```bash
npm run test:moa:poc
```

**예상 출력**:
```
====================================================================
  TEST 1: PoC (2-Persona MoA)
====================================================================

📈 [Layer 1] Generating perspectives...
✅ Layer 1 완료
  - Technical Analyst: 412 tokens
  - Risk Manager: 389 tokens

✨ [Layer 2] Aggregating...
✅ Layer 2 완료

====================================================================
  RESULT: PoC Strategy
====================================================================
[전략 내용...]

====================================================================
  METRICS
====================================================================
  Total Latency: 12.34s
  Total Tokens: 1,523
  Estimated Cost: $0.0137
  Perspectives: 2
```

### 3. 비교 테스트 (MoA vs Baseline)

```bash
npm run test:moa:compare
```

---

## 🎨 UI 사용법

### 컴포넌트 Import

```tsx
import { MoAStrategyGenerator } from '@/components/strategy-builder/MoAStrategyGenerator';

export default function StrategyPage() {
  return (
    <div className="container mx-auto p-6">
      <MoAStrategyGenerator />
    </div>
  );
}
```

### 주요 기능

1. **3-Tier 선택**: 초안/정제/종합 중 선택
2. **Progressive Loading**: 각 Perspective 순차 표시
3. **실시간 신뢰도 표시**: 각 전문가의 Confidence Score
4. **검증 상태**: Safety Net Validator 결과 표시
5. **비용/지연시간 추적**: 실시간 메트릭 표시

---

## 🔧 API 사용법

### Endpoint

```
POST /api/ai/moa-strategy
```

### Request

```json
{
  "prompt": "RSI와 MACD를 활용한 스윙 트레이딩 전략",
  "tier": "refined"
}
```

### Response

```json
{
  "tier": "refined",
  "perspectives": [
    {
      "perspectiveId": "technical",
      "name": "기술적 분석가",
      "icon": "📈",
      "output": "...",
      "tokensUsed": 412,
      "latency": 3245,
      "confidence": 85,
      "model": "claude"
    },
    {
      "perspectiveId": "risk",
      "name": "리스크 관리자",
      "icon": "🛡️",
      "output": "...",
      "tokensUsed": 389,
      "latency": 3102,
      "confidence": 92,
      "model": "claude"
    }
  ],
  "aggregated": "# 전략 이름\n...",
  "validated": true,
  "validationIssues": [],
  "totalCost": 0.0312,
  "totalLatency": 12450,
  "metadata": {
    "requestId": "moa_1234567890_abc123",
    "timestamp": "2025-12-16T12:34:56.789Z",
    "userPrompt": "RSI와 MACD를 활용한 스윙 트레이딩 전략"
  }
}
```

---

## 💰 비용 분석

### Claude Only (현재 기본값)

| Tier | Perspectives | Tokens | Cost | Credits |
|------|--------------|--------|------|---------|
| 초안 | 1 | ~800 | $0.0072 | 5 |
| 정제 | 2 | ~1,500 | $0.0135 | 10 |
| 종합 | 4 | ~3,000 | $0.0270 | 20 |

### Together AI (비용 최적화)

```env
NEXT_PUBLIC_USE_TOGETHER_AI=true
TOGETHER_API_KEY=your_together_api_key
```

| Layer | Model | Cost per 1M tokens |
|-------|-------|-------------------|
| Layer 1 (4 Perspectives) | Llama 3.1 70B / Mixtral / Qwen | $0.50 - $0.88 |
| Layer 2 (Aggregation) | Claude Sonnet | $9.00 |

**예상 절감**:
- Claude Only: $0.027 / 종합 전략
- Together AI: $0.010 (Layer 1) + $0.015 (Layer 2) = $0.025 → **7% 절감**

---

## 🧪 테스트 가이드

### 1. PoC 테스트 (2-Persona)

```bash
npm run test:moa:poc
```

**확인사항**:
- [ ] 기술적 분석가 출력 (RSI, MACD 언급)
- [ ] 리스크 관리자 출력 (손절, 포지션 사이징)
- [ ] 최종 종합 전략 (면책조항 포함)
- [ ] 비용 < $0.02
- [ ] 지연시간 < 20초

### 2. Baseline 비교

```bash
npm run test:moa:compare
```

**비교 지표**:
- 전략 구체성 (숫자/조건 개수)
- 리스크 관리 포함 여부
- 생성 시간 차이

### 3. 프로덕션 테스트

```bash
curl -X POST http://localhost:3000/api/ai/moa-strategy \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "RSI 과매수/과매도 기반 데이 트레이딩 전략",
    "tier": "refined"
  }'
```

---

## 📈 성능 지표

### 목표 (Beta Testing 종료 시)

| 지표 | 현재 | MoA 목표 | 개선도 |
|------|------|----------|--------|
| **Sharpe Ratio** | 1.2 | 1.34 | +12% |
| **백테스트 통과율** | 60% | 72% | +12%p |
| **사용자 만족도 (NPS)** | 55 | 70+ | +15p |
| **전략 채택률** | 30% | 42% | +40% |
| **API 지연시간** | 8s | 15s | +88% |

### 모니터링

```typescript
// 각 API 호출마다 로그
console.log('[MoA API] Strategy generated:', {
  tier,
  perspectives: result.perspectives.length,
  validated: result.validated,
  cost: result.totalCost,
  latency: result.totalLatency,
});
```

---

## ⚠️ Safety Net Validator

### 검증 항목

1. **필수 요소 체크**
   - [ ] 진입 조건
   - [ ] Take Profit
   - [ ] Stop Loss
   - [ ] 리스크 관리

2. **투자 조언 금지 표현**
   - ❌ "수익 보장", "확실한 수익"
   - ❌ "~하세요", "추천합니다"
   - ❌ "사세요", "파세요"

3. **면책조항**
   - ✅ "교육 목적", "투자 조언이 아닙니다"

### 검증 실패 시

```json
{
  "validated": false,
  "validationIssues": [
    "필수 요소 누락: Stop Loss",
    "금지 표현 포함: \"추천합니다\"",
    "면책조항 누락"
  ]
}
```

→ UI에서 경고 표시, 사용자에게 수정 요청

---

## 🔄 Together AI 통합 (비용 최적화)

### 1. API 키 발급

1. https://api.together.xyz/ 접속
2. 회원가입 → API Keys
3. Create New Key
4. `.env.local`에 추가

### 2. 활성화

```env
NEXT_PUBLIC_USE_TOGETHER_AI=true
TOGETHER_API_KEY=your_together_api_key
```

### 3. 모델 선택

`src/lib/moa/engine.ts`:
```typescript
{
  id: 'technical',
  model: USE_TOGETHER_AI ? 'together/llama-3.1-70b' : 'claude',
  costPerCall: USE_TOGETHER_AI ? 0.0008 : 0.018,
}
```

### 4. Health Check

```typescript
import { checkTogetherAIHealth } from '@/lib/moa/together-ai';

const isHealthy = await checkTogetherAIHealth();
console.log('Together AI 상태:', isHealthy ? '✅' : '❌');
```

---

## 🚨 트러블슈팅

### Q1: API 호출 실패

**에러**: `ANTHROPIC_API_KEY가 설정되지 않았습니다`

**해결**:
```bash
# .env.local 파일 확인
cat .env.local | grep ANTHROPIC_API_KEY

# 없으면 추가
echo "ANTHROPIC_API_KEY=sk-ant-api03-xxx" >> .env.local
```

### Q2: Together AI 연결 오류

**에러**: `Together AI API 호출 실패: 401`

**해결**:
1. API 키 유효성 확인
2. `NEXT_PUBLIC_USE_TOGETHER_AI=false`로 Claude 사용
3. Health check 실행: `npm run test:together-health`

### Q3: 지연시간 너무 김

**현상**: 종합 전략 생성 시 30초 이상

**원인**: 4-Perspective 순차 실행

**해결**:
- `engine.ts`에서 `Promise.all()` 병렬 실행 확인
- `refined` tier 사용 (2-Persona로 축소)

### Q4: 검증 실패 반복

**현상**: `validationIssues` 계속 발생

**원인**: Aggregation Prompt 개선 필요

**해결**:
```typescript
// engine.ts - aggregateAndRefine() 함수의 systemPrompt 수정
"반드시 다음을 포함하세요:
1. 진입 조건 (구체적 지표)
2. Take Profit (% 또는 가격)
3. Stop Loss (% 또는 가격)
4. 리스크 관리 (포지션 크기)
5. 면책조항 (교육 목적)"
```

---

## 📊 다음 단계 (8주 로드맵)

### Week 1-2: PoC 검증 ✅ **완료**
- [x] 2-Persona 구현
- [x] Baseline 비교 테스트
- [x] 비용/지연시간 측정

### Week 3-4: 4-Persona MVP
- [ ] Together AI 통합 테스트
- [ ] UI 컴포넌트 통합
- [ ] 크레딧 시스템 연동
- [ ] 5개 샘플 전략 백테스팅

### Week 5-6: Beta Testing
- [ ] 내부 테스터 20명 모집
- [ ] A/B 테스트 (기존 AI vs MoA)
- [ ] Sharpe Ratio 개선도 측정
- [ ] NPS 조사

### Week 7-8: Production Rollout
- [ ] Feature flag: 10% → 50% → 100%
- [ ] 모니터링 대시보드 구축
- [ ] Kill switch 준비
- [ ] 성공 기준 달성 확인

---

## 🎯 성공 기준 (Go/No-Go)

### Beta 종료 시 체크리스트

- [ ] **Sharpe Ratio 10% 이상 개선** (필수)
- [ ] **NPS 60 이상** (필수)
- [ ] **API 비용 < 크레딧 수익 증가** (필수)
- [ ] **시스템 안정성 99.5% uptime**
- [ ] **전략 채택률 35% 이상**

기준 미달 시 → 즉시 중단 및 원인 분석

---

## 📚 참고 문서

### 학술 자료
- [arXiv:2406.04692](https://arxiv.org/abs/2406.04692) - Mixture-of-Agents Enhances Large Language Model Capabilities

### 블로그 & 가이드
- [Genspark MoA Implementation](https://mainfunc.ai/blog/genspark_mixture_of_agents)
- [Together AI API Docs](https://docs.together.ai/)
- [Claude 4 API Reference](https://docs.anthropic.com/claude/reference)

### 내부 문서
- `BUSINESS_CONSTITUTION.md` - 투자 조언 금지 원칙
- `DESIGN_SYSTEM.md` - UI/UX 가이드라인
- `API_KEY_SETUP_GUIDE.md` - API 키 발급 방법

---

## 🆘 지원

### 이슈 발생 시

1. **로그 확인**:
   ```bash
   # 개발 서버 로그
   npm run dev

   # 테스트 로그
   npm run test:moa:poc
   ```

2. **검증 상태 확인**:
   ```typescript
   const result = await fetch('/api/ai/moa-strategy', {...});
   console.log('Validated:', result.validated);
   console.log('Issues:', result.validationIssues);
   ```

3. **비용 추적**:
   ```typescript
   console.log('Total Cost:', result.totalCost);
   console.log('Per Perspective:', result.perspectives.map(p => p.tokensUsed));
   ```

---

**상태**: ✅ MoA 시스템 구현 완료
**다음**: PoC 백테스팅 → 성과 검증 → Beta Testing

**Made with 🤖 by HEPHAITOS Team**
