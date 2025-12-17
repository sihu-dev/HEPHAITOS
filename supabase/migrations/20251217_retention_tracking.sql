-- ============================================
-- D1/D7 Retention Tracking System
-- Loop 10: 베타 사용자 리텐션 측정
-- ============================================

-- 1) 사용자 코호트 테이블 (가입일 기준)
CREATE TABLE IF NOT EXISTS user_cohorts (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  signup_date DATE NOT NULL,
  signup_week DATE NOT NULL,  -- 주 단위 코호트
  signup_month DATE NOT NULL, -- 월 단위 코호트
  first_activity_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  total_sessions INTEGER DEFAULT 0,
  total_events INTEGER DEFAULT 0,
  signup_source TEXT,  -- 'organic', 'invite_code', 'referral'
  invite_code_used TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_user_cohorts_signup_date ON user_cohorts(signup_date);
CREATE INDEX IF NOT EXISTS idx_user_cohorts_signup_week ON user_cohorts(signup_week);
CREATE INDEX IF NOT EXISTS idx_user_cohorts_last_activity ON user_cohorts(last_activity_at);

-- 2) 일별 활동 로그 (리텐션 계산용)
CREATE TABLE IF NOT EXISTS user_daily_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  session_count INTEGER DEFAULT 1,
  event_count INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 0,
  features_used TEXT[] DEFAULT '{}',
  first_event_at TIMESTAMPTZ,
  last_event_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, activity_date)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_user_daily_activity_date ON user_daily_activity(activity_date);
CREATE INDEX IF NOT EXISTS idx_user_daily_activity_user ON user_daily_activity(user_id, activity_date);

-- 3) D1, D7, D30 리텐션 계산 함수
CREATE OR REPLACE FUNCTION calculate_retention_metrics(
  p_start_date DATE DEFAULT CURRENT_DATE - 30,
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  cohort_date DATE,
  cohort_size INTEGER,
  d1_retained INTEGER,
  d1_rate NUMERIC,
  d3_retained INTEGER,
  d3_rate NUMERIC,
  d7_retained INTEGER,
  d7_rate NUMERIC,
  d14_retained INTEGER,
  d14_rate NUMERIC,
  d30_retained INTEGER,
  d30_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH cohorts AS (
    SELECT
      uc.user_id,
      uc.signup_date
    FROM user_cohorts uc
    WHERE uc.signup_date BETWEEN p_start_date AND p_end_date
  ),
  activity AS (
    SELECT
      user_id,
      activity_date
    FROM user_daily_activity
    WHERE activity_date BETWEEN p_start_date AND p_end_date + 30
  )
  SELECT
    c.signup_date as cohort_date,
    COUNT(DISTINCT c.user_id)::INTEGER as cohort_size,
    -- D1
    COUNT(DISTINCT CASE WHEN a.activity_date = c.signup_date + 1 THEN c.user_id END)::INTEGER as d1_retained,
    ROUND(100.0 * COUNT(DISTINCT CASE WHEN a.activity_date = c.signup_date + 1 THEN c.user_id END) / NULLIF(COUNT(DISTINCT c.user_id), 0), 2) as d1_rate,
    -- D3
    COUNT(DISTINCT CASE WHEN a.activity_date = c.signup_date + 3 THEN c.user_id END)::INTEGER as d3_retained,
    ROUND(100.0 * COUNT(DISTINCT CASE WHEN a.activity_date = c.signup_date + 3 THEN c.user_id END) / NULLIF(COUNT(DISTINCT c.user_id), 0), 2) as d3_rate,
    -- D7
    COUNT(DISTINCT CASE WHEN a.activity_date = c.signup_date + 7 THEN c.user_id END)::INTEGER as d7_retained,
    ROUND(100.0 * COUNT(DISTINCT CASE WHEN a.activity_date = c.signup_date + 7 THEN c.user_id END) / NULLIF(COUNT(DISTINCT c.user_id), 0), 2) as d7_rate,
    -- D14
    COUNT(DISTINCT CASE WHEN a.activity_date = c.signup_date + 14 THEN c.user_id END)::INTEGER as d14_retained,
    ROUND(100.0 * COUNT(DISTINCT CASE WHEN a.activity_date = c.signup_date + 14 THEN c.user_id END) / NULLIF(COUNT(DISTINCT c.user_id), 0), 2) as d14_rate,
    -- D30
    COUNT(DISTINCT CASE WHEN a.activity_date = c.signup_date + 30 THEN c.user_id END)::INTEGER as d30_retained,
    ROUND(100.0 * COUNT(DISTINCT CASE WHEN a.activity_date = c.signup_date + 30 THEN c.user_id END) / NULLIF(COUNT(DISTINCT c.user_id), 0), 2) as d30_rate
  FROM cohorts c
  LEFT JOIN activity a ON c.user_id = a.user_id
  GROUP BY c.signup_date
  ORDER BY c.signup_date DESC;
END;
$$;

-- 4) 주간 리텐션 커브 (전체 평균)
CREATE OR REPLACE FUNCTION get_retention_curve()
RETURNS TABLE (
  day_number INTEGER,
  retention_rate NUMERIC,
  retained_users INTEGER,
  total_users INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH cohorts AS (
    SELECT user_id, signup_date
    FROM user_cohorts
    WHERE signup_date >= CURRENT_DATE - 90
  ),
  days AS (
    SELECT generate_series(0, 30) as day_num
  ),
  retention AS (
    SELECT
      d.day_num,
      COUNT(DISTINCT c.user_id) FILTER (
        WHERE EXISTS (
          SELECT 1 FROM user_daily_activity a
          WHERE a.user_id = c.user_id
            AND a.activity_date = c.signup_date + d.day_num
        )
      ) as retained,
      COUNT(DISTINCT c.user_id) as total
    FROM days d
    CROSS JOIN cohorts c
    WHERE c.signup_date + d.day_num <= CURRENT_DATE
    GROUP BY d.day_num
  )
  SELECT
    r.day_num as day_number,
    ROUND(100.0 * r.retained / NULLIF(r.total, 0), 2) as retention_rate,
    r.retained::INTEGER as retained_users,
    r.total::INTEGER as total_users
  FROM retention r
  ORDER BY r.day_num;
END;
$$;

-- 5) 사용자 활동 기록 트리거 함수
CREATE OR REPLACE FUNCTION record_user_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_activity_date DATE;
  v_feature TEXT;
