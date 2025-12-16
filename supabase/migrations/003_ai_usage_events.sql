-- ============================================
-- AI Usage Events 테이블
-- AI 사용량 추적 및 비용 계산
-- ============================================

-- ai_usage_events 테이블 생성
CREATE TABLE IF NOT EXISTS ai_usage_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 사용 정보
  feature TEXT NOT NULL,  -- 'strategy_generate', 'report_create', 'tutor_answer', etc.
  credits_used INTEGER NOT NULL DEFAULT 0,

  -- AI 사용량 세부 정보
  tokens_input INTEGER,
  tokens_output INTEGER,
  model_used TEXT,
  latency_ms INTEGER,
  cost_estimate_krw DECIMAL(10, 2),

  -- 상태
  success BOOLEAN DEFAULT true,
  error_message TEXT,

  -- 메타데이터
  metadata JSONB,

  -- 타임스탬프
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_ai_usage_events_user_id ON ai_usage_events(user_id);
CREATE INDEX idx_ai_usage_events_feature ON ai_usage_events(feature);
CREATE INDEX idx_ai_usage_events_success ON ai_usage_events(success);
CREATE INDEX idx_ai_usage_events_created_at ON ai_usage_events(created_at DESC);

-- RLS 활성화
ALTER TABLE ai_usage_events ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "Users can view own ai usage events"
  ON ai_usage_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert ai usage events"
  ON ai_usage_events FOR INSERT
  WITH CHECK (true);

-- 코멘트
COMMENT ON TABLE ai_usage_events IS 'HEPHAITOS AI 사용량 추적';
