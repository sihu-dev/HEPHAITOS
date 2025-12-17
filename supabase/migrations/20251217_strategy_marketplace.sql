-- ============================================
-- Strategy Marketplace System
-- Loop 20: 전략 마켓플레이스 v1
-- ============================================

-- 1) 전략 리스팅 테이블
CREATE TABLE IF NOT EXISTS strategy_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id),

  -- 전략 정보
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  strategy_prompt TEXT NOT NULL,  -- 암호화된 프롬프트
  strategy_hash TEXT NOT NULL,    -- 성과 추적용 해시

  -- 카테고리 및 태그
  category TEXT NOT NULL CHECK (category IN ('momentum', 'value', 'dividend', 'growth', 'swing', 'daytrading', 'options', 'crypto', 'other')),
  tags TEXT[] DEFAULT '{}',
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'extreme')),
  timeframe TEXT NOT NULL CHECK (timeframe IN ('scalping', 'intraday', 'swing', 'position', 'long_term')),

  -- 성과 메트릭 (검증된 데이터)
  verified_return NUMERIC(10,2),
  verified_win_rate NUMERIC(5,2),
  verified_sharpe NUMERIC(5,2),
  verified_max_drawdown NUMERIC(5,2),
  backtest_period_days INTEGER,
  sample_trades INTEGER,
  verified_at TIMESTAMPTZ,

  -- 가격 정책
  pricing_type TEXT NOT NULL CHECK (pricing_type IN ('free', 'one_time', 'subscription', 'performance_based')),
  price_credits INTEGER DEFAULT 0,  -- 일회성 크레딧
  monthly_credits INTEGER DEFAULT 0, -- 구독 크레딧
  performance_fee_percent NUMERIC(5,2) DEFAULT 0, -- 수익 대비 %

  -- 상태
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected', 'suspended')),
  rejection_reason TEXT,
  featured BOOLEAN DEFAULT false,

  -- 통계
  view_count INTEGER DEFAULT 0,
  copy_count INTEGER DEFAULT 0,
  rating_avg NUMERIC(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  revenue_total INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listings_creator ON strategy_listings(creator_id);
CREATE INDEX IF NOT EXISTS idx_listings_category ON strategy_listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_status ON strategy_listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_featured ON strategy_listings(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_listings_rating ON strategy_listings(rating_avg DESC);
CREATE INDEX IF NOT EXISTS idx_listings_copy_count ON strategy_listings(copy_count DESC);

-- 2) 전략 구매/구독 테이블
CREATE TABLE IF NOT EXISTS strategy_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  listing_id UUID NOT NULL REFERENCES strategy_listings(id),

  purchase_type TEXT NOT NULL CHECK (purchase_type IN ('one_time', 'subscription')),
  credits_paid INTEGER NOT NULL,

  -- 구독 정보
  subscription_start TIMESTAMPTZ,
  subscription_end TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT false,

  -- 상태
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'refunded')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, listing_id, purchase_type)
);

CREATE INDEX IF NOT EXISTS idx_purchases_user ON strategy_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_listing ON strategy_purchases(listing_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON strategy_purchases(status);

-- 3) 전략 리뷰 테이블
CREATE TABLE IF NOT EXISTS strategy_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  listing_id UUID NOT NULL REFERENCES strategy_listings(id),
  purchase_id UUID REFERENCES strategy_purchases(id),

  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,

  -- 검증
  verified_purchase BOOLEAN DEFAULT false,

  -- 도움 투표
  helpful_count INTEGER DEFAULT 0,

  -- 상태
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'flagged')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_listing ON strategy_reviews(listing_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON strategy_reviews(user_id);

-- 4) 크리에이터 프로필 테이블
CREATE TABLE IF NOT EXISTS creator_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),

  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,

  -- 검증 상태
  verified BOOLEAN DEFAULT false,
  verification_type TEXT, -- 'identity', 'professional', 'influencer'

  -- 통계
  total_listings INTEGER DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  total_revenue INTEGER DEFAULT 0,
  follower_count INTEGER DEFAULT 0,
  avg_rating NUMERIC(3,2) DEFAULT 0,

  -- 소셜 링크
  twitter_handle TEXT,
  youtube_channel TEXT,
  website_url TEXT,

  -- 수익 설정
  payout_address TEXT,
  revenue_share_percent NUMERIC(5,2) DEFAULT 70, -- 크리에이터 70%, 플랫폼 30%

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5) 팔로우 테이블
CREATE TABLE IF NOT EXISTS creator_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id),
  creator_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(follower_id, creator_id)
);

