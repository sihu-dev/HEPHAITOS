-- ============================================
-- Cost Tracking System
-- Loop 15: 비용 대시보드
-- ============================================

-- 1) API 비용 로그 테이블
CREATE TABLE IF NOT EXISTS api_cost_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,        -- 'anthropic', 'openai', 'unusual_whales', 'quiver', etc.
  endpoint TEXT,                 -- '/v1/messages', '/api/senator-trades', etc.
  model TEXT,                    -- 'claude-3-opus', 'gpt-4', etc.
  feature TEXT,                  -- 'strategy_generate', 'report_create', 'tutor_answer'
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- 토큰 사용량 (AI API)
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,

  -- 비용 (USD)
  input_cost NUMERIC(10,6) DEFAULT 0,
  output_cost NUMERIC(10,6) DEFAULT 0,
  total_cost NUMERIC(10,6) DEFAULT 0,

  -- API 호출 수 (External API)
  api_calls INTEGER DEFAULT 1,

  -- 메타데이터
  request_id TEXT,
  latency_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_code TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_cost_provider ON api_cost_logs(provider);
CREATE INDEX IF NOT EXISTS idx_api_cost_feature ON api_cost_logs(feature);
CREATE INDEX IF NOT EXISTS idx_api_cost_user ON api_cost_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_cost_created ON api_cost_logs(created_at);

-- 2) 일별 비용 집계 테이블 (materialized)
CREATE TABLE IF NOT EXISTS daily_cost_summary (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  provider TEXT NOT NULL,

  -- AI 비용
  total_input_tokens BIGINT DEFAULT 0,
  total_output_tokens BIGINT DEFAULT 0,
  ai_cost NUMERIC(12,4) DEFAULT 0,

  -- API 호출 비용
  api_calls INTEGER DEFAULT 0,
  api_cost NUMERIC(12,4) DEFAULT 0,

  -- 총 비용
  total_cost NUMERIC(12,4) DEFAULT 0,

  -- 메타
  unique_users INTEGER DEFAULT 0,
  success_rate NUMERIC(5,2) DEFAULT 100,
  avg_latency_ms INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(date, provider)
);

CREATE INDEX IF NOT EXISTS idx_daily_cost_date ON daily_cost_summary(date);

-- 3) 월별 예산 테이블
CREATE TABLE IF NOT EXISTS cost_budgets (
  id SERIAL PRIMARY KEY,
  year_month TEXT NOT NULL,      -- '2025-12'
  provider TEXT NOT NULL,
  budget_amount NUMERIC(12,2) NOT NULL,
  alert_threshold NUMERIC(5,2) DEFAULT 80,  -- 80%에서 경고
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(year_month, provider)
);

-- 4) 비용 알림 기록
CREATE TABLE IF NOT EXISTS cost_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,      -- 'threshold', 'spike', 'anomaly'
  provider TEXT NOT NULL,
  message TEXT NOT NULL,
  current_spend NUMERIC(12,4),
  budget_amount NUMERIC(12,4),
  percentage NUMERIC(5,2),
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5) 프로바이더별 가격 설정
CREATE TABLE IF NOT EXISTS api_pricing (
  id SERIAL PRIMARY KEY,
  provider TEXT NOT NULL,
  model TEXT,
  price_type TEXT NOT NULL,      -- 'per_1k_input', 'per_1k_output', 'per_call', 'monthly_flat'
  price_usd NUMERIC(10,6) NOT NULL,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_until DATE,
  is_active BOOLEAN DEFAULT true,

  UNIQUE(provider, model, price_type, effective_from)
);

