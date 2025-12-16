-- ============================================
-- Strategies 테이블 확장
-- prompt 컬럼 및 추가 필드 추가
-- ============================================

-- strategies 테이블에 prompt 컬럼 추가
ALTER TABLE strategies
  ADD COLUMN IF NOT EXISTS prompt TEXT,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS copy_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS original_strategy_id UUID REFERENCES strategies(id);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_strategies_is_public ON strategies(is_public) WHERE is_public = true;

-- 코멘트
COMMENT ON COLUMN strategies.prompt IS '자연어 프롬프트 (AI 전략 생성 시 사용)';
COMMENT ON COLUMN strategies.is_public IS '공개 여부 (마켓플레이스 노출)';
COMMENT ON COLUMN strategies.copy_count IS '복사된 횟수';
COMMENT ON COLUMN strategies.original_strategy_id IS '원본 전략 ID (복사된 경우)';
