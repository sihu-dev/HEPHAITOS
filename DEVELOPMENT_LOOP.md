# HEPHAITOS 자가성장 지능형 개발 루프 (ㄱ Loop)

> **버전**: 1.0
> **생성일**: 2025-12-17
> **트리거**: `ㄱ` (자동 진행)

---

## 1. ㄱ 루프 운영 규칙

### 1.1 입력 프로토콜

```
┌─────────────────────────────────────────────────────────────────┐
│  입력 방식                                                       │
├─────────────────────────────────────────────────────────────────┤
│  ㄱ              → 다음 우선순위 작업 자동 진행                   │
│  ㄱ + 키워드     → 특정 작업 지정 (예: "ㄱ 결제", "ㄱ GTM")       │
│  ㄱㄱ            → 2개 작업 병렬 진행                            │
│  ㄱㄱㄱ          → 3개 작업 병렬 진행 (최대)                     │
│  ㄱ?             → 현재 상태 및 다음 작업 미리보기                │
│  ㄱ!             → 긴급 핫픽스 모드                              │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 출력 프로토콜 (매 회차 고정)

```yaml
output:
  - 이번_회차_목표: "P0/P1/P2 중 1-2개"
  - 업그레이드_문서: "PRD/Tech Spec/ADR/정책/카피"
  - 구현_체크리스트: "API/DB/코드 스켈레톤"
  - 테스트_계측: "Observability + 릴리즈 게이트"
  - 다음_회차_예고: "다음 ㄱ에서 무엇을 생성할지"
  - CHANGELOG_누적: "의사결정/가정/리스크/측정지표"
```

### 1.3 자가성장 메커니즘

```
┌─────────────────────────────────────────────────────────────────┐
│                    자가성장 피드백 루프                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   [설계] ──→ [구현] ──→ [검증] ──→ [측정] ──→ [개선]            │
│      ↑                                              │           │
│      └──────────────────────────────────────────────┘           │
│                                                                 │
│   매 루프마다:                                                   │
│   1. 이전 루프 결과 분석 (성공/실패/부분)                        │
│   2. 기술 부채 자동 추적                                         │
│   3. KPI 달성률 계산                                             │
│   4. 다음 우선순위 자동 조정                                     │
│   5. 문서 자동 업데이트                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 개발 단계 정의 (P0 → P1 → P2)

### 2.1 전체 로드맵

```
Phase      P0 (베타 전)      P1 (베타 중)       P2 (정식 전)
──────────────────────────────────────────────────────────────────
기간       1-2일             2주               4주
목표       런칭 게이트       안정화+개선        스케일 준비
루프       Loop 1-5         Loop 6-15         Loop 16-25
──────────────────────────────────────────────────────────────────

현재 위치: ████████████████░░░░░░░░░░░░░░░░ (P0 95% 완료)
```

### 2.2 P0: 베타 런칭 게이트 (Critical)

| Loop | 작업 | 상태 | AC (Acceptance Criteria) |
|------|------|------|--------------------------|
| 1 | 결제 + 멱등성 | ✅ | 중복 웹훅 3회에도 크레딧 1회 |
| 2 | Rate Limit + Circuit Breaker | ✅ | 429 응답 + 자동 복구 |
| 3 | Consent Gate (19+ 면책) | ✅ | 미동의시 기능 차단 |
| 4 | 키움 "준비중" 표기 | ✅ | 코드베이스 0건 |
| **5** | **데이터 ToS 검토** | ⚠️ | 법무 확인서 또는 대체 소스 |

**P0 완료 조건**:
```typescript
const P0_GATE = {
  payment_idempotency: true,      // ✅
  rate_limit_active: true,        // ✅
  consent_gate_active: true,      // ✅
  kiwoom_coming_soon: true,       // ✅
  data_tos_verified: false,       // ⚠️ 미완료
}

const canLaunchBeta = Object.values(P0_GATE).every(v => v === true)
```

### 2.3 P1: 베타 안정화 + 핵심 개선 (High)

| Loop | 작업 | 의존성 | AC |
|------|------|--------|-----|
| 6 | Production 환경 설정 | P0 완료 | Vercel 배포 성공 |
| 7 | Slack Webhook 연동 | Loop 6 | 알림 수신 확인 |
| 8 | GitHub Secrets 설정 | Loop 6 | CI 파이프라인 통과 |
| 9 | 베타 초대코드 100개 생성 | Loop 6 | 코드 활성화 확인 |
| 10 | D1/D7 리텐션 추적 | Loop 9 | 대시보드 시각화 |
| 11 | ARPPU 코호트 분석 | Loop 10 | SQL 쿼리 실행 |
| 12 | 전환율 퍼널 분석 | Loop 10 | 단계별 이탈률 |
| 13 | Safety Net v2 (soften) | - | 완화 로직 동작 |
| 14 | 환불 정책 고도화 | - | 부분 환불 계산 |
| 15 | 비용 대시보드 | - | Grafana 차트 4개 |

