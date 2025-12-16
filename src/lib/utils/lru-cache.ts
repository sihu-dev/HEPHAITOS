// ============================================
// LRU Cache Implementation
// Simple in-memory cache for agent sessions
// ============================================

interface CacheEntry<T> {
  value: T
  timestamp: number
}

export class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>>
  private maxSize: number
  private ttl: number // Time to live in milliseconds

  constructor(maxSize = 100, ttl = 3600000) { // Default 1 hour TTL
    this.cache = new Map()
    this.maxSize = maxSize
    this.ttl = ttl
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key)
    if (!entry) return undefined

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key)
      return undefined
    }

    // Move to end (most recently used)
    this.cache.delete(key)
    this.cache.set(key, entry)
    return entry.value
  }

  set(key: string, value: T): void {
    // Delete if exists (to update position)
    this.cache.delete(key)

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    })
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }
}

// ============================================
// Agent Cache Factory
// ============================================

export function createAgentCache<T>(maxSize = 50, ttl = 1800000) {
  return new LRUCache<T>(maxSize, ttl) // Default 30 min TTL for agents
}
