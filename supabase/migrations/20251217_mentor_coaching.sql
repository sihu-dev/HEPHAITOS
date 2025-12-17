-- ============================================
-- Mentor Coaching System
-- Loop 21: 멘토 코칭 정식 런칭
-- ============================================

-- 1) 멘토 프로필 테이블
CREATE TABLE IF NOT EXISTS mentor_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),

  -- 기본 정보
  display_name TEXT NOT NULL,
  title TEXT NOT NULL,  -- '전 Goldman Sachs 트레이더', '10년차 퀀트'
  bio TEXT,
  avatar_url TEXT,
  video_intro_url TEXT,  -- 소개 영상

  -- 전문 분야
  specialties TEXT[] DEFAULT '{}',  -- ['주식', '옵션', '암호화폐', '퀀트']
  experience_years INTEGER,
  certifications TEXT[],  -- ['CFA', 'FRM', '투자자문사']

  -- 코칭 설정
  hourly_rate_credits INTEGER NOT NULL DEFAULT 100,
  session_duration INTEGER NOT NULL DEFAULT 60,  -- 분
  max_sessions_per_day INTEGER DEFAULT 8,
  timezone TEXT DEFAULT 'Asia/Seoul',

  -- 가용성
  available_days TEXT[] DEFAULT ARRAY['mon', 'tue', 'wed', 'thu', 'fri'],
  available_hours_start INTEGER DEFAULT 9,  -- 24시간 형식
  available_hours_end INTEGER DEFAULT 18,

  -- 검증 상태
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verified_at TIMESTAMPTZ,
  verification_docs TEXT[],  -- 자격증 등 확인 서류

  -- 통계
  total_sessions INTEGER DEFAULT 0,
  total_students INTEGER DEFAULT 0,
  total_hours INTEGER DEFAULT 0,
  rating_avg NUMERIC(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  revenue_total INTEGER DEFAULT 0,

  -- 상태
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mentor_active ON mentor_profiles(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_mentor_featured ON mentor_profiles(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_mentor_rating ON mentor_profiles(rating_avg DESC);

-- 2) 멘토 가용 슬롯 테이블
CREATE TABLE IF NOT EXISTS mentor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES mentor_profiles(user_id),

  -- 슬롯 정보
  slot_date DATE NOT NULL,
  slot_start TIME NOT NULL,
  slot_end TIME NOT NULL,

  -- 상태
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'booked', 'blocked')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(mentor_id, slot_date, slot_start)
);

CREATE INDEX IF NOT EXISTS idx_availability_mentor ON mentor_availability(mentor_id);
CREATE INDEX IF NOT EXISTS idx_availability_date ON mentor_availability(slot_date);
CREATE INDEX IF NOT EXISTS idx_availability_status ON mentor_availability(status);

-- 3) 코칭 세션 예약 테이블
CREATE TABLE IF NOT EXISTS coaching_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 참여자
  mentor_id UUID NOT NULL REFERENCES mentor_profiles(user_id),
  student_id UUID NOT NULL REFERENCES auth.users(id),

  -- 슬롯 정보
  availability_id UUID REFERENCES mentor_availability(id),
  scheduled_date DATE NOT NULL,
  scheduled_start TIME NOT NULL,
  scheduled_end TIME NOT NULL,
  timezone TEXT DEFAULT 'Asia/Seoul',

  -- 세션 정보
  session_type TEXT NOT NULL DEFAULT 'one_on_one' CHECK (session_type IN ('one_on_one', 'group', 'review', 'strategy')),
  topic TEXT,
  student_questions TEXT,  -- 학생이 미리 준비한 질문

  -- 결제
  credits_paid INTEGER NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),

  -- 화상 미팅
  meeting_url TEXT,
  meeting_provider TEXT DEFAULT 'zoom',  -- 'zoom', 'google_meet', 'teams'
  meeting_id TEXT,

  -- 세션 상태
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),

  -- 시간 추적
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  actual_duration INTEGER,  -- 분

  -- 취소 정보
  cancelled_by UUID,
  cancellation_reason TEXT,
  refund_amount INTEGER,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_mentor ON coaching_sessions(mentor_id);
CREATE INDEX IF NOT EXISTS idx_sessions_student ON coaching_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON coaching_sessions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON coaching_sessions(status);

