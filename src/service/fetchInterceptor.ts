/**
 * Global Fetch Interceptor for Offline-First
 *
 * Patches window.fetch to:
 * 1. Cache ALL GET /api/* responses in localStorage
 * 2. Serve cached responses when offline
 * 3. Queue mutation requests (POST/PUT/PATCH/DELETE) when offline
 * 4. Inject offline-created entries into cached table data
 *
 * This ensures ALL API calls work offline, regardless of which
 * module's apiFetch function makes the call.
 */

import { addPendingRequest } from './offline/offlineDb';

const CACHE_PREFIX = 'api_cache_';
const PENDING_ENTRIES_KEY = 'offline_pending_entries';
const MAX_CACHE_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const MUTATION_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

interface CachedEntry {
  data: string;
  timestamp: number;
  contentType: string;
}

interface PendingLocalEntry {
  id: string;          // temporary local ID
  module: string;      // e.g., 'ftjs', 'blotter', 'vawc'
  tableEntry: any;     // data formatted for the table
  formData: any;       // original form data
  createdAt: number;
  endpoint: string;    // the POST endpoint used
}

// Maps POST endpoints to { module, listEndpointPattern, transformer }
// This allows us to inject offline entries into the correct cached table data
const POST_TO_TABLE_MAP: {
  postPattern: RegExp;
  module: string;
  listEndpointSubstring: string;
  transformer: (body: any, tempId: string) => any;
}[] = [
  {
    postPattern: /\/api\/v1\/ftjs\/entry/,
    module: 'ftjs',
    listEndpointSubstring: '/api/v1/ftjs/summary',
    transformer: (body: any, tempId: string) => ({
      id: tempId,
      trackingNumber: `OFFLINE-${tempId.slice(0, 8).toUpperCase()}`,
      fullName: `${body.firstName || ''} ${body.lastName || ''}`.trim(),
      issuanceCount: 1,
      status: 'PENDING_SYNC',
      dateSubmitted: new Date().toISOString().split('T')[0],
      isResident: !!body.resident_id,
      _offline: true,
    }),
  },
  {
    postPattern: /\/api\/v1\/blotter\/complaint-entry/,
    module: 'blotter',
    listEndpointSubstring: '/api/v1/blotter/summary',
    transformer: (body: any, tempId: string) => ({
      id: tempId,
      caseNumber: `OFFLINE-${tempId.slice(0, 8).toUpperCase()}`,
      complainantName: `${body.complainantFirstName || ''} ${body.complainantLastName || ''}`.trim(),
      respondentName: `${body.respondentFirstName || ''} ${body.respondentLastName || ''}`.trim(),
      status: 'PENDING_SYNC',
      dateFiled: new Date().toISOString().split('T')[0],
      _offline: true,
    }),
  },
  {
    postPattern: /\/api\/v1\/vawc\/complaint-entry/,
    module: 'vawc',
    listEndpointSubstring: '/api/v1/vawc/case-summary',
    transformer: (body: any, tempId: string) => ({
      id: tempId,
      caseNumber: `OFFLINE-${tempId.slice(0, 8).toUpperCase()}`,
      victimFullName: `${body.complainantFirstName || ''} ${body.complainantLastName || ''}`.trim(),
      violenceTypes: '',
      status: 'PENDING_SYNC',
      dateFiled: new Date().toISOString().split('T')[0],
      assignedOfficer: 'Pending',
      _offline: true,
    }),
  },
];

function generateTempId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function getCacheKey(url: string): string {
  return CACHE_PREFIX + url;
}

function saveToCache(url: string, data: string, contentType: string): void {
  try {
    const entry: CachedEntry = {
      data,
      timestamp: Date.now(),
      contentType,
    };
    localStorage.setItem(getCacheKey(url), JSON.stringify(entry));
  } catch {
    evictOldestCacheEntries();
  }
}

function getFromCache(url: string): CachedEntry | null {
  try {
    const raw = localStorage.getItem(getCacheKey(url));
    if (!raw) return null;
    const entry: CachedEntry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > MAX_CACHE_AGE_MS) {
      localStorage.removeItem(getCacheKey(url));
      return null;
    }
    return entry;
  } catch {
    return null;
  }
}

