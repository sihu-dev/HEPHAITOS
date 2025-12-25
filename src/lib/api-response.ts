// ============================================
// API Response Helpers (Server-side only)
// For use in API routes
// ============================================

import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/types'
import { ERROR_CODES, type ErrorCode, getUserFriendlyMessage } from './error-handler'
import { safeLogger } from '@/lib/utils/safe-logger';

/**
 * Create success response
 */
export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
  }
}

/**
 * Create error response
 */
export function createErrorResponse(
  code: string,
  message: string,
  details?: Record<string, unknown>
): ApiResponse<never> {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  }
}

// ============================================
// NextResponse Helpers
// ============================================

/**
 * Create JSON success response
 */
export function jsonSuccess<T>(data: T, status = 200) {
  return NextResponse.json(createSuccessResponse(data), { status })
}

/**
 * Create JSON error response
 */
export function jsonError(
  code: ErrorCode,
  message?: string,
  status = 400,
  details?: Record<string, unknown>
) {
  const errorMessage = message || getUserFriendlyMessage(code)
  return NextResponse.json(
    createErrorResponse(code, errorMessage, details),
    { status }
  )
}

/**
 * HTTP Status code mappings
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const

/**
 * Validation error response
 */
export function validationError(message: string, details?: Record<string, unknown>) {
  return jsonError('VALIDATION_ERROR', message, HTTP_STATUS.BAD_REQUEST, details)
}

/**
 * Not found error response
 */
export function notFoundError(resource = '리소스') {
  return jsonError('NOT_FOUND', `${resource}를 찾을 수 없습니다.`, HTTP_STATUS.NOT_FOUND)
}

/**
 * Unauthorized error response
 */
export function unauthorizedError(message = '로그인이 필요합니다.') {
  return jsonError('UNAUTHORIZED', message, HTTP_STATUS.UNAUTHORIZED)
}

/**
 * Forbidden error response
 */
export function forbiddenError(message = '접근 권한이 없습니다.') {
  return jsonError('FORBIDDEN', message, HTTP_STATUS.FORBIDDEN)
}

/**
 * Internal server error response
 */
export function internalError(message = '서버 오류가 발생했습니다.') {
  return jsonError('INTERNAL_ERROR', message, HTTP_STATUS.INTERNAL_ERROR)
}

/**
 * Rate limit error response
 */
export function rateLimitError() {
  return jsonError('RATE_LIMITED', undefined, HTTP_STATUS.TOO_MANY_REQUESTS)
}

/**
 * API route wrapper with error handling
 */
export function withApiHandler<T>(
  handler: () => Promise<NextResponse<T>>
): Promise<NextResponse<T | ApiResponse<never>>> {
  return handler().catch((error: unknown) => {
    // ❌ console.error 대신 ✅ safeLogger 사용
    const { safeLogger } = require('@/lib/utils/safe-logger')
    const { errorReporter, createAppError } = require('@/lib/error-handler')

    safeLogger.error('[API Error]', { error }) // 민감정보 자동 마스킹

    // Sentry로 에러 리포팅
    const appError = createAppError(
      error instanceof Error ? error : new Error(String(error)),
      'API_ERROR',
      'high'
    )
    errorReporter.report(appError)

    return internalError(
      error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    )
  })
}
