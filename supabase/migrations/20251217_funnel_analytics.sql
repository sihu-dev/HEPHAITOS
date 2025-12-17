-- ============================================
-- Conversion Funnel Analytics System
-- Loop 12: 전환율 퍼널 분석
-- ============================================

-- 1) 퍼널 단계 정의 테이블
CREATE TABLE IF NOT EXISTS funnel_stages (
  id SERIAL PRIMARY KEY,
  stage_name TEXT NOT NULL UNIQUE,
  stage_order INTEGER NOT NULL,
  description TEXT,
  event_name TEXT,           -- analytics_events에서 매칭할 이벤트
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 기본 퍼널 단계 삽입
INSERT INTO funnel_stages (stage_name, stage_order, description, event_name) VALUES
  ('visit', 1, '사이트 방문', 'page_view'),
  ('signup', 2, '회원가입 완료', 'sign_up'),
  ('first_activity', 3, '첫 활동 (전략 조회/생성)', 'strategy_created'),
  ('first_purchase', 4, '첫 결제', 'package_selected'),
  ('repeat_purchase', 5, '재결제', 'package_selected')
ON CONFLICT (stage_name) DO NOTHING;

-- 2) 사용자별 퍼널 진행 상태 테이블
CREATE TABLE IF NOT EXISTS user_funnel_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_stage INTEGER DEFAULT 1,
  visit_at TIMESTAMPTZ,
  signup_at TIMESTAMPTZ,
  first_activity_at TIMESTAMPTZ,
  first_purchase_at TIMESTAMPTZ,
  repeat_purchase_at TIMESTAMPTZ,
  days_to_signup INTEGER,
  days_to_first_activity INTEGER,
  days_to_first_purchase INTEGER,
  days_to_repeat_purchase INTEGER,
  signup_source TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_user_funnel_stage ON user_funnel_progress(current_stage);
CREATE INDEX IF NOT EXISTS idx_user_funnel_signup ON user_funnel_progress(signup_at);

-- 3) 일별 퍼널 스냅샷 테이블
CREATE TABLE IF NOT EXISTS daily_funnel_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL,
  stage_name TEXT NOT NULL,
  stage_order INTEGER NOT NULL,
  users_at_stage INTEGER DEFAULT 0,
  users_converted INTEGER DEFAULT 0,       -- 다음 단계로 전환된 수
  conversion_rate NUMERIC(5,2) DEFAULT 0,  -- 다음 단계 전환율
  cumulative_rate NUMERIC(5,2) DEFAULT 0,  -- 누적 전환율 (visit 대비)
  avg_days_to_convert NUMERIC(5,1),        -- 평균 전환 소요일
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(snapshot_date, stage_name)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_daily_funnel_date ON daily_funnel_snapshot(snapshot_date);