BEGIN
  -- 이벤트 날짜
  v_activity_date := DATE(NEW.created_at);

  -- 기능 추출 (event_name에서)
  v_feature := CASE
    WHEN NEW.event_name LIKE 'strategy_%' THEN 'strategy'
    WHEN NEW.event_name LIKE 'backtest_%' THEN 'backtest'
    WHEN NEW.event_name LIKE 'package_%' THEN 'pricing'
    WHEN NEW.event_name = 'sign_up' THEN 'signup'
    WHEN NEW.event_name = 'sign_in' THEN 'signin'
    ELSE 'general'
  END;

  -- user_daily_activity 업서트
  IF NEW.user_id IS NOT NULL THEN
    INSERT INTO user_daily_activity (
      user_id, activity_date, session_count, event_count, page_views,
      features_used, first_event_at, last_event_at
    ) VALUES (
      NEW.user_id, v_activity_date, 1, 1,
      CASE WHEN NEW.event_name = 'page_view' THEN 1 ELSE 0 END,
      ARRAY[v_feature], NEW.created_at, NEW.created_at
    )
    ON CONFLICT (user_id, activity_date) DO UPDATE SET
      event_count = user_daily_activity.event_count + 1,
      page_views = user_daily_activity.page_views +
        CASE WHEN NEW.event_name = 'page_view' THEN 1 ELSE 0 END,
      features_used = ARRAY(
        SELECT DISTINCT unnest(user_daily_activity.features_used || ARRAY[v_feature])
      ),
      last_event_at = NEW.created_at;

    -- user_cohorts 업데이트 (last_activity)
    UPDATE user_cohorts
    SET
      last_activity_at = NEW.created_at,
      total_events = total_events + 1,
      first_activity_at = COALESCE(first_activity_at, NEW.created_at),
      updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

-- 트리거 생성
DROP TRIGGER IF EXISTS trg_record_user_activity ON analytics_events;
CREATE TRIGGER trg_record_user_activity
  AFTER INSERT ON analytics_events
  FOR EACH ROW
  EXECUTE FUNCTION record_user_activity();

-- 6) 신규 사용자 코호트 자동 생성 함수
CREATE OR REPLACE FUNCTION create_user_cohort()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_cohorts (
    user_id, signup_date, signup_week, signup_month, signup_source
  ) VALUES (
    NEW.id,
    DATE(NEW.created_at),
    DATE(date_trunc('week', NEW.created_at)),
    DATE(date_trunc('month', NEW.created_at)),
    COALESCE(NEW.raw_user_meta_data->>'signup_source', 'organic')
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- auth.users 트리거
DROP TRIGGER IF EXISTS trg_create_user_cohort ON auth.users;
CREATE TRIGGER trg_create_user_cohort
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_cohort();

-- 7) 기존 사용자 코호트 백필
INSERT INTO user_cohorts (user_id, signup_date, signup_week, signup_month, signup_source)
SELECT
  id,
  DATE(created_at),
  DATE(date_trunc('week', created_at)),
  DATE(date_trunc('month', created_at)),
  COALESCE(raw_user_meta_data->>'signup_source', 'organic')
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- 8) 리텐션 대시보드 뷰
CREATE OR REPLACE VIEW retention_dashboard AS
WITH metrics AS (
  SELECT * FROM calculate_retention_metrics(CURRENT_DATE - 30, CURRENT_DATE)
),
totals AS (
  SELECT
    COUNT(*) as total_cohort_days,
    AVG(d1_rate) as avg_d1,
    AVG(d7_rate) as avg_d7,
    AVG(d30_rate) as avg_d30,
    SUM(cohort_size) as total_users
  FROM metrics
)
SELECT
  m.*,
  t.avg_d1 as overall_avg_d1,
  t.avg_d7 as overall_avg_d7,
  t.total_users as total_beta_users
FROM metrics m
CROSS JOIN totals t;

-- 9) RLS 정책
ALTER TABLE user_cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_activity ENABLE ROW LEVEL SECURITY;

-- 관리자만 접근 가능
CREATE POLICY "Admins can view cohorts"
  ON user_cohorts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can view daily activity"
  ON user_daily_activity FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 사용자는 본인 데이터만 조회
CREATE POLICY "Users can view own cohort"
  ON user_cohorts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view own activity"
  ON user_daily_activity FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 10) 권한 부여
GRANT SELECT ON retention_dashboard TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_retention_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION get_retention_curve TO authenticated;

-- 코멘트
COMMENT ON TABLE user_cohorts IS '사용자 가입 코호트 (리텐션 분석용)';
COMMENT ON TABLE user_daily_activity IS '일별 사용자 활동 (리텐션 계산용)';
COMMENT ON FUNCTION calculate_retention_metrics IS 'D1/D3/D7/D14/D30 리텐션 계산';
COMMENT ON FUNCTION get_retention_curve IS '전체 리텐션 커브 (Day 0-30)';
COMMENT ON VIEW retention_dashboard IS '리텐션 대시보드 뷰';
