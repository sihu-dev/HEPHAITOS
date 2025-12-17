-- ============================================
-- Strategy Performance Network Effect
-- Loop 16: 전략 성과 네트워크 효과
-- ============================================

-- 1) 전략 성과 집계 테이블 (익명화)
CREATE TABLE IF NOT EXISTS strategy_performance_aggregates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 전략 식별 (익명화)
  strategy_hash TEXT NOT NULL,           -- 전략 프롬프트 해시
  strategy_type TEXT NOT NULL,           -- 'momentum', 'mean_reversion', 'breakout', 'ai_generated', etc.
  strategy_tags TEXT[] DEFAULT '{}',     -- ['tech', 'dividend', 'growth', etc.]

  -- 시장 조건
  market_condition TEXT NOT NULL,        -- 'bull', 'bear', 'sideways', 'volatile'
  market_sector TEXT,                    -- 'tech', 'finance', 'healthcare', etc.
  timeframe TEXT NOT NULL,               -- '1d', '1w', '1m', '3m'

  -- 성과 지표 (집계)
  total_runs INTEGER DEFAULT 0,
  total_users INTEGER DEFAULT 0,

  -- 수익률
  avg_return NUMERIC(8,4) DEFAULT 0,     -- 평균 수익률 (%)
  median_return NUMERIC(8,4) DEFAULT 0,
  max_return NUMERIC(8,4) DEFAULT 0,
  min_return NUMERIC(8,4) DEFAULT 0,
  std_return NUMERIC(8,4) DEFAULT 0,     -- 표준편차

  -- 승률
  win_rate NUMERIC(5,2) DEFAULT 0,       -- 승률 (%)
  profit_factor NUMERIC(6,2) DEFAULT 0,  -- 총이익/총손실

  -- 리스크 지표
  sharpe_ratio NUMERIC(6,3) DEFAULT 0,
  max_drawdown NUMERIC(6,2) DEFAULT 0,   -- 최대 낙폭 (%)
  calmar_ratio NUMERIC(6,3) DEFAULT 0,   -- 연 수익률/최대 낙폭

  -- 신뢰도
  confidence_score NUMERIC(5,2) DEFAULT 0, -- 0-100
  sample_size_tier TEXT DEFAULT 'low',   -- 'low', 'medium', 'high'

  -- 메타
  first_run_at TIMESTAMPTZ,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(strategy_hash, market_condition, timeframe)
);

CREATE INDEX IF NOT EXISTS idx_strategy_perf_type ON strategy_performance_aggregates(strategy_type);
CREATE INDEX IF NOT EXISTS idx_strategy_perf_condition ON strategy_performance_aggregates(market_condition);
CREATE INDEX IF NOT EXISTS idx_strategy_perf_timeframe ON strategy_performance_aggregates(timeframe);
CREATE INDEX IF NOT EXISTS idx_strategy_perf_return ON strategy_performance_aggregates(avg_return DESC);
CREATE INDEX IF NOT EXISTS idx_strategy_perf_sharpe ON strategy_performance_aggregates(sharpe_ratio DESC);

-- 2) 개별 전략 실행 기록 (익명화 전)
CREATE TABLE IF NOT EXISTS strategy_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy_id UUID NOT NULL,
  strategy_hash TEXT NOT NULL,

  -- 실행 정보
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_hours NUMERIC(8,2),

  -- 시장 조건 (실행 시점)
  market_condition TEXT,
  market_sector TEXT,

  -- 성과
  initial_capital NUMERIC(16,2),
  final_capital NUMERIC(16,2),
  return_pct NUMERIC(8,4),
  trades_count INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,

  -- 리스크 지표
  max_drawdown NUMERIC(6,2),
  sharpe_ratio NUMERIC(6,3),

  -- 메타
  is_simulation BOOLEAN DEFAULT true,
  aggregated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_strategy_exec_user ON strategy_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_strategy_exec_hash ON strategy_executions(strategy_hash);
CREATE INDEX IF NOT EXISTS idx_strategy_exec_aggregated ON strategy_executions(aggregated);

