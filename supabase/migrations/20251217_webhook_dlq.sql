-- ============================================
-- GPT V1 피드백: Webhook Dead Letter Queue
-- 실패한 웹훅 이벤트 재처리 시스템
-- 날짜: 2025-12-17
-- ============================================

-- ============================================
-- 1. payment_webhook_events 테이블 확장
-- ============================================

-- 재시도 관련 컬럼 추가
ALTER TABLE payment_webhook_events
ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_retries INTEGER NOT NULL DEFAULT 3,
ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS moved_to_dlq_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS dlq_reason TEXT;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_webhook_events_pending_retry
  ON payment_webhook_events(next_retry_at)
  WHERE process_status = 'failed' AND retry_count < max_retries AND next_retry_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_webhook_events_dlq
  ON payment_webhook_events(moved_to_dlq_at)
  WHERE moved_to_dlq_at IS NOT NULL;

-- ============================================
-- 2. Dead Letter Queue 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS webhook_dead_letter_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- 원본 이벤트 정보
  original_event_id TEXT NOT NULL,
  provider VARCHAR(50) NOT NULL,
  order_id TEXT,
  payload JSONB NOT NULL,

  -- 실패 정보
  failure_count INTEGER NOT NULL,
  last_error TEXT,
  error_history JSONB DEFAULT '[]',  -- [{timestamp, error, attempt}]

  -- 상태
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'retrying', 'resolved', 'abandoned')),

  -- 해결 정보
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  resolution_notes TEXT,

  -- 타임스탬프
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_dlq_status ON webhook_dead_letter_queue(status);
CREATE INDEX IF NOT EXISTS idx_dlq_provider ON webhook_dead_letter_queue(provider);
CREATE INDEX IF NOT EXISTS idx_dlq_created ON webhook_dead_letter_queue(created_at DESC);

