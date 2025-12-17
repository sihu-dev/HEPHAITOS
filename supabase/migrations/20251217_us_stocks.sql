-- ============================================
-- US Stock Data Integration (Alpaca)
-- Loop 23: 해외 주식 연동
-- ============================================

-- 1) 미국 종목 마스터 테이블
CREATE TABLE IF NOT EXISTS us_stock_master (
  symbol TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  exchange TEXT NOT NULL,  -- NYSE, NASDAQ, AMEX, etc.
  asset_class TEXT NOT NULL DEFAULT 'us_equity',
  sector TEXT,
  industry TEXT,
  market_cap BIGINT,
  tradable BOOLEAN DEFAULT true,
  marginable BOOLEAN DEFAULT true,
  shortable BOOLEAN DEFAULT false,
  fractionable BOOLEAN DEFAULT false,
  easy_to_borrow BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_us_stock_name ON us_stock_master(name);
CREATE INDEX IF NOT EXISTS idx_us_stock_exchange ON us_stock_master(exchange);
CREATE INDEX IF NOT EXISTS idx_us_stock_sector ON us_stock_master(sector);

-- 주요 종목 초기 데이터
INSERT INTO us_stock_master (symbol, name, exchange, sector, industry) VALUES
  -- Technology
  ('AAPL', 'Apple Inc.', 'NASDAQ', 'Technology', 'Consumer Electronics'),
  ('MSFT', 'Microsoft Corporation', 'NASDAQ', 'Technology', 'Software'),
  ('GOOGL', 'Alphabet Inc.', 'NASDAQ', 'Technology', 'Internet Services'),
  ('AMZN', 'Amazon.com Inc.', 'NASDAQ', 'Consumer Cyclical', 'E-Commerce'),
  ('NVDA', 'NVIDIA Corporation', 'NASDAQ', 'Technology', 'Semiconductors'),
  ('META', 'Meta Platforms Inc.', 'NASDAQ', 'Technology', 'Social Media'),
  ('TSLA', 'Tesla Inc.', 'NASDAQ', 'Consumer Cyclical', 'Electric Vehicles'),
  ('AVGO', 'Broadcom Inc.', 'NASDAQ', 'Technology', 'Semiconductors'),
  ('ADBE', 'Adobe Inc.', 'NASDAQ', 'Technology', 'Software'),
  ('CRM', 'Salesforce Inc.', 'NYSE', 'Technology', 'Cloud Software'),
  ('ORCL', 'Oracle Corporation', 'NYSE', 'Technology', 'Software'),
  ('AMD', 'Advanced Micro Devices', 'NASDAQ', 'Technology', 'Semiconductors'),
  ('INTC', 'Intel Corporation', 'NASDAQ', 'Technology', 'Semiconductors'),
  ('CSCO', 'Cisco Systems', 'NASDAQ', 'Technology', 'Networking'),
  ('QCOM', 'Qualcomm Inc.', 'NASDAQ', 'Technology', 'Semiconductors'),
  -- Financial
  ('BRK.B', 'Berkshire Hathaway', 'NYSE', 'Financial', 'Diversified'),
  ('JPM', 'JPMorgan Chase & Co.', 'NYSE', 'Financial', 'Banking'),
  ('V', 'Visa Inc.', 'NYSE', 'Financial', 'Payment Processing'),
  ('MA', 'Mastercard Inc.', 'NYSE', 'Financial', 'Payment Processing'),
  ('BAC', 'Bank of America Corp.', 'NYSE', 'Financial', 'Banking'),
  ('WFC', 'Wells Fargo & Co.', 'NYSE', 'Financial', 'Banking'),
  ('GS', 'Goldman Sachs Group', 'NYSE', 'Financial', 'Investment Banking'),
  ('MS', 'Morgan Stanley', 'NYSE', 'Financial', 'Investment Banking'),
  -- Healthcare
  ('UNH', 'UnitedHealth Group', 'NYSE', 'Healthcare', 'Health Insurance'),
  ('JNJ', 'Johnson & Johnson', 'NYSE', 'Healthcare', 'Pharmaceuticals'),
  ('PFE', 'Pfizer Inc.', 'NYSE', 'Healthcare', 'Pharmaceuticals'),
  ('LLY', 'Eli Lilly and Company', 'NYSE', 'Healthcare', 'Pharmaceuticals'),
  ('MRK', 'Merck & Co.', 'NYSE', 'Healthcare', 'Pharmaceuticals'),
  ('ABBV', 'AbbVie Inc.', 'NYSE', 'Healthcare', 'Pharmaceuticals'),
  -- Energy
  ('XOM', 'Exxon Mobil Corporation', 'NYSE', 'Energy', 'Oil & Gas'),
  ('CVX', 'Chevron Corporation', 'NYSE', 'Energy', 'Oil & Gas'),
  ('COP', 'ConocoPhillips', 'NYSE', 'Energy', 'Oil & Gas'),
  -- Consumer
  ('WMT', 'Walmart Inc.', 'NYSE', 'Consumer Defensive', 'Retail'),
  ('PG', 'Procter & Gamble', 'NYSE', 'Consumer Defensive', 'Household Products'),
  ('KO', 'Coca-Cola Company', 'NYSE', 'Consumer Defensive', 'Beverages'),
  ('PEP', 'PepsiCo Inc.', 'NYSE', 'Consumer Defensive', 'Beverages'),
  ('COST', 'Costco Wholesale', 'NASDAQ', 'Consumer Defensive', 'Retail'),
  ('HD', 'Home Depot Inc.', 'NYSE', 'Consumer Cyclical', 'Home Improvement'),
  ('MCD', 'McDonald''s Corporation', 'NYSE', 'Consumer Cyclical', 'Restaurants'),
  ('NKE', 'Nike Inc.', 'NYSE', 'Consumer Cyclical', 'Apparel'),
  -- Industrial
  ('CAT', 'Caterpillar Inc.', 'NYSE', 'Industrial', 'Machinery'),
  ('BA', 'Boeing Company', 'NYSE', 'Industrial', 'Aerospace'),
  ('UPS', 'United Parcel Service', 'NYSE', 'Industrial', 'Logistics'),
  ('HON', 'Honeywell International', 'NASDAQ', 'Industrial', 'Conglomerate'),
  ('GE', 'General Electric', 'NYSE', 'Industrial', 'Conglomerate'),
  -- Communication
  ('DIS', 'Walt Disney Company', 'NYSE', 'Communication', 'Entertainment'),
  ('NFLX', 'Netflix Inc.', 'NASDAQ', 'Communication', 'Streaming'),
  ('T', 'AT&T Inc.', 'NYSE', 'Communication', 'Telecom'),
  ('VZ', 'Verizon Communications', 'NYSE', 'Communication', 'Telecom'),
  ('CMCSA', 'Comcast Corporation', 'NASDAQ', 'Communication', 'Media')
ON CONFLICT (symbol) DO NOTHING;

-- 2) 미국 주식 일별 가격 히스토리
CREATE TABLE IF NOT EXISTS us_stock_daily_prices (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  trade_date DATE NOT NULL,

  -- OHLCV
  open_price NUMERIC(15,4) NOT NULL,
  high_price NUMERIC(15,4) NOT NULL,
  low_price NUMERIC(15,4) NOT NULL,
  close_price NUMERIC(15,4) NOT NULL,
  volume BIGINT NOT NULL,
  vwap NUMERIC(15,4),  -- Volume Weighted Average Price

  -- 변동
  change_price NUMERIC(15,4),
  change_percent NUMERIC(10,4),

  -- 거래 수
  trade_count INTEGER,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(symbol, trade_date)
);

