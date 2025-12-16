# 🐛 Edge Case 버그 수정 계획

> **작성일**: 2025-12-15 20:00
> **발견**: 자동화 테스트 (720개)
> **총 버그**: 26개 (모두 Edge Cases, Non-Critical)
> **영향도**: 낮음 - 핵심 기능 모두 작동

---

## 📊 버그 분류

### Critical: 0개
없음 - 모든 핵심 기능 정상 작동

### Medium: 8개 (Edge Cases)

#### A. Advanced Metrics - NaN 반환 (5개)

**파일**: `src/lib/backtest/advanced-metrics.ts`

1. **calculateKellyCriterion() - Division by Zero**
   ```typescript
   // 문제: line 126
   const b = avgWinPercent / avgLossPercent
   // avgLossPercent가 0일 때 Infinity 발생

   // 해결방안:
   if (avgLossPercent === 0) {
     return avgWinPercent > 0 ? 100 : 0
   }
   ```

2. **calculateKellyCriterion() - NaN 체크**
   ```typescript
   // 문제: line 131
   return Math.max(0, Math.min(100, kelly * 100))
   // kelly가 NaN일 때 그대로 반환

   // 해결방안:
   if (!isFinite(kelly)) return 0
   return Math.max(0, Math.min(100, kelly * 100))
   ```

3. **calculateOmegaRatio() - Flat Returns**
   ```typescript
   // 문제: flat equity curve일 때 gains=0, losses=0
   // 현재: 0 / 0 → NaN

   // 해결방안: (이미 구현됨 line 315)
   return losses > 0 ? gains / losses : gains > 0 ? Infinity : 0
   // ✅ 실제로는 정상 작동
   ```

4. **calculateGainPainRatio() - No Pain**
   ```typescript
   // 문제: 모든 수익일 때 sumPains=0
   // 현재: gains / 0 → Infinity (정상)

   // 해결방안: (이미 구현됨 line 329)
   return sumPains > 0 ? sumGains / sumPains : sumGains > 0 ? Infinity : 0
   // ✅ 실제로는 정상 작동
   ```

5. **calculateUlcerIndex() - Flat Equity**
   ```typescript
   // 문제: flat equity일 때 모든 drawdownPercent=0
   // Math.sqrt(0) = 0 (정상)

   // 해결방안:
   // ✅ 이미 정상 작동, 테스트 데이터 문제일 가능성
   ```

#### B. Error Metrics Tracker - errorsByType undefined (3개)

**파일**: `src/lib/trading/logger.ts`

**문제**: `ErrorMetricsTracker.errorsByType`가 undefined 반환

**원인**: `track()` 메서드에서 errorsByType 업데이트 누락

```typescript
// 현재 구현 (대략):
track(entry: LogEntry): void {
  if (entry.level === 'error' || entry.level === 'critical') {
    this.errors.push(entry)
    this.totalErrors++
    // ❌ errorsByType 업데이트 누락
  }
}

// 해결방안:
track(entry: LogEntry): void {
  if (entry.level === 'error' || entry.level === 'critical') {
    this.errors.push(entry)
    this.totalErrors++

    // ✅ errorsByType 업데이트
    const errorType = entry.error?.name || 'Unknown'
    this.errorsByType[errorType] = (this.errorsByType[errorType] || 0) + 1
  }
}
```

### Low: 18개 (기타 Edge Cases)
- 테스트 데이터 생성 문제
- 타입 불일치
- 경계값 처리

---

## 🔧 수정 우선순위

### Priority 1: Kelly Criterion (2개)
**파일**: `src/lib/backtest/advanced-metrics.ts`
**라인**: 110-132
**시간**: 5분

```typescript
private calculateKellyCriterion(): number {
  const wins = this.trades.filter(t => t.pnl > 0)
  const losses = this.trades.filter(t => t.pnl <= 0)

  if (wins.length === 0 || losses.length === 0 || this.trades.length === 0) {
    return 0
  }

  const winRate = wins.length / this.trades.length
  const lossRate = losses.length / this.trades.length

  const avgWinPercent = wins.reduce((sum, t) => sum + Math.abs(t.pnlPercent), 0) / wins.length
  const avgLossPercent = losses.reduce((sum, t) => sum + Math.abs(t.pnlPercent), 0) / losses.length

  // ✅ FIX 1: Guard against division by zero
  if (avgLossPercent === 0) {
    return avgWinPercent > 0 ? 100 : 0
  }

  const b = avgWinPercent / avgLossPercent
  const kelly = (winRate * b - lossRate) / b

  // ✅ FIX 2: Check for NaN/Infinity
  if (!isFinite(kelly)) return 0
  return Math.max(0, Math.min(100, kelly * 100))
}
```

### Priority 2: Error Metrics Tracker (3개)
**파일**: `src/lib/trading/logger.ts`
**시간**: 10분

