# HEPHAITOS 오픈소스 통합 계획

> **목표**: 검증된 오픈소스 라이브러리를 활용하여 개발 속도 향상 및 안정성 확보
> **작성일**: 2025-12-14
> **상태**: 계획 단계

---

## 📊 현재 상태 분석

### 기존 구현 (자체 개발)
| 모듈 | 파일 | 현재 기능 |
|------|------|-----------|
| 기술적 지표 | `lib/backtest/indicators.ts` | SMA, EMA, RSI, MACD, Bollinger, ATR, Stochastic, Momentum |
| 백테스팅 엔진 | `lib/backtest/engine.ts` | 기본 백테스트, 포지션 관리, 리스크 체크 |
| 차트 | `recharts` | 기본 라인/바 차트 |
| 전략 빌더 | `reactflow` | 노드 기반 플로우 차트 |

### 현재 의존성 (package.json)
- **UI**: headlessui, heroicons, framer-motion, lucide-react
- **상태관리**: zustand
- **차트**: recharts, reactflow
- **DB**: @supabase/supabase-js
- **유틸**: zod, clsx, tailwind-merge

---

## 🎯 오픈소스 통합 우선순위

### 1순위: 기술적 지표 라이브러리 (즉시 적용)

#### 추천: `trading-signals` 또는 `technicalindicators`

**trading-signals**
```bash
npm install trading-signals
```

**장점**:
- TypeScript 네이티브
- 스트리밍 데이터 지원 (실시간 업데이트)
- 정밀도 높은 계산 (Big.js 사용)
- 활발한 유지보수

**지원 지표** (100+):
- 이동평균: SMA, EMA, WMA, DEMA, TEMA, SMMA
- 오실레이터: RSI, Stochastic, CCI, Williams %R
- 추세: MACD, ADX, Parabolic SAR
- 변동성: Bollinger Bands, ATR, Keltner Channels
- 볼륨: OBV, MFI, VWAP, A/D Line

**통합 계획**:
```typescript
// 현재 (자체 구현)
import { sma, ema, rsi, macd } from '@/lib/backtest/indicators'

// 변경 후 (trading-signals)
import { SMA, EMA, RSI, MACD } from 'trading-signals'

// 스트리밍 방식 (실시간)
const rsi = new RSI(14)
rsi.update(closePrice) // 각 캔들마다 업데이트
const currentRSI = rsi.getResult()

// 배치 방식 (백테스트)
const rsiValues = RSI.calculate({ period: 14, values: closePrices })
```

---

### 2순위: 금융 차트 라이브러리

#### 추천: `lightweight-charts` (TradingView)

**lightweight-charts**
```bash
npm install lightweight-charts
```

**장점**:
- TradingView 공식 오픈소스
- 캔들스틱, 라인, 히스토그램, 영역 차트
- 고성능 (Canvas 기반, WebGL)
- 모바일 최적화
- 커스터마이징 가능

**기능**:
- 캔들스틱 차트 (OHLCV)
- 기술적 지표 오버레이
- 드로잉 도구
- 십자선 (Crosshair)
- 가격 스케일 커스터마이징
- 다중 타임프레임

**통합 계획**:
```typescript
import { createChart, CandlestickSeries } from 'lightweight-charts'

// 차트 생성
const chart = createChart(container, {
  width: 800,
  height: 400,
  layout: {
    background: { color: '#0A0A0C' },
    textColor: '#d1d4dc',
  },
  grid: {
    vertLines: { color: 'rgba(255,255,255,0.06)' },
    horzLines: { color: 'rgba(255,255,255,0.06)' },
  },
})

// 캔들스틱 시리즈
const candleSeries = chart.addSeries(CandlestickSeries, {
  upColor: '#10b981',
  downColor: '#ef4444',
  borderVisible: false,
  wickUpColor: '#10b981',
  wickDownColor: '#ef4444',
})

candleSeries.setData(ohlcvData)
```

---

### 3순위: 백테스팅 프레임워크

#### 옵션 A: `@backtest/framework` (BacktestJS)

```bash
npm install @backtest/framework
```

**장점**:
- TypeScript 네이티브
- 100+ 내장 지표 (tulind)
- Binance 데이터 통합
- SQLite 결과 저장
- 완전 무료 (진짜 오픈소스)

**통합 계획**:
```typescript
import { Backtest, DataSource } from '@backtest/framework'

const backtest = new Backtest({
  dataSource: DataSource.BINANCE,
  symbol: 'BTCUSDT',
  timeframe: '1h',
  startDate: '2024-01-01',
  endDate: '2024-12-01',
  initialCapital: 10000,
})

// 전략 정의
backtest.strategy({
  entry: (candles, indicators) => {
    const rsi = indicators.rsi(14)
    return rsi < 30 ? 'long' : rsi > 70 ? 'short' : null
  },
  exit: (position, candles, indicators) => {
    const rsi = indicators.rsi(14)
    if (position.side === 'long' && rsi > 70) return true
    if (position.side === 'short' && rsi < 30) return true
    return false
  },
})

const results = await backtest.run()
```

