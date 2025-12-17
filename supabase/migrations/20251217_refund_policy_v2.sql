-- ============================================
-- Enhanced Refund Policy v2
-- Loop 14: 환불 정책 고도화
-- ============================================

-- 1) 환불 정책 규칙 테이블
CREATE TABLE IF NOT EXISTS refund_policy_rules (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  -- 사용률 조건 (usage_rate)
  min_usage_rate NUMERIC(5,2) DEFAULT 0,
  max_usage_rate NUMERIC(5,2) DEFAULT 100,
  -- 기간 조건 (days since purchase)
  min_days INTEGER DEFAULT 0,
  max_days INTEGER DEFAULT 9999,
  -- 환불률
  refund_rate NUMERIC(5,2) NOT NULL,  -- 0-100%
  -- 조건
  requires_approval BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 50,  -- 높을수록 우선
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 기본 환불 규칙 삽입 (상세 정책)
INSERT INTO refund_policy_rules (name, description, min_usage_rate, max_usage_rate, min_days, max_days, refund_rate, requires_approval, priority) VALUES
  -- 즉시 환불 (7일 이내 + 미사용)
  ('instant_unused', '7일 이내 미사용 즉시 환불', 0, 0, 0, 7, 100, false, 100),
  -- 7일 이내 소량 사용
  ('week_low_usage', '7일 이내 10% 이하 사용', 0.01, 10, 0, 7, 90, false, 90),
  ('week_medium_usage', '7일 이내 10-30% 사용', 10.01, 30, 0, 7, 70, false, 85),
  ('week_high_usage', '7일 이내 30-50% 사용', 30.01, 50, 0, 7, 50, true, 80),
  -- 30일 이내
  ('month_low_usage', '30일 이내 10% 이하 사용', 0, 10, 8, 30, 80, false, 70),
  ('month_medium_usage', '30일 이내 10-30% 사용', 10.01, 30, 8, 30, 50, true, 65),
  ('month_high_usage', '30일 이내 30-50% 사용', 30.01, 50, 8, 30, 30, true, 60),
  -- 30일 초과
  ('over_month_low', '30일 초과 20% 이하 사용', 0, 20, 31, 90, 50, true, 50),
  ('over_month_medium', '30일 초과 20-40% 사용', 20.01, 40, 31, 90, 30, true, 45),
  -- 예외 케이스 (관리자 승인 필수)
  ('special_case', '특수 케이스 (관리자 판단)', 0, 100, 0, 9999, 0, true, 10),
  -- 환불 불가
  ('no_refund', '환불 불가 (50% 이상 사용 또는 90일 초과)', 50.01, 100, 0, 9999, 0, false, 1)
ON CONFLICT (name) DO NOTHING;

-- 2) 환불 요청 테이블 확장
ALTER TABLE refund_requests ADD COLUMN IF NOT EXISTS policy_rule TEXT;
ALTER TABLE refund_requests ADD COLUMN IF NOT EXISTS refund_rate NUMERIC(5,2);
ALTER TABLE refund_requests ADD COLUMN IF NOT EXISTS days_since_purchase INTEGER;
ALTER TABLE refund_requests ADD COLUMN IF NOT EXISTS auto_approved BOOLEAN DEFAULT false;
ALTER TABLE refund_requests ADD COLUMN IF NOT EXISTS abuse_flag BOOLEAN DEFAULT false;
ALTER TABLE refund_requests ADD COLUMN IF NOT EXISTS abuse_score NUMERIC(5,2) DEFAULT 0;

-- 3) 환불 어뷰징 기록 테이블
CREATE TABLE IF NOT EXISTS refund_abuse_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  abuse_type TEXT NOT NULL,  -- 'frequent_refund', 'pattern_abuse', 'credit_farming'
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  details JSONB,
  action_taken TEXT,  -- 'warning', 'block_refund', 'account_suspend'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refund_abuse_user ON refund_abuse_records(user_id);
CREATE INDEX IF NOT EXISTS idx_refund_abuse_type ON refund_abuse_records(abuse_type);

