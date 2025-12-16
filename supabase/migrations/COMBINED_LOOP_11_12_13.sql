-- ============================================
-- Loop 11: Backtest Queue System
-- Migration: backtest_jobs 테이블 + Realtime
-- ============================================

-- backtest_jobs 테이블 생성
CREATE TABLE IF NOT EXISTS backtest_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id TEXT UNIQUE NOT NULL, -- BullMQ Job ID
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy_id UUID REFERENCES strategies(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  message TEXT, -- 진행률 메시지 ("데이터 로딩 중...", "백테스트 실행 중...")
  priority INTEGER DEFAULT 0, -- 0 (Free) | 1 (Basic) | 2 (Pro)
  result JSONB, -- 백테스트 결과 또는 에러
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_backtest_jobs_user ON backtest_jobs(user_id);
CREATE INDEX idx_backtest_jobs_status ON backtest_jobs(status);
CREATE INDEX idx_backtest_jobs_job_id ON backtest_jobs(job_id);
CREATE INDEX idx_backtest_jobs_created_at ON backtest_jobs(created_at DESC);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_backtest_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER backtest_jobs_updated_at
BEFORE UPDATE ON backtest_jobs
FOR EACH ROW
EXECUTE FUNCTION update_backtest_jobs_updated_at();

-- Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE backtest_jobs;

-- RLS (Row Level Security) 설정
ALTER TABLE backtest_jobs ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 잡만 조회 가능
CREATE POLICY "Users can view their own jobs"
  ON backtest_jobs FOR SELECT
  USING (auth.uid() = user_id);

-- 시스템(Service Role)은 모든 작업 가능
CREATE POLICY "Service role can do anything"
  ON backtest_jobs FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Helper Function: 사용자의 대기 중인 잡 개수 조회
CREATE OR REPLACE FUNCTION get_user_pending_jobs_count(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM backtest_jobs
  WHERE user_id = p_user_id
    AND status IN ('pending', 'active');
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper Function: 잡 생성 (멱등성 보장)
CREATE OR REPLACE FUNCTION create_backtest_job(
  p_user_id UUID,
  p_strategy_id UUID,
  p_job_id TEXT,
  p_timeframe TEXT,
  p_start_date TEXT,
  p_end_date TEXT,
  p_symbol TEXT
)
RETURNS backtest_jobs AS $$
DECLARE
  v_job backtest_jobs;
BEGIN
  -- 이미 존재하는 경우 반환
  SELECT * INTO v_job
  FROM backtest_jobs
  WHERE job_id = p_job_id;

  IF FOUND THEN
    RETURN v_job;
  END IF;

  -- 새로 생성
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

-- 코멘트 추가
COMMENT ON TABLE backtest_jobs IS 'Loop 11: BullMQ 백테스트 큐 시스템';
COMMENT ON COLUMN backtest_jobs.job_id IS 'BullMQ Job ID (unique)';
COMMENT ON COLUMN backtest_jobs.priority IS '0=Free, 1=Basic, 2=Pro (높을수록 우선)';
COMMENT ON COLUMN backtest_jobs.result IS '백테스트 결과 JSONB (completed) 또는 에러 메시지 (failed)';
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
-- ============================================
-- Loop 13: CS/환불 자동화
-- Migration: refund_requests + Helper Functions
-- ============================================

-- 1. refund_requests 테이블 생성
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

-- 인덱스 생성
CREATE INDEX idx_refund_requests_user ON refund_requests(user_id);
CREATE INDEX idx_refund_requests_status ON refund_requests(status);
CREATE INDEX idx_refund_requests_created ON refund_requests(created_at DESC);

-- 2. 환불 횟수 제한 함수 (1회/년)
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

-- 3. 환불 요청 생성 함수 (멱등성 보장)
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
  -- 1. 환불 자격 확인
  v_eligible := check_refund_eligibility(p_user_id);

  IF NOT v_eligible THEN
    RAISE EXCEPTION 'REFUND_LIMIT_EXCEEDED: 연간 1회 환불 제한 초과';
  END IF;

  -- 2. 중복 요청 확인
  SELECT * INTO v_request
  FROM refund_requests
  WHERE user_id = p_user_id
    AND payment_id = p_payment_id
    AND status IN ('pending', 'approved');

  IF FOUND THEN
    RETURN v_request;  -- 이미 존재하는 요청 반환
  END IF;

  -- 3. 새 요청 생성
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

-- 4. 환불 상태 업데이트 함수
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

-- 5. 사용자의 환불 이력 조회
CREATE OR REPLACE FUNCTION get_user_refund_history(p_user_id UUID)
RETURNS TABLE(
  request_id UUID,
  payment_id TEXT,
  amount INTEGER,
  reason TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    id,
    refund_requests.payment_id,
    refund_requests.amount,
    refund_requests.reason,
    refund_requests.status,
    refund_requests.created_at,
    refund_requests.completed_at
  FROM refund_requests
  WHERE user_id = p_user_id
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Admin: 대기 중인 환불 요청 조회
CREATE OR REPLACE FUNCTION get_pending_refunds(p_limit INTEGER DEFAULT 50)
RETURNS TABLE(
  request_id UUID,
  user_id UUID,
  user_email TEXT,
  payment_id TEXT,
  amount INTEGER,
  reason TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.user_id,
    u.email,
    r.payment_id,
    r.amount,
    r.reason,
    r.created_at
  FROM refund_requests r
  INNER JOIN auth.users u ON r.user_id = u.id
  WHERE r.status = 'pending'
  ORDER BY r.created_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 통계 조회
CREATE OR REPLACE FUNCTION get_refund_stats()
RETURNS TABLE(
  total_requests BIGINT,
  pending_count BIGINT,
  approved_count BIGINT,
  completed_count BIGINT,
  rejected_count BIGINT,
  total_refunded_amount BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'pending'),
    COUNT(*) FILTER (WHERE status = 'approved'),
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status = 'rejected'),
    COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0)
  FROM refund_requests;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. RLS (Row Level Security) 설정
ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 환불 요청만 조회 가능
CREATE POLICY "Users can view own refund requests"
  ON refund_requests FOR SELECT
  USING (auth.uid() = user_id);

-- 사용자는 자신의 환불 요청만 생성 가능
CREATE POLICY "Users can create own refund requests"
  ON refund_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin은 모든 환불 요청 조회/수정 가능
CREATE POLICY "Admins can manage all refund requests"
  ON refund_requests FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() ->> 'role' = 'service_role'
  );

-- 코멘트 추가
COMMENT ON TABLE refund_requests IS 'Loop 13: CS/환불 자동화 시스템';
COMMENT ON FUNCTION check_refund_eligibility(UUID) IS '환불 자격 확인 (1회/년 제한)';
COMMENT ON FUNCTION create_refund_request(UUID, TEXT, INTEGER, TEXT) IS '환불 요청 생성 (멱등성 보장)';
COMMENT ON FUNCTION update_refund_status(UUID, TEXT, TEXT, UUID) IS '환불 상태 업데이트';
COMMENT ON FUNCTION get_user_refund_history(UUID) IS '사용자 환불 이력 조회';
COMMENT ON FUNCTION get_pending_refunds(INTEGER) IS 'Admin: 대기 중인 환불 요청';
COMMENT ON FUNCTION get_refund_stats() IS '환불 통계';