CREATE INDEX IF NOT EXISTS idx_us_daily_prices_symbol ON us_stock_daily_prices(symbol);
CREATE INDEX IF NOT EXISTS idx_us_daily_prices_date ON us_stock_daily_prices(trade_date DESC);

-- 3) 미국 주식 분봉 데이터 (최근 데이터만)
CREATE TABLE IF NOT EXISTS us_stock_minute_prices (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  bar_time TIMESTAMPTZ NOT NULL,

  -- OHLCV
  open_price NUMERIC(15,4) NOT NULL,
  high_price NUMERIC(15,4) NOT NULL,
  low_price NUMERIC(15,4) NOT NULL,
  close_price NUMERIC(15,4) NOT NULL,
  volume BIGINT NOT NULL,
  vwap NUMERIC(15,4),
  trade_count INTEGER,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(symbol, bar_time)
);

CREATE INDEX IF NOT EXISTS idx_us_minute_prices_symbol ON us_stock_minute_prices(symbol);
CREATE INDEX IF NOT EXISTS idx_us_minute_prices_time ON us_stock_minute_prices(bar_time DESC);

-- 파티션 또는 TTL 정책으로 오래된 데이터 삭제 (7일 이상)
-- Note: 실제 운영시 pg_cron 등으로 자동화

