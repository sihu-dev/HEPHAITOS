# Legal Compliance System Skill

> **Critical for Trading Platforms**: Investment advice prohibition
> **Based on**: BUSINESS_CONSTITUTION.md, Financial regulations

---

## Overview

HEPHAITOS의 **Legal Compliance System**은 투자 조언 금지 법률을 준수하기 위해:

1. **Forbidden Pattern Filtering** - 투자 권유 표현 자동 차단
2. **Automatic Disclaimer** - 모든 응답에 면책조항 자동 추가
3. **Risk Assessment** - 전략 위험도 평가 및 경고
4. **Safe Response Templates** - 법률 준수 응답 템플릿

---

## ⚖️ Legal Requirements

### ❌ Forbidden (투자 조언 금지)

| Category | Examples | Why Forbidden |
|----------|----------|---------------|
| **권유형** | "사세요", "팔세요", "매수하세요" | 직접적 투자 권유 |
| **수익 보장** | "수익 보장", "확실한 수익", "100% 성공" | 허위 과대 광고 |
| **종목 추천** | "비트코인을 사세요" | 구체적 종목 권유 |
| **미래 예측** | "내일 오를 것", "곧 급등" | 가격 예측 단언 |

### ✅ Allowed (허용 표현)

| Category | Examples | Why Allowed |
|----------|----------|-------------|
| **가능성** | "~할 수 있습니다" | 설명형 |
| **과거 데이터** | "과거 성과는 미래를 보장하지 않습니다" | 법적 면책 |
| **교육 목적** | "교육 목적으로만 제공됩니다" | 서비스 범위 명시 |
| **참고용** | "다음 전략을 참고할 수 있습니다" | 정보 제공 |

---

## 🚨 Auto-Validation Flow

```
┌─────────────────────────────────────────────────────────────┐
│  User Input or AI Response                                  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ↓
    ┌────────────────────────────┐
    │  validateStrategyPrompt()  │
    └────────────┬───────────────┘
                 │
     ┌───────────┴───────────┐
     │  Check Forbidden      │
     │  Patterns (Regex)     │
     └───────────┬───────────┘
                 │
     ┌───────────┴───────────┐
     │  blockers.length > 0? │
     └───────────┬───────────┘
                 │
         ┌───────┴────────┐
         │                │
       YES              NO
         │                │
         ↓                ↓
    ❌ REJECT       ⚠️ Check Risk
    Return errors   Patterns
         │                │
         └────────┬───────┘
                  │
                  ↓
    ┌─────────────────────────┐
    │  Add Disclaimer         │
    │  (automatic)            │
    └─────────────────────────┘
```

---

## 📚 API Reference

### 1. Validate Input (Before AI Processing)

```typescript
import { LegalCompliance } from '@/lib/agent/legal-compliance'

const input = "비트코인 사세요! 수익 보장됩니다"

const validation = LegalCompliance.validateStrategyPrompt(input)

console.log(validation)
// {
//   safe: false,
//   warnings: [],
//   blockers: [
//     '투자 권유 표현은 법률상 금지됩니다: "사세요"',
//     '수익 보장 표현은 법률상 금지됩니다: "수익 보장"'
//   ]
// }

if (!validation.safe) {
  // Show error to user BEFORE creating strategy
  return { error: validation.blockers.join(', ') }
}
```

### 2. Add Disclaimer (After AI Response)

```typescript
const aiResponse = "BTC RSI가 30 이하일 때 매수 조건을 설정할 수 있습니다."

const withDisclaimer = LegalCompliance.addDisclaimer(aiResponse, {
  type: 'response',
  includeRiskWarning: false
})

console.log(withDisclaimer)
// BTC RSI가 30 이하일 때 매수 조건을 설정할 수 있습니다.
//
// ---
// ⚠️ **면책조항**: 본 서비스는 투자 교육 및 도구 제공 목적이며,
//    투자 조언이 아닙니다. 투자 결정은 본인 책임입니다.
```

### 3. Assess Strategy Risk

