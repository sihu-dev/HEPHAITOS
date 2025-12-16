-- ============================================
-- GPT V1 피드백 P0-4: 컴플라이언스 테이블
-- 연령 게이트(만 19세) + 면책 동의 증적
-- 날짜: 2025-12-17
-- ============================================

-- ============================================
-- 1. 면책조항 버전 관리 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS disclaimer_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version VARCHAR(20) NOT NULL UNIQUE,  -- 'v1.0.0', 'v1.1.0', etc.
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,  -- 변경 요약
  effective_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  requires_re_consent BOOLEAN NOT NULL DEFAULT false,  -- 재동의 필요 여부
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 초기 면책조항 버전
INSERT INTO disclaimer_versions (version, title, content, summary, effective_date, is_active)
VALUES (
  'v1.0.0',
  'HEPHAITOS 서비스 이용 면책조항',
  '## 면책조항

본 서비스(HEPHAITOS)는 **투자 교육 및 도구 제공** 목적으로만 운영됩니다.

### 중요 고지사항

1. **투자 조언 아님**: 본 서비스에서 제공하는 모든 정보, AI 분석, 전략 추천은 투자 조언이 아닙니다.
2. **투자 결정 책임**: 모든 투자 결정은 이용자 본인의 판단과 책임 하에 이루어져야 합니다.
3. **과거 성과 주의**: 과거의 투자 성과가 미래의 수익을 보장하지 않습니다.
4. **손실 가능성**: 투자에는 원금 손실의 위험이 따릅니다.
5. **정보 정확성**: 제공되는 정보의 정확성, 완전성을 보장하지 않습니다.

### 법적 고지

- 본 서비스는 대한민국 법률에 따라 운영됩니다.
- 금융투자업 등록 없이 투자 자문/일임 서비스를 제공하지 않습니다.
- 이용자는 만 19세 이상이어야 합니다.

위 내용을 이해하고 동의합니다.',
  '초기 버전 - 기본 면책조항',
  CURRENT_DATE,
  true
)
ON CONFLICT (version) DO NOTHING;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_disclaimer_versions_active
  ON disclaimer_versions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_disclaimer_versions_effective
  ON disclaimer_versions(effective_date DESC);

