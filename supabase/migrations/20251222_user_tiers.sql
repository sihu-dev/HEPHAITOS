-- ============================================
-- User Tier System for AI Model Selection
-- Opus 4.5 for Pro users, Sonnet/Haiku for others
-- ============================================

-- Create user_tier ENUM
CREATE TYPE user_tier AS ENUM ('free', 'starter', 'pro');

-- Add tier column to profiles
ALTER TABLE profiles
  ADD COLUMN tier user_tier DEFAULT 'free',
  ADD COLUMN tier_expires_at TIMESTAMPTZ;

-- Create index for tier queries
CREATE INDEX idx_profiles_tier ON profiles(tier);
CREATE INDEX idx_profiles_tier_expires ON profiles(tier, tier_expires_at);

-- Function to check if user is Pro
CREATE OR REPLACE FUNCTION is_pro_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = user_id
    AND tier = 'pro'
    AND (tier_expires_at IS NULL OR tier_expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user tier
CREATE OR REPLACE FUNCTION get_user_tier(user_id UUID)
RETURNS user_tier AS $$
DECLARE
  user_tier_value user_tier;
BEGIN
  SELECT tier INTO user_tier_value
  FROM profiles
  WHERE id = user_id;

  -- Check if tier is expired
  IF user_tier_value = 'pro' OR user_tier_value = 'starter' THEN
    DECLARE
      expires_at TIMESTAMPTZ;
    BEGIN
      SELECT tier_expires_at INTO expires_at
      FROM profiles
      WHERE id = user_id;

      IF expires_at IS NOT NULL AND expires_at < NOW() THEN
        -- Tier expired, downgrade to free
        UPDATE profiles SET tier = 'free' WHERE id = user_id;
        RETURN 'free'::user_tier;
      END IF;
    END;
  END IF;

  RETURN COALESCE(user_tier_value, 'free'::user_tier);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON COLUMN profiles.tier IS 'User tier for AI model selection: free (Haiku), starter (Sonnet), pro (Opus 4.5)';
COMMENT ON COLUMN profiles.tier_expires_at IS 'Tier expiration date (NULL = lifetime)';
COMMENT ON FUNCTION is_pro_user(UUID) IS 'Check if user has active Pro tier';
COMMENT ON FUNCTION get_user_tier(UUID) IS 'Get user tier with expiration check';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_pro_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_tier(UUID) TO authenticated;
