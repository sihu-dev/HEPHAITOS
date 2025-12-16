# Trading Module (2026 Enhanced)

> **Grok-스타일 실시간 모니터링 + Quant 2.0 동적 리스크 관리**

---

## 📚 Overview

HEPHAITOS Trading Module은 2026년 최신 Trading AI 아키텍처를 채택한 프로덕션급 거래 실행 엔진입니다.

### 주요 기능
- ✅ **Trade Executor**: 실시간 주문 실행 및 포지션 관리
- ✅ **Structured Logger**: Datadog/Sentry 스타일 구조화된 로깅
- ✅ **Error Metrics**: 에러율 모니터링 및 추적
- ✅ **Legal Compliance 통합**: 투자 조언 금지 자동 검증
- ✅ **Risk Profiler 통합**: 변동성 기반 동적 리스크 계산
- ✅ **UnifiedBroker 통합**: 7개 증권사 통합 연결

---

## 🚀 Quick Start

### 1. TradeExecutor 기본 사용

```typescript
import { createTradeExecutor, logger } from '@/lib/trading'

// Executor 생성
const executor = createTradeExecutor({
  userId: 'user123',
  brokerId: 'binance',
  userProfile: { level: 'moderate' }, // Conservative, Moderate, Aggressive, Very Aggressive

  strategy: myStrategy,
  exchange: myExchange,
  symbol: 'BTC/USDT',
  maxPositionSize: 20, // 20% of portfolio
  enableLive: false,   // Paper trading
  paperTrading: true,
  riskConfig: {
    stopLossPercent: 5,
    takeProfitPercent: 10
  }
})

// 이벤트 구독
executor.onEvent((event) => {
  if (event.type === 'position') {
    logger.info('Main', 'Position event', event.data)
  }
})

// 시작
await executor.start()

// 시그널 처리
await executor.processSignal({
  type: 'entry_long',
  price: 50000,
  timestamp: Date.now()
})

// 중지
await executor.stop()
```

### 2. 동적 리스크 관리 (2026)

```typescript
// 변동성 기반 손절가 자동 계산
const executor = createTradeExecutor({
  userId: 'user123',
  brokerId: 'binance',
  userProfile: { level: 'conservative' }, // 🆕 Risk Profile

  symbol: 'BTC/USDT',
  // riskConfig 생략 시 Risk Profiler가 자동 계산
  // BTC (low volatility): 3.5% * 1.0 (conservative) = 3.5% SL
  // DOGE (high volatility): 8.2% * 1.0 (conservative) = 8.2% SL
})
```

### 3. Legal Compliance 자동 검증 (2026)

```typescript
// EXTREME 위험 전략은 자동 차단
const executor = createTradeExecutor({
  maxPositionSize: 80, // 80%는 과도함
  riskConfig: {
    stopLossPercent: undefined // 손절가 없음
  }
})

await executor.start()
// ❌ Error: 전략 위험도가 EXTREME입니다. 실행할 수 없습니다.
```

### 4. 구조화된 로깅 (2026)

```typescript
import { logger, errorMetrics } from '@/lib/trading'

// 다양한 로그 레벨
logger.debug('MyComponent', 'Debug message', { data: 123 })
logger.info('MyComponent', 'Info message', { userId: 'user123' })
logger.warn('MyComponent', 'Warning message', { warning: 'High volatility' })
logger.error('MyComponent', 'Error occurred', error, { context: 'trading' })
logger.critical('MyComponent', 'CRITICAL', error, { immediate: true })

// 로그 조회
const logs = logger.getLogs({
  level: 'error',
  component: 'TradeExecutor',
  since: new Date(Date.now() - 60 * 60 * 1000) // Last hour
})

// 에러 메트릭
const metrics = errorMetrics.getMetrics()
console.log(metrics.errorRate) // Errors per minute
console.log(metrics.totalErrors)
console.log(metrics.errorsByType)

// 에러율 확인
if (errorMetrics.isErrorRateHigh()) {
  logger.critical('System', '🚨 Error rate exceeds threshold')
}
```

---

## 📊 Advanced Features

### Dynamic Position Sizing

```typescript
// Before (2024): Fixed 5% for all symbols
const stopLoss = 5

// After (2026): Volatility-based dynamic calculation
const executor = createTradeExecutor({
  symbol: 'BTC/USDT',
  userProfile: { level: 'moderate' }
})

// Automatic calculation:
// - BTC (3.5% volatility) → 4.2% SL (3.5% * 1.2 moderate multiplier)
// - DOGE (8.2% volatility) → 9.8% SL (8.2% * 1.2 moderate multiplier)
// - SOL (6.1% volatility) → 7.3% SL (6.1% * 1.2 moderate multiplier)
```

### Risk Profile Configuration

