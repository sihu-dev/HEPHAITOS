# Backtest Module (2026 Enhanced)

> **기관급 성능 메트릭 + Legal Compliance 통합**

---

## 📚 Overview

HEPHAITOS Backtest Module은 2026년 Quant 2.0 트렌드를 반영한 프로덕션급 백테스팅 엔진입니다.

### 주요 기능
- ✅ **Strategy Parser**: 자연어 → 전략 자동 파싱
- ✅ **Advanced Metrics**: Kelly, VAR, Ulcer Index 등 9개 고급 메트릭
- ✅ **Legal Compliance**: EXTREME 위험 전략 자동 차단
- ✅ **Structured Logging**: 백테스트 진행 상황 실시간 로깅
- ✅ **Risk Profiler 통합**: 변동성 기반 동적 리스크 적용

---

## 🚀 Quick Start

### 1. 기본 백테스트

```typescript
import { createBacktestEngine } from '@/lib/backtest'

const engine = createBacktestEngine({
  strategy: myStrategy,
  symbol: 'BTC/USDT',
  startDate: Date.UTC(2024, 0, 1),
  endDate: Date.UTC(2024, 11, 31),
  initialCapital: 100000,
  commission: 0.001, // 0.1%
  slippage: 0.0005   // 0.05%
})

// 데이터 로드
engine.setData(ohlcvData)

// 진행 상황 모니터링
engine.onProgress((progress) => {
  console.log(`${progress.percent.toFixed(1)}% complete`)
})

// 실행
const result = await engine.run()

console.log(result.metrics)
// {
//   totalReturn: 15234.56,
//   totalReturnPercent: 15.23,
//   winRate: 62.5,
//   sharpeRatio: 1.85,
//   maxDrawdownPercent: 12.3,
//   ...
// }

console.log(result.advancedMetrics)
// {
//   kellyCriterion: 23.5,      // Optimal position size
//   valueAtRisk95: -5.2,       // VAR 95%
//   ulcerIndex: 8.3,           // Investor pain index
//   tradeQualityScore: 78,     // 0-100 quality score
//   ...
// }
```

### 2. Risk Profile 통합 (2026)

```typescript
// Conservative 투자자를 위한 백테스트
const engine = createBacktestEngine(
  config,
  { level: 'conservative' } // 🆕 Risk Profile
)

const result = await engine.run()

// Conservative 프로필:
// - Max Stop Loss: 3%
// - Take Profit: 3:1 ratio (9%)
// - Max Position: 10%
// - Max Leverage: 1x
```

### 3. Legal Compliance 검증 (2026)

```typescript
const engine = createBacktestEngine({
  strategy: {
    name: 'Risky Strategy',
    config: {
      riskManagement: {
        stopLossPercent: undefined // ❌ No stop loss
      }
    }
  },
  initialCapital: 100000,
  leverage: 10 // ❌ High leverage
})

const result = await engine.run()

if (result.status === 'failed') {
  console.log(result.error)
  // "Strategy risk level is EXTREME: 손절가 미설정, 높은 레버리지 (10x)"
}
```

---

## 📊 Advanced Metrics (2026)

### Kelly Criterion
```typescript
const { kellyCriterion, kellyHalf } = result.advancedMetrics

console.log(`Optimal position size: ${kellyCriterion}%`)
console.log(`Conservative Kelly: ${kellyHalf}%`)

// Example output:
// Optimal position size: 23.5%
// Conservative Kelly: 11.8% (recommended)
```

### Value at Risk (VAR)
```typescript
const { valueAtRisk95, valueAtRisk99, conditionalVaR95 } = result.advancedMetrics

console.log(`VAR 95%: ${valueAtRisk95}%`)     // -5.2% (5% chance of worse loss)
console.log(`VAR 99%: ${valueAtRisk99}%`)     // -8.7% (1% chance of worse loss)
console.log(`CVaR 95%: ${conditionalVaR95}%`) // -6.8% (expected loss if VAR exceeded)
```

### Ulcer Index
```typescript
const { ulcerIndex } = result.advancedMetrics

console.log(`Ulcer Index: ${ulcerIndex}`)
// 8.3 (lower is better)
// Measures depth and duration of drawdowns
```

