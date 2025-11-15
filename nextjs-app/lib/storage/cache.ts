import { storage } from './localStorage';

const CACHE_PREFIX = 'cache_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export const cache = {
  get: <T>(key: string): T | null => {
    const entry = storage.get<CacheEntry<T>>(`${CACHE_PREFIX}${key}`);

    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      storage.remove(`${CACHE_PREFIX}${key}`);
      return null;
    }

    return entry.data;
  },

  set: <T>(key: string, data: T, ttl: number = DEFAULT_TTL): void => {
    const entry: CacheEntry<T> = {
      data,
      expiresAt: Date.now() + ttl,
    };
    storage.set(`${CACHE_PREFIX}${key}`, entry);
  },

  remove: (key: string): void => {
    storage.remove(`${CACHE_PREFIX}${key}`);
  },

  clear: (): void => {
    if (typeof window === 'undefined') return;
    Object.keys(localStorage)
      .filter(key => key.startsWith(CACHE_PREFIX))
      .forEach(key => localStorage.removeItem(key));
  },

  invalidatePattern: (pattern: string): void => {
    if (typeof window === 'undefined') return;
    Object.keys(localStorage)
      .filter(key => key.startsWith(CACHE_PREFIX) && key.includes(pattern))
      .forEach(key => localStorage.removeItem(key));
  },
};
