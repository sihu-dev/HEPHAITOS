-- ============================================
-- Status Page System
-- Loop 18: Status Page 구축
-- ============================================

-- 1) 서비스 정의 테이블
CREATE TABLE IF NOT EXISTS status_services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,  -- 'core', 'api', 'integration', 'infrastructure'
  is_critical BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 기본 서비스 정의
INSERT INTO status_services (id, name, description, category, is_critical, display_order) VALUES
  ('web_app', 'Web Application', '웹 애플리케이션', 'core', true, 1),
  ('auth', 'Authentication', '로그인/인증 서비스', 'core', true, 2),
  ('database', 'Database', '데이터베이스', 'infrastructure', true, 3),
  ('ai_api', 'AI Services', 'AI 전략 생성 및 분석', 'api', true, 4),
  ('payment', 'Payment Processing', '결제 처리', 'api', true, 5),
  ('broker_kis', 'KIS Broker', '한국투자증권 연동', 'integration', false, 6),
  ('broker_alpaca', 'Alpaca Broker', 'Alpaca 연동', 'integration', false, 7),
  ('data_unusual', 'Unusual Whales Data', '의원 거래 데이터', 'integration', false, 8),
  ('data_quiver', 'Quiver Data', '대안 데이터', 'integration', false, 9),
  ('notifications', 'Notifications', '알림 서비스', 'api', false, 10)
ON CONFLICT (id) DO NOTHING;

-- 2) 서비스 상태 테이블
CREATE TABLE IF NOT EXISTS status_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id TEXT NOT NULL REFERENCES status_services(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('operational', 'degraded', 'partial_outage', 'major_outage', 'maintenance')),
  latency_ms INTEGER,
  message TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_status_checks_service ON status_checks(service_id);
CREATE INDEX IF NOT EXISTS idx_status_checks_time ON status_checks(checked_at DESC);

-- 3) 인시던트 테이블
CREATE TABLE IF NOT EXISTS status_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('investigating', 'identified', 'monitoring', 'resolved')),
  impact TEXT NOT NULL CHECK (impact IN ('none', 'minor', 'major', 'critical')),
  affected_services TEXT[] DEFAULT '{}',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_incidents_status ON status_incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_started ON status_incidents(started_at DESC);

-- 4) 인시던트 업데이트 테이블
CREATE TABLE IF NOT EXISTS status_incident_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES status_incidents(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('investigating', 'identified', 'monitoring', 'resolved')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_incident_updates_incident ON status_incident_updates(incident_id);

-- 5) 예정된 유지보수 테이블
CREATE TABLE IF NOT EXISTS status_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  affected_services TEXT[] DEFAULT '{}',
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_scheduled ON status_maintenance(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON status_maintenance(status);

-- 6) 구독자 테이블 (상태 알림)
CREATE TABLE IF NOT EXISTS status_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  webhook_url TEXT,
  services TEXT[] DEFAULT '{}',  -- 빈 배열 = 모든 서비스
  notify_on TEXT[] DEFAULT ARRAY['major_outage', 'maintenance'],
  is_verified BOOLEAN DEFAULT false,
  verification_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(email)
);

-- 7) 현재 서비스 상태 뷰
CREATE OR REPLACE VIEW current_service_status AS
SELECT
  s.id as service_id,
  s.name,
  s.description,
  s.category,
  s.is_critical,
  s.display_order,
  COALESCE(
    (SELECT sc.status FROM status_checks sc
     WHERE sc.service_id = s.id
     ORDER BY sc.checked_at DESC LIMIT 1),
    'operational'
  ) as status,
  (SELECT sc.latency_ms FROM status_checks sc
   WHERE sc.service_id = s.id
   ORDER BY sc.checked_at DESC LIMIT 1) as latency_ms,
  (SELECT sc.checked_at FROM status_checks sc
   WHERE sc.service_id = s.id
   ORDER BY sc.checked_at DESC LIMIT 1) as last_checked
FROM status_services s
WHERE s.is_active = true
ORDER BY s.display_order;

-- 8) 서비스 상태 히스토리 (최근 24시간)
CREATE OR REPLACE VIEW service_status_history AS
SELECT
  service_id,
  DATE_TRUNC('hour', checked_at) as hour,
  MODE() WITHIN GROUP (ORDER BY status) as predominant_status,
  ROUND(AVG(latency_ms)) as avg_latency,
  COUNT(*) as check_count
