/**
 * Offline Queue Database (IndexedDB)
 * 
 * Stores pending API requests made while offline.
 * When the app comes back online, these are replayed in order.
 */

const DB_NAME = 'brgy-ugong-offline';
const DB_VERSION = 1;
const STORE_NAME = 'pending-requests';

export interface PendingRequest {
  id?: number;
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  timestamp: number;
  endpoint: string;       // friendly label, e.g. "/blotter/entry"
  description: string;    // human-readable, e.g. "New Blotter Entry"
  retryCount: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Add a request to the offline queue */
export async function addPendingRequest(
  req: Omit<PendingRequest, 'id'>,
): Promise<number> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const addReq = store.add(req);
    addReq.onsuccess = () => resolve(addReq.result as number);
    addReq.onerror = () => reject(addReq.error);
  });
}

/** Get all pending requests ordered by timestamp */
export async function getAllPendingRequests(): Promise<PendingRequest[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.getAll();
    getReq.onsuccess = () => {
      const results = (getReq.result as PendingRequest[]).sort(
        (a, b) => a.timestamp - b.timestamp,
      );
      resolve(results);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

/** Remove a request from the queue after successful sync */
export async function removePendingRequest(id: number): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const delReq = store.delete(id);
    delReq.onsuccess = () => resolve();
    delReq.onerror = () => reject(delReq.error);
  });
}

/** Update retry count for a failed sync attempt */
export async function updateRetryCount(
  id: number,
  retryCount: number,
): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const record = getReq.result;
      if (record) {
        record.retryCount = retryCount;
        store.put(record);
      }
      resolve();
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

/** Get count of pending requests */
export async function getPendingCount(): Promise<number> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const countReq = store.count();
    countReq.onsuccess = () => resolve(countReq.result);
    countReq.onerror = () => reject(countReq.error);
  });
}

/** Clear all pending requests */
export async function clearAllPending(): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const clearReq = store.clear();
    clearReq.onsuccess = () => resolve();
    clearReq.onerror = () => reject(clearReq.error);
  });
}
