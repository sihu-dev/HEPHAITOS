/**
 * Legal Compliance Module
 *
 * HEPHAITOS 법률 준수 시스템
 * - 투자 조언 금지 표현 필터링
 * - 자동 면책조항 추가
 * - 위험 요소 감지 및 경고
 *
 * Based on BUSINESS_CONSTITUTION.md
 */

// ============================================
// Types
// ============================================

export interface ValidationResult {
  safe: boolean
  warnings: string[]
  blockers: string[]
}

export interface DisclaimerOptions {
  type: 'response' | 'strategy' | 'report' | 'ui'
  includeRiskWarning?: boolean
}

// ============================================
// Forbidden Patterns (투자 조언 금지)
// ============================================

const FORBIDDEN_PATTERNS = [
  // 수익 보장 관련
  { pattern: /수익.*보장/gi, message: '수익 보장 표현은 법률상 금지됩니다' },
  { pattern: /확실.*수익/gi, message: '확실한 수익 표현은 법률상 금지됩니다' },
  { pattern: /100%.*성공/gi, message: '100% 성공 표현은 법률상 금지됩니다' },
  { pattern: /반드시.*오른다|반드시.*내린다/gi, message: '가격 예측 단언은 법률상 금지됩니다' },

  // 권유형 표현
  { pattern: /(사세요|팔세요|매수하세요|매도하세요)/gi, message: '투자 권유 표현은 법률상 금지됩니다' },
  { pattern: /추천.*종목/gi, message: '종목 추천은 법률상 금지됩니다' },
  { pattern: /지금.*사야/gi, message: '매매 타이밍 권유는 법률상 금지됩니다' },

  // 미래 예측
  { pattern: /내일.*오를|다음주.*상승/gi, message: '미래 가격 예측은 법률상 금지됩니다' },
  { pattern: /곧.*급등|곧.*폭락/gi, message: '단기 가격 예측은 법률상 금지됩니다' },
]

// ============================================
// High Risk Indicators
// ============================================

const HIGH_RISK_PATTERNS = [
  { pattern: /손절.*없|손절.*안/gi, message: '손절가 없는 전략은 고위험입니다. 손절가 설정을 권장합니다.' },
  { pattern: /레버리지.*10|10배.*레버리지/gi, message: '높은 레버리지(>10x)는 매우 위험합니다.' },
  { pattern: /올인|전재산/gi, message: '과도한 집중 투자는 위험합니다. 분산 투자를 권장합니다.' },
  { pattern: /단기.*수익/gi, message: '단기 투자는 변동성이 높아 위험합니다.' },
]

// ============================================
// Validation Functions
// ============================================

/**
 * 사용자 입력 또는 AI 응답에서 법률 위반 표현 검증
 */
export function validateStrategyPrompt(input: string): ValidationResult {
  const warnings: string[] = []
  const blockers: string[] = []

  // 금지된 표현 검사
  for (const { pattern, message } of FORBIDDEN_PATTERNS) {
    if (pattern.test(input)) {
      const match = input.match(pattern)?.[0]
      blockers.push(`${message}: "${match}"`)
    }
  }

  // 고위험 요소 검사
  for (const { pattern, message } of HIGH_RISK_PATTERNS) {
    if (pattern.test(input)) {
      warnings.push(message)
    }
  }

  return {
    safe: blockers.length === 0,
    warnings,
    blockers,
  }
}

/**
 * AI 응답 검증 (생성 후)
 */
export function validateAIResponse(response: string): ValidationResult {
  return validateStrategyPrompt(response)
}

// ============================================
// Disclaimer Generation
// ============================================

/**
 * 면책조항 생성 및 추가
 */