-- 4) 세션 노트 테이블
CREATE TABLE IF NOT EXISTS session_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES coaching_sessions(id),
  author_id UUID NOT NULL REFERENCES auth.users(id),

  -- 노트 내용
  content TEXT NOT NULL,
  is_private BOOLEAN DEFAULT false,  -- 멘토 전용 노트

  -- 첨부 파일
  attachments JSONB DEFAULT '[]',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notes_session ON session_notes(session_id);

-- 5) 코칭 리뷰 테이블
CREATE TABLE IF NOT EXISTS coaching_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES coaching_sessions(id) UNIQUE,
  mentor_id UUID NOT NULL REFERENCES mentor_profiles(user_id),
  student_id UUID NOT NULL REFERENCES auth.users(id),

  -- 평점 (1-5)
  rating_overall INTEGER NOT NULL CHECK (rating_overall >= 1 AND rating_overall <= 5),
  rating_knowledge INTEGER CHECK (rating_knowledge >= 1 AND rating_knowledge <= 5),
  rating_communication INTEGER CHECK (rating_communication >= 1 AND rating_communication <= 5),
  rating_helpfulness INTEGER CHECK (rating_helpfulness >= 1 AND rating_helpfulness <= 5),

  -- 리뷰 내용
  comment TEXT,
  highlights TEXT[],  -- ['실전 경험', '명확한 설명', '맞춤 조언']

  -- 공개 여부
  is_public BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_mentor ON coaching_reviews(mentor_id);
CREATE INDEX IF NOT EXISTS idx_reviews_student ON coaching_reviews(student_id);

-- 6) 멘토 수익 테이블
CREATE TABLE IF NOT EXISTS mentor_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES mentor_profiles(user_id),
  session_id UUID REFERENCES coaching_sessions(id),

  -- 수익 정보
  gross_credits INTEGER NOT NULL,
  platform_fee_credits INTEGER NOT NULL,  -- 20%
  net_credits INTEGER NOT NULL,  -- 80%

  -- 상태
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'available', 'withdrawn')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  available_at TIMESTAMPTZ,  -- 정산 가능 시점 (7일 후)
  withdrawn_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_earnings_mentor ON mentor_earnings(mentor_id);
CREATE INDEX IF NOT EXISTS idx_earnings_status ON mentor_earnings(status);

