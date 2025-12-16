-- ============================================
-- HEPHAITOS 크레딧 시스템 데이터베이스 마이그레이션
-- 작성일: 2025-12-16
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. 크레딧 지갑 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS credit_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance INT NOT NULL DEFAULT 0 CHECK (balance >= 0),
  lifetime_purchased INT NOT NULL DEFAULT 0 CHECK (lifetime_purchased >= 0),
  lifetime_spent INT NOT NULL DEFAULT 0 CHECK (lifetime_spent >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_credit_wallets_user_id ON credit_wallets(user_id);
CREATE INDEX idx_credit_wallets_balance ON credit_wallets(balance);

-- ============================================
-- 2. 크레딧 거래 내역 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('purchase', 'spend', 'refund', 'bonus', 'referral')),
  amount INT NOT NULL,
  balance_after INT NOT NULL CHECK (balance_after >= 0),
  feature VARCHAR(50), -- 'ai_strategy', 'backtest', 'coaching', 'ai_tutor', 'realtime_alert'
  description TEXT,
  metadata JSONB, -- 추가 메타데이터 (결제 정보, 전략 ID 등)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX idx_credit_transactions_feature ON credit_transactions(feature);

-- ============================================
-- 3. 크레딧 패키지 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS credit_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL UNIQUE,
  credits INT NOT NULL CHECK (credits > 0),
  bonus_credits INT NOT NULL DEFAULT 0 CHECK (bonus_credits >= 0),
  price_krw INT NOT NULL CHECK (price_krw > 0),
  price_usd DECIMAL(10, 2),
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 기본 패키지 데이터 삽입
INSERT INTO credit_packages (name, credits, bonus_credits, price_krw, price_usd, display_order)
VALUES
  ('starter', 100, 0, 9900, 7.99, 1),
  ('basic', 500, 50, 39000, 29.99, 2),
  ('pro', 1000, 150, 69000, 54.99, 3),
  ('enterprise', 5000, 1000, 299000, 239.99, 4)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 4. 크레딧 소비 설정 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS credit_costs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feature VARCHAR(50) NOT NULL UNIQUE,
  cost INT NOT NULL CHECK (cost >= 0),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 기본 크레딧 소비 설정
INSERT INTO credit_costs (feature, cost, description)
VALUES
  ('celebrity_mirror', 0, '셀럽 포트폴리오 미러링 (무료 진입)'),
  ('ai_tutor', 1, 'AI 튜터 질문 (저가 진입점)'),
  ('ai_strategy', 10, 'AI 전략 생성 (핵심 수익)'),
  ('backtest_1y', 3, '백테스팅 1년 (검증 필수)'),
  ('backtest_5y', 10, '백테스팅 5년'),
  ('live_coaching_30m', 20, '라이브 코칭 30분 (프리미엄)'),
  ('live_coaching_60m', 35, '라이브 코칭 60분'),
  ('realtime_alert_1d', 5, '실시간 알림 1일 (지속 사용)'),
  ('realtime_alert_7d', 30, '실시간 알림 7일'),
  ('realtime_alert_30d', 100, '실시간 알림 30일'),
  ('portfolio_analysis', 5, 'AI 포트폴리오 분석'),
  ('risk_assessment', 5, 'AI 리스크 분석'),
  ('market_report', 3, 'AI 시장 리포트 생성')
ON CONFLICT (feature) DO NOTHING;

-- ============================================
-- 5. 추천 보상 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referrer_bonus INT NOT NULL DEFAULT 30,
  referee_bonus INT NOT NULL DEFAULT 30,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(referrer_id, referee_id)
);

CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referee_id ON referrals(referee_id);
CREATE INDEX idx_referrals_status ON referrals(status);

-- ============================================
-- 6. 함수: 크레딧 지갑 생성 (신규 가입 시)
-- ============================================
CREATE OR REPLACE FUNCTION create_credit_wallet_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO credit_wallets (user_id, balance, lifetime_purchased, lifetime_spent)
  VALUES (NEW.id, 50, 0, 0); -- 신규 가입 보너스 50 크레딧

  -- 보너스 거래 내역 기록
  INSERT INTO credit_transactions (user_id, type, amount, balance_after, description)
  VALUES (NEW.id, 'bonus', 50, 50, '신규 가입 보너스');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. 트리거: 신규 사용자 가입 시 지갑 생성
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_credit_wallet_for_new_user();