FROM status_checks
WHERE checked_at >= NOW() - INTERVAL '24 hours'
GROUP BY service_id, DATE_TRUNC('hour', checked_at)
ORDER BY service_id, hour DESC;

-- 9) 전체 시스템 상태 계산 함수
CREATE OR REPLACE FUNCTION get_system_status()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_services JSONB;
  v_active_incidents JSONB;
  v_upcoming_maintenance JSONB;
  v_overall_status TEXT;
  v_critical_down INTEGER;
  v_degraded INTEGER;
BEGIN
  -- 서비스 상태
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', service_id,
      'name', name,
      'category', category,
      'status', status,
      'latency_ms', latency_ms,
      'is_critical', is_critical,
      'last_checked', last_checked
    ) ORDER BY display_order
  )
  INTO v_services
  FROM current_service_status;

  -- 활성 인시던트
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'title', title,
      'status', status,
      'impact', impact,
      'affected_services', affected_services,
      'started_at', started_at,
      'updates', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'status', u.status,
            'message', u.message,
            'created_at', u.created_at
          ) ORDER BY u.created_at DESC
        )
        FROM status_incident_updates u
        WHERE u.incident_id = i.id
      )
    ) ORDER BY started_at DESC
  )
  INTO v_active_incidents
  FROM status_incidents i
  WHERE i.status != 'resolved';

  -- 예정된 유지보수
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'title', title,
      'description', description,
      'affected_services', affected_services,
      'scheduled_start', scheduled_start,
      'scheduled_end', scheduled_end,
      'status', status
    ) ORDER BY scheduled_start
  )
  INTO v_upcoming_maintenance
  FROM status_maintenance
  WHERE status IN ('scheduled', 'in_progress')
    AND scheduled_end >= NOW();

  -- 전체 상태 계산
  SELECT
    COUNT(*) FILTER (WHERE status IN ('major_outage', 'partial_outage') AND is_critical),
    COUNT(*) FILTER (WHERE status = 'degraded')
  INTO v_critical_down, v_degraded
  FROM current_service_status;

  v_overall_status := CASE
    WHEN v_critical_down > 0 THEN 'major_outage'
    WHEN v_degraded > 0 THEN 'degraded'
    WHEN EXISTS (SELECT 1 FROM status_maintenance WHERE status = 'in_progress') THEN 'maintenance'
    ELSE 'operational'
  END;

  RETURN jsonb_build_object(
    'overall_status', v_overall_status,
    'services', COALESCE(v_services, '[]'),
    'active_incidents', COALESCE(v_active_incidents, '[]'),
    'upcoming_maintenance', COALESCE(v_upcoming_maintenance, '[]'),
    'last_updated', now()
  );
END;
$$;