**P1 완료 조건**:
```typescript
const P1_GATE = {
  production_deployed: false,
  slack_webhook_active: true,    // ✅ Loop 7
  beta_codes_generated: true,    // ✅ Loop 9
  retention_tracking: true,      // ✅ Loop 10
  cost_dashboard: false,
}
```

### 2.4 P2: 스케일 준비 + 경쟁 우위 (Medium)

| Loop | 작업 | 의존성 | AC |
|------|------|--------|-----|
| 16 | 전략 성과 네트워크 효과 | P1 완료 | 익명 집계 인사이트 |
| 17 | UnifiedBroker 예외처리 강화 | - | 부분체결, 장애 복구 |
| 18 | Status Page 구축 | - | 장애 공지 자동화 |
| 19 | 데이터 Fallback 설계 | - | Primary/Secondary API |
| 20 | 전략 마켓플레이스 v1 | Loop 16 | 전략 공유/판매 |
| 21 | 멘토 코칭 정식 런칭 | - | 실시간 화면공유 |
| 22 | 한국 주식 데이터 연동 | - | KIS 실시간 시세 |
| 23 | 해외 주식 연동 | - | Alpaca 실거래 |
| 24 | 성과 기반 가격 실험 | Loop 16 | A/B 테스트 |
| 25 | 시리즈 A 준비 자료 | Loop 24 | 투자 데크 |

**P2 완료 조건**:
```typescript
const P2_GATE = {
  strategy_network_effect: false,
  broker_resilience: false,
  status_page: false,
  marketplace_v1: false,
  series_a_ready: false,
}
```

---

## 3. 루프별 상세 스펙

### Loop 5: 데이터 ToS 검토 (현재 대기)

**목표**: Unusual Whales, Quiver 상업적 이용 허용 확인

**산출물**:
```markdown
docs/DATA_SOURCES_COMPLIANCE.md (업데이트)
├── Unusual Whales ToS 분석
│   ├── 상업적 이용: 허용/불허
│   ├── 재배포: 허용/불허
│   └── Attribution 의무: 있음/없음
├── Quiver Quantitative ToS 분석
│   └── (동일 구조)
├── 대체 소스 검토
│   ├── SEC EDGAR (무료, Public Domain)
│   └── OpenInsider (무료)
└── 법무 검토 결과 또는 외부 확인서
```

**AC**:
- [ ] Unusual Whales 상업적 이용 확인 OR 대체 소스 확정
- [ ] 모든 데이터 소스에 attribution 표기 (필요 시)
- [ ] 라이선스 준수 문서 Git 커밋

---

### Loop 6: Production 환경 설정

**목표**: Vercel Production 배포 완료

**산출물**:
```bash
# Vercel 환경변수 설정
vercel env add NEXT_PUBLIC_APP_URL production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add ANTHROPIC_API_KEY production
vercel env add TOSS_CLIENT_KEY production
vercel env add TOSS_SECRET_KEY production
vercel env add SLACK_WEBHOOK_URL_ALERTS production
vercel env add SLACK_WEBHOOK_URL_REPORTS production
vercel env add CRON_SECRET production
```

**AC**:
- [ ] `vercel --prod` 배포 성공
- [ ] Health check 200 응답
- [ ] 결제 테스트 통과

---

### Loop 10: D1/D7 리텐션 추적

**목표**: 베타 사용자 리텐션 측정 시스템

**산출물**:
```sql
-- D1 리텐션 쿼리
WITH cohort AS (
  SELECT
    user_id,
    DATE(created_at) as signup_date
  FROM auth.users
),
activity AS (
  SELECT
    user_id,
    DATE(created_at) as activity_date
  FROM product_events
)
SELECT
  c.signup_date,
  COUNT(DISTINCT c.user_id) as cohort_size,
  COUNT(DISTINCT CASE WHEN a.activity_date = c.signup_date + 1 THEN c.user_id END) as d1_retained,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN a.activity_date = c.signup_date + 1 THEN c.user_id END) / COUNT(DISTINCT c.user_id), 2) as d1_retention_rate
FROM cohort c
LEFT JOIN activity a ON c.user_id = a.user_id
GROUP BY c.signup_date;
```

**AC**:
- [ ] D1 리텐션 > 40%
- [ ] D7 리텐션 > 20%
- [ ] 대시보드 시각화 완료

---

### Loop 16: 전략 성과 네트워크 효과

**목표**: "어떤 전략이 어떤 시장에서 통했는지" 익명 집계

**산출물**:
```typescript
// strategy_performance_aggregates 테이블
interface StrategyPerformanceAggregate {
  strategy_hash: string      // 전략 프롬프트 해시
  market_condition: string   // 'bull' | 'bear' | 'sideways'
  timeframe: string          // '1d' | '1w' | '1m'
  total_runs: number
  avg_return: number
  win_rate: number
  sharpe_ratio: number
  updated_at: Date
}

// 익명화된 인사이트 API
GET /api/insights/strategies?condition=bull&timeframe=1w
```

