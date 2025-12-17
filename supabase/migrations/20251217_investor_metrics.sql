-- ============================================
-- Investor Metrics & Series A Preparation
-- Loop 25: 시리즈 A 준비 자료
-- ============================================

-- 1) 투자자 지표 스냅샷 테이블
CREATE TABLE IF NOT EXISTS investor_metrics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL UNIQUE,

  -- User Metrics
  total_users INTEGER NOT NULL DEFAULT 0,
  mau INTEGER NOT NULL DEFAULT 0,  -- Monthly Active Users
  wau INTEGER NOT NULL DEFAULT 0,  -- Weekly Active Users
  dau INTEGER NOT NULL DEFAULT 0,  -- Daily Active Users

  -- Growth Metrics
  new_users_mtd INTEGER DEFAULT 0,  -- Month to Date
  new_users_mom_growth NUMERIC(10,2) DEFAULT 0,  -- Month over Month %
  churn_rate NUMERIC(5,2) DEFAULT 0,

  -- Retention Metrics
  d1_retention NUMERIC(5,2) DEFAULT 0,
  d7_retention NUMERIC(5,2) DEFAULT 0,
  d30_retention NUMERIC(5,2) DEFAULT 0,

  -- Revenue Metrics
  mrr NUMERIC(15,2) NOT NULL DEFAULT 0,  -- Monthly Recurring Revenue
  arr NUMERIC(15,2) NOT NULL DEFAULT 0,  -- Annual Recurring Revenue
  revenue_mtd NUMERIC(15,2) DEFAULT 0,
  revenue_mom_growth NUMERIC(10,2) DEFAULT 0,

  -- Unit Economics
  arpu NUMERIC(10,2) DEFAULT 0,  -- Average Revenue Per User
  arppu NUMERIC(10,2) DEFAULT 0, -- Average Revenue Per Paying User
  ltv NUMERIC(15,2) DEFAULT 0,   -- Lifetime Value
  cac NUMERIC(10,2) DEFAULT 0,   -- Customer Acquisition Cost
  ltv_cac_ratio NUMERIC(5,2) DEFAULT 0,

  -- Conversion Metrics
  free_to_paid_rate NUMERIC(5,2) DEFAULT 0,
  trial_conversion_rate NUMERIC(5,2) DEFAULT 0,

  -- Product Metrics
  total_strategies_created INTEGER DEFAULT 0,
  total_trades_executed INTEGER DEFAULT 0,
  total_trading_volume NUMERIC(20,2) DEFAULT 0,

  -- AI Usage Metrics
  ai_queries_mtd INTEGER DEFAULT 0,
  ai_cost_mtd NUMERIC(10,2) DEFAULT 0,
  ai_cost_per_user NUMERIC(10,2) DEFAULT 0,

  -- Market Metrics
  addressable_market_size NUMERIC(20,2) DEFAULT 0,  -- TAM
  serviceable_market_size NUMERIC(20,2) DEFAULT 0,  -- SAM
  obtainable_market_size NUMERIC(20,2) DEFAULT 0,   -- SOM

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_investor_metrics_date ON investor_metrics_snapshots(snapshot_date DESC);

