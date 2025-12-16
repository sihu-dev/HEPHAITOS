-- ============================================
-- Loop 12: Strategy Performance Aggregation
-- Migration: Materialized View + Auto Refresh
-- ============================================

-- 1. Materialized View 생성
CREATE MATERIALIZED VIEW IF NOT EXISTS strategy_performance_agg AS
SELECT
  s.id as strategy_id,
  s.name as strategy_name,
  s.user_id as creator_id,
  s.description as strategy_description,

  -- 성과 지표 집계
  COUNT(b.id)::INTEGER as backtest_count,
  ROUND(AVG(b.total_return)::numeric, 2) as avg_return,
  ROUND(AVG(b.sharpe_ratio)::numeric, 2) as avg_sharpe,
  ROUND(AVG(b.cagr)::numeric, 2) as avg_cagr,
  ROUND(AVG(b.max_drawdown)::numeric, 2) as avg_mdd,
  ROUND(AVG(b.win_rate)::numeric, 2) as avg_win_rate,
  ROUND(AVG(b.profit_factor)::numeric, 2) as avg_profit_factor,
  ROUND(AVG(b.total_trades)::numeric, 2) as avg_total_trades,

  -- 최근 성과 (최근 5개 백테스트)
  (
    SELECT ROUND(AVG(total_return)::numeric, 2)
    FROM (
      SELECT total_return
      FROM backtest_results br
      WHERE br.strategy_id = s.id
        AND br.status = 'completed'
      ORDER BY br.created_at DESC
      LIMIT 5
    ) recent
  ) as recent_avg_return,

  -- 랭킹 (각 지표별)
  RANK() OVER (ORDER BY AVG(b.sharpe_ratio) DESC) as rank_sharpe,
  RANK() OVER (ORDER BY AVG(b.cagr) DESC) as rank_cagr,
  RANK() OVER (ORDER BY AVG(b.total_return) DESC) as rank_return,

  -- 메타데이터
  MAX(b.created_at) as last_backtest_at,
  MIN(b.created_at) as first_backtest_at,
  s.created_at as strategy_created_at,
  s.is_public,
  s.updated_at as strategy_updated_at

FROM strategies s
INNER JOIN backtest_results b
  ON s.id = b.strategy_id
WHERE b.status = 'completed'
  AND s.is_public = true  -- 공개 전략만
GROUP BY
  s.id,
  s.name,
  s.user_id,
  s.description,
  s.created_at,
  s.is_public,
  s.updated_at
HAVING COUNT(b.id) >= 3;  -- 최소 3회 백테스트 필요

-- 2. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_strategy_perf_sharpe
  ON strategy_performance_agg(avg_sharpe DESC);

CREATE INDEX IF NOT EXISTS idx_strategy_perf_cagr
  ON strategy_performance_agg(avg_cagr DESC);

CREATE INDEX IF NOT EXISTS idx_strategy_perf_return
  ON strategy_performance_agg(avg_return DESC);

CREATE INDEX IF NOT EXISTS idx_strategy_perf_creator
  ON strategy_performance_agg(creator_id);

CREATE INDEX IF NOT EXISTS idx_strategy_perf_recent
  ON strategy_performance_agg(last_backtest_at DESC);

-- 3. pg_cron 확장 설치 (자동 갱신용)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 4. 1시간마다 Materialized View 자동 갱신
SELECT cron.schedule(
  'refresh-strategy-performance',
  '0 * * * *',  -- 매시간 0분에 실행
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY strategy_performance_agg$$
);

-- 5. 수동 갱신 함수 (Admin 전용)
CREATE OR REPLACE FUNCTION refresh_strategy_performance()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY strategy_performance_agg;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Helper Function: 특정 전략의 성과 조회
CREATE OR REPLACE FUNCTION get_strategy_performance(p_strategy_id UUID)
RETURNS TABLE(
  strategy_id UUID,
  strategy_name TEXT,
  backtest_count INTEGER,
  avg_return NUMERIC,
  avg_sharpe NUMERIC,
  avg_cagr NUMERIC,
  rank_sharpe BIGINT,
  rank_cagr BIGINT,
  last_backtest_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    spa.strategy_id,
    spa.strategy_name,
    spa.backtest_count,
    spa.avg_return,
    spa.avg_sharpe,
    spa.avg_cagr,
    spa.rank_sharpe,
    spa.rank_cagr,
    spa.last_backtest_at
  FROM strategy_performance_agg spa
  WHERE spa.strategy_id = p_strategy_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Helper Function: 리더보드 조회 (Top N)
CREATE OR REPLACE FUNCTION get_leaderboard(
  p_sort_by TEXT DEFAULT 'sharpe',
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  strategy_id UUID,
  strategy_name TEXT,
  creator_id UUID,
  backtest_count INTEGER,
  avg_return NUMERIC,
  avg_sharpe NUMERIC,
  avg_cagr NUMERIC,
  avg_mdd NUMERIC,
  rank_sharpe BIGINT,
  rank_cagr BIGINT,
  last_backtest_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    spa.strategy_id,
    spa.strategy_name,
    spa.creator_id,
    spa.backtest_count,
    spa.avg_return,
    spa.avg_sharpe,
    spa.avg_cagr,
    spa.avg_mdd,
    spa.rank_sharpe,
    spa.rank_cagr,
    spa.last_backtest_at
  FROM strategy_performance_agg spa
  ORDER BY
    CASE
      WHEN p_sort_by = 'sharpe' THEN spa.avg_sharpe
      WHEN p_sort_by = 'cagr' THEN spa.avg_cagr
      WHEN p_sort_by = 'return' THEN spa.avg_return
      WHEN p_sort_by = 'backtest_count' THEN spa.backtest_count::NUMERIC
      ELSE spa.avg_sharpe
    END DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 초기 데이터 로드 (첫 갱신)
REFRESH MATERIALIZED VIEW CONCURRENTLY strategy_performance_agg;

-- 코멘트 추가
COMMENT ON MATERIALIZED VIEW strategy_performance_agg IS 'Loop 12: 전략 성과 집계 (1시간마다 자동 갱신)';
COMMENT ON FUNCTION get_strategy_performance(UUID) IS '특정 전략의 성과 조회';
COMMENT ON FUNCTION get_leaderboard(TEXT, INTEGER, INTEGER) IS '리더보드 조회 (Top N, 정렬)';
COMMENT ON FUNCTION refresh_strategy_performance() IS '수동 갱신 (Admin 전용)';
