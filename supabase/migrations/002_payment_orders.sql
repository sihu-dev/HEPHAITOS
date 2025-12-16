-- ============================================
-- Payment Orders 테이블
-- 크레딧 결제 주문 관리
-- ============================================

-- payment_orders 테이블 생성
CREATE TABLE IF NOT EXISTS payment_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL UNIQUE,  -- Tosspayments 주문 ID

  -- 결제 정보
  amount INTEGER NOT NULL CHECK (amount > 0),  -- 결제 금액 (원)
  credits INTEGER NOT NULL CHECK (credits > 0),  -- 충전 크레딧
  package_id UUID REFERENCES credit_packages(id),

  -- 상태
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled', 'refunded')),

  -- Tosspayments 응답
  payment_key TEXT,
  raw JSONB,  -- 전체 응답 저장

  -- 환불 관련
  refund_amount INTEGER,
  refund_reason TEXT,
  refunded_at TIMESTAMPTZ,

  -- 타임스탬프
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX idx_payment_orders_order_id ON payment_orders(order_id);
CREATE INDEX idx_payment_orders_status ON payment_orders(status);
CREATE INDEX idx_payment_orders_created_at ON payment_orders(created_at DESC);

-- updated_at 트리거
CREATE TRIGGER payment_orders_updated_at
  BEFORE UPDATE ON payment_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS 활성화
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "Users can view own payment orders"
  ON payment_orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment orders"
  ON payment_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can update payment orders"
  ON payment_orders FOR UPDATE
  USING (true);

-- 코멘트
COMMENT ON TABLE payment_orders IS 'HEPHAITOS 결제 주문 - Tosspayments 연동';
