// ============================================
// Circuit Breaker
// GPT V1 피드백 P0-3: 연속 실패 감지 + 쿨다운
// ============================================

import { getRedisClient } from './client'
import { safeLogger } from '@/lib/utils/safe-logger'

export interface CircuitBreakerConfig {
  failureThreshold: number   // 회로 오픈 전 연속 실패 횟수
  cooldownMs: number         // 회로 오픈 시 대기 시간 (밀리초)
  keyPrefix?: string
}

export type CircuitState = 'closed' | 'open' | 'half-open'

export interface CircuitStatus {
  state: CircuitState
  failures: number
  lastFailure: number | null
  openUntil: number | null
}

/**
 * Redis 기반 Circuit Breaker
 * - closed: 정상 동작
 * - open: 요청 차단 (cooldown 대기)
 * - half-open: 테스트 요청 허용
 */
export class CircuitBreaker {
  private config: CircuitBreakerConfig
  private keyPrefix: string

  constructor(config: CircuitBreakerConfig) {
    this.config = config
    this.keyPrefix = config.keyPrefix || 'circuit'
  }

  private getKey(identifier: string, suffix: string): string {
    return `${this.keyPrefix}:${identifier}:${suffix}`
  }

  /**
   * 현재 회로 상태 확인
   */
  async getStatus(identifier: string): Promise<CircuitStatus> {
    const redis = await getRedisClient()
    const now = Date.now()

    try {
      const [failures, lastFailure, openUntil] = await Promise.all([
        redis.get(this.getKey(identifier, 'failures')),
        redis.get(this.getKey(identifier, 'lastFailure')),
        redis.get(this.getKey(identifier, 'openUntil')),
      ])

      const failureCount = failures ? parseInt(failures, 10) : 0
      const openUntilTs = openUntil ? parseInt(openUntil, 10) : null

      let state: CircuitState = 'closed'
      if (openUntilTs && now < openUntilTs) {
        state = 'open'
      } else if (openUntilTs && now >= openUntilTs) {
        state = 'half-open'
      }

      return {
        state,
        failures: failureCount,
        lastFailure: lastFailure ? parseInt(lastFailure, 10) : null,
        openUntil: openUntilTs,
      }
    } catch (error) {
      safeLogger.error('[CircuitBreaker] Redis error', { error })
      return {
        state: 'closed',
        failures: 0,
        lastFailure: null,
        openUntil: null,
      }
    }
  }

  /**
   * 요청 허용 여부 확인
   */
  async isAllowed(identifier: string): Promise<boolean> {
    const status = await this.getStatus(identifier)

    if (status.state === 'open') {
      safeLogger.warn('[CircuitBreaker] Request blocked - circuit open', {
        identifier,
        openUntil: status.openUntil,
      })
      return false
    }

    return true
  }

  /**
   * 성공 기록 - 실패 카운터 리셋
   */
  async recordSuccess(identifier: string): Promise<void> {
    const redis = await getRedisClient()

    try {
      await Promise.all([
        redis.del(this.getKey(identifier, 'failures')),
        redis.del(this.getKey(identifier, 'lastFailure')),
        redis.del(this.getKey(identifier, 'openUntil')),
      ])

      safeLogger.debug('[CircuitBreaker] Success recorded, circuit reset', { identifier })
    } catch (error) {
      safeLogger.error('[CircuitBreaker] Redis error on success', { error })
    }
  }

  /**
   * 실패 기록 - threshold 도달 시 회로 오픈
   */
  async recordFailure(identifier: string): Promise<CircuitStatus> {
    const redis = await getRedisClient()
    const now = Date.now()

    try {
      // 실패 카운터 증가
      const failures = await redis.incr(this.getKey(identifier, 'failures'))

      // TTL 설정 (cooldown 시간의 2배)
      const ttlSecs = Math.ceil((this.config.cooldownMs * 2) / 1000)
      await redis.expire(this.getKey(identifier, 'failures'), ttlSecs)

      // 마지막 실패 시간 기록
      await redis.set(this.getKey(identifier, 'lastFailure'), now.toString(), 'EX', ttlSecs)

      // threshold 도달 시 회로 오픈
      if (failures >= this.config.failureThreshold) {
        const openUntil = now + this.config.cooldownMs
        await redis.set(
          this.getKey(identifier, 'openUntil'),
          openUntil.toString(),
          'EX',
          Math.ceil(this.config.cooldownMs / 1000) + 60
        )

        safeLogger.warn('[CircuitBreaker] Circuit opened', {
          identifier,
          failures,
          cooldownMs: this.config.cooldownMs,
        })

        return {
          state: 'open',
          failures,
          lastFailure: now,
          openUntil,
        }
      }

      return {
        state: 'closed',
        failures,
        lastFailure: now,
        openUntil: null,
      }
    } catch (error) {
      safeLogger.error('[CircuitBreaker] Redis error on failure', { error })
      return {
        state: 'closed',
        failures: 0,
        lastFailure: null,
        openUntil: null,
      }
    }
  }

  /**
   * 수동 회로 리셋
   */
  async reset(identifier: string): Promise<void> {
    const redis = await getRedisClient()

    await Promise.all([
      redis.del(this.getKey(identifier, 'failures')),
      redis.del(this.getKey(identifier, 'lastFailure')),
      redis.del(this.getKey(identifier, 'openUntil')),
    ])

    safeLogger.info('[CircuitBreaker] Circuit manually reset', { identifier })
  }
}

// ============================================
// Pre-configured Circuit Breakers
// ============================================

// 외부 API 호출용 (5번 연속 실패 -> 30초 쿨다운)
export const externalApiCircuit = new CircuitBreaker({
  failureThreshold: 5,
  cooldownMs: 30 * 1000,
  keyPrefix: 'cb:external',
})

// 결제 API용 (3번 연속 실패 -> 60초 쿨다운)
export const paymentCircuit = new CircuitBreaker({
  failureThreshold: 3,
  cooldownMs: 60 * 1000,
  keyPrefix: 'cb:payment',
})

// AI API용 (5번 연속 실패 -> 120초 쿨다운)
export const aiCircuit = new CircuitBreaker({
  failureThreshold: 5,
  cooldownMs: 120 * 1000,
  keyPrefix: 'cb:ai',
})

// 증권사 API용 (3번 연속 실패 -> 30초 쿨다운)
export const brokerCircuit = new CircuitBreaker({
  failureThreshold: 3,
  cooldownMs: 30 * 1000,
  keyPrefix: 'cb:broker',
})

// ============================================
// Helper Functions
// ============================================

/**
 * Circuit Breaker 응답 생성
 */
export function createCircuitOpenResponse(): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: '서비스가 일시적으로 불안정합니다. 잠시 후 다시 시도해주세요.',
      },
    }),
    {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '30',
      },
    }
  )
}

/**
 * Circuit Breaker와 함께 비동기 작업 실행
 */
export async function withCircuitBreaker<T>(
  circuit: CircuitBreaker,
  identifier: string,
  fn: () => Promise<T>
): Promise<T> {
  const allowed = await circuit.isAllowed(identifier)
  if (!allowed) {
    throw new Error('CIRCUIT_OPEN')
  }

  try {
    const result = await fn()
    await circuit.recordSuccess(identifier)
    return result
  } catch (error) {
    await circuit.recordFailure(identifier)
    throw error
  }
}