-- 3) 시장 조건 스냅샷 테이블
CREATE TABLE IF NOT EXISTS market_conditions (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,

  -- 지수 수익률
  sp500_return NUMERIC(6,3),
  nasdaq_return NUMERIC(6,3),
  kospi_return NUMERIC(6,3),

  -- 변동성
  vix NUMERIC(6,2),
  volatility_regime TEXT,  -- 'low', 'normal', 'high', 'extreme'

  -- 시장 상태
  condition TEXT NOT NULL,  -- 'bull', 'bear', 'sideways', 'volatile'
  trend_strength NUMERIC(5,2),  -- 0-100

  -- 섹터 성과
  top_sectors TEXT[],
  bottom_sectors TEXT[],

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4) 전략 태그 테이블
CREATE TABLE IF NOT EXISTS strategy_tags (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,  -- 'asset', 'style', 'indicator', 'risk'
  description TEXT,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 기본 태그 삽입
INSERT INTO strategy_tags (name, category, description) VALUES
  -- Asset
  ('tech', 'asset', '기술주'),
  ('finance', 'asset', '금융주'),
  ('healthcare', 'asset', '헬스케어'),
  ('energy', 'asset', '에너지'),
  ('consumer', 'asset', '소비재'),
  ('crypto', 'asset', '암호화폐'),
  -- Style
  ('momentum', 'style', '모멘텀 전략'),
  ('value', 'style', '가치 투자'),
  ('growth', 'style', '성장 투자'),
  ('dividend', 'style', '배당 투자'),
  ('swing', 'style', '스윙 트레이딩'),
  ('scalping', 'style', '스캘핑'),
  -- Indicator
  ('ma_cross', 'indicator', '이동평균 교차'),
  ('rsi', 'indicator', 'RSI'),
  ('macd', 'indicator', 'MACD'),
  ('bollinger', 'indicator', '볼린저 밴드'),
  ('volume', 'indicator', '거래량 분석'),
  -- Risk
  ('conservative', 'risk', '보수적'),
  ('moderate', 'risk', '중립적'),
  ('aggressive', 'risk', '공격적')
ON CONFLICT (name) DO NOTHING;

-- 5) 전략 해시 생성 함수
CREATE OR REPLACE FUNCTION generate_strategy_hash(p_prompt TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- 프롬프트를 정규화하고 해시 생성
  RETURN encode(
    sha256(
      regexp_replace(lower(trim(p_prompt)), '\s+', ' ', 'g')::bytea
    ),
    'hex'
  );
END;
$$;

-- 6) 시장 조건 판단 함수
CREATE OR REPLACE FUNCTION determine_market_condition(
  p_return NUMERIC,
  p_volatility NUMERIC
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_volatility > 30 THEN
    RETURN 'volatile';
  ELSIF p_return > 5 THEN
    RETURN 'bull';
  ELSIF p_return < -5 THEN
    RETURN 'bear';
  ELSE
    RETURN 'sideways';
  END IF;
END;
$$;

-- 7) 전략 성과 집계 함수
CREATE OR REPLACE FUNCTION aggregate_strategy_performance()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_aggregated INTEGER := 0;
  v_record RECORD;