#### 옵션 B: 자체 엔진 유지 + 지표만 교체

현재 `BacktestEngine`을 유지하면서:
1. 지표 계산만 `trading-signals`로 교체
2. 전략 파서/실행기는 자체 유지
3. 결과 시각화는 `lightweight-charts` 사용

---

### 4순위: 추가 유틸리티

#### 데이터 처리: `danfo.js`
```bash
npm install danfojs
```
- Pandas 스타일 DataFrame
- 시계열 데이터 처리
- 통계 함수

#### 수학/통계: `simple-statistics`
```bash
npm install simple-statistics
```
- 표준편차, 분산
- 상관계수
- 회귀분석

#### 날짜 처리: `date-fns`
```bash
npm install date-fns
```
- 경량 날짜 라이브러리
- 타임존 처리

---

## 🗓️ 구현 로드맵

### Phase 1: 기술적 지표 교체 (1-2일)

1. **trading-signals 설치**
   ```bash
   npm install trading-signals
   ```

2. **어댑터 레이어 생성**
   ```
   src/lib/indicators/
   ├── index.ts           # 통합 export
   ├── adapter.ts         # trading-signals 래퍼
   └── custom.ts          # 커스텀 지표 (필요시)
   ```

3. **기존 코드 마이그레이션**
   - `lib/backtest/indicators.ts` → 어댑터로 대체
   - `lib/backtest/engine.ts` → 새 지표 import

### Phase 2: 금융 차트 추가 (2-3일)

1. **lightweight-charts 설치**
   ```bash
   npm install lightweight-charts
   ```

2. **차트 컴포넌트 생성**
   ```
   src/components/charts/
   ├── TradingChart.tsx      # 캔들스틱 메인 차트
   ├── IndicatorChart.tsx    # 지표 서브 차트
   ├── ChartToolbar.tsx      # 툴바 (타임프레임, 지표 등)
   └── index.ts
   ```

3. **기존 recharts 유지**
   - 대시보드 통계 차트 → recharts (기존 유지)
   - 트레이딩 차트 → lightweight-charts (신규)

### Phase 3: 백테스팅 강화 (3-5일)

1. **옵션 평가**
   - BacktestJS 테스트
   - 성능 비교 (자체 vs 오픈소스)

2. **결정에 따라**:
   - A: 완전 교체 → BacktestJS 통합
   - B: 하이브리드 → 지표만 교체, 엔진 유지

---

## 📦 설치 명령어 (전체)

```bash
# 1순위: 기술적 지표
npm install trading-signals

# 2순위: 금융 차트
npm install lightweight-charts

# 추가 유틸리티
npm install date-fns simple-statistics

# 옵션: 백테스팅 프레임워크
npm install @backtest/framework
```

---

## ⚠️ 주의사항

### 라이센스 확인
| 라이브러리 | 라이센스 | 상업적 사용 |
|-----------|----------|-------------|
| trading-signals | MIT | ✅ |
| lightweight-charts | Apache 2.0 | ✅ |
| BacktestJS | MIT | ✅ |
| date-fns | MIT | ✅ |
| simple-statistics | ISC | ✅ |

### 번들 사이즈 고려
- `lightweight-charts`: ~45KB (gzip)
- `trading-signals`: ~15KB (gzip)
- `date-fns`: ~10KB (tree-shaking 후)

### 성능 테스트
- 대용량 데이터 (10,000+ 캔들) 백테스트 시간 측정
- 실시간 업데이트 레이턴시 확인

---

## 🔗 참고 자료