```typescript
const risk = LegalCompliance.assessStrategyRisk({
  stopLoss: undefined,      // Missing
  leverage: 10,             // Too high
  positionSize: 50,         // Over-concentrated
  indicators: ['rsi']       // Single indicator
})

console.log(risk)
// {
//   level: 'extreme',
//   factors: [
//     '손절가 미설정',
//     '높은 레버리지 (10x)',
//     '높은 포지션 크기 (>20%)',
//     '단일 지표 의존'
//   ],
//   warnings: [
//     '⚠️ 손절가를 설정하지 않으면 큰 손실이 발생할 수 있습니다',
//     '⚠️ 레버리지 5배 이상은 매우 위험합니다',
//     '⚠️ 포트폴리오의 20% 이상을 단일 종목에 투자하면 위험합니다',
//     '⚠️ 단일 지표에만 의존하면 신뢰도가 낮습니다'
//   ]
// }
```

---

## 🎯 Forbidden Patterns (Regex)

### Implementation

```typescript
const FORBIDDEN_PATTERNS = [
  // 수익 보장
  { pattern: /수익.*보장/gi, message: '수익 보장 표현은 법률상 금지됩니다' },
  { pattern: /확실.*수익/gi, message: '확실한 수익 표현은 법률상 금지됩니다' },
  { pattern: /100%.*성공/gi, message: '100% 성공 표현은 법률상 금지됩니다' },
  { pattern: /반드시.*오른다|반드시.*내린다/gi, message: '가격 예측 단언은 법률상 금지됩니다' },

  // 권유형
  { pattern: /(사세요|팔세요|매수하세요|매도하세요)/gi, message: '투자 권유 표현은 법률상 금지됩니다' },
  { pattern: /추천.*종목/gi, message: '종목 추천은 법률상 금지됩니다' },
  { pattern: /지금.*사야/gi, message: '매매 타이밍 권유는 법률상 금지됩니다' },

  // 미래 예측
  { pattern: /내일.*오를|다음주.*상승/gi, message: '미래 가격 예측은 법률상 금지됩니다' },
  { pattern: /곧.*급등|곧.*폭락/gi, message: '단기 가격 예측은 법률상 금지됩니다' },
]
```

### Testing

```typescript
// ❌ Blocked
validateStrategyPrompt("비트코인 사세요")           // → BLOCKED
validateStrategyPrompt("수익 보장됩니다")           // → BLOCKED
validateStrategyPrompt("내일 급등할 것입니다")       // → BLOCKED

// ✅ Allowed
validateStrategyPrompt("비트코인 매수 조건을 설정할 수 있습니다")  // → OK
validateStrategyPrompt("과거 성과는 미래를 보장하지 않습니다")    // → OK
validateStrategyPrompt("교육 목적으로만 제공됩니다")             // → OK
```

---

## 📝 Disclaimer Types

### 1. Response Disclaimer (Default)

```typescript
LegalCompliance.addDisclaimer(content, { type: 'response' })

// Output:
// ---
// ⚠️ **면책조항**: 본 서비스는 투자 교육 및 도구 제공 목적이며,
//    투자 조언이 아닙니다. 투자 결정은 본인 책임입니다.
```

### 2. Strategy Disclaimer

```typescript
LegalCompliance.addDisclaimer(content, { type: 'strategy' })

// Output:
// ---
// ⚠️ **투자 경고**
// - 본 전략은 교육 목적으로만 제공됩니다
// - 과거 성과는 미래 수익을 보장하지 않습니다
// - 투자 손실에 대한 책임은 투자자 본인에게 있습니다
// - 투자 결정 전 전문가와 상담하시기 바랍니다
```

### 3. Report Disclaimer

```typescript
LegalCompliance.addDisclaimer(content, { type: 'report' })

// Output:
// ---
// **리포트 면책조항**
// 본 리포트는 투자 교육 및 정보 제공 목적으로만 작성되었으며,
// 특정 종목의 매수/매도를 권유하는 것이 아닙니다.
```