-- 7) 세션 예약 함수
CREATE OR REPLACE FUNCTION book_coaching_session(
  p_student_id UUID,
  p_mentor_id UUID,
  p_availability_id UUID,
  p_topic TEXT DEFAULT NULL,
  p_questions TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mentor mentor_profiles%ROWTYPE;
  v_slot mentor_availability%ROWTYPE;
  v_student_credits INTEGER;
  v_session_id UUID;
  v_meeting_url TEXT;
BEGIN
  -- 멘토 조회
  SELECT * INTO v_mentor FROM mentor_profiles WHERE user_id = p_mentor_id;

  IF v_mentor.user_id IS NULL OR NOT v_mentor.is_active THEN
    RETURN jsonb_build_object('success', false, 'error', 'Mentor not available');
  END IF;

  -- 슬롯 조회
  SELECT * INTO v_slot FROM mentor_availability
  WHERE id = p_availability_id AND mentor_id = p_mentor_id;

  IF v_slot.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Slot not found');
  END IF;

  IF v_slot.status != 'available' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Slot not available');
  END IF;

  -- 과거 슬롯 체크
  IF v_slot.slot_date < CURRENT_DATE THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot book past slots');
  END IF;

  -- 학생 크레딧 확인
  SELECT credits INTO v_student_credits FROM user_credits WHERE user_id = p_student_id;

  IF v_student_credits IS NULL OR v_student_credits < v_mentor.hourly_rate_credits THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient credits');
  END IF;

  -- 크레딧 차감
  UPDATE user_credits SET credits = credits - v_mentor.hourly_rate_credits WHERE user_id = p_student_id;

  -- 크레딧 이력
  INSERT INTO credit_history (user_id, amount, type, description, reference_id)
  VALUES (p_student_id, -v_mentor.hourly_rate_credits, 'coaching_session',
          'Coaching with ' || v_mentor.display_name, p_availability_id);

  -- 미팅 URL 생성 (실제로는 Zoom API 등 사용)
  v_meeting_url := 'https://meet.hephaitos.com/' || gen_random_uuid();

  -- 세션 생성
  INSERT INTO coaching_sessions (
    mentor_id, student_id, availability_id,
    scheduled_date, scheduled_start, scheduled_end,
    topic, student_questions, credits_paid,
    meeting_url, status, payment_status
  ) VALUES (
    p_mentor_id, p_student_id, p_availability_id,
    v_slot.slot_date, v_slot.slot_start, v_slot.slot_end,
    p_topic, p_questions, v_mentor.hourly_rate_credits,
    v_meeting_url, 'confirmed', 'paid'
  ) RETURNING id INTO v_session_id;

  -- 슬롯 상태 업데이트
  UPDATE mentor_availability SET status = 'booked' WHERE id = p_availability_id;

  -- 멘토 통계 업데이트
  UPDATE mentor_profiles SET
    total_sessions = total_sessions + 1,
    updated_at = now()
  WHERE user_id = p_mentor_id;

  RETURN jsonb_build_object(
    'success', true,
    'session_id', v_session_id,
    'meeting_url', v_meeting_url,
    'scheduled_date', v_slot.slot_date,
    'scheduled_start', v_slot.slot_start,
    'credits_paid', v_mentor.hourly_rate_credits
  );
END;
$$;

-- 8) 세션 완료 함수
CREATE OR REPLACE FUNCTION complete_coaching_session(
  p_session_id UUID,
  p_actual_duration INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session coaching_sessions%ROWTYPE;
  v_mentor_share INTEGER;
  v_platform_share INTEGER;
BEGIN
  -- 세션 조회
  SELECT * INTO v_session FROM coaching_sessions WHERE id = p_session_id;

  IF v_session.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Session not found');
  END IF;

  IF v_session.status NOT IN ('confirmed', 'in_progress') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid session status');
  END IF;

  -- 세션 완료 처리
  UPDATE coaching_sessions SET
    status = 'completed',
    actual_end = now(),
    actual_duration = COALESCE(p_actual_duration, EXTRACT(EPOCH FROM (now() - actual_start)) / 60),
    updated_at = now()
  WHERE id = p_session_id;

  -- 멘토 수익 계산 (80/20)
  v_mentor_share := FLOOR(v_session.credits_paid * 0.8);
  v_platform_share := v_session.credits_paid - v_mentor_share;

  -- 멘토 수익 기록
  INSERT INTO mentor_earnings (
    mentor_id, session_id,
    gross_credits, platform_fee_credits, net_credits,
    status, available_at
  ) VALUES (
    v_session.mentor_id, p_session_id,
    v_session.credits_paid, v_platform_share, v_mentor_share,
    'pending', now() + INTERVAL '7 days'
  );

  -- 멘토 통계 업데이트
  UPDATE mentor_profiles SET
    total_hours = total_hours + COALESCE(p_actual_duration, 60) / 60,
    revenue_total = revenue_total + v_mentor_share,
    updated_at = now()
  WHERE user_id = v_session.mentor_id;

  -- 학생 수 업데이트 (처음 수강한 학생인 경우)
  IF NOT EXISTS (
    SELECT 1 FROM coaching_sessions
    WHERE mentor_id = v_session.mentor_id
    AND student_id = v_session.student_id
    AND id != p_session_id
    AND status = 'completed'
  ) THEN
    UPDATE mentor_profiles SET total_students = total_students + 1
    WHERE user_id = v_session.mentor_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'session_id', p_session_id,
    'mentor_earnings', v_mentor_share
  );
END;
$$;

