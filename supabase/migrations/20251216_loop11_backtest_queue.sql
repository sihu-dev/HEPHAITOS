-- ============================================
-- Loop 11: Backtest Queue System
-- Migration: backtest_jobs 테이블 + Realtime
-- ============================================

-- backtest_jobs 테이블 생성
CREATE TABLE IF NOT EXISTS backtest_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id TEXT UNIQUE NOT NULL, -- BullMQ Job ID
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy_id UUID REFERENCES strategies(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  message TEXT, -- 진행률 메시지 ("데이터 로딩 중...", "백테스트 실행 중...")
  priority INTEGER DEFAULT 0, -- 0 (Free) | 1 (Basic) | 2 (Pro)
  result JSONB, -- 백테스트 결과 또는 에러
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_backtest_jobs_user ON backtest_jobs(user_id);
CREATE INDEX idx_backtest_jobs_status ON backtest_jobs(status);
CREATE INDEX idx_backtest_jobs_job_id ON backtest_jobs(job_id);
CREATE INDEX idx_backtest_jobs_created_at ON backtest_jobs(created_at DESC);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_backtest_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER backtest_jobs_updated_at
BEFORE UPDATE ON backtest_jobs
FOR EACH ROW
EXECUTE FUNCTION update_backtest_jobs_updated_at();

-- Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE backtest_jobs;

-- RLS (Row Level Security) 설정
ALTER TABLE backtest_jobs ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 잡만 조회 가능
CREATE POLICY "Users can view their own jobs"
  ON backtest_jobs FOR SELECT
  USING (auth.uid() = user_id);

-- 시스템(Service Role)은 모든 작업 가능
CREATE POLICY "Service role can do anything"
  ON backtest_jobs FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Helper Function: 사용자의 대기 중인 잡 개수 조회
CREATE OR REPLACE FUNCTION get_user_pending_jobs_count(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM backtest_jobs
  WHERE user_id = p_user_id
    AND status IN ('pending', 'active');
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper Function: 잡 생성 (멱등성 보장)
CREATE OR REPLACE FUNCTION create_backtest_job(
  p_user_id UUID,
  p_strategy_id UUID,
  p_job_id TEXT,
  p_timeframe TEXT,
  p_start_date TEXT,
  p_end_date TEXT,
  p_symbol TEXT
)
RETURNS backtest_jobs AS $$
DECLARE
  v_job backtest_jobs;
BEGIN
  -- 이미 존재하는 경우 반환
  SELECT * INTO v_job
  FROM backtest_jobs
  WHERE job_id = p_job_id;

  IF FOUND THEN
    RETURN v_job;
  END IF;

  -- 새로 생성
  INSERT INTO backtest_jobs (
    job_id,
    user_id,
    strategy_id,
    status,
    progress,
    message
  ) VALUES (
    p_job_id,
    p_user_id,
    p_strategy_id,
    'pending',
    0,
    '대기 중...'
  )
  RETURNING * INTO v_job;

  RETURN v_job;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 코멘트 추가
COMMENT ON TABLE backtest_jobs IS 'Loop 11: BullMQ 백테스트 큐 시스템';
COMMENT ON COLUMN backtest_jobs.job_id IS 'BullMQ Job ID (unique)';
COMMENT ON COLUMN backtest_jobs.priority IS '0=Free, 1=Basic, 2=Pro (높을수록 우선)';
COMMENT ON COLUMN backtest_jobs.result IS '백테스트 결과 JSONB (completed) 또는 에러 메시지 (failed)';
