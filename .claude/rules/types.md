# Types Rules

> packages/types/**에 적용

## 타입 정의 규칙

### 1. any 타입 절대 금지
```typescript
// ❌ 금지
function process(data: any) {}

// ✅ 허용
function process<T>(data: T) {}
function process(data: unknown) {}
```

### 2. 인터페이스 명명 규칙
```typescript
// 인터페이스: I 접두사
export interface IStrategy {}
export interface IBacktestConfig {}

// 타입: 설명적 이름
export type StrategyType = 'momentum' | 'meanReversion'
export type Timeframe = '1m' | '5m' | '1h'
```

### 3. 불변성
```typescript
// readonly 사용
export interface IOrder {
  readonly id: string
  readonly createdAt: Date
  status: OrderStatus  // mutable
}
```

### 4. 유니온 타입 선호
```typescript
// ✅ 유니온 타입
export type OrderSide = 'buy' | 'sell'
export type OrderType = 'market' | 'limit' | 'stop'

// ❌ enum (사용 자제)
enum OrderSide { BUY, SELL }
```

### 5. 제네릭 활용
```typescript
export interface IApiResponse<T> {
  data: T | null
  error: string | null
  timestamp: number
}
```

## 나노팩터 계층 준수

### L0 - Atoms (Types)
```typescript
// 기본 타입만, 비즈니스 로직 없음
export interface IAsset {
  symbol: string
  name: string
  price: number
}
```

### 주석 규칙
```typescript
/**
 * 백테스트 설정
 * @property initialCapital - 초기 자본금
 * @property startDate - 시작 날짜
 */
export interface IBacktestConfig {
  initialCapital: number
  startDate: Date
}
```
