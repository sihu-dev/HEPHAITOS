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
