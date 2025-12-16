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
