-- ============================================
-- Dynamic Pricing System (CMS)
-- HEPHAITOS Beta v1.2
-- ============================================

-- 1. Create credit packages table
CREATE TABLE IF NOT EXISTS public.credit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_ko TEXT NOT NULL,
  credits INTEGER NOT NULL CHECK (credits > 0),
  bonus_credits INTEGER NOT NULL DEFAULT 0 CHECK (bonus_credits >= 0),
  price_krw INTEGER NOT NULL CHECK (price_krw > 0),
  price_usd DECIMAL(10,2) NOT NULL CHECK (price_usd > 0),
  is_popular BOOLEAN NOT NULL DEFAULT false,
  is_highlighted BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create feature pricing table
CREATE TABLE IF NOT EXISTS public.feature_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id TEXT UNIQUE NOT NULL,
  feature_name TEXT NOT NULL,
  feature_name_ko TEXT NOT NULL,
  credit_cost INTEGER NOT NULL CHECK (credit_cost >= 0),
  description TEXT,
  description_ko TEXT,
  category TEXT NOT NULL CHECK (category IN ('copy', 'learn', 'build', 'other')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Insert default credit packages
INSERT INTO public.credit_packages (package_id, name, name_ko, credits, bonus_credits, price_krw, price_usd, is_popular, is_highlighted, display_order)
VALUES
  ('starter', 'Starter', '스타터', 100, 0, 9900, 7.99, false, false, 1),
  ('basic', 'Basic', '베이직', 500, 50, 39000, 29.99, true, false, 2),
  ('pro', 'Pro', '프로', 1000, 150, 69000, 54.99, false, true, 3),
  ('enterprise', 'Enterprise', '엔터프라이즈', 5000, 1000, 299000, 239.99, false, false, 4)
ON CONFLICT (package_id) DO UPDATE SET
  name = EXCLUDED.name,
  name_ko = EXCLUDED.name_ko,
  credits = EXCLUDED.credits,
  bonus_credits = EXCLUDED.bonus_credits,
  price_krw = EXCLUDED.price_krw,
  price_usd = EXCLUDED.price_usd,
  is_popular = EXCLUDED.is_popular,
  is_highlighted = EXCLUDED.is_highlighted,
  display_order = EXCLUDED.display_order,
  updated_at = now();

-- 4. Insert default feature pricing
INSERT INTO public.feature_pricing (feature_id, feature_name, feature_name_ko, credit_cost, category, display_order)
VALUES
  ('celebrity_mirroring', 'Celebrity Mirroring', '셀럽 포트폴리오 미러링', 0, 'copy', 1),
  ('learning_guide', 'Learning Guide', '학습 가이드 질문', 1, 'learn', 2),
  ('strategy_engine', 'Strategy Engine', '전략 엔진', 10, 'build', 3),
  ('backtest_1year', 'Backtest (1 Year)', '백테스트 (1년)', 3, 'build', 4),
  ('live_coaching', 'Live Coaching', '라이브 코칭 (30분)', 20, 'learn', 5),
  ('market_report', 'Market Report', '시장 리포트', 3, 'other', 6)
ON CONFLICT (feature_id) DO UPDATE SET
  feature_name = EXCLUDED.feature_name,
  feature_name_ko = EXCLUDED.feature_name_ko,
  credit_cost = EXCLUDED.credit_cost,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order,
  updated_at = now();

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_credit_packages_package_id ON public.credit_packages(package_id);
CREATE INDEX IF NOT EXISTS idx_credit_packages_is_active ON public.credit_packages(is_active);
CREATE INDEX IF NOT EXISTS idx_credit_packages_display_order ON public.credit_packages(display_order);

CREATE INDEX IF NOT EXISTS idx_feature_pricing_feature_id ON public.feature_pricing(feature_id);
CREATE INDEX IF NOT EXISTS idx_feature_pricing_category ON public.feature_pricing(category);
CREATE INDEX IF NOT EXISTS idx_feature_pricing_is_active ON public.feature_pricing(is_active);

-- 6. Enable Row Level Security
ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_pricing ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies - Anyone can read active pricing
CREATE POLICY "Anyone can view active packages"
  ON public.credit_packages
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Anyone can view active features"
  ON public.feature_pricing
  FOR SELECT
  TO public
  USING (is_active = true);

-- 8. Admin policies (insert, update, delete)
CREATE POLICY "Admins can manage packages"
  ON public.credit_packages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can manage features"
  ON public.feature_pricing
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 9. Create updated_at trigger for both tables
CREATE TRIGGER set_credit_packages_updated_at
  BEFORE UPDATE ON public.credit_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_feature_pricing_updated_at
  BEFORE UPDATE ON public.feature_pricing
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 10. Create view for pricing display
CREATE OR REPLACE VIEW public.pricing_display AS
SELECT
  cp.package_id,
  cp.name,
  cp.name_ko,
  cp.credits,
  cp.bonus_credits,
  cp.price_krw,
  cp.price_usd,
  cp.is_popular,
  cp.is_highlighted,
  cp.display_order,
  (cp.credits + cp.bonus_credits) as total_credits,
  ROUND(cp.price_krw::DECIMAL / (cp.credits + cp.bonus_credits), 0) as per_credit_krw,
  ROUND(cp.price_usd / (cp.credits + cp.bonus_credits), 2) as per_credit_usd
FROM public.credit_packages cp
WHERE cp.is_active = true
ORDER BY cp.display_order;

-- 11. Grant permissions
GRANT SELECT ON public.pricing_display TO authenticated;
GRANT SELECT ON public.pricing_display TO anon;

COMMENT ON TABLE public.credit_packages IS 'Dynamic credit package pricing (CMS)';
COMMENT ON TABLE public.feature_pricing IS 'Feature credit costs (CMS)';