-- 기본 가격 설정
INSERT INTO api_pricing (provider, model, price_type, price_usd) VALUES
  -- Anthropic Claude
  ('anthropic', 'claude-3-opus', 'per_1k_input', 0.015),
  ('anthropic', 'claude-3-opus', 'per_1k_output', 0.075),
  ('anthropic', 'claude-3-sonnet', 'per_1k_input', 0.003),
  ('anthropic', 'claude-3-sonnet', 'per_1k_output', 0.015),
  ('anthropic', 'claude-3-haiku', 'per_1k_input', 0.00025),
  ('anthropic', 'claude-3-haiku', 'per_1k_output', 0.00125),
  -- OpenAI
  ('openai', 'gpt-4-turbo', 'per_1k_input', 0.01),
  ('openai', 'gpt-4-turbo', 'per_1k_output', 0.03),
  ('openai', 'gpt-4o', 'per_1k_input', 0.005),
  ('openai', 'gpt-4o', 'per_1k_output', 0.015),
  -- External APIs (월정액)
  ('unusual_whales', NULL, 'monthly_flat', 999),
  ('quiver', NULL, 'monthly_flat', 499)
ON CONFLICT DO NOTHING;

-- 6) 비용 로그 기록 함수
CREATE OR REPLACE FUNCTION log_api_cost(
  p_provider TEXT,
  p_endpoint TEXT,
  p_model TEXT,
  p_feature TEXT,
  p_user_id UUID,
  p_input_tokens INTEGER DEFAULT 0,
  p_output_tokens INTEGER DEFAULT 0,
  p_api_calls INTEGER DEFAULT 1,
  p_latency_ms INTEGER DEFAULT 0,
  p_success BOOLEAN DEFAULT true,
  p_request_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_input_price NUMERIC(10,6);
  v_output_price NUMERIC(10,6);
  v_input_cost NUMERIC(10,6);
  v_output_cost NUMERIC(10,6);
  v_total_cost NUMERIC(10,6);
  v_log_id UUID;
BEGIN
  -- 가격 조회
  SELECT price_usd INTO v_input_price
  FROM api_pricing
  WHERE provider = p_provider
    AND (model = p_model OR model IS NULL)
    AND price_type = 'per_1k_input'
    AND is_active = true
  ORDER BY model NULLS LAST
  LIMIT 1;

  SELECT price_usd INTO v_output_price
  FROM api_pricing
  WHERE provider = p_provider
    AND (model = p_model OR model IS NULL)
    AND price_type = 'per_1k_output'
    AND is_active = true
  ORDER BY model NULLS LAST
  LIMIT 1;

  -- 비용 계산
  v_input_cost := COALESCE((p_input_tokens / 1000.0) * v_input_price, 0);
  v_output_cost := COALESCE((p_output_tokens / 1000.0) * v_output_price, 0);
  v_total_cost := v_input_cost + v_output_cost;

  -- 로그 삽입
  INSERT INTO api_cost_logs (
    provider, endpoint, model, feature, user_id,
    input_tokens, output_tokens, total_tokens,
    input_cost, output_cost, total_cost,
    api_calls, latency_ms, success, request_id
  ) VALUES (
    p_provider, p_endpoint, p_model, p_feature, p_user_id,
    p_input_tokens, p_output_tokens, p_input_tokens + p_output_tokens,
    v_input_cost, v_output_cost, v_total_cost,
    p_api_calls, p_latency_ms, p_success, p_request_id
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- 7) 일별 비용 집계 함수
CREATE OR REPLACE FUNCTION aggregate_daily_costs(p_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO daily_cost_summary (
    date, provider,
    total_input_tokens, total_output_tokens, ai_cost,
    api_calls, api_cost, total_cost,
    unique_users, success_rate, avg_latency_ms
  )
  SELECT
    p_date,
    provider,
    SUM(input_tokens),
    SUM(output_tokens),
    SUM(CASE WHEN input_tokens > 0 OR output_tokens > 0 THEN total_cost ELSE 0 END),
    SUM(api_calls),
    SUM(CASE WHEN input_tokens = 0 AND output_tokens = 0 THEN total_cost ELSE 0 END),
    SUM(total_cost),
    COUNT(DISTINCT user_id),
    ROUND(100.0 * SUM(CASE WHEN success THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 2),
    ROUND(AVG(latency_ms))
  FROM api_cost_logs
  WHERE DATE(created_at) = p_date
  GROUP BY provider
  ON CONFLICT (date, provider)
  DO UPDATE SET
    total_input_tokens = EXCLUDED.total_input_tokens,
    total_output_tokens = EXCLUDED.total_output_tokens,
    ai_cost = EXCLUDED.ai_cost,
    api_calls = EXCLUDED.api_calls,
    api_cost = EXCLUDED.api_cost,
    total_cost = EXCLUDED.total_cost,
    unique_users = EXCLUDED.unique_users,
    success_rate = EXCLUDED.success_rate,
    avg_latency_ms = EXCLUDED.avg_latency_ms,
    updated_at = now();
END;
$$;

-- 8) 비용 요약 조회 함수
CREATE OR REPLACE FUNCTION get_cost_summary(
  p_days INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_start_date DATE;
  v_total_cost NUMERIC;
  v_by_provider JSONB;
  v_by_feature JSONB;
  v_daily_trend JSONB;
  v_budget_status JSONB;
BEGIN
  v_start_date := CURRENT_DATE - p_days;

  -- 총 비용
  SELECT COALESCE(SUM(total_cost), 0) INTO v_total_cost
  FROM api_cost_logs
  WHERE created_at >= v_start_date;

  -- 프로바이더별
  SELECT jsonb_object_agg(provider, cost_data)
  INTO v_by_provider
  FROM (
    SELECT
      provider,
      jsonb_build_object(
        'total_cost', SUM(total_cost),
        'total_tokens', SUM(total_tokens),
        'api_calls', SUM(api_calls),
        'avg_latency', ROUND(AVG(latency_ms))
      ) as cost_data
    FROM api_cost_logs
    WHERE created_at >= v_start_date
    GROUP BY provider
  ) t;

  -- 기능별
  SELECT jsonb_object_agg(feature, cost_data)
  INTO v_by_feature
  FROM (
    SELECT
      COALESCE(feature, 'other') as feature,
      jsonb_build_object(
        'total_cost', SUM(total_cost),
        'total_tokens', SUM(total_tokens),
        'count', COUNT(*)
      ) as cost_data
    FROM api_cost_logs
    WHERE created_at >= v_start_date
    GROUP BY feature
  ) t;

  -- 일별 트렌드
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', date,
      'total_cost', total_cost,
      'ai_cost', ai_cost,
      'api_cost', api_cost
    ) ORDER BY date
  )
  INTO v_daily_trend
  FROM daily_cost_summary
  WHERE date >= v_start_date;

  -- 예산 상태
  SELECT jsonb_agg(
    jsonb_build_object(
      'provider', b.provider,
      'budget', b.budget_amount,
      'spent', COALESCE(s.spent, 0),
      'percentage', ROUND(100.0 * COALESCE(s.spent, 0) / b.budget_amount, 2),
      'alert_threshold', b.alert_threshold
    )
  )
  INTO v_budget_status
  FROM cost_budgets b
  LEFT JOIN (
    SELECT provider, SUM(total_cost) as spent
    FROM daily_cost_summary
    WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
    GROUP BY provider
  ) s ON b.provider = s.provider
  WHERE b.year_month = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
    AND b.is_active = true;

  RETURN jsonb_build_object(
    'period_days', p_days,
    'total_cost', v_total_cost,
    'daily_avg', ROUND(v_total_cost / GREATEST(p_days, 1), 4),
    'by_provider', COALESCE(v_by_provider, '{}'),
    'by_feature', COALESCE(v_by_feature, '{}'),
    'daily_trend', COALESCE(v_daily_trend, '[]'),
    'budget_status', COALESCE(v_budget_status, '[]')
  );
END;
$$;

-- 9) 예산 초과 체크 함수
CREATE OR REPLACE FUNCTION check_cost_budgets()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_budget RECORD;
  v_spent NUMERIC;
  v_percentage NUMERIC;
