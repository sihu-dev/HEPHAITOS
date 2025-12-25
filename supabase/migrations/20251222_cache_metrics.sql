-- ============================================
-- Claude Prompt Caching Metrics Table
-- 비용 절감 추적 및 모니터링
-- ============================================

-- cache_metrics 테이블 생성
CREATE TABLE IF NOT EXISTS cache_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- 토큰 사용량
  cache_creation_tokens INTEGER DEFAULT 0 NOT NULL,
  cache_read_tokens INTEGER DEFAULT 0 NOT NULL,
  input_tokens INTEGER DEFAULT 0 NOT NULL,
  output_tokens INTEGER DEFAULT 0 NOT NULL,

  -- 비용 계산
  total_cost DECIMAL(10, 4) DEFAULT 0 NOT NULL,
  cost_without_cache DECIMAL(10, 4) DEFAULT 0 NOT NULL,
  cost_saved DECIMAL(10, 4) DEFAULT 0 NOT NULL,
  savings_percent DECIMAL(5, 2) DEFAULT 0 NOT NULL,

  -- 메타데이터
  endpoint TEXT NOT NULL,
  model TEXT NOT NULL,
  user_tier user_tier,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- 인덱스 최적화
  CONSTRAINT cache_metrics_tokens_positive CHECK (
    cache_creation_tokens >= 0 AND
    cache_read_tokens >= 0 AND
    input_tokens >= 0 AND
    output_tokens >= 0
  )
);

