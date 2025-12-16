-- ============================================
-- Performance Optimization Complete Package
-- ============================================

-- Step 1: Add performance metric columns to backtest_results
ALTER TABLE backtest_results
ADD COLUMN IF NOT EXISTS total_return NUMERIC,
ADD COLUMN IF NOT EXISTS sharpe_ratio NUMERIC,
ADD COLUMN IF NOT EXISTS cagr NUMERIC,
ADD COLUMN IF NOT EXISTS max_drawdown NUMERIC,
ADD COLUMN IF NOT EXISTS win_rate NUMERIC,
ADD COLUMN IF NOT EXISTS profit_factor NUMERIC,
ADD COLUMN IF NOT EXISTS total_trades INTEGER;

-- Step 2: Backfill data from performance JSON (safe batch update)
UPDATE backtest_results
SET
  total_return = (performance ->> 'totalReturn')::numeric,
  sharpe_ratio = (performance ->> 'sharpeRatio')::numeric,
  cagr = (performance ->> 'cagr')::numeric,
  max_drawdown = (performance ->> 'maxDrawdown')::numeric,
  win_rate = (performance ->> 'winRate')::numeric,
  profit_factor = (performance ->> 'profitFactor')::numeric,
  total_trades = (performance ->> 'totalTrades')::integer
WHERE performance IS NOT NULL
  AND total_return IS NULL;

-- Step 3: Create indexes on performance columns
CREATE INDEX IF NOT EXISTS idx_backtest_results_strategy ON backtest_results(strategy_id);
CREATE INDEX IF NOT EXISTS idx_backtest_results_sharpe ON backtest_results(sharpe_ratio DESC) WHERE sharpe_ratio IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_backtest_results_cagr ON backtest_results(cagr DESC) WHERE cagr IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_backtest_results_return ON backtest_results(total_return DESC) WHERE total_return IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_backtest_results_created ON backtest_results(created_at DESC);

-- Step 4: Drop and recreate materialized view with optimized columns
DROP MATERIALIZED VIEW IF EXISTS strategy_performance_agg CASCADE;

CREATE MATERIALIZED VIEW strategy_performance_agg AS
SELECT
  s.id AS strategy_id,
  s.name AS strategy_name,
  s.user_id AS creator_id,
  s.description AS strategy_description,
  COUNT(b.id)::INTEGER AS backtest_count,
  ROUND(AVG(b.total_return), 2) AS avg_return,
  ROUND(AVG(b.sharpe_ratio), 2) AS avg_sharpe,
  ROUND(AVG(b.cagr), 2) AS avg_cagr,
  ROUND(AVG(b.max_drawdown), 2) AS avg_mdd,
  ROUND(AVG(b.win_rate), 2) AS avg_win_rate,
  ROUND(AVG(b.profit_factor), 2) AS avg_profit_factor,
  ROUND(AVG(b.total_trades::numeric), 2) AS avg_total_trades,
  RANK() OVER (ORDER BY AVG(b.sharpe_ratio) DESC NULLS LAST) AS rank_sharpe,
  RANK() OVER (ORDER BY AVG(b.cagr) DESC NULLS LAST) AS rank_cagr,
  RANK() OVER (ORDER BY AVG(b.total_return) DESC NULLS LAST) AS rank_return,
  MAX(b.created_at) AS last_backtest_at,
  MIN(b.created_at) AS first_backtest_at,
  s.created_at AS strategy_created_at,
  s.updated_at AS strategy_updated_at
FROM strategies s
INNER JOIN backtest_results b ON s.id = b.strategy_id
WHERE b.sharpe_ratio IS NOT NULL
  AND b.total_return IS NOT NULL
GROUP BY s.id, s.name, s.user_id, s.description, s.created_at, s.updated_at
HAVING COUNT(b.id) >= 1;

-- Step 5: Create unique index for CONCURRENTLY refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_strategy_perf_unique_strategy
  ON strategy_performance_agg(strategy_id);

-- Step 6: Create performance indexes on materialized view
CREATE INDEX IF NOT EXISTS idx_strategy_perf_sharpe ON strategy_performance_agg(avg_sharpe DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_strategy_perf_cagr ON strategy_performance_agg(avg_cagr DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_strategy_perf_return ON strategy_performance_agg(avg_return DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_strategy_perf_creator ON strategy_performance_agg(creator_id);
CREATE INDEX IF NOT EXISTS idx_strategy_perf_recent ON strategy_performance_agg(last_backtest_at DESC);
CREATE INDEX IF NOT EXISTS idx_strategy_perf_count ON strategy_performance_agg(backtest_count DESC);

-- Step 7: Recreate helper functions with optimized queries
CREATE OR REPLACE FUNCTION refresh_strategy_performance()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY strategy_performance_agg;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
    END DESC NULLS LAST
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Grant access to authenticated users
GRANT SELECT ON strategy_performance_agg TO authenticated;
GRANT EXECUTE ON FUNCTION get_strategy_performance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_leaderboard(TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_strategy_performance() TO service_role;

-- Step 9: Add comments
COMMENT ON MATERIALIZED VIEW strategy_performance_agg IS 'Optimized strategy performance aggregation with indexed numeric columns';
COMMENT ON FUNCTION refresh_strategy_performance() IS 'Refresh strategy performance view (service_role only)';
COMMENT ON FUNCTION get_strategy_performance(UUID) IS 'Get performance metrics for a specific strategy';
COMMENT ON FUNCTION get_leaderboard(TEXT, INTEGER, INTEGER) IS 'Get strategy leaderboard with sorting and pagination';