### 기술적 지표
- [trading-signals GitHub](https://github.com/bennycode/trading-signals)
- [technicalindicators GitHub](https://github.com/anandanand84/technicalindicators)

### 차트
- [TradingView Lightweight Charts](https://github.com/tradingview/lightweight-charts)
- [Lightweight Charts Docs](https://tradingview.github.io/lightweight-charts/)

### 백테스팅
- [BacktestJS Framework](https://github.com/backtestjs/framework)
- [Grademark](https://github.com/Grademark/grademark)

---

## 📝 다음 단계

1. [ ] trading-signals 설치 및 테스트
2. [ ] 지표 어댑터 레이어 구현
3. [ ] lightweight-charts 프로토타입
4. [ ] 백테스팅 엔진 성능 비교
5. [ ] 최종 아키텍처 결정

---

## 🎨 UI 오픈소스 라이브러리 (2025 최신)

### 1. UI 컴포넌트 라이브러리

#### **shadcn/ui** (추천 - 이미 Tailwind 사용 중)
```bash
npx shadcn@latest init
```

**장점**:
- Radix UI + Tailwind CSS 기반
- 코드 소유권 (copy-paste 방식)
- 66K+ GitHub Stars
- WAI-ARIA 접근성 내장
- 완전한 커스터마이징

**주요 컴포넌트**:
- Button, Input, Select, Dialog, Dropdown
- Table, Tabs, Toast, Tooltip
- Chart (Recharts 기반), Form (react-hook-form + zod)

---

### 2. 알림/토스트 라이브러리

#### **Sonner** (추천)
```bash
npm install sonner
```

**장점**:
- shadcn/ui 공식 통합
- 가장 현대적인 토스트 라이브러리
- 스와이프 애니메이션
- 타입스크립트 네이티브
- 5KB (gzip)

**사용 예**:
```typescript
import { toast } from 'sonner'

toast.success('전략이 저장되었습니다')
toast.error('백테스트 실패')
toast.loading('데이터 로딩 중...')
```

---

### 3. 데이터 테이블 라이브러리

#### **TanStack Table** (추천)
```bash
npm install @tanstack/react-table
```

**장점**:
- 헤드리스 (완전 커스터마이징)
- 9KB (gzip)
- 정렬, 필터, 페이지네이션
- 가상 스크롤 (react-virtual)
- TypeScript 네이티브

**대안: AG Grid Community** (대용량 데이터)
```bash
npm install ag-grid-community ag-grid-react
```
- 100,000+ 행 처리 가능
- 엔터프라이즈급 기능

---

### 4. 애니메이션 라이브러리

#### **Framer Motion** (현재 사용 중 - 유지)
이미 사용 중이며 최선의 선택. 변경 불필요.

**대안: Motion One** (경량 필요시)
```bash
npm install motion
```
- Framer Motion의 기반 엔진
- 더 가벼운 번들 사이즈

---

### 5. 아이콘 라이브러리

#### **Heroicons** (현재 사용 중 - 유지)
Tailwind CSS 공식 아이콘. 변경 불필요.

#### **Lucide React** (추가 - 더 많은 아이콘)
```bash
npm install lucide-react
```
이미 설치됨. 1,500+ 아이콘 제공.

---

### 6. 폼 관리

#### **React Hook Form + Zod** (추천)
```bash
npm install react-hook-form @hookform/resolvers
```

**장점**:
- 최소 리렌더링
- Zod 스키마 통합 (이미 설치됨)
- 비제어 컴포넌트 방식

**사용 예**:
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const schema = z.object({
  strategyName: z.string().min(1),
  initialCapital: z.number().min(1000),
})

const form = useForm({
  resolver: zodResolver(schema),
})
```

---

### 7. 날짜 선택기

#### **React Day Picker** (추천)
```bash
npm install react-day-picker
```

**장점**:
- shadcn/ui Calendar 컴포넌트 기반
- date-fns 통합
- 범위 선택 지원

---

## 📦 UI 설치 명령어 (전체)

```bash
# shadcn/ui 초기화
npx shadcn@latest init

# 주요 컴포넌트 추가
npx shadcn@latest add button input select dialog dropdown-menu
npx shadcn@latest add table tabs toast tooltip card badge
npx shadcn@latest add form calendar command sheet

# 추가 라이브러리
npm install sonner
npm install @tanstack/react-table @tanstack/react-virtual
npm install react-hook-form @hookform/resolvers
npm install react-day-picker
```

---

## 🏗️ 최종 권장 스택

### 현재 → 권장 변경

| 카테고리 | 현재 | 권장 | 변경여부 |
|---------|------|------|----------|
| UI 컴포넌트 | headlessui | shadcn/ui | ✅ 변경 |
| 토스트 | - | Sonner | ✅ 추가 |
| 테이블 | 자체 구현 | TanStack Table | ✅ 추가 |
| 차트 | recharts | recharts + lightweight-charts | ✅ 추가 |
| 애니메이션 | framer-motion | framer-motion | 유지 |
| 아이콘 | heroicons + lucide | heroicons + lucide | 유지 |
| 폼 | - | react-hook-form + zod | ✅ 추가 |
| 기술적 지표 | 자체 구현 | trading-signals | ✅ 변경 |
| 트레이딩 차트 | - | lightweight-charts | ✅ 추가 |

---

## 🎯 번들 사이즈 최적화 예상

### 추가되는 라이브러리 (gzip 기준)
| 라이브러리 | 사이즈 |
|-----------|--------|
| trading-signals | ~15KB |
| lightweight-charts | ~45KB |
| sonner | ~5KB |
| @tanstack/react-table | ~9KB |
| react-hook-form | ~8KB |
| date-fns | ~10KB |
| simple-statistics | ~5KB |
| **합계** | **~97KB** |

### 제거 가능 (shadcn으로 대체 시)
| 라이브러리 | 사이즈 |
|-----------|--------|
| @headlessui/react | ~15KB |

### 순 증가: ~82KB (매우 합리적)

---

*문서 버전: 2.0*
*최종 수정: 2025-12-14*
