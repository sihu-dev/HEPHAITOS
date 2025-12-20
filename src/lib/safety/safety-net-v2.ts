// ============================================
// Safety Net v2 - Policy Engine
// GPT V1 피드백 P0-8: allow/soften/block 3단계 정책
// ============================================

import { createClient } from '@supabase/supabase-js'
import { getPoliciesForSection, type SafetyPolicy, type SafetyAction } from './policies'
import { softenContent, type SoftenResult } from './softener'
import { safeLogger } from '@/lib/utils/safe-logger'

// ============================================
// Types
// ============================================

export interface SafetyCheckRequest {
  content: string
  section?: string // 'title', 'summary', 'rules', 'risks'
  feature: string  // 'strategy_generate', 'report_create', 'tutor_answer'
  userId: string
  inputExcerpt?: string // 사용자 입력 요약 (로그용)
}

export interface SafetyCheckResult {
  decision: SafetyAction
  content: string
  matchedPolicies: string[]
  changes?: string[]
  blocked?: boolean
}

// ============================================
// Safety Event Logging
// ============================================

interface SafetyEventLog {
  userId: string
  feature: string
  section?: string
  inputExcerpt?: string
  outputBefore: string
  outputAfter: string
  decision: SafetyAction
  policyMatched: string[]
}

async function logSafetyEvent(event: SafetyEventLog): Promise<void> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      safeLogger.warn('[Safety Net] Supabase not configured, skipping event log')
      return
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { error } = await supabase.from('safety_events').insert({
      user_id: event.userId,
      feature: event.feature,
      section: event.section,
      input_excerpt: event.inputExcerpt?.substring(0, 500), // 최대 500자
      output_before: event.outputBefore.substring(0, 1000), // 최대 1000자
      output_after: event.outputAfter.substring(0, 1000),
      decision: event.decision,
      policy_matched: event.policyMatched,
    })

    if (error) {
      safeLogger.error('[Safety Net] Failed to log event:', { error })
    }
  } catch (error) {
    safeLogger.error('[Safety Net] Exception in logSafetyEvent:', { error })
  }
}

// ============================================
// Core Safety Check
// ============================================

/**
 * Safety Net v2 - 콘텐츠 안전성 검사
 *
 * @returns SafetyCheckResult
 * @throws Error if decision is 'block'
 */
export async function applySafetyNet(
  request: SafetyCheckRequest
): Promise<SafetyCheckResult> {
  const { content, section, feature, userId, inputExcerpt } = request

  safeLogger.info('[Safety Net] Checking content', {
    feature,
    section,
    contentLength: content.length,
  })

  const policies = getPoliciesForSection(section)
  const matchedPolicies: string[] = []
  let currentContent = content
  const changes: string[] = []

  // 정책 순회
  for (const policy of policies) {
    if (policy.pattern.test(currentContent)) {
      matchedPolicies.push(policy.id)

      // BLOCK: 즉시 차단
      if (policy.action === 'block') {
        safeLogger.warn('[Safety Net] BLOCKED', {
          policy: policy.id,
          reason: policy.reason,
        })

        await logSafetyEvent({
          userId,
          feature,
          section,
          inputExcerpt,
          outputBefore: content,
          outputAfter: '',
          decision: 'block',
          policyMatched: [policy.id],
        })

        throw new Error(`SAFETY_BLOCK: ${policy.reason}`)
      }

      // SOFTEN: 완화 시도
      if (policy.action === 'soften') {
        safeLogger.info('[Safety Net] Softening content', {
          policy: policy.id,
        })

        try {
          const softened = await softenContent({
            content: currentContent,
            policy,
            section,
          })

          currentContent = softened.softened
          changes.push(...softened.changes)

          safeLogger.info('[Safety Net] Content softened', {
            policy: policy.id,
            changes: softened.changes,
          })
        } catch (error) {
          safeLogger.error('[Safety Net] Softening failed', { error })
          // 완화 실패 시 원본 유지
        }
      }
    }
  }

  // 결과 결정
  const decision: SafetyAction = changes.length > 0 ? 'soften' : 'allow'

  // 이벤트 로깅
  if (decision !== 'allow') {
    await logSafetyEvent({
      userId,
      feature,
      section,
      inputExcerpt,
      outputBefore: content,
      outputAfter: currentContent,
      decision,
      policyMatched: matchedPolicies,
    })
  }

  safeLogger.info('[Safety Net] Check complete', {
    decision,
    matchedPolicies: matchedPolicies.length,
    changes: changes.length,
  })

  return {
    decision,
    content: currentContent,
    matchedPolicies,
    changes: changes.length > 0 ? changes : undefined,
    blocked: false,
  }
}

