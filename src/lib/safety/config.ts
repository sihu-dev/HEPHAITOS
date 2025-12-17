// ============================================
// Safety Net v2 Configuration
// Loop 13: 설정 가능한 안전 정책
// ============================================

export type SafetyStrictness = 'strict' | 'moderate' | 'lenient'

export interface SafetyConfig {
  strictness: SafetyStrictness
  enableLLMSoftening: boolean
  logAllEvents: boolean
  maxSoftenAttempts: number
  blockOnSoftenFailure: boolean
  addDisclaimerToAll: boolean
  customPolicies: string[]   // 활성화할 정책 ID 목록
  disabledPolicies: string[] // 비활성화할 정책 ID 목록
}

// 기본 설정
export const DEFAULT_SAFETY_CONFIG: SafetyConfig = {
  strictness: 'moderate',
  enableLLMSoftening: true,
  logAllEvents: false,
  maxSoftenAttempts: 3,
  blockOnSoftenFailure: false,
  addDisclaimerToAll: true,
  customPolicies: [],
  disabledPolicies: [],
}

// 엄격 모드 설정
export const STRICT_CONFIG: SafetyConfig = {
  strictness: 'strict',
  enableLLMSoftening: true,
  logAllEvents: true,
  maxSoftenAttempts: 1,
  blockOnSoftenFailure: true,
  addDisclaimerToAll: true,
  customPolicies: [],
  disabledPolicies: [],
}

// 관대 모드 설정 (베타 기간)
export const LENIENT_CONFIG: SafetyConfig = {
  strictness: 'lenient',
  enableLLMSoftening: false,
  logAllEvents: false,
  maxSoftenAttempts: 5,
  blockOnSoftenFailure: false,
  addDisclaimerToAll: false,
  customPolicies: [],
  disabledPolicies: ['SUMMARY_DISCLAIMER', 'TITLE_NO_EXTREME'],
}

// 정책별 엄격도 조정 매핑
export const STRICTNESS_MULTIPLIERS: Record<SafetyStrictness, number> = {
  strict: 1.0,   // 모든 정책 적용
  moderate: 0.7, // 70% 정책 적용
  lenient: 0.4,  // 40% 정책만 적용
}

// 정책 우선순위 (높을수록 우선)
export const POLICY_PRIORITY: Record<string, number> = {
  INVESTMENT_ADVICE: 100,      // 절대 금지
  NO_GUARANTEE: 80,           // 높은 우선순위
  NO_BUY_SELL_IMPERATIVE: 70,
  TITLE_NO_EXTREME: 50,
  RULES_EDUCATIONAL_ONLY: 40,
  SUMMARY_DISCLAIMER: 30,     // 낮은 우선순위
  RISKS_MUST_EXIST: 10,
}

/**
 * 현재 환경에 맞는 설정 가져오기
 */
export function getSafetyConfig(): SafetyConfig {
  const env = process.env.NODE_ENV
  const strictnessOverride = process.env.SAFETY_STRICTNESS as SafetyStrictness | undefined

  // 환경 변수 오버라이드
  if (strictnessOverride) {
    switch (strictnessOverride) {
      case 'strict':
        return STRICT_CONFIG
      case 'lenient':
        return LENIENT_CONFIG
      default:
        return DEFAULT_SAFETY_CONFIG
    }
  }

  // 환경별 기본값
  if (env === 'production') {
    return DEFAULT_SAFETY_CONFIG
  }

  // 개발/테스트 환경에서는 관대 모드
  return LENIENT_CONFIG
}

/**
 * 정책이 현재 설정에서 활성화되어 있는지 확인
 */
export function isPolicyEnabled(policyId: string, config: SafetyConfig): boolean {
  // 비활성화 목록에 있으면 false
  if (config.disabledPolicies.includes(policyId)) {
    return false
  }

  // 커스텀 목록이 있으면 그 목록에 있어야 true
  if (config.customPolicies.length > 0) {
    return config.customPolicies.includes(policyId)
  }

  // 우선순위 기반 필터링
  const priority = POLICY_PRIORITY[policyId] || 50
  const threshold = 100 * (1 - STRICTNESS_MULTIPLIERS[config.strictness])

  return priority >= threshold
}

/**
 * 설정 유효성 검사
 */
export function validateConfig(config: Partial<SafetyConfig>): SafetyConfig {
  return {
    ...DEFAULT_SAFETY_CONFIG,
    ...config,
    maxSoftenAttempts: Math.min(Math.max(config.maxSoftenAttempts || 3, 1), 10),
  }
}