```typescript
// 4가지 리스크 레벨
const profiles = {
  conservative: {
    maxStopLoss: 3%,
    rewardRisk: 3:1,
    maxPosition: 10%,
    maxLeverage: 1x
  },
  moderate: {
    maxStopLoss: 5%,
    rewardRisk: 2.5:1,
    maxPosition: 20%,
    maxLeverage: 2x
  },
  aggressive: {
    maxStopLoss: 8%,
    rewardRisk: 2:1,
    maxPosition: 30%,
    maxLeverage: 3x
  },
  very_aggressive: {
    maxStopLoss: 12%,
    rewardRisk: 1.5:1,
    maxPosition: 50%,
    maxLeverage: 5x
  }
}
```

### Emergency Controls

```typescript
const executor = createTradeExecutor(config)
await executor.start()

// Emergency close (즉시 모든 포지션 청산)
await executor.emergencyClose()
// 🚨 EMERGENCY CLOSE initiated
// 📊 Position closed: PnL = -50.25
```

---

## 🎯 Best Practices

### 1. Always Use Risk Profiler

```typescript
// ❌ Don't hard-code risk
const executor = createTradeExecutor({
  riskConfig: { stopLossPercent: 5 } // Fixed for all symbols
})

// ✅ Do use dynamic risk
const executor = createTradeExecutor({
  userProfile: { level: 'moderate' } // Volatility-based
})
```

### 2. Monitor Error Metrics

```typescript
setInterval(() => {
  const metrics = errorMetrics.getMetrics()

  if (metrics.errorRate > 10) {
    // Alert DevOps
    sendAlert('High error rate detected', metrics)
  }
}, 60 * 1000) // Every minute
```

### 3. Use Structured Logging

```typescript
// ❌ Don't use console.log
console.log('[TradeExecutor] Position opened')

// ✅ Do use logger
logger.info('TradeExecutor', 'Position opened', {
  symbol: 'BTC/USDT',
  side: 'long',
  quantity: 0.5,
  entryPrice: 50000,
  userId: 'user123',
  orderId: 'order_123'
})
```

### 4. Handle Graceful Shutdown

```typescript
process.on('SIGTERM', async () => {
  logger.info('Main', 'Shutting down gracefully')

  // Close all positions
  await executor.emergencyClose()

  // Export logs for debugging
  const logs = logger.exportLogs()
  await saveToFile('logs.json', logs)

  process.exit(0)
})
```

---

## 📝 API Reference

### TradeExecutor

#### Constructor
```typescript
const executor = new TradeExecutor(config: ExecutorConfig)
```

#### Methods
- `start(): Promise<void>` - Start executor
- `stop(): Promise<void>` - Stop executor
- `pause(): void` - Pause trading (keeps monitoring)
- `resume(): void` - Resume trading
- `processSignal(signal: Signal): Promise<TradeResult | null>` - Process trade signal
- `getState(): ExecutorState` - Get current state
- `getPosition(): Position | null` - Get current position
- `emergencyClose(): Promise<void>` - Emergency close all positions
- `onEvent(callback: ExecutorCallback): () => void` - Subscribe to events

### Logger

#### Methods
- `debug(component, message, data?)` - Debug log
- `info(component, message, data?)` - Info log
- `warn(component, message, data?)` - Warning log
- `error(component, message, error?, data?)` - Error log
- `critical(component, message, error?, data?)` - Critical log
- `getLogs(filter?)` - Get filtered logs
- `getErrorCount(component?)` - Get error count
- `exportLogs()` - Export logs as JSON
- `setLogLevel(level)` - Change log level at runtime

### ErrorMetricsTracker

#### Methods
- `track(entry)` - Track an error
- `getMetrics()` - Get current metrics
- `isErrorRateHigh(threshold?)` - Check if error rate exceeds threshold

---

## 🔧 Configuration

### ExecutorConfig

```typescript
interface ExecutorConfig {
  // 🆕 2026 Fields
  userId: string              // User ID
  brokerId: BrokerId          // Broker ID (binance, upbit, kis, etc.)
  userProfile?: UserRiskProfile // Risk profile (conservative, moderate, etc.)

  // Core
  strategy: Strategy          // Trading strategy
  exchange: IExchange         // Exchange connector
  symbol: string              // Trading symbol
  maxPositionSize: number     // Max position size (% of portfolio)
  enableLive: boolean         // Enable live trading (safety flag)
  paperTrading?: boolean      // Paper trading mode
  riskConfig?: RiskConfig     // Risk management config (optional if userProfile provided)
}
```

### LoggerConfig

```typescript
interface LoggerConfig {
  minLevel: LogLevel           // Minimum log level (debug, info, warn, error, critical)
  enableConsole: boolean       // Enable console output
  enableFile?: boolean         // Enable file logging
  enableRemote?: boolean       // Enable remote logging (Sentry/Datadog)
}
```

---

## 🎓 References

- **Grok (X AI)**: Real-time monitoring patterns
- **QuantConnect**: Institutional-grade risk management
- **TradingView**: Volatility-based position sizing
- **Datadog/Sentry**: Structured logging and error tracking
- **Constitutional AI (Anthropic)**: Safety and compliance patterns

---

**Last Updated**: 2025-12-15
**Version**: 2.0.0 (2026 Architecture)
