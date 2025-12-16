// ============================================
// Global Error Handler
// Centralized error handling utilities
// ============================================

import { maskSensitiveData, safeLogger } from '@/lib/utils/safe-logger'
import { captureError, isSentryEnabled } from '@/lib/monitoring/sentry'

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface AppError extends Error {
  code: string
  severity: ErrorSeverity
  context?: Record<string, unknown>
  timestamp: Date
  userId?: string
}

export interface ErrorReport {
  error: AppError
  userAgent?: string
  url?: string
  componentStack?: string
}

// Error codes for classification
export const ERROR_CODES = {
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  API_ERROR: 'API_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',

  // Auth errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // Business logic errors
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  STRATEGY_ERROR: 'STRATEGY_ERROR',
  EXCHANGE_ERROR: 'EXCHANGE_ERROR',

  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const

export type ErrorCode = keyof typeof ERROR_CODES

/**
 * Create an AppError from any error
 */
export function createAppError(
  error: Error | string,
  code: ErrorCode = 'UNKNOWN_ERROR',
  severity: ErrorSeverity = 'medium',
  context?: Record<string, unknown>
): AppError {
  const baseError = typeof error === 'string' ? new Error(error) : error

  return Object.assign(baseError, {
    code,
    severity,
    context,
    timestamp: new Date(),
  }) as AppError
}

/**
 * Determine error severity based on error type
 */
export function determineErrorSeverity(error: Error): ErrorSeverity {
  const message = error.message.toLowerCase()

  if (message.includes('critical') || message.includes('fatal')) {
    return 'critical'
  }
  if (message.includes('unauthorized') || message.includes('forbidden')) {
    return 'high'
  }
  if (message.includes('network') || message.includes('timeout')) {
    return 'medium'
  }
  return 'low'
}

/**
 * Extract error code from HTTP status
 */
export function errorCodeFromStatus(status: number): ErrorCode {
  switch (status) {
    case 400:
      return 'VALIDATION_ERROR'
    case 401:
      return 'UNAUTHORIZED'
    case 403:
      return 'FORBIDDEN'
    case 404:
      return 'NOT_FOUND'
    case 429:
      return 'RATE_LIMITED'
    case 500:
    case 502:
    case 503:
      return 'INTERNAL_ERROR'
    default:
      return 'UNKNOWN_ERROR'
  }
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(code: ErrorCode): string {
  const messages: Record<ErrorCode, string> = {
    NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
    TIMEOUT_ERROR: '요청 시간이 초과되었습니다. 다시 시도해주세요.',
    API_ERROR: 'API 요청 중 오류가 발생했습니다.',
    RATE_LIMITED: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
    UNAUTHORIZED: '로그인이 필요합니다.',
    FORBIDDEN: '접근 권한이 없습니다.',
    SESSION_EXPIRED: '세션이 만료되었습니다. 다시 로그인해주세요.',
    VALIDATION_ERROR: '입력 값을 확인해주세요.',
    INVALID_INPUT: '잘못된 입력입니다.',
    INSUFFICIENT_BALANCE: '잔고가 부족합니다.',
    STRATEGY_ERROR: '전략 실행 중 오류가 발생했습니다.',
    EXCHANGE_ERROR: '거래소 연동 중 오류가 발생했습니다.',
    INTERNAL_ERROR: '서버 오류가 발생했습니다.',
    NOT_FOUND: '요청한 리소스를 찾을 수 없습니다.',
    UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다.',
  }

  return messages[code] || messages.UNKNOWN_ERROR
}

/**
 * Error reporter - logs errors and can send to monitoring service
 */
class ErrorReporter {
  private static instance: ErrorReporter
  private errorQueue: ErrorReport[] = []
  private readonly maxQueueSize = 100

  private constructor() {
    // Set up global error handlers
    if (typeof window !== 'undefined') {
      this.setupGlobalHandlers()
    }
  }

  static getInstance(): ErrorReporter {
    if (!ErrorReporter.instance) {
      ErrorReporter.instance = new ErrorReporter()
    }
    return ErrorReporter.instance
  }

  private setupGlobalHandlers(): void {
    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason))

      this.report(createAppError(error, 'UNKNOWN_ERROR', 'high', {
        type: 'unhandledrejection',
      }))
    })

    // Global error handler
    window.addEventListener('error', (event) => {
      this.report(createAppError(event.error || new Error(event.message), 'UNKNOWN_ERROR', 'high', {
        type: 'error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      }))
    })
  }

  /**
   * Report an error
   */
  report(error: AppError, componentStack?: string): void {
    // 민감 정보 마스킹 적용
    const safeContext = error.context ? maskSensitiveData(error.context) : undefined

    const report: ErrorReport = {
      error: {
        ...error,
        context: safeContext as Record<string, unknown> | undefined,
      },
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      componentStack,
    }

    // 안전한 로깅 사용 (민감 정보 마스킹됨)
    if (process.env.NODE_ENV === 'development') {
      safeLogger.error(`Error [${error.code}] - ${error.severity}`, {
        message: error.message,
        context: safeContext,
        componentStack,
      })
    } else {
      // Production에서는 최소한의 정보만 로깅
      safeLogger.error(`Error [${error.code}]`, {
        severity: error.severity,
        timestamp: error.timestamp,
      })
    }

    // Add to queue (마스킹된 리포트)
    this.errorQueue.push(report)
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift()
    }

    // Sentry로 에러 전송 (프로덕션 환경)
    if (isSentryEnabled() && (error.severity === 'high' || error.severity === 'critical')) {
      captureError(error, {
        level: error.severity,
        extra: safeContext as Record<string, unknown>,
        tags: {
          errorCode: error.code,
          url: report.url || 'unknown',
        },
        user: error.userId ? { id: error.userId } : undefined,
      })
    }
  }

  /**
   * Get recent errors
   */
  getRecentErrors(): ErrorReport[] {
    return [...this.errorQueue]
  }

  /**
   * Clear error queue
   */
  clearQueue(): void {
    this.errorQueue = []
  }
}

// Export singleton instance
export const errorReporter = ErrorReporter.getInstance()

/**
 * Safe async wrapper - catches errors and reports them
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  options?: {
    fallback?: T
    rethrow?: boolean
    context?: Record<string, unknown>
  }
): Promise<T | undefined> {
  try {
    return await fn()
  } catch (error) {
    const appError = createAppError(
      error instanceof Error ? error : new Error(String(error)),
      'UNKNOWN_ERROR',
      'medium',
      options?.context
    )

    errorReporter.report(appError)

    if (options?.rethrow) {
      throw appError
    }

    return options?.fallback
  }
}

/**
 * Create a retryable async function
 */
export function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    delay?: number
    backoff?: number
    shouldRetry?: (error: Error) => boolean
  } = {}
): () => Promise<T> {
  const {
    maxRetries = 3,
    delay = 1000,
    backoff = 2,
    shouldRetry = () => true,
  } = options

  return async () => {
    let lastError: Error | null = null

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        if (!shouldRetry(lastError) || attempt === maxRetries - 1) {
          break
        }

        await new Promise((resolve) =>
          setTimeout(resolve, delay * Math.pow(backoff, attempt))
        )
      }
    }

    throw lastError
  }
}