-- 4) 퍼널 전환율 계산 함수
CREATE OR REPLACE FUNCTION calculate_funnel_metrics(
  p_start_date DATE DEFAULT CURRENT_DATE - 30,
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  stage_name TEXT,
  stage_order INTEGER,
  total_users BIGINT,
  converted_users BIGINT,
  conversion_rate NUMERIC,
  cumulative_rate NUMERIC,
  drop_off_rate NUMERIC,
  avg_days_to_convert NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_signups BIGINT;
BEGIN
  -- 기준: 해당 기간 가입자
  SELECT COUNT(*) INTO v_total_signups
  FROM user_funnel_progress
  WHERE signup_at BETWEEN p_start_date AND p_end_date + INTERVAL '1 day';

  RETURN QUERY
  WITH stages AS (
    SELECT
      'signup' as stage,
      2 as ord,
      COUNT(*) as users,
      COUNT(*) FILTER (WHERE first_activity_at IS NOT NULL) as converted,
      AVG(days_to_first_activity) as avg_days
    FROM user_funnel_progress
    WHERE signup_at BETWEEN p_start_date AND p_end_date + INTERVAL '1 day'

    UNION ALL

    SELECT
      'first_activity' as stage,
      3 as ord,
      COUNT(*) FILTER (WHERE first_activity_at IS NOT NULL) as users,
      COUNT(*) FILTER (WHERE first_purchase_at IS NOT NULL) as converted,
      AVG(days_to_first_purchase - days_to_first_activity) as avg_days
    FROM user_funnel_progress
    WHERE signup_at BETWEEN p_start_date AND p_end_date + INTERVAL '1 day'

    UNION ALL

    SELECT
      'first_purchase' as stage,
      4 as ord,
      COUNT(*) FILTER (WHERE first_purchase_at IS NOT NULL) as users,
      COUNT(*) FILTER (WHERE repeat_purchase_at IS NOT NULL) as converted,
      AVG(days_to_repeat_purchase - days_to_first_purchase) as avg_days
    FROM user_funnel_progress
    WHERE signup_at BETWEEN p_start_date AND p_end_date + INTERVAL '1 day'

    UNION ALL

    SELECT
      'repeat_purchase' as stage,
      5 as ord,
      COUNT(*) FILTER (WHERE repeat_purchase_at IS NOT NULL) as users,
      0::BIGINT as converted,
      NULL::NUMERIC as avg_days
    FROM user_funnel_progress
    WHERE signup_at BETWEEN p_start_date AND p_end_date + INTERVAL '1 day'
  )
  SELECT
    s.stage as stage_name,
    s.ord as stage_order,
    s.users as total_users,
    s.converted as converted_users,
    ROUND(100.0 * s.converted / NULLIF(s.users, 0), 2) as conversion_rate,
    ROUND(100.0 * s.users / NULLIF(v_total_signups, 0), 2) as cumulative_rate,
    ROUND(100.0 - (100.0 * s.converted / NULLIF(s.users, 0)), 2) as drop_off_rate,
    ROUND(s.avg_days, 1) as avg_days_to_convert
  FROM stages s
  ORDER BY s.ord;
END;
$$;

-- 5) 사용자 퍼널 진행 업데이트 함수
CREATE OR REPLACE FUNCTION update_user_funnel(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_signup_at TIMESTAMPTZ;
  v_first_activity TIMESTAMPTZ;
  v_first_purchase TIMESTAMPTZ;
  v_repeat_purchase TIMESTAMPTZ;
  v_current_stage INTEGER;
BEGIN
  -- 가입일 조회
  SELECT created_at INTO v_signup_at
  FROM auth.users WHERE id = p_user_id;

  IF v_signup_at IS NULL THEN
    RETURN;
  END IF;

  -- 첫 활동 (전략 생성 또는 백테스트)
  SELECT MIN(created_at) INTO v_first_activity
  FROM analytics_events
  WHERE user_id = p_user_id
    AND event_name IN ('strategy_created', 'backtest_started', 'feature_used');

  -- 첫 결제
  SELECT MIN(paid_at) INTO v_first_purchase
  FROM payment_orders
  WHERE user_id = p_user_id AND status = 'paid';

  -- 재결제 (두 번째 결제)
  SELECT paid_at INTO v_repeat_purchase
  FROM payment_orders
  WHERE user_id = p_user_id AND status = 'paid'
  ORDER BY paid_at
  OFFSET 1 LIMIT 1;

  -- 현재 단계 결정
  v_current_stage := CASE
    WHEN v_repeat_purchase IS NOT NULL THEN 5
    WHEN v_first_purchase IS NOT NULL THEN 4
    WHEN v_first_activity IS NOT NULL THEN 3
    ELSE 2
  END;

  -- 업서트
  INSERT INTO user_funnel_progress (
    user_id, current_stage, visit_at, signup_at,
    first_activity_at, first_purchase_at, repeat_purchase_at,
    days_to_signup, days_to_first_activity, days_to_first_purchase, days_to_repeat_purchase,
    updated_at
  ) VALUES (
    p_user_id,
    v_current_stage,
    v_signup_at, -- visit = signup for now
    v_signup_at,
    v_first_activity,
    v_first_purchase,
    v_repeat_purchase,
    0, -- days_to_signup (same as visit)
    CASE WHEN v_first_activity IS NOT NULL THEN EXTRACT(DAY FROM v_first_activity - v_signup_at)::INTEGER END,
    CASE WHEN v_first_purchase IS NOT NULL THEN EXTRACT(DAY FROM v_first_purchase - v_signup_at)::INTEGER END,
    CASE WHEN v_repeat_purchase IS NOT NULL THEN EXTRACT(DAY FROM v_repeat_purchase - v_signup_at)::INTEGER END,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    current_stage = EXCLUDED.current_stage,
    first_activity_at = EXCLUDED.first_activity_at,
    first_purchase_at = EXCLUDED.first_purchase_at,
    repeat_purchase_at = EXCLUDED.repeat_purchase_at,
    days_to_first_activity = EXCLUDED.days_to_first_activity,
    days_to_first_purchase = EXCLUDED.days_to_first_purchase,
    days_to_repeat_purchase = EXCLUDED.days_to_repeat_purchase,
    updated_at = now();
END;
$$;

-- 6) 신규 가입자 퍼널 초기화 트리거
CREATE OR REPLACE FUNCTION trg_init_user_funnel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_funnel_progress (
    user_id, current_stage, visit_at, signup_at, days_to_signup
  ) VALUES (
    NEW.id, 2, NEW.created_at, NEW.created_at, 0
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_init_funnel ON auth.users;
CREATE TRIGGER trg_init_funnel
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION trg_init_user_funnel();

-- 7) 이벤트 발생 시 퍼널 업데이트 트리거
CREATE OR REPLACE FUNCTION trg_update_funnel_on_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND NEW.event_name IN ('strategy_created', 'backtest_started', 'feature_used') THEN
    PERFORM update_user_funnel(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_funnel_event ON analytics_events;
CREATE TRIGGER trg_funnel_event
  AFTER INSERT ON analytics_events
  FOR EACH ROW
  EXECUTE FUNCTION trg_update_funnel_on_event();

-- 8) 결제 완료 시 퍼널 업데이트 트리거
CREATE OR REPLACE FUNCTION trg_update_funnel_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    PERFORM update_user_funnel(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_funnel_payment ON payment_orders;
CREATE TRIGGER trg_funnel_payment
  AFTER INSERT OR UPDATE ON payment_orders
  FOR EACH ROW
  EXECUTE FUNCTION trg_update_funnel_on_payment();

-- 9) 기존 사용자 퍼널 백필
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM auth.users LOOP
    PERFORM update_user_funnel(r.id);
  END LOOP;
END;
$$;

-- 10) 퍼널 요약 뷰
CREATE OR REPLACE VIEW funnel_summary AS
SELECT * FROM calculate_funnel_metrics(CURRENT_DATE - 30, CURRENT_DATE);

