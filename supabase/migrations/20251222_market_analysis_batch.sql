-- Market Analysis Batch Tables
-- Created: 2025-12-22
-- Purpose: Track market analysis batch processing for overnight analysis

-- ============================================================================
-- Table: market_analysis_queue
-- ============================================================================

CREATE TABLE IF NOT EXISTS market_analysis_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id TEXT NOT NULL UNIQUE,
  symbol_count INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'batch_submitted', 'completed', 'failed')),
  submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_market_analysis_queue_status ON market_analysis_queue(status);
CREATE INDEX IF NOT EXISTS idx_market_analysis_queue_created_at ON market_analysis_queue(created_at DESC);

-- ============================================================================
-- Table: market_analysis_results
-- ============================================================================

CREATE TABLE IF NOT EXISTS market_analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  batch_id TEXT NOT NULL,
  analysis_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Foreign key
  CONSTRAINT fk_batch_id FOREIGN KEY (batch_id) REFERENCES market_analysis_queue(batch_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_market_analysis_results_symbol ON market_analysis_results(symbol);
CREATE INDEX IF NOT EXISTS idx_market_analysis_results_batch_id ON market_analysis_results(batch_id);
CREATE INDEX IF NOT EXISTS idx_market_analysis_results_created_at ON market_analysis_results(created_at DESC);

-- Composite index for latest analysis per symbol
CREATE INDEX IF NOT EXISTS idx_market_analysis_results_symbol_created
  ON market_analysis_results(symbol, created_at DESC);

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE market_analysis_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_analysis_results ENABLE ROW LEVEL SECURITY;

-- Public read access (시장 분석은 모든 사용자에게 공개)
CREATE POLICY "Public can view market analysis queue"
  ON market_analysis_queue
  FOR SELECT
  USING (true);

CREATE POLICY "Public can view market analysis results"
  ON market_analysis_results
  FOR SELECT
  USING (true);

-- Service role can insert/update
CREATE POLICY "Service role can manage queue"
  ON market_analysis_queue
  FOR ALL
  USING (true);

CREATE POLICY "Service role can insert results"
  ON market_analysis_results
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- Helper Functions
-- ============================================================================

/**
 * Get latest analysis for a symbol
 */
CREATE OR REPLACE FUNCTION get_latest_market_analysis(target_symbol TEXT)
RETURNS TABLE (
  symbol TEXT,
  analysis_data JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    market_analysis_results.symbol,
    market_analysis_results.analysis_data,
    market_analysis_results.created_at
  FROM market_analysis_results
  WHERE market_analysis_results.symbol = target_symbol
  ORDER BY market_analysis_results.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Get analysis stats for last N days
 */
CREATE OR REPLACE FUNCTION get_market_analysis_stats(days INTEGER DEFAULT 7)
RETURNS TABLE (
  total_batches BIGINT,
  total_symbols BIGINT,
  avg_symbols_per_batch NUMERIC,
  success_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_batches,
    SUM(symbol_count)::BIGINT AS total_symbols,
    ROUND(AVG(symbol_count)::NUMERIC, 2) AS avg_symbols_per_batch,
    ROUND(
      COUNT(CASE WHEN status = 'completed' THEN 1 END)::DECIMAL /
      NULLIF(COUNT(*)::DECIMAL, 0) * 100,
      2
    ) AS success_rate
  FROM market_analysis_queue
  WHERE created_at >= NOW() - INTERVAL '1 day' * days;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Clean up old analysis results (older than 30 days)
 */
CREATE OR REPLACE FUNCTION cleanup_old_market_analysis()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM market_analysis_results
  WHERE created_at < NOW() - INTERVAL '30 days'
  RETURNING COUNT(*) INTO deleted_count;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE market_analysis_queue IS 'Tracks market analysis batch jobs';
COMMENT ON TABLE market_analysis_results IS 'Stores market analysis results from batch processing';

COMMENT ON COLUMN market_analysis_queue.batch_id IS 'Anthropic Batch API batch ID';
COMMENT ON COLUMN market_analysis_queue.symbol_count IS 'Number of symbols analyzed in this batch';
COMMENT ON COLUMN market_analysis_results.analysis_data IS 'AI-generated market analysis (trend, support/resistance, insights)';

COMMENT ON FUNCTION get_latest_market_analysis(TEXT) IS 'Get the most recent analysis for a symbol';
COMMENT ON FUNCTION get_market_analysis_stats(INTEGER) IS 'Get market analysis statistics for last N days';
COMMENT ON FUNCTION cleanup_old_market_analysis() IS 'Delete market analysis results older than 30 days';
