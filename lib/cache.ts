// ---------------------------------------------------------------------------
// Simple in-memory TTL cache for serverless function lifetime
// ---------------------------------------------------------------------------

const DEFAULT_TTL_MS = 3_600_000; // 1 hour

interface CacheEntry {
  data: unknown;
  expires: number;
}

const store = new Map<string, CacheEntry>();

export function getCached<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expires) {
    store.delete(key);
    return null;
  }

  return entry.data as T;
}

export function setCache(key: string, data: unknown, ttlMs = DEFAULT_TTL_MS): void {
  store.set(key, { data, expires: Date.now() + ttlMs });
}