-- ============================================
-- 3. 웹훅 재시도 스케줄링 함수
-- ============================================
CREATE OR REPLACE FUNCTION schedule_webhook_retry(
  p_event_id TEXT,
  p_error TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_retry_count INTEGER;
  v_max_retries INTEGER;
  v_next_retry_at TIMESTAMPTZ;
  v_delay_seconds INTEGER;
BEGIN
  -- 현재 재시도 횟수 조회
  SELECT retry_count, max_retries INTO v_retry_count, v_max_retries
  FROM payment_webhook_events
  WHERE event_id = p_event_id;

  v_retry_count := v_retry_count + 1;

  IF v_retry_count >= v_max_retries THEN
    -- DLQ로 이동
    PERFORM move_to_dead_letter_queue(p_event_id, p_error);
    RETURN;
  END IF;

  -- Exponential backoff: 30초, 2분, 8분
  v_delay_seconds := 30 * POWER(4, v_retry_count - 1);
  v_next_retry_at := NOW() + (v_delay_seconds || ' seconds')::INTERVAL;

  -- 재시도 스케줄 업데이트
  UPDATE payment_webhook_events
  SET
    retry_count = v_retry_count,
    next_retry_at = v_next_retry_at,
    error = p_error,
    process_status = 'failed',
    updated_at = NOW()
  WHERE event_id = p_event_id;

  RAISE NOTICE 'Webhook % scheduled for retry #% at %', p_event_id, v_retry_count, v_next_retry_at;
END;
$$;

-- ============================================
-- 4. DLQ 이동 함수
-- ============================================
CREATE OR REPLACE FUNCTION move_to_dead_letter_queue(
  p_event_id TEXT,
  p_last_error TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event RECORD;
  v_dlq_id UUID;
  v_error_history JSONB;
BEGIN
  -- 원본 이벤트 조회
  SELECT * INTO v_event
  FROM payment_webhook_events
  WHERE event_id = p_event_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found: %', p_event_id;
  END IF;

  -- 에러 히스토리 생성
  v_error_history := jsonb_build_array(
    jsonb_build_object(
      'timestamp', NOW(),
      'error', p_last_error,
      'attempt', v_event.retry_count + 1
    )
  );

  -- DLQ에 삽입
  INSERT INTO webhook_dead_letter_queue (
    original_event_id,
    provider,
    order_id,
    payload,
    failure_count,
    last_error,
    error_history,
    status
  ) VALUES (
    p_event_id,
    v_event.provider,
    v_event.order_id,
    v_event.payload,
    v_event.retry_count + 1,
    p_last_error,
    v_error_history,
    'pending'
  )
  RETURNING id INTO v_dlq_id;

  -- 원본 이벤트 업데이트
  UPDATE payment_webhook_events
  SET
    process_status = 'dlq',
    moved_to_dlq_at = NOW(),
    dlq_reason = p_last_error,
    updated_at = NOW()
  WHERE event_id = p_event_id;

  RAISE NOTICE 'Event % moved to DLQ as %', p_event_id, v_dlq_id;

  RETURN v_dlq_id;
END;
$$;

-- ============================================
-- 5. 재시도 대상 조회 함수
-- ============================================
CREATE OR REPLACE FUNCTION get_pending_webhook_retries(
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
  event_id TEXT,
  provider VARCHAR(50),
  order_id TEXT,
  payload JSONB,
  retry_count INTEGER
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    event_id,
    provider,
    order_id,
    payload,
    retry_count
  FROM payment_webhook_events
  WHERE process_status = 'failed'
    AND retry_count < max_retries
    AND next_retry_at <= NOW()
  ORDER BY next_retry_at ASC
  LIMIT p_limit;
$$;

-- ============================================
-- 6. DLQ 통계 조회 함수
-- ============================================
CREATE OR REPLACE FUNCTION get_dlq_stats()
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT jsonb_build_object(
    'total', COUNT(*),
    'pending', COUNT(*) FILTER (WHERE status = 'pending'),
    'retrying', COUNT(*) FILTER (WHERE status = 'retrying'),
    'resolved', COUNT(*) FILTER (WHERE status = 'resolved'),
    'abandoned', COUNT(*) FILTER (WHERE status = 'abandoned'),
    'by_provider', (
      SELECT jsonb_object_agg(provider, cnt)
      FROM (
        SELECT provider, COUNT(*) as cnt
        FROM webhook_dead_letter_queue
        WHERE status = 'pending'
        GROUP BY provider
      ) sub
    )
  )
  FROM webhook_dead_letter_queue;
$$;

-- ============================================
-- 7. DLQ 항목 해결 함수
-- ============================================
CREATE OR REPLACE FUNCTION resolve_dlq_item(
  p_dlq_id UUID,
  p_resolved_by UUID,
  p_resolution VARCHAR(20),  -- 'resolved', 'abandoned'
  p_notes TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE webhook_dead_letter_queue
  SET
    status = p_resolution,
    resolved_at = NOW(),
    resolved_by = p_resolved_by,
    resolution_notes = p_notes,
    updated_at = NOW()
  WHERE id = p_dlq_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'DLQ item not found');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'dlq_id', p_dlq_id,
    'resolution', p_resolution
  );
END;
$$;

-- ============================================
-- 8. RLS 정책 (관리자만 접근)
-- ============================================
ALTER TABLE webhook_dead_letter_queue ENABLE ROW LEVEL SECURITY;

-- 관리자 확인 함수 (profiles 테이블의 role 컬럼 사용)
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS(
    SELECT 1 FROM profiles
    WHERE id = user_id AND role = 'admin'
  );
$$;

CREATE POLICY "Admins can view DLQ"
  ON webhook_dead_letter_queue FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update DLQ"
  ON webhook_dead_letter_queue FOR UPDATE
  USING (is_admin(auth.uid()));

-- ============================================
-- 완료
-- ============================================
COMMENT ON TABLE webhook_dead_letter_queue IS 'GPT V1: 실패한 웹훅 이벤트 Dead Letter Queue';
COMMENT ON FUNCTION schedule_webhook_retry IS 'GPT V1: 웹훅 재시도 스케줄링 (exponential backoff)';
COMMENT ON FUNCTION move_to_dead_letter_queue IS 'GPT V1: 최대 재시도 초과 시 DLQ 이동';
COMMENT ON FUNCTION get_pending_webhook_retries IS 'GPT V1: 재시도 대상 웹훅 조회';
