-- ============================================
-- Loop 11: Backtest Queue System
-- Migration: backtest_jobs 테이블 + Realtime
-- ============================================

-- backtest_jobs 테이블 생성
CREATE TABLE IF NOT EXISTS backtest_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy_id UUID,
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  message TEXT,
  priority INTEGER DEFAULT 0,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_backtest_jobs_user ON backtest_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_backtest_jobs_status ON backtest_jobs(status);
CREATE INDEX IF NOT EXISTS idx_backtest_jobs_job_id ON backtest_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_backtest_jobs_created_at ON backtest_jobs(created_at DESC);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_backtest_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS backtest_jobs_updated_at ON backtest_jobs;
CREATE TRIGGER backtest_jobs_updated_at
BEFORE UPDATE ON backtest_jobs
FOR EACH ROW
EXECUTE FUNCTION update_backtest_jobs_updated_at();

-- RLS 설정
ALTER TABLE backtest_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own jobs" ON backtest_jobs;
CREATE POLICY "Users can view their own jobs"
  ON backtest_jobs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can do anything" ON backtest_jobs;
CREATE POLICY "Service role can do anything"
  ON backtest_jobs FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Helper Functions
CREATE OR REPLACE FUNCTION get_user_pending_jobs_count(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM backtest_jobs
  WHERE user_id = p_user_id
    AND status IN ('pending', 'active');
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_backtest_job(
  p_user_id UUID,
  p_strategy_id UUID,
  p_job_id TEXT,
  p_timeframe TEXT DEFAULT NULL,
  p_start_date TEXT DEFAULT NULL,
  p_end_date TEXT DEFAULT NULL,
  p_symbol TEXT DEFAULT NULL
)
RETURNS backtest_jobs AS $$
DECLARE
  v_job backtest_jobs;
BEGIN
  SELECT * INTO v_job
  FROM backtest_jobs
  WHERE job_id = p_job_id;

  IF FOUND THEN
    RETURN v_job;
  END IF;

  INSERT INTO backtest_jobs (
    job_id,
    user_id,
    strategy_id,
    status,
    progress,
    message
  ) VALUES (
    p_job_id,
    p_user_id,
    p_strategy_id,
    'pending',
    0,
    '대기 중...'
  )
  RETURNING * INTO v_job;

  RETURN v_job;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Loop 12: Strategy Performance Aggregation
-- Migration: Materialized View + Auto Refresh
-- ============================================

-- strategies 테이블 생성 (없는 경우)
CREATE TABLE IF NOT EXISTS strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- backtest_results 테이블 생성 (없는 경우)
CREATE TABLE IF NOT EXISTS backtest_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  strategy_id UUID REFERENCES strategies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  total_return NUMERIC,
  sharpe_ratio NUMERIC,
  cagr NUMERIC,
  max_drawdown NUMERIC,
  win_rate NUMERIC,
  profit_factor NUMERIC,
  total_trades INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Materialized View 삭제 후 재생성
DROP MATERIALIZED VIEW IF EXISTS strategy_performance_agg CASCADE;

CREATE MATERIALIZED VIEW strategy_performance_agg AS
SELECT
  s.id as strategy_id,
  s.name as strategy_name,
  s.user_id as creator_id,
  s.description as strategy_description,
  COUNT(b.id)::INTEGER as backtest_count,
  ROUND(AVG(b.total_return)::numeric, 2) as avg_return,
  ROUND(AVG(b.sharpe_ratio)::numeric, 2) as avg_sharpe,
  ROUND(AVG(b.cagr)::numeric, 2) as avg_cagr,
  ROUND(AVG(b.max_drawdown)::numeric, 2) as avg_mdd,
  ROUND(AVG(b.win_rate)::numeric, 2) as avg_win_rate,
  ROUND(AVG(b.profit_factor)::numeric, 2) as avg_profit_factor,
  ROUND(AVG(b.total_trades)::numeric, 2) as avg_total_trades,
  RANK() OVER (ORDER BY AVG(b.sharpe_ratio) DESC) as rank_sharpe,
  RANK() OVER (ORDER BY AVG(b.cagr) DESC) as rank_cagr,
  RANK() OVER (ORDER BY AVG(b.total_return) DESC) as rank_return,
  MAX(b.created_at) as last_backtest_at,
  MIN(b.created_at) as first_backtest_at,
  s.created_at as strategy_created_at,
  s.is_public,
  s.updated_at as strategy_updated_at
FROM strategies s
LEFT JOIN backtest_results b ON s.id = b.strategy_id AND b.status = 'completed'
WHERE s.is_public = true
GROUP BY s.id, s.name, s.user_id, s.description, s.created_at, s.is_public, s.updated_at
HAVING COUNT(b.id) >= 1;

-- UNIQUE INDEX 생성 (CONCURRENTLY refresh를 위해 필요)
CREATE UNIQUE INDEX IF NOT EXISTS idx_strategy_perf_strategy_id
  ON strategy_performance_agg(strategy_id);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_strategy_perf_sharpe ON strategy_performance_agg(avg_sharpe DESC);
CREATE INDEX IF NOT EXISTS idx_strategy_perf_cagr ON strategy_performance_agg(avg_cagr DESC);
CREATE INDEX IF NOT EXISTS idx_strategy_perf_return ON strategy_performance_agg(avg_return DESC);
CREATE INDEX IF NOT EXISTS idx_strategy_perf_creator ON strategy_performance_agg(creator_id);
CREATE INDEX IF NOT EXISTS idx_strategy_perf_recent ON strategy_performance_agg(last_backtest_at DESC);

-- Helper Functions
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

-- ============================================
-- Loop 13: CS/환불 자동화
-- Migration: refund_requests + Helper Functions
-- ============================================

CREATE TABLE IF NOT EXISTS refund_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_id TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  reason TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'failed')),
  admin_note TEXT,
  processed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_refund_requests_user ON refund_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON refund_requests(status);
