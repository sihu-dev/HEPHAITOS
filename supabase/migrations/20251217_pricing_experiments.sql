-- ============================================
-- Performance-based Pricing Experiments
-- Loop 24: 성과 기반 가격 실험
-- ============================================

-- 1) 가격 실험 정의 테이블
CREATE TABLE IF NOT EXISTS pricing_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 실험 정보
  name TEXT NOT NULL,
  description TEXT,
  hypothesis TEXT,  -- 가설 설명

  -- 상태
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed', 'cancelled')),

  -- 기간
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,

  -- 목표 샘플 크기
  target_sample_size INTEGER DEFAULT 1000,

  -- 통계적 유의성 설정
  confidence_level NUMERIC(5,4) DEFAULT 0.95,  -- 95%
  minimum_detectable_effect NUMERIC(5,4) DEFAULT 0.05,  -- 5%

  -- 주요 지표
  primary_metric TEXT NOT NULL DEFAULT 'conversion_rate',
  secondary_metrics TEXT[] DEFAULT '{}',

  -- 메타데이터
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pricing_experiments_status ON pricing_experiments(status);

-- 2) 실험 변형 (Variants) 테이블
CREATE TABLE IF NOT EXISTS experiment_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES pricing_experiments(id) ON DELETE CASCADE,

  -- 변형 정보
  name TEXT NOT NULL,  -- 'control', 'variant_a', 'variant_b', etc.
  description TEXT,

  -- 트래픽 배분 (%)
  traffic_allocation NUMERIC(5,2) NOT NULL DEFAULT 50.00,

  -- 가격 설정
  pricing_model TEXT NOT NULL CHECK (pricing_model IN (
    'fixed',           -- 고정 가격
    'tiered',          -- 단계별 가격
    'usage_based',     -- 사용량 기반
    'performance',     -- 성과 기반
    'hybrid'           -- 하이브리드
  )),

  -- 가격 상세 (JSON)
  pricing_config JSONB NOT NULL DEFAULT '{}',
  /*
  예시:
  {
    "model": "fixed",
    "base_price": 29900,
    "credits": 100
  }

  {
    "model": "performance",
    "base_price": 0,
    "success_fee_percent": 20,
    "min_profit_threshold": 100000
  }

  {
    "model": "tiered",
    "tiers": [
      {"name": "Basic", "price": 9900, "credits": 30},
      {"name": "Pro", "price": 29900, "credits": 100},
      {"name": "Premium", "price": 99900, "credits": 500}
    ]
  }
  */

  -- 할인 설정
  discount_percent NUMERIC(5,2) DEFAULT 0,
  discount_code TEXT,

  is_control BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_experiment_variants_experiment ON experiment_variants(experiment_id);

-- 3) 사용자 실험 배정 테이블
CREATE TABLE IF NOT EXISTS experiment_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  experiment_id UUID NOT NULL REFERENCES pricing_experiments(id),
  variant_id UUID NOT NULL REFERENCES experiment_variants(id),

  -- 배정 정보
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 사용자 특성 (배정 시점)
  user_segment TEXT,  -- 'new', 'returning', 'power_user'
  acquisition_channel TEXT,
  device_type TEXT,

  -- 고유 제약 (한 사용자는 한 실험에 하나의 변형만)
  UNIQUE(user_id, experiment_id)
);

CREATE INDEX IF NOT EXISTS idx_experiment_assignments_user ON experiment_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_experiment_assignments_experiment ON experiment_assignments(experiment_id);
CREATE INDEX IF NOT EXISTS idx_experiment_assignments_variant ON experiment_assignments(variant_id);

