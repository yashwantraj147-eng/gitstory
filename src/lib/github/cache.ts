interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  lastAccessed: number;
}

export class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private maxItems: number;
  private defaultTtlMs: number;

  constructor(options?: { maxItems?: number; defaultTtlMs?: number }) {
    this.maxItems = options?.maxItems ?? 100;
    // Default TTL: 30 minutes
    this.defaultTtlMs = options?.defaultTtlMs ?? 30 * 60 * 1000;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    entry.lastAccessed = now;
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttlMs ?? this.defaultTtlMs);

    // Evict oldest if reaching capacity
    if (this.cache.size >= this.maxItems && !this.cache.has(key)) {
      let oldestKey: string | null = null;
      let oldestAccess = Infinity;

      for (const [k, v] of this.cache.entries()) {
        if (v.lastAccessed < oldestAccess) {
          oldestAccess = v.lastAccessed;
          oldestKey = k;
        }
      }

      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      value,
      expiresAt,
      lastAccessed: now,
    });
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Global cache singleton across Next.js API invocations
declare global {
  // eslint-disable-next-line no-var
  var __gitstory_cache: MemoryCache | undefined;
}

export const repoCache = globalThis.__gitstory_cache ?? new MemoryCache();

if (process.env.NODE_ENV !== "production") {
  globalThis.__gitstory_cache = repoCache;
}

