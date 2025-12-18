# HEPHAITOS Backtest Engine Guide

> **백테스팅 엔진 작업 시 필수 컨텍스트**

## 핵심 원칙

### 1. 타입 안전성 (최우선)
```typescript
// ✅ 올바른 예
export interface BacktestConfig {
  strategy: Strategy
  symbol: string
  startDate: number  // Unix timestamp (ms)
  endDate: number
}

// ❌ 잘못된 예
interface BacktestConfig {
  strategy: any  // any 금지!
  dates: Date[]  // Date 객체 대신 number 사용
}
```

### 2. 성능 최적화
- 대용량 OHLCV 데이터 처리 → Worker Thread 사용
- Redis 캐싱 (동일 심볼/기간 재요청)
- Progressive Results (중간 결과 실시간 업데이트)

### 3. 정확성 보장
- **커미션 (Commission)**: 0.1% 기본값
- **슬리피지 (Slippage)**: 0.05% 기본값
- **타임스탬프**: Unix ms 기준 (Date 객체 X)

### 4. 리스크 관리
```typescript
export interface RiskConfig {
  maxPositionSize: number    // % of portfolio
  maxDrawdown: number         // % 손실 한도
  stopLossPercent?: number
  takeProfitPercent?: number
}
```

## 파일 구조
```
backtest/
├── types.ts          # 타입 정의 (Strategy, OHLCV, Signal)
├── engine.ts         # 백테스팅 핵심 로직
├── indicators.ts     # 기술 지표 계산
├── metrics.ts        # 성과 지표 (Sharpe, MDD)
├── strategy-parser.ts # 자연어 → 전략 변환
└── advanced-metrics.ts # 고급 지표 (2026 추가)
```

## 금지 사항
❌ Date 객체 사용 (number timestamp만 사용)
❌ 동기식 루프 (대용량 데이터 처리 시 Worker)
❌ console.log (logger 사용)
❌ 하드코딩된 커미션/슬리피지

## 필수 참조
- `./types.ts` - 타입 정의 (Strategy, OHLCV export)
- `../trading/executor.ts` - 실제 거래 실행과 일관성 유지
- `../../types/index.ts` - 글로벌 타입
