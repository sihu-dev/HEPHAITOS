// ============================================
// Enhanced Content Softener v2
// Loop 13: 향상된 완화 로직
// ============================================

import type { SafetyPolicy } from './policies'
import { getSafetyConfig } from './config'
import { safeLogger } from '@/lib/utils/safe-logger'

export interface SoftenResult {
  original: string
  softened: string
  changes: string[]
  confidence: number  // 완화 품질 신뢰도 (0-1)
  method: 'rule' | 'llm' | 'hybrid'
}

// ============================================
// 향상된 규칙 기반 완화
// ============================================

interface ReplacementRule {
  pattern: RegExp
  replacement: string | ((match: string, ...groups: string[]) => string)
  description: string
  confidence: number
}

// 권유형 → 설명형 변환 규칙
const IMPERATIVE_TO_DESCRIPTIVE: ReplacementRule[] = [
  // 강한 권유
  { pattern: /반드시\s*(사|매수|팔아?|매도)세요/gi, replacement: '$1를 고려해볼 수 있습니다', description: '강한 권유 → 제안형', confidence: 0.9 },
  { pattern: /꼭\s*(사|매수|팔아?|매도)세요/gi, replacement: '$1를 검토해볼 수 있습니다', description: '권유 → 검토형', confidence: 0.9 },

  // 일반 권유
  { pattern: /(\S+)하세요/gi, replacement: '$1할 수 있습니다', description: '권유형 → 가능형', confidence: 0.95 },
  { pattern: /(\S+)세요/gi, replacement: '$1ㅂ시다', description: '권유형 → 제안형', confidence: 0.85 },

  // 지시형
  { pattern: /지금\s*(당장\s*)?(사|매수|팔아?|매도)/gi, replacement: '현재 시점에서 $2를 고려', description: '긴급 지시 → 시점 설명', confidence: 0.9 },
  { pattern: /빨리\s*(사|매수|팔아?|매도)/gi, replacement: '적시에 $1를 검토', description: '급박한 지시 → 검토 권장', confidence: 0.9 },
]

// 보장 → 가능성 변환 규칙
const GUARANTEE_TO_POSSIBILITY: ReplacementRule[] = [
  { pattern: /100%\s*(수익|이익|성공)/gi, replacement: '높은 $1 가능성', description: '100% 보장 → 높은 가능성', confidence: 0.95 },
  { pattern: /반드시\s*(수익|이익|벌)/gi, replacement: '과거 데이터 기반 $1 가능성', description: '반드시 → 과거 기반', confidence: 0.95 },
  { pattern: /확실(히|하게|한)\s*(수익|이익)/gi, replacement: '기대되는 $2', description: '확실 → 기대', confidence: 0.9 },
  { pattern: /무조건\s*(수익|이익|벌)/gi, replacement: '$1을 기대할 수 있는', description: '무조건 → 기대 가능', confidence: 0.9 },
  { pattern: /보장(된|되는|합니다)/gi, replacement: '예상$1', description: '보장 → 예상', confidence: 0.95 },
]

// 극단적 표현 → 중립 표현
const EXTREME_TO_NEUTRAL: ReplacementRule[] = [
  { pattern: /대박/gi, replacement: '높은 수익률', description: '대박 → 높은 수익률', confidence: 0.95 },
  { pattern: /폭등/gi, replacement: '큰 상승', description: '폭등 → 큰 상승', confidence: 0.95 },
  { pattern: /떡상/gi, replacement: '상승', description: '떡상 → 상승', confidence: 0.95 },
  { pattern: /급등/gi, replacement: '빠른 상승', description: '급등 → 빠른 상승', confidence: 0.95 },
  { pattern: /폭락/gi, replacement: '큰 하락', description: '폭락 → 큰 하락', confidence: 0.95 },
  { pattern: /떡락/gi, replacement: '하락', description: '떡락 → 하락', confidence: 0.95 },
  { pattern: /급락/gi, replacement: '빠른 하락', description: '급락 → 빠른 하락', confidence: 0.95 },
  { pattern: /10배|십배/gi, replacement: '높은 배율', description: '10배 → 높은 배율', confidence: 0.9 },
  { pattern: /100배|백배/gi, replacement: '매우 높은 배율', description: '100배 → 매우 높은 배율', confidence: 0.9 },
]

// 정책별 규칙 매핑
const POLICY_RULES: Record<string, ReplacementRule[]> = {
  NO_BUY_SELL_IMPERATIVE: IMPERATIVE_TO_DESCRIPTIVE,
  NO_GUARANTEE: GUARANTEE_TO_POSSIBILITY,
  TITLE_NO_EXTREME: EXTREME_TO_NEUTRAL,
  RULES_EDUCATIONAL_ONLY: IMPERATIVE_TO_DESCRIPTIVE,
}

// ============================================
// 완화 함수
// ============================================

/**
 * 규칙 기반 완화 (향상된 버전)
 */