-- 4) 실험 이벤트/전환 테이블
CREATE TABLE IF NOT EXISTS experiment_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES experiment_assignments(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  experiment_id UUID NOT NULL REFERENCES pricing_experiments(id),
  variant_id UUID NOT NULL REFERENCES experiment_variants(id),

  -- 전환 정보
  conversion_type TEXT NOT NULL,  -- 'purchase', 'upgrade', 'retention_d7', etc.

  -- 가치
  revenue_amount NUMERIC(15,2),
  credits_purchased INTEGER,

  -- 성과 기반 가격용 (사용자 수익)
  user_profit NUMERIC(15,2),
  platform_fee NUMERIC(15,2),

  -- 메타데이터
  metadata JSONB DEFAULT '{}',

  converted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_experiment_conversions_assignment ON experiment_conversions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_experiment_conversions_experiment ON experiment_conversions(experiment_id);
CREATE INDEX IF NOT EXISTS idx_experiment_conversions_type ON experiment_conversions(conversion_type);

-- 5) 성과 기반 가격 계정 테이블
CREATE TABLE IF NOT EXISTS performance_pricing_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,

  -- 성과 기반 가격 설정
  is_enabled BOOLEAN DEFAULT false,

  -- 수수료 설정
  success_fee_percent NUMERIC(5,2) DEFAULT 20.00,  -- 기본 20%
  min_profit_threshold NUMERIC(15,2) DEFAULT 100000,  -- 최소 수익 기준

  -- 정산 주기
  settlement_period TEXT DEFAULT 'monthly' CHECK (settlement_period IN ('weekly', 'biweekly', 'monthly')),

  -- 누적 성과
  total_profit NUMERIC(20,2) DEFAULT 0,
  total_fees_paid NUMERIC(20,2) DEFAULT 0,
  total_trades INTEGER DEFAULT 0,
  win_rate NUMERIC(5,4) DEFAULT 0,

  -- 현재 정산 기간
  current_period_profit NUMERIC(15,2) DEFAULT 0,
  current_period_fees NUMERIC(15,2) DEFAULT 0,
  period_start_date DATE,

  -- 상태
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_performance_accounts_user ON performance_pricing_accounts(user_id);

-- 6) 성과 기반 수수료 정산 테이블
CREATE TABLE IF NOT EXISTS performance_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  account_id UUID NOT NULL REFERENCES performance_pricing_accounts(id),

  -- 정산 기간
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- 수익 요약
  gross_profit NUMERIC(15,2) NOT NULL,
  net_profit NUMERIC(15,2) NOT NULL,

  -- 수수료
  fee_percent NUMERIC(5,2) NOT NULL,
  fee_amount NUMERIC(15,2) NOT NULL,

  -- 거래 통계
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,

  -- 상태
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),

  -- 결제 정보
  payment_method TEXT,
  payment_reference TEXT,
  paid_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_settlements_user ON performance_settlements(user_id);
CREATE INDEX IF NOT EXISTS idx_settlements_period ON performance_settlements(period_start, period_end);

-- 7) 가격 실험 결과 집계 뷰
CREATE OR REPLACE VIEW experiment_results AS
WITH variant_stats AS (
  SELECT
    e.id as experiment_id,
    e.name as experiment_name,
    e.status,
    v.id as variant_id,
    v.name as variant_name,
    v.is_control,
    v.traffic_allocation,
    v.pricing_model,
    COUNT(DISTINCT a.user_id) as sample_size,
    COUNT(DISTINCT c.user_id) as conversions,
    CASE
      WHEN COUNT(DISTINCT a.user_id) > 0
      THEN ROUND(COUNT(DISTINCT c.user_id)::NUMERIC / COUNT(DISTINCT a.user_id) * 100, 2)
      ELSE 0
    END as conversion_rate,
    COALESCE(SUM(c.revenue_amount), 0) as total_revenue,
    CASE
      WHEN COUNT(DISTINCT c.user_id) > 0
      THEN ROUND(COALESCE(SUM(c.revenue_amount), 0) / COUNT(DISTINCT c.user_id), 2)
      ELSE 0
    END as avg_revenue_per_conversion,
    CASE
      WHEN COUNT(DISTINCT a.user_id) > 0
      THEN ROUND(COALESCE(SUM(c.revenue_amount), 0) / COUNT(DISTINCT a.user_id), 2)
      ELSE 0
    END as avg_revenue_per_user
  FROM pricing_experiments e
  JOIN experiment_variants v ON e.id = v.experiment_id
  LEFT JOIN experiment_assignments a ON v.id = a.variant_id
  LEFT JOIN experiment_conversions c ON a.id = c.assignment_id AND c.conversion_type = 'purchase'
  GROUP BY e.id, e.name, e.status, v.id, v.name, v.is_control, v.traffic_allocation, v.pricing_model
)
SELECT
  *,
  -- Control 대비 전환율 차이 (리프트)
  CASE
    WHEN NOT is_control THEN
      conversion_rate - (
        SELECT conversion_rate
        FROM variant_stats vs2
        WHERE vs2.experiment_id = variant_stats.experiment_id AND vs2.is_control = true
        LIMIT 1
      )
    ELSE 0
  END as conversion_lift