-- 4) 고도화된 환불액 계산 함수
CREATE OR REPLACE FUNCTION calculate_refund_v2(
  p_order_id TEXT,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_used_credits INTEGER;
  v_usage_rate NUMERIC(5,2);
  v_days_since_purchase INTEGER;
  v_policy refund_policy_rules%ROWTYPE;
  v_refund_amount INTEGER;
  v_abuse_score NUMERIC(5,2);
  v_prev_refunds INTEGER;
BEGIN
  -- 1) 주문 정보 조회
  SELECT * INTO v_order
  FROM payment_orders
  WHERE order_id = p_order_id
    AND user_id = p_user_id
    AND status = 'paid';

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'error', 'ORDER_NOT_FOUND_OR_NOT_PAID'
    );
  END IF;

  -- 2) 사용 크레딧 계산
  SELECT COALESCE(SUM(ABS(amount)), 0) INTO v_used_credits
  FROM credit_transactions
  WHERE user_id = p_user_id
    AND type = 'spend'
    AND feature IS NOT NULL
    AND created_at >= v_order.paid_at;

  -- 3) 사용률 및 기간 계산
  v_usage_rate := ROUND((v_used_credits::NUMERIC / NULLIF(v_order.credits, 0)) * 100, 2);
  v_days_since_purchase := EXTRACT(DAY FROM NOW() - v_order.paid_at)::INTEGER;

  -- 4) 어뷰징 점수 계산
  SELECT COUNT(*) INTO v_prev_refunds
  FROM payment_orders
  WHERE user_id = p_user_id
    AND status = 'refunded'
    AND refunded_at >= NOW() - INTERVAL '90 days';

  v_abuse_score := CASE
    WHEN v_prev_refunds >= 3 THEN 80
    WHEN v_prev_refunds >= 2 THEN 50
    WHEN v_prev_refunds >= 1 THEN 20
    ELSE 0
  END;

  -- 빠른 환불 패턴 체크
  IF v_days_since_purchase <= 1 AND v_usage_rate > 30 THEN
    v_abuse_score := v_abuse_score + 30;  -- 하루 내 30% 이상 사용 후 환불 시도
  END IF;

  -- 5) 적용 가능한 정책 규칙 찾기 (우선순위 순)
  SELECT * INTO v_policy
  FROM refund_policy_rules
  WHERE is_active = true
    AND v_usage_rate >= min_usage_rate
    AND v_usage_rate < max_usage_rate
    AND v_days_since_purchase >= min_days
    AND v_days_since_purchase <= max_days
  ORDER BY priority DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'error', 'NO_MATCHING_POLICY',
      'usage_rate', v_usage_rate,
      'days_since_purchase', v_days_since_purchase
    );
  END IF;

  -- 6) 환불액 계산
  v_refund_amount := ROUND(v_order.amount * (v_policy.refund_rate / 100));

  -- 어뷰징 의심 시 자동 승인 불가
  IF v_abuse_score >= 50 THEN
    v_policy.requires_approval := true;
  END IF;

  RETURN jsonb_build_object(
    'eligible', v_policy.refund_rate > 0,
    'refund_amount', v_refund_amount,
    'refund_rate', v_policy.refund_rate,
    'order_amount', v_order.amount,
    'credits_used', v_used_credits,
    'credits_total', v_order.credits,
    'usage_rate', v_usage_rate,
    'days_since_purchase', v_days_since_purchase,
    'policy_rule', v_policy.name,
    'requires_approval', v_policy.requires_approval,
    'abuse_score', v_abuse_score,
    'abuse_flag', v_abuse_score >= 50,
    'auto_approved', NOT v_policy.requires_approval AND v_abuse_score < 50
  );
END;
$$;