**AC**:
- [ ] 전략 성과 집계 테이블 생성
- [ ] 익명화 파이프라인 구현
- [ ] 대시보드에 "인기 전략" 섹션 추가

---

## 4. 자동 트리거 시스템

### 4.1 루프 진행 조건

```typescript
interface LoopTrigger {
  loop_id: number
  dependencies: number[]        // 선행 루프 ID
  auto_trigger: boolean         // ㄱ 입력 시 자동 진행
  manual_gate: string | null    // 수동 확인 필요 항목
}

const LOOP_TRIGGERS: LoopTrigger[] = [
  { loop_id: 5, dependencies: [1,2,3,4], auto_trigger: false, manual_gate: '법무 검토' },
  { loop_id: 6, dependencies: [5], auto_trigger: true, manual_gate: null },
  { loop_id: 7, dependencies: [6], auto_trigger: true, manual_gate: null },
  // ...
]

function getNextLoop(): number {
  const completed = getCompletedLoops()
  const available = LOOP_TRIGGERS.filter(t =>
    t.dependencies.every(d => completed.includes(d)) &&
    !completed.includes(t.loop_id)
  )
  return available.sort((a,b) => a.loop_id - b.loop_id)[0]?.loop_id
}
```

### 4.2 긴급 핫픽스 (ㄱ!)

```typescript
// ㄱ! 입력 시 현재 루프 중단, 긴급 이슈 처리
const HOTFIX_PRIORITY = [
  'PAYMENT_FAILURE',      // 결제 실패
  'SECURITY_BREACH',      // 보안 이슈
  'DATA_LEAK',            // 데이터 유출
  'SERVICE_DOWN',         // 서비스 중단
]
```

---

## 5. 측정 및 검증

### 5.1 베타 KPI 대시보드

```
┌─────────────────────────────────────────────────────────────────┐
│  HEPHAITOS Beta Dashboard                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Users          Retention        Conversion      Revenue        │
│  ┌─────┐        ┌─────┐         ┌─────┐        ┌─────┐        │
│  │ 100 │        │ 42% │         │ 12% │        │₩1.2M│        │
│  │ MAU │        │ D7  │         │Free→│        │ MRR │        │
│  └─────┘        └─────┘         └─────┘        └─────┘        │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Retention Curve                                          │ │
│  │  100% ████                                                │ │
│  │   80% ██████                                              │ │
│  │   60% ████████                                            │ │
│  │   40% ██████████████                                      │ │
│  │   20% ████████████████████████                            │ │
│  │    0% ─────────────────────────────────────               │ │
│  │       D1   D3   D7   D14  D30                             │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 기술 부채 추적

```typescript
interface TechDebt {
  id: string
  category: 'P0' | 'P1' | 'P2'
  description: string
  created_at: Date
  resolved_at: Date | null
  estimated_hours: number
  actual_hours: number | null
  impact: 'critical' | 'high' | 'medium' | 'low'
}

