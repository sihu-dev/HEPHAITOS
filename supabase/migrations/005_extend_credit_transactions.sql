-- ============================================
-- Credit Transactions 타입 확장
-- 추가 타입 및 컬럼 지원
-- ============================================

-- 기존 CHECK 제약조건 삭제 및 재생성
ALTER TABLE credit_transactions
  DROP CONSTRAINT IF EXISTS credit_transactions_type_check;

ALTER TABLE credit_transactions
  ADD CONSTRAINT credit_transactions_type_check
  CHECK (type IN (
    'purchase',    -- 크레딧 구매
    'spend',       -- 일반 소비
    'refund',      -- 환불
    'bonus',       -- 보너스
    'referral',    -- 추천 보상
    'backtest',    -- 백테스트 소비
    'strategy_generate',  -- AI 전략 생성
    'report_create',      -- AI 리포트 생성
    'coaching_session',   -- 코칭 세션
    'tutor_answer'        -- AI 튜터 답변
  ));

-- payment_order_id 컬럼 추가 (결제 연동)
ALTER TABLE credit_transactions
  ADD COLUMN IF NOT EXISTS payment_order_id UUID REFERENCES payment_orders(id);

-- balance_after 컬럼 NOT NULL 제약 제거 (기존 데이터 호환)
ALTER TABLE credit_transactions
  ALTER COLUMN balance_after DROP NOT NULL;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_credit_transactions_payment_order_id
  ON credit_transactions(payment_order_id);

-- 코멘트
COMMENT ON COLUMN credit_transactions.payment_order_id IS '연관 결제 주문 ID';