/**
 * 배치 안전성 검사 (여러 섹션 동시 처리)
 */
export async function applySafetyNetBatch(
  requests: SafetyCheckRequest[]
): Promise<SafetyCheckResult[]> {
  return Promise.all(requests.map(applySafetyNet))
}

/**
 * 간단한 안전성 검사 (차단 여부만 확인)
 */
export function quickSafetyCheck(content: string): boolean {
  const blockPatterns = [
    /이 종목을? 사세요/gi,
    /반드시 팔아?세요/gi,
    /100% 수익 보장/gi,
  ]

  return !blockPatterns.some(pattern => pattern.test(content))
}

// ============================================
// P0-4 FIX: AI 응답 면책조항 자동 삽입
// ============================================

const AI_DISCLAIMER_KR = `

⚠️ **면책조항**: 본 내용은 교육 및 정보 제공 목적으로 생성되었으며, 투자 조언이 아닙니다. 모든 투자 결정은 본인의 판단과 책임하에 이루어져야 합니다. 과거 성과는 미래 수익을 보장하지 않습니다.`

const AI_DISCLAIMER_SHORT = '\n\n⚠️ 본 내용은 교육 목적이며, 투자 조언이 아닙니다. 투자 결정은 본인 책임입니다.'

/**
 * AI 응답에 면책조항 강제 삽입
 * P0-4 FIX: 모든 AI 생성 콘텐츠에 면책조항 필수
 *
 * @param content AI 생성 콘텐츠
 * @param options 옵션 (short: 짧은 버전 사용, force: 이미 있어도 강제 추가)
 * @returns 면책조항이 추가된 콘텐츠
 */
export function ensureDisclaimer(
  content: string,
  options: { short?: boolean; force?: boolean } = {}
): string {
  const { short = false, force = false } = options

  // 이미 면책조항이 있는지 확인
  const hasDisclaimer = content.includes('면책조항') ||
    content.includes('투자 조언이 아닙니다') ||
    content.includes('본인 책임') ||
    content.includes('⚠️')

  if (hasDisclaimer && !force) {
    return content
  }

  const disclaimer = short ? AI_DISCLAIMER_SHORT : AI_DISCLAIMER_KR
  return content + disclaimer
}

/**
 * AI 응답 객체의 특정 필드들에 면책조항 삽입
 * 전략 생성, 리포트 등에서 사용
 */
export function ensureDisclaimerInFields<T extends Record<string, unknown>>(
  obj: T,
  fields: (keyof T)[],
  options: { short?: boolean } = {}
): T {
  const result = { ...obj }

  for (const field of fields) {
    const value = result[field]
    if (typeof value === 'string' && value.length > 0) {
      result[field] = ensureDisclaimer(value, options) as T[typeof field]
    }
  }

  return result
}

/**
 * Safety Net 적용 후 면책조항 보장
 * applySafetyNet의 래퍼 함수
 */
export async function applySafetyNetWithDisclaimer(
  request: SafetyCheckRequest
): Promise<SafetyCheckResult> {
  const result = await applySafetyNet(request)

  // 면책조항 강제 삽입
  result.content = ensureDisclaimer(result.content, { short: true })

  return result
}
