/**
 * Sync Manager
 *
 * Replays queued offline requests when connectivity is restored.
 * Processes requests sequentially (FIFO) to preserve order.
 * After sync, dispatches events so the app refreshes its data from the server.
 */

import {
  getAllPendingRequests,
  removePendingRequest,
  updateRetryCount,
  getPendingCount,
  type PendingRequest,
} from './offlineDb';
import { clearCache } from './localCache';

import { getOriginalFetch, clearPendingEntries } from '../fetchInterceptor';

const MAX_RETRIES = 5;

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';

export interface SyncResult {
  synced: number;
  failed: number;
  remaining: number;
}

type SyncListener = (status: SyncStatus, result?: SyncResult) => void;

const listeners = new Set<SyncListener>();
let currentStatus: SyncStatus = 'idle';
let isSyncing = false;

/** Subscribe to sync status changes */
export function onSyncStatusChange(listener: SyncListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners(status: SyncStatus, result?: SyncResult) {
  currentStatus = status;
  listeners.forEach((l) => l(status, result));
}

export function getSyncStatus(): SyncStatus {
  return currentStatus;
}

/** Attempt to replay a single request */
async function replayRequest(req: PendingRequest): Promise<boolean> {
  try {
    const rawFetch = getOriginalFetch();
    const response = await rawFetch(req.url, {
      method: req.method,
      headers: req.headers,
      body: req.body || undefined,
    });

    if (response.ok) {
      return true;
    }

    // 4xx errors (client errors) — no point retrying except 408, 429
    if (response.status >= 400 && response.status < 500) {
      if (response.status === 408 || response.status === 429) {
        return false; // worth retrying
      }
      console.warn(
        `[SyncManager] Request to ${req.endpoint} returned ${response.status}, removing from queue.`,
      );
      return true; // remove from queue, won't succeed on retry
    }

    return false;
  } catch {
    return false; // network error, keep for retry
  }
}

/** Process the entire pending queue */
export async function syncPendingRequests(): Promise<SyncResult> {
  if (isSyncing) {
    return { synced: 0, failed: 0, remaining: await getPendingCount() };
  }

  isSyncing = true;
  notifyListeners('syncing');

  let synced = 0;
  let failed = 0;

  try {
    const pending = await getAllPendingRequests();

    if (pending.length === 0) {
      try {
        clearPendingEntries();
      } catch {
        // ignore
      }
      notifyListeners('idle');
      isSyncing = false;
      return { synced: 0, failed: 0, remaining: 0 };
    }

    for (const req of pending) {
      const success = await replayRequest(req);

      if (success) {
        await removePendingRequest(req.id!);
        synced++;
      } else {
        const newRetryCount = req.retryCount + 1;
        if (newRetryCount >= MAX_RETRIES) {
          console.warn(
            `[SyncManager] Max retries reached for ${req.endpoint}, removing.`,
          );
          await removePendingRequest(req.id!);
          failed++;
        } else {
          await updateRetryCount(req.id!, newRetryCount);
          failed++;
        }
      }
    }

    const remaining = await getPendingCount();
    const result: SyncResult = { synced, failed, remaining };

    // If we synced anything, clear the local cache so fresh data is fetched
    if (synced > 0) {
      await clearCache().catch(() => {});
      
      // If no remaining pending items in IndexedDB queue, 
      // clear the mock offline entries from localStorage
      if (remaining === 0) {
        try {
          clearPendingEntries();
          console.log('[SyncManager] Cleared mock offline entries from localStorage.');
        } catch {
          // ignore
        }
      }

      // Dispatch event so pages know to refresh their data from the server
      window.dispatchEvent(new CustomEvent('offline-sync-complete', {
        detail: result,
      }));
    }

    notifyListeners(
      failed > 0 && synced === 0 ? 'error' : 'success',
      result,
    );

    // Auto-reset status after a delay
    setTimeout(() => {
      if (currentStatus === 'success') {
        notifyListeners('idle');
      }
    }, 5000);

    return result;
  } catch (err) {
    console.error('[SyncManager] Sync failed:', err);
    notifyListeners('error');
    return {
      synced,
      failed,
      remaining: await getPendingCount().catch(() => 0),
    };
  } finally {
    isSyncing = false;
  }
}