-- 2) 투자 라운드 정보 테이블
CREATE TABLE IF NOT EXISTS funding_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 라운드 정보
  round_name TEXT NOT NULL,  -- 'Pre-Seed', 'Seed', 'Series A', etc.
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),

  -- 투자 금액
  target_amount NUMERIC(15,2) NOT NULL,
  raised_amount NUMERIC(15,2) DEFAULT 0,
  currency TEXT DEFAULT 'KRW',

  -- 밸류에이션
  pre_money_valuation NUMERIC(20,2),
  post_money_valuation NUMERIC(20,2),

  -- 일정
  target_close_date DATE,
  actual_close_date DATE,

  -- 리드 투자자
  lead_investor TEXT,
  lead_investor_amount NUMERIC(15,2),

  -- 사용 계획
  use_of_funds JSONB DEFAULT '{}',
  /*
  예시:
  {
    "product": {"percent": 40, "description": "제품 개발 및 AI 고도화"},
    "marketing": {"percent": 30, "description": "마케팅 및 사용자 획득"},
    "operations": {"percent": 20, "description": "운영 및 인프라"},
    "team": {"percent": 10, "description": "팀 확장"}
  }
  */

  -- 메모
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3) 투자자 테이블
CREATE TABLE IF NOT EXISTS investors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 투자자 정보
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('vc', 'angel', 'corporate', 'accelerator', 'other')),
  website TEXT,
  contact_email TEXT,
  contact_name TEXT,

  -- 관심 분야
  focus_areas TEXT[] DEFAULT '{}',
  investment_stage TEXT[] DEFAULT '{}',  -- 'seed', 'series_a', etc.
  typical_check_size_min NUMERIC(15,2),
  typical_check_size_max NUMERIC(15,2),

  -- 관계 상태
  relationship_status TEXT DEFAULT 'cold' CHECK (relationship_status IN ('cold', 'warm', 'hot', 'term_sheet', 'committed', 'passed')),
  last_contact_date DATE,
  next_followup_date DATE,

  -- 미팅 기록
  meetings_count INTEGER DEFAULT 0,
  notes TEXT,

  -- 태그
  tags TEXT[] DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_investors_status ON investors(relationship_status);
CREATE INDEX IF NOT EXISTS idx_investors_type ON investors(type);

-- 4) 투자자 미팅 로그
CREATE TABLE IF NOT EXISTS investor_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID REFERENCES investors(id),
  funding_round_id UUID REFERENCES funding_rounds(id),

  -- 미팅 정보
  meeting_date TIMESTAMPTZ NOT NULL,
  meeting_type TEXT NOT NULL CHECK (meeting_type IN ('intro', 'pitch', 'dd', 'partner_meeting', 'term_sheet', 'closing', 'other')),
  location TEXT,
  attendees TEXT[] DEFAULT '{}',

  -- 미팅 내용
  agenda TEXT,
  notes TEXT,
  key_questions TEXT[] DEFAULT '{}',
  action_items TEXT[] DEFAULT '{}',

  -- 결과
  outcome TEXT CHECK (outcome IN ('positive', 'neutral', 'negative', 'pending')),
  next_steps TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_investor_meetings_date ON investor_meetings(meeting_date DESC);
CREATE INDEX IF NOT EXISTS idx_investor_meetings_investor ON investor_meetings(investor_id);

-- 5) KPI 목표 테이블
CREATE TABLE IF NOT EXISTS kpi_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- KPI 정보
  kpi_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('growth', 'revenue', 'retention', 'product', 'efficiency')),

  -- 기간
  period_type TEXT NOT NULL CHECK (period_type IN ('monthly', 'quarterly', 'yearly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- 목표 및 실제
  target_value NUMERIC(20,4) NOT NULL,
  actual_value NUMERIC(20,4),
  unit TEXT DEFAULT 'number',  -- 'number', 'percent', 'currency'

  -- 달성률
  achievement_rate NUMERIC(10,2),

  -- 메모
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(kpi_name, period_type, period_start)
);

CREATE INDEX IF NOT EXISTS idx_kpi_targets_period ON kpi_targets(period_start DESC);
CREATE INDEX IF NOT EXISTS idx_kpi_targets_category ON kpi_targets(category);

-- 6) 경쟁사 분석 테이블
CREATE TABLE IF NOT EXISTS competitor_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 경쟁사 정보
  name TEXT NOT NULL,
  website TEXT,
  description TEXT,

  -- 기본 정보
  founded_year INTEGER,
  headquarters TEXT,
  employee_count_range TEXT,

  -- 펀딩 정보
  total_funding NUMERIC(20,2),
  latest_round TEXT,
  latest_valuation NUMERIC(20,2),

  -- 제품 비교
  target_market TEXT,
  key_features TEXT[] DEFAULT '{}',
  pricing_model TEXT,
  pricing_range TEXT,

  -- SWOT
  strengths TEXT[] DEFAULT '{}',
  weaknesses TEXT[] DEFAULT '{}',

  -- 우리와의 차별점
  our_advantages TEXT[] DEFAULT '{}',
  their_advantages TEXT[] DEFAULT '{}',

  -- 시장 점유율 추정
  estimated_market_share NUMERIC(5,2),
  estimated_users INTEGER,
  estimated_revenue NUMERIC(15,2),

  -- 메모
  notes TEXT,
  last_updated DATE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7) 핵심 지표 계산 함수