-- 9) 세션 취소 함수
CREATE OR REPLACE FUNCTION cancel_coaching_session(
  p_session_id UUID,
  p_cancelled_by UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session coaching_sessions%ROWTYPE;
  v_refund_amount INTEGER;
  v_hours_until_session NUMERIC;
BEGIN
  -- 세션 조회
  SELECT * INTO v_session FROM coaching_sessions WHERE id = p_session_id;

  IF v_session.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Session not found');
  END IF;

  IF v_session.status NOT IN ('scheduled', 'confirmed') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot cancel this session');
  END IF;

  -- 취소자 확인
  IF p_cancelled_by != v_session.student_id AND p_cancelled_by != v_session.mentor_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  -- 환불 계산 (24시간 전: 100%, 12시간 전: 50%, 이후: 0%)
  v_hours_until_session := EXTRACT(EPOCH FROM (
    (v_session.scheduled_date + v_session.scheduled_start) - now()
  )) / 3600;

  IF p_cancelled_by = v_session.mentor_id THEN
    -- 멘토 취소: 항상 100% 환불
    v_refund_amount := v_session.credits_paid;
  ELSIF v_hours_until_session >= 24 THEN
    v_refund_amount := v_session.credits_paid;
  ELSIF v_hours_until_session >= 12 THEN
    v_refund_amount := FLOOR(v_session.credits_paid * 0.5);
  ELSE
    v_refund_amount := 0;
  END IF;

  -- 세션 취소
  UPDATE coaching_sessions SET
    status = 'cancelled',
    cancelled_by = p_cancelled_by,
    cancellation_reason = p_reason,
    refund_amount = v_refund_amount,
    payment_status = CASE WHEN v_refund_amount > 0 THEN 'refunded' ELSE 'paid' END,
    updated_at = now()
  WHERE id = p_session_id;

  -- 슬롯 복구
  IF v_session.availability_id IS NOT NULL THEN
    UPDATE mentor_availability SET status = 'available' WHERE id = v_session.availability_id;
  END IF;

  -- 환불 처리
  IF v_refund_amount > 0 THEN
    UPDATE user_credits SET credits = credits + v_refund_amount WHERE user_id = v_session.student_id;

    INSERT INTO credit_history (user_id, amount, type, description, reference_id)
    VALUES (v_session.student_id, v_refund_amount, 'coaching_refund',
            'Session cancellation refund', p_session_id);
  END IF;

  -- 멘토 세션 수 감소
  UPDATE mentor_profiles SET
    total_sessions = GREATEST(0, total_sessions - 1),
    updated_at = now()
  WHERE user_id = v_session.mentor_id;

  RETURN jsonb_build_object(
    'success', true,
    'session_id', p_session_id,
    'refund_amount', v_refund_amount,
    'cancelled_by', CASE WHEN p_cancelled_by = v_session.mentor_id THEN 'mentor' ELSE 'student' END
  );
END;
$$;

-- 10) 리뷰 작성 함수
CREATE OR REPLACE FUNCTION create_coaching_review(
  p_session_id UUID,
  p_student_id UUID,
  p_rating_overall INTEGER,
  p_rating_knowledge INTEGER DEFAULT NULL,
  p_rating_communication INTEGER DEFAULT NULL,
  p_rating_helpfulness INTEGER DEFAULT NULL,
  p_comment TEXT DEFAULT NULL,
  p_highlights TEXT[] DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session coaching_sessions%ROWTYPE;
  v_review_id UUID;
  v_new_avg NUMERIC(3,2);
  v_new_count INTEGER;
BEGIN
  -- 세션 조회
  SELECT * INTO v_session FROM coaching_sessions WHERE id = p_session_id;

  IF v_session.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Session not found');
  END IF;

  IF v_session.student_id != p_student_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  IF v_session.status != 'completed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Session not completed');
  END IF;

  -- 이미 리뷰했는지 확인
  IF EXISTS (SELECT 1 FROM coaching_reviews WHERE session_id = p_session_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already reviewed');
  END IF;

  -- 리뷰 생성
  INSERT INTO coaching_reviews (
    session_id, mentor_id, student_id,
    rating_overall, rating_knowledge, rating_communication, rating_helpfulness,
    comment, highlights
  ) VALUES (
    p_session_id, v_session.mentor_id, p_student_id,
    p_rating_overall, p_rating_knowledge, p_rating_communication, p_rating_helpfulness,
    p_comment, p_highlights
  ) RETURNING id INTO v_review_id;

  -- 멘토 평점 업데이트
  SELECT AVG(rating_overall)::NUMERIC(3,2), COUNT(*) INTO v_new_avg, v_new_count
  FROM coaching_reviews WHERE mentor_id = v_session.mentor_id;

  UPDATE mentor_profiles SET
    rating_avg = v_new_avg,
    rating_count = v_new_count,
    updated_at = now()
  WHERE user_id = v_session.mentor_id;

  RETURN jsonb_build_object(
    'success', true,
    'review_id', v_review_id
  );
END;
$$;

-- 11) 멘토 가용 슬롯 생성 함수
CREATE OR REPLACE FUNCTION generate_mentor_availability(
  p_mentor_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mentor mentor_profiles%ROWTYPE;
  v_current_date DATE;
  v_day_name TEXT;
  v_slot_time TIME;
  v_slots_created INTEGER := 0;
BEGIN
  -- 멘토 조회
  SELECT * INTO v_mentor FROM mentor_profiles WHERE user_id = p_mentor_id;

  IF v_mentor.user_id IS NULL THEN
    RETURN 0;
  END IF;

  -- 날짜별로 슬롯 생성
  v_current_date := p_start_date;
  WHILE v_current_date <= p_end_date LOOP
    v_day_name := LOWER(TO_CHAR(v_current_date, 'dy'));

    -- 해당 요일이 가용 요일인 경우
    IF v_day_name = ANY(v_mentor.available_days) THEN
      v_slot_time := (v_mentor.available_hours_start || ':00')::TIME;

      WHILE v_slot_time < (v_mentor.available_hours_end || ':00')::TIME LOOP
        -- 기존 슬롯이 없으면 생성
        INSERT INTO mentor_availability (mentor_id, slot_date, slot_start, slot_end, status)
        VALUES (
          p_mentor_id, v_current_date, v_slot_time,
          v_slot_time + (v_mentor.session_duration || ' minutes')::INTERVAL,
          'available'
        )
        ON CONFLICT (mentor_id, slot_date, slot_start) DO NOTHING;

        IF FOUND THEN
          v_slots_created := v_slots_created + 1;
        END IF;

        v_slot_time := v_slot_time + (v_mentor.session_duration || ' minutes')::INTERVAL;
      END LOOP;
    END IF;

    v_current_date := v_current_date + 1;
  END LOOP;

  RETURN v_slots_created;
END;
$$;

-- 12) 인기 멘토 조회 함수
CREATE OR REPLACE FUNCTION get_popular_mentors(
  p_specialty TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  title TEXT,
  bio TEXT,
  avatar_url TEXT,
  specialties TEXT[],
  experience_years INTEGER,
  hourly_rate_credits INTEGER,
  session_duration INTEGER,
  total_sessions INTEGER,
  total_students INTEGER,
  rating_avg NUMERIC,
  rating_count INTEGER,
  is_featured BOOLEAN,
  verification_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    mp.user_id,
    mp.display_name,
    mp.title,
    mp.bio,
    mp.avatar_url,
    mp.specialties,
    mp.experience_years,
    mp.hourly_rate_credits,
    mp.session_duration,
    mp.total_sessions,
    mp.total_students,
    mp.rating_avg,
    mp.rating_count,
    mp.is_featured,
    mp.verification_status
  FROM mentor_profiles mp
  WHERE mp.is_active = true
    AND mp.verification_status = 'verified'
    AND (p_specialty IS NULL OR p_specialty = ANY(mp.specialties))
  ORDER BY
    mp.is_featured DESC,
    mp.rating_avg DESC,
    mp.total_sessions DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- 13) 멘토 대시보드 뷰
