// ============================================
// Server Action Wrapper Utilities
// ============================================

'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { safeLogger } from '@/lib/utils/safe-logger'

/**
 * Server Action 응답 타입
 */
export type ActionResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string }

/**
 * 인증된 사용자 ID 가져오기
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    return user.id
  } catch (error) {
    safeLogger.error('[ActionWrapper] getCurrentUserId failed', { error })
    return null
  }
}

/**
 * 인증 필수 액션 래퍼
 * - 자동 인증 체크
 * - 에러 핸들링
 * - 로깅
 */
export function withAuth<TArgs extends unknown[], TData>(
  action: (userId: string, ...args: TArgs) => Promise<TData>,
  actionName: string
): (...args: TArgs) => Promise<ActionResponse<TData>> {
  return async (...args: TArgs): Promise<ActionResponse<TData>> => {
    try {
      // 인증 체크
      const userId = await getCurrentUserId()

      if (!userId) {
        safeLogger.warn(`[${actionName}] Unauthorized access attempt`)
        return {
          success: false,
          error: '로그인이 필요합니다',
          code: 'UNAUTHORIZED',
        }
      }

      safeLogger.info(`[${actionName}] Action started`, { userId })

      // 액션 실행
      const data = await action(userId, ...args)

      safeLogger.info(`[${actionName}] Action completed`, { userId })

      return {
        success: true,
        data,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'

      safeLogger.error(`[${actionName}] Action failed`, { error: message })

      return {
        success: false,
        error: message,
        code: 'INTERNAL_ERROR',
      }
    }
  }
}

/**
 * 일반 액션 래퍼 (인증 불필요)
 * - 에러 핸들링
 * - 로깅
 */
export function withErrorHandling<TArgs extends unknown[], TData>(
  action: (...args: TArgs) => Promise<TData>,
  actionName: string
): (...args: TArgs) => Promise<ActionResponse<TData>> {
  return async (...args: TArgs): Promise<ActionResponse<TData>> => {
    try {
      safeLogger.info(`[${actionName}] Action started`)

      const data = await action(...args)

      safeLogger.info(`[${actionName}] Action completed`)

      return {
        success: true,
        data,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'

      safeLogger.error(`[${actionName}] Action failed`, { error: message })

      return {
        success: false,
        error: message,
        code: 'INTERNAL_ERROR',
      }
    }
  }
}

/**
 * Validation 헬퍼
 */
export function validateRequired<T>(
  value: T | undefined | null,
  fieldName: string
): ActionResponse<never> | null {
  if (value === undefined || value === null || value === '') {
    return {
      success: false,
      error: `${fieldName}은(는) 필수 항목입니다`,
      code: 'VALIDATION_ERROR',
    }
  }
  return null
}
