// ============================================
import { safeLogger } from '@/lib/utils/safe-logger'
// Sentry Error Monitoring
// 프로덕션 에러 모니터링 및 성능 추적
// ============================================

// Placeholder - Sentry is temporarily disabled
// To re-enable: npm install @sentry/nextjs

// 초기화 상태
let isInitialized = false

/**
 * Sentry 초기화 (disabled)
 */
export async function initSentry(): Promise<boolean> {
  if (isInitialized) return true
  safeLogger.info('[Sentry] Disabled - package not installed')
  return false
}

/**
 * 에러를 Sentry에 보고 (disabled)
 */
export function captureError(
  error: Error,
  context?: {
    tags?: Record<string, string>
    extra?: Record<string, unknown>
    user?: { id?: string; email?: string }
    level?: 'critical' | 'high' | 'medium' | 'low'
  }
): string | undefined {
  safeLogger.error('[Sentry disabled] Error:', { message: error.message, context })
  return undefined
}

/**
 * 메시지를 Sentry에 보고 (disabled)
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: {
    tags?: Record<string, string>
    extra?: Record<string, unknown>
  }
): string | undefined {
  safeLogger.info(`[Sentry disabled] ${level}: ${message}`, context)
  return undefined
}

/**
 * 사용자 정보 설정 (disabled)
 */
export function setUser(_user: {
  id?: string
  email?: string
  username?: string
  subscriptionPlan?: string
}): void {
  // No-op
}

/**
 * 사용자 정보 초기화 (disabled)
 */
export function clearUser(): void {
  // No-op
}

/**
 * 태그 설정 (disabled)
 */
export function setTag(_key: string, _value: string): void {
  // No-op
}

/**
 * 컨텍스트 설정 (disabled)
 */
export function setContext(_name: string, _context: Record<string, unknown>): void {
  // No-op
}

/**
 * 브레드크럼 추가 (disabled)
 */
export function addBreadcrumb(_breadcrumb: {
  category?: string
  message: string
  level?: 'debug' | 'info' | 'warning' | 'error'
  data?: Record<string, unknown>
}): void {
  // No-op
}

/**
 * 트랜잭션 시작 (disabled)
 */
export function startTransaction(
  _name: string,
  _operation: string
): { finish: () => void } | undefined {
  return { finish: () => {} }
}

/**
 * Sentry 상태 확인
 */
export function isSentryEnabled(): boolean {
  return false
}

/**
 * Sentry 플러시 (disabled)
 */
export async function flushSentry(_timeout: number = 2000): Promise<boolean> {
  return true
}