CREATE INDEX IF NOT EXISTS idx_followers_creator ON creator_followers(creator_id);
CREATE INDEX IF NOT EXISTS idx_followers_follower ON creator_followers(follower_id);

-- 6) 전략 북마크 테이블
CREATE TABLE IF NOT EXISTS strategy_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  listing_id UUID NOT NULL REFERENCES strategy_listings(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON strategy_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_listing ON strategy_bookmarks(listing_id);

-- 7) 크리에이터 수익 테이블
CREATE TABLE IF NOT EXISTS creator_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id),
  listing_id UUID REFERENCES strategy_listings(id),
  purchase_id UUID REFERENCES strategy_purchases(id),

  -- 수익 정보
  gross_credits INTEGER NOT NULL,
  platform_fee_credits INTEGER NOT NULL,
  net_credits INTEGER NOT NULL,

  -- 상태
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'available', 'withdrawn')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  available_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_earnings_creator ON creator_earnings(creator_id);
CREATE INDEX IF NOT EXISTS idx_earnings_status ON creator_earnings(status);

-- 8) 전략 구매 함수
CREATE OR REPLACE FUNCTION purchase_strategy(
  p_user_id UUID,
  p_listing_id UUID,
  p_purchase_type TEXT DEFAULT 'one_time'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_listing strategy_listings%ROWTYPE;
  v_user_credits INTEGER;
  v_required_credits INTEGER;
  v_purchase_id UUID;
  v_creator_share INTEGER;
  v_platform_share INTEGER;
BEGIN
  -- 리스팅 조회
  SELECT * INTO v_listing FROM strategy_listings WHERE id = p_listing_id;

  IF v_listing.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Listing not found');
  END IF;

  IF v_listing.status != 'approved' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Strategy not available');
  END IF;

  -- 자신의 전략 구매 방지
  IF v_listing.creator_id = p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot purchase own strategy');
  END IF;

  -- 이미 구매했는지 확인
  IF EXISTS (
    SELECT 1 FROM strategy_purchases
    WHERE user_id = p_user_id AND listing_id = p_listing_id
    AND status IN ('active', 'expired')
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already purchased');
  END IF;

  -- 필요 크레딧 계산
  IF p_purchase_type = 'subscription' THEN
    v_required_credits := v_listing.monthly_credits;
  ELSE
    v_required_credits := v_listing.price_credits;
  END IF;

  -- 무료 전략 처리
  IF v_listing.pricing_type = 'free' THEN
    v_required_credits := 0;
  END IF;

  -- 사용자 크레딧 확인
  SELECT credits INTO v_user_credits FROM user_credits WHERE user_id = p_user_id;

  IF v_user_credits IS NULL OR v_user_credits < v_required_credits THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient credits');
  END IF;

  -- 크레딧 차감
  IF v_required_credits > 0 THEN
    UPDATE user_credits SET credits = credits - v_required_credits WHERE user_id = p_user_id;

    -- 크레딧 이력 기록
    INSERT INTO credit_history (user_id, amount, type, description, reference_id)
    VALUES (p_user_id, -v_required_credits, 'strategy_purchase',
            'Strategy purchase: ' || v_listing.title, p_listing_id);
  END IF;

  -- 구매 기록 생성
  INSERT INTO strategy_purchases (
    user_id, listing_id, purchase_type, credits_paid,
    subscription_start, subscription_end, status
  ) VALUES (
    p_user_id, p_listing_id, p_purchase_type, v_required_credits,
    CASE WHEN p_purchase_type = 'subscription' THEN now() END,
    CASE WHEN p_purchase_type = 'subscription' THEN now() + INTERVAL '30 days' END,
    'active'
  ) RETURNING id INTO v_purchase_id;

  -- 리스팅 통계 업데이트
  UPDATE strategy_listings SET
    copy_count = copy_count + 1,
    revenue_total = revenue_total + v_required_credits,
    updated_at = now()
  WHERE id = p_listing_id;

  -- 크리에이터 수익 계산 (70/30 분배)
  IF v_required_credits > 0 THEN
    v_creator_share := FLOOR(v_required_credits * 0.7);
    v_platform_share := v_required_credits - v_creator_share;

    INSERT INTO creator_earnings (
      creator_id, listing_id, purchase_id,
      gross_credits, platform_fee_credits, net_credits,
      status, available_at
    ) VALUES (
      v_listing.creator_id, p_listing_id, v_purchase_id,
      v_required_credits, v_platform_share, v_creator_share,
      'pending', now() + INTERVAL '7 days'
    );

    -- 크리에이터 프로필 통계 업데이트
    UPDATE creator_profiles SET
      total_sales = total_sales + 1,
      total_revenue = total_revenue + v_creator_share,
      updated_at = now()
    WHERE user_id = v_listing.creator_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'purchase_id', v_purchase_id,
    'credits_paid', v_required_credits,
    'strategy_prompt', v_listing.strategy_prompt
  );
END;
$$;

-- 9) 리스팅 생성 함수
CREATE OR REPLACE FUNCTION create_strategy_listing(
  p_user_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_strategy_prompt TEXT,
  p_category TEXT,
  p_risk_level TEXT,
  p_timeframe TEXT,
  p_tags TEXT[] DEFAULT '{}',
  p_pricing_type TEXT DEFAULT 'free',
  p_price_credits INTEGER DEFAULT 0,
  p_monthly_credits INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_listing_id UUID;
  v_strategy_hash TEXT;
BEGIN
  -- 크리에이터 프로필 확인/생성
  IF NOT EXISTS (SELECT 1 FROM creator_profiles WHERE user_id = p_user_id) THEN
    INSERT INTO creator_profiles (user_id, display_name)
    SELECT p_user_id, COALESCE(raw_user_meta_data->>'name', email)
    FROM auth.users WHERE id = p_user_id;
  END IF;

  -- 전략 해시 생성
  v_strategy_hash := encode(sha256(p_strategy_prompt::bytea), 'hex');

  -- 리스팅 생성
  INSERT INTO strategy_listings (
    creator_id, title, description, strategy_prompt, strategy_hash,
    category, tags, risk_level, timeframe,
    pricing_type, price_credits, monthly_credits,
    status
  ) VALUES (
    p_user_id, p_title, p_description, p_strategy_prompt, v_strategy_hash,
    p_category, p_tags, p_risk_level, p_timeframe,
    p_pricing_type, p_price_credits, p_monthly_credits,
    'pending_review'
  ) RETURNING id INTO v_listing_id;

  -- 크리에이터 통계 업데이트
  UPDATE creator_profiles SET
    total_listings = total_listings + 1,
    updated_at = now()
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'listing_id', v_listing_id,
    'status', 'pending_review'
  );
