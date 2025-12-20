// ============================================
// API Error Handler Middleware
// 표준화된 API 에러 핸들링
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import {
  createAppError,
  errorReporter,
  ERROR_CODES,
  getUserFriendlyMessage,
  type ErrorCode,
  type ErrorSeverity,
} from '@/lib/error-handler'
import { safeLogger } from '@/lib/utils/safe-logger'

// ============================================
// Types
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
  meta?: {
    timestamp: string
    requestId?: string
  }
}

export interface ApiHandlerOptions {
  logErrors?: boolean
  includeStack?: boolean // 개발 환경에서만
  onError?: (error: Error, request: NextRequest) => void
}

// ============================================
// Response Helpers
// ============================================

/**
 * 표준 API 성공 응답 생성
 */
export function createApiResponse<T>(
  data: T,
  options?: { status?: number; headers?: Record<string, string> } | number
): NextResponse<ApiResponse<T>> {
  // Handle both object form { status: 200 } and plain number 200
  const status = typeof options === 'number' ? options : (options?.status ?? 200)
  const headers = typeof options === 'object' && options !== null ? options.headers : undefined

  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    { status, headers }
  )
}

/**
 * 표준 API 에러 응답 생성
 */
export function createErrorResponse(
  code: ErrorCode,
  message?: string,
  status?: number,
  details?: Record<string, unknown>
): NextResponse<ApiResponse<never>> {
  const statusCode = status || getStatusFromCode(code)
  const errorMessage = message || getUserFriendlyMessage(code)

  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? details : undefined,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    { status: statusCode }
  )
}

/**
 * ErrorCode에서 HTTP 상태 코드 추출
 */
function getStatusFromCode(code: ErrorCode): number {
  const statusMap: Record<ErrorCode, number> = {
    NETWORK_ERROR: 503,
    TIMEOUT_ERROR: 504,
    API_ERROR: 500,
    RATE_LIMITED: 429,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    SESSION_EXPIRED: 401,
    VALIDATION_ERROR: 400,
    INVALID_INPUT: 400,
    INSUFFICIENT_BALANCE: 400,
    STRATEGY_ERROR: 500,
    EXCHANGE_ERROR: 502,
    INTERNAL_ERROR: 500,
    NOT_FOUND: 404,
    UNKNOWN_ERROR: 500,
  }

  return statusMap[code] || 500
}

// ============================================
// Error Classification
// ============================================

/**
 * 에러를 분류하여 적절한 ErrorCode 반환
 */
function classifyError(error: unknown): { code: ErrorCode; severity: ErrorSeverity } {
  // Zod 유효성 검사 에러
  if (error instanceof ZodError) {
    return { code: 'VALIDATION_ERROR', severity: 'low' }
  }

  // 일반 Error 객체
  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    // 인증 관련
    if (message.includes('unauthorized') || message.includes('token')) {
      return { code: 'UNAUTHORIZED', severity: 'medium' }
    }
    if (message.includes('forbidden') || message.includes('permission')) {
      return { code: 'FORBIDDEN', severity: 'medium' }
    }

    // 네트워크 관련
    if (message.includes('network') || message.includes('fetch')) {
      return { code: 'NETWORK_ERROR', severity: 'medium' }
    }
    if (message.includes('timeout') || message.includes('econnreset')) {
      return { code: 'TIMEOUT_ERROR', severity: 'medium' }
    }

    // 비즈니스 로직
    if (message.includes('balance') || message.includes('insufficient')) {
      return { code: 'INSUFFICIENT_BALANCE', severity: 'low' }
    }
    if (message.includes('strategy')) {
      return { code: 'STRATEGY_ERROR', severity: 'medium' }
    }
    if (message.includes('exchange')) {
      return { code: 'EXCHANGE_ERROR', severity: 'high' }
    }

    // 찾을 수 없음
    if (message.includes('not found') || message.includes('doesn\'t exist')) {
      return { code: 'NOT_FOUND', severity: 'low' }
    }
  }

  return { code: 'UNKNOWN_ERROR', severity: 'medium' }
}

/**
 * Zod 에러에서 상세 정보 추출
 */
function extractZodDetails(error: ZodError): Record<string, unknown> {
  return {
    issues: error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    })),
  }
}

// ============================================
// API Error Handler
// ============================================

/**
 * API 에러를 표준 응답으로 변환
 */
export function handleApiError(
  error: unknown,
  options: ApiHandlerOptions = {}
): NextResponse<ApiResponse<never>> {
  const { logErrors = true, includeStack = false } = options

  // 에러 분류
  const { code, severity } = classifyError(error)
  const errorObj = error instanceof Error ? error : new Error(String(error))

  // 로깅
  if (logErrors) {
    safeLogger.error(`[API Error] ${code}`, {
      message: errorObj.message,
      stack: process.env.NODE_ENV === 'development' ? errorObj.stack : undefined,
    })
  }

  // 에러 리포팅 (high/critical만)
  if (severity === 'high' || severity === 'critical') {
    const appError = createAppError(errorObj, code, severity)
    errorReporter.report(appError)
  }

  // Zod 에러 상세 정보
  const details = error instanceof ZodError
    ? extractZodDetails(error)
    : includeStack && process.env.NODE_ENV === 'development'
      ? { stack: errorObj.stack }
      : undefined

  return createErrorResponse(code, errorObj.message, undefined, details)
}

// ============================================
// Middleware HOF (Higher-Order Function)
// ============================================