CREATE OR REPLACE FUNCTION calculate_investor_metrics()
RETURNS investor_metrics_snapshots
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_metrics investor_metrics_snapshots;
  v_today DATE := CURRENT_DATE;
  v_month_start DATE := DATE_TRUNC('month', v_today)::DATE;
  v_prev_month_start DATE := (DATE_TRUNC('month', v_today) - INTERVAL '1 month')::DATE;
BEGIN
  -- 기존 스냅샷이 있으면 반환
  SELECT * INTO v_metrics
  FROM investor_metrics_snapshots
  WHERE snapshot_date = v_today;

  IF v_metrics IS NOT NULL THEN
    RETURN v_metrics;
  END IF;

  -- 새 스냅샷 생성
  INSERT INTO investor_metrics_snapshots (
    snapshot_date,
    total_users,
    mau,
    wau,
    dau,
    new_users_mtd,
    mrr,
    arr
  )
  SELECT
    v_today,
    -- Total Users
    (SELECT COUNT(*) FROM auth.users),
    -- MAU (30일 내 활동)
    (SELECT COUNT(DISTINCT user_id) FROM analytics_events
     WHERE created_at > v_today - INTERVAL '30 days'),
    -- WAU (7일 내 활동)
    (SELECT COUNT(DISTINCT user_id) FROM analytics_events
     WHERE created_at > v_today - INTERVAL '7 days'),
    -- DAU (오늘)
    (SELECT COUNT(DISTINCT user_id) FROM analytics_events
     WHERE DATE(created_at) = v_today),
    -- New Users MTD
    (SELECT COUNT(*) FROM auth.users
     WHERE DATE(created_at) >= v_month_start),
    -- MRR (이번 달 결제 합계)
    (SELECT COALESCE(SUM(amount), 0) FROM payment_orders
     WHERE status = 'completed' AND DATE(created_at) >= v_month_start),
    -- ARR (MRR * 12)
    (SELECT COALESCE(SUM(amount), 0) * 12 FROM payment_orders
     WHERE status = 'completed' AND DATE(created_at) >= v_month_start)
  RETURNING * INTO v_metrics;

  RETURN v_metrics;
END;
$$;

-- 8) 투자자용 대시보드 데이터 함수
CREATE OR REPLACE FUNCTION get_investor_dashboard_data()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_metrics investor_metrics_snapshots;
  v_prev_metrics investor_metrics_snapshots;
