# Quant 2.0 Risk Management Skill

> **2026 Trading AI Trend**: Data-driven dynamic risk calculation
> **Based on**: QuantConnect, TradingView, Institutional Trading Platforms

---

## Overview

HEPHAITOS의 **Quant 2.0 동적 리스크 관리 시스템**은 정적 하드코딩 방식에서 **심볼 변동성 기반 동적 계산**으로 진화했습니다.

### Key Features

1. **Volatility-Based Stop Loss** - 심볼별 변동성(ATR%) 기반 손절가 자동 계산
2. **User Risk Profile** - Conservative, Moderate, Aggressive, Very Aggressive
3. **Dynamic Take Profit** - 리스크/보상 비율(Risk/Reward Ratio) 자동 계산
4. **Legal Compliance Integration** - 법률 준수 검증 통합

---

## 🎯 Before & After

### ❌ Before (Hard-coded)

```typescript
// Old way: Fixed 5% for everyone
if (!risk.stopLoss) {
  risk.stopLoss = 5 // 고정값
}
```

### ✅ After (Quant 2.0: Dynamic)

```typescript
// New way: Volatility-based calculation
const dynamicRisk = riskProfiler.calculateDynamicRisk(
  symbol,        // BTC/USDT, ETH/USDT, etc.
  userProfile,   // { level: 'moderate' }
  timeframe      // '1d', '1w', '1M'
)

// BTC/USDT (low vol): stopLoss = 3.5% * 1.2 = 4.2%
// DOGE/USDT (high vol): stopLoss = 8.2% * 1.2 = 9.8%
```

---

## 📊 Risk Profiler API

### Import

```typescript
import { riskProfiler, type UserRiskProfile } from '@/lib/agent/risk-profiler'
```

### 1. Get Symbol Volatility

```typescript
const volatility = riskProfiler.getVolatility('BTC/USDT')

console.log(volatility)
// {
//   symbol: 'BTC/USDT',
//   dailyVolatility: 3.5,
//   weeklyVolatility: 8.2,
//   monthlyVolatility: 15.6
// }
```

### 2. Calculate Optimal Stop Loss

```typescript
const stopLoss = riskProfiler.calculateOptimalStopLoss(
  'BTC/USDT',
  { level: 'moderate' },
  '1d'
)

console.log(stopLoss) // 4.2% (3.5% daily vol * 1.2 moderate multiplier)
```

### 3. Get Complete Dynamic Risk Parameters

```typescript
const risk = riskProfiler.calculateDynamicRisk(
  'ETH/USDT',
  { level: 'conservative' },
  '1d'
)

console.log(risk)
// {
//   stopLoss: 4.2,      // Volatility-based
//   takeProfit: 12.6,   // 3:1 reward/risk (conservative)
//   positionSize: 10,   // Max 10% for conservative
//   maxLeverage: 1      // No leverage for conservative
// }
```

### 4. Validate Strategy Risk

```typescript
const validation = riskProfiler.validateStrategyRisk({
  symbol: 'SOL/USDT',
  stopLoss: 15,         // User-specified
  takeProfit: 10,       // Lower than stop loss!
  positionSize: 30,
  leverage: 10,
  userProfile: { level: 'moderate' }
})

console.log(validation)
// {
//   isValid: false,
//   errors: [
//     '손익비가 0.67:1로 손절보다 익절이 작습니다',
//     '레버리지 10x가 moderate의 최대값 2x를 초과합니다'
//   ],
//   warnings: ['포지션 크기가 20%를 초과합니다'],
//   suggestions: ['SOL/USDT의 변동성 기반 권장 손절가: 8.2%']
// }
```

---

## 🎚️ Risk Levels Configuration

| Level | Max Stop Loss | TP/SL Ratio | Max Position | Max Leverage |
|-------|---------------|-------------|--------------|--------------|
| **Conservative** | 3% | 3:1 | 10% | 1x |
| **Moderate** | 5% | 2.5:1 | 20% | 2x |
| **Aggressive** | 8% | 2:1 | 30% | 3x |
| **Very Aggressive** | 12% | 1.5:1 | 50% | 5x |

---

## 💡 Usage in Strategy Builder

### Constructor with User Profile

```typescript
import { createStrategyBuilder } from '@/lib/agent/strategy-builder'

// Create with user's risk profile
const builder = createStrategyBuilder({
  level: 'conservative',
  preferredStopLoss: 2.5  // Optional override
})

const result = builder.build(parsedIntent)
```

### Automatic Dynamic Calculation

When user doesn't specify stop loss:

```
User: "비트코인 RSI 30 이하면 매수해줘"
       (No stop loss specified)

System: [StrategyBuilder] Dynamic stop loss calculated for BTC/USDT: 4.2%
        (based on volatility)

Result: {
  stopLoss: 4.2%,
  takeProfit: 10.5%  (2.5:1 for moderate)
}
```

---

## 🔍 Volatility Database

Currently using **simulated volatility data**. In production, integrate with:

- **CoinGecko API** - Crypto volatility
- **Alpha Vantage** - Stock volatility
- **Custom calculation** - Historical price data (ATR, Standard Deviation)

### Example: Real-time Volatility Update

```typescript
// TODO: Replace static data with live API
async function updateVolatility(symbol: string) {
  const response = await fetch(`https://api.coingecko.com/api/v3/coins/${symbol}/market_chart`)
  const data = await response.json()

  // Calculate ATR from price data
  const atr = calculateATR(data.prices)

  return {
    symbol,
    dailyVolatility: atr,
    lastUpdated: new Date()
  }
}
```

---

## ✅ Legal Compliance Integration

Risk management automatically validates against legal requirements:

```typescript
// In buildRiskManagement()
const compliance = LegalCompliance.assessStrategyRisk({
  stopLoss: risk.stopLoss,
  leverage: 5,
  positionSize: 30,
  indicators: ['rsi']
})

if (compliance.warnings.length > 0) {
  console.warn('[StrategyBuilder] Risk warnings:', compliance.warnings)
  // ⚠️ 레버리지 5배 이상은 매우 위험합니다
  // ⚠️ 단일 지표 의존 - 2개 이상 사용을 권장합니다
}
```

---

## 🎓 Best Practices

### 1. Always Use Volatility-Based Defaults

```typescript
// ❌ Don't hard-code
const stopLoss = 5

// ✅ Do use dynamic calculation
const stopLoss = riskProfiler.calculateOptimalStopLoss(symbol, userProfile)
```

### 2. Respect User Risk Profile

```typescript
// User selected "conservative"
const userProfile = { level: 'conservative' }

// System automatically caps at 3% stop loss
const risk = riskProfiler.calculateDynamicRisk(symbol, userProfile)
```

### 3. Validate Before Execution

```typescript
const validation = riskProfiler.validateStrategyRisk({
  symbol,
  stopLoss,
  takeProfit,
  positionSize,
  userProfile
})

if (!validation.isValid) {
  // Show errors to user before strategy creation
  showErrors(validation.errors)
  return
}
```

---

## 📚 References

- **QuantConnect**: Institutional-grade risk management
- **TradingView**: Volatility-based position sizing
- **Kelly Criterion**: Optimal position sizing formula
- **Sharpe Ratio**: Risk-adjusted return measurement

---

**Last Updated**: 2025-12-15
**Version**: 1.0.0 (Quant 2.0)