export function ruleBasedSoftenV2(content: string, policy: SafetyPolicy): SoftenResult {
  let softened = content
  const changes: string[] = []
  let totalConfidence = 1.0
  let ruleCount = 0

  const rules = POLICY_RULES[policy.id] || []

  for (const rule of rules) {
    if (rule.pattern.test(softened)) {
      const before = softened
      softened = softened.replace(rule.pattern, rule.replacement as string)

      if (before !== softened) {
        changes.push(rule.description)
        totalConfidence *= rule.confidence
        ruleCount++
      }
    }
  }

  // 면책조항 추가 (SUMMARY)
  if (policy.id === 'SUMMARY_DISCLAIMER' && !content.includes('⚠️')) {
    softened += '\n\n⚠️ 이 정보는 교육 목적으로 제공되며, 투자 조언이 아닙니다. 모든 투자 결정은 본인의 판단과 책임하에 이루어져야 합니다.'
    changes.push('면책조항 추가')
    totalConfidence *= 0.95
    ruleCount++
  }

  return {
    original: content,
    softened,
    changes,
    confidence: ruleCount > 0 ? totalConfidence : 1.0,
    method: 'rule',
  }
}

/**
 * 하이브리드 완화 (규칙 + LLM)
 */
export async function hybridSoften(
  content: string,
  policy: SafetyPolicy,
  section?: string
): Promise<SoftenResult> {
  const config = getSafetyConfig()

  // 1단계: 규칙 기반 완화
  const ruleResult = ruleBasedSoftenV2(content, policy)

  // 규칙으로 충분히 완화되었으면 반환
  if (ruleResult.changes.length > 0 && ruleResult.confidence >= 0.8) {
    safeLogger.info('[Softener V2] Rule-based softening sufficient', {
      policy: policy.id,
      confidence: ruleResult.confidence,
    })
    return ruleResult
  }

  // LLM 비활성화면 규칙 결과 반환
  if (!config.enableLLMSoftening) {
    return ruleResult
  }

  // 2단계: LLM 완화 시도
  try {
    const llmResult = await llmBasedSoften(ruleResult.softened, policy, section)

    return {
      original: content,
      softened: llmResult.softened,
      changes: [...ruleResult.changes, ...llmResult.changes],
      confidence: ruleResult.confidence * llmResult.confidence,
      method: 'hybrid',
    }
  } catch (error) {
    safeLogger.warn('[Softener V2] LLM failed, using rule result', { error })
    return ruleResult
  }
}

/**
 * LLM 기반 완화
 */
async function llmBasedSoften(
  content: string,
  policy: SafetyPolicy,
  section?: string
): Promise<SoftenResult> {
  // 동적 import로 순환 의존성 방지
  const { createClaudeClient } = await import('@/lib/ai/claude-client')

  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY
  if (!apiKey) {
    throw new Error('API key not configured')
  }

  const systemPrompt = `당신은 금융 콘텐츠 법률 준수 전문가입니다.
주어진 텍스트에서 법률 위반 가능성이 있는 표현만 최소한으로 수정합니다.

수정 원칙:
1. 원본 의미를 최대한 보존
2. 자연스러운 한국어 유지
3. 법률 위반 표현만 수정 (과도한 수정 금지)
4. 투자 조언 → 정보 제공 형태로 변환

금지 표현:
- 직접적 매매 권유 ("사세요", "팔아세요")
- 수익 보장 ("반드시", "확실히", "100%")
- 과장된 표현 ("대박", "폭등", "떡상")`

  const userPrompt = `다음 텍스트를 검토하고 필요한 경우만 수정하세요.

섹션: ${section || '일반'}
정책: ${policy.name}
이유: ${policy.reason}

텍스트:
${content}

JSON으로 응답:
{"softened": "수정된 텍스트", "changes": ["변경1", "변경2"], "confidence": 0.9}`

  const client = createClaudeClient({ apiKey })
  const response = await client.chat(
    [{ role: 'user', content: userPrompt }],
    { systemPrompt, temperature: 0.2, maxTokens: 2000 }
  )

  const jsonMatch = response.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    const parsed = JSON.parse(jsonMatch[0])
    return {
      original: content,
      softened: parsed.softened || content,
      changes: parsed.changes || [],
      confidence: parsed.confidence || 0.8,
      method: 'llm',
    }
  }

  return {
    original: content,
    softened: content,
    changes: [],
    confidence: 0.5,
    method: 'llm',
  }
}

/**
 * 콘텐츠 완화 (메인 함수)
 */
export async function softenContentV2(request: {
  content: string
  policy: SafetyPolicy
  section?: string
}): Promise<SoftenResult> {
  const config = getSafetyConfig()
  let attempts = 0
  let result: SoftenResult = {
    original: request.content,
    softened: request.content,
    changes: [],
    confidence: 1.0,
    method: 'rule',
  }

  while (attempts < config.maxSoftenAttempts) {
    attempts++

    result = await hybridSoften(result.softened, request.policy, request.section)

    // 충분한 신뢰도면 종료
    if (result.confidence >= 0.85) {
      break
    }

    safeLogger.info('[Softener V2] Retrying soften', {
      attempt: attempts,
      confidence: result.confidence,
    })
  }

  return result
}
