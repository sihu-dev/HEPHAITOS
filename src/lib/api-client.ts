// ============================================
// Unified API Client with Error Handling
// ============================================

import type { ApiResponse, ApiError } from '@/types'

// ============================================
// Error Types
// ============================================

/**
 * Custom API Error class with typed error codes
 */
export class ApiClientError extends Error {
  readonly code: string
  readonly status: number
  readonly details?: Record<string, unknown>
  readonly isRetryable: boolean

  constructor(
    message: string,
    code: string,
    status: number,
    details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'ApiClientError'
    this.code = code
    this.status = status
    this.details = details
    this.isRetryable = this.checkRetryable(status, code)
  }

  private checkRetryable(status: number, code: string): boolean {
    // Retryable status codes
    const retryableStatuses = [408, 429, 500, 502, 503, 504]
    // Non-retryable error codes
    const nonRetryableCodes = ['AUTH_ERROR', 'VALIDATION_ERROR', 'NOT_FOUND', 'FORBIDDEN']

    return retryableStatuses.includes(status) && !nonRetryableCodes.includes(code)
  }
}

/**
 * Network error (no response received)
 */
export class NetworkError extends Error {
  readonly isNetworkError = true

  constructor(message: string = '네트워크 연결을 확인해주세요') {
    super(message)
    this.name = 'NetworkError'
  }
}

/**
 * Timeout error
 */
export class TimeoutError extends Error {
  readonly isTimeoutError = true

  constructor(message: string = '요청 시간이 초과되었습니다') {
    super(message)
    this.name = 'TimeoutError'
  }
}

// ============================================
// API Response Types
// ============================================

export interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  timeout?: number
  retries?: number
  retryDelay?: number
}

// ============================================
// API Client Configuration
// ============================================

const DEFAULT_TIMEOUT = 30000 // 30 seconds
const DEFAULT_RETRIES = 2
const DEFAULT_RETRY_DELAY = 1000 // 1 second

// ============================================
// API Client
// ============================================

/**
 * Unified API client with error handling, retries, and timeout support
 */
export const apiClient = {
  /**
   * Make a GET request
   */
  async get<T>(url: string, options?: FetchOptions): Promise<T> {
    return this.request<T>(url, { ...options, method: 'GET' })
  },

  /**
   * Make a POST request
   */
  async post<T>(url: string, data?: unknown, options?: FetchOptions): Promise<T> {
    return this.request<T>(url, { ...options, method: 'POST', body: data })
  },

  /**
   * Make a PUT request
   */
  async put<T>(url: string, data?: unknown, options?: FetchOptions): Promise<T> {
    return this.request<T>(url, { ...options, method: 'PUT', body: data })
  },

  /**
   * Make a PATCH request
   */
  async patch<T>(url: string, data?: unknown, options?: FetchOptions): Promise<T> {
    return this.request<T>(url, { ...options, method: 'PATCH', body: data })
  },

  /**
   * Make a DELETE request
   */
  async delete<T>(url: string, options?: FetchOptions): Promise<T> {
    return this.request<T>(url, { ...options, method: 'DELETE' })
  },

  /**
   * Core request method with retry logic
   */
  async request<T>(url: string, options: FetchOptions = {}): Promise<T> {
    const {
      timeout = DEFAULT_TIMEOUT,
      retries = DEFAULT_RETRIES,
      retryDelay = DEFAULT_RETRY_DELAY,
      body,
      ...fetchOptions
    } = options

    let lastError: Error | null = null

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url, {
          ...fetchOptions,
          headers: {
            'Content-Type': 'application/json',
            ...fetchOptions.headers,
          },
          body: body ? JSON.stringify(body) : undefined,
        }, timeout)

        return await this.handleResponse<T>(response)
      } catch (error) {
        lastError = error as Error

        // Don't retry non-retryable errors
        if (error instanceof ApiClientError && !error.isRetryable) {
          throw error
        }

        // Don't retry client errors (4xx except 408, 429)
        if (error instanceof ApiClientError && error.status >= 400 && error.status < 500) {
          if (error.status !== 408 && error.status !== 429) {
            throw error
          }
        }

        // Wait before retrying (if not last attempt)
        if (attempt < retries) {
          await this.delay(retryDelay * Math.pow(2, attempt)) // Exponential backoff
        }
      }
    }

    throw lastError || new Error('Request failed')
  },

  /**
   * Fetch with timeout
   */
  async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })
      return response
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new TimeoutError()
        }
        if (error.message === 'Failed to fetch' || error.message.includes('network')) {
          throw new NetworkError()
        }
      }
      throw error
    } finally {
      clearTimeout(timeoutId)
    }
  },

  /**
   * Handle API response
   */
  async handleResponse<T>(response: Response): Promise<T> {
    // Handle empty responses
    if (response.status === 204) {
      return undefined as T
    }

    let data: unknown

    try {
      data = await response.json()
    } catch {
      // Non-JSON response
      if (!response.ok) {
        throw new ApiClientError(
          `HTTP error: ${response.status}`,
          'HTTP_ERROR',
          response.status
        )
      }
      return undefined as T
    }

    // Check if response follows ApiResponse format
    const apiResponse = data as ApiResponse<T>

    if (apiResponse.success === false) {
      const error = apiResponse.error || {
        code: 'UNKNOWN_ERROR',
        message: 'An unknown error occurred',
      }
      throw new ApiClientError(
        error.message,
        error.code,
        response.status,
        error.details
      )
    }

    if (!response.ok) {
      throw new ApiClientError(
        `HTTP error: ${response.status}`,
        'HTTP_ERROR',
        response.status
      )
    }

    // Return data if ApiResponse format, otherwise return raw data
    return apiResponse.data !== undefined ? apiResponse.data : (data as T)
  },

  /**
   * Delay utility
   */
  delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  },
}

