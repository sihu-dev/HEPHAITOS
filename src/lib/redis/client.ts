// ============================================
// Redis Client
// Production용 Redis 연결 관리
// ============================================

import { getRedisConfig } from '@/lib/config/env'
import { safeLogger } from '@/lib/utils/safe-logger'

// Redis 클라이언트 타입 (ioredis 호환)
export interface RedisClientType {
  get(key: string): Promise<string | null>
  set(key: string, value: string, mode?: string, duration?: number): Promise<string | null>
  setex(key: string, seconds: number, value: string): Promise<string>
  del(key: string | string[]): Promise<number>
  incr(key: string): Promise<number>
  expire(key: string, seconds: number): Promise<number>
  ttl(key: string): Promise<number>
  exists(key: string | string[]): Promise<number>
  keys(pattern: string): Promise<string[]>
  mget(...keys: string[]): Promise<(string | null)[]>
  mset(...keysAndValues: string[]): Promise<string>
  hget(key: string, field: string): Promise<string | null>
  hset(key: string, field: string, value: string): Promise<number>
  hdel(key: string, ...fields: string[]): Promise<number>
  hgetall(key: string): Promise<Record<string, string>>
  sadd(key: string, ...members: string[]): Promise<number>
  smembers(key: string): Promise<string[]>
  srem(key: string, ...members: string[]): Promise<number>
  ping(): Promise<string>
  quit(): Promise<string>
}

// 메모리 기반 fallback (Redis 없을 때 사용)
class InMemoryRedis implements RedisClientType {
  private store = new Map<string, { value: string; expiresAt?: number }>()
  private hashStore = new Map<string, Map<string, string>>()
  private setStore = new Map<string, Set<string>>()

  private isExpired(key: string): boolean {
    const item = this.store.get(key)
    if (!item) return true
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key)
      return true
    }
    return false
  }

  async get(key: string): Promise<string | null> {
    if (this.isExpired(key)) return null
    return this.store.get(key)?.value ?? null
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<string | null> {
    const expiresAt = mode === 'EX' && duration ? Date.now() + duration * 1000 : undefined
    this.store.set(key, { value, expiresAt })
    return 'OK'
  }

  async setex(key: string, seconds: number, value: string): Promise<string> {
    this.store.set(key, { value, expiresAt: Date.now() + seconds * 1000 })
    return 'OK'
  }

  async del(key: string | string[]): Promise<number> {
    const keys = Array.isArray(key) ? key : [key]
    let deleted = 0
    for (const k of keys) {
      if (this.store.delete(k)) deleted++
      this.hashStore.delete(k)
      this.setStore.delete(k)
    }
    return deleted
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key)
    const value = (parseInt(current || '0', 10) || 0) + 1
    const existing = this.store.get(key)
    this.store.set(key, { value: String(value), expiresAt: existing?.expiresAt })
    return value
  }

  async expire(key: string, seconds: number): Promise<number> {
    const item = this.store.get(key)
    if (!item) return 0
    item.expiresAt = Date.now() + seconds * 1000
    return 1
  }

  async ttl(key: string): Promise<number> {
    const item = this.store.get(key)
    if (!item || !item.expiresAt) return -1
    const remaining = Math.ceil((item.expiresAt - Date.now()) / 1000)
    return remaining > 0 ? remaining : -2
  }

  async exists(key: string | string[]): Promise<number> {
    const keys = Array.isArray(key) ? key : [key]
    return keys.filter(k => !this.isExpired(k)).length
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'))
    const result: string[] = []
    for (const key of this.store.keys()) {
      if (!this.isExpired(key) && regex.test(key)) {
        result.push(key)
      }
    }
    return result
  }

  async mget(...keys: string[]): Promise<(string | null)[]> {
    return Promise.all(keys.map(k => this.get(k)))
  }

  async mset(...keysAndValues: string[]): Promise<string> {
    for (let i = 0; i < keysAndValues.length; i += 2) {
      await this.set(keysAndValues[i], keysAndValues[i + 1])
    }
    return 'OK'
  }

  async hget(key: string, field: string): Promise<string | null> {
    return this.hashStore.get(key)?.get(field) ?? null
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    if (!this.hashStore.has(key)) {
      this.hashStore.set(key, new Map())
    }
    const isNew = !this.hashStore.get(key)!.has(field)
    this.hashStore.get(key)!.set(field, value)
    return isNew ? 1 : 0
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    const hash = this.hashStore.get(key)
    if (!hash) return 0
    let deleted = 0
    for (const field of fields) {
      if (hash.delete(field)) deleted++
    }
    return deleted
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    const hash = this.hashStore.get(key)
    if (!hash) return {}
    return Object.fromEntries(hash)
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    if (!this.setStore.has(key)) {
      this.setStore.set(key, new Set())
    }
    const set = this.setStore.get(key)!
    let added = 0
    for (const member of members) {
      if (!set.has(member)) {
        set.add(member)
        added++
      }
    }
    return added
  }

  async smembers(key: string): Promise<string[]> {
    return Array.from(this.setStore.get(key) ?? [])
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    const set = this.setStore.get(key)
    if (!set) return 0
    let removed = 0
    for (const member of members) {
      if (set.delete(member)) removed++
    }
    return removed
  }

  async ping(): Promise<string> {
    return 'PONG'
  }

  async quit(): Promise<string> {
    this.store.clear()
    this.hashStore.clear()
    this.setStore.clear()
    return 'OK'
  }
}

// Redis 클라이언트 싱글톤
let redisClient: RedisClientType | null = null
let isRedisAvailable = false

/**
 * Redis 클라이언트 가져오기 (lazy initialization)
 * Redis가 없으면 메모리 기반 fallback 반환
 */
export async function getRedisClient(): Promise<RedisClientType> {
  if (redisClient) {
    return redisClient
  }

  const config = getRedisConfig()

  if (!config) {
    safeLogger.info('[Redis] No REDIS_URL configured, using in-memory fallback')
    redisClient = new InMemoryRedis()
    return redisClient
  }

  try {
    // 동적 import로 ioredis 로드 (설치된 경우에만)
    const Redis = (await import('ioredis')).default
    const client = new Redis(config.url, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      lazyConnect: true,
    })

    await client.ping()
    isRedisAvailable = true
    safeLogger.info('[Redis] Connected successfully')

    redisClient = client as unknown as RedisClientType
    return redisClient
  } catch (error) {
    safeLogger.warn('[Redis] Failed to connect, using in-memory fallback', { error })
    redisClient = new InMemoryRedis()
    return redisClient
  }
}

/**
 * Redis 사용 가능 여부 확인
 */
export function isRedisConnected(): boolean {
  return isRedisAvailable
}

/**
 * Redis 연결 종료
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.quit()
    redisClient = null
    isRedisAvailable = false
  }
}

export { InMemoryRedis }
