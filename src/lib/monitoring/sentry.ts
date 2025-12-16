// ============================================
// Sentry Error Monitoring
// 프로덕션 에러 모니터링 및 성능 추적
// ============================================

import { getSentryConfig } from '@/lib/config/env'
import { maskSensitiveData } from '@/lib/utils/safe-logger'
import type { AppError, ErrorSeverity } from '@/lib/error-handler'

// Sentry SDK 타입 (동적 로드)
type SentryType = typeof import('@sentry/nextjs')
let Sentry: SentryType | null = null

// 초기화 상태
let isInitialized = false

/**
 * Sentry 초기화
 */
export async function initSentry(): Promise<boolean> {
  if (isInitialized) return true

  const config = getSentryConfig()
  if (!config) {
    console.info('[Sentry] Not configured (SENTRY_DSN not set)')
    return false
  }

  try {
    // 동적 import
    Sentry = await import('@sentry/nextjs')

    Sentry.init({
      dsn: config.dsn,

      // 환경 설정
      environment: process.env.NODE_ENV || 'development',

      // 성능 모니터링
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

      // 세션 리플레이 (에러 발생 시)
      replaysSessionSampleRate: 0.0,
      replaysOnErrorSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,

      // 디버그 모드 (개발 환경)
      debug: process.env.NODE_ENV === 'development',

      // 민감 정보 필터링
      beforeSend(event) {
        // 에러 데이터에서 민감 정보 마스킹
        if (event.extra) {
          event.extra = maskSensitiveData(event.extra) as typeof event.extra
        }

        // 요청 헤더에서 민감 정보 제거
        if (event.request?.headers) {
          const safeHeaders = { ...event.request.headers }
          delete safeHeaders['authorization']
          delete safeHeaders['x-api-key']
          delete safeHeaders['cookie']
          event.request.headers = safeHeaders
        }

        return event
      },

      // 브레드크럼 필터링
      beforeBreadcrumb(breadcrumb) {
        // XHR/fetch 요청에서 민감한 URL 파라미터 제거
        if (breadcrumb.category === 'xhr' || breadcrumb.category === 'fetch') {
          if (breadcrumb.data?.url) {
            try {
              const url = new URL(breadcrumb.data.url)
              // API 키 파라미터 제거
              url.searchParams.delete('apiKey')
              url.searchParams.delete('api_key')
              url.searchParams.delete('token')
              breadcrumb.data.url = url.toString()
            } catch {
              // URL 파싱 실패 시 무시
            }
          }
        }
        return breadcrumb
      },

      // 무시할 에러
      ignoreErrors: [
        // 브라우저 확장 에러
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',
        // 네트워크 에러 (일반적인 타임아웃)
        'Network request failed',
        'Failed to fetch',
        // 취소된 요청
        'AbortError',
        'The operation was aborted',
      ],
    })

    isInitialized = true
    console.info('[Sentry] Initialized successfully')
    return true
  } catch (error) {
    console.error('[Sentry] Failed to initialize:', error)
    return false
  }
}

/**
 * 에러를 Sentry에 보고
 */
export function captureError(
  error: Error | AppError,
  context?: {
    tags?: Record<string, string>
    extra?: Record<string, unknown>
    user?: { id?: string; email?: string }
    level?: ErrorSeverity
  }
): string | undefined {
  if (!Sentry || !isInitialized) {
    console.error('[Sentry] Not initialized, error not reported:', error.message)
    return undefined
  }

  // 민감 정보 마스킹
  const safeExtra = context?.extra ? maskSensitiveData(context.extra) : undefined

  // Sentry 레벨 매핑
  const levelMap: Record<ErrorSeverity, 'fatal' | 'error' | 'warning' | 'info'> = {
    critical: 'fatal',
    high: 'error',
    medium: 'warning',
    low: 'info',
  }

  const eventId = Sentry.captureException(error, {
    tags: {
      ...context?.tags,
      errorCode: 'code' in error ? (error as AppError).code : undefined,
    },
    extra: safeExtra as Record<string, unknown>,
    user: context?.user,
    level: context?.level ? levelMap[context.level] : 'error',
  })

  return eventId
}

/**
 * 메시지를 Sentry에 보고
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: {
    tags?: Record<string, string>
    extra?: Record<string, unknown>
  }
): string | undefined {
  if (!Sentry || !isInitialized) {
    console.log(`[Sentry] ${level}: ${message}`)
    return undefined
  }

  const safeExtra = context?.extra ? maskSensitiveData(context.extra) : undefined

  return Sentry.captureMessage(message, {
    level,
    tags: context?.tags,
    extra: safeExtra as Record<string, unknown>,
  })
}

/**
 * 사용자 정보 설정
 */
export function setUser(user: {
  id?: string
  email?: string
  username?: string
  subscriptionPlan?: string
}): void {
  if (!Sentry || !isInitialized) return

  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
    subscription_plan: user.subscriptionPlan,
  } as Parameters<typeof Sentry.setUser>[0])
}

/**
 * 사용자 정보 초기화
 */
export function clearUser(): void {
  if (!Sentry || !isInitialized) return
  Sentry.setUser(null)
}

/**
 * 태그 설정
 */
export function setTag(key: string, value: string): void {
  if (!Sentry || !isInitialized) return
  Sentry.setTag(key, value)
}

/**
 * 컨텍스트 설정
 */
export function setContext(name: string, context: Record<string, unknown>): void {
  if (!Sentry || !isInitialized) return
  Sentry.setContext(name, maskSensitiveData(context) as Record<string, unknown>)
}

/**
 * 브레드크럼 추가
 */
export function addBreadcrumb(breadcrumb: {
  category?: string
  message: string
  level?: 'debug' | 'info' | 'warning' | 'error'
  data?: Record<string, unknown>
}): void {
  if (!Sentry || !isInitialized) return

  Sentry.addBreadcrumb({
    category: breadcrumb.category,
    message: breadcrumb.message,
    level: breadcrumb.level || 'info',
    data: breadcrumb.data ? maskSensitiveData(breadcrumb.data) as Record<string, unknown> : undefined,
  })
}

/**
 * 트랜잭션 시작 (성능 모니터링)
 */
export function startTransaction(
  name: string,
  operation: string
): { finish: () => void } | undefined {
  if (!Sentry || !isInitialized) {
    return { finish: () => {} }
  }

  const transaction = Sentry.startSpan({
    name,
    op: operation,
  }, () => {})

  return {
    finish: () => {
      // Sentry v8+ uses different API
    },
  }
}

/**
 * Sentry 상태 확인
 */
export function isSentryEnabled(): boolean {
  return isInitialized && Sentry !== null
}

/**
 * Sentry 플러시 (앱 종료 전 호출)
 */
export async function flushSentry(timeout: number = 2000): Promise<boolean> {
  if (!Sentry || !isInitialized) return true

  try {
    await Sentry.flush(timeout)
    return true
  } catch {
    return false
  }
}