BEGIN
  FOR v_budget IN
    SELECT * FROM cost_budgets
    WHERE year_month = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
      AND is_active = true
  LOOP
    -- 현재 지출 계산
    SELECT COALESCE(SUM(total_cost), 0) INTO v_spent
    FROM daily_cost_summary
    WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
      AND provider = v_budget.provider;

    v_percentage := (v_spent / v_budget.budget_amount) * 100;

    -- 임계값 초과 시 알림 생성
    IF v_percentage >= v_budget.alert_threshold THEN
      -- 중복 알림 방지 (24시간 내)
      IF NOT EXISTS (
        SELECT 1 FROM cost_alerts
        WHERE provider = v_budget.provider
          AND alert_type = 'threshold'
          AND created_at >= NOW() - INTERVAL '24 hours'
      ) THEN
        INSERT INTO cost_alerts (
          alert_type, provider, message,
          current_spend, budget_amount, percentage
        ) VALUES (
          'threshold',
          v_budget.provider,
          format('%s 비용이 예산의 %.1f%%에 도달했습니다. ($%.2f / $%.2f)',
            v_budget.provider, v_percentage, v_spent, v_budget.budget_amount),
          v_spent,
          v_budget.budget_amount,
          v_percentage
        );
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- 10) 실시간 비용 뷰
CREATE OR REPLACE VIEW current_month_costs AS
SELECT
  provider,
  SUM(total_cost) as total_cost,
  SUM(input_tokens) as total_input_tokens,
  SUM(output_tokens) as total_output_tokens,
  SUM(api_calls) as total_api_calls,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) as total_requests