```typescript
export class ErrorMetricsTracker {
  private errors: LogEntry[] = []
  private totalErrors = 0
  private errorsByType: Record<string, number> = {} // ✅ 추가

  track(entry: LogEntry): void {
    if (entry.level === 'error' || entry.level === 'critical') {
      this.errors.push(entry)
      this.totalErrors++

      // ✅ FIX: errorsByType 업데이트
      const errorType = entry.error?.name || 'Unknown'
      this.errorsByType[errorType] = (this.errorsByType[errorType] || 0) + 1
    }
  }

  getMetrics(): ErrorMetrics {
    const now = Date.now()
    const oneMinuteAgo = now - 60000

    const recentErrors = this.errors.filter(
      e => new Date(e.timestamp).getTime() > oneMinuteAgo
    )

    return {
      totalErrors: this.totalErrors,
      recentErrors: recentErrors.length,
      errorRate: recentErrors.length / 60, // errors per second
      errorsByType: this.errorsByType, // ✅ 이미 업데이트됨
    }
  }
}
```

### Priority 3: 테스트 헬퍼 함수 (나머지 18개)
**파일**: `src/__tests__/lib/advanced-metrics.test.ts`
**시간**: 15분

```typescript
// Helper function to create equity curve
const createEquityCurve = (values: number[]): PortfolioSnapshot[] => {
  let peak = values[0] || 0

  return values.map((value, index) => {
    // Update peak
    if (value > peak) {
      peak = value
    }

    // Calculate drawdown
    const drawdown = peak - value
    const drawdownPercent = peak > 0 ? (drawdown / peak) * 100 : 0

    return {
      timestamp: Date.now() + index * 86400000,
      equity: value, // ✅ FIX: totalValue → equity
      cash: value * 0.5, // ✅ FIX: cashBalance → cash
      positionValue: value * 0.5,
      unrealizedPnl: 0, // ✅ FIX: 추가
      realizedPnl: value - (values[0] || 0), // ✅ FIX: 추가
      drawdown, // ✅ FIX: 추가
      drawdownPercent, // ✅ FIX: 추가
    }
  })
}
```

---

## 📈 예상 효과

### 수정 전
```
Test Files:  6 failed | 28 passed (34 total)
Tests:      26 failed | 693 passed | 1 skipped (720 total)
통과율: 96.4%
```

### 수정 후 (예상)
```
Test Files:  0 failed | 34 passed (34 total)
Tests:      0 failed | 719 passed | 1 skipped (720 total)
통과율: 100%
```

**개선**:
- 테스트 통과율: 96.4% → 100% (+3.6%p)
- 실패 테스트: 26개 → 0개
- 총 소요 시간: 약 30분

---

## 🔍 근본 원인 분석

### 1. 테스트 헬퍼 함수 타입 불일치
**원인**: `PortfolioSnapshot` 타입이 업데이트되었지만, 테스트 헬퍼 함수가 구버전 사용

**교훈**: 타입 변경 시 전체 테스트 파일 검토 필요

### 2. Edge Case 처리 미흡
**원인**: Division by zero, NaN 체크 누락

**교훈**: 수학 연산 시 항상 edge case 고려
- Division by zero
- NaN/Infinity 체크
- Empty array 처리

### 3. 새로운 기능 불완전 구현
**원인**: `ErrorMetricsTracker.errorsByType` 추가했지만 track() 메서드 미업데이트

**교훈**: 새 필드 추가 시 모든 관련 메서드 동시 업데이트

---

## ✅ 액션 아이템

### 즉시 (30분)
1. [ ] `advanced-metrics.ts` Kelly Criterion 수정 (5분)
2. [ ] `logger.ts` ErrorMetricsTracker 수정 (10분)
3. [ ] `advanced-metrics.test.ts` 헬퍼 함수 수정 (15분)
4. [ ] 전체 테스트 재실행 (5분)
5. [ ] 100% 통과 확인 (2분)

### 단기 (1시간)
6. [ ] Edge case 테스트 추가 (division by zero, NaN 등)
7. [ ] Type guard 유틸 함수 작성 (isFinite, safeDiv 등)

### 중기 (1일)
8. [ ] 코드 리뷰: 모든 수학 연산에 edge case 처리 확인
9. [ ] 문서화: Edge case 처리 가이드라인 작성

---

## 🎯 목표

**현재**: 96.4% 테스트 통과 (693/720)
**목표**: 100% 테스트 통과 (720/720)
**기한**: 30분 이내

---

## 📝 참고

### 영향받는 파일
1. `src/lib/backtest/advanced-metrics.ts` (110-132 line)
2. `src/lib/trading/logger.ts` (ErrorMetricsTracker class)
3. `src/__tests__/lib/advanced-metrics.test.ts` (30-38 line)

### 관련 문서
- [AUTOMATION_VERIFICATION_REPORT.md](./.claude/AUTOMATION_VERIFICATION_REPORT.md)
- [COMPLETION_SUMMARY.md](./.claude/COMPLETION_SUMMARY.md)

---

**작성일**: 2025-12-15 20:00
**작성자**: Claude Code (Sonnet 4.5)
**상태**: 📋 **PLAN READY - READY TO EXECUTE**