-- 4) 미국 시장 세션 정보
CREATE TABLE IF NOT EXISTS us_market_sessions (
  id SERIAL PRIMARY KEY,
  session_date DATE NOT NULL UNIQUE,
  market_open TIME NOT NULL,
  market_close TIME NOT NULL,
  is_open BOOLEAN DEFAULT true,
  early_close BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_us_market_sessions_date ON us_market_sessions(session_date DESC);

-- 5) 사용자별 미국 주식 관심 목록 확장
-- (기존 stock_watchlist 테이블 활용, market = 'US')

-- 6) 환율 테이블 (USD/KRW)
CREATE TABLE IF NOT EXISTS exchange_rates (
  id SERIAL PRIMARY KEY,
  base_currency TEXT NOT NULL DEFAULT 'USD',
  quote_currency TEXT NOT NULL DEFAULT 'KRW',
  rate NUMERIC(15,4) NOT NULL,
  rate_date DATE NOT NULL,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(base_currency, quote_currency, rate_date)
);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_date ON exchange_rates(rate_date DESC);

-- 최근 환율 초기 데이터 (예시)
INSERT INTO exchange_rates (base_currency, quote_currency, rate, rate_date, source) VALUES
  ('USD', 'KRW', 1320.00, CURRENT_DATE, 'manual')
ON CONFLICT (base_currency, quote_currency, rate_date) DO NOTHING;

-- 7) Alpaca 주문 확장 정보 테이블
CREATE TABLE IF NOT EXISTS alpaca_orders_extended (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  order_log_id UUID REFERENCES order_logs(id),

  -- Alpaca 주문 정보
  alpaca_order_id TEXT NOT NULL,
  client_order_id TEXT,

  -- 주문 상세
  asset_id TEXT,
  asset_class TEXT DEFAULT 'us_equity',
  notional NUMERIC(15,4),
  time_in_force TEXT,  -- day, gtc, opg, cls, ioc, fok

  -- 고급 주문 옵션
  stop_price NUMERIC(15,4),
  trail_percent NUMERIC(10,4),
  trail_price NUMERIC(15,4),
  hwm NUMERIC(15,4),  -- High Water Mark

  -- 상태 추적
  submitted_at TIMESTAMPTZ,
  filled_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  replaced_at TIMESTAMPTZ,
  replaced_by TEXT,
  replaces TEXT,

  -- 연장 시간대 거래
  extended_hours BOOLEAN DEFAULT false,

  -- 체결 정보
  filled_qty NUMERIC(15,4),
  filled_avg_price NUMERIC(15,4),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alpaca_orders_user ON alpaca_orders_extended(user_id);
CREATE INDEX IF NOT EXISTS idx_alpaca_orders_alpaca_id ON alpaca_orders_extended(alpaca_order_id);

-- 8) 미국 주식 배당 정보 테이블
CREATE TABLE IF NOT EXISTS us_stock_dividends (
  id SERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  ex_date DATE NOT NULL,
  record_date DATE,
  payment_date DATE,
  cash_amount NUMERIC(10,4) NOT NULL,
  declaration_date DATE,
  dividend_type TEXT DEFAULT 'cash',  -- cash, stock, special
  frequency TEXT DEFAULT 'quarterly',  -- monthly, quarterly, semi_annual, annual
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(symbol, ex_date)
);

CREATE INDEX IF NOT EXISTS idx_us_dividends_symbol ON us_stock_dividends(symbol);
CREATE INDEX IF NOT EXISTS idx_us_dividends_ex_date ON us_stock_dividends(ex_date DESC);

