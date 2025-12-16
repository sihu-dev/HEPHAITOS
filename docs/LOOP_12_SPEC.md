# Loop 12 Specification: 전략 성과 집계 시스템
**Strategy Performance Aggregation + Leaderboard**

작성일: 2025-12-16
목표 완료: 2026-01-05 (1주)
담당: Backend + Frontend
V3 9.7 → V4 9.8

---

## 🎯 목표 & 성공 지표

### 비즈니스 목표
- Copy 모드 활성화율 +30%
- 전환율 증가: 13.55% → **17.6%**
- 매출 증대: **+₩202,500/월**

### 기술 목표
- 전략 성과 자동 집계 (Materialized View)
- 실시간 리더보드 (Top 100)
- 다중 지표 필터링 (Sharpe, CAGR, MDD)

### 성공 지표 (KPI)
- ✅ 집계 쿼리 성능 <100ms
- ✅ 리더보드 API 응답 <200ms
- ✅ 1시간마다 자동 갱신
- ✅ 캐싱 적용 (1시간 TTL)

---

## 📐 데이터 모델

### Materialized View: strategy_performance_agg

```sql
CREATE MATERIALIZED VIEW strategy_performance_agg AS
SELECT
  s.id as strategy_id,
  s.name as strategy_name,
  s.user_id as creator_id,
  u.email as creator_email,
  u.username as creator_username,

  -- 성과 지표 집계
  COUNT(b.id) as backtest_count,
  AVG(b.total_return) as avg_return,
  AVG(b.sharpe_ratio) as avg_sharpe,
  AVG(b.cagr) as avg_cagr,
  AVG(b.max_drawdown) as avg_mdd,
  AVG(b.win_rate) as avg_win_rate,
  AVG(b.profit_factor) as avg_profit_factor,

  -- 랭킹 (각 지표별)
  RANK() OVER (ORDER BY AVG(b.sharpe_ratio) DESC) as rank_sharpe,
  RANK() OVER (ORDER BY AVG(b.cagr) DESC) as rank_cagr,
  RANK() OVER (ORDER BY AVG(b.total_return) DESC) as rank_return,

  -- 메타데이터
  MAX(b.created_at) as last_backtest_at,
  MIN(b.created_at) as first_backtest_at,
  s.created_at as strategy_created_at,
  s.is_public

FROM strategies s
INNER JOIN backtest_results b ON s.id = b.strategy_id
LEFT JOIN auth.users u ON s.user_id = u.id
WHERE b.status = 'completed'
  AND s.is_public = true  -- 공개 전략만
GROUP BY s.id, s.name, s.user_id, u.email, u.username, s.created_at, s.is_public
HAVING COUNT(b.id) >= 3;  -- 최소 3회 백테스트 필요

-- 인덱스 생성
CREATE INDEX idx_strategy_perf_sharpe ON strategy_performance_agg(avg_sharpe DESC);
CREATE INDEX idx_strategy_perf_cagr ON strategy_performance_agg(avg_cagr DESC);
CREATE INDEX idx_strategy_perf_return ON strategy_performance_agg(avg_return DESC);
CREATE INDEX idx_strategy_perf_creator ON strategy_performance_agg(creator_id);
```

### 자동 갱신 (1시간마다)

```sql
-- pg_cron 확장 설치
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 1시간마다 Materialized View 갱신
SELECT cron.schedule(
  'refresh-strategy-performance',
  '0 * * * *',  -- 매시간 0분
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY strategy_performance_agg$$
);
```

---

## 📝 API 설계

### GET /api/strategies/leaderboard

**Query Parameters:**
```typescript
{
  sortBy?: 'sharpe' | 'cagr' | 'return' | 'backtest_count';
  order?: 'asc' | 'desc';
  limit?: number;  // default 100, max 500
  offset?: number;  // pagination
  minBacktests?: number;  // default 3
  timeframe?: '1w' | '1m' | '3m' | 'all';  // filter by recent activity
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    strategies: [
      {
        strategyId: "uuid",
        strategyName: "Momentum Reversal",
        creatorId: "uuid",
        creatorUsername: "trader123",

        // 성과 지표
        backtestCount: 15,
        avgReturn: 23.5,
        avgSharpe: 1.85,
        avgCagr: 18.2,
        avgMdd: -12.3,
        avgWinRate: 62.5,
        avgProfitFactor: 2.1,

        // 랭킹
        rankSharpe: 5,
        rankCagr: 12,
        rankReturn: 8,

        // 메타
        lastBacktestAt: "2025-01-05T10:30:00Z",
        strategyCreatedAt: "2024-12-01T00:00:00Z",
      }
    ],
    pagination: {
      total: 450,
      limit: 100,
      offset: 0,
      hasMore: true
    },
    cachedAt: "2025-01-05T11:00:00Z"
  }
}
```

### GET /api/strategies/:id/performance

