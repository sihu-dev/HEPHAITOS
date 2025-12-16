-- ============================================
-- GPT V1 피드백 P0-1: grant_credits_for_paid_order RPC
-- 결제 완료 후 크레딧 지급 (멱등성 보장)
-- 날짜: 2025-12-17
-- ============================================

-- 1. payment_orders에 idempotency_key 컬럼 추가 (없는 경우)
ALTER TABLE payment_orders
ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;

-- 2. credit_transactions에 payment_order_id 컬럼 추가 (없는 경우)
ALTER TABLE credit_transactions
ADD COLUMN IF NOT EXISTS payment_order_id UUID REFERENCES payment_orders(id);

-- 3. 중복 지급 방지 유니크 인덱스
CREATE UNIQUE INDEX IF NOT EXISTS uniq_credit_purchase_per_order
ON credit_transactions(payment_order_id)
WHERE type = 'purchase';

-- ============================================
-- grant_credits_for_paid_order RPC 함수
-- ============================================
CREATE OR REPLACE FUNCTION grant_credits_for_paid_order(
  p_order_id TEXT,
  p_payment_key TEXT,
  p_paid_amount INTEGER,
  p_raw JSONB
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order payment_orders%ROWTYPE;
BEGIN
  -- 1. 주문 락 (FOR UPDATE)
  SELECT * INTO v_order
  FROM payment_orders
  WHERE order_id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND: %', p_order_id;
  END IF;

  -- 2. 이미 paid면 멱등 성공 (그냥 종료)
  IF v_order.status = 'paid' THEN
    RETURN;
  END IF;

  -- 3. 금액 검증 (서버 금액과 일치해야 함)
  IF v_order.amount <> p_paid_amount THEN
    RAISE EXCEPTION 'AMOUNT_MISMATCH: expected %, got %', v_order.amount, p_paid_amount;
  END IF;

  -- 4. payment_key 저장 및 상태 업데이트
  UPDATE payment_orders
  SET
    status = 'paid',
    paid_at = NOW(),
    payment_key = p_payment_key,
    raw = p_raw,
    updated_at = NOW()
  WHERE id = v_order.id;

  -- 5. 지갑이 없으면 생성
  INSERT INTO credit_wallets (user_id, balance, lifetime_purchased, lifetime_spent)
  VALUES (v_order.user_id, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- 6. 크레딧 지급 (주문당 purchase 1회 - 유니크 인덱스로 중복 차단)
  INSERT INTO credit_transactions (
    user_id,
    type,
    amount,
    balance_after,
    description,
    metadata,
    payment_order_id
  )
  SELECT
    v_order.user_id,
    'purchase',
    v_order.credits,
    (SELECT balance + v_order.credits FROM credit_wallets WHERE user_id = v_order.user_id),
    '크레딧 충전',
    jsonb_build_object('order_id', v_order.order_id, 'provider', 'toss'),
    v_order.id;

  -- 7. 지갑 잔액 업데이트
  UPDATE credit_wallets
  SET
    balance = balance + v_order.credits,
    lifetime_purchased = lifetime_purchased + v_order.credits,
    updated_at = NOW()
  WHERE user_id = v_order.user_id;

END;
$$;

COMMENT ON FUNCTION grant_credits_for_paid_order IS
  'GPT V1 피드백 P0-1: 결제 완료 후 크레딧 지급 (멱등성 보장)';

-- ============================================
-- 완료
-- ============================================