### Information Ratio
```typescript
const { informationRatio } = result.advancedMetrics

console.log(`Information Ratio: ${informationRatio}`)
// 1.25 (excess return vs benchmark per unit of risk)
// Benchmark: S&P 500 10% annual return
```

### Recovery Factor
```typescript
const { recoveryFactor } = result.advancedMetrics

console.log(`Recovery Factor: ${recoveryFactor}`)
// 3.2 (Net Profit / Max Drawdown)
// Higher is better - shows resilience
```

### Trade Quality Score
```typescript
const { tradeQualityScore } = result.advancedMetrics

console.log(`Trade Quality: ${tradeQualityScore}/100`)
// 78/100
// Composite score: Win Rate (30%) + Payoff Ratio (30%) + Profit Factor (40%)
```

### Market Exposure
```typescript
const { timeInMarket, avgMarketExposure } = result.advancedMetrics

console.log(`Time in market: ${timeInMarket}%`)           // 65% (포지션 보유 시간)
console.log(`Avg exposure: ${avgMarketExposure}%`)        // 18% (평균 포지션 크기)
```

---

## 🎯 Complete Example

```typescript
import { createBacktestEngine, logger } from '@/lib/backtest'
import { loadOHLCV } from '@/lib/data'

async function runBacktest() {
  // 1. Create engine with Risk Profile
  const engine = createBacktestEngine(
    {
      strategy: {
        name: 'RSI Mean Reversion',
        config: {
          entryConditions: [
            {
              indicator: 'rsi',
              period: 14,
              operator: 'lt',
              value: 30
            }
          ],
          exitConditions: [
            {
              indicator: 'rsi',
              period: 14,
              operator: 'gt',
              value: 70
            }
          ],
          riskManagement: {
            stopLossPercent: 5,
            takeProfitPercent: 10
          }
        }
      },
      symbol: 'BTC/USDT',
      startDate: Date.UTC(2023, 0, 1),
      endDate: Date.UTC(2024, 11, 31),
      initialCapital: 100000,
      commission: 0.001,
      slippage: 0.0005
    },
    { level: 'moderate' } // Risk Profile
  )

  // 2. Load data
  const data = await loadOHLCV('BTC/USDT', '1d', 2023, 2024)
  engine.setData(data)

  // 3. Monitor progress
  engine.onProgress((progress) => {
    logger.info('Backtest', `Progress: ${progress.percent.toFixed(1)}%`, {
      currentBar: progress.currentBar,
      totalBars: progress.totalBars,
      estimatedTimeRemaining: `${(progress.estimatedTimeRemaining / 1000).toFixed(1)}s`
    })
  })

  // 4. Run backtest
  const result = await engine.run()

  // 5. Print results
  console.log('\n=== Basic Metrics ===')
  console.log(`Total Return: ${result.metrics.totalReturnPercent.toFixed(2)}%`)
  console.log(`Win Rate: ${result.metrics.winRate.toFixed(2)}%`)
  console.log(`Sharpe Ratio: ${result.metrics.sharpeRatio.toFixed(2)}`)
  console.log(`Max Drawdown: ${result.metrics.maxDrawdownPercent.toFixed(2)}%`)

  console.log('\n=== Advanced Metrics (2026) ===')
  console.log(`Kelly Criterion: ${result.advancedMetrics!.kellyCriterion.toFixed(2)}%`)
  console.log(`VAR 95%: ${result.advancedMetrics!.valueAtRisk95.toFixed(2)}%`)
  console.log(`Ulcer Index: ${result.advancedMetrics!.ulcerIndex.toFixed(2)}`)
  console.log(`Trade Quality: ${result.advancedMetrics!.tradeQualityScore.toFixed(1)}/100`)

  // 6. Export for analysis
  await saveResults(result)

  return result
}
```

---

## 📊 Metrics Comparison

### Before (2024)
```typescript
const metrics = {
  totalReturn: 15234.56,
  winRate: 62.5,
  sharpeRatio: 1.85,
  maxDrawdown: 12.3
}
// Only 8 basic metrics
```

