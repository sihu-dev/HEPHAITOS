// ============================================
// Revalidation Utilities for Server Actions
// ============================================

'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { safeLogger } from '@/lib/utils/safe-logger'

/**
 * 전략 관련 경로 재검증
 */
export async function revalidateStrategies(userId?: string) {
  try {
    // 전략 목록 페이지
    revalidatePath('/dashboard/strategies')
    revalidatePath('/dashboard')

    // 태그 기반 재검증
    revalidateTag('strategies')
    if (userId) {
      revalidateTag(`strategies-${userId}`)
    }

    safeLogger.info('[Revalidation] Strategies revalidated', { userId })
  } catch (error) {
    safeLogger.error('[Revalidation] Failed to revalidate strategies', { error })
  }
}

/**
 * 특정 전략 상세 페이지 재검증
 */
export async function revalidateStrategy(strategyId: string) {
  try {
    revalidatePath(`/dashboard/strategies/${strategyId}`)
    revalidateTag(`strategy-${strategyId}`)

    safeLogger.info('[Revalidation] Strategy revalidated', { strategyId })
  } catch (error) {
    safeLogger.error('[Revalidation] Failed to revalidate strategy', { error })
  }
}

/**
 * 포트폴리오 재검증
 */
export async function revalidatePortfolio(userId?: string) {
  try {
    revalidatePath('/dashboard/portfolio')
    revalidatePath('/dashboard')

    revalidateTag('portfolio')
    if (userId) {
      revalidateTag(`portfolio-${userId}`)
    }

    safeLogger.info('[Revalidation] Portfolio revalidated', { userId })
  } catch (error) {
    safeLogger.error('[Revalidation] Failed to revalidate portfolio', { error })
  }
}

/**
 * 사용자 프로필 재검증
 */
export async function revalidateUserProfile(userId: string) {
  try {
    revalidatePath('/dashboard/settings')
    revalidateTag(`user-profile-${userId}`)

    safeLogger.info('[Revalidation] User profile revalidated', { userId })
  } catch (error) {
    safeLogger.error('[Revalidation] Failed to revalidate user profile', { error })
  }
}

/**
 * 대시보드 전체 재검증
 */
export async function revalidateDashboard() {
  try {
    revalidatePath('/dashboard', 'layout')
    revalidateTag('dashboard')

    safeLogger.info('[Revalidation] Dashboard revalidated')
  } catch (error) {
    safeLogger.error('[Revalidation] Failed to revalidate dashboard', { error })
  }
}