**Response:**
```typescript
{
  success: true,
  data: {
    strategyId: "uuid",
    strategyName: "Momentum Reversal",

    // 집계 성과
    aggregate: {
      backtestCount: 15,
      avgReturn: 23.5,
      avgSharpe: 1.85,
      avgCagr: 18.2,
      avgMdd: -12.3,
      rankSharpe: 5,
      rankCagr: 12,
    },

    // 개별 백테스트 히스토리
    history: [
      {
        backtestId: "uuid",
        totalReturn: 25.3,
        sharpeRatio: 1.92,
        createdAt: "2025-01-05T10:30:00Z"
      }
    ]
  }
}
```

---

## 🎨 Frontend 구현

### 리더보드 페이지

**경로:** `/strategies/leaderboard`

**레이아웃:**
```
┌─────────────────────────────────────────────────────────┐
│  🏆 전략 리더보드                            [필터] [정렬]│
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ #1  Momentum Reversal        ★ 평균 Sharpe 1.85│   │
│  │     @trader123  •  15 백테스트                  │   │
│  │     📈 +23.5%  •  🎯 CAGR 18.2%  •  📉 MDD -12%│   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ #2  RSI Divergence           ★ 평균 Sharpe 1.78│   │
│  │     @algo_master  •  22 백테스트                │   │
│  │     📈 +21.2%  •  🎯 CAGR 17.1%  •  📉 MDD -10%│   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ... (Top 100)                                           │
└─────────────────────────────────────────────────────────┘
```

### 컴포넌트 구조

```
/strategies/leaderboard/
├── page.tsx                    # 리더보드 메인 페이지
└── components/
    ├── LeaderboardFilters.tsx  # 필터 (sortBy, timeframe)
    ├── StrategyCard.tsx        # 전략 카드 (개별 항목)
    └── PerformanceMetrics.tsx  # 성과 지표 표시
```

---

## 🧪 테스트 계획

### 1. 성능 테스트

```sql
-- Materialized View 쿼리 성능
EXPLAIN ANALYZE
SELECT * FROM strategy_performance_agg
WHERE avg_sharpe > 1.5
ORDER BY avg_sharpe DESC
LIMIT 100;

-- 예상: <100ms
```

### 2. API 부하 테스트

```python
# locustfile.py
from locust import HttpUser, task

class LeaderboardUser(HttpUser):
    @task
    def get_leaderboard(self):
        self.client.get("/api/strategies/leaderboard?sortBy=sharpe&limit=100")
```

### 3. 캐싱 검증

```typescript
// Cache-Control 헤더 확인
const res = await fetch('/api/strategies/leaderboard');
console.log(res.headers.get('Cache-Control'));
// 예상: "public, max-age=3600, stale-while-revalidate=7200"
```

---

## 📊 ROI 분석

### 개발 비용
- 개발 시간: 1주
- 인프라 비용: ₩0 (Supabase 내 Materialized View)

### 예상 효과
- Copy 모드 활성화율: +30%
- 전환율 증가: 13.55% → 17.6%
- 매출 증대: **(17.6% - 13.55%) × 100명 × ₩50,000 = +₩202,500/월**
- ROI: **무한대** (인프라 비용 없음)

---

## 🚨 리스크 & 완화

### 리스크 1: Materialized View 갱신 지연

**영향**: 리더보드 데이터 최대 1시간 지연

**완화:**
- 캐시 TTL을 1시간으로 설정
- "마지막 업데이트" 시간 표시
- 수동 갱신 API 제공 (Admin 전용)

### 리스크 2: 전략 랭킹 알고리즘 논란

**영향**: 유저 불만 (순위 조작 의혹)

**완화:**
- 투명한 지표 공개 (Sharpe, CAGR, MDD)
- 최소 백테스트 요구 (3회)
- 공개 전략만 표시

### 리스크 3: 대용량 데이터 성능 이슈

**영향**: 쿼리 속도 저하 (>1초)

**완화:**
- Materialized View 사용 (사전 계산)
- 인덱스 최적화
- Pagination (최대 500개)

---

## 📚 참고 문서

- PostgreSQL Materialized Views: https://www.postgresql.org/docs/current/sql-creatematerializedview.html
- Supabase pg_cron: https://supabase.com/docs/guides/database/extensions/pg_cron
- Next.js Caching: https://nextjs.org/docs/app/building-your-application/caching

---

## 📋 체크리스트

### SQL (Backend)
- [ ] Materialized View 생성
- [ ] 인덱스 생성
- [ ] pg_cron 자동 갱신 설정
- [ ] RLS (Row Level Security) 설정

### API Routes
- [ ] `/api/strategies/leaderboard` GET
- [ ] `/api/strategies/:id/performance` GET
- [ ] 캐싱 적용 (1시간 TTL)
- [ ] Pagination 지원

### Frontend
- [ ] 리더보드 페이지 (`/strategies/leaderboard`)
- [ ] 필터 컴포넌트 (sortBy, timeframe)
- [ ] 전략 카드 컴포넌트
- [ ] 성과 지표 표시

### 테스트
- [ ] SQL 쿼리 성능 (<100ms)
- [ ] API 부하 테스트
- [ ] 캐싱 검증

---

**작성**: Claude Code (Sonnet 4.5)
**문서 버전**: 1.0
**최종 업데이트**: 2025-12-16