-- ============================================
-- 8. 함수: 크레딧 잔액 조회
-- ============================================
CREATE OR REPLACE FUNCTION get_credit_balance(p_user_id UUID)
RETURNS INT AS $$
  SELECT balance FROM credit_wallets WHERE user_id = p_user_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================
-- 9. 함수: 크레딧 차감 (트랜잭션 포함)
-- ============================================
CREATE OR REPLACE FUNCTION spend_credits(
  p_user_id UUID,
  p_amount INT,
  p_feature VARCHAR(50),
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_current_balance INT;
  v_new_balance INT;
  v_transaction_id UUID;
BEGIN
  -- 1. 현재 잔액 확인 (FOR UPDATE로 락 걸기)
  SELECT balance INTO v_current_balance
  FROM credit_wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- 2. 잔액 부족 확인
  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'WALLET_NOT_FOUND',
      'error_message', '사용자 지갑을 찾을 수 없습니다.'
    );
  END IF;

  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'INSUFFICIENT_BALANCE',
      'error_message', '크레딧이 부족합니다.',
      'current_balance', v_current_balance,
      'required', p_amount
    );
  END IF;

  -- 3. 새 잔액 계산
  v_new_balance := v_current_balance - p_amount;

  -- 4. 지갑 업데이트
  UPDATE credit_wallets
  SET
    balance = v_new_balance,
    lifetime_spent = lifetime_spent + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- 5. 거래 내역 기록
  INSERT INTO credit_transactions (user_id, type, amount, balance_after, feature, description, metadata)
  VALUES (p_user_id, 'spend', -p_amount, v_new_balance, p_feature, p_description, p_metadata)
  RETURNING id INTO v_transaction_id;

  -- 6. 결과 반환
  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'previous_balance', v_current_balance,
    'new_balance', v_new_balance,
    'amount_spent', p_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 10. 함수: 크레딧 충전
-- ============================================
CREATE OR REPLACE FUNCTION add_credits(
  p_user_id UUID,
  p_amount INT,
  p_type VARCHAR(20) DEFAULT 'purchase',
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_current_balance INT;
  v_new_balance INT;
  v_transaction_id UUID;
BEGIN
  -- 1. 현재 잔액 확인 (FOR UPDATE로 락 걸기)
  SELECT balance INTO v_current_balance
  FROM credit_wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RAISE EXCEPTION '사용자 지갑을 찾을 수 없습니다.';
  END IF;

  -- 2. 새 잔액 계산
  v_new_balance := v_current_balance + p_amount;

  -- 3. 지갑 업데이트
  UPDATE credit_wallets
  SET
    balance = v_new_balance,
    lifetime_purchased = CASE
      WHEN p_type = 'purchase' THEN lifetime_purchased + p_amount
      ELSE lifetime_purchased
    END,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- 4. 거래 내역 기록
  INSERT INTO credit_transactions (user_id, type, amount, balance_after, description, metadata)
  VALUES (p_user_id, p_type, p_amount, v_new_balance, p_description, p_metadata)
  RETURNING id INTO v_transaction_id;

  -- 5. 결과 반환
  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'previous_balance', v_current_balance,
    'new_balance', v_new_balance,
    'amount_added', p_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 11. Row Level Security (RLS) 정책
-- ============================================

-- credit_wallets RLS
ALTER TABLE credit_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallet"
  ON credit_wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet"
  ON credit_wallets FOR UPDATE
  USING (auth.uid() = user_id);

-- credit_transactions RLS
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
  ON credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON credit_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- credit_packages RLS (모두 읽기 가능)
ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active packages"
  ON credit_packages FOR SELECT
  USING (is_active = true);

-- credit_costs RLS (모두 읽기 가능)
ALTER TABLE credit_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active credit costs"
  ON credit_costs FOR SELECT
  USING (is_active = true);

-- referrals RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

-- ============================================
-- 완료
-- ============================================
COMMENT ON TABLE credit_wallets IS 'HEPHAITOS 크레딧 지갑 - 사용자별 크레딧 잔액 관리';
COMMENT ON TABLE credit_transactions IS 'HEPHAITOS 크레딧 거래 내역 - 모든 충전/소비 기록';
COMMENT ON TABLE credit_packages IS 'HEPHAITOS 크레딧 패키지 - 구매 가능한 패키지 정의';
COMMENT ON TABLE credit_costs IS 'HEPHAITOS 크레딧 소비 설정 - 기능별 크레딧 비용';
COMMENT ON TABLE referrals IS 'HEPHAITOS 추천 보상 시스템';