-- 5) 환불 요청 생성 함수
CREATE OR REPLACE FUNCTION create_refund_request(
  p_order_id TEXT,
  p_user_id UUID,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_calc JSONB;
  v_request_id UUID;
BEGIN
  -- 환불액 계산
  v_calc := calculate_refund_v2(p_order_id, p_user_id);

  IF NOT (v_calc->>'eligible')::BOOLEAN THEN
    RETURN v_calc;
  END IF;

  -- 이미 환불 요청이 있는지 확인
  IF EXISTS (
    SELECT 1 FROM refund_requests
    WHERE order_id = p_order_id
      AND user_id = p_user_id
      AND status NOT IN ('rejected', 'completed')
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'REFUND_REQUEST_EXISTS'
    );
  END IF;

  -- 환불 요청 생성
  INSERT INTO refund_requests (
    user_id, order_id, reason, credits_used, credits_total,
    usage_rate, refund_amount, refund_rate, days_since_purchase,
    policy_rule, auto_approved, abuse_flag, abuse_score, status
  ) VALUES (
    p_user_id,
    p_order_id,
    p_reason,
    (v_calc->>'credits_used')::INTEGER,
    (v_calc->>'credits_total')::INTEGER,
    (v_calc->>'usage_rate')::NUMERIC,
    (v_calc->>'refund_amount')::INTEGER,
    (v_calc->>'refund_rate')::NUMERIC,
    (v_calc->>'days_since_purchase')::INTEGER,
    v_calc->>'policy_rule',
    (v_calc->>'auto_approved')::BOOLEAN,
    (v_calc->>'abuse_flag')::BOOLEAN,
    (v_calc->>'abuse_score')::NUMERIC,
    CASE WHEN (v_calc->>'auto_approved')::BOOLEAN THEN 'approved' ELSE 'pending' END
  )
  RETURNING id INTO v_request_id;

  RETURN jsonb_build_object(
    'success', true,
    'request_id', v_request_id,
    'refund_amount', v_calc->>'refund_amount',
    'refund_rate', v_calc->>'refund_rate',
    'auto_approved', v_calc->>'auto_approved',
    'requires_approval', v_calc->>'requires_approval',
    'status', CASE WHEN (v_calc->>'auto_approved')::BOOLEAN THEN 'approved' ELSE 'pending' END
  );
END;
$$;

-- 6) 환불 통계 뷰 (고도화)
CREATE OR REPLACE VIEW refund_stats_v2 AS
SELECT
  DATE(rr.created_at) as date,
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE rr.status = 'approved') as approved,
  COUNT(*) FILTER (WHERE rr.status = 'rejected') as rejected,
  COUNT(*) FILTER (WHERE rr.status = 'completed') as completed,
  COUNT(*) FILTER (WHERE rr.status = 'pending') as pending,
  COUNT(*) FILTER (WHERE rr.auto_approved) as auto_approved,
  COUNT(*) FILTER (WHERE rr.abuse_flag) as abuse_flagged,
  AVG(rr.refund_amount) as avg_refund_amount,
  AVG(rr.usage_rate) as avg_usage_rate,
  AVG(rr.refund_rate) as avg_refund_rate,
  SUM(rr.refund_amount) FILTER (WHERE rr.status IN ('approved', 'completed')) as total_refunded
FROM refund_requests rr
GROUP BY DATE(rr.created_at)
ORDER BY date DESC;

-- 7) 정책별 환불 통계
CREATE OR REPLACE VIEW refund_by_policy AS
SELECT
  rr.policy_rule,
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE rr.status = 'completed') as completed,
  AVG(rr.refund_amount) as avg_amount,
  AVG(rr.refund_rate) as avg_rate,
  SUM(rr.refund_amount) FILTER (WHERE rr.status = 'completed') as total_refunded
FROM refund_requests rr
WHERE rr.policy_rule IS NOT NULL
GROUP BY rr.policy_rule
ORDER BY total_requests DESC;

-- 8) 어뷰징 감지 뷰
CREATE OR REPLACE VIEW refund_abuse_candidates AS
SELECT
  u.id as user_id,
  u.email,
  COUNT(*) as refund_count,
  SUM(rr.refund_amount) as total_refunded,
  AVG(rr.abuse_score) as avg_abuse_score,
  MAX(rr.abuse_score) as max_abuse_score,
  ARRAY_AGG(DISTINCT rr.policy_rule) as policies_used
FROM refund_requests rr
JOIN auth.users u ON rr.user_id = u.id
WHERE rr.created_at >= NOW() - INTERVAL '90 days'
GROUP BY u.id, u.email
HAVING COUNT(*) >= 2 OR AVG(rr.abuse_score) >= 30
ORDER BY avg_abuse_score DESC, refund_count DESC;

-- 9) RLS 정책
ALTER TABLE refund_policy_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_abuse_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active policies"
  ON refund_policy_rules FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage policies"
  ON refund_policy_rules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can view abuse records"
  ON refund_abuse_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 10) 권한 부여
GRANT SELECT ON refund_stats_v2 TO authenticated;
GRANT SELECT ON refund_by_policy TO authenticated;
GRANT SELECT ON refund_abuse_candidates TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_refund_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION create_refund_request TO authenticated;

-- 코멘트
COMMENT ON TABLE refund_policy_rules IS '환불 정책 규칙 테이블 (사용률/기간별 차등)';
COMMENT ON TABLE refund_abuse_records IS '환불 어뷰징 기록';
COMMENT ON FUNCTION calculate_refund_v2 IS '고도화된 환불액 계산 (정책 기반)';
COMMENT ON FUNCTION create_refund_request IS '환불 요청 생성 및 자동 승인';
COMMENT ON VIEW refund_stats_v2 IS '환불 일별 통계';
COMMENT ON VIEW refund_by_policy IS '정책별 환불 통계';
COMMENT ON VIEW refund_abuse_candidates IS '환불 어뷰징 의심 사용자';
