-- ============================================
-- HEPHAITOS Database Schema
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE strategy_status AS ENUM ('draft', 'backtesting', 'ready', 'running', 'paused', 'stopped');
CREATE TYPE trade_type AS ENUM ('buy', 'sell');
CREATE TYPE trade_status AS ENUM ('pending', 'filled', 'partial', 'cancelled', 'rejected');
CREATE TYPE notification_type AS ENUM ('signal', 'trade', 'alert', 'system');
CREATE TYPE user_plan AS ENUM ('free', 'pro', 'enterprise');

-- ============================================
-- TABLES
-- ============================================

-- Profiles (extends Supabase Auth users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  plan user_plan DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exchange Connections
CREATE TABLE exchange_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exchange_id TEXT NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  secret_key_encrypted TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  permissions TEXT[] DEFAULT '{}',
  last_connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, exchange_id)
);

-- Trading Strategies
CREATE TABLE strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status strategy_status DEFAULT 'draft',
  config JSONB NOT NULL DEFAULT '{}',
  graph JSONB,
  performance JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trades
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  strategy_id UUID REFERENCES strategies(id) ON DELETE SET NULL,
  exchange_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  type trade_type NOT NULL,
  status trade_status DEFAULT 'pending',
  price DECIMAL(20, 8) NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  total DECIMAL(20, 8) NOT NULL,
  fee DECIMAL(20, 8),
  pnl DECIMAL(20, 8),
  pnl_percent DECIMAL(10, 4),
  order_id TEXT,
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backtest Results
CREATE TABLE backtest_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  strategy_id UUID NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
  config JSONB NOT NULL,
  performance JSONB NOT NULL,
  equity_curve JSONB NOT NULL,
  trades JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Settings
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  notification_trade_signals BOOLEAN DEFAULT true,
  notification_trade_execution BOOLEAN DEFAULT true,
  notification_email_digest BOOLEAN DEFAULT false,
  notification_push BOOLEAN DEFAULT true,
  default_exchange TEXT,
  theme TEXT DEFAULT 'dark',
  language TEXT DEFAULT 'ko',
  timezone TEXT DEFAULT 'Asia/Seoul',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_strategies_user_id ON strategies(user_id);
CREATE INDEX idx_strategies_status ON strategies(status);
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_strategy_id ON trades(strategy_id);
CREATE INDEX idx_trades_created_at ON trades(created_at DESC);
CREATE INDEX idx_trades_symbol ON trades(symbol);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);
CREATE INDEX idx_exchange_connections_user_id ON exchange_connections(user_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER exchange_connections_updated_at
  BEFORE UPDATE ON exchange_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER strategies_updated_at
  BEFORE UPDATE ON strategies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );

  INSERT INTO user_settings (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE backtest_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Exchange connections policies
CREATE POLICY "Users can view own exchange connections"
  ON exchange_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exchange connections"
  ON exchange_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exchange connections"
  ON exchange_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own exchange connections"
  ON exchange_connections FOR DELETE
  USING (auth.uid() = user_id);

-- Strategies policies
CREATE POLICY "Users can view own strategies"
  ON strategies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own strategies"
  ON strategies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own strategies"
  ON strategies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own strategies"
  ON strategies FOR DELETE
  USING (auth.uid() = user_id);

-- Trades policies
CREATE POLICY "Users can view own trades"
  ON trades FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trades"
  ON trades FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trades"
  ON trades FOR UPDATE
  USING (auth.uid() = user_id);

-- Backtest results policies
CREATE POLICY "Users can view own backtest results"
  ON backtest_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own backtest results"
  ON backtest_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own backtest results"
  ON backtest_results FOR DELETE
  USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- User settings policies
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- VIEWS
-- ============================================

CREATE OR REPLACE VIEW portfolio_summary AS
SELECT
  t.user_id,
  COUNT(*)::INTEGER as total_trades,
  COUNT(CASE WHEN t.pnl > 0 THEN 1 END)::INTEGER as winning_trades,
  COUNT(CASE WHEN t.pnl < 0 THEN 1 END)::INTEGER as losing_trades,
  COALESCE(SUM(t.pnl), 0) as total_pnl,
  COALESCE(AVG(t.pnl_percent), 0) as avg_pnl_percent
FROM trades t
WHERE t.status = 'filled'
GROUP BY t.user_id;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Get portfolio metrics for a user
CREATE OR REPLACE FUNCTION get_portfolio_metrics(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_trades', COUNT(*),
    'winning_trades', COUNT(CASE WHEN pnl > 0 THEN 1 END),
    'losing_trades', COUNT(CASE WHEN pnl < 0 THEN 1 END),
    'total_pnl', COALESCE(SUM(pnl), 0),
    'avg_pnl_percent', COALESCE(AVG(pnl_percent), 0),
    'win_rate', CASE
      WHEN COUNT(*) > 0
      THEN (COUNT(CASE WHEN pnl > 0 THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL * 100)
      ELSE 0
    END,
    'best_trade', MAX(pnl),
    'worst_trade', MIN(pnl)
  )
  INTO result
  FROM trades
  WHERE user_id = p_user_id AND status = 'filled';

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get strategy performance
CREATE OR REPLACE FUNCTION get_strategy_performance(p_strategy_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_trades', COUNT(*),
    'winning_trades', COUNT(CASE WHEN pnl > 0 THEN 1 END),
    'losing_trades', COUNT(CASE WHEN pnl < 0 THEN 1 END),
    'total_pnl', COALESCE(SUM(pnl), 0),
    'avg_pnl', COALESCE(AVG(pnl), 0),
    'avg_pnl_percent', COALESCE(AVG(pnl_percent), 0),
    'win_rate', CASE
      WHEN COUNT(*) > 0
      THEN (COUNT(CASE WHEN pnl > 0 THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL * 100)
      ELSE 0
    END
  )
  INTO result
  FROM trades
  WHERE strategy_id = p_strategy_id AND status = 'filled';

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
