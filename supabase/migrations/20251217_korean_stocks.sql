-- ============================================
-- Korean Stock Data Integration
-- Loop 22: 한국 주식 데이터 연동
-- ============================================

-- 1) 증권사 인증 정보 테이블
CREATE TABLE IF NOT EXISTS broker_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- 증권사 정보
  broker TEXT NOT NULL CHECK (broker IN ('kis', 'kiwoom', 'alpaca', 'interactive_brokers')),
  broker_name TEXT NOT NULL,

  -- 인증 정보 (암호화 권장)
  app_key TEXT NOT NULL,
  app_secret TEXT NOT NULL,
  account_no TEXT NOT NULL,
  account_product_code TEXT DEFAULT '01',

  -- 설정
  is_paper BOOLEAN DEFAULT false,  -- 모의투자 여부
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,  -- 기본 계좌

  -- 토큰 캐시
  access_token TEXT,
  token_expires_at TIMESTAMPTZ,

  -- 메타데이터
  nickname TEXT,  -- 사용자 지정 별명
  last_connected_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, broker, account_no)
);

CREATE INDEX IF NOT EXISTS idx_broker_credentials_user ON broker_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_broker_credentials_broker ON broker_credentials(broker);

-- 2) 주문 로그 테이블
CREATE TABLE IF NOT EXISTS order_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- 주문 정보
  broker TEXT NOT NULL,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  quantity INTEGER NOT NULL,
  price NUMERIC(15,2),
  order_type TEXT NOT NULL DEFAULT 'limit' CHECK (order_type IN ('limit', 'market')),

  -- 주문 결과
  order_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'filled', 'partial', 'cancelled', 'rejected')),
  filled_quantity INTEGER DEFAULT 0,
  filled_price NUMERIC(15,2),
  message TEXT,

  -- 전략 연결
  strategy_id UUID,
  execution_id UUID,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_logs_user ON order_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_order_logs_symbol ON order_logs(symbol);
CREATE INDEX IF NOT EXISTS idx_order_logs_status ON order_logs(status);
CREATE INDEX IF NOT EXISTS idx_order_logs_created ON order_logs(created_at DESC);

-- 3) 포트폴리오 스냅샷 테이블
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  broker TEXT NOT NULL,

  -- 스냅샷 시간
  snapshot_date DATE NOT NULL,
  snapshot_time TIME NOT NULL DEFAULT CURRENT_TIME,

  -- 계좌 요약
  total_assets NUMERIC(20,2) NOT NULL,
  total_deposit NUMERIC(20,2) NOT NULL,
  available_cash NUMERIC(20,2) NOT NULL,
  total_purchase NUMERIC(20,2) NOT NULL,
  total_evaluation NUMERIC(20,2) NOT NULL,
  profit_loss NUMERIC(20,2) NOT NULL,
  profit_loss_rate NUMERIC(10,4) NOT NULL,

  -- 보유 종목 (JSON)
  holdings JSONB DEFAULT '[]',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, broker, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_user ON portfolio_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_date ON portfolio_snapshots(snapshot_date DESC);

-- 4) 종목 관심 목록 테이블
CREATE TABLE IF NOT EXISTS stock_watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- 종목 정보
  symbol TEXT NOT NULL,
  market TEXT NOT NULL CHECK (market IN ('KR', 'US', 'CRYPTO')),
  name TEXT NOT NULL,

  -- 설정
  alert_enabled BOOLEAN DEFAULT false,
  alert_price_above NUMERIC(20,2),
  alert_price_below NUMERIC(20,2),
  alert_change_percent NUMERIC(5,2),

  -- 메모
  notes TEXT,
  tags TEXT[] DEFAULT '{}',

  -- 순서
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, symbol, market)
);

CREATE INDEX IF NOT EXISTS idx_watchlist_user ON stock_watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_market ON stock_watchlist(market);