BEGIN
  -- 미집계 실행 건들을 그룹화하여 집계
  FOR v_record IN
    SELECT
      se.strategy_hash,
      COALESCE(se.market_condition, 'sideways') as market_condition,
      CASE
        WHEN se.duration_hours < 24 THEN '1d'
        WHEN se.duration_hours < 168 THEN '1w'
        WHEN se.duration_hours < 720 THEN '1m'
        ELSE '3m'
      END as timeframe,
      COUNT(*) as runs,
      COUNT(DISTINCT se.user_id) as users,
      AVG(se.return_pct) as avg_return,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY se.return_pct) as median_return,
      MAX(se.return_pct) as max_return,
      MIN(se.return_pct) as min_return,
      STDDEV(se.return_pct) as std_return,
      AVG(CASE WHEN se.return_pct > 0 THEN 1 ELSE 0 END) * 100 as win_rate,
      AVG(se.sharpe_ratio) as avg_sharpe,
      AVG(se.max_drawdown) as avg_drawdown,
      MIN(se.started_at) as first_run,
      MAX(se.ended_at) as last_run
    FROM strategy_executions se
    WHERE se.aggregated = false
      AND se.ended_at IS NOT NULL
    GROUP BY se.strategy_hash, se.market_condition,
      CASE
        WHEN se.duration_hours < 24 THEN '1d'
        WHEN se.duration_hours < 168 THEN '1w'
        WHEN se.duration_hours < 720 THEN '1m'
        ELSE '3m'
      END
    HAVING COUNT(*) >= 3  -- 최소 3회 이상 실행된 경우만
  LOOP
    -- Upsert 집계 데이터
    INSERT INTO strategy_performance_aggregates (
      strategy_hash, strategy_type, market_condition, timeframe,
      total_runs, total_users,
      avg_return, median_return, max_return, min_return, std_return,
      win_rate, sharpe_ratio, max_drawdown,
      confidence_score, sample_size_tier,
      first_run_at, last_run_at, updated_at
    ) VALUES (
      v_record.strategy_hash,
      'ai_generated',  -- 기본값
      v_record.market_condition,
      v_record.timeframe,
      v_record.runs,
      v_record.users,
      COALESCE(v_record.avg_return, 0),
      COALESCE(v_record.median_return, 0),
      COALESCE(v_record.max_return, 0),
      COALESCE(v_record.min_return, 0),
      COALESCE(v_record.std_return, 0),
      COALESCE(v_record.win_rate, 0),
      COALESCE(v_record.avg_sharpe, 0),
      COALESCE(v_record.avg_drawdown, 0),
      -- 신뢰도 계산
      LEAST(100, v_record.runs * 5 + v_record.users * 10),
      CASE
        WHEN v_record.runs >= 100 THEN 'high'
        WHEN v_record.runs >= 30 THEN 'medium'
        ELSE 'low'
      END,
      v_record.first_run,
      v_record.last_run,
      now()
    )
    ON CONFLICT (strategy_hash, market_condition, timeframe)
    DO UPDATE SET
      total_runs = strategy_performance_aggregates.total_runs + EXCLUDED.total_runs,
      total_users = GREATEST(strategy_performance_aggregates.total_users, EXCLUDED.total_users),
      avg_return = (strategy_performance_aggregates.avg_return * strategy_performance_aggregates.total_runs + EXCLUDED.avg_return * EXCLUDED.total_runs) / (strategy_performance_aggregates.total_runs + EXCLUDED.total_runs),
      win_rate = (strategy_performance_aggregates.win_rate * strategy_performance_aggregates.total_runs + EXCLUDED.win_rate * EXCLUDED.total_runs) / (strategy_performance_aggregates.total_runs + EXCLUDED.total_runs),
      sharpe_ratio = (strategy_performance_aggregates.sharpe_ratio * strategy_performance_aggregates.total_runs + EXCLUDED.sharpe_ratio * EXCLUDED.total_runs) / (strategy_performance_aggregates.total_runs + EXCLUDED.total_runs),
      last_run_at = EXCLUDED.last_run_at,
      updated_at = now(),
      confidence_score = LEAST(100, (strategy_performance_aggregates.total_runs + EXCLUDED.total_runs) * 5),
      sample_size_tier = CASE
        WHEN strategy_performance_aggregates.total_runs + EXCLUDED.total_runs >= 100 THEN 'high'
        WHEN strategy_performance_aggregates.total_runs + EXCLUDED.total_runs >= 30 THEN 'medium'
        ELSE 'low'
      END;

    v_aggregated := v_aggregated + v_record.runs;
  END LOOP;

  -- 집계 완료 표시
  UPDATE strategy_executions
  SET aggregated = true
  WHERE aggregated = false
    AND ended_at IS NOT NULL;

  RETURN v_aggregated;
END;
$$;