END;
$$;

-- 10) 리뷰 작성 함수
CREATE OR REPLACE FUNCTION create_strategy_review(
  p_user_id UUID,
  p_listing_id UUID,
  p_rating INTEGER,
  p_title TEXT DEFAULT NULL,
  p_content TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_review_id UUID;
  v_purchase_id UUID;
  v_verified BOOLEAN;
  v_new_avg NUMERIC(3,2);
  v_new_count INTEGER;
BEGIN
  -- 이미 리뷰했는지 확인
  IF EXISTS (SELECT 1 FROM strategy_reviews WHERE user_id = p_user_id AND listing_id = p_listing_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already reviewed');
  END IF;

  -- 구매 확인
  SELECT id INTO v_purchase_id FROM strategy_purchases
  WHERE user_id = p_user_id AND listing_id = p_listing_id AND status = 'active';

  v_verified := v_purchase_id IS NOT NULL;

  -- 리뷰 생성
  INSERT INTO strategy_reviews (
    user_id, listing_id, purchase_id,
    rating, title, content, verified_purchase
  ) VALUES (
    p_user_id, p_listing_id, v_purchase_id,
    p_rating, p_title, p_content, v_verified
  ) RETURNING id INTO v_review_id;

  -- 평균 평점 업데이트
  SELECT AVG(rating)::NUMERIC(3,2), COUNT(*) INTO v_new_avg, v_new_count
  FROM strategy_reviews WHERE listing_id = p_listing_id AND status = 'active';

  UPDATE strategy_listings SET
    rating_avg = v_new_avg,
    rating_count = v_new_count,
    updated_at = now()
  WHERE id = p_listing_id;

  RETURN jsonb_build_object(
    'success', true,
    'review_id', v_review_id,
    'verified_purchase', v_verified
  );
END;
$$;

-- 11) 인기 전략 조회 함수
CREATE OR REPLACE FUNCTION get_popular_listings(
  p_category TEXT DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'popular',
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  category TEXT,
  risk_level TEXT,
  timeframe TEXT,
  tags TEXT[],
  pricing_type TEXT,
  price_credits INTEGER,
  monthly_credits INTEGER,
  verified_return NUMERIC,
  verified_win_rate NUMERIC,
  verified_sharpe NUMERIC,
  copy_count INTEGER,
  rating_avg NUMERIC,
  rating_count INTEGER,
  creator_name TEXT,
  creator_verified BOOLEAN,
  featured BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sl.id,
    sl.title,
    sl.description,
    sl.category,
    sl.risk_level,
    sl.timeframe,
    sl.tags,
    sl.pricing_type,
    sl.price_credits,
    sl.monthly_credits,
    sl.verified_return,
    sl.verified_win_rate,
    sl.verified_sharpe,
    sl.copy_count,
    sl.rating_avg,
    sl.rating_count,
    cp.display_name as creator_name,
    cp.verified as creator_verified,
    sl.featured,
    sl.created_at
  FROM strategy_listings sl
  JOIN creator_profiles cp ON sl.creator_id = cp.user_id
  WHERE sl.status = 'approved'
    AND (p_category IS NULL OR sl.category = p_category)
  ORDER BY
    CASE WHEN p_sort_by = 'popular' THEN sl.copy_count END DESC,
    CASE WHEN p_sort_by = 'rating' THEN sl.rating_avg END DESC,
    CASE WHEN p_sort_by = 'return' THEN sl.verified_return END DESC,
    CASE WHEN p_sort_by = 'newest' THEN sl.created_at END DESC,
    sl.featured DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- 12) 마켓플레이스 통계 뷰
CREATE OR REPLACE VIEW marketplace_stats AS
SELECT
  COUNT(*) as total_listings,
  COUNT(*) FILTER (WHERE status = 'approved') as active_listings,
  COUNT(DISTINCT creator_id) as total_creators,
  SUM(copy_count) as total_copies,
  SUM(revenue_total) as total_revenue,
  AVG(rating_avg) FILTER (WHERE rating_count >= 5) as avg_rating,
  COUNT(*) FILTER (WHERE pricing_type = 'free') as free_listings,
  COUNT(*) FILTER (WHERE pricing_type != 'free') as paid_listings
FROM strategy_listings;

-- 13) 카테고리별 통계 뷰
CREATE OR REPLACE VIEW category_stats AS
SELECT
  category,
  COUNT(*) as listing_count,
  SUM(copy_count) as total_copies,
  AVG(rating_avg) FILTER (WHERE rating_count >= 3) as avg_rating,
  AVG(verified_return) FILTER (WHERE verified_return IS NOT NULL) as avg_return,
  AVG(verified_win_rate) FILTER (WHERE verified_win_rate IS NOT NULL) as avg_win_rate