BEGIN
  -- 최신 지표
  SELECT * INTO v_metrics
  FROM investor_metrics_snapshots
  ORDER BY snapshot_date DESC
  LIMIT 1;

  -- 이전 달 지표
  SELECT * INTO v_prev_metrics
  FROM investor_metrics_snapshots
  WHERE snapshot_date < DATE_TRUNC('month', CURRENT_DATE)::DATE
  ORDER BY snapshot_date DESC
  LIMIT 1;

  v_result := jsonb_build_object(
    'snapshot_date', v_metrics.snapshot_date,

    -- Key Metrics
    'key_metrics', jsonb_build_object(
      'mrr', v_metrics.mrr,
      'arr', v_metrics.arr,
      'mau', v_metrics.mau,
      'total_users', v_metrics.total_users,
      'arpu', v_metrics.arpu,
      'ltv_cac_ratio', v_metrics.ltv_cac_ratio
    ),

    -- Growth
    'growth', jsonb_build_object(
      'users_mom', v_metrics.new_users_mom_growth,
      'revenue_mom', v_metrics.revenue_mom_growth,
      'new_users_mtd', v_metrics.new_users_mtd
    ),

    -- Retention
    'retention', jsonb_build_object(
      'd1', v_metrics.d1_retention,
      'd7', v_metrics.d7_retention,
      'd30', v_metrics.d30_retention,
      'churn_rate', v_metrics.churn_rate
    ),

    -- Unit Economics
    'unit_economics', jsonb_build_object(
      'arpu', v_metrics.arpu,
      'arppu', v_metrics.arppu,
      'ltv', v_metrics.ltv,
      'cac', v_metrics.cac,
      'ltv_cac', v_metrics.ltv_cac_ratio,
      'free_to_paid', v_metrics.free_to_paid_rate
    ),

    -- Product Metrics
    'product', jsonb_build_object(
      'strategies_created', v_metrics.total_strategies_created,
      'trades_executed', v_metrics.total_trades_executed,
      'trading_volume', v_metrics.total_trading_volume,
      'ai_queries', v_metrics.ai_queries_mtd
    ),

    -- Market
    'market', jsonb_build_object(
      'tam', v_metrics.addressable_market_size,
      'sam', v_metrics.serviceable_market_size,
      'som', v_metrics.obtainable_market_size
    ),

    -- Trends (최근 6개월)
    'trends', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'date', snapshot_date,
          'mrr', mrr,
          'mau', mau,
          'new_users', new_users_mtd
        )
        ORDER BY snapshot_date
      )
      FROM investor_metrics_snapshots
      WHERE snapshot_date >= CURRENT_DATE - INTERVAL '6 months'
    )
  );

  RETURN v_result;
END;
$$;

-- 9) 펀드레이징 파이프라인 뷰
CREATE OR REPLACE VIEW fundraising_pipeline AS
SELECT
  i.id as investor_id,
  i.name as investor_name,
  i.type as investor_type,
  i.relationship_status,
  i.typical_check_size_min,
  i.typical_check_size_max,
  i.last_contact_date,
  i.next_followup_date,
  i.meetings_count,
  COUNT(im.id) as total_meetings,
  MAX(im.meeting_date) as last_meeting_date,
  CASE
    WHEN i.relationship_status = 'committed' THEN 100
    WHEN i.relationship_status = 'term_sheet' THEN 75
    WHEN i.relationship_status = 'hot' THEN 50
    WHEN i.relationship_status = 'warm' THEN 25
    WHEN i.relationship_status = 'cold' THEN 10
    ELSE 0
  END as probability_percent
FROM investors i
LEFT JOIN investor_meetings im ON i.id = im.investor_id
GROUP BY i.id;

-- 10) 초기 데이터 삽입

-- 시리즈 A 라운드 정보
INSERT INTO funding_rounds (
  round_name, status, target_amount, currency,
  pre_money_valuation, target_close_date, use_of_funds
) VALUES (
  'Series A',
  'planned',
  5000000000,  -- 50억 원
  'KRW',
  20000000000,  -- Pre: 200억
  '2025-06-30',
  '{
    "product": {"percent": 40, "amount": 2000000000, "description": "AI 고도화 및 신규 기능 개발"},
    "marketing": {"percent": 30, "amount": 1500000000, "description": "사용자 획득 및 브랜딩"},
    "operations": {"percent": 20, "amount": 1000000000, "description": "인프라 및 운영"},
    "team": {"percent": 10, "amount": 500000000, "description": "핵심 인력 채용"}
  }'::jsonb
) ON CONFLICT DO NOTHING;

