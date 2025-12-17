-- ============================================
-- ARPPU & Revenue Analytics System
-- Loop 11: 코호트별 ARPPU 분석
-- ============================================

-- 1) 사용자 결제 요약 테이블 (마테리얼라이즈드 뷰 대용)
CREATE TABLE IF NOT EXISTS user_revenue_summary (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_payment_at TIMESTAMPTZ,
  last_payment_at TIMESTAMPTZ,
  total_payments INTEGER DEFAULT 0,
  total_revenue INTEGER DEFAULT 0,        -- 총 결제 금액 (원)
  total_credits_purchased INTEGER DEFAULT 0,
  total_credits_spent INTEGER DEFAULT 0,
  total_refunds INTEGER DEFAULT 0,
  refund_amount INTEGER DEFAULT 0,
  net_revenue INTEGER DEFAULT 0,          -- 순 매출 (총 - 환불)
  avg_order_value NUMERIC(10,2),          -- AOV
  signup_date DATE,
  signup_cohort_week DATE,
  signup_cohort_month DATE,
  is_paying_user BOOLEAN DEFAULT false,
  days_to_first_payment INTEGER,          -- 가입 후 첫 결제까지 일수
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_user_revenue_paying ON user_revenue_summary(is_paying_user);
CREATE INDEX IF NOT EXISTS idx_user_revenue_cohort_week ON user_revenue_summary(signup_cohort_week);
CREATE INDEX IF NOT EXISTS idx_user_revenue_cohort_month ON user_revenue_summary(signup_cohort_month);
CREATE INDEX IF NOT EXISTS idx_user_revenue_first_payment ON user_revenue_summary(first_payment_at);

-- 2) ARPPU 계산 함수 (코호트별)
CREATE OR REPLACE FUNCTION calculate_arppu_by_cohort(
  p_cohort_type TEXT DEFAULT 'week',  -- 'day', 'week', 'month'
  p_start_date DATE DEFAULT CURRENT_DATE - 90,
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  cohort_date DATE,
  total_users INTEGER,
  paying_users INTEGER,
  conversion_rate NUMERIC,
  total_revenue BIGINT,
  arppu NUMERIC,           -- Average Revenue Per Paying User
  arpu NUMERIC,            -- Average Revenue Per User (all users)
  avg_orders_per_user NUMERIC,
  avg_credits_per_user NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH cohorts AS (
    SELECT
      CASE p_cohort_type
        WHEN 'day' THEN signup_date
        WHEN 'week' THEN signup_cohort_week
        WHEN 'month' THEN signup_cohort_month
        ELSE signup_cohort_week
      END as cohort,
      user_id,
      is_paying_user,
      total_revenue,
      total_payments,
      total_credits_purchased
    FROM user_revenue_summary
    WHERE signup_date BETWEEN p_start_date AND p_end_date
  )
  SELECT
    c.cohort as cohort_date,
    COUNT(DISTINCT c.user_id)::INTEGER as total_users,
    COUNT(DISTINCT c.user_id) FILTER (WHERE c.is_paying_user)::INTEGER as paying_users,
    ROUND(100.0 * COUNT(DISTINCT c.user_id) FILTER (WHERE c.is_paying_user) / NULLIF(COUNT(DISTINCT c.user_id), 0), 2) as conversion_rate,
    COALESCE(SUM(c.total_revenue), 0)::BIGINT as total_revenue,
    ROUND(SUM(c.total_revenue)::NUMERIC / NULLIF(COUNT(DISTINCT c.user_id) FILTER (WHERE c.is_paying_user), 0), 0) as arppu,
    ROUND(SUM(c.total_revenue)::NUMERIC / NULLIF(COUNT(DISTINCT c.user_id), 0), 0) as arpu,
    ROUND(SUM(c.total_payments)::NUMERIC / NULLIF(COUNT(DISTINCT c.user_id) FILTER (WHERE c.is_paying_user), 0), 2) as avg_orders_per_user,
    ROUND(SUM(c.total_credits_purchased)::NUMERIC / NULLIF(COUNT(DISTINCT c.user_id) FILTER (WHERE c.is_paying_user), 0), 0) as avg_credits_per_user
  FROM cohorts c
  GROUP BY c.cohort
  ORDER BY c.cohort DESC;
END;
$$;

-- 3) 전체 ARPPU 요약 함수
CREATE OR REPLACE FUNCTION get_arppu_summary(
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  metric TEXT,
  value NUMERIC,
  trend_vs_prev NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_start DATE := CURRENT_DATE - p_days;
  v_prev_start DATE := CURRENT_DATE - (p_days * 2);
  v_prev_end DATE := CURRENT_DATE - p_days - 1;
BEGIN
  RETURN QUERY
  WITH current_period AS (
    SELECT
      COUNT(DISTINCT user_id) as total_users,
      COUNT(DISTINCT user_id) FILTER (WHERE is_paying_user) as paying_users,
      SUM(total_revenue) as revenue,
      SUM(total_payments) as orders
    FROM user_revenue_summary
    WHERE signup_date >= v_current_start
  ),
  prev_period AS (
    SELECT
      COUNT(DISTINCT user_id) as total_users,
      COUNT(DISTINCT user_id) FILTER (WHERE is_paying_user) as paying_users,
      SUM(total_revenue) as revenue
    FROM user_revenue_summary
    WHERE signup_date BETWEEN v_prev_start AND v_prev_end
  )
  SELECT 'total_users'::TEXT, cp.total_users::NUMERIC,
         ROUND(100.0 * (cp.total_users - pp.total_users) / NULLIF(pp.total_users, 0), 1)
  FROM current_period cp, prev_period pp
  UNION ALL
  SELECT 'paying_users'::TEXT, cp.paying_users::NUMERIC,
         ROUND(100.0 * (cp.paying_users - pp.paying_users) / NULLIF(pp.paying_users, 0), 1)
  FROM current_period cp, prev_period pp
  UNION ALL
  SELECT 'total_revenue'::TEXT, cp.revenue::NUMERIC,
         ROUND(100.0 * (cp.revenue - pp.revenue) / NULLIF(pp.revenue, 0), 1)
  FROM current_period cp, prev_period pp
  UNION ALL
  SELECT 'arppu'::TEXT,
         ROUND(cp.revenue::NUMERIC / NULLIF(cp.paying_users, 0), 0),
         ROUND(100.0 * (cp.revenue::NUMERIC / NULLIF(cp.paying_users, 0) - pp.revenue::NUMERIC / NULLIF(pp.paying_users, 0)) / NULLIF(pp.revenue::NUMERIC / NULLIF(pp.paying_users, 0), 0), 1)
  FROM current_period cp, prev_period pp
  UNION ALL
  SELECT 'conversion_rate'::TEXT,
         ROUND(100.0 * cp.paying_users / NULLIF(cp.total_users, 0), 2),
         ROUND(100.0 * cp.paying_users / NULLIF(cp.total_users, 0) - 100.0 * pp.paying_users / NULLIF(pp.total_users, 0), 2)
  FROM current_period cp, prev_period pp;
END;
$$;

-- 4) 사용자 매출 요약 업데이트 함수
CREATE OR REPLACE FUNCTION update_user_revenue_summary(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_signup_date DATE;
  v_first_payment TIMESTAMPTZ;
  v_last_payment TIMESTAMPTZ;
  v_total_payments INTEGER;
  v_total_revenue INTEGER;
  v_total_credits INTEGER;
  v_total_spent INTEGER;
  v_refund_count INTEGER;
  v_refund_amount INTEGER;
BEGIN
  -- 사용자 가입일 조회
  SELECT DATE(created_at) INTO v_signup_date
  FROM auth.users WHERE id = p_user_id;

  IF v_signup_date IS NULL THEN
    RETURN;
  END IF;

  -- 결제 통계 계산
  SELECT
    MIN(paid_at),
    MAX(paid_at),
    COUNT(*),
    COALESCE(SUM(amount), 0),
    COALESCE(SUM(credits), 0)
  INTO v_first_payment, v_last_payment, v_total_payments, v_total_revenue, v_total_credits
  FROM payment_orders
  WHERE user_id = p_user_id AND status = 'paid';

  -- 환불 통계
  SELECT
    COUNT(*),
    COALESCE(SUM(refund_amount), 0)
  INTO v_refund_count, v_refund_amount
  FROM payment_orders
  WHERE user_id = p_user_id AND status = 'refunded';

  -- 크레딧 사용량
  SELECT COALESCE(SUM(ABS(amount)), 0) INTO v_total_spent
  FROM credit_transactions
  WHERE user_id = p_user_id AND type = 'spend';

  -- 업서트
  INSERT INTO user_revenue_summary (
    user_id, first_payment_at, last_payment_at, total_payments,
    total_revenue, total_credits_purchased, total_credits_spent,
    total_refunds, refund_amount, net_revenue, avg_order_value,
    signup_date, signup_cohort_week, signup_cohort_month,
    is_paying_user, days_to_first_payment, updated_at
  ) VALUES (
    p_user_id,
    v_first_payment,
    v_last_payment,
    v_total_payments,
    v_total_revenue,
    v_total_credits,
    v_total_spent,
    v_refund_count,
    v_refund_amount,
    v_total_revenue - v_refund_amount,
    CASE WHEN v_total_payments > 0 THEN v_total_revenue::NUMERIC / v_total_payments ELSE NULL END,
    v_signup_date,
    DATE(date_trunc('week', v_signup_date)),
    DATE(date_trunc('month', v_signup_date)),
    v_total_payments > 0,
    CASE WHEN v_first_payment IS NOT NULL THEN (v_first_payment::DATE - v_signup_date) ELSE NULL END,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    first_payment_at = EXCLUDED.first_payment_at,
    last_payment_at = EXCLUDED.last_payment_at,
    total_payments = EXCLUDED.total_payments,
    total_revenue = EXCLUDED.total_revenue,
    total_credits_purchased = EXCLUDED.total_credits_purchased,
    total_credits_spent = EXCLUDED.total_credits_spent,
    total_refunds = EXCLUDED.total_refunds,
    refund_amount = EXCLUDED.refund_amount,
    net_revenue = EXCLUDED.net_revenue,
    avg_order_value = EXCLUDED.avg_order_value,
    is_paying_user = EXCLUDED.is_paying_user,
    days_to_first_payment = EXCLUDED.days_to_first_payment,
    updated_at = now();
END;
$$;

-- 5) 결제 완료 시 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION trg_update_revenue_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 결제 상태 변경 시 매출 요약 업데이트
  IF NEW.status IN ('paid', 'refunded') AND (OLD.status IS NULL OR OLD.status != NEW.status) THEN
    PERFORM update_user_revenue_summary(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_payment_revenue_update ON payment_orders;
CREATE TRIGGER trg_payment_revenue_update
  AFTER INSERT OR UPDATE ON payment_orders
  FOR EACH ROW
  EXECUTE FUNCTION trg_update_revenue_on_payment();

-- 6) 기존 데이터 백필
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT DISTINCT user_id FROM payment_orders LOOP
    PERFORM update_user_revenue_summary(r.user_id);
  END LOOP;
END;
$$;

-- 7) 신규 가입자 매출 요약 초기화
CREATE OR REPLACE FUNCTION trg_init_revenue_summary()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_revenue_summary (
    user_id, signup_date, signup_cohort_week, signup_cohort_month,
    is_paying_user, total_revenue, total_payments
  ) VALUES (
    NEW.id,
    DATE(NEW.created_at),
    DATE(date_trunc('week', NEW.created_at)),
    DATE(date_trunc('month', NEW.created_at)),
    false, 0, 0
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_init_user_revenue ON auth.users;
CREATE TRIGGER trg_init_user_revenue
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION trg_init_revenue_summary();

-- 8) 기존 사용자 백필 (매출 요약 없는 사용자)
INSERT INTO user_revenue_summary (
  user_id, signup_date, signup_cohort_week, signup_cohort_month,
  is_paying_user, total_revenue, total_payments
)
SELECT
  id,
  DATE(created_at),
  DATE(date_trunc('week', created_at)),
  DATE(date_trunc('month', created_at)),
  false, 0, 0
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_revenue_summary)
ON CONFLICT (user_id) DO NOTHING;