-- ============================================
-- 2. 사용자 동의 기록 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS user_consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- 동의 유형
  consent_type VARCHAR(50) NOT NULL,  -- 'disclaimer', 'age_verification', 'marketing', 'data_processing'

  -- 면책조항 버전 (consent_type = 'disclaimer' 인 경우)
  disclaimer_version_id UUID REFERENCES disclaimer_versions(id),

  -- 연령 확인 (consent_type = 'age_verification' 인 경우)
  birth_date DATE,  -- 생년월일 (만 19세 확인용)
  age_verified BOOLEAN DEFAULT false,

  -- 동의 상세
  agreed BOOLEAN NOT NULL DEFAULT false,
  agreed_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,

  -- 동의 철회 (선택적)
  revoked_at TIMESTAMPTZ,
  revoke_reason TEXT,

  -- 메타데이터
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 복합 유니크: 사용자 + 동의유형 + 버전
  UNIQUE(user_id, consent_type, disclaimer_version_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_type ON user_consents(consent_type);
CREATE INDEX IF NOT EXISTS idx_user_consents_agreed ON user_consents(agreed) WHERE agreed = true;
CREATE INDEX IF NOT EXISTS idx_user_consents_user_type
  ON user_consents(user_id, consent_type) WHERE agreed = true AND revoked_at IS NULL;

-- ============================================
-- 3. RLS 정책
-- ============================================

-- disclaimer_versions: 누구나 활성 버전 조회 가능
ALTER TABLE disclaimer_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active disclaimers"
  ON disclaimer_versions FOR SELECT
  USING (is_active = true);

-- user_consents: 자신의 동의 기록만 조회/수정 가능
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consents"
  ON user_consents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consents"
  ON user_consents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own consents"
  ON user_consents FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- 4. 헬퍼 함수: 사용자 동의 상태 확인
-- ============================================
CREATE OR REPLACE FUNCTION check_user_consent(
  p_user_id UUID,
  p_consent_types TEXT[]  -- ['disclaimer', 'age_verification']
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB := '{}';
  v_consent_type TEXT;
  v_has_consent BOOLEAN;
  v_latest_disclaimer_id UUID;
BEGIN
  -- 최신 활성 면책조항 ID 조회
  SELECT id INTO v_latest_disclaimer_id
  FROM disclaimer_versions
  WHERE is_active = true
  ORDER BY effective_date DESC
  LIMIT 1;

  FOREACH v_consent_type IN ARRAY p_consent_types LOOP
    IF v_consent_type = 'disclaimer' THEN
      -- 최신 면책조항 동의 여부
      SELECT EXISTS(
        SELECT 1 FROM user_consents
        WHERE user_id = p_user_id
          AND consent_type = 'disclaimer'
          AND disclaimer_version_id = v_latest_disclaimer_id
          AND agreed = true
          AND revoked_at IS NULL
      ) INTO v_has_consent;
    ELSE
      -- 기타 동의 유형
      SELECT EXISTS(
        SELECT 1 FROM user_consents
        WHERE user_id = p_user_id
          AND consent_type = v_consent_type
          AND agreed = true
          AND revoked_at IS NULL
      ) INTO v_has_consent;
    END IF;

    v_result := v_result || jsonb_build_object(v_consent_type, v_has_consent);
  END LOOP;

  -- 전체 동의 여부
  v_result := v_result || jsonb_build_object(
    'all_consented', NOT (v_result ? 'false')
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION check_user_consent IS 'GPT V1 P0-4: 사용자 동의 상태 확인';

-- ============================================
-- 5. 헬퍼 함수: 동의 기록
-- ============================================
CREATE OR REPLACE FUNCTION record_user_consent(
  p_user_id UUID,
  p_consent_type VARCHAR(50),
  p_agreed BOOLEAN,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_birth_date DATE DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_disclaimer_id UUID;
  v_consent_id UUID;
  v_age_verified BOOLEAN := false;
BEGIN
  -- 면책조항 동의인 경우 최신 버전 ID 조회
  IF p_consent_type = 'disclaimer' THEN
    SELECT id INTO v_disclaimer_id
    FROM disclaimer_versions
    WHERE is_active = true
    ORDER BY effective_date DESC
    LIMIT 1;
  END IF;

  -- 연령 확인인 경우 만 19세 검증
  IF p_consent_type = 'age_verification' AND p_birth_date IS NOT NULL THEN
    v_age_verified := (EXTRACT(YEAR FROM AGE(CURRENT_DATE, p_birth_date)) >= 19);

    IF NOT v_age_verified THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'AGE_REQUIREMENT_NOT_MET',
        'message', '만 19세 이상만 이용 가능합니다.'
      );
    END IF;
  END IF;

  -- 기존 동의 업데이트 또는 새로 생성
  INSERT INTO user_consents (
    user_id,
    consent_type,
    disclaimer_version_id,
    birth_date,
    age_verified,
    agreed,
    agreed_at,
    ip_address,
    user_agent,
    metadata
  ) VALUES (
    p_user_id,
    p_consent_type,
    v_disclaimer_id,
    p_birth_date,
    v_age_verified,
    p_agreed,
    CASE WHEN p_agreed THEN NOW() ELSE NULL END,
    p_ip_address,
    p_user_agent,
    p_metadata
  )
  ON CONFLICT (user_id, consent_type, disclaimer_version_id)
  DO UPDATE SET
    agreed = p_agreed,
    agreed_at = CASE WHEN p_agreed THEN NOW() ELSE user_consents.agreed_at END,
    birth_date = COALESCE(p_birth_date, user_consents.birth_date),
    age_verified = COALESCE(v_age_verified, user_consents.age_verified),
    ip_address = COALESCE(p_ip_address, user_consents.ip_address),
    user_agent = COALESCE(p_user_agent, user_consents.user_agent),
    metadata = COALESCE(p_metadata, user_consents.metadata),
    updated_at = NOW()
  RETURNING id INTO v_consent_id;

  RETURN jsonb_build_object(
    'success', true,
    'consent_id', v_consent_id,
    'consent_type', p_consent_type,
    'agreed', p_agreed,
    'age_verified', v_age_verified
  );
END;
$$;

COMMENT ON FUNCTION record_user_consent IS 'GPT V1 P0-4: 사용자 동의 기록';

-- ============================================
-- 6. 트리거: updated_at 자동 업데이트
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_disclaimer_versions_updated_at ON disclaimer_versions;
CREATE TRIGGER update_disclaimer_versions_updated_at
  BEFORE UPDATE ON disclaimer_versions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_consents_updated_at ON user_consents;
CREATE TRIGGER update_user_consents_updated_at
  BEFORE UPDATE ON user_consents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 완료
-- ============================================
COMMENT ON TABLE disclaimer_versions IS 'GPT V1 P0-4: 면책조항 버전 관리';
COMMENT ON TABLE user_consents IS 'GPT V1 P0-4: 사용자 동의 기록 (연령 확인 + 면책 동의 증적)';
