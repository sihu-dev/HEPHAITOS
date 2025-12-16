-- ============================================
-- User Feedback System
-- HEPHAITOS Beta v1.2
-- ============================================

-- 1. Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'improvement', 'other')),
  category TEXT NOT NULL CHECK (category IN ('ux', 'performance', 'content', 'technical', 'other')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  page_url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  screenshot_url TEXT,
  browser_info JSONB,
  device_info JSONB,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'wont_fix')),
  priority INTEGER DEFAULT 0,
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON public.feedback(type);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_severity ON public.feedback(severity);

-- 3. Enable Row Level Security
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Anyone can submit feedback (anonymous or authenticated)
CREATE POLICY "Anyone can insert feedback"
  ON public.feedback
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Users can view their own feedback
CREATE POLICY "Users can view own feedback"
  ON public.feedback
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Admins can view all feedback (assuming admin role)
CREATE POLICY "Admins can view all feedback"
  ON public.feedback
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Admins can update feedback
CREATE POLICY "Admins can update feedback"
  ON public.feedback
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 5. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_feedback_updated_at
  BEFORE UPDATE ON public.feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Create feedback stats view
CREATE OR REPLACE VIEW public.feedback_stats AS
SELECT
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE status = 'open') as open_count,
  COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_count,
  COUNT(*) FILTER (WHERE status = 'resolved') as resolved_count,
  COUNT(*) FILTER (WHERE type = 'bug') as bug_count,
  COUNT(*) FILTER (WHERE type = 'feature') as feature_count,
  COUNT(*) FILTER (WHERE severity = 'critical') as critical_count,
  COUNT(*) FILTER (WHERE severity = 'high') as high_count,
  AVG(CASE
    WHEN resolved_at IS NOT NULL
    THEN EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600
  END) as avg_resolution_time_hours
FROM public.feedback;

-- 7. Grant permissions
GRANT SELECT ON public.feedback_stats TO authenticated;
GRANT SELECT ON public.feedback_stats TO anon;

COMMENT ON TABLE public.feedback IS 'User feedback and bug reports for HEPHAITOS';
COMMENT ON COLUMN public.feedback.browser_info IS 'Browser user agent, viewport, etc.';
COMMENT ON COLUMN public.feedback.device_info IS 'Device type, OS, screen resolution';


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


-- ============================================
-- Feature Flags & A/B Testing System
-- HEPHAITOS Beta v1.2
-- ============================================

CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT false,
  variant TEXT DEFAULT 'control',
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  target_users JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON public.feature_flags(key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON public.feature_flags(enabled);
CREATE INDEX IF NOT EXISTS idx_feature_flags_is_active ON public.feature_flags(is_active);

-- Enable RLS
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active flags"
  ON public.feature_flags
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage flags"
  ON public.feature_flags
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Updated trigger
CREATE TRIGGER set_feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default flags
INSERT INTO public.feature_flags (key, name, description, enabled, variant)
VALUES
  ('new-dashboard-layout', 'New Dashboard Layout', 'A/B test for new dashboard design', false, 'control'),
  ('improved-onboarding', 'Improved Onboarding', 'Enhanced onboarding flow', false, 'control'),
  ('ai-strategy-assistant', 'AI Strategy Assistant', 'AI-powered strategy suggestions', true, 'enabled'),
  ('realtime-updates', 'Real-time Updates', 'WebSocket vs Polling', true, 'websocket'),
  ('feedback-widget', 'Feedback Widget', 'User feedback collection', true, 'enabled'),
  ('password-strength-indicator', 'Password Strength', 'Real-time password strength indicator', true, 'enabled')
ON CONFLICT (key) DO NOTHING;

COMMENT ON TABLE public.feature_flags IS 'Feature flags for A/B testing and gradual rollout';


-- ============================================
-- Analytics Events Tracking
-- HEPHAITOS Beta v1.2
-- ============================================

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  event_name TEXT NOT NULL,
  event_properties JSONB,
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address INET,
  country TEXT,
  city TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Partition by month for performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON public.analytics_events(session_id);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can insert their own events"
  ON public.analytics_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all events"
  ON public.analytics_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Analytics aggregation views
CREATE OR REPLACE VIEW public.analytics_daily_summary AS
SELECT
  date_trunc('day', created_at) as date,
  COUNT(*) as total_events,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(*) FILTER (WHERE event_name = 'sign_up') as signups,
  COUNT(*) FILTER (WHERE event_name = 'strategy_created') as strategies_created,
  COUNT(*) FILTER (WHERE event_name = 'backtest_completed') as backtests_completed
FROM public.analytics_events
GROUP BY date_trunc('day', created_at)
ORDER BY date DESC;

-- Top events view
CREATE OR REPLACE VIEW public.analytics_top_events AS
SELECT
  event_name,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) FILTER (WHERE created_at >= now() - interval '7 days') as last_7_days,
  COUNT(*) FILTER (WHERE created_at >= now() - interval '1 day') as last_24_hours
FROM public.analytics_events
GROUP BY event_name
ORDER BY event_count DESC
LIMIT 50;

-- Grant permissions
GRANT SELECT ON public.analytics_daily_summary TO authenticated;
GRANT SELECT ON public.analytics_top_events TO authenticated;

COMMENT ON TABLE public.analytics_events IS 'User behavior tracking for product analytics';