-- 10) 서비스 상태 기록 함수
CREATE OR REPLACE FUNCTION record_service_status(
  p_service_id TEXT,
  p_status TEXT,
  p_latency_ms INTEGER DEFAULT NULL,
  p_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_check_id UUID;
  v_prev_status TEXT;
BEGIN
  -- 이전 상태 조회
  SELECT status INTO v_prev_status
  FROM status_checks
  WHERE service_id = p_service_id
  ORDER BY checked_at DESC
  LIMIT 1;

  -- 상태 기록
  INSERT INTO status_checks (service_id, status, latency_ms, message)
  VALUES (p_service_id, p_status, p_latency_ms, p_message)
  RETURNING id INTO v_check_id;

  -- 상태 변경 시 인시던트 자동 생성 (major_outage)
  IF p_status = 'major_outage' AND (v_prev_status IS NULL OR v_prev_status != 'major_outage') THEN
    INSERT INTO status_incidents (
      title, status, impact, affected_services
    ) VALUES (
      (SELECT name || ' 장애 발생' FROM status_services WHERE id = p_service_id),
      'investigating',
      'major',
      ARRAY[p_service_id]
    );
  END IF;

  RETURN v_check_id;
END;
$$;

-- 11) 인시던트 업데이트 함수
CREATE OR REPLACE FUNCTION update_incident(
  p_incident_id UUID,
  p_status TEXT,
  p_message TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_update_id UUID;
BEGIN
  -- 업데이트 추가
  INSERT INTO status_incident_updates (incident_id, status, message, created_by)
  VALUES (p_incident_id, p_status, p_message, p_user_id)
  RETURNING id INTO v_update_id;

  -- 인시던트 상태 업데이트
  UPDATE status_incidents
  SET
    status = p_status,
    resolved_at = CASE WHEN p_status = 'resolved' THEN NOW() ELSE resolved_at END,
    updated_at = NOW()
  WHERE id = p_incident_id;

  RETURN v_update_id;
END;
$$;

-- 12) Uptime 계산 함수
CREATE OR REPLACE FUNCTION calculate_uptime(
  p_service_id TEXT,
  p_days INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_checks INTEGER;
  v_operational_checks INTEGER;
  v_uptime_percent NUMERIC;
  v_daily_uptime JSONB;
BEGIN
  -- 전체 체크 수와 정상 체크 수
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'operational')
  INTO v_total_checks, v_operational_checks
  FROM status_checks
  WHERE service_id = p_service_id
    AND checked_at >= NOW() - (p_days || ' days')::INTERVAL;

  v_uptime_percent := CASE
    WHEN v_total_checks > 0 THEN ROUND(100.0 * v_operational_checks / v_total_checks, 2)
    ELSE 100
  END;

  -- 일별 uptime
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', day,
      'uptime', uptime_pct,
      'status', CASE
        WHEN uptime_pct >= 99.9 THEN 'operational'
        WHEN uptime_pct >= 99 THEN 'degraded'
        WHEN uptime_pct >= 95 THEN 'partial_outage'
        ELSE 'major_outage'
      END
    ) ORDER BY day
  )
  INTO v_daily_uptime
  FROM (
    SELECT
      DATE(checked_at) as day,
      ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'operational') / COUNT(*), 2) as uptime_pct
    FROM status_checks
    WHERE service_id = p_service_id
      AND checked_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY DATE(checked_at)
  ) t;

  RETURN jsonb_build_object(
    'service_id', p_service_id,
    'period_days', p_days,
    'uptime_percent', v_uptime_percent,
    'total_checks', v_total_checks,
    'operational_checks', v_operational_checks,
    'daily_uptime', COALESCE(v_daily_uptime, '[]')
  );
END;
$$;

-- 13) RLS 정책
ALTER TABLE status_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_incident_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_subscribers ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 상태 조회 가능
CREATE POLICY "Anyone can view services" ON status_services FOR SELECT USING (true);
CREATE POLICY "Anyone can view checks" ON status_checks FOR SELECT USING (true);
CREATE POLICY "Anyone can view incidents" ON status_incidents FOR SELECT USING (true);
CREATE POLICY "Anyone can view incident updates" ON status_incident_updates FOR SELECT USING (true);
CREATE POLICY "Anyone can view maintenance" ON status_maintenance FOR SELECT USING (true);

-- 관리자만 쓰기 가능
CREATE POLICY "Admins can manage services" ON status_services FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'));

CREATE POLICY "Admins can manage checks" ON status_checks FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'));

CREATE POLICY "Admins can manage incidents" ON status_incidents FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'));

CREATE POLICY "Admins can manage incident updates" ON status_incident_updates FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'));

CREATE POLICY "Admins can manage maintenance" ON status_maintenance FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'));

-- 구독자 관리
CREATE POLICY "Anyone can subscribe" ON status_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own subscription" ON status_subscribers FOR SELECT USING (true);

-- 14) 권한 부여
GRANT SELECT ON current_service_status TO anon, authenticated;
GRANT SELECT ON service_status_history TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_system_status TO anon, authenticated;
GRANT EXECUTE ON FUNCTION calculate_uptime TO anon, authenticated;
GRANT EXECUTE ON FUNCTION record_service_status TO authenticated;
GRANT EXECUTE ON FUNCTION update_incident TO authenticated;

-- 코멘트
COMMENT ON TABLE status_services IS '모니터링 대상 서비스 정의';
COMMENT ON TABLE status_checks IS '서비스 상태 체크 기록';
COMMENT ON TABLE status_incidents IS '인시던트 기록';
COMMENT ON TABLE status_maintenance IS '예정된 유지보수';
COMMENT ON FUNCTION get_system_status IS '전체 시스템 상태 조회';
COMMENT ON FUNCTION calculate_uptime IS '서비스 Uptime 계산';