-- 8) 인기 전략 조회 함수
CREATE OR REPLACE FUNCTION get_popular_strategies(
  p_market_condition TEXT DEFAULT NULL,
  p_timeframe TEXT DEFAULT '1w',
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  strategy_hash TEXT,
  strategy_type TEXT,
  strategy_tags TEXT[],
  market_condition TEXT,
  timeframe TEXT,
  total_runs INTEGER,
  total_users INTEGER,
  avg_return NUMERIC,
  win_rate NUMERIC,
  sharpe_ratio NUMERIC,
  confidence_score NUMERIC,
  rank INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    spa.strategy_hash,
    spa.strategy_type,
    spa.strategy_tags,
    spa.market_condition,
    spa.timeframe,
    spa.total_runs,
    spa.total_users,
    spa.avg_return,
    spa.win_rate,
    spa.sharpe_ratio,
    spa.confidence_score,
    ROW_NUMBER() OVER (ORDER BY spa.sharpe_ratio DESC, spa.win_rate DESC)::INTEGER as rank
  FROM strategy_performance_aggregates spa
  WHERE (p_market_condition IS NULL OR spa.market_condition = p_market_condition)
    AND spa.timeframe = p_timeframe
    AND spa.total_runs >= 5
    AND spa.confidence_score >= 30
  ORDER BY spa.sharpe_ratio DESC, spa.win_rate DESC
  LIMIT p_limit;
END;
$$;

-- 9) 전략 비교 함수
CREATE OR REPLACE FUNCTION compare_strategy_performance(
  p_strategy_hash TEXT,
  p_timeframe TEXT DEFAULT '1w'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_strategy RECORD;
  v_avg_return NUMERIC;
  v_avg_sharpe NUMERIC;
  v_percentile_return INTEGER;
  v_percentile_sharpe INTEGER;
BEGIN
  -- 전략 성과 조회
  SELECT * INTO v_strategy
  FROM strategy_performance_aggregates
  WHERE strategy_hash = p_strategy_hash
    AND timeframe = p_timeframe
  ORDER BY total_runs DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'STRATEGY_NOT_FOUND');
  END IF;

  -- 전체 평균
  SELECT AVG(avg_return), AVG(sharpe_ratio)
  INTO v_avg_return, v_avg_sharpe
  FROM strategy_performance_aggregates
  WHERE timeframe = p_timeframe
    AND total_runs >= 5;

  -- 백분위 계산
  SELECT
    (SELECT COUNT(*) FROM strategy_performance_aggregates
     WHERE timeframe = p_timeframe AND avg_return < v_strategy.avg_return) * 100 /
    NULLIF((SELECT COUNT(*) FROM strategy_performance_aggregates WHERE timeframe = p_timeframe), 0)
  INTO v_percentile_return;

  SELECT
    (SELECT COUNT(*) FROM strategy_performance_aggregates
     WHERE timeframe = p_timeframe AND sharpe_ratio < v_strategy.sharpe_ratio) * 100 /
    NULLIF((SELECT COUNT(*) FROM strategy_performance_aggregates WHERE timeframe = p_timeframe), 0)
  INTO v_percentile_sharpe;

  RETURN jsonb_build_object(
    'strategy', jsonb_build_object(
      'hash', v_strategy.strategy_hash,
      'type', v_strategy.strategy_type,
      'market_condition', v_strategy.market_condition,
      'total_runs', v_strategy.total_runs,
      'avg_return', v_strategy.avg_return,
      'win_rate', v_strategy.win_rate,
      'sharpe_ratio', v_strategy.sharpe_ratio,
      'max_drawdown', v_strategy.max_drawdown
    ),
    'comparison', jsonb_build_object(
      'avg_return_all', v_avg_return,
      'avg_sharpe_all', v_avg_sharpe,
      'return_percentile', COALESCE(v_percentile_return, 0),
      'sharpe_percentile', COALESCE(v_percentile_sharpe, 0),
      'better_than_avg_return', v_strategy.avg_return > COALESCE(v_avg_return, 0),
      'better_than_avg_sharpe', v_strategy.sharpe_ratio > COALESCE(v_avg_sharpe, 0)
    )
  );
