/**
 * Local Data Cache (IndexedDB)
 *
 * Caches API GET responses locally so the app can display data when offline.
 * Each cached entry is keyed by the full URL and stores the response + timestamp.
 */

const DB_NAME = 'brgy-ugong-cache';
const DB_VERSION = 1;
const STORE_NAME = 'api-responses';

export interface CachedResponse {
  url: string;
  data: any;
  timestamp: number;
  /** Max age in seconds before the cache is considered stale (default: 24 hours) */
  maxAge: number;
}

function openCacheDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'url' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Save a GET response to the local cache */
export async function cacheResponse(
  url: string,
  data: any,
  maxAge: number = 86400, // 24 hours default
): Promise<void> {
  try {
    const db = await openCacheDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({
        url,
        data,
        timestamp: Date.now(),
        maxAge,
      } as CachedResponse);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Silently fail — caching is best-effort
  }
}

/** Get a cached response. Returns null if not found or expired. */
export async function getCachedResponse(url: string): Promise<any | null> {
  try {
    const db = await openCacheDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(url);
      req.onsuccess = () => {
        const cached = req.result as CachedResponse | undefined;
        if (!cached) {
          resolve(null);
          return;
        }
        // Check if cache is expired
        const ageMs = Date.now() - cached.timestamp;
        if (ageMs > cached.maxAge * 1000) {
          resolve(null);
          return;
        }
        resolve(cached.data);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

/** Remove a specific cached response */
export async function invalidateCache(url: string): Promise<void> {
  try {
    const db = await openCacheDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(url);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Silently fail
  }
}

/** Clear all cached responses */
export async function clearCache(): Promise<void> {
  try {
    const db = await openCacheDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Silently fail
  }
}

/**
 * Invalidate cache entries that match a URL prefix.
 * Useful after mutations — e.g. after creating a blotter entry,
 * invalidate all "/api/blotter*" cache entries.
 */
export async function invalidateCacheByPrefix(prefix: string): Promise<void> {
  try {
    const db = await openCacheDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.openCursor();
      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor) {
          if ((cursor.value as CachedResponse).url.includes(prefix)) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Silently fail
  }
}