CREATE OR REPLACE VIEW mentor_dashboard_stats AS
SELECT
  mp.user_id as mentor_id,
  mp.display_name,
  mp.total_sessions,
  mp.total_students,
  mp.total_hours,
  mp.rating_avg,
  mp.revenue_total,
  -- 이번 주 세션
  (SELECT COUNT(*) FROM coaching_sessions cs
   WHERE cs.mentor_id = mp.user_id
   AND cs.scheduled_date >= DATE_TRUNC('week', CURRENT_DATE)
   AND cs.status IN ('scheduled', 'confirmed')) as sessions_this_week,
  -- 이번 달 수익
  (SELECT COALESCE(SUM(net_credits), 0) FROM mentor_earnings me
   WHERE me.mentor_id = mp.user_id
   AND me.created_at >= DATE_TRUNC('month', CURRENT_DATE)) as earnings_this_month,
  -- 미정산 수익
  (SELECT COALESCE(SUM(net_credits), 0) FROM mentor_earnings me
   WHERE me.mentor_id = mp.user_id
   AND me.status = 'pending') as pending_earnings,
  -- 정산 가능 수익
  (SELECT COALESCE(SUM(net_credits), 0) FROM mentor_earnings me
   WHERE me.mentor_id = mp.user_id
   AND me.status = 'available') as available_earnings
