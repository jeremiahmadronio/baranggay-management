/**
 * Permission Cache
 *
 * Caches user permissions in localStorage so they persist offline.
 * Each module's getMyAccess() should use this wrapper.
 */

const PERMISSION_CACHE_KEY = "cached_user_permissions";

export interface CachedPermission {
  userId: string;
  username: string;
  role: string;
  department: string;
  permissions: string[];
  cachedAt: number;
}

/** Save permissions to localStorage */
export function cachePermissions(data: CachedPermission): void {
  try {
    localStorage.setItem(
      PERMISSION_CACHE_KEY,
      JSON.stringify({ ...data, cachedAt: Date.now() }),
    );
  } catch {
    /* quota exceeded */
  }
}

/** Get cached permissions from localStorage */
export function getCachedPermissions(): CachedPermission | null {
  try {
    const cached = localStorage.getItem(PERMISSION_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

/**
 * Wraps a permission fetch function with offline caching.
 * - Online: fetches from server, caches result
 * - Offline: returns cached permissions
 */
export async function fetchPermissionsWithCache<T extends CachedPermission>(
  fetchFn: () => Promise<T>,
): Promise<T> {
  try {
    const data = await fetchFn();
    // Cache on success
    cachePermissions(data);
    return data;
  } catch (err: any) {
    // If fetch failed (offline), return cached
    if (
      err.message?.includes("Failed to fetch") ||
      err.message?.includes("unreachable") ||
      err.message?.includes("offline") ||
      err.message?.includes("NetworkError")
    ) {
      const cached = getCachedPermissions();
      if (cached) {
        console.log("[Permissions] Using cached permissions (offline)");
        return cached as T;
      }
    }
    throw err;
  }
}
