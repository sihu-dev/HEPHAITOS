-- Loop 13: CS/환불 자동화 시스템
-- 목표: CS 처리 시간 90% 감소, 운영 비용 90% 절감
-- 생성일: 2025-12-22

-- ============================================
-- 1. Refund Requests Table
-- ============================================

CREATE TABLE IF NOT EXISTS refund_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE NOT NULL,

  -- 환불 정보
  refund_amount INTEGER NOT NULL, -- 원화 (₩)
  reason TEXT,

  -- 상태
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'failed')),
  rejection_reason TEXT,

  -- PG 정보
  pg_refund_id TEXT, -- 토스페이먼츠 refund ID

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,

  -- 메타데이터
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_refund_requests_user_id ON refund_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_payment_id ON refund_requests(payment_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON refund_requests(status);
CREATE INDEX IF NOT EXISTS idx_refund_requests_created_at ON refund_requests(created_at DESC);

-- ============================================
-- 2. Refund History View (분석용)
-- ============================================

CREATE OR REPLACE VIEW refund_history AS
SELECT
  rr.id as refund_request_id,
  rr.user_id,
  u.email as user_email,
  rr.payment_id,
  p.amount as original_amount,
  rr.refund_amount,
  rr.status,
  rr.reason,
  rr.rejection_reason,
  rr.created_at as requested_at,
  rr.processed_at,
  EXTRACT(EPOCH FROM (rr.processed_at - rr.created_at))/60 as processing_minutes,
  CASE
    WHEN rr.processed_at IS NULL THEN NULL
    ELSE DATE_TRUNC('day', rr.processed_at - rr.created_at)
  END as processing_time
FROM refund_requests rr
LEFT JOIN auth.users u ON rr.user_id = u.id
LEFT JOIN payments p ON rr.payment_id = p.id;

-- ============================================
-- 3. Helper Function: 환불 자격 확인
-- ============================================

CREATE OR REPLACE FUNCTION check_refund_eligibility(
  p_user_id UUID,
  p_payment_id UUID
)
RETURNS TABLE (
  eligible BOOLEAN,
  reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $
DECLARE
  v_payment_date TIMESTAMPTZ;
  v_days_since_payment INTEGER;
  v_refund_count INTEGER;
BEGIN
  -- 1. 결제 날짜 조회
  SELECT created_at INTO v_payment_date
  FROM payments
  WHERE id = p_payment_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, '결제 정보를 찾을 수 없습니다';
    RETURN;
  END IF;

  -- 2. 결제 후 경과 일수 확인 (14일 이내)
  v_days_since_payment := EXTRACT(DAY FROM (NOW() - v_payment_date));

  IF v_days_since_payment > 14 THEN
    RETURN QUERY SELECT false, '환불 가능 기간이 지났습니다 (결제 후 14일 이내)';
    RETURN;
  END IF;

  -- 3. 환불 이력 확인 (1년간 1회 제한)
  SELECT COUNT(*) INTO v_refund_count
  FROM refund_requests
  WHERE user_id = p_user_id
    AND status = 'approved'
    AND created_at >= NOW() - INTERVAL '1 year';

  IF v_refund_count >= 1 THEN
    RETURN QUERY SELECT false, '연간 환불 횟수를 초과했습니다 (최대 1회)';
    RETURN;
  END IF;

  -- 4. 자격 있음
  RETURN QUERY SELECT true, '환불 가능합니다';
END;
$;

-- ============================================
-- 4. Trigger: 환불 완료 시 크레딧 회수
-- ============================================

CREATE OR REPLACE FUNCTION handle_refund_approved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $
BEGIN
  -- 환불 승인 시 해당 결제로 지급된 크레딧 회수
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- credits 테이블에서 해당 payment_id로 지급된 크레딧 삭제 또는 마이너스 처리
    -- TODO: 실제 크레딧 시스템 로직에 맞게 구현
    UPDATE user_credits
    SET balance = balance - (
      SELECT credits_granted
      FROM payments
      WHERE id = NEW.payment_id
    )
    WHERE user_id = NEW.user_id;

    -- 로그 기록
    INSERT INTO credit_transactions (user_id, amount, type, reference_id, metadata)
    VALUES (
      NEW.user_id,
      -(SELECT credits_granted FROM payments WHERE id = NEW.payment_id),
      'refund_reclaim',
      NEW.id,
      jsonb_build_object('refund_request_id', NEW.id, 'payment_id', NEW.payment_id)
    );
  END IF;

  RETURN NEW;
END;
$;

CREATE TRIGGER trigger_refund_approved
  AFTER UPDATE ON refund_requests
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND OLD.status != 'approved')
  EXECUTE FUNCTION handle_refund_approved();

-- ============================================
-- 5. RLS 정책
-- ============================================

ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 환불 요청만 조회/생성 가능
CREATE POLICY "Users can view their own refund requests"
  ON refund_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own refund requests"
  ON refund_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role은 모든 권한
CREATE POLICY "Service role can do anything"
  ON refund_requests FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- 6. 코멘트
-- ============================================

COMMENT ON TABLE refund_requests IS
'Loop 13: 환불 요청 자동화. 1년간 1회 제한, 결제 후 14일 이내';

COMMENT ON FUNCTION check_refund_eligibility IS
'Loop 13: 환불 자격 확인 (14일 이내, 1회/년)';

COMMENT ON VIEW refund_history IS
'Loop 13: 환불 이력 분석용 뷰 (처리 시간, 승인율 등)';