FROM variant_stats;

-- 8) 실험 배정 함수
CREATE OR REPLACE FUNCTION assign_user_to_experiment(
  p_user_id UUID,
  p_experiment_id UUID,
  p_user_segment TEXT DEFAULT 'new',
  p_acquisition_channel TEXT DEFAULT NULL,
  p_device_type TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_assignment_id UUID;
  v_variant_id UUID;
  v_random NUMERIC;
  v_cumulative NUMERIC := 0;
BEGIN
  -- 이미 배정된 경우 기존 배정 반환
  SELECT id INTO v_assignment_id
  FROM experiment_assignments
  WHERE user_id = p_user_id AND experiment_id = p_experiment_id;

  IF v_assignment_id IS NOT NULL THEN
    RETURN v_assignment_id;
  END IF;

  -- 실험이 실행 중인지 확인
  IF NOT EXISTS (
    SELECT 1 FROM pricing_experiments
    WHERE id = p_experiment_id AND status = 'running'
  ) THEN
    RETURN NULL;
  END IF;

  -- 랜덤 배정
  v_random := random() * 100;

  SELECT id INTO v_variant_id
  FROM (
    SELECT
      id,
      SUM(traffic_allocation) OVER (ORDER BY is_control DESC, id) as cumulative_allocation
    FROM experiment_variants
    WHERE experiment_id = p_experiment_id
  ) sub
  WHERE cumulative_allocation >= v_random
  ORDER BY cumulative_allocation
  LIMIT 1;

  -- 변형이 없으면 첫 번째 변형 선택
  IF v_variant_id IS NULL THEN
    SELECT id INTO v_variant_id
    FROM experiment_variants
    WHERE experiment_id = p_experiment_id
    ORDER BY is_control DESC
    LIMIT 1;
  END IF;

  -- 배정 생성
  INSERT INTO experiment_assignments (
    user_id, experiment_id, variant_id,
    user_segment, acquisition_channel, device_type
  )
  VALUES (
    p_user_id, p_experiment_id, v_variant_id,
    p_user_segment, p_acquisition_channel, p_device_type
  )
  RETURNING id INTO v_assignment_id;

  RETURN v_assignment_id;
END;
$$;

-- 9) 전환 기록 함수
CREATE OR REPLACE FUNCTION record_experiment_conversion(
  p_user_id UUID,
  p_experiment_id UUID,
  p_conversion_type TEXT,
  p_revenue_amount NUMERIC DEFAULT NULL,
  p_credits_purchased INTEGER DEFAULT NULL,
  p_user_profit NUMERIC DEFAULT NULL,
  p_platform_fee NUMERIC DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_assignment experiment_assignments%ROWTYPE;
  v_conversion_id UUID;
BEGIN
  -- 배정 정보 조회
  SELECT * INTO v_assignment
  FROM experiment_assignments
  WHERE user_id = p_user_id AND experiment_id = p_experiment_id;

  IF v_assignment IS NULL THEN
    RETURN NULL;
  END IF;

  -- 전환 기록
  INSERT INTO experiment_conversions (
    assignment_id, user_id, experiment_id, variant_id,
    conversion_type, revenue_amount, credits_purchased,
    user_profit, platform_fee, metadata
  )
  VALUES (
    v_assignment.id, p_user_id, p_experiment_id, v_assignment.variant_id,
    p_conversion_type, p_revenue_amount, p_credits_purchased,
    p_user_profit, p_platform_fee, p_metadata
  )
  RETURNING id INTO v_conversion_id;

  RETURN v_conversion_id;
END;
$$;

-- 10) 성과 기반 수수료 계산 함수
CREATE OR REPLACE FUNCTION calculate_performance_fee(
  p_user_id UUID,
  p_profit NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_account performance_pricing_accounts%ROWTYPE;
  v_fee NUMERIC;
BEGIN
  -- 성과 기반 계정 조회
  SELECT * INTO v_account
  FROM performance_pricing_accounts
  WHERE user_id = p_user_id AND is_enabled = true AND status = 'active';

  IF v_account IS NULL THEN
    RETURN 0;
  END IF;

  -- 최소 수익 기준 미달 시 수수료 없음
  IF p_profit < v_account.min_profit_threshold THEN
    RETURN 0;
  END IF;

  -- 수수료 계산
  v_fee := p_profit * (v_account.success_fee_percent / 100);

  -- 계정 업데이트
  UPDATE performance_pricing_accounts
  SET
    current_period_profit = current_period_profit + p_profit,
    current_period_fees = current_period_fees + v_fee,
    total_profit = total_profit + p_profit,
    total_fees_paid = total_fees_paid + v_fee,
    total_trades = total_trades + 1,
    updated_at = now()
  WHERE id = v_account.id;

  RETURN v_fee;
END;
$$;

-- 11) 통계적 유의성 계산 함수 (Z-test 근사)
CREATE OR REPLACE FUNCTION calculate_statistical_significance(
  p_control_conversions INTEGER,
  p_control_sample INTEGER,
  p_variant_conversions INTEGER,
  p_variant_sample INTEGER
)
RETURNS TABLE (
  control_rate NUMERIC,
  variant_rate NUMERIC,
  lift_percent NUMERIC,
  z_score NUMERIC,
  p_value NUMERIC,
  is_significant BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_control_rate NUMERIC;
  v_variant_rate NUMERIC;
  v_pooled_rate NUMERIC;
  v_se NUMERIC;
  v_z NUMERIC;
  v_p NUMERIC;
BEGIN
  -- 전환율 계산
  v_control_rate := p_control_conversions::NUMERIC / NULLIF(p_control_sample, 0);
  v_variant_rate := p_variant_conversions::NUMERIC / NULLIF(p_variant_sample, 0);

  IF v_control_rate IS NULL OR v_variant_rate IS NULL THEN
    RETURN QUERY SELECT
      0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 1::NUMERIC, false;
    RETURN;
  END IF;

  -- 풀링된 전환율
  v_pooled_rate := (p_control_conversions + p_variant_conversions)::NUMERIC /
                   (p_control_sample + p_variant_sample);

  -- 표준 오차
  v_se := SQRT(v_pooled_rate * (1 - v_pooled_rate) *
               (1.0/p_control_sample + 1.0/p_variant_sample));

  -- Z-score
  IF v_se > 0 THEN
    v_z := (v_variant_rate - v_control_rate) / v_se;
  ELSE
    v_z := 0;
  END IF;

  -- P-value 근사 (양측 검정)
  -- 정규 분포 CDF 근사
  v_p := 2 * (1 - (0.5 * (1 + SIGN(v_z) * SQRT(1 - EXP(-2 * v_z * v_z / 3.14159)))));
  v_p := GREATEST(0, LEAST(1, v_p));

  RETURN QUERY SELECT
    ROUND(v_control_rate * 100, 2),
    ROUND(v_variant_rate * 100, 2),
    ROUND(((v_variant_rate - v_control_rate) / NULLIF(v_control_rate, 0)) * 100, 2),
    ROUND(v_z, 4),
    ROUND(v_p, 4),
    v_p < 0.05;
END;
$$;

-- 12) 실험 요약 함수
CREATE OR REPLACE FUNCTION get_experiment_summary(p_experiment_id UUID)
RETURNS TABLE (
  experiment_name TEXT,
  status TEXT,
  start_date TIMESTAMPTZ,
  total_participants INTEGER,
  variant_name TEXT,
  variant_sample INTEGER,
  variant_conversions INTEGER,
  conversion_rate NUMERIC,
  revenue NUMERIC,
  is_control BOOLEAN,
  lift_vs_control NUMERIC,
  is_significant BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH variant_data AS (
    SELECT
      e.name as exp_name,
      e.status as exp_status,
      e.start_date as exp_start,
      v.id as vid,
      v.name as vname,
      v.is_control as v_is_control,
      COUNT(DISTINCT a.user_id) as v_sample,
      COUNT(DISTINCT c.user_id) as v_conversions,
      COALESCE(SUM(c.revenue_amount), 0) as v_revenue
    FROM pricing_experiments e
    JOIN experiment_variants v ON e.id = v.experiment_id
    LEFT JOIN experiment_assignments a ON v.id = a.variant_id
    LEFT JOIN experiment_conversions c ON a.id = c.assignment_id AND c.conversion_type = 'purchase'
    WHERE e.id = p_experiment_id
    GROUP BY e.name, e.status, e.start_date, v.id, v.name, v.is_control
  ),
  control_data AS (
    SELECT v_sample, v_conversions
    FROM variant_data
    WHERE v_is_control = true
    LIMIT 1
  )
  SELECT
    vd.exp_name,
    vd.exp_status,
    vd.exp_start,
    (SELECT SUM(v_sample)::INTEGER FROM variant_data),
    vd.vname,
    vd.v_sample::INTEGER,
    vd.v_conversions::INTEGER,
    ROUND(vd.v_conversions::NUMERIC / NULLIF(vd.v_sample, 0) * 100, 2),
    vd.v_revenue,
    vd.v_is_control,
    CASE
      WHEN vd.v_is_control THEN 0
      ELSE ROUND(
        ((vd.v_conversions::NUMERIC / NULLIF(vd.v_sample, 0)) -
         (cd.v_conversions::NUMERIC / NULLIF(cd.v_sample, 0))) /
        NULLIF(cd.v_conversions::NUMERIC / NULLIF(cd.v_sample, 0), 0) * 100, 2
      )
    END,
    CASE
      WHEN vd.v_is_control THEN NULL
      ELSE (
        SELECT is_significant FROM calculate_statistical_significance(
          cd.v_conversions::INTEGER, cd.v_sample::INTEGER,
          vd.v_conversions::INTEGER, vd.v_sample::INTEGER
        )
      )
    END
  FROM variant_data vd
  CROSS JOIN control_data cd
  ORDER BY vd.v_is_control DESC, vd.vname;
END;
$$;

-- 13) 샘플 실험 데이터 삽입
INSERT INTO pricing_experiments (
  name, description, hypothesis, status, primary_metric, secondary_metrics
) VALUES
  (
    '성과 기반 vs 고정 가격',
    '성과 기반 가격(수익 연동 수수료)이 고정 가격 대비 전환율과 ARPU에 미치는 영향 테스트',
    '성과 기반 가격은 진입 장벽을 낮춰 전환율을 높이고, 장기적으로 ARPU도 증가할 것이다',
    'draft',
    'conversion_rate',
    ARRAY['arpu', 'retention_d7', 'ltv']
  ),
  (
    '가격 앵커링 테스트',
    '프리미엄 패키지를 먼저 보여주는 것이 전환율에 미치는 영향',
    '높은 가격을 먼저 보여주면 중간 가격 패키지의 가치 인식이 높아져 전환율이 증가할 것이다',
    'draft',
    'conversion_rate',
    ARRAY['package_distribution', 'revenue']
  ),
  (
    '할인 vs 보너스 크레딧',
    '동일 가치의 할인과 보너스 크레딧 중 어느 것이 더 효과적인지 테스트',
    '보너스 크레딧이 할인보다 가치 인식이 높아 전환율이 높을 것이다',
    'draft',
    'conversion_rate',
    ARRAY['perceived_value', 'usage_rate']
  )