-- 인덱스 생성 (쿼리 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_cache_metrics_created_at
  ON cache_metrics(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cache_metrics_endpoint
  ON cache_metrics(endpoint);

CREATE INDEX IF NOT EXISTS idx_cache_metrics_user_id
  ON cache_metrics(user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cache_metrics_model
  ON cache_metrics(model);

-- 복합 인덱스 (날짜 + 엔드포인트)
CREATE INDEX IF NOT EXISTS idx_cache_metrics_created_endpoint
  ON cache_metrics(created_at DESC, endpoint);

-- RLS (Row Level Security) 정책
ALTER TABLE cache_metrics ENABLE ROW LEVEL SECURITY;

-- 관리자만 전체 조회 가능
CREATE POLICY "Admins can view all cache metrics"
  ON cache_metrics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- 사용자는 본인 데이터만 조회 가능
CREATE POLICY "Users can view own cache metrics"
  ON cache_metrics
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 서비스 롤만 삽입 가능 (API에서 호출)
CREATE POLICY "Service role can insert cache metrics"
  ON cache_metrics
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ============================================
-- 통계 뷰 (Materialized View)
-- ============================================

-- 일별 캐시 통계
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_cache_stats AS
SELECT
  DATE(created_at) AS date,
  endpoint,
  COUNT(*) AS total_requests,
  SUM(CASE WHEN cache_read_tokens > 0 THEN 1 ELSE 0 END) AS cache_hits,
  ROUND(
    100.0 * SUM(CASE WHEN cache_read_tokens > 0 THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0),
    2
  ) AS hit_rate_percent,
  SUM(cache_creation_tokens) AS total_cache_creation_tokens,
  SUM(cache_read_tokens) AS total_cache_read_tokens,
  SUM(input_tokens) AS total_input_tokens,
  SUM(output_tokens) AS total_output_tokens,
  SUM(total_cost) AS total_cost_usd,
  SUM(cost_saved) AS total_saved_usd,
  ROUND(
    100.0 * SUM(cost_saved) / NULLIF(SUM(cost_without_cache), 0),
    2
  ) AS savings_percent
FROM cache_metrics
GROUP BY DATE(created_at), endpoint;

-- 인덱스 (Materialized View)
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_cache_stats_date_endpoint
  ON daily_cache_stats(date DESC, endpoint);

-- Materialized View 자동 갱신 (매일 자정)
-- Supabase에서는 pg_cron 확장 사용
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'refresh-daily-cache-stats',
  '0 0 * * *', -- 매일 자정
  'REFRESH MATERIALIZED VIEW CONCURRENTLY daily_cache_stats;'
);

-- ============================================
-- 편의 함수 (Helper Functions)
-- ============================================

-- 최근 N일간 캐시 히트율 계산
CREATE OR REPLACE FUNCTION get_cache_hit_rate(days INTEGER DEFAULT 7)
RETURNS TABLE (
  total_requests BIGINT,
  cache_hits BIGINT,
  hit_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_requests,
    SUM(CASE WHEN cache_read_tokens > 0 THEN 1 ELSE 0 END)::BIGINT AS cache_hits,
    ROUND(
      100.0 * SUM(CASE WHEN cache_read_tokens > 0 THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0),
      2
    ) AS hit_rate
  FROM cache_metrics
  WHERE created_at >= NOW() - INTERVAL '1 day' * days;
END;
$$ LANGUAGE plpgsql;

-- 최근 N일간 총 절감액 계산
CREATE OR REPLACE FUNCTION get_total_savings(days INTEGER DEFAULT 7)
RETURNS TABLE (
  total_cost NUMERIC,
  total_cost_without_cache NUMERIC,
  total_saved NUMERIC,
  savings_percent NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROUND(SUM(cm.total_cost), 2) AS total_cost,
    ROUND(SUM(cm.cost_without_cache), 2) AS total_cost_without_cache,
    ROUND(SUM(cm.cost_saved), 2) AS total_saved,
    ROUND(
      100.0 * SUM(cm.cost_saved) / NULLIF(SUM(cm.cost_without_cache), 0),
      2
    ) AS savings_percent
  FROM cache_metrics cm
  WHERE created_at >= NOW() - INTERVAL '1 day' * days;
END;
$$ LANGUAGE plpgsql;

-- 엔드포인트별 성능
CREATE OR REPLACE FUNCTION get_cache_performance_by_endpoint(days INTEGER DEFAULT 7)
RETURNS TABLE (
  endpoint TEXT,
  requests BIGINT,
  cache_hit_rate NUMERIC,
  total_saved NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cm.endpoint,
    COUNT(*)::BIGINT AS requests,
    ROUND(
      100.0 * SUM(CASE WHEN cache_read_tokens > 0 THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0),
      2
    ) AS cache_hit_rate,
    ROUND(SUM(cm.cost_saved), 2) AS total_saved
  FROM cache_metrics cm
  WHERE created_at >= NOW() - INTERVAL '1 day' * days
  GROUP BY cm.endpoint
  ORDER BY total_saved DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 샘플 데이터 (테스트용)
-- ============================================

-- 개발 환경에서만 실행
DO $$
BEGIN
  IF current_database() LIKE '%dev%' OR current_database() LIKE '%test%' THEN
    INSERT INTO cache_metrics (
      cache_creation_tokens,
      cache_read_tokens,
      input_tokens,
      output_tokens,
      total_cost,
      cost_without_cache,
      cost_saved,
      savings_percent,
      endpoint,
      model,
      created_at
    ) VALUES
    (3000, 0, 100, 500, 0.0191, 0.0243, 0.0052, 21.4, '/api/ai/strategy', 'claude-sonnet-4-5', NOW() - INTERVAL '1 hour'),
    (0, 3000, 100, 500, 0.0086, 0.0243, 0.0157, 64.6, '/api/ai/strategy', 'claude-sonnet-4-5', NOW() - INTERVAL '30 minutes'),
    (0, 3000, 100, 600, 0.0101, 0.0300, 0.0199, 66.3, '/api/ai/tutor', 'claude-sonnet-4-5', NOW() - INTERVAL '15 minutes'),
    (2000, 0, 50, 400, 0.0135, 0.0162, 0.0027, 16.7, '/api/market/analyze', 'claude-opus-4-5', NOW() - INTERVAL '5 minutes');

    RAISE NOTICE 'Sample cache metrics inserted for testing';
  END IF;
END $$;

-- ============================================
-- 권한 설정
-- ============================================

-- service_role에게 모든 권한 부여
GRANT ALL ON cache_metrics TO service_role;
GRANT ALL ON daily_cache_stats TO service_role;

-- authenticated 사용자에게 읽기 권한
GRANT SELECT ON cache_metrics TO authenticated;
GRANT SELECT ON daily_cache_stats TO authenticated;

-- anon 사용자는 접근 불가
REVOKE ALL ON cache_metrics FROM anon;
REVOKE ALL ON daily_cache_stats FROM anon;

-- ============================================
-- 코멘트 (문서화)
-- ============================================

COMMENT ON TABLE cache_metrics IS 'Claude Prompt Caching 사용량 및 비용 절감 추적';
COMMENT ON COLUMN cache_metrics.cache_creation_tokens IS '캐시 생성 시 입력 토큰 ($3.75/MTok)';
COMMENT ON COLUMN cache_metrics.cache_read_tokens IS '캐시 읽기 시 토큰 ($0.375/MTok, 90% 할인)';
COMMENT ON COLUMN cache_metrics.input_tokens IS '일반 입력 토큰 ($3/MTok)';
COMMENT ON COLUMN cache_metrics.output_tokens IS '출력 토큰 ($15/MTok)';
COMMENT ON COLUMN cache_metrics.total_cost IS '실제 비용 (캐싱 적용)';
COMMENT ON COLUMN cache_metrics.cost_without_cache IS '캐싱 없었을 경우 비용';
COMMENT ON COLUMN cache_metrics.cost_saved IS '절감된 비용';
COMMENT ON COLUMN cache_metrics.savings_percent IS '절감률 (%)';

COMMENT ON FUNCTION get_cache_hit_rate IS '최근 N일간 캐시 히트율 계산';
COMMENT ON FUNCTION get_total_savings IS '최근 N일간 총 절감액 계산';
COMMENT ON FUNCTION get_cache_performance_by_endpoint IS '엔드포인트별 캐시 성능 분석';
