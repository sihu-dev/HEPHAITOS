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
