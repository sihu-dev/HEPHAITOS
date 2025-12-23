// ============================================
// Environment Variable Validation
// 환경변수 유효성 검증 및 타입 안전 접근
// ============================================

import { z } from 'zod'
import { safeLogger } from '@/lib/utils/safe-logger';

// ============================================
// Schema Definitions
// ============================================

/**
 * 서버 전용 환경변수 스키마
 */
const serverEnvSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  // AI Services
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),

  // Korea Market - 한국투자증권
  KIS_APP_KEY: z.string().min(1).optional(),
  KIS_APP_SECRET: z.string().min(1).optional(),
  KIS_ACCOUNT_NUMBER: z.string().optional(),
  KIS_ACCOUNT_PRODUCT_CODE: z.string().default('01'),
  KIS_VIRTUAL: z.enum(['true', 'false']).default('true'),

  // US Market - Polygon.io
  POLYGON_API_KEY: z.string().min(1).optional(),
  POLYGON_PLAN: z.enum(['basic', 'starter', 'developer', 'advanced']).default('basic'),

  // Payments - Toss Payments
  TOSS_CLIENT_KEY: z.string().min(1).optional(),
  TOSS_SECRET_KEY: z.string().min(1).optional(),
  TOSS_WEBHOOK_SECRET: z.string().min(1).optional(),
  TOSS_TEST: z.enum(['true', 'false']).default('true'),

  // Crypto Exchanges
  BINANCE_API_KEY: z.string().min(1).optional(),
  BINANCE_API_SECRET: z.string().min(1).optional(),
  UPBIT_API_KEY: z.string().min(1).optional(),
  UPBIT_API_SECRET: z.string().min(1).optional(),

  // App Config
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),

  // Feature Flags
  NEXT_PUBLIC_USE_SUPABASE: z.enum(['true', 'false']).default('false'),

  // Redis (Phase 2)
  REDIS_URL: z.string().url().optional(),

  // Sentry (Phase 2)
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().min(1).optional(),
})

/**
 * 클라이언트 전용 환경변수 스키마
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_USE_SUPABASE: z.enum(['true', 'false']).default('false'),
  NEXT_PUBLIC_TOSS_CLIENT_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
})

// ============================================
// Type Exports
// ============================================

export type ServerEnv = z.infer<typeof serverEnvSchema>
export type ClientEnv = z.infer<typeof clientEnvSchema>

// ============================================
// Validation Functions
// ============================================

/**
 * 서버 환경변수 검증 및 반환
 */
export function validateServerEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse(process.env)

  if (!result.success) {
    safeLogger.error('❌ Invalid server environment variables:')
    safeLogger.error(result.error.flatten().fieldErrors)

    // Development에서는 경고만, Production에서는 에러
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid server environment variables')
    }
  }

  return result.data ?? (process.env as unknown as ServerEnv)
}

/**
 * 클라이언트 환경변수 검증 및 반환
 */
export function validateClientEnv(): ClientEnv {
  const clientEnv = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_USE_SUPABASE: process.env.NEXT_PUBLIC_USE_SUPABASE,
    NEXT_PUBLIC_TOSS_CLIENT_KEY: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  }

  const result = clientEnvSchema.safeParse(clientEnv)

  if (!result.success) {
    safeLogger.error('❌ Invalid client environment variables:')
    safeLogger.error(result.error.flatten().fieldErrors)
  }

  return result.data ?? (clientEnv as unknown as ClientEnv)
}

// ============================================
// Service-specific Validators
// ============================================

/**
 * Claude API 환경변수 검증
 */
export function requireClaudeConfig(): { apiKey: string } {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY is not configured. ' +
      'Please set it in your .env file or environment variables.'
    )
  }

  return { apiKey }
}

/**
 * KIS (한국투자증권) 환경변수 검증
 */
export function requireKISConfig(): {
  appKey: string
  appSecret: string
  accountNumber: string
  accountProductCode: string
  isVirtual: boolean
} {
  const appKey = process.env.KIS_APP_KEY
  const appSecret = process.env.KIS_APP_SECRET
  const accountNumber = process.env.KIS_ACCOUNT_NUMBER

  if (!appKey || !appSecret) {
    throw new Error(
      'KIS API credentials are not configured. ' +
      'Please set KIS_APP_KEY and KIS_APP_SECRET in your .env file.'
    )
  }

  return {
    appKey,
    appSecret,
    accountNumber: accountNumber || '',
    accountProductCode: process.env.KIS_ACCOUNT_PRODUCT_CODE || '01',
    isVirtual: process.env.KIS_VIRTUAL === 'true',
  }
}

/**
 * Polygon.io 환경변수 검증
 */
export function requirePolygonConfig(): {
  apiKey: string
  plan: 'basic' | 'starter' | 'developer' | 'advanced'
} {
  const apiKey = process.env.POLYGON_API_KEY

  if (!apiKey) {
    throw new Error(
      'POLYGON_API_KEY is not configured. ' +
      'Please set it in your .env file or environment variables.'
    )
  }

  const plan = (process.env.POLYGON_PLAN as 'basic' | 'starter' | 'developer' | 'advanced') || 'basic'

  return { apiKey, plan }
}