// ============================================
// Error Handling Utilities
// ============================================

/**
 * Get user-friendly error message from error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    return getApiErrorMessage(error.code, error.message)
  }

  if (error instanceof NetworkError) {
    return error.message
  }

  if (error instanceof TimeoutError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return '알 수 없는 오류가 발생했습니다'
}

/**
 * Map API error codes to user-friendly messages
 */
function getApiErrorMessage(code: string, defaultMessage: string): string {
  const messages: Record<string, string> = {
    // Auth errors
    AUTH_ERROR: '인증에 실패했습니다. 다시 로그인해주세요.',
    TOKEN_EXPIRED: '세션이 만료되었습니다. 다시 로그인해주세요.',
    UNAUTHORIZED: '접근 권한이 없습니다.',
    FORBIDDEN: '이 작업을 수행할 권한이 없습니다.',

    // Validation errors
    VALIDATION_ERROR: '입력값을 확인해주세요.',
    INVALID_INPUT: '잘못된 입력입니다.',
    MISSING_FIELD: '필수 항목이 누락되었습니다.',

    // Resource errors
    NOT_FOUND: '요청한 리소스를 찾을 수 없습니다.',
    ALREADY_EXISTS: '이미 존재하는 항목입니다.',
    CONFLICT: '충돌이 발생했습니다. 다시 시도해주세요.',

    // Rate limiting
    RATE_LIMITED: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',

    // Server errors
    INTERNAL_ERROR: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    SERVICE_UNAVAILABLE: '서비스를 일시적으로 사용할 수 없습니다.',

    // Exchange errors
    EXCHANGE_ERROR: '거래소 연결에 문제가 발생했습니다.',
    INSUFFICIENT_BALANCE: '잔액이 부족합니다.',
    ORDER_FAILED: '주문 처리에 실패했습니다.',
  }

  return messages[code] || defaultMessage
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof ApiClientError) {
    return error.isRetryable
  }
  if (error instanceof NetworkError || error instanceof TimeoutError) {
    return true
  }
  return false
}

/**
 * Type guard for ApiClientError
 */
export function isApiError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError
}

/**
 * Type guard for NetworkError
 */
export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError
}

/**
 * Type guard for TimeoutError
 */
export function isTimeoutError(error: unknown): error is TimeoutError {
  return error instanceof TimeoutError
}