-- 5) 주요 한국 종목 마스터 테이블
CREATE TABLE IF NOT EXISTS kr_stock_master (
  symbol TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  english_name TEXT,
  market TEXT NOT NULL CHECK (market IN ('KOSPI', 'KOSDAQ', 'KONEX')),
  sector TEXT,
  industry TEXT,
  market_cap BIGINT,
  listed_shares BIGINT,
  fiscal_month INTEGER,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kr_stock_name ON kr_stock_master(name);
CREATE INDEX IF NOT EXISTS idx_kr_stock_market ON kr_stock_master(market);
CREATE INDEX IF NOT EXISTS idx_kr_stock_sector ON kr_stock_master(sector);

-- 주요 종목 초기 데이터
INSERT INTO kr_stock_master (symbol, name, english_name, market, sector) VALUES
  ('005930', '삼성전자', 'Samsung Electronics', 'KOSPI', '전기전자'),
  ('000660', 'SK하이닉스', 'SK Hynix', 'KOSPI', '전기전자'),
  ('373220', 'LG에너지솔루션', 'LG Energy Solution', 'KOSPI', '전기전자'),
  ('207940', '삼성바이오로직스', 'Samsung Biologics', 'KOSPI', '의약품'),
  ('005380', '현대차', 'Hyundai Motor', 'KOSPI', '운수장비'),
  ('006400', '삼성SDI', 'Samsung SDI', 'KOSPI', '전기전자'),
  ('035420', 'NAVER', 'NAVER', 'KOSPI', '서비스업'),
  ('035720', '카카오', 'Kakao', 'KOSPI', '서비스업'),
  ('051910', 'LG화학', 'LG Chem', 'KOSPI', '화학'),
  ('068270', '셀트리온', 'Celltrion', 'KOSPI', '의약품'),
  ('028260', '삼성물산', 'Samsung C&T', 'KOSPI', '유통업'),
  ('105560', 'KB금융', 'KB Financial Group', 'KOSPI', '금융업'),
  ('055550', '신한지주', 'Shinhan Financial Group', 'KOSPI', '금융업'),
  ('012330', '현대모비스', 'Hyundai Mobis', 'KOSPI', '운수장비'),
  ('066570', 'LG전자', 'LG Electronics', 'KOSPI', '전기전자'),
  ('003550', 'LG', 'LG Corp', 'KOSPI', '기타'),
  ('096770', 'SK이노베이션', 'SK Innovation', 'KOSPI', '화학'),
  ('034730', 'SK', 'SK', 'KOSPI', '기타'),
  ('000270', '기아', 'Kia', 'KOSPI', '운수장비'),
  ('018260', '삼성에스디에스', 'Samsung SDS', 'KOSPI', '서비스업'),
  -- KOSDAQ 주요 종목
  ('247540', '에코프로비엠', 'Ecopro BM', 'KOSDAQ', '전기전자'),
  ('086520', '에코프로', 'Ecopro', 'KOSDAQ', '전기전자'),
  ('263750', '펄어비스', 'Pearl Abyss', 'KOSDAQ', '서비스업'),
  ('293490', '카카오게임즈', 'Kakao Games', 'KOSDAQ', '서비스업'),
  ('196170', '알테오젠', 'Alteogen', 'KOSDAQ', '의약품')
ON CONFLICT (symbol) DO NOTHING;

-- 6) 일별 가격 히스토리 테이블
CREATE TABLE IF NOT EXISTS kr_stock_daily_prices (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  trade_date DATE NOT NULL,

  -- OHLCV
  open_price NUMERIC(15,2) NOT NULL,
  high_price NUMERIC(15,2) NOT NULL,
  low_price NUMERIC(15,2) NOT NULL,
  close_price NUMERIC(15,2) NOT NULL,
  volume BIGINT NOT NULL,
  trading_value BIGINT,

  -- 변동
  change_price NUMERIC(15,2),
  change_percent NUMERIC(10,4),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(symbol, trade_date)
);

CREATE INDEX IF NOT EXISTS idx_kr_daily_prices_symbol ON kr_stock_daily_prices(symbol);
CREATE INDEX IF NOT EXISTS idx_kr_daily_prices_date ON kr_stock_daily_prices(trade_date DESC);

