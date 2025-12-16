// ============================================
// Safe Logger - API 키 마스킹 유틸리티
// 민감한 정보가 로그에 노출되지 않도록 보호
// ============================================

// 민감한 필드 패턴
const SENSITIVE_PATTERNS = [
  // API Keys
  /apiKey/i,
  /api_key/i,
  /appKey/i,
  /app_key/i,
  /appSecret/i,
  /app_secret/i,
  /secretKey/i,
  /secret_key/i,
  /accessToken/i,
  /access_token/i,
  /refreshToken/i,
  /refresh_token/i,
  /bearer/i,
  /authorization/i,
  /password/i,
  /passwd/i,
  /credential/i,
  /billingKey/i,
  /billing_key/i,
  /private_key/i,
  /privateKey/i,
  /webhook_secret/i,
  /webhookSecret/i,
]

// 값 패턴 (API 키 형태의 문자열)
const VALUE_PATTERNS = [
  // JWT 토큰
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*/g,
  // 일반적인 API 키 형태 (32자 이상의 영숫자)
  /[A-Za-z0-9]{32,}/g,
  // sk_, pk_, test_ 등으로 시작하는 키
  /(sk_|pk_|test_|live_)[A-Za-z0-9]+/g,
]

/**
 * 문자열 마스킹 (앞 4자, 뒤 4자만 표시)
 */
function maskString(value: string): string {
  if (!value || value.length <= 8) {
    return '***'
  }
  return `${value.slice(0, 4)}...${value.slice(-4)}`
}

/**
 * 필드명이 민감한 정보인지 확인
 */
function isSensitiveKey(key: string): boolean {
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(key))
}

/**
 * 값에서 민감한 패턴을 마스킹
 */
function maskSensitiveValues(value: string): string {
  let masked = value
  for (const pattern of VALUE_PATTERNS) {
    masked = masked.replace(pattern, match => maskString(match))
  }
  return masked
}

/**
 * 객체에서 민감한 정보를 재귀적으로 마스킹
 */
export function maskSensitiveData(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data
  }

  if (typeof data === 'string') {
    return maskSensitiveValues(data)
  }

  if (Array.isArray(data)) {
    return data.map(item => maskSensitiveData(item))
  }

  if (typeof data === 'object') {
    const masked: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (isSensitiveKey(key)) {
        masked[key] = typeof value === 'string' ? maskString(value) : '***'
      } else if (typeof value === 'object') {
        masked[key] = maskSensitiveData(value)
      } else if (typeof value === 'string') {
        masked[key] = maskSensitiveValues(value)
      } else {
        masked[key] = value
      }
    }
    return masked
  }

  return data
}

/**
 * 헤더에서 민감한 정보 마스킹
 */
export function maskHeaders(headers: Record<string, string>): Record<string, string> {
  const masked: Record<string, string> = {}
  for (const [key, value] of Object.entries(headers)) {
    if (isSensitiveKey(key)) {
      masked[key] = maskString(value)
    } else {
      masked[key] = maskSensitiveValues(value)
    }
  }
  return masked
}

/**
 * 안전한 로깅 함수
 */
export const safeLogger = {
  log: (message: string, data?: unknown) => {
    console.log(message, data ? maskSensitiveData(data) : '')
  },

  info: (message: string, data?: unknown) => {
    console.info(message, data ? maskSensitiveData(data) : '')
  },

  warn: (message: string, data?: unknown) => {
    console.warn(message, data ? maskSensitiveData(data) : '')
  },

  error: (message: string, data?: unknown) => {
    console.error(message, data ? maskSensitiveData(data) : '')
  },

  debug: (message: string, data?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(message, data ? maskSensitiveData(data) : '')
    }
  },
}

/**
 * API 요청 로깅 (민감 정보 제외)
 */
export function logApiRequest(
  method: string,
  url: string,
  options?: {
    headers?: Record<string, string>
    body?: unknown
  }
) {
  const logData: Record<string, unknown> = {
    method,
    url: maskSensitiveValues(url),
    timestamp: new Date().toISOString(),
  }

  if (options?.headers) {
    logData.headers = maskHeaders(options.headers)
  }

  if (options?.body) {
    logData.body = maskSensitiveData(options.body)
  }

  safeLogger.info('[API Request]', logData)
}

/**
 * API 응답 로깅 (민감 정보 제외)
 */
export function logApiResponse(
  status: number,
  url: string,
  data?: unknown,
  duration?: number
) {
  const logData: Record<string, unknown> = {
    status,
    url: maskSensitiveValues(url),
    timestamp: new Date().toISOString(),
  }

  if (duration !== undefined) {
    logData.duration = `${duration}ms`
  }

  if (data) {
    logData.data = maskSensitiveData(data)
  }

  if (status >= 400) {
    safeLogger.error('[API Response Error]', logData)
  } else {
    safeLogger.info('[API Response]', logData)
  }
}

export default safeLogger