-- 9) 포트폴리오 성과 계산 함수 (미국 주식)
CREATE OR REPLACE FUNCTION calculate_us_portfolio_value(
  p_user_id UUID
)
RETURNS TABLE (
  total_value_usd NUMERIC,
  total_value_krw NUMERIC,
  total_cost_usd NUMERIC,
  unrealized_pl_usd NUMERIC,
  unrealized_pl_percent NUMERIC,
  position_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exchange_rate NUMERIC;
BEGIN
  -- 최신 환율 조회
  SELECT rate INTO v_exchange_rate
  FROM exchange_rates
  WHERE base_currency = 'USD' AND quote_currency = 'KRW'
  ORDER BY rate_date DESC
  LIMIT 1;

  IF v_exchange_rate IS NULL THEN
    v_exchange_rate := 1320.00;  -- 기본값
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(SUM(ps.total_evaluation), 0) as total_value_usd,
    COALESCE(SUM(ps.total_evaluation), 0) * v_exchange_rate as total_value_krw,
    COALESCE(SUM(ps.total_purchase), 0) as total_cost_usd,
    COALESCE(SUM(ps.profit_loss), 0) as unrealized_pl_usd,
    CASE
      WHEN COALESCE(SUM(ps.total_purchase), 0) > 0
      THEN (COALESCE(SUM(ps.profit_loss), 0) / SUM(ps.total_purchase)) * 100
      ELSE 0
    END as unrealized_pl_percent,
    COUNT(*)::INTEGER as position_count
  FROM portfolio_snapshots ps
  WHERE ps.user_id = p_user_id
    AND ps.broker = 'alpaca'
    AND ps.snapshot_date = CURRENT_DATE;
END;
$$;

-- 10) 미국 시장 섹터별 성과 뷰
CREATE OR REPLACE VIEW us_sector_performance AS
SELECT
  m.sector,
  COUNT(*) as stock_count,
  AVG(p.change_percent) as avg_change_percent,
  SUM(p.volume) as total_volume,
  MAX(p.trade_date) as last_updated
FROM us_stock_master m
JOIN us_stock_daily_prices p ON m.symbol = p.symbol
WHERE m.is_active = true
  AND p.trade_date >= CURRENT_DATE - INTERVAL '1 day'
GROUP BY m.sector
ORDER BY avg_change_percent DESC;

-- 11) RLS 정책
ALTER TABLE us_stock_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE us_stock_daily_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE us_stock_minute_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE alpaca_orders_extended ENABLE ROW LEVEL SECURITY;
ALTER TABLE us_stock_dividends ENABLE ROW LEVEL SECURITY;

-- 종목 마스터/가격 데이터는 누구나 조회 가능
CREATE POLICY "Anyone can view us stock master" ON us_stock_master FOR SELECT USING (true);
CREATE POLICY "Anyone can view us stock daily prices" ON us_stock_daily_prices FOR SELECT USING (true);
CREATE POLICY "Anyone can view us stock minute prices" ON us_stock_minute_prices FOR SELECT USING (true);
CREATE POLICY "Anyone can view exchange rates" ON exchange_rates FOR SELECT USING (true);
CREATE POLICY "Anyone can view us stock dividends" ON us_stock_dividends FOR SELECT USING (true);

-- Alpaca 주문 확장은 본인만 접근
CREATE POLICY "Users can manage own alpaca orders" ON alpaca_orders_extended
  FOR ALL TO authenticated USING (user_id = auth.uid());

-- 12) 권한 부여
GRANT EXECUTE ON FUNCTION calculate_us_portfolio_value TO authenticated;

-- 코멘트
COMMENT ON TABLE us_stock_master IS '미국 종목 마스터';
COMMENT ON TABLE us_stock_daily_prices IS '미국 종목 일별 가격';
COMMENT ON TABLE us_stock_minute_prices IS '미국 종목 분봉 가격';
COMMENT ON TABLE exchange_rates IS '환율 정보';
COMMENT ON TABLE alpaca_orders_extended IS 'Alpaca 주문 확장 정보';
COMMENT ON TABLE us_stock_dividends IS '미국 주식 배당 정보';
