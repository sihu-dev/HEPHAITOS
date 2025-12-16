// ============================================
// Credit Spending Helper
// P-1 CRITICAL: API 크레딧 소비 로직 통합
// ============================================

import { createClient } from '@supabase/supabase-js'
import { safeLogger } from '@/lib/utils/safe-logger'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ============================================
// Custom Errors
// ============================================

export class InsufficientCreditsError extends Error {
  constructor(
    public required: number,
    public current: number
  ) {
    super(`Insufficient credits: required ${required}, current ${current}`)
    this.name = 'InsufficientCreditsError'
  }
}

export class CreditSpendError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CreditSpendError'
  }
}

// ============================================
// Types
// ============================================

export type CreditFeature =
  | 'celebrity_mirror'
  | 'ai_tutor'
  | 'ai_strategy'
  | 'backtest_1y'
  | 'backtest_5y'
  | 'live_coaching_30m'
  | 'live_coaching_60m'
  | 'realtime_alert_1d'
  | 'realtime_alert_7d'
  | 'realtime_alert_30d'
  | 'portfolio_analysis'
  | 'risk_assessment'
  | 'market_report'

export interface SpendCreditsParams {
  userId: string
  feature: CreditFeature
  amount: number
  metadata?: Record<string, unknown>
}

export interface SpendCreditsResult {
  success: boolean
  newBalance: number
  transactionId: string
}

// ============================================
// Core Functions
// ============================================

/**
 * 크레딧 소비 (RPC 호출)
 *
 * @throws {InsufficientCreditsError} 잔액 부족 시
 * @throws {CreditSpendError} 기타 에러
 */
export async function spendCredits({
  userId,
  feature,
  amount,
  metadata,
}: SpendCreditsParams): Promise<SpendCreditsResult> {
  safeLogger.info('[Credits] Attempting to spend', {
    userId,
    feature,
    amount,
  })

  try {
    const { data, error } = await supabaseAdmin.rpc('spend_credits', {
      p_user_id: userId,
      p_feature: feature,
      p_amount: amount,
      p_metadata: metadata || {},
    })

    if (error) {
      safeLogger.error('[Credits] RPC error', { error })
      throw new CreditSpendError(`RPC failed: ${error.message}`)
    }

    if (!data || !data.success) {
      // 잔액 부족
      if (data?.error_code === 'INSUFFICIENT_BALANCE') {
        const current = data.current_balance || 0
        safeLogger.warn('[Credits] Insufficient balance', {
          userId,
          required: amount,
          current,
        })
        throw new InsufficientCreditsError(amount, current)
      }

      // 기타 에러
      const errorMsg = data?.error_message || 'Unknown error'
      safeLogger.error('[Credits] Spend failed', { error: errorMsg })
      throw new CreditSpendError(errorMsg)
    }

    safeLogger.info('[Credits] Spend success', {
      userId,
      feature,
      amount,
      newBalance: data.new_balance,
      transactionId: data.transaction_id,
    })

    return {
      success: true,
      newBalance: data.new_balance,
      transactionId: data.transaction_id,
    }
  } catch (error) {
    // Re-throw custom errors
    if (
      error instanceof InsufficientCreditsError ||
      error instanceof CreditSpendError
    ) {
      throw error
    }

    // Wrap unexpected errors
    safeLogger.error('[Credits] Unexpected error', { error })
    throw new CreditSpendError(
      error instanceof Error ? error.message : 'Unknown error'
    )
  }
}

/**
 * 크레딧 잔액 조회
 */
export async function getCreditBalance(userId: string): Promise<number> {
  try {
    const { data, error } = await supabaseAdmin.rpc('get_credit_balance', {
      p_user_id: userId,
    })

    if (error) {
      safeLogger.error('[Credits] Get balance error', { error })
      return 0
    }

    return data || 0
  } catch (error) {
    safeLogger.error('[Credits] Get balance failed', { error })
    return 0
  }
}

/**
 * 크레딧 충분 여부 확인
 */
export async function hasEnoughCredits(
  userId: string,
  required: number
): Promise<boolean> {
  const balance = await getCreditBalance(userId)
  return balance >= required
}

/**
 * 크레딧 부족 시 필요 금액 계산
 */
export async function getRequiredTopUp(
  userId: string,
  needed: number
): Promise<number> {
  const balance = await getCreditBalance(userId)
  const shortage = needed - balance
  return Math.max(0, shortage)
}

// ============================================
// Feature Cost Map (client-side convenience)
// ============================================

export const CREDIT_COSTS: Record<CreditFeature, number> = {
  celebrity_mirror: 0,
  ai_tutor: 1,
  ai_strategy: 10,
  backtest_1y: 3,
  backtest_5y: 10,
  live_coaching_30m: 20,
  live_coaching_60m: 35,
  realtime_alert_1d: 5,
  realtime_alert_7d: 30,
  realtime_alert_30d: 100,
  portfolio_analysis: 5,
  risk_assessment: 5,
  market_report: 3,
}

/**
 * 기능별 크레딧 비용 조회
 */
export function getCreditCost(feature: CreditFeature): number {
  return CREDIT_COSTS[feature]
}