-- 9) 일별 매출 집계 뷰
CREATE OR REPLACE VIEW daily_revenue_summary AS
SELECT
  DATE(po.paid_at) as date,
  COUNT(*) as total_orders,
  COUNT(DISTINCT po.user_id) as unique_payers,
  SUM(po.amount) as total_revenue,
  AVG(po.amount) as avg_order_value,
  SUM(po.credits) as total_credits_sold
FROM payment_orders po
WHERE po.status = 'paid'
GROUP BY DATE(po.paid_at)
ORDER BY date DESC;

-- 10) 패키지별 판매 집계 뷰
CREATE OR REPLACE VIEW package_sales_summary AS
SELECT
  cp.name as package_name,
  cp.credits,
  cp.price_krw,
  COUNT(po.id) as total_sales,
  SUM(po.amount) as total_revenue,
  COUNT(DISTINCT po.user_id) as unique_buyers
FROM credit_packages cp
LEFT JOIN payment_orders po ON cp.id = po.package_id AND po.status = 'paid'
GROUP BY cp.id, cp.name, cp.credits, cp.price_krw
ORDER BY total_revenue DESC NULLS LAST;

-- 11) RLS 정책
ALTER TABLE user_revenue_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all revenue summaries"
  ON user_revenue_summary FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Users can view own revenue summary"
  ON user_revenue_summary FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 12) 권한 부여
GRANT SELECT ON daily_revenue_summary TO authenticated;
GRANT SELECT ON package_sales_summary TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_arppu_by_cohort TO authenticated;
GRANT EXECUTE ON FUNCTION get_arppu_summary TO authenticated;

-- 코멘트
COMMENT ON TABLE user_revenue_summary IS '사용자별 매출 요약 (ARPPU 분석용)';
COMMENT ON FUNCTION calculate_arppu_by_cohort IS '코호트별 ARPPU 계산';
COMMENT ON FUNCTION get_arppu_summary IS '전체 ARPPU 요약 (기간별 비교)';
COMMENT ON VIEW daily_revenue_summary IS '일별 매출 집계';
COMMENT ON VIEW package_sales_summary IS '패키지별 판매 집계';
