-- ============================================
-- Subscriptions 테이블
-- 사용자 구독 상태 관리
-- Created: 2025-12-22
-- ============================================

-- subscriptions 테이블 생성
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 플랜 정보
  plan_id TEXT NOT NULL DEFAULT 'free',  -- 'free', 'starter', 'pro', 'team'
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),

  -- 상태
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),

  -- 기간
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),

  -- 취소 관련
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancelled_at TIMESTAMPTZ,

  -- 결제 방법
  payment_method TEXT,  -- 'card', 'transfer', 'phone'

  -- 타임스탬프
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period_end ON subscriptions(current_period_end);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS subscriptions_updated_at ON subscriptions;
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_subscription_updated_at();

-- RLS 활성화
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS 정책
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own subscription" ON subscriptions;
CREATE POLICY "Users can insert own subscription"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can update subscriptions" ON subscriptions;
CREATE POLICY "Service role can update subscriptions"
  ON subscriptions FOR UPDATE
  USING (true);

-- 신규 사용자 가입 시 무료 플랜 자동 생성 함수
CREATE OR REPLACE FUNCTION create_subscription_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (user_id, plan_id, billing_cycle, status)
  VALUES (NEW.id, 'free', 'monthly', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거: 신규 사용자 가입 시 구독 생성
DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_subscription_for_new_user();

-- 구독 업그레이드/다운그레이드 함수
CREATE OR REPLACE FUNCTION update_subscription(
  p_user_id UUID,
  p_plan_id TEXT,
  p_billing_cycle TEXT DEFAULT 'monthly'
)
RETURNS JSONB AS $$
DECLARE
  v_subscription subscriptions%ROWTYPE;
BEGIN
  -- 기존 구독 조회
  SELECT * INTO v_subscription
  FROM subscriptions
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_subscription.id IS NULL THEN
    -- 구독이 없으면 새로 생성
    INSERT INTO subscriptions (user_id, plan_id, billing_cycle, status)
    VALUES (p_user_id, p_plan_id, p_billing_cycle, 'active')
    RETURNING * INTO v_subscription;
  ELSE
    -- 기존 구독 업데이트
    UPDATE subscriptions
    SET
      plan_id = p_plan_id,
      billing_cycle = p_billing_cycle,
      current_period_start = NOW(),
      current_period_end = CASE
        WHEN p_billing_cycle = 'yearly' THEN NOW() + INTERVAL '365 days'
        ELSE NOW() + INTERVAL '30 days'
      END,
      cancel_at_period_end = false,
      cancelled_at = NULL,
      status = 'active'
    WHERE user_id = p_user_id
    RETURNING * INTO v_subscription;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'subscription', row_to_json(v_subscription)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 구독 취소 함수
CREATE OR REPLACE FUNCTION cancel_subscription(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_subscription subscriptions%ROWTYPE;
BEGIN
  UPDATE subscriptions
  SET
    cancel_at_period_end = true,
    cancelled_at = NOW()
  WHERE user_id = p_user_id
  RETURNING * INTO v_subscription;

  IF v_subscription.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Subscription not found'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'subscription', row_to_json(v_subscription)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 코멘트
COMMENT ON TABLE subscriptions IS 'HEPHAITOS 구독 관리 - 사용자 플랜 및 결제 주기';
