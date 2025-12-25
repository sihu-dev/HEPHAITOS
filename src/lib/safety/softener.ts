// ============================================
// Safety Content Softener
// GPT V1 피드백 P0-8: LLM 기반 콘텐츠 완화
// ============================================

import { createClaudeClient } from '@/lib/ai/claude-client'
import type { SafetyPolicy } from './policies'
import { safeLogger } from '@/lib/utils/safe-logger';

interface SoftenRequest {
  content: string
  policy: SafetyPolicy
  section?: string
}

export interface SoftenResult {
  original: string
  softened: string
  changes: string[]
}

/**
 * LLM 기반 콘텐츠 완화
 * 법률 위반 가능성이 있는 표현을 교육적 표현으로 변환
 */
export async function softenContent(request: SoftenRequest): Promise<SoftenResult> {
  const { content, policy, section } = request

  const systemPrompt = `당신은 법률 준수 전문가입니다.
투자 관련 콘텐츠를 검토하여 법률 위반 가능성이 있는 표현을 교육적 표현으로 완화합니다.

**금지 사항**:
- 투자 조언 ("~하세요", "사세요", "팔아세요")
- 수익 보장 ("반드시", "확실히", "100%")
- 매매 권유 ("지금 사라", "당장 매도")

**변환 규칙**:
- "~하세요" → "~할 수 있습니다"
- "반드시 수익" → "과거 데이터 기반 가능성"
- "지금 사세요" → "이런 조건에서 매수를 고려할 수 있습니다"

**중요**: 의미는 유지하되 법률 위반 표현만 제거하세요.`

  const userPrompt = `다음 텍스트를 법률 준수 관점에서 완화해주세요.

**섹션**: ${section || '일반'}
**위반 정책**: ${policy.name}
**위반 이유**: ${policy.reason}
**완화 지침**: ${policy.softenTemplate || '법률 위반 표현을 교육적 표현으로 변경'}

**원본 텍스트**:
${content}

**응답 형식** (JSON):
{
  "softened": "완화된 텍스트",
  "changes": ["변경1: 원본 → 수정", "변경2: 원본 → 수정"]
}`

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY
    if (!apiKey) {
      // Fallback: 간단한 규칙 기반 완화
      return ruleBasedSoften(content, policy)
    }

    const client = createClaudeClient({ apiKey })
    const response = await client.chat(
      [{ role: 'user', content: userPrompt }],
      {
        systemPrompt,
        temperature: 0.3, // 일관성 중요
        maxTokens: 2000,
      }
    )

    // JSON 추출
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        original: content,
        softened: parsed.softened || content,
        changes: parsed.changes || [],
      }
    }

    // JSON 파싱 실패 시 Fallback
    return ruleBasedSoften(content, policy)
  } catch (error) {
    safeLogger.error('[Softener] LLM failed, using rule-based:', error)
    return ruleBasedSoften(content, policy)
  }
}

/**
 * Fallback: 규칙 기반 간단한 완화
 */
function ruleBasedSoften(content: string, policy: SafetyPolicy): SoftenResult {
  let softened = content
  const changes: string[] = []

  // 권유형 → 설명형
  if (policy.id === 'NO_BUY_SELL_IMPERATIVE') {
    const patterns = [
      { from: /하세요/g, to: '할 수 있습니다' },
      { from: /사세요/g, to: '매수를 고려할 수 있습니다' },
      { from: /팔아?세요/g, to: '매도를 검토할 수 있습니다' },
      { from: /투자하세요/g, to: '투자를 고려할 수 있습니다' },
    ]
    patterns.forEach(({ from, to }) => {
      if (from.test(softened)) {
        changes.push(`권유형 표현 → 설명형`)
        softened = softened.replace(from, to)
      }
    })
  }

  // 보장 표현 → 가능성 표현
  if (policy.id === 'NO_GUARANTEE') {
    const patterns = [
      { from: /반드시 수익/g, to: '수익 가능성' },
      { from: /확실히 (수익|이익)/g, to: '과거 데이터 기반 $1 가능성' },
      { from: /100% (수익|성공)/g, to: '높은 $1 가능성' },
      { from: /무조건 벌/g, to: '수익을 낼 수 있는' },
    ]
    patterns.forEach(({ from, to }) => {
      if (from.test(softened)) {
        changes.push(`보장 표현 → 가능성 표현`)
        softened = softened.replace(from, to)
      }
    })
  }

  // 극단적 표현 → 중립 표현
  if (policy.id === 'TITLE_NO_EXTREME') {
    const patterns = [
      { from: /대박/g, to: '높은 수익률' },
      { from: /폭등|떡상/g, to: '상승' },
      { from: /급등/g, to: '빠른 상승' },
      { from: /10배/g, to: '높은 배율' },
    ]
    patterns.forEach(({ from, to }) => {
      if (from.test(softened)) {
        changes.push(`극단적 표현 → 중립적 표현`)
        softened = softened.replace(from, to)
      }
    })
  }

  // 면책조항 추가 (SUMMARY)
  if (policy.id === 'SUMMARY_DISCLAIMER' && !content.includes('⚠️')) {
    softened += '\n\n⚠️ 이 정보는 교육 목적이며, 투자 조언이 아닙니다.'
    changes.push('면책조항 추가')
  }

  return {
    original: content,
    softened,
    changes,
  }
}

/**
 * 배치 완화 (여러 텍스트 동시 처리)
 */
export async function softenBatch(
  contents: Array<{ content: string; policy: SafetyPolicy; section?: string }>
): Promise<SoftenResult[]> {
  return Promise.all(contents.map(softenContent))
}