export function addDisclaimer(
  content: string,
  options: DisclaimerOptions = { type: 'response' }
): string {
  let disclaimer = ''

  switch (options.type) {
    case 'response':
      disclaimer = `

---
⚠️ **면책조항**: 본 서비스는 투자 교육 및 도구 제공 목적이며, 투자 조언이 아닙니다. 투자 결정은 본인 책임입니다.`
      break

    case 'strategy':
      disclaimer = `

---
⚠️ **투자 경고**
- 본 전략은 교육 목적으로만 제공됩니다
- 과거 성과는 미래 수익을 보장하지 않습니다
- 투자 손실에 대한 책임은 투자자 본인에게 있습니다
- 투자 결정 전 전문가와 상담하시기 바랍니다`
      break

    case 'report':
      disclaimer = `

---
**리포트 면책조항**

본 리포트는 투자 교육 및 정보 제공 목적으로만 작성되었으며, 특정 종목의 매수/매도를 권유하는 것이 아닙니다.
과거 데이터 분석 결과는 미래 수익을 보장하지 않으며, 모든 투자 결정과 그에 따른 손익은 투자자 본인의 책임입니다.`
      break

    case 'ui':
      disclaimer = '본 서비스는 투자 교육 및 도구 제공 목적이며, 투자 조언이 아닙니다.'
      break
  }

  if (options.includeRiskWarning) {
    disclaimer += `\n\n⚠️ **투자 위험 경고**: 모든 투자에는 원금 손실 위험이 있습니다.`
  }

  return content + disclaimer
}

// ============================================
// Safe Response Templates
// ============================================

/**
 * 안전한 응답 템플릿 (법률 준수)
 */
export const SAFE_RESPONSE_TEMPLATES = {
  // 가능성 설명 (허용)
  possibility: '~할 수 있습니다',
  explanation: '과거 데이터를 기준으로 분석하면',
  educational: '교육 목적으로만 제공됩니다',

  // 금지 표현 대체
  instead_of_buy: '매수 조건을 설정할 수 있습니다',
  instead_of_recommend: '다음 전략을 참고할 수 있습니다',
  instead_of_guarantee: '과거 성과는 미래를 보장하지 않습니다',
}

// ============================================
// Risk Assessment
// ============================================

export interface RiskAssessment {
  level: 'low' | 'medium' | 'high' | 'extreme'
  factors: string[]
  warnings: string[]
}

/**
 * 전략 리스크 평가
 */
export function assessStrategyRisk(strategy: {
  stopLoss?: number
  leverage?: number
  positionSize?: number
  indicators?: string[]
}): RiskAssessment {
  const factors: string[] = []
  const warnings: string[] = []
  let riskScore = 0

  // 손절가 미설정
  if (!strategy.stopLoss) {
    riskScore += 30
    factors.push('손절가 미설정')
    warnings.push('⚠️ 손절가를 설정하지 않으면 큰 손실이 발생할 수 있습니다')
  } else if (strategy.stopLoss > 10) {
    riskScore += 20
    factors.push('높은 손절 비율 (>10%)')
    warnings.push('⚠️ 손절가가 10%를 초과하면 고위험입니다')
  }

  // 레버리지
  if (strategy.leverage && strategy.leverage > 5) {
    riskScore += 25
    factors.push(`높은 레버리지 (${strategy.leverage}x)`)
    warnings.push('⚠️ 레버리지 5배 이상은 매우 위험합니다')
  }

  // 포지션 크기
  if (strategy.positionSize && strategy.positionSize > 20) {
    riskScore += 20
    factors.push('높은 포지션 크기 (>20%)')
    warnings.push('⚠️ 포트폴리오의 20% 이상을 단일 종목에 투자하면 위험합니다')
  }

  // 단일 지표 의존
  if (strategy.indicators && strategy.indicators.length === 1) {
    riskScore += 15
    factors.push('단일 지표 의존')
    warnings.push('⚠️ 단일 지표에만 의존하면 신뢰도가 낮습니다. 2개 이상 사용을 권장합니다.')
  }

  // 리스크 레벨 결정
  let level: RiskAssessment['level']
  if (riskScore >= 60) level = 'extreme'
  else if (riskScore >= 40) level = 'high'
  else if (riskScore >= 20) level = 'medium'
  else level = 'low'

  return { level, factors, warnings }
}

// ============================================
// Export All
// ============================================

export const LegalCompliance = {
  validateStrategyPrompt,
  validateAIResponse,
  addDisclaimer,
  assessStrategyRisk,
  SAFE_RESPONSE_TEMPLATES,
}

export default LegalCompliance