FROM api_cost_logs
WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY provider;

-- 11) 기능별 비용 뷰
CREATE OR REPLACE VIEW feature_costs AS
SELECT
  COALESCE(feature, 'other') as feature,
  provider,
  SUM(total_cost) as total_cost,
  SUM(total_tokens) as total_tokens,
  COUNT(*) as request_count,
  ROUND(AVG(latency_ms)) as avg_latency_ms
FROM api_cost_logs
WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY feature, provider
ORDER BY total_cost DESC;

-- 12) RLS 정책
ALTER TABLE api_cost_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_cost_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_pricing ENABLE ROW LEVEL SECURITY;

-- 관리자만 조회 가능
CREATE POLICY "Admins can view cost logs"
  ON api_cost_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can view cost summary"
  ON daily_cost_summary FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can manage budgets"
  ON cost_budgets FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can view alerts"
  ON cost_alerts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Anyone can view pricing"
  ON api_pricing FOR SELECT
  USING (is_active = true);

-- 13) 권한 부여
GRANT SELECT ON current_month_costs TO authenticated;
GRANT SELECT ON feature_costs TO authenticated;
GRANT EXECUTE ON FUNCTION log_api_cost TO authenticated;
GRANT EXECUTE ON FUNCTION aggregate_daily_costs TO authenticated;
GRANT EXECUTE ON FUNCTION get_cost_summary TO authenticated;
GRANT EXECUTE ON FUNCTION check_cost_budgets TO authenticated;

-- 코멘트
COMMENT ON TABLE api_cost_logs IS 'API 비용 로그';
COMMENT ON TABLE daily_cost_summary IS '일별 비용 집계';
COMMENT ON TABLE cost_budgets IS '월별 예산 설정';
COMMENT ON TABLE cost_alerts IS '비용 알림 기록';
COMMENT ON TABLE api_pricing IS 'API 가격 설정';
COMMENT ON FUNCTION log_api_cost IS 'API 비용 로그 기록';
COMMENT ON FUNCTION get_cost_summary IS '비용 요약 조회';