### After (2026)
```typescript
const metrics = {
  // Basic (8 metrics)
  totalReturn: 15234.56,
  winRate: 62.5,
  sharpeRatio: 1.85,
  maxDrawdown: 12.3,
  ...

  // Advanced (9 new metrics)
  advancedMetrics: {
    kellyCriterion: 23.5,       // Optimal position size
    valueAtRisk95: -5.2,        // Risk measurement
    ulcerIndex: 8.3,            // Pain index
    informationRatio: 1.25,     // Benchmark comparison
    recoveryFactor: 3.2,        // Resilience
    tradeQualityScore: 78,      // Quality score
    omegaRatio: 2.1,            // Probability weighted
    gainPainRatio: 2.8,         // Gain/Pain
    timeInMarket: 65            // Market exposure
  }
}
// Total 17 metrics (기관급)
```

---

## 🔧 Configuration

### BacktestConfig

```typescript
interface BacktestConfig {
  strategy: Strategy           // Trading strategy
  symbol: string               // Symbol to backtest
  startDate: number            // Start timestamp (Unix ms)
  endDate: number              // End timestamp (Unix ms)
  initialCapital: number       // Starting capital
  commission: number           // Commission (0.001 = 0.1%)
  slippage: number             // Slippage (0.0005 = 0.05%)
  leverage?: number            // Leverage (default: 1x)
  marginMode?: 'isolated' | 'cross'
}
```

### UserRiskProfile (2026)

```typescript
interface UserRiskProfile {
  level: 'conservative' | 'moderate' | 'aggressive' | 'very_aggressive'
  preferredStopLoss?: number   // Optional override
}
```

---

## 🎓 Best Practices

### 1. Always Use Risk Profiler

```typescript
// ❌ Don't run without profile
const engine = createBacktestEngine(config)

// ✅ Do provide risk profile
const engine = createBacktestEngine(config, { level: 'moderate' })
```

### 2. Monitor Advanced Metrics

```typescript
const result = await engine.run()

// Check Kelly Criterion
if (result.advancedMetrics!.kellyCriterion > 50) {
  console.warn('⚠️ Kelly suggests reducing position size')
}

// Check VAR
if (result.advancedMetrics!.valueAtRisk95 < -10) {
  console.warn('⚠️ High tail risk detected')
}

// Check Trade Quality
if (result.advancedMetrics!.tradeQualityScore < 50) {
  console.warn('⚠️ Low trade quality - review strategy')
}
```

### 3. Compare to Benchmark

```typescript
// Use Information Ratio to compare vs S&P 500
const { informationRatio } = result.advancedMetrics

if (informationRatio < 0) {
  console.log('❌ Underperforming benchmark')
} else if (informationRatio > 1) {
  console.log('✅ Strong outperformance')
}
```

### 4. Validate with Legal Compliance

```typescript
const result = await engine.run()

if (result.status === 'failed') {
  logger.critical('Backtest', 'Strategy blocked by compliance', {
    error: result.error
  })
  // Review strategy parameters
}
```

---

## 📝 API Reference

### BacktestEngine

#### Constructor
```typescript
const engine = new BacktestEngine(
  config: BacktestConfig,
  userProfile?: UserRiskProfile
)
```

#### Methods
- `setData(data: OHLCV[]): void` - Set historical data
- `onProgress(callback: BacktestProgressCallback): void` - Subscribe to progress
- `run(): Promise<BacktestResult>` - Run backtest
- `getState()` - Get current state (internal)

### Functions
- `createBacktestEngine(config, userProfile?)` - Factory function
- `calculateAdvancedMetrics(trades, equityCurve, initialCapital, benchmark?)` - Calculate advanced metrics

---

## 🎓 References

- **QuantConnect**: Kelly Criterion, Institutional metrics
- **TradingView**: Volatility-based risk management
- **Trade Ideas**: Backtesting performance
- **Institutional Quant Firms**: VAR, Ulcer Index, Information Ratio

---

**Last Updated**: 2025-12-15
**Version**: 2.0.0 (2026 Architecture)