FROM strategy_listings
WHERE status = 'approved'
GROUP BY category
ORDER BY total_copies DESC;

-- 14) 크리에이터 리더보드 뷰
CREATE OR REPLACE VIEW creator_leaderboard AS
SELECT
  cp.user_id,
  cp.display_name,
  cp.verified,
  cp.avatar_url,
  cp.total_listings,
  cp.total_sales,
  cp.total_revenue,
  cp.follower_count,
  cp.avg_rating,
  RANK() OVER (ORDER BY cp.total_revenue DESC) as revenue_rank,
  RANK() OVER (ORDER BY cp.total_sales DESC) as sales_rank,
  RANK() OVER (ORDER BY cp.avg_rating DESC) as rating_rank
FROM creator_profiles cp
WHERE cp.total_listings >= 1
ORDER BY cp.total_revenue DESC;

-- 15) RLS 정책
ALTER TABLE strategy_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_earnings ENABLE ROW LEVEL SECURITY;

-- 공개 리스팅 조회
CREATE POLICY "Anyone can view approved listings" ON strategy_listings
  FOR SELECT USING (status = 'approved');

-- 크리에이터는 자신의 리스팅 관리
CREATE POLICY "Creators can manage own listings" ON strategy_listings
  FOR ALL TO authenticated USING (creator_id = auth.uid());