END;
$$;

-- 10) 시장 조건별 최적 전략 조회
CREATE OR REPLACE FUNCTION get_best_strategies_by_condition()
RETURNS TABLE (
  market_condition TEXT,
  best_strategy_hash TEXT,
  avg_return NUMERIC,
  win_rate NUMERIC,
  sharpe_ratio NUMERIC,
  total_runs INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (spa.market_condition)
    spa.market_condition,
    spa.strategy_hash,
    spa.avg_return,
    spa.win_rate,
    spa.sharpe_ratio,
    spa.total_runs
  FROM strategy_performance_aggregates spa
  WHERE spa.total_runs >= 10
    AND spa.confidence_score >= 50
  ORDER BY spa.market_condition, spa.sharpe_ratio DESC;
END;
$$;

-- 11) 전략 인사이트 뷰
CREATE OR REPLACE VIEW strategy_insights AS
SELECT
  market_condition,
  COUNT(*) as strategy_count,
  AVG(avg_return) as avg_return,
  AVG(win_rate) as avg_win_rate,
  AVG(sharpe_ratio) as avg_sharpe,
  MAX(avg_return) as best_return,
  MIN(avg_return) as worst_return,
  SUM(total_runs) as total_runs,
  SUM(total_users) as total_users
FROM strategy_performance_aggregates
WHERE total_runs >= 5
GROUP BY market_condition;

-- 12) 전략 타입별 성과 뷰
CREATE OR REPLACE VIEW strategy_type_performance AS
SELECT
  strategy_type,
  market_condition,
  COUNT(*) as strategy_count,
  AVG(avg_return) as avg_return,
  AVG(win_rate) as avg_win_rate,
  AVG(sharpe_ratio) as avg_sharpe,
  SUM(total_runs) as total_runs
FROM strategy_performance_aggregates
WHERE total_runs >= 5
GROUP BY strategy_type, market_condition
ORDER BY strategy_type, market_condition;

-- 13) RLS 정책
ALTER TABLE strategy_performance_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_tags ENABLE ROW LEVEL SECURITY;

-- 집계 데이터는 모든 사용자가 조회 가능 (익명화됨)
CREATE POLICY "Anyone can view aggregated performance"
  ON strategy_performance_aggregates FOR SELECT
  TO authenticated
  USING (true);

-- 자신의 실행 기록만 조회 가능
CREATE POLICY "Users can view own executions"
  ON strategy_executions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own executions"
  ON strategy_executions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 시장 조건은 모든 사용자 조회 가능
CREATE POLICY "Anyone can view market conditions"
  ON market_conditions FOR SELECT
  TO authenticated
  USING (true);

-- 태그는 모든 사용자 조회 가능
CREATE POLICY "Anyone can view tags"
  ON strategy_tags FOR SELECT
  USING (true);

-- 14) 권한 부여
GRANT SELECT ON strategy_insights TO authenticated;
GRANT SELECT ON strategy_type_performance TO authenticated;
GRANT EXECUTE ON FUNCTION generate_strategy_hash TO authenticated;
GRANT EXECUTE ON FUNCTION get_popular_strategies TO authenticated;
GRANT EXECUTE ON FUNCTION compare_strategy_performance TO authenticated;
GRANT EXECUTE ON FUNCTION get_best_strategies_by_condition TO authenticated;
GRANT EXECUTE ON FUNCTION aggregate_strategy_performance TO authenticated;

-- 코멘트
COMMENT ON TABLE strategy_performance_aggregates IS '전략 성과 집계 (익명화)';
COMMENT ON TABLE strategy_executions IS '개별 전략 실행 기록';
COMMENT ON TABLE market_conditions IS '시장 조건 스냅샷';
COMMENT ON FUNCTION get_popular_strategies IS '인기 전략 조회 (네트워크 효과)';
COMMENT ON FUNCTION compare_strategy_performance IS '전략 성과 비교';