// 자동 추적
function trackTechDebt(debt: TechDebt) {
  // CHANGELOG.md 자동 업데이트
  // 주간 리포트에 포함
  // 다음 루프 우선순위에 반영
}
```

---

## 6. CHANGELOG (누적)

### v2.6.0 (2025-12-17) - Loop 24 (성과 기반 가격 실험)
- ✅ Loop 24: 성과 기반 가격 실험 시스템
  - DB 마이그레이션 (20251217_pricing_experiments.sql)
    - pricing_experiments 테이블: 실험 정의
      - 상태: draft, running, paused, completed, cancelled
      - 목표 샘플 크기, 신뢰 수준, 최소 감지 효과
      - 주요/보조 지표 설정
    - experiment_variants 테이블: 실험 변형 (A/B 그룹)
      - 가격 모델: fixed, tiered, usage_based, performance, hybrid
      - 트래픽 배분 (%)
      - 가격 설정 JSON (pricing_config)
    - experiment_assignments 테이블: 사용자 실험 배정
      - 사용자 세그먼트, 채널, 디바이스 추적
    - experiment_conversions 테이블: 전환 기록
      - 매출, 크레딧, 사용자 수익, 플랫폼 수수료
    - performance_pricing_accounts 테이블: 성과 기반 가격 계정
      - 수수료율 (기본 20%)
      - 최소 수익 기준
      - 정산 주기 (weekly/biweekly/monthly)
      - 누적 성과 및 수수료 추적
    - performance_settlements 테이블: 정산 내역
    - experiment_results 뷰: 실험 결과 집계
    - assign_user_to_experiment() RPC: 사용자 배정 (랜덤 트래픽 분배)
    - record_experiment_conversion() RPC: 전환 기록
    - calculate_performance_fee() RPC: 성과 기반 수수료 계산
    - calculate_statistical_significance() RPC: 통계적 유의성 (Z-test)
    - get_experiment_summary() RPC: 실험 요약
    - 3개 샘플 실험 데이터 (성과 vs 고정, 앵커링, 할인 vs 보너스)
  - /api/experiments API 라우트
    - GET:
      - type=list: 실험 목록
      - type=experiment: 실험 상세
      - type=results: 실험 결과
      - type=summary: 실험 요약 (RPC)
      - type=my_assignment: 내 실험 배정
      - type=performance_account: 성과 기반 계정
      - type=settlements: 정산 내역
      - type=stats: 전체 통계
    - POST:
      - create_experiment: 실험 생성
      - add_variant: 변형 추가
      - start/pause/complete_experiment: 상태 변경
      - assign_user: 사용자 배정
      - record_conversion: 전환 기록
      - enable/disable_performance_pricing: 성과 기반 가격 활성화
      - calculate_fee: 수수료 계산
  - PricingExperiments 컴포넌트
    - Overview 탭: 통계 카드 6개 + 실행 중 실험
    - Experiments 탭: 전체 실험 목록 + 결과 확장
      - ExperimentCard: 가설, 변형, 전환율, 리프트 표시
      - Start/Pause/Complete 액션
      - Statistical Significance 표시
    - Performance 탭: 성과 기반 가격 설정
      - 수수료율, 최소 수익 기준 설정
      - 수수료 시뮬레이션
    - Settings 탭: 기본 설정

### v2.5.0 (2025-12-17) - Loop 23 (해외 주식 연동 - Alpaca)
- ✅ Loop 23: 해외 주식 연동 (Alpaca API)
  - alpaca-client.ts - Alpaca API 클라이언트 (~600 lines)
    - AlpacaConfig 인터페이스 (apiKey, apiSecret, isPaper)
    - Paper Trading / Live Trading 지원
    - 계좌 조회: getAccount()
    - 포지션 관리: getPositions(), getPosition()
    - 주문 관리: getOrders(), getOrder(), submitOrder()
    - 매수/매도: buy(), sell(), cancelOrder(), cancelAllOrders()
    - 시장 데이터: getSnapshot(), getSnapshots(), getBars()
    - 실시간 데이터: getLatestTrade(), getLatestQuote()
    - 자산 검색: getAsset(), searchAssets()
    - 마켓 정보: getClock(), getCalendar()
    - 고급 주문 타입: limit, stop, stop_limit, trailing_stop
    - Time in Force: day, gtc, opg, cls, ioc, fok
  - /api/stocks/us API 라우트
    - GET (Public):
      - type=snapshot: 주식 스냅샷 (현재가 + 호가 + 일별)
      - type=quote: 최신 호가
      - type=trade: 최신 체결
      - type=bars: 봉 데이터 (1Min~1Month)
      - type=clock: 마켓 상태
      - type=calendar: 마켓 캘린더
      - type=asset: 자산 정보
      - type=search: 종목 검색
      - type=popular: 인기 종목 15개 + 스냅샷
    - POST (Authenticated):
      - action=account: 계좌 정보
      - action=positions: 전체 포지션
      - action=position: 특정 종목 포지션
      - action=orders: 주문 목록
      - action=order: 특정 주문 조회
      - action=buy: 매수 주문
      - action=sell: 매도 주문
      - action=submit_order: 고급 주문
      - action=cancel: 주문 취소
      - action=cancel_all: 전체 주문 취소
  - DB 마이그레이션 (20251217_us_stocks.sql)
    - us_stock_master 테이블: 미국 종목 마스터
      - 50개 주요 종목 초기 데이터 (AAPL, MSFT, GOOGL, ...)
      - 섹터: Technology, Financial, Healthcare, Energy, Consumer, Industrial, Communication
      - 속성: tradable, marginable, shortable, fractionable
    - us_stock_daily_prices 테이블: 일별 가격 (OHLCV + VWAP)
    - us_stock_minute_prices 테이블: 분봉 가격 (TTL 7일)
    - us_market_sessions 테이블: 마켓 세션 정보
    - exchange_rates 테이블: 환율 정보 (USD/KRW)
    - alpaca_orders_extended 테이블: Alpaca 주문 확장
      - 고급 주문 옵션 (stop, trail, extended_hours)
      - 상태 추적 (submitted, filled, expired, canceled, failed)
    - us_stock_dividends 테이블: 배당 정보
    - calculate_us_portfolio_value() RPC: 포트폴리오 가치 계산 (USD/KRW)
    - us_sector_performance 뷰: 섹터별 성과
    - RLS 정책 적용
  - USStockWidget 컴포넌트
    - Popular 탭: 인기 종목 15개 + 실시간 가격
    - Search 탭: 종목 검색 + 상세 정보
    - Market 탭: 마켓 시간, 섹터 성과, 거래소 정보
    - MarketStatusBadge: 마켓 개장/폐장 상태
    - StockRow: 종목 행 (심볼, 이름, 가격, 변동)
    - StockDetailCard: 종목 상세 + 호가 + 일별 통계
    - SectorOverview: 섹터별 성과 그리드
    - 면책조항 (FINRA/SIPC)

### v2.4.0 (2025-12-17) - Loop 22 (한국 주식 데이터 연동)
- ✅ Loop 22: 한국 주식 데이터 연동 (KIS API)
  - kis-client.ts - KIS API 클라이언트 (~500 lines)
    - KISConfig 인터페이스 (appKey, appSecret, accountNo, isPaper)
    - OAuth2 토큰 관리 (자동 갱신)
    - 실시간 시세: getStockPrice(), getStockQuote()
    - 지수 조회: getMarketIndex() (KOSPI, KOSDAQ, KOSPI200)
    - 종목 검색: searchStocks()
    - 계좌 조회: getBalance(), getHoldings()
    - 주문 실행: buy(), sell(), cancelOrder(), getOrderStatus()
    - 에러 핸들링 및 로깅
  - /api/stocks/kr API 라우트
    - GET (Public):
      - type=price: 주식 현재가
      - type=quote: 호가 조회
      - type=index: 지수 조회
      - type=indices: 주요 지수 일괄 (KOSPI, KOSDAQ, KOSPI200)
      - type=search: 종목 검색
      - type=popular: 인기 종목 10개 + 실시간 가격
    - POST (Authenticated):
      - action=balance: 계좌 잔고
      - action=holdings: 보유 종목
      - action=buy: 매수 주문
      - action=sell: 매도 주문
      - action=cancel: 주문 취소
      - action=order_status: 주문 상태 조회
  - DB 마이그레이션 (20251217_korean_stocks.sql)
    - broker_credentials 테이블: 증권사 인증 정보
      - 지원: kis, kiwoom, alpaca, interactive_brokers
      - 토큰 캐시, 모의투자 여부, 기본 계좌 설정
    - order_logs 테이블: 주문 로그
      - 주문 정보 (symbol, side, quantity, price, order_type)
      - 주문 결과 (order_id, status, filled_quantity, filled_price)
      - 전략 연결 (strategy_id, execution_id)
    - portfolio_snapshots 테이블: 포트폴리오 스냅샷
      - 계좌 요약 (total_assets, profit_loss, profit_loss_rate)
      - 보유 종목 JSON
    - stock_watchlist 테이블: 관심 종목
      - 알림 설정 (price_above, price_below, change_percent)
      - 태그 및 메모
    - kr_stock_master 테이블: 한국 종목 마스터
      - 25개 주요 종목 초기 데이터 (삼성전자, SK하이닉스, ...)
      - 시장 (KOSPI, KOSDAQ, KONEX), 섹터, 산업
    - kr_stock_daily_prices 테이블: 일별 가격 히스토리
    - stock_price_alerts 테이블: 가격 알림
    - calculate_portfolio_performance() RPC: 포트폴리오 성과 계산
    - add_to_watchlist() RPC: 관심 종목 추가
    - RLS 정책 (본인 데이터만 접근)
  - KoreanStockWidget 컴포넌트
    - Indices 탭: KOSPI, KOSDAQ, KOSPI200 실시간 지수
    - Popular 탭: 인기 종목 10개 목록 + 가격/등락률
    - Search 탭: 종목 검색 + 호가 상세
    - IndexCard: 지수 카드 (현재가, 변동, 변동률)
    - StockRow: 종목 행 (심볼, 이름, 가격, 변동)
    - StockDetailCard: 종목 상세 + 호가 표시
    - 면책조항 표시

### v2.3.0 (2025-12-17) - Loop 21 (멘토 코칭 정식 런칭)
- ✅ Loop 21: 멘토 코칭 정식 런칭
  - mentor_profiles 테이블 (멘토 프로필)
    - 전문 분야: stocks, options, crypto, forex, futures, quant, technical, fundamental, risk, psychology
    - 검증 상태: pending, verified, rejected
    - 가용 시간 설정 (요일, 시작/종료 시간)
    - 수익 분배: 멘토 80%, 플랫폼 20%
  - mentor_availability 테이블 (가용 슬롯)
  - coaching_sessions 테이블 (세션 예약)
    - 세션 타입: one_on_one, group, review, strategy
    - 상태: scheduled, confirmed, in_progress, completed, cancelled, no_show
    - 화상 미팅 URL 및 Provider
  - session_notes 테이블 (세션 노트)
  - coaching_reviews 테이블 (리뷰)
    - 종합 평점 + 세부 평점 (knowledge, communication, helpfulness)
    - 하이라이트 태그
  - mentor_earnings 테이블 (수익 정산)
    - 7일 후 정산 가능
  - RPC 함수
    - book_coaching_session(): 세션 예약 + 크레딧 차감
    - complete_coaching_session(): 완료 처리 + 수익 분배
    - cancel_coaching_session(): 취소 + 환불 (24시간 전 100%, 12시간 전 50%)
    - create_coaching_review(): 리뷰 작성 + 평점 업데이트
    - generate_mentor_availability(): 가용 슬롯 자동 생성
    - get_popular_mentors(): 인기 멘토 조회
  - 뷰
    - mentor_dashboard_stats: 멘토 대시보드 통계
    - coaching_platform_stats: 플랫폼 전체 통계
  - /api/coaching API 확장
    - GET: mentors, mentor, availability, session, my_sessions, mentor_dashboard, platform_stats, reviews, specialties
    - POST: book_session, cancel_session, complete_session, start_session, create_review, add_note, generate_availability, update_profile, apply_mentor
  - MentorCoaching 컴포넌트
    - Browse: 전문 분야별 멘토 탐색
    - My Sessions: 예약된 세션 목록
    - Become Mentor: 멘토 신청 폼
    - MentorDetailModal: 멘토 상세 + 예약
    - 면책조항 표시

### v2.2.0 (2025-12-17) - Loop 20 (전략 마켓플레이스)
- ✅ Loop 20: 전략 마켓플레이스 v1
  - strategy_listings 테이블 (전략 리스팅)
    - 카테고리: momentum, value, dividend, growth, swing, daytrading, options, crypto
    - 위험도: low, medium, high, extreme
    - 타임프레임: scalping, intraday, swing, position, long_term
    - 가격 정책: free, one_time, subscription, performance_based
    - 검증 메트릭: return, win_rate, sharpe, max_drawdown
  - strategy_purchases 테이블 (구매 기록)
    - 일회성/구독 구매 지원
    - 크레딧 기반 결제
  - strategy_reviews 테이블 (리뷰 시스템)
    - 1-5점 평점
    - 구매 검증 표시
  - creator_profiles 테이블 (크리에이터 프로필)
    - 검증 상태 (identity, professional, influencer)
    - 수익 분배 설정 (70/30)
    - 소셜 링크
  - creator_followers 테이블 (팔로우)
  - strategy_bookmarks 테이블 (북마크)
  - creator_earnings 테이블 (수익 정산)
  - RPC 함수
    - purchase_strategy(): 전략 구매 + 크레딧 차감 + 수익 분배
    - create_strategy_listing(): 리스팅 생성 + 크리에이터 프로필 자동 생성
    - create_strategy_review(): 리뷰 작성 + 평점 자동 계산
    - get_popular_listings(): 인기 전략 조회
  - 뷰
    - marketplace_stats: 전체 통계
    - category_stats: 카테고리별 통계
    - creator_leaderboard: 크리에이터 랭킹
  - /api/marketplace API
    - GET: listings, listing, reviews, categories, stats, leaderboard, creator, featured, search
    - POST: create_listing, purchase, review, bookmark, follow, update_listing, update_profile
  - StrategyMarketplace 컴포넌트
    - Browse: 카테고리별 전략 탐색
    - Featured: 추천 전략
    - Creators: 인기 크리에이터 리더보드
    - 검색 + 필터 + 정렬
    - 전략 상세 모달 (구매, 북마크, 공유)
    - 면책조항 표시

### v2.1.0 (2025-12-17) - Loop 19 (데이터 Fallback)
- ✅ Loop 19: 데이터 Fallback 설계
  - DataFallbackManager 클래스
    - 소스 우선순위 기반 자동 전환
    - 실패 카운트 및 쿨다운 관리
    - 레이트 리밋 트래킹
    - 인메모리 캐시 (TTL 기반)
    - executeWithFallback() 패턴
  - 데이터 소스 어댑터
    - unusual_whales: 의원 거래
    - quiver: 대안 데이터
    - sec_edgar: SEC 공시 (무료)
    - openinsider: 내부자 거래 (무료)
    - finnhub: 실시간 시세
    - alpha_vantage: 주가 데이터
    - yahoo_finance: 비공식 API
  - Fallback 규칙
    - congress_trades: UW → Quiver → SEC
    - insider_trades: UW → OpenInsider → SEC
    - stock_quote: Finnhub → AV → Yahoo
  - DB 테이블
    - data_sources (소스 정의)
    - data_source_logs (요청 로그)
    - data_cache (캐시)
    - data_fallback_rules (규칙)
  - /api/data API

### v2.0.0 (2025-12-17) - Loop 17 + 18 (병렬)
- ✅ Loop 17: UnifiedBroker v2 예외처리 강화
  - BrokerError 타입 시스템 (25+ 에러 코드)
  - 재시도 로직 (exponential backoff + jitter)
  - Circuit Breaker (closed/open/half_open)
  - Graceful Degradation (primary + fallback)
  - Health Check API
  - Order validation
  - Partial fill 처리
  - src/lib/broker/unified-broker-v2.ts

- ✅ Loop 18: Status Page 시스템
  - status_services 테이블 (10개 서비스 정의)
  - status_checks 테이블 (상태 체크 기록)
  - status_incidents 테이블 (인시던트 관리)
  - status_incident_updates 테이블 (타임라인)
  - status_maintenance 테이블 (유지보수 일정)
  - status_subscribers 테이블 (알림 구독)
  - get_system_status() RPC (전체 상태)
  - record_service_status() RPC (상태 기록)
  - calculate_uptime() RPC (가동률 계산)
  - update_incident() RPC (인시던트 업데이트)
  - /api/status API (Public)
  - StatusPage 컴포넌트
    - Overall status banner
    - Active incidents timeline
    - Upcoming maintenance
    - Services by category
    - 90-day uptime history

### v1.9.0 (2025-12-17) - Loop 16 (전략 성과 네트워크 효과)
- ✅ Loop 16: 전략 성과 네트워크 효과 시스템
  - strategy_performance_aggregates 테이블 (익명화 집계)
    - strategy_hash, market_condition, timeframe별 집계
    - avg_return, win_rate, sharpe_ratio, max_drawdown
    - confidence_score, sample_size_tier
  - strategy_executions 테이블 (개별 실행 기록)
  - market_conditions 테이블 (시장 조건 스냅샷)
  - strategy_tags 테이블 (전략 태그)
  - generate_strategy_hash() - 프롬프트 익명화
  - aggregate_strategy_performance() - 집계 RPC
  - get_popular_strategies() - 인기 전략 조회
  - compare_strategy_performance() - 전략 비교
  - get_best_strategies_by_condition() - 시장별 최적 전략
  - strategy_insights, strategy_type_performance 뷰
  - /api/insights/strategies API
    - popular: 인기 전략 Top N
    - by_condition: 시장 조건별 최적 전략
    - compare: 전략 성과 비교
    - insights: 전체 인사이트
    - type_performance: 타입별 성과
  - StrategyInsights 컴포넌트
    - 시장 조건별 카드 (bull/bear/sideways/volatile)
    - 인기 전략 Top 10 테이블
    - 전략 타입별 성과 그리드
    - 면책조항 표시

### v1.8.0 (2025-12-17) - Loop 15 (비용 대시보드)
- ✅ Loop 15: 비용 대시보드 시스템
  - api_cost_logs 테이블 (API 비용 로그)
    - provider, model, feature별 추적
    - input/output 토큰 및 비용 계산
    - latency, success 메트릭
  - daily_cost_summary 테이블 (일별 집계)
  - cost_budgets 테이블 (월별 예산)
  - cost_alerts 테이블 (비용 알림)
  - api_pricing 테이블 (API 가격 설정)
    - Anthropic (claude-3-opus/sonnet/haiku)
    - OpenAI (gpt-4-turbo/4o)
    - External APIs (월정액)
  - log_api_cost() RPC (비용 로그 기록)
  - aggregate_daily_costs() RPC (일별 집계)
  - get_cost_summary() RPC (비용 요약)
  - check_cost_budgets() RPC (예산 체크 + 알림)
  - /api/admin/costs API
  - CostDashboard 컴포넌트
    - KPI (총비용/일평균/AI/External)
    - Overview (트렌드 + 예산 상태)
    - Providers (프로바이더별 비용)
    - Features (기능별 비용)
    - Logs (상세 로그)
    - Budgets (예산 + 알림 기록)

### v1.7.0 (2025-12-17) - Loop 14 (환불 정책 고도화)
- ✅ Loop 14: 환불 정책 고도화 시스템
  - refund_policy_rules 테이블 (11개 환불 규칙)
    - instant_unused: 7일 이내 미사용 → 100% 환불
    - week_low/medium/high_usage: 7일 이내 사용률별 90/70/50%
    - month_low/medium/high_usage: 30일 이내 사용률별 80/50/30%
    - over_month_low/medium: 30일 초과 50/30%
    - special_case: 관리자 판단
    - no_refund: 환불 불가
  - refund_abuse_records 테이블 (어뷰징 기록)
  - calculate_refund_v2() RPC 함수
    - 사용률, 기간, 정책 기반 환불액 계산
    - 어뷰징 점수 자동 계산 (반복 환불 패턴)
  - create_refund_request() RPC 함수
    - 자동 승인/대기 상태 결정
  - refund_stats_v2, refund_by_policy, refund_abuse_candidates 뷰
  - /api/admin/refunds API (목록/통계/정책/어뷰징 조회)
  - RefundDashboard 컴포넌트 (요청 처리 + 통계 + 정책 + 어뷰징)

### v1.6.0 (2025-12-17) - Loop 13 (Safety Net v2 강화)
- ✅ Loop 13: Safety Net v2 (soften logic) 강화
  - config.ts: 엄격도 설정 (strict/moderate/lenient)
  - softener-v2.ts: 향상된 규칙 기반 완화
    - IMPERATIVE_TO_DESCRIPTIVE: 권유형 → 설명형
    - GUARANTEE_TO_POSSIBILITY: 보장 → 가능성
    - EXTREME_TO_NEUTRAL: 극단 → 중립
  - /api/admin/safety: 모니터링 API
  - SafetyDashboard: 통계 + 정책 + 테스트 UI
  - 하이브리드 완화 (규칙 + LLM)
  - 신뢰도 기반 재시도 로직

### v1.5.0 (2025-12-17) - Loop 12 (퍼널 분석)
- ✅ Loop 12: 전환율 퍼널 분석 시스템
  - funnel_stages 테이블 (퍼널 단계 정의)
  - user_funnel_progress 테이블 (사용자별 퍼널 진행)
  - calculate_funnel_metrics() RPC 함수
  - get_funnel_by_cohort() RPC 함수
  - analytics_events/payment_orders 트리거 자동 업데이트
  - /api/admin/analytics/funnel API
  - FunnelDashboard 컴포넌트 (퍼널 시각화 + 코호트 + 인사이트)
  - 단계: signup → first_activity → first_purchase → repeat_purchase

### v1.4.0 (2025-12-17) - Loop 11 (ARPPU 분석)
- ✅ Loop 11: ARPPU 코호트 분석 시스템
  - user_revenue_summary 테이블 (사용자별 매출 요약)
  - calculate_arppu_by_cohort() RPC 함수
  - get_arppu_summary() RPC 함수
  - payment_orders 트리거 자동 업데이트
  - daily_revenue_summary 뷰
  - package_sales_summary 뷰
  - /api/admin/analytics/arppu API
  - ARPPUDashboard 컴포넌트 (KPI + 코호트 + 트렌드)
  - 지표: ARPPU, ARPU, Conversion Rate

### v1.3.0 (2025-12-17) - Loop 10 (리텐션 추적)
- ✅ Loop 10: D1/D7 리텐션 추적 시스템
  - user_cohorts 테이블 (가입일 기준 코호트)
  - user_daily_activity 테이블 (일별 활동)
  - calculate_retention_metrics() RPC 함수
  - get_retention_curve() RPC 함수
  - analytics_events 트리거 자동 기록
  - /api/admin/analytics/retention API
  - RetentionDashboard 컴포넌트 (KPI + 커브 + 코호트)
  - 목표: D1 > 40%, D7 > 20%

### v1.2.0 (2025-12-17) - Loop 7-9 (플러그인 풀가동)
- ✅ Loop 7: Slack Webhook 연동
  - 4가지 알림 타입 구현 완료 (DLQ, Circuit, Daily, Urgent)
  - 테스트 가이드 문서화
- ✅ Loop 8: GitHub Secrets 가이드
  - CI/CD용 5개 Secrets 정의
  - 설정 방법 문서화
- ✅ Loop 9: 베타 초대코드 시스템
  - beta_invite_codes 테이블 + RPC 함수
  - 100개 초대코드 자동 생성
  - 특별 캠페인 코드 3개 (influencer, early_bird, partner)
  - InviteCodeInput 컴포넌트

### v1.1.0 (2025-12-17) - Loop 5-6
- ✅ Loop 5: 데이터 ToS 검토 문서 업데이트
  - 대체 소스 전략 (Fallback) 추가
  - P0 게이트 완료 조건 명확화
  - 권장: 베타는 SEC EDGAR만 사용 (법적 리스크 0)
- ✅ Loop 6: Production 환경 설정 가이드 생성
  - Vercel 환경변수 13개 정의
  - GitHub Secrets 5개 정의
  - Slack Webhook 설정 가이드
  - 배포 체크리스트

### v1.0.0 (2025-12-17)
- ✅ P0-1: 결제 + 멱등성 완료
- ✅ P0-2: Rate Limit + Circuit Breaker 완료
- ✅ P0-3: Consent Gate 완료
- ✅ P0-4: 키움 "준비중" 완료
- ⚠️ P0-5: 데이터 ToS 검토 대기 → ✅ 완료 (옵션 B)

### 의사결정 로그
| 날짜 | 결정 | 근거 |
|------|------|------|
| 2025-12-17 | Circuit Breaker 4개 서킷 | AI/Payment/Broker/External 분리 |
| 2025-12-17 | Tiered Rate Limit | Free/Basic/Pro/Premium 차등 |
| 2025-12-17 | Consent Gate 필수화 | 법무 리스크 최소화 |

### 리스크 추적
| 리스크 | 확률 | 영향 | 완화 |
|--------|------|------|------|
| 데이터 라이선스 위반 | Medium | High | ToS 검토 + 대체 소스 |
| 전환율 10% 미달 | Medium | High | 온보딩 개선 + 가격 실험 |
| 경쟁사 모방 | High | Medium | 네트워크 효과 구축 |

---

## 7. 다음 ㄱ 실행 가이드

### 현재 상태
```
P0: ████████████████████ 100% (Loop 1-5 완료)
P1: ████████████████████ 100% (Loop 6-15 완료) ★ P1 완료!
P2: █████████████████░░░ 85% (Loop 16-24 완료)
```

### 다음 ㄱ 예상 작업
```
ㄱ      → Loop 25: 시리즈 A 준비 자료
ㄱ 배포  → vercel --prod 실행 (Production 배포)
```

### 우선순위 자동 조정 규칙
1. P0 미완료 → P0 우선
2. P0 완료 + 베타 런칭 → P1 순차 진행
3. 베타 2주 후 → P2 시작
4. 긴급 이슈 → ㄱ! 로 즉시 처리

---

*이 문서는 ㄱ 루프 진행에 따라 자동 업데이트됩니다.*
*마지막 업데이트: 2025-12-17*