/**
 * Toss Payments 환경변수 검증
 */
export function requireTossConfig(): {
  clientKey: string
  secretKey: string
  isTest: boolean
} {
  const clientKey = process.env.TOSS_CLIENT_KEY
  const secretKey = process.env.TOSS_SECRET_KEY

  if (!clientKey || !secretKey) {
    throw new Error(
      'Toss Payments credentials are not configured. ' +
      'Please set TOSS_CLIENT_KEY and TOSS_SECRET_KEY in your .env file.'
    )
  }

  return {
    clientKey,
    secretKey,
    isTest: process.env.TOSS_TEST === 'true',
  }
}

/**
 * Supabase 환경변수 검증
 */
export function requireSupabaseConfig(): {
  url: string
  anonKey: string
  serviceRoleKey?: string
} {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !anonKey) {
    throw new Error(
      'Supabase credentials are not configured. ' +
      'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    )
  }

  return {
    url,
    anonKey,
    serviceRoleKey,
  }
}

/**
 * Redis 환경변수 검증 (Phase 2)
 */
export function requireRedisConfig(): { url: string } {
  const url = process.env.REDIS_URL

  if (!url) {
    throw new Error(
      'REDIS_URL is not configured. ' +
      'Please set it in your .env file for production rate limiting.'
    )
  }

  return { url }
}

/**
 * Redis 환경변수 (옵션 - 없으면 메모리 fallback)
 */
export function getRedisConfig(): { url: string } | null {
  const url = process.env.REDIS_URL
  return url ? { url } : null
}

/**
 * Sentry 환경변수 검증 (Phase 2)
 */
export function getSentryConfig(): { dsn: string; authToken?: string } | null {
  const dsn = process.env.SENTRY_DSN

  if (!dsn) {
    return null
  }

  return {
    dsn,
    authToken: process.env.SENTRY_AUTH_TOKEN,
  }
}

// ============================================
// Safe Getters (Optional Configs)
// ============================================

/**
 * 선택적 환경변수 가져오기 (없으면 undefined)
 */
export const optionalEnv = {
  get anthropicApiKey(): string | undefined {
    return process.env.ANTHROPIC_API_KEY
  },

  get kisAppKey(): string | undefined {
    return process.env.KIS_APP_KEY
  },

  get polygonApiKey(): string | undefined {
    return process.env.POLYGON_API_KEY
  },

  get tossSecretKey(): string | undefined {
    return process.env.TOSS_SECRET_KEY
  },

  get redisUrl(): string | undefined {
    return process.env.REDIS_URL
  },

  get sentryDsn(): string | undefined {
    return process.env.SENTRY_DSN
  },
}

// ============================================
// Environment Checks
// ============================================

export const envChecks = {
  /** 개발 환경인지 */
  isDev: process.env.NODE_ENV === 'development',

  /** 프로덕션 환경인지 */
  isProd: process.env.NODE_ENV === 'production',

  /** 테스트 환경인지 */
  isTest: process.env.NODE_ENV === 'test',

  /** Supabase 사용 여부 */
  useSupabase: process.env.NEXT_PUBLIC_USE_SUPABASE === 'true',

  /** KIS API 설정 여부 */
  hasKIS: Boolean(process.env.KIS_APP_KEY && process.env.KIS_APP_SECRET),

  /** Polygon API 설정 여부 */
  hasPolygon: Boolean(process.env.POLYGON_API_KEY),

  /** Toss Payments 설정 여부 */
  hasToss: Boolean(process.env.TOSS_CLIENT_KEY && process.env.TOSS_SECRET_KEY),

  /** Claude API 설정 여부 */
  hasClaude: Boolean(process.env.ANTHROPIC_API_KEY),

  /** Redis 설정 여부 */
  hasRedis: Boolean(process.env.REDIS_URL),

  /** Sentry 설정 여부 */
  hasSentry: Boolean(process.env.SENTRY_DSN),
}

// ============================================
// Masked Config for Logging (보안)
// ============================================

/**
 * 로깅용 마스킹된 환경변수
 */
export function getMaskedEnvStatus(): Record<string, string> {
  const mask = (value: string | undefined): string => {
    if (!value) return '❌ Not Set'
    if (value.length <= 8) return '✅ Set (***)'
    return `✅ Set (${value.slice(0, 4)}...${value.slice(-4)})`
  }

  return {
    ANTHROPIC_API_KEY: mask(process.env.ANTHROPIC_API_KEY),
    KIS_APP_KEY: mask(process.env.KIS_APP_KEY),
    KIS_APP_SECRET: mask(process.env.KIS_APP_SECRET),
    POLYGON_API_KEY: mask(process.env.POLYGON_API_KEY),
    TOSS_CLIENT_KEY: mask(process.env.TOSS_CLIENT_KEY),
    TOSS_SECRET_KEY: mask(process.env.TOSS_SECRET_KEY),
    SUPABASE_URL: mask(process.env.NEXT_PUBLIC_SUPABASE_URL),
    REDIS_URL: mask(process.env.REDIS_URL),
    SENTRY_DSN: mask(process.env.SENTRY_DSN),
  }
}
