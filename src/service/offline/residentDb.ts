import { getResidentTable, type PersonSearchResponseDTO, type ResidentSummary } from '../blotter-api/Resident';

const DB_NAME = 'brgy-ugong-residents';
const DB_VERSION = 1;
const STORE_NAME = 'offline-residents';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // We'll use residentId as the key
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        // Create an index on fullName for searching
        store.createIndex('searchName', 'searchName', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function parseFullName(fullName: string) {
  let firstName = fullName;
  let lastName = '';
  
  if (fullName.includes(',')) {
    const parts = fullName.split(',');
    lastName = parts[0].trim();
    firstName = parts[1].trim();
  } else {
    const parts = fullName.split(' ');
    lastName = parts.length > 1 ? parts.pop() || '' : '';
    firstName = parts.join(' ');
  }

  return { firstName, lastName };
}

/**
 * Downloads all residents from the table endpoint and stores them in IndexedDB.
 */
export async function syncResidentsForOffline(): Promise<void> {
  try {
    // Skip sync if not authenticated or token is expired
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const base64Url = token.split('.')[1];
      const payload = JSON.parse(atob(base64Url.replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.exp < Date.now() / 1000) return; // token expired, skip sync
    } catch {
      return; // malformed token, skip sync
    }

    // We request the table without search params to get all (or the first page if backend is paginated, 
    // but ideally the backend supports no pagination for this or has a high limit).
    // Use any because the backend might return an array or a paginated envelope
    const rawResponse: any = await getResidentTable();
    
    let summaries: ResidentSummary[] = [];
    if (Array.isArray(rawResponse)) {
      summaries = rawResponse;
    } else if (rawResponse && Array.isArray(rawResponse.content)) {
      summaries = rawResponse.content;
    } else if (rawResponse && Array.isArray(rawResponse.data)) {
      summaries = rawResponse.data;
    }

    console.log('[ResidentDB] Synced residents:', summaries.length);

    if (summaries.length === 0) return;

    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    // Clear existing cache before inserting
    store.clear();

    for (const r of summaries) {
      const { firstName, lastName } = parseFullName(r.fullName || '');
      
      const record: PersonSearchResponseDTO & { searchName: string } = {
        id: r.residentId,
        firstName,
        lastName,
        middleName: '',
        contactNumber: r.contactNumber || '',
        age: 0,
        birthDate: '',
        gender: '',
        civilStatus: '',
        email: '',
        completeAddress: '', // Let the user fill this manually if offline
        isResident: true,
        barangayIdNumber: r.barangayIdNumber || null,
        // searchName is lowercased for case-insensitive offline search
        searchName: (r.fullName || '').toLowerCase()
      };
      
      store.put(record);
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Failed to sync offline residents:', err);
  }
}

/**
 * Searches the offline IndexedDB for residents matching the query.
 */
export async function searchOfflineResidents(query: string): Promise<PersonSearchResponseDTO[]> {
  if (!query || query.trim().length < 2) return [];
  
  const searchLower = query.trim().toLowerCase();
  const db = await openDb();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const allRecords = request.result as (PersonSearchResponseDTO & { searchName: string })[];
      
      const filtered = allRecords
        .filter(r => r.searchName.includes(searchLower))
        .map(r => {
          // Remove the internal searchName field before returning
          const { searchName, ...dto } = r;
          return dto as PersonSearchResponseDTO;
        });

      // Limit results to top 10
      resolve(filtered.slice(0, 10));
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves residents fetched during online search to the IndexedDB cache.
 * This ensures the cache is continuously updated without waiting for a full sync.
 */
export async function cacheOnlineResidents(residents: PersonSearchResponseDTO[]): Promise<void> {
  if (!residents || residents.length === 0) return;

  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    for (const r of residents) {
      const searchName = `${r.firstName} ${r.lastName} ${r.middleName || ''}`.toLowerCase().trim();
      const record: PersonSearchResponseDTO & { searchName: string } = {
        ...r,
        searchName
      };
      // put will overwrite if the ID already exists, keeping it fresh!
      store.put(record);
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('[ResidentDB] Failed to cache online residents:', err);
  }
}
