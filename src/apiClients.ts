import { addPendingRequest } from './service/offline/offlineDb';
import { cacheResponse, getCachedResponse, invalidateCacheByPrefix } from './service/offline/localCache';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

/** HTTP methods that mutate data and should be queued when offline */
const MUTABLE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * Extract the API "module" from the endpoint for cache invalidation.
 * e.g. "/api/blotter/entries" → "/api/blotter"
 */
function getEndpointModule(endpoint: string): string {
  const parts = endpoint.split('/').filter(Boolean);
  // Return first 2 segments like "api/blotter"
  return '/' + parts.slice(0, 2).join('/');
}

interface ApiOptions {
  requiresAuth?: boolean;
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string | number | boolean>;
  /** Human-readable description for the offline queue, e.g. "New Blotter Entry" */
  offlineDescription?: string;
  /** If false, don't queue this request when offline (default: true for mutations) */
  offlineQueue?: boolean;
  /** Cache duration for GET requests in seconds (default: 86400 = 24 hours) */
  cacheDuration?: number;
  /** If false, skip caching for this GET request */
  useCache?: boolean;
}

export const apiClient = async (endpoint: string, options: ApiOptions = {}) => {
  const {
    requiresAuth = true,
    headers = {},
    body,
    method = "GET",
    params,
    offlineDescription,
    offlineQueue = true,
    cacheDuration = 86400,
    useCache = true,
  } = options;

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  // --- 1. TOKEN VALIDATION LOGIC ---
  if (requiresAuth) {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(atob(base64));
        const currentTime = Date.now() / 1000;

        if (payload.exp < currentTime) {
          localStorage.removeItem("token");
          throw new Error("Session expired. Please login again.");
        }
      } catch (e: any) {
        if (e.message.includes("expired")) throw e;
        localStorage.removeItem("token");
        throw new Error("Invalid session. Please login again.");
      }
      requestHeaders["Authorization"] = `Bearer ${token}`;
    } else {
      throw new Error("No authentication token found. Please login.");
    }
  }

  // --- 2. QUERY PARAMETERS HANDLER ---
  let url = `${BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  // --- 3. FETCH EXECUTION ---
  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body !== undefined && body !== null ? JSON.stringify(body) : undefined,
    });

    // Handle non-OK responses
    if (!response.ok) {
      let errorMessage = `Error ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        const text = await response.text();
        if (text) errorMessage = text;
      }

      if (response.status === 401 && !endpoint.includes("/auth/login")) {
        localStorage.removeItem("token");
      }
      throw new Error(errorMessage);
    }

    // Handle response content type
    const contentType = response.headers.get("content-type");
    let data: any;
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // --- 4. CACHE GET RESPONSES for offline use ---
    if (method.toUpperCase() === 'GET' && useCache) {
      cacheResponse(url, data, cacheDuration).catch(() => {});
    }

    // --- 5. INVALIDATE related cache after successful mutations ---
    if (MUTABLE_METHODS.includes(method.toUpperCase())) {
      const modulePrefix = getEndpointModule(endpoint);
      invalidateCacheByPrefix(modulePrefix).catch(() => {});
    }

    return data;

  } catch (error: any) {

    // --- 6. OFFLINE: Serve cached data for GET requests ---
    if (error.message === "Failed to fetch" && method.toUpperCase() === 'GET' && useCache) {
      const cached = await getCachedResponse(url);
      if (cached !== null) {
        // Mark the response so components can show "cached data" indicator if needed
        if (typeof cached === 'object' && cached !== null) {
          cached._fromCache = true;
          cached._cachedAt = Date.now();
        }
        return cached;
      }
      // No cache available — throw a user-friendly error
      throw new Error("You are offline and no cached data is available for this page. Please connect to the internet to load data.");
    }

    // --- 7. OFFLINE QUEUE: intercept network failures for mutations ---
    if (
      error.message === "Failed to fetch" &&
      MUTABLE_METHODS.includes(method.toUpperCase()) &&
      offlineQueue
    ) {
      // Queue the request for later sync
      try {
        await addPendingRequest({
          url,
          method: method.toUpperCase(),
          headers: requestHeaders,
          body: body !== undefined && body !== null ? JSON.stringify(body) : undefined,
          timestamp: Date.now(),
          endpoint,
          description: offlineDescription || `${method.toUpperCase()} ${endpoint}`,
          retryCount: 0,
        });

        // Notify the NetworkContext to update pending count
        window.dispatchEvent(new CustomEvent('offline-request-queued'));

        // Return a synthetic success so the UI doesn't break
        return {
          _offline: true,
          _message: 'Saved offline. Will sync when connection is restored.',
        };
      } catch (queueError) {
        console.error('[Offline Queue] Failed to queue request:', queueError);
      }
    }

    if (error.message === "Failed to fetch") {
      throw new Error("Server is unreachable. Please check your connection.");
    }
    throw error;
  }
};

// --- 8. EXPORTED API WRAPPERS ---
export const api = {
  get: (url: string, options?: ApiOptions) =>
    apiClient(url, { ...options, method: "GET" }),

  post: (url: string, data?: any, options?: ApiOptions) =>
    apiClient(url, { ...options, method: "POST", body: data }),

  put: (url: string, data?: any, options?: ApiOptions) =>
    apiClient(url, { ...options, method: "PUT", body: data }),

  delete: (url: string, options?: ApiOptions) =>
    apiClient(url, { ...options, method: "DELETE" }),
};