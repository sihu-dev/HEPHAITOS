// ============================================
// Safety Net v2 Policies
// GPT V1 피드백 P0-8: 섹션별 법률 준수 정책
// ============================================

export type SafetyAction = 'allow' | 'soften' | 'block'

export interface SafetyPolicy {
  id: string
  name: string
  pattern: RegExp
  action: SafetyAction
  reason: string
  softenTemplate?: string  // soften일 때 사용할 LLM 프롬프트 템플릿
}

// ============================================
// 공통 정책 (모든 섹션)
// ============================================

const COMMON_POLICIES: SafetyPolicy[] = [
  // BLOCK: 투자 조언 금지
  {
    id: 'INVESTMENT_ADVICE',
    name: '투자 조언 금지',
    pattern: /((이|그) (종목|주식|코인)을? (사세요|매수하세요|팔아?세요|매도하세요))|(반드시 (사|팔아?)야)/gi,
    action: 'block',
    reason: '직접적인 투자 조언은 법률 위반',
  },

  // SOFTEN: 수익 보장 표현
  {
    id: 'NO_GUARANTEE',
    name: '수익 보장 금지',
    pattern: /(반드시|확실히|무조건|100%|보장).{0,10}(수익|이익|벌|돈)/gi,
    action: 'soften',
    reason: '수익 보장 표현은 법률 위반',
    softenTemplate: '수익 보장 표현을 "과거 데이터 기반 가능성" 수준으로 완화',
  },

  // SOFTEN: 권유형 표현
  {
    id: 'NO_BUY_SELL_IMPERATIVE',
    name: '매매 권유 금지',
    pattern: /(지금|당장|빨리).{0,5}(사세요|팔아?세요|매수|매도|투자하세요)/gi,
    action: 'soften',
    reason: '매매 권유는 투자 조언에 해당',
    softenTemplate: '권유형 표현을 "~할 수 있습니다" 설명형으로 변경',
  },
]

// ============================================
// 섹션별 정책
// ============================================

const TITLE_POLICIES: SafetyPolicy[] = [
  ...COMMON_POLICIES,
  {
    id: 'TITLE_NO_EXTREME',
    name: '제목 극단적 표현 금지',
    pattern: /(대박|폭등|떡상|급등|10배|확실)/gi,
    action: 'soften',
    reason: '과장된 표현은 오해 유발',
    softenTemplate: '극단적 표현을 중립적 용어로 변경',
  },
]

const SUMMARY_POLICIES: SafetyPolicy[] = [
  ...COMMON_POLICIES,
  {
    id: 'SUMMARY_DISCLAIMER',
    name: '요약 면책조항',
    pattern: /.*/, // 모든 요약에 적용
    action: 'soften',
    reason: '요약에는 면책조항 필수',
    softenTemplate: '요약 끝에 "⚠️ 교육 목적, 투자 조언 아님" 추가',
  },
]

const RULES_POLICIES: SafetyPolicy[] = [
  ...COMMON_POLICIES,
  {
    id: 'RULES_EDUCATIONAL_ONLY',
    name: '규칙 교육적 표현',
    pattern: /(이렇게 하면|따라하면|하세요)/gi,
    action: 'soften',
    reason: '지시형 표현은 투자 조언으로 오해',
    softenTemplate: '"이런 조건에서 ~할 수 있습니다" 설명형으로 변경',
  },
]

const RISKS_POLICIES: SafetyPolicy[] = [
  // 리스크 섹션은 경고 강조가 목적이므로 완화 최소화
  {
    id: 'RISKS_MUST_EXIST',
    name: '리스크 필수 언급',
    pattern: /.*/,
    action: 'allow',
    reason: '리스크 설명은 필수',
  },
]

// ============================================
// 정책 맵
// ============================================

export const SAFETY_POLICIES: Record<string, SafetyPolicy[]> = {
  title: TITLE_POLICIES,
  summary: SUMMARY_POLICIES,
  rules: RULES_POLICIES,
  risks: RISKS_POLICIES,
  default: COMMON_POLICIES,
}

/**
 * 특정 섹션의 정책 가져오기
 */
export function getPoliciesForSection(section?: string): SafetyPolicy[] {
  if (!section) return SAFETY_POLICIES.default
  return SAFETY_POLICIES[section] || SAFETY_POLICIES.default
}
