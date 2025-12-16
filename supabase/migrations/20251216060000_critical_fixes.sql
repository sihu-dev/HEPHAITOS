-- ============================================
-- Critical Fixes Migration
-- 날짜: 2025-12-16
-- 수정 내용:
--   P0-1: 트리거 충돌 해결 (handle_new_user 통합)
--   P0-2: RLS 정책 허점 수정
--   P1: calculate_refund 로직 오류 수정
--   추가 인덱스 생성
-- ============================================

-- ============================================
-- P0-1: 트리거 충돌 해결
-- 기존: 2개의 트리거가 auth.users INSERT에 바인딩
--   - handle_new_user (profiles + user_settings 생성)
--   - create_credit_wallet_for_new_user (credit_wallets 생성)
-- 해결: 하나의 통합 트리거로 변경
-- ============================================

-- 1. 기존 트리거 제거
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. 통합 함수 생성
CREATE OR REPLACE FUNCTION handle_new_user_complete()
RETURNS TRIGGER AS $$
BEGIN
  -- 1) 프로필 생성
  INSERT INTO profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );

  -- 2) 사용자 설정 생성
  INSERT INTO user_settings (user_id)
  VALUES (NEW.id);

  -- 3) 크레딧 지갑 생성 (신규 가입 보너스 50 크레딧)
  INSERT INTO credit_wallets (user_id, balance, lifetime_purchased, lifetime_spent)
  VALUES (NEW.id, 50, 0, 0);

  -- 4) 보너스 거래 내역 기록
  INSERT INTO credit_transactions (user_id, type, amount, balance_after, description)
  VALUES (NEW.id, 'bonus', 50, 50, '신규 가입 보너스');

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- 이미 존재하는 경우 무시 (멱등성)
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user_complete failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 통합 트리거 생성
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_complete();

-- 4. 기존 개별 함수 유지 (호환성)
-- handle_new_user, create_credit_wallet_for_new_user는 직접 호출 시 사용 가능

COMMENT ON FUNCTION handle_new_user_complete IS '신규 사용자 생성 시 프로필, 설정, 크레딧 지갑을 원자적으로 생성';

-- ============================================
-- P0-2: RLS 정책 허점 수정
-- 문제: payment_orders UPDATE가 USING(true) - 누구나 수정 가능
-- 문제: ai_usage_events INSERT가 WITH CHECK(true) - 누구나 삽입 가능
-- ============================================

-- payment_orders: 기존 위험한 정책 제거 및 재생성
DROP POLICY IF EXISTS "Service role can update payment orders" ON payment_orders;

-- Service role은 RLS를 바이패스하므로 별도 정책 불필요
-- 일반 사용자는 자신의 주문만 제한적 업데이트 가능
CREATE POLICY "Users can cancel own pending orders"
  ON payment_orders FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (status IN ('pending', 'cancelled'));

-- ai_usage_events: 기존 위험한 정책 제거 및 재생성
DROP POLICY IF EXISTS "Service role can insert ai usage events" ON ai_usage_events;

-- 사용자는 자신의 이벤트만 삽입 가능
CREATE POLICY "Users can insert own ai usage events"
  ON ai_usage_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- safety_events: RLS 강화 (이미 admin 체크 있으나 INSERT 정책 수정)
DROP POLICY IF EXISTS "Service role can insert safety events" ON safety_events;

-- safety_events는 Service Role(RLS 바이패스)로만 삽입해야 함
-- 일반 사용자 삽입 차단
CREATE POLICY "Block user insert on safety events"
  ON safety_events FOR INSERT
  WITH CHECK (false);

-- ============================================
-- P1: calculate_refund 로직 오류 수정
-- 문제: status = 'completed'가 아닌 'paid'여야 함
-- ============================================

CREATE OR REPLACE FUNCTION public.calculate_refund(
  p_order_id text,
  p_user_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_amount integer;
  v_order_credits integer;
  v_paid_at timestamptz;
  v_used_credits integer;
  v_usage_rate numeric(5,2);
  v_refund_amount integer;
  v_eligible boolean;
BEGIN
  -- 주문 정보 조회 (status = 'paid' 수정!)
  SELECT amount, credits, paid_at INTO v_order_amount, v_order_credits, v_paid_at
  FROM public.payment_orders
  WHERE order_id = p_order_id
    AND user_id = p_user_id
    AND status = 'paid';  -- 수정: completed → paid

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'error', 'Order not found or not paid'
    );
  END IF;

  -- 사용한 크레딧 계산 (주문 이후 사용분)
  SELECT COALESCE(SUM(ABS(amount)), 0) INTO v_used_credits
  FROM public.credit_transactions
  WHERE user_id = p_user_id
    AND type = 'spend'
    AND feature IS NOT NULL
    AND created_at >= v_paid_at;

  -- 사용률 계산
  v_usage_rate := ROUND((v_used_credits::numeric / NULLIF(v_order_credits, 0)) * 100, 2);

  -- 환불액 계산 (환불 정책)
  -- 10% 이하 사용: 전액 환불
  -- 10~50% 사용: 50% 환불
  -- 50% 이상 사용: 환불 불가
  IF v_usage_rate <= 10 THEN
    v_refund_amount := v_order_amount;
    v_eligible := true;
  ELSIF v_usage_rate <= 50 THEN
    v_refund_amount := v_order_amount / 2;
    v_eligible := true;
  ELSE
    v_refund_amount := 0;
    v_eligible := false;
  END IF;

  RETURN jsonb_build_object(
    'eligible', v_eligible,
    'refund_amount', v_refund_amount,
    'order_amount', v_order_amount,
    'credits_used', v_used_credits,
    'credits_total', v_order_credits,
    'usage_rate', v_usage_rate,
    'refund_rate', CASE
      WHEN v_usage_rate <= 10 THEN 100
      WHEN v_usage_rate <= 50 THEN 50
      ELSE 0
    END
  );
END;
$$;

COMMENT ON FUNCTION public.calculate_refund IS '환불액 계산 RPC - status=paid 체크 수정됨';

-- ============================================
-- 추가 인덱스 (성능 최적화)
-- ============================================

-- 복합 인덱스 (자주 사용되는 쿼리 패턴)
CREATE INDEX IF NOT EXISTS idx_trades_user_symbol
  ON trades(user_id, symbol);

CREATE INDEX IF NOT EXISTS idx_trades_user_created
  ON trades(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_type
  ON credit_transactions(user_id, type);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_created
  ON credit_transactions(user_id, created_at DESC);

-- JSONB 인덱스 (config, result 필드 검색용)
CREATE INDEX IF NOT EXISTS idx_strategies_config_gin
  ON strategies USING GIN (config);

CREATE INDEX IF NOT EXISTS idx_backtest_jobs_result_gin
  ON backtest_jobs USING GIN (result);

-- 부분 인덱스 (자주 필터되는 조건)
CREATE INDEX IF NOT EXISTS idx_strategies_running
  ON strategies(user_id)
  WHERE status = 'running';

CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON notifications(user_id, created_at DESC)
  WHERE read = false;

CREATE INDEX IF NOT EXISTS idx_backtest_jobs_pending
  ON backtest_jobs(created_at)
  WHERE status IN ('queued', 'processing');

-- ============================================
-- trades DELETE 정책 추가 (누락됨)
-- ============================================

CREATE POLICY "Users can delete own trades"
  ON trades FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 완료
-- ============================================

COMMENT ON FUNCTION handle_new_user_complete IS
  '통합 신규 사용자 핸들러 - profiles, user_settings, credit_wallets 원자적 생성';
