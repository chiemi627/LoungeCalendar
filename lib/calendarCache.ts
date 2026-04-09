// lib/calendarCache.ts

interface CacheData {
  events: any[];
  cachedAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000;

declare global {
  var calendarCache: CacheData | null;
}

if (!global.calendarCache) {
  global.calendarCache = null;
}

export function getCachedData(): CacheData | null {
  const cache = global.calendarCache;
  if (!cache) return null;
  if (Date.now() - cache.cachedAt > CACHE_TTL_MS) {
    global.calendarCache = null;
    return null;
  }
  return cache;
}

export function setCachedData(events: any[]): void {
  global.calendarCache = {
    events,
    cachedAt: Date.now(),
  };
}

export function invalidateCache(): void {
  global.calendarCache = null;
}
