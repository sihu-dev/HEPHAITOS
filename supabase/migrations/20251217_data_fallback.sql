-- ============================================
-- Data Fallback System
-- Loop 19: 데이터 Fallback 설계
-- ============================================

-- 1) 데이터 소스 정의 테이블
CREATE TABLE IF NOT EXISTS data_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,  -- 'congress', 'insider', 'market', 'sec'
  base_url TEXT,
  is_paid BOOLEAN DEFAULT false,
  monthly_cost NUMERIC(10,2) DEFAULT 0,
  rate_limit_requests INTEGER DEFAULT 100,
  rate_limit_window INTEGER DEFAULT 60,  -- seconds
  priority INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 기본 데이터 소스 정의
INSERT INTO data_sources (id, name, description, category, base_url, is_paid, monthly_cost, rate_limit_requests, priority) VALUES
  ('unusual_whales', 'Unusual Whales', '의원 거래 및 옵션 데이터', 'congress', 'https://api.unusualwhales.com', true, 999, 100, 1),
  ('quiver', 'Quiver Quantitative', '대안 데이터 (의회, 특허 등)', 'congress', 'https://api.quiverquant.com', true, 499, 60, 2),
  ('sec_edgar', 'SEC EDGAR', 'SEC 공시 데이터', 'sec', 'https://data.sec.gov', false, 0, 10, 3),
  ('openinsider', 'OpenInsider', '내부자 거래 (무료)', 'insider', 'http://openinsider.com', false, 0, 30, 4),
  ('finnhub', 'Finnhub', '실시간 시세 및 뉴스', 'market', 'https://finnhub.io', false, 0, 60, 1),
  ('alpha_vantage', 'Alpha Vantage', '주가 및 기술 지표', 'market', 'https://www.alphavantage.co', false, 0, 5, 2),
  ('yahoo_finance', 'Yahoo Finance', '주가 데이터 (비공식)', 'market', 'https://query1.finance.yahoo.com', false, 0, 100, 3)
ON CONFLICT (id) DO NOTHING;

-- 2) 데이터 소스 상태 로그
CREATE TABLE IF NOT EXISTS data_source_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id TEXT NOT NULL REFERENCES data_sources(id),
  status TEXT NOT NULL CHECK (status IN ('success', 'failure', 'timeout', 'rate_limited')),
  latency_ms INTEGER,
  error_message TEXT,
  request_type TEXT,  -- 'congress_trades', 'stock_quote', etc.
  cached BOOLEAN DEFAULT false,
  used_fallback BOOLEAN DEFAULT false,
  fallback_source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_source_logs_source ON data_source_logs(source_id);
CREATE INDEX IF NOT EXISTS idx_source_logs_status ON data_source_logs(status);
CREATE INDEX IF NOT EXISTS idx_source_logs_created ON data_source_logs(created_at DESC);

-- 3) 데이터 캐시 테이블
CREATE TABLE IF NOT EXISTS data_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  source_id TEXT REFERENCES data_sources(id),
  data_type TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_data_cache_key ON data_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_data_cache_expires ON data_cache(expires_at);

-- 4) Fallback 규칙 테이블
CREATE TABLE IF NOT EXISTS data_fallback_rules (
  id SERIAL PRIMARY KEY,
  data_type TEXT NOT NULL,
  source_priority TEXT[] NOT NULL,  -- 순서대로 시도할 소스들
  cache_ttl_seconds INTEGER DEFAULT 300,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(data_type)
);

-- 기본 Fallback 규칙
INSERT INTO data_fallback_rules (data_type, source_priority, cache_ttl_seconds) VALUES
  ('congress_trades', ARRAY['unusual_whales', 'quiver', 'sec_edgar'], 300),
  ('insider_trades', ARRAY['unusual_whales', 'openinsider', 'sec_edgar'], 300),
  ('stock_quote', ARRAY['finnhub', 'alpha_vantage', 'yahoo_finance'], 60),
  ('sec_filings', ARRAY['sec_edgar'], 600),
  ('market_data', ARRAY['finnhub', 'alpha_vantage', 'yahoo_finance'], 60)
ON CONFLICT (data_type) DO NOTHING;

-- 5) 소스 상태 집계 뷰
CREATE OR REPLACE VIEW data_source_health AS
SELECT
  ds.id,
  ds.name,
  ds.category,
  ds.is_active,
  ds.priority,
  -- 최근 1시간 통계
  COUNT(dsl.id) as total_requests_1h,
  COUNT(dsl.id) FILTER (WHERE dsl.status = 'success') as success_count_1h,
  COUNT(dsl.id) FILTER (WHERE dsl.status = 'failure') as failure_count_1h,
  ROUND(100.0 * COUNT(dsl.id) FILTER (WHERE dsl.status = 'success') / NULLIF(COUNT(dsl.id), 0), 2) as success_rate_1h,
  ROUND(AVG(dsl.latency_ms)) as avg_latency_1h,
  MAX(dsl.created_at) as last_request
FROM data_sources ds
LEFT JOIN data_source_logs dsl ON ds.id = dsl.source_id
  AND dsl.created_at >= NOW() - INTERVAL '1 hour'
GROUP BY ds.id, ds.name, ds.category, ds.is_active, ds.priority
ORDER BY ds.category, ds.priority;