function evictOldestCacheEntries(): void {
  try {
    const cacheKeys: { key: string; timestamp: number }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        try {
          const entry: CachedEntry = JSON.parse(localStorage.getItem(key) || '');
          cacheKeys.push({ key, timestamp: entry.timestamp });
        } catch {
          localStorage.removeItem(key!);
        }
      }
    }
    cacheKeys.sort((a, b) => a.timestamp - b.timestamp);
    const toRemove = Math.max(1, Math.floor(cacheKeys.length * 0.25));
    for (let i = 0; i < toRemove; i++) {
      localStorage.removeItem(cacheKeys[i].key);
    }
  } catch {
    // Ignore
  }
}

function isApiUrl(url: string): boolean {
  return url.includes('/api/');
}

function getEndpointFromUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname + u.search;
  } catch {
    return url;
  }
}

// --- Pending entries management ---

function getPendingEntries(): PendingLocalEntry[] {
  try {
    const raw = localStorage.getItem(PENDING_ENTRIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePendingEntry(entry: PendingLocalEntry): void {
  try {
    const entries = getPendingEntries();
    entries.push(entry);
    localStorage.setItem(PENDING_ENTRIES_KEY, JSON.stringify(entries));
  } catch {
    // localStorage full
  }
}

/**
 * Inject offline-created entries into cached GET data for tables.
 * When a component fetches table data, the cached response will
 * include any entries created offline.
 */
function injectPendingEntriesIntoCache(url: string, cachedData: string): string {
  try {
    const pending = getPendingEntries();
    if (!pending.length) return cachedData;

    const endpoint = getEndpointFromUrl(url);
    const matchingEntries = pending.filter((e) => {
      const mapping = POST_TO_TABLE_MAP.find(m => m.module === e.module);
      if (mapping && mapping.listEndpointSubstring) {
        return url.includes(mapping.listEndpointSubstring);
      }
      return endpoint.includes(e.module) && url.includes(e.module);
    });

    if (!matchingEntries.length) return cachedData;

    let parsed = JSON.parse(cachedData);

    // Handle array responses (e.g., FTJS summary)
    if (Array.isArray(parsed)) {
      const offlineItems = matchingEntries.map((e) => e.tableEntry);
      return JSON.stringify([...offlineItems, ...parsed]);
    }

    // Handle paginated responses (e.g., { content: [...], ... })
    if (parsed.content && Array.isArray(parsed.content)) {
      const offlineItems = matchingEntries.map((e) => e.tableEntry);
      parsed.content = [...offlineItems, ...parsed.content];
      if (parsed.totalElements != null) {
        parsed.totalElements += offlineItems.length;
      }
      return JSON.stringify(parsed);
    }

    return cachedData;
  } catch {
    return cachedData;
  }
}

let _originalFetch: typeof fetch | null = null;

export function getOriginalFetch() {
  return _originalFetch || window.fetch;
}

/**
 * Install the global fetch interceptor.
 * Call this once at app startup (in main.tsx).
 */
export function installFetchInterceptor(): void {
  const originalFetch = window.fetch;
  _originalFetch = originalFetch;

  window.fetch = async function (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    const url = typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;

    const method = (init?.method || 'GET').toUpperCase();

    // Only intercept API calls
    if (!isApiUrl(url)) {
      return originalFetch(input, init);
    }

    // --- HELPER: Fetch with Timeout for unstable networks ---
    const fetchWithTimeout = async (url: RequestInfo | URL, options?: RequestInit) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 6000); // 6-second timeout for unstable connections
      try {
        const response = await originalFetch(url, {
          ...options,
          signal: controller.signal
        });
        clearTimeout(id);
        return response;
      } catch (error: any) {
        clearTimeout(id);
        if (error.name === 'AbortError') {
          throw new Error('Network timeout - unstable connection');
        }
        throw error;
      }
    };

    // --- GET REQUESTS: Cache & Serve from cache ---
    if (method === 'GET') {
      try {
        const response = await fetchWithTimeout(input, init);

        // Cache successful responses
        if (response.ok) {
          const cloned = response.clone();
          const contentType = cloned.headers.get('content-type') || '';
          const body = await cloned.text();
          saveToCache(url, body, contentType);
        }

        return response;
      } catch (err: any) {
        // Check if this is a GET request for a specific offline pending entry
        const pending = getPendingEntries();
        const pendingMatch = pending.find(p => url.includes(p.id));
        
        if (pendingMatch) {
          console.log(`[Offline] Generating synthetic response for pending entry: ${pendingMatch.id}`);
          
          // Timeline and Notes endpoints should return empty arrays for new offline entries
          if (url.includes('/view-timeline/') || url.includes('/view-notes/')) {
            return new Response(JSON.stringify([]), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          
          // Details endpoint returns the combined form data and table entry
          const detailData = {
            ...pendingMatch.tableEntry,
            ...pendingMatch.formData,
            id: pendingMatch.id, // Ensure id is the local string ID
            _offline: true,
          };
          
          return new Response(JSON.stringify(detailData), {
            status: 200,
            statusText: 'OK (from offline pending)',
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Network error — serve from cache
        const cached = getFromCache(url);
        if (cached) {
          console.log(`[Offline] Serving cached: ${getEndpointFromUrl(url)}`);
          // Inject pending offline entries into table data
          const enrichedData = injectPendingEntriesIntoCache(url, cached.data);
          return new Response(enrichedData, {
            status: 200,
            statusText: 'OK (from offline cache)',
            headers: {
              'Content-Type': cached.contentType || 'application/json',
              'X-From-Cache': 'true',
            },
          });
        }

        // No cache — return sensible empty data instead of throwing
        // This prevents error modals when offline and page was never visited online
        const endpoint = getEndpointFromUrl(url);
        console.log(`[Offline] No cache for: ${endpoint} — returning empty data`);

        // Determine what kind of data this endpoint returns
        const isPermissionEndpoint = /\/my-access/.test(endpoint);
        // Stats endpoints are flat objects
        const isStatsEndpoint = /\/(stats|archive-stats|vawc-stats)$/.test(endpoint);
        // Paged endpoints return { content: [], totalElements: 0, ... }
        let isPagedEndpoint = /\/(table|archive-table|case-summary|admin-table|record-table)/.test(endpoint);

        // Many dashboard/report endpoints return arrays
        let isListEndpoint = /\/(list|search|options|notes|timeline|recent-issues|last-6-months|last-week|replacements|documents|history|recent-cases|cases|members|lupon|trend|nature|distribution|category|recent|distribution-status)/.test(endpoint);

        // FTJS uses flat arrays instead of PagedResponse for its tables
        if (endpoint.includes('/ftjs/')) {
          if (/\/(summary|archive-table)/.test(endpoint)) {
            isPagedEndpoint = false;
            isListEndpoint = true;
          }
        }
        
        // Lupon summary is paged
        if (endpoint.includes('/lupon/') && endpoint.includes('/summary')) {
          isPagedEndpoint = true;
          isListEndpoint = false;
        }

        let fallbackData: string;
        if (isPermissionEndpoint) {
          // Try to get cached permissions from any module
          const permKeys = ['cached_permissions_ftjs', 'cached_permissions_blotter', 'cached_permissions_vawc', 'cached_permissions_clearance', 'cached_permissions_lupon', 'cached_permissions_admin'];
          let permData: any = null;
          for (const key of permKeys) {
            const cached = localStorage.getItem(key);
            if (cached) { permData = JSON.parse(cached); break; }
          }
          fallbackData = JSON.stringify(permData || { userId: '', username: '', role: '', department: '', permissions: [] });
        } else if (isPagedEndpoint) {
          fallbackData = JSON.stringify({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 });
        } else if (isListEndpoint) {
          fallbackData = JSON.stringify([]);
        } else if (isStatsEndpoint) {
          fallbackData = JSON.stringify({
            totalCertificatesIssued: 0, totalCertificatedThisMonth: 0,
            originalIssuances: 0, reIssuances: 0,
            totalCases: 0, totalClose: 0, totalExpiringSoon: 0, totalPending: 0,
            totalArchive: 0, totalArchiveThisMonth: 0, totalArchiveResident: 0, totalArchiveNonResident: 0,
          });
        } else {
          fallbackData = JSON.stringify({});
        }

        // Inject any pending offline entries
        const enrichedFallback = injectPendingEntriesIntoCache(url, fallbackData);
        return new Response(enrichedFallback, {
          status: 200,
          statusText: 'OK (offline empty)',
          headers: {
            'Content-Type': 'application/json',
            'X-From-Cache': 'true',
            'X-Offline-Empty': 'true',
          },
        });
      }
    } // <-- Missing closing brace for if (method === 'GET')

    // --- MUTATION REQUESTS: Queue when offline ---
    if (MUTATION_METHODS.includes(method)) {
      try {
        return await fetchWithTimeout(input, init);
      } catch (err: any) {
        if (err.message?.includes('Failed to fetch') || err.message?.includes('unreachable') || err.message?.includes('NetworkError') || err.message?.includes('Network timeout')) {
          // Queue for later sync
          const headers: Record<string, string> = {};
          if (init?.headers) {
            if (init.headers instanceof Headers) {
              init.headers.forEach((v, k) => { headers[k] = v; });
            } else if (Array.isArray(init.headers)) {
              init.headers.forEach(([k, v]) => { headers[k] = v; });
            } else {
              Object.assign(headers, init.headers);
            }
          }

          const endpoint = getEndpointFromUrl(url);
          const bodyStr = init?.body as string || '';

          try {
            await addPendingRequest({
              url,
              method,
              headers,
              body: bodyStr || undefined,
              timestamp: Date.now(),
              endpoint,
              description: `${method} ${endpoint}`,
              retryCount: 0,
            });

            // If this is a POST that creates a new entry,
            // also save it as a pending local entry for table display
            if (method === 'POST' && bodyStr) {
              try {
                const bodyData = JSON.parse(bodyStr);
                const mapping = POST_TO_TABLE_MAP.find((m) =>
                  m.postPattern.test(url),
                );
                if (mapping) {
                  const tempId = generateTempId();
                  const tableEntry = mapping.transformer(bodyData, tempId);
                  savePendingEntry({
                    id: tempId,
                    module: mapping.module,
                    tableEntry,
                    formData: bodyData,
                    createdAt: Date.now(),
                    endpoint: url,
                  });
                  console.log(`[Offline] Saved local entry for ${mapping.module} table`);
                }
              } catch {
                // Not JSON body or no mapping — skip
              }
            }

            window.dispatchEvent(new CustomEvent('offline-request-queued'));
            console.log(`[Offline] Queued: ${method} ${endpoint}`);

            // Return synthetic success response as plain text
            // (many API handlers expect string responses, not JSON)
            return new Response(
              'Saved offline — will sync when back online.',
              {
                status: 200,
                statusText: 'OK (queued offline)',
                headers: { 'Content-Type': 'text/plain' },
              },
            );
          } catch (queueErr) {
            console.error('[Offline] Failed to queue:', queueErr);
          }
        }

        throw err;
      }
    }

    // All other methods — pass through
    return originalFetch(input, init);
  };

  console.log('[Offline] Fetch interceptor installed — all API calls are now cached for offline use.');
}

/**
 * Clear all cached API responses from localStorage.
 */
export function clearApiCache(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(CACHE_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

/**
 * Clear pending local entries after sync.
 */
export function clearPendingEntries(): void {
  localStorage.removeItem(PENDING_ENTRIES_KEY);
}

/**
 * Get count of pending offline entries.
 */
export function getPendingEntryCount(): number {
  try {
    const raw = localStorage.getItem(PENDING_ENTRIES_KEY);
    return raw ? JSON.parse(raw).length : 0;
  } catch {
    return 0;
  }
}
