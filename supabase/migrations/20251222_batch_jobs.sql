-- Batch Jobs Table for Claude Batch API
-- Created: 2025-12-22
-- Purpose: Track batch processing jobs for overnight analysis

-- ============================================================================
-- Table: batch_jobs
-- ============================================================================

CREATE TABLE IF NOT EXISTS batch_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('backtest', 'market_analysis', 'legal_check', 'strategy_generation')),
  status TEXT NOT NULL CHECK (status IN ('processing', 'ended', 'expired', 'failed')),
  request_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  results_url TEXT,
  user_id UUID REFERENCES auth.users(id),

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Indexes
  CONSTRAINT batch_jobs_batch_id_key UNIQUE (batch_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_batch_jobs_status ON batch_jobs(status);
CREATE INDEX IF NOT EXISTS idx_batch_jobs_type ON batch_jobs(type);
CREATE INDEX IF NOT EXISTS idx_batch_jobs_created_at ON batch_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_batch_jobs_user_id ON batch_jobs(user_id);

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE batch_jobs ENABLE ROW LEVEL SECURITY;

-- Users can view their own batch jobs
CREATE POLICY "Users can view own batch jobs"
  ON batch_jobs
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Service role can insert batch jobs
CREATE POLICY "Service role can insert batch jobs"
  ON batch_jobs
  FOR INSERT
  WITH CHECK (true);

-- Service role can update batch jobs
CREATE POLICY "Service role can update batch jobs"
  ON batch_jobs
  FOR UPDATE
  USING (true);

-- ============================================================================
-- Helper Functions
-- ============================================================================

/**
 * Get pending batch count
 */
CREATE OR REPLACE FUNCTION get_pending_batch_count()
RETURNS TABLE (
  type TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    batch_jobs.type,
    COUNT(*)::BIGINT
  FROM batch_jobs
  WHERE status = 'processing'
  GROUP BY batch_jobs.type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Get batch processing stats (last 7 days)
 */
CREATE OR REPLACE FUNCTION get_batch_stats(days INTEGER DEFAULT 7)
RETURNS TABLE (
  total_batches BIGINT,
  total_requests BIGINT,
  avg_completion_time INTERVAL,
  success_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_batches,
    SUM(request_count)::BIGINT AS total_requests,
    AVG(completed_at - created_at) AS avg_completion_time,
    ROUND(
      COUNT(CASE WHEN status = 'ended' THEN 1 END)::DECIMAL /
      NULLIF(COUNT(*)::DECIMAL, 0) * 100,
      2
    ) AS success_rate
  FROM batch_jobs
  WHERE created_at >= NOW() - INTERVAL '1 day' * days;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Clean up old batch jobs (older than 30 days)
 */
CREATE OR REPLACE FUNCTION cleanup_old_batch_jobs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM batch_jobs
  WHERE created_at < NOW() - INTERVAL '30 days'
  RETURNING COUNT(*) INTO deleted_count;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE batch_jobs IS 'Tracks Claude Batch API jobs for overnight processing';
COMMENT ON COLUMN batch_jobs.batch_id IS 'Anthropic Batch API batch ID';
COMMENT ON COLUMN batch_jobs.type IS 'Type of batch job: backtest, market_analysis, legal_check, strategy_generation';
COMMENT ON COLUMN batch_jobs.status IS 'Processing status: processing, ended, expired, failed';
COMMENT ON COLUMN batch_jobs.request_count IS 'Number of requests in this batch';
COMMENT ON COLUMN batch_jobs.results_url IS 'URL to download batch results (valid for 29 days)';

COMMENT ON FUNCTION get_pending_batch_count() IS 'Get count of pending batches by type';
COMMENT ON FUNCTION get_batch_stats(INTEGER) IS 'Get batch processing statistics for last N days';
COMMENT ON FUNCTION cleanup_old_batch_jobs() IS 'Delete batch jobs older than 30 days';