/**
 * 에러 핸들링이 적용된 API 핸들러 래퍼
 *
 * @example
 * ```ts
 * export const GET = withErrorHandler(
 *   async (req) => {
 *     // 에러 발생 시 자동으로 표준 에러 응답 반환
 *     const data = await fetchData()
 *     return createApiResponse(data)
 *   },
 *   { logErrors: true }
 * )
 * ```
 */
export function withErrorHandler<T extends NextRequest>(
  handler: (request: T, context?: unknown) => Promise<NextResponse | Response>,
  options: ApiHandlerOptions = {}
): (request: T, context?: unknown) => Promise<NextResponse | Response> {
  return async (request: T, context?: unknown): Promise<NextResponse | Response> => {
    try {
      return await handler(request, context)
    } catch (error) {
      // 커스텀 에러 핸들러 호출
      if (options.onError) {
        options.onError(
          error instanceof Error ? error : new Error(String(error)),
          request
        )
      }

      return handleApiError(error, options)
    }
  }
}

// ============================================
// Combined Middleware
// ============================================

import { withRateLimit, type RateLimitOptions } from './rate-limit'

/**
 * Rate Limit + Error Handler 결합 미들웨어
 *
 * @example
 * ```ts
 * export const POST = withApiMiddleware(
 *   async (req) => {
 *     const body = await req.json()
 *     return createApiResponse({ received: body })
 *   },
 *   {
 *     rateLimit: { category: 'ai' },
 *     errorHandler: { logErrors: true }
 *   }
 * )
 * ```
 */
export function withApiMiddleware<T extends NextRequest>(
  handler: (request: T, context?: unknown) => Promise<NextResponse | Response>,
  options: {
    rateLimit?: RateLimitOptions
    errorHandler?: ApiHandlerOptions
  } = {}
): (request: T, context?: unknown) => Promise<NextResponse | Response> {
  // Rate Limit 적용
  let wrappedHandler = handler
  if (options.rateLimit !== undefined) {
    wrappedHandler = withRateLimit(handler, options.rateLimit)
  }

  // Error Handler 적용
  return withErrorHandler(wrappedHandler, options.errorHandler || {})
}

// ============================================
// Validation Helper
// ============================================

import { z } from 'zod'

/**
 * Request Body 유효성 검사
 */
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<{ data: T } | { error: NextResponse }> {
  try {
    const body = await request.json()
    const data = schema.parse(body)
    return { data }
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        error: createErrorResponse(
          'VALIDATION_ERROR',
          '입력 값을 확인해주세요.',
          400,
          extractZodDetails(error)
        ),
      }
    }
    if (error instanceof SyntaxError) {
      return {
        error: createErrorResponse(
          'INVALID_INPUT',
          '잘못된 JSON 형식입니다.',
          400
        ),
      }
    }
    return { error: handleApiError(error) }
  }
}

/**
 * Query Parameter 유효성 검사
 */
export function validateQueryParams<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): { data: T } | { error: NextResponse } {
  try {
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())
    const data = schema.parse(params)
    return { data }
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        error: createErrorResponse(
          'VALIDATION_ERROR',
          '쿼리 파라미터를 확인해주세요.',
          400,
          extractZodDetails(error)
        ),
      }
    }
    return { error: handleApiError(error) }
  }
}

// ============================================
// Admin Auth Middleware (P0 FIX)
// ============================================

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// P1 FIX: Lazy initialization to prevent test failures
let supabaseAdmin: SupabaseClient | null = null

function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      throw new Error('Supabase credentials not configured')
    }
    supabaseAdmin = createClient(url, key)
  }
  return supabaseAdmin
}

/**
 * Admin 권한 검증 미들웨어
 * P0 FIX: Admin API에 인증/인가 추가
 */
export async function requireAdminAuth(
  request: NextRequest
): Promise<{ userId: string; isAdmin: boolean } | { error: NextResponse }> {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return {
        error: createErrorResponse('UNAUTHORIZED', '인증이 필요합니다.', 401),
      }
    }

    const token = authHeader.replace('Bearer ', '')

    // Supabase로 토큰 검증
    const { data: { user }, error } = await getSupabaseAdmin().auth.getUser(token)

    if (error || !user) {
      return {
        error: createErrorResponse('UNAUTHORIZED', '유효하지 않은 토큰입니다.', 401),
      }
    }

    // Admin 권한 확인 (user_metadata 또는 별도 테이블)
    const { data: profile } = await getSupabaseAdmin()
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'

    if (!isAdmin) {
      safeLogger.warn('[Admin API] Unauthorized access attempt', { userId: user.id })
      return {
        error: createErrorResponse('FORBIDDEN', '관리자 권한이 필요합니다.', 403),
      }
    }

    return { userId: user.id, isAdmin: true }
  } catch (error) {
    safeLogger.error('[Admin API] Auth error', { error })
    return {
      error: createErrorResponse('UNAUTHORIZED', '인증 처리 중 오류가 발생했습니다.', 401),
    }
  }
}

/**
 * Admin 미들웨어 래퍼
 * Admin API 핸들러에 인증 자동 적용
 */
export function withAdminAuth<T extends NextRequest>(
  handler: (request: T, adminContext: { userId: string }) => Promise<NextResponse | Response>,
  options: ApiHandlerOptions = {}
): (request: T, context?: unknown) => Promise<NextResponse | Response> {
  return async (request: T, context?: unknown): Promise<NextResponse | Response> => {
    // Admin 인증 검증
    const authResult = await requireAdminAuth(request)
    if ('error' in authResult) {
      return authResult.error
    }

    try {
      return await handler(request, { userId: authResult.userId })
    } catch (error) {
      if (options.onError) {
        options.onError(
          error instanceof Error ? error : new Error(String(error)),
          request
        )
      }
      return handleApiError(error, options)
    }
  }
}