-- KPI 목표
INSERT INTO kpi_targets (kpi_name, category, period_type, period_start, period_end, target_value, unit) VALUES
  ('MAU', 'growth', 'monthly', '2025-01-01', '2025-01-31', 10000, 'number'),
  ('MAU', 'growth', 'monthly', '2025-02-01', '2025-02-28', 15000, 'number'),
  ('MAU', 'growth', 'monthly', '2025-03-01', '2025-03-31', 22000, 'number'),
  ('MRR', 'revenue', 'monthly', '2025-01-01', '2025-01-31', 50000000, 'currency'),
  ('MRR', 'revenue', 'monthly', '2025-02-01', '2025-02-28', 80000000, 'currency'),
  ('MRR', 'revenue', 'monthly', '2025-03-01', '2025-03-31', 120000000, 'currency'),
  ('D7 Retention', 'retention', 'monthly', '2025-01-01', '2025-01-31', 25, 'percent'),
  ('Free to Paid', 'revenue', 'monthly', '2025-01-01', '2025-01-31', 8, 'percent'),
  ('LTV/CAC', 'efficiency', 'quarterly', '2025-01-01', '2025-03-31', 3, 'number')
ON CONFLICT (kpi_name, period_type, period_start) DO NOTHING;

-- 경쟁사 분석
INSERT INTO competitor_analysis (name, website, description, target_market, key_features, our_advantages) VALUES
  (
    'Composer',
    'https://www.composer.trade',
    'No-code algorithmic trading platform',
    'US retail investors',
    ARRAY['No-code strategy builder', 'Backtesting', 'Auto-execution'],
    ARRAY['Korean market focus', 'AI-powered', 'Lower barrier', 'Education-first']
  ),
  (
    'QuantConnect',
    'https://www.quantconnect.com',
    'Open-source algorithmic trading platform',
    'Quant developers',
    ARRAY['Full coding control', 'Multiple brokers', 'Massive data'],
    ARRAY['No coding required', 'Natural language', 'Beginner-friendly']
  ),
  (
    'Alpaca',
    'https://alpaca.markets',
    'Commission-free API-first stock brokerage',
    'Developers & Fintechs',
    ARRAY['Free API', 'Commission-free', 'Paper trading'],
    ARRAY['Strategy marketplace', 'AI agents', 'Korean stocks']
  )
ON CONFLICT DO NOTHING;

-- 시장 규모 데이터 (TAM/SAM/SOM)
INSERT INTO investor_metrics_snapshots (
  snapshot_date,
  addressable_market_size,  -- TAM: 전세계 리테일 트레이딩
  serviceable_market_size,  -- SAM: 한국 + 미국 리테일
  obtainable_market_size    -- SOM: 목표 시장 점유율
) VALUES (
  CURRENT_DATE,
  500000000000000,  -- TAM: 500조 (전세계 리테일 거래)
  50000000000000,   -- SAM: 50조 (한국 + 미국 타겟)
  500000000000      -- SOM: 5000억 (1% 목표)
) ON CONFLICT (snapshot_date) DO UPDATE SET
  addressable_market_size = EXCLUDED.addressable_market_size,
  serviceable_market_size = EXCLUDED.serviceable_market_size,
  obtainable_market_size = EXCLUDED.obtainable_market_size;

-- 11) RLS 정책
ALTER TABLE investor_metrics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_analysis ENABLE ROW LEVEL SECURITY;

-- 관리자만 접근
CREATE POLICY "Admins can manage investor metrics" ON investor_metrics_snapshots
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins can manage funding rounds" ON funding_rounds
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins can manage investors" ON investors
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins can manage investor meetings" ON investor_meetings
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins can manage kpi targets" ON kpi_targets
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins can manage competitor analysis" ON competitor_analysis
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- 12) 권한 부여
GRANT EXECUTE ON FUNCTION calculate_investor_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION get_investor_dashboard_data TO authenticated;

-- 코멘트
COMMENT ON TABLE investor_metrics_snapshots IS '투자자용 핵심 지표 스냅샷';
COMMENT ON TABLE funding_rounds IS '펀딩 라운드 정보';
COMMENT ON TABLE investors IS '투자자 관리';
COMMENT ON TABLE investor_meetings IS '투자자 미팅 로그';
COMMENT ON TABLE kpi_targets IS 'KPI 목표';
COMMENT ON TABLE competitor_analysis IS '경쟁사 분석';