ON CONFLICT DO NOTHING;

-- 14) RLS 정책
ALTER TABLE pricing_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_pricing_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_settlements ENABLE ROW LEVEL SECURITY;

-- 관리자만 실험 관리
CREATE POLICY "Admins can manage experiments" ON pricing_experiments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage variants" ON experiment_variants
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- 사용자는 자신의 배정만 조회
CREATE POLICY "Users can view own assignments" ON experiment_assignments
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 전환 데이터는 관리자 또는 본인만
CREATE POLICY "Users can view own conversions" ON experiment_conversions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 성과 기반 계정은 본인만
CREATE POLICY "Users can manage own performance account" ON performance_pricing_accounts
  FOR ALL TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can view own settlements" ON performance_settlements
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 15) 권한 부여
GRANT EXECUTE ON FUNCTION assign_user_to_experiment TO authenticated;
GRANT EXECUTE ON FUNCTION record_experiment_conversion TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_performance_fee TO authenticated;
GRANT EXECUTE ON FUNCTION get_experiment_summary TO authenticated;

-- 코멘트
COMMENT ON TABLE pricing_experiments IS '가격 실험 정의';
COMMENT ON TABLE experiment_variants IS '실험 변형 (A/B 테스트 그룹)';
COMMENT ON TABLE experiment_assignments IS '사용자 실험 배정';
COMMENT ON TABLE experiment_conversions IS '실험 전환 기록';
COMMENT ON TABLE performance_pricing_accounts IS '성과 기반 가격 계정';
COMMENT ON TABLE performance_settlements IS '성과 기반 수수료 정산';