### 4. UI Disclaimer (Short)

```typescript
LegalCompliance.addDisclaimer(content, { type: 'ui' })

// Output:
// 본 서비스는 투자 교육 및 도구 제공 목적이며, 투자 조언이 아닙니다.
```

---

## 🎚️ Risk Assessment Levels

| Level | Risk Score | Criteria |
|-------|------------|----------|
| **Low** | 0-19 | Stop loss set, reasonable position size, multiple indicators |
| **Medium** | 20-39 | Some warnings but not critical |
| **High** | 40-59 | High stop loss (>10%) OR high leverage (>5x) |
| **Extreme** | 60+ | No stop loss OR very high leverage (>10x) OR >50% position |

### Risk Scoring

```typescript
let riskScore = 0

// No stop loss: +30
if (!stopLoss) riskScore += 30

// High stop loss (>10%): +20
if (stopLoss > 10) riskScore += 20

// High leverage (>5x): +25
if (leverage && leverage > 5) riskScore += 25

// High position (>20%): +20
if (positionSize > 20) riskScore += 20

// Single indicator: +15
if (indicators.length === 1) riskScore += 15
```

---

## 🚀 Integration Points

### 1. AI Response Generator

```typescript
// In prompts.ts
export const SYSTEM_PROMPT_RESPONSE_GENERATOR = `
## ⚠️ 법률 준수 원칙 (절대 위반 금지)

**투자 조언 절대 금지:**
- ❌ "~하세요", "~사세요", "~팔세요"
- ❌ "수익 보장", "확실한 수익"
...
`
```

### 2. Strategy Builder

```typescript
// In strategy-builder.ts
private buildRiskManagement(entities, symbol) {
  const risk = { ... }

  // Validate with legal compliance
  const compliance = LegalCompliance.assessStrategyRisk({
    stopLoss: risk.stopLoss,
    leverage: 5,
    positionSize: 30,
    indicators: ['rsi']
  })

  if (compliance.warnings.length > 0) {
    console.warn('[StrategyBuilder] Risk warnings:', compliance.warnings)
  }

  return risk
}
```

### 3. Frontend Components

```tsx
// In CTASection.tsx, PricingSection.tsx, etc.
<div className="p-4 border border-amber-500/20 bg-amber-500/5 rounded-lg">
  <div className="flex items-start gap-3">
    <ExclamationTriangleIcon className="w-4 h-4 text-amber-400" />
    <p className="text-[10px] text-zinc-500">
      <span className="text-amber-400">{t('common.important')}:</span>
      {t('cta.disclaimer')}
    </p>
  </div>
</div>
```

---

## ✅ Best Practices

### 1. Validate BEFORE AI Processing

```typescript
// ❌ Don't process then validate
const response = await generateAIResponse(userInput)
validateStrategyPrompt(response)  // Too late!

// ✅ Do validate input first
const validation = validateStrategyPrompt(userInput)
if (!validation.safe) {
  return { error: validation.blockers }
}
const response = await generateAIResponse(userInput)
```

### 2. Always Add Disclaimer

```typescript
// ❌ Don't return raw AI response
return aiResponse

// ✅ Do add disclaimer
return LegalCompliance.addDisclaimer(aiResponse, { type: 'response' })
```

### 3. Show Risk Warnings

```typescript
const risk = LegalCompliance.assessStrategyRisk(strategy)

if (risk.level === 'extreme' || risk.level === 'high') {
  // Show prominent warning UI
  showWarningModal({
    title: '⚠️ 고위험 전략',
    warnings: risk.warnings,
    requireConfirmation: true
  })
}
```

---

## 🎓 References

- **BUSINESS_CONSTITUTION.md**: HEPHAITOS legal framework
- **Financial Investment Services and Capital Markets Act**: Korean investment law
- **FINRA**: US financial regulations
- **Constitutional AI**: Anthropic's safety approach

---

**Last Updated**: 2025-12-15
**Version**: 1.0.0 (Legal Compliance)