-- 6) 일별 소스 통계 뷰
CREATE OR REPLACE VIEW daily_source_stats AS
SELECT
  DATE(dsl.created_at) as date,
  dsl.source_id,
  ds.name as source_name,
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE dsl.status = 'success') as success_count,
  COUNT(*) FILTER (WHERE dsl.status = 'failure') as failure_count,
  COUNT(*) FILTER (WHERE dsl.cached) as cache_hits,
  COUNT(*) FILTER (WHERE dsl.used_fallback) as fallback_used,
  ROUND(AVG(dsl.latency_ms)) as avg_latency,
  MAX(dsl.latency_ms) as max_latency
FROM data_source_logs dsl
JOIN data_sources ds ON dsl.source_id = ds.id
WHERE dsl.created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(dsl.created_at), dsl.source_id, ds.name
ORDER BY date DESC, source_id;

-- 7) 소스 상태 기록 함수
CREATE OR REPLACE FUNCTION log_data_source_request(
  p_source_id TEXT,
  p_status TEXT,
  p_latency_ms INTEGER DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_request_type TEXT DEFAULT NULL,
  p_cached BOOLEAN DEFAULT false,
  p_used_fallback BOOLEAN DEFAULT false,
  p_fallback_source TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO data_source_logs (
    source_id, status, latency_ms, error_message,
    request_type, cached, used_fallback, fallback_source
  ) VALUES (
    p_source_id, p_status, p_latency_ms, p_error_message,
    p_request_type, p_cached, p_used_fallback, p_fallback_source
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- 8) 캐시 관리 함수
CREATE OR REPLACE FUNCTION get_cached_data(p_cache_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_data JSONB;
BEGIN
  SELECT data INTO v_data
  FROM data_cache
  WHERE cache_key = p_cache_key
    AND expires_at > NOW();

  RETURN v_data;
END;
$$;

CREATE OR REPLACE FUNCTION set_cached_data(
  p_cache_key TEXT,
  p_source_id TEXT,
  p_data_type TEXT,
  p_data JSONB,
  p_ttl_seconds INTEGER DEFAULT 300
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO data_cache (cache_key, source_id, data_type, data, expires_at)
  VALUES (p_cache_key, p_source_id, p_data_type, p_data, NOW() + (p_ttl_seconds || ' seconds')::INTERVAL)
  ON CONFLICT (cache_key)
  DO UPDATE SET
    source_id = p_source_id,
    data = p_data,
    expires_at = NOW() + (p_ttl_seconds || ' seconds')::INTERVAL;
END;
$$;

-- 만료된 캐시 정리
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM data_cache
  WHERE expires_at < NOW();

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- 9) 소스 가용성 계산 함수
CREATE OR REPLACE FUNCTION get_source_availability(p_source_id TEXT, p_hours INTEGER DEFAULT 24)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total INTEGER;
  v_success INTEGER;
  v_availability NUMERIC;
  v_avg_latency INTEGER;
  v_last_success TIMESTAMPTZ;
  v_last_failure TIMESTAMPTZ;
BEGIN
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'success'),
    ROUND(AVG(latency_ms)),
    MAX(created_at) FILTER (WHERE status = 'success'),
    MAX(created_at) FILTER (WHERE status = 'failure')
  INTO v_total, v_success, v_avg_latency, v_last_success, v_last_failure
  FROM data_source_logs
  WHERE source_id = p_source_id
    AND created_at >= NOW() - (p_hours || ' hours')::INTERVAL;

  v_availability := CASE WHEN v_total > 0 THEN ROUND(100.0 * v_success / v_total, 2) ELSE 100 END;

  RETURN jsonb_build_object(
    'source_id', p_source_id,
    'period_hours', p_hours,
    'total_requests', v_total,
    'success_count', v_success,
    'availability_percent', v_availability,
    'avg_latency_ms', v_avg_latency,
    'last_success', v_last_success,
    'last_failure', v_last_failure,
    'is_healthy', v_availability >= 90 OR v_total = 0
  );
END;
$$;

-- 10) RLS 정책
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_source_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_fallback_rules ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 소스 정보 조회 가능
CREATE POLICY "Anyone can view data sources" ON data_sources FOR SELECT USING (true);
CREATE POLICY "Anyone can view fallback rules" ON data_fallback_rules FOR SELECT USING (true);

-- 관리자만 로그 및 캐시 관리
CREATE POLICY "Admins can view logs" ON data_source_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'));

CREATE POLICY "Admins can manage cache" ON data_cache FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'));

-- 11) 권한 부여
GRANT SELECT ON data_source_health TO authenticated;
GRANT SELECT ON daily_source_stats TO authenticated;
GRANT EXECUTE ON FUNCTION log_data_source_request TO authenticated;
GRANT EXECUTE ON FUNCTION get_cached_data TO authenticated;
GRANT EXECUTE ON FUNCTION set_cached_data TO authenticated;
GRANT EXECUTE ON FUNCTION get_source_availability TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_cache TO authenticated;

-- 코멘트
COMMENT ON TABLE data_sources IS '외부 데이터 소스 정의';
COMMENT ON TABLE data_source_logs IS '데이터 소스 요청 로그';
COMMENT ON TABLE data_cache IS '데이터 캐시';
COMMENT ON TABLE data_fallback_rules IS 'Fallback 규칙 정의';
COMMENT ON FUNCTION get_source_availability IS '소스 가용성 계산';