-- 7) 실시간 알림 설정 테이블
CREATE TABLE IF NOT EXISTS stock_price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- 종목 정보
  symbol TEXT NOT NULL,
  market TEXT NOT NULL,
  name TEXT NOT NULL,

  -- 알림 조건
  condition_type TEXT NOT NULL CHECK (condition_type IN ('price_above', 'price_below', 'change_percent', 'volume_spike')),
  condition_value NUMERIC(20,4) NOT NULL,

  -- 상태
  is_active BOOLEAN DEFAULT true,
  triggered_at TIMESTAMPTZ,
  triggered_price NUMERIC(15,2),

  -- 반복 설정
  is_recurring BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON stock_price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_symbol ON stock_price_alerts(symbol);
CREATE INDEX IF NOT EXISTS idx_price_alerts_active ON stock_price_alerts(is_active) WHERE is_active = true;

-- 8) 포트폴리오 성과 계산 함수
CREATE OR REPLACE FUNCTION calculate_portfolio_performance(
  p_user_id UUID,
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  snapshot_date DATE,
  total_assets NUMERIC,
  profit_loss NUMERIC,
  profit_loss_rate NUMERIC,
  daily_return NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ps.snapshot_date,
    ps.total_assets,
    ps.profit_loss,
    ps.profit_loss_rate,
    CASE
      WHEN LAG(ps.total_assets) OVER (ORDER BY ps.snapshot_date) IS NOT NULL
      THEN ((ps.total_assets - LAG(ps.total_assets) OVER (ORDER BY ps.snapshot_date))
            / LAG(ps.total_assets) OVER (ORDER BY ps.snapshot_date)) * 100
      ELSE 0
    END as daily_return
  FROM portfolio_snapshots ps
  WHERE ps.user_id = p_user_id
    AND ps.snapshot_date BETWEEN p_start_date AND p_end_date
  ORDER BY ps.snapshot_date;
END;
$$;

-- 9) 관심 종목 추가 함수
CREATE OR REPLACE FUNCTION add_to_watchlist(
  p_user_id UUID,
  p_symbol TEXT,
  p_market TEXT,
  p_name TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO stock_watchlist (user_id, symbol, market, name, notes)
  VALUES (p_user_id, p_symbol, p_market, p_name, p_notes)
  ON CONFLICT (user_id, symbol, market) DO UPDATE SET
    notes = COALESCE(p_notes, stock_watchlist.notes),
    updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- 10) RLS 정책
ALTER TABLE broker_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_price_alerts ENABLE ROW LEVEL SECURITY;

-- 본인 데이터만 접근
CREATE POLICY "Users can manage own broker credentials" ON broker_credentials
  FOR ALL TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can view own orders" ON order_logs
  FOR ALL TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can manage own portfolio snapshots" ON portfolio_snapshots
  FOR ALL TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can manage own watchlist" ON stock_watchlist
  FOR ALL TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can manage own price alerts" ON stock_price_alerts
  FOR ALL TO authenticated USING (user_id = auth.uid());

-- 종목 마스터는 누구나 조회 가능
ALTER TABLE kr_stock_master ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view kr stock master" ON kr_stock_master FOR SELECT USING (true);

-- 가격 히스토리는 누구나 조회 가능
ALTER TABLE kr_stock_daily_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view kr stock prices" ON kr_stock_daily_prices FOR SELECT USING (true);

-- 11) 권한 부여
GRANT EXECUTE ON FUNCTION calculate_portfolio_performance TO authenticated;
GRANT EXECUTE ON FUNCTION add_to_watchlist TO authenticated;

-- 코멘트
COMMENT ON TABLE broker_credentials IS '증권사 인증 정보';
COMMENT ON TABLE order_logs IS '주문 로그';
COMMENT ON TABLE portfolio_snapshots IS '포트폴리오 스냅샷';
COMMENT ON TABLE stock_watchlist IS '종목 관심 목록';
COMMENT ON TABLE kr_stock_master IS '한국 종목 마스터';
COMMENT ON TABLE kr_stock_daily_prices IS '한국 종목 일별 가격';
COMMENT ON TABLE stock_price_alerts IS '가격 알림 설정';