-- 자신의 구매 조회
CREATE POLICY "Users can view own purchases" ON strategy_purchases
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 리뷰 조회 및 작성
CREATE POLICY "Anyone can view reviews" ON strategy_reviews FOR SELECT USING (status = 'active');
CREATE POLICY "Users can create reviews" ON strategy_reviews FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own reviews" ON strategy_reviews FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- 크리에이터 프로필 조회
CREATE POLICY "Anyone can view creator profiles" ON creator_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON creator_profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- 팔로우 관리
CREATE POLICY "Anyone can view follows" ON creator_followers FOR SELECT USING (true);
CREATE POLICY "Users can manage follows" ON creator_followers FOR ALL TO authenticated USING (follower_id = auth.uid());

-- 북마크 관리
CREATE POLICY "Users can manage bookmarks" ON strategy_bookmarks FOR ALL TO authenticated USING (user_id = auth.uid());

-- 크리에이터 수익 조회
CREATE POLICY "Creators can view own earnings" ON creator_earnings FOR SELECT TO authenticated USING (creator_id = auth.uid());

-- 16) 권한 부여
GRANT SELECT ON marketplace_stats TO authenticated;
GRANT SELECT ON category_stats TO authenticated;
GRANT SELECT ON creator_leaderboard TO authenticated;
GRANT EXECUTE ON FUNCTION purchase_strategy TO authenticated;
GRANT EXECUTE ON FUNCTION create_strategy_listing TO authenticated;
GRANT EXECUTE ON FUNCTION create_strategy_review TO authenticated;
GRANT EXECUTE ON FUNCTION get_popular_listings TO authenticated;

-- 코멘트
COMMENT ON TABLE strategy_listings IS '전략 마켓플레이스 리스팅';
COMMENT ON TABLE strategy_purchases IS '전략 구매 기록';
COMMENT ON TABLE strategy_reviews IS '전략 리뷰';
COMMENT ON TABLE creator_profiles IS '크리에이터 프로필';
COMMENT ON TABLE creator_earnings IS '크리에이터 수익';
COMMENT ON FUNCTION purchase_strategy IS '전략 구매 처리';
COMMENT ON FUNCTION create_strategy_listing IS '전략 리스팅 생성';
