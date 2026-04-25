/**
 * Network Status Context
 *
 * Provides real-time online/offline awareness to the entire app.
 * Automatically triggers sync when connectivity is restored.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import {
  syncPendingRequests,
  onSyncStatusChange,
  getPendingCount,
  type SyncStatus,
  type SyncResult,
} from '../service/offline';
import { syncResidentsForOffline } from '../service/offline/residentDb';

interface NetworkContextType {
  /** Whether the browser currently has network connectivity */
  isOnline: boolean;
  /** Current sync status: idle | syncing | error | success */
  syncStatus: SyncStatus;
  /** Number of pending offline requests waiting to sync */
  pendingCount: number;
  /** Last sync result */
  lastSyncResult: SyncResult | null;
  /** Manually trigger a sync */
  triggerSync: () => Promise<void>;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);

  // Refresh pending count
  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await getPendingCount();
      setPendingCount(count);
    } catch {
      // IndexedDB might not be available
    }
  }, []);

  // Trigger sync — only when authenticated
  const triggerSync = useCallback(async () => {
    if (!navigator.onLine) return;
    if (!localStorage.getItem('token')) return; // skip sync when not logged in
    const result = await syncPendingRequests();
    setLastSyncResult(result);
    await refreshPendingCount();
    // Also sync residents for offline autofill
    await syncResidentsForOffline();
  }, [refreshPendingCount]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when coming back online (small delay to let connection stabilize)
      setTimeout(() => {
        triggerSync();
      }, 1500);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [triggerSync]);

  // Listen for sync status changes
  useEffect(() => {
    const unsub = onSyncStatusChange((status, result) => {
      setSyncStatus(status);
      if (result) setLastSyncResult(result);
      refreshPendingCount();
    });
    return unsub;
  }, [refreshPendingCount]);

  // Refresh pending count on mount and periodically
  // Also auto-sync on mount if we start online with pending items
  useEffect(() => {
    let mounted = true;
    const hasToken = !!localStorage.getItem('token');

    const init = async () => {
      const count = await getPendingCount().catch(() => 0);
      if (!mounted) return;
      setPendingCount(count);

      // Skip all sync logic when not authenticated (e.g. login page)
      if (!hasToken) return;
      
      // If we start the app and we're online and have pending items, sync them!
      if (count > 0 && navigator.onLine) {
        setTimeout(() => triggerSync(), 1000);
      } else if (count === 0 && navigator.onLine) {
        // If there are no pending requests in DB but we are online, ensure the local storage cache is clear
        try {
          const { clearPendingEntries } = await import('../service/fetchInterceptor');
          clearPendingEntries();
        } catch {
          // Ignore error
        }
        
        // Even if no pending edits, sync latest residents for offline autofill
        setTimeout(() => syncResidentsForOffline(), 2000);
      }
    };
    
    init();
    const interval = setInterval(refreshPendingCount, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [triggerSync, refreshPendingCount]);

  // Listen for custom events dispatched by apiClient when a request is queued
  useEffect(() => {
    const handler = () => refreshPendingCount();
    window.addEventListener('offline-request-queued', handler);
    return () => window.removeEventListener('offline-request-queued', handler);
  }, [refreshPendingCount]);

  return (
    <NetworkContext.Provider
      value={{ isOnline, syncStatus, pendingCount, lastSyncResult, triggerSync }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNetwork() {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}