-- 11) 코호트별 퍼널 분석 함수
CREATE OR REPLACE FUNCTION get_funnel_by_cohort(
  p_cohort_type TEXT DEFAULT 'week',
  p_days INTEGER DEFAULT 90
)
RETURNS TABLE (
  cohort_date DATE,
  signups BIGINT,
  activated BIGINT,
  activation_rate NUMERIC,
  purchased BIGINT,
  purchase_rate NUMERIC,
  repeated BIGINT,
  repeat_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE p_cohort_type
      WHEN 'day' THEN DATE(ufp.signup_at)
      WHEN 'week' THEN DATE(date_trunc('week', ufp.signup_at))
      ELSE DATE(date_trunc('month', ufp.signup_at))
    END as cohort_date,
    COUNT(*)::BIGINT as signups,
    COUNT(*) FILTER (WHERE ufp.first_activity_at IS NOT NULL)::BIGINT as activated,
    ROUND(100.0 * COUNT(*) FILTER (WHERE ufp.first_activity_at IS NOT NULL) / NULLIF(COUNT(*), 0), 2) as activation_rate,
    COUNT(*) FILTER (WHERE ufp.first_purchase_at IS NOT NULL)::BIGINT as purchased,
    ROUND(100.0 * COUNT(*) FILTER (WHERE ufp.first_purchase_at IS NOT NULL) / NULLIF(COUNT(*), 0), 2) as purchase_rate,
    COUNT(*) FILTER (WHERE ufp.repeat_purchase_at IS NOT NULL)::BIGINT as repeated,
    ROUND(100.0 * COUNT(*) FILTER (WHERE ufp.repeat_purchase_at IS NOT NULL) / NULLIF(COUNT(*) FILTER (WHERE ufp.first_purchase_at IS NOT NULL), 0), 2) as repeat_rate
  FROM user_funnel_progress ufp
  WHERE ufp.signup_at >= CURRENT_DATE - p_days
  GROUP BY 1
  ORDER BY 1 DESC;
END;
$$;

-- 12) RLS 정책
ALTER TABLE funnel_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_funnel_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_funnel_snapshot ENABLE ROW LEVEL SECURITY;

-- 관리자만 모든 데이터 조회 가능
CREATE POLICY "Admins can view funnel stages"
  ON funnel_stages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can view all funnel progress"
  ON user_funnel_progress FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Users can view own funnel progress"
  ON user_funnel_progress FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view funnel snapshots"
  ON daily_funnel_snapshot FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 13) 권한 부여
GRANT SELECT ON funnel_summary TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_funnel_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION get_funnel_by_cohort TO authenticated;

-- 코멘트
COMMENT ON TABLE funnel_stages IS '퍼널 단계 정의';
COMMENT ON TABLE user_funnel_progress IS '사용자별 퍼널 진행 상태';
COMMENT ON TABLE daily_funnel_snapshot IS '일별 퍼널 스냅샷';
COMMENT ON FUNCTION calculate_funnel_metrics IS '퍼널 전환율 계산';
COMMENT ON FUNCTION get_funnel_by_cohort IS '코호트별 퍼널 분석';
COMMENT ON VIEW funnel_summary IS '최근 30일 퍼널 요약';