CREATE INDEX IF NOT EXISTS idx_refund_requests_created ON refund_requests(created_at DESC);

CREATE OR REPLACE FUNCTION check_refund_eligibility(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) < 1
    FROM refund_requests
    WHERE user_id = p_user_id
      AND status = 'completed'
      AND created_at > NOW() - INTERVAL '1 year'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_refund_request(
  p_user_id UUID,
  p_payment_id TEXT,
  p_amount INTEGER,
  p_reason TEXT DEFAULT NULL
)
RETURNS refund_requests AS $$
DECLARE
  v_request refund_requests;
  v_eligible BOOLEAN;
BEGIN
  v_eligible := check_refund_eligibility(p_user_id);

  IF NOT v_eligible THEN
    RAISE EXCEPTION 'REFUND_LIMIT_EXCEEDED: 연간 1회 환불 제한 초과';
  END IF;

  SELECT * INTO v_request
  FROM refund_requests
  WHERE user_id = p_user_id
    AND payment_id = p_payment_id
    AND status IN ('pending', 'approved');

  IF FOUND THEN
    RETURN v_request;
  END IF;

  INSERT INTO refund_requests (
    user_id,
    payment_id,
    amount,
    reason,
    status
  ) VALUES (
    p_user_id,
    p_payment_id,
    p_amount,
    p_reason,
    'pending'
  )
  RETURNING * INTO v_request;

  RETURN v_request;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_refund_status(
  p_request_id UUID,
  p_status TEXT,
  p_admin_note TEXT DEFAULT NULL,
  p_processed_by UUID DEFAULT NULL
)
RETURNS refund_requests AS $$
DECLARE
  v_request refund_requests;
BEGIN
  UPDATE refund_requests
  SET
    status = p_status,
    admin_note = COALESCE(p_admin_note, admin_note),
    processed_by = COALESCE(p_processed_by, processed_by),
    processed_at = CASE
      WHEN p_status IN ('approved', 'rejected') THEN NOW()
      ELSE processed_at
    END,
    completed_at = CASE
      WHEN p_status IN ('completed', 'failed') THEN NOW()
      ELSE completed_at
    END
  WHERE id = p_request_id
  RETURNING * INTO v_request;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'REFUND_REQUEST_NOT_FOUND';
  END IF;

  RETURN v_request;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS 설정
ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own refund requests" ON refund_requests;
CREATE POLICY "Users can view own refund requests"
  ON refund_requests FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own refund requests" ON refund_requests;
CREATE POLICY "Users can create own refund requests"
  ON refund_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all refund requests" ON refund_requests;
CREATE POLICY "Admins can manage all refund requests"
  ON refund_requests FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() ->> 'role' = 'service_role'
  );