FROM mentor_profiles mp
WHERE mp.is_active = true;

-- 14) 플랫폼 코칭 통계 뷰
CREATE OR REPLACE VIEW coaching_platform_stats AS
SELECT
  COUNT(DISTINCT mp.user_id) as total_mentors,
  COUNT(DISTINCT mp.user_id) FILTER (WHERE mp.verification_status = 'verified') as verified_mentors,
  (SELECT COUNT(*) FROM coaching_sessions WHERE status = 'completed') as total_sessions_completed,
  (SELECT COUNT(DISTINCT student_id) FROM coaching_sessions WHERE status = 'completed') as total_students,
  (SELECT COALESCE(SUM(credits_paid), 0) FROM coaching_sessions WHERE status = 'completed') as total_revenue,
  (SELECT AVG(rating_overall) FROM coaching_reviews)::NUMERIC(3,2) as avg_rating,
  (SELECT COUNT(*) FROM coaching_sessions WHERE scheduled_date = CURRENT_DATE AND status IN ('scheduled', 'confirmed')) as sessions_today
FROM mentor_profiles mp;

-- 15) RLS 정책
ALTER TABLE mentor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_earnings ENABLE ROW LEVEL SECURITY;

-- 멘토 프로필: 활성 멘토 조회 가능, 본인만 수정
CREATE POLICY "Anyone can view active mentors" ON mentor_profiles
  FOR SELECT USING (is_active = true AND verification_status = 'verified');
CREATE POLICY "Mentors can manage own profile" ON mentor_profiles
  FOR ALL TO authenticated USING (user_id = auth.uid());

-- 가용 슬롯: 공개 조회
CREATE POLICY "Anyone can view availability" ON mentor_availability FOR SELECT USING (true);
CREATE POLICY "Mentors can manage own availability" ON mentor_availability
  FOR ALL TO authenticated USING (mentor_id = auth.uid());

-- 세션: 본인 관련만 조회
CREATE POLICY "Users can view own sessions" ON coaching_sessions
  FOR SELECT TO authenticated USING (mentor_id = auth.uid() OR student_id = auth.uid());

-- 노트: 세션 참여자만
CREATE POLICY "Session participants can view notes" ON session_notes
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM coaching_sessions cs
      WHERE cs.id = session_notes.session_id
      AND (cs.mentor_id = auth.uid() OR cs.student_id = auth.uid())
    )
  );
CREATE POLICY "Session participants can add notes" ON session_notes
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM coaching_sessions cs
      WHERE cs.id = session_notes.session_id
      AND (cs.mentor_id = auth.uid() OR cs.student_id = auth.uid())
    )
  );

-- 리뷰: 공개 조회
CREATE POLICY "Anyone can view public reviews" ON coaching_reviews
  FOR SELECT USING (is_public = true);
CREATE POLICY "Students can create reviews" ON coaching_reviews
  FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());

-- 수익: 본인만 조회
CREATE POLICY "Mentors can view own earnings" ON mentor_earnings
  FOR SELECT TO authenticated USING (mentor_id = auth.uid());

-- 16) 권한 부여
GRANT SELECT ON mentor_dashboard_stats TO authenticated;
GRANT SELECT ON coaching_platform_stats TO authenticated;
GRANT EXECUTE ON FUNCTION book_coaching_session TO authenticated;
GRANT EXECUTE ON FUNCTION complete_coaching_session TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_coaching_session TO authenticated;
GRANT EXECUTE ON FUNCTION create_coaching_review TO authenticated;
GRANT EXECUTE ON FUNCTION generate_mentor_availability TO authenticated;
GRANT EXECUTE ON FUNCTION get_popular_mentors TO authenticated;

-- 코멘트
COMMENT ON TABLE mentor_profiles IS '멘토 프로필';
COMMENT ON TABLE mentor_availability IS '멘토 가용 슬롯';
COMMENT ON TABLE coaching_sessions IS '코칭 세션';
COMMENT ON TABLE coaching_reviews IS '코칭 리뷰';
COMMENT ON TABLE mentor_earnings IS '멘토 수익';
COMMENT ON FUNCTION book_coaching_session IS '코칭 세션 예약';
COMMENT ON FUNCTION complete_coaching_session IS '세션 완료 처리';
COMMENT ON FUNCTION cancel_coaching_session IS '세션 취소 및 환불';
