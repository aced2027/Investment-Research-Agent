/**
 * In-memory TTL cache for Finnhub API responses.
 *
 * - Default TTL: 5 minutes (300 000 ms)
 * - Market news cached for 10 minutes
 * - Quotes cached for 30 seconds
 * - Automatically purges expired entries on access
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
  createdAt: number
}

class ApiCache {
  private store = new Map<string, CacheEntry<unknown>>()
  private defaultTtlMs = 5 * 60 * 1000 // 5 minutes
  private purgeIntervalMs = 60 * 1000 // purge every minute

  constructor() {
    // Periodically purge expired entries to prevent memory leaks
    if (typeof globalThis !== 'undefined') {
      const interval = setInterval(() => this.purge(), this.purgeIntervalMs)
      // Allow Node to exit even if interval is active
      if (typeof interval.unref === 'function') interval.unref()
    }
  }

  /** Get a cached value if it exists and hasn't expired */
  get<T>(key: string): T | null {
    const entry = this.store.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }
    return entry.data as T
  }

  /** Store a value with an optional custom TTL */
  set<T>(key: string, data: T, ttlMs?: number): void {
    const ttl = ttlMs ?? this.defaultTtlMs
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttl,
      createdAt: Date.now(),
    })
  }

  /** Invalidate a specific key or all keys matching a prefix */
  invalidate(keyOrPrefix: string): void {
    if (this.store.has(keyOrPrefix)) {
      this.store.delete(keyOrPrefix)
      return
    }
    // If key doesn't exist, try prefix match
    for (const key of this.store.keys()) {
      if (key.startsWith(keyOrPrefix)) {
        this.store.delete(key)
      }
    }
  }

  /** Remove all expired entries */
  private purge(): void {
    const now = Date.now()
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) {
        this.store.delete(key)
      }
    }
  }

  /** Get cache statistics */
  stats() {
    let valid = 0
    let expired = 0
    const now = Date.now()
    for (const entry of this.store.values()) {
      if (now > entry.expiresAt) expired++
      else valid++
    }
    return { total: this.store.size, valid, expired }
  }

  /** Clear all entries */
  clear(): void {
    this.store.clear()
  }
}

// Cache TTL presets (in ms)
export const CACHE_TTL = {
  QUOTE: 30 * 1000,           // 30 seconds — fast-moving data
  PROFILE: 24 * 60 * 60 * 1000, // 24 hours — rarely changes
  MARKET_NEWS: 10 * 60 * 1000,  // 10 minutes
  COMPANY_NEWS: 10 * 60 * 1000, // 10 minutes
  RECOMMENDATION: 60 * 60 * 1000, // 1 hour
  EARNINGS: 60 * 60 * 1000,     // 1 hour
  INSIDER: 60 * 60 * 1000,      // 1 hour
  CANDLE: 5 * 60 * 1000,        // 5 minutes
  SUMMARIZATION: 30 * 60 * 1000, // 30 minutes — AI summaries are expensive
} as const

export const apiCache = new ApiCache()