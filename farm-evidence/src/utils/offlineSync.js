/**
 * Offline Sync Queue
 * Handles offline data queuing and automatic sync when connection is restored.
 * Per Section 19.3 of the specification.
 */

const DB_NAME = 'FarmEvidenceDB';
const DB_VERSION = 1;
const SYNC_QUEUE_STORE = 'sync_queue';

/**
 * Opens IndexedDB connection
 * Creates necessary stores if they don't exist
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      
      // Sync queue store: pending requests to flush when online
      if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
        db.createObjectStore(SYNC_QUEUE_STORE, { keyPath: 'id', autoIncrement: true });
      }
      
      // Cache stores for offline reads
      if (!db.objectStoreNames.contains('plots_cache')) {
        db.createObjectStore('plots_cache', { keyPath: '_id' });
      }
      
      if (!db.objectStoreNames.contains('trials_cache')) {
        db.createObjectStore('trials_cache', { keyPath: '_id' });
      }
    };
    
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(new Error(`IndexedDB open failed: ${e.target.error}`));
  });
}

/**
 * Queues a request for later sync
 * Called when offline or to ensure retry capability
 * 
 * @param {string} url - API endpoint URL
 * @param {string} method - HTTP method (POST, PUT, PATCH, DELETE)
 * @param {object} body - Request body to be stringified
 * @returns {Promise<number>} ID of queued request
 */
export async function queueRequest(url, method, body) {
  try {
    const db = await openDB();
    const transaction = db.transaction(SYNC_QUEUE_STORE, 'readwrite');
    const store = transaction.objectStore(SYNC_QUEUE_STORE);
    
    const request = {
      url,
      method,
      body: JSON.stringify(body),
      timestamp: Date.now(),
      status: 'pending',
      retries: 0
    };
    
    return new Promise((resolve, reject) => {
      const req = store.add(request);
      req.onsuccess = () => {
        console.log(`[OfflineSync] Queued ${method} ${url} (ID: ${req.result})`);
        resolve(req.result);
      };
      req.onerror = () => reject(new Error('Failed to queue request'));
    });
  } catch (error) {
    console.error('[OfflineSync] Error queuing request:', error);
    throw error;
  }
}

/**
 * Flushes all pending requests in the sync queue
 * Attempts to send each pending request; marks as synced or failed
 * Called automatically when online, or can be called manually
 */
export async function flushQueue() {
  try {
    const db = await openDB();
    const transaction = db.transaction(SYNC_QUEUE_STORE, 'readwrite');
    const store = transaction.objectStore(SYNC_QUEUE_STORE);
    
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      
      req.onsuccess = async () => {
        const allItems = req.result;
        const pendingItems = allItems.filter(item => item.status === 'pending');
        
        if (pendingItems.length === 0) {
          console.log('[OfflineSync] No pending requests to flush');
          resolve([]);
          return;
        }
        
        console.log(`[OfflineSync] Flushing ${pendingItems.length} pending requests...`);
        
        const results = [];
        
        for (const item of pendingItems) {
          try {
            const response = await fetch(item.url, {
              method: item.method,
              headers: {
                'Content-Type': 'application/json'
              },
              body: item.body
            });
            
            if (response.ok) {
              // Mark as synced
              await new Promise((resolveUpdate, rejectUpdate) => {
                const updateReq = store.put({ ...item, status: 'synced', syncedAt: Date.now() });
                updateReq.onsuccess = () => resolveUpdate();
                updateReq.onerror = () => rejectUpdate();
              });
              
              console.log(`[OfflineSync] ✓ ${item.method} ${item.url}`);
              results.push({ id: item.id, status: 'synced', url: item.url });
            } else {
              // Mark as failed
              await new Promise((resolveUpdate, rejectUpdate) => {
                const updateReq = store.put({ 
                  ...item, 
                  status: 'failed', 
                  failedAt: Date.now(),
                  statusCode: response.status,
                  error: response.statusText
                });
                updateReq.onsuccess = () => resolveUpdate();
                updateReq.onerror = () => rejectUpdate();
              });
              
              console.warn(`[OfflineSync] ✗ ${item.method} ${item.url} (${response.status})`);
              results.push({ id: item.id, status: 'failed', url: item.url, statusCode: response.status });
            }
          } catch (error) {
            // Network error or fetch failed
            await new Promise((resolveUpdate, rejectUpdate) => {
              const updateReq = store.put({
                ...item,
                status: 'failed',
                failedAt: Date.now(),
                error: error.message,
                retries: (item.retries || 0) + 1
              });
              updateReq.onsuccess = () => resolveUpdate();
              updateReq.onerror = () => rejectUpdate();
            });
            
            console.error(`[OfflineSync] ✗ ${item.method} ${item.url} - ${error.message}`);
            results.push({ id: item.id, status: 'failed', url: item.url, error: error.message });
          }
        }
        
        resolve(results);
      };
      
      req.onerror = () => reject(new Error('Failed to fetch queue items'));
    });
  } catch (error) {
    console.error('[OfflineSync] Error flushing queue:', error);
    throw error;
  }
}

/**
 * Returns all queued requests (pending, synced, and failed)
 */
export async function getQueueStatus() {
  try {
    const db = await openDB();
    const transaction = db.transaction(SYNC_QUEUE_STORE, 'readonly');
    const store = transaction.objectStore(SYNC_QUEUE_STORE);
    
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(new Error('Failed to get queue status'));
    });
  } catch (error) {
    console.error('[OfflineSync] Error getting queue status:', error);
    throw error;
  }
}

/**
 * Clears synced items from the queue (cleanup)
 */
export async function clearSyncedItems() {
  try {
    const db = await openDB();
    const transaction = db.transaction(SYNC_QUEUE_STORE, 'readwrite');
    const store = transaction.objectStore(SYNC_QUEUE_STORE);
    
    const status = await getQueueStatus();
    const syncedIds = status
      .filter(item => item.status === 'synced')
      .map(item => item.id);
    
    return new Promise((resolve, reject) => {
      let deleteCount = 0;
      
      for (const id of syncedIds) {
        const req = store.delete(id);
        req.onsuccess = () => {
          deleteCount++;
          if (deleteCount === syncedIds.length) {
            resolve(deleteCount);
          }
        };
        req.onerror = () => reject(new Error(`Failed to delete synced item ${id}`));
      }
      
      if (syncedIds.length === 0) {
        resolve(0);
      }
    });
  } catch (error) {
    console.error('[OfflineSync] Error clearing synced items:', error);
    throw error;
  }
}

/**
 * Initializes network status listeners
 * Automatically flushes queue when connection is restored
 * Should be called once on app initialization
 */
export function initSyncListener() {
  window.addEventListener('online', () => {
    console.log('[OfflineSync] Connection restored — flushing sync queue...');
    flushQueue()
      .then((results) => {
        const synced = results.filter(r => r.status === 'synced').length;
        const failed = results.filter(r => r.status === 'failed').length;
        console.log(`[OfflineSync] Sync complete: ${synced} synced, ${failed} failed`);
        
        // Dispatch custom event for UI to react
        window.dispatchEvent(new CustomEvent('syncComplete', { 
          detail: { synced, failed, results } 
        }));
      })
      .catch(error => console.error('[OfflineSync] Sync failed:', error));
  });
  
  window.addEventListener('offline', () => {
    console.log('[OfflineSync] Connection lost — queuing mode enabled');
    window.dispatchEvent(new CustomEvent('offline'));
  });
  
  // Check initial state
  if (!navigator.onLine) {
    console.log('[OfflineSync] App initialized offline');
  }
}

/**
 * Wraps an API function with offline detection
 * If offline, queues the request and returns a mock response
 * If online, executes the API function normally
 * 
 * @param {string} url - API endpoint URL
 * @param {string} method - HTTP method
 * @param {object} body - Request body
 * @param {Function} apiFn - Async function to execute if online
 * @returns {Promise<object>} API response or mock offline response
 */
export async function wrapWithOffline(url, method = 'POST', body = {}, apiFn) {
  if (!navigator.onLine) {
    console.log(`[OfflineSync] Offline — queuing ${method} ${url}`);
    await queueRequest(url, method, body);
    return {
      data: {
        ...body,
        _offline: true,
        _queued: true,
        _timestamp: Date.now()
      }
    };
  }
  
  try {
    return await apiFn();
  } catch (error) {
    // If API call fails while online, optionally queue it for retry
    console.error(`[OfflineSync] API call failed: ${error.message}`);
    throw error;
  }
}

/**
 * Caches a response for offline availability
 * Stores in IndexedDB cache store (plots_cache, trials_cache, etc.)
 */
export async function cacheResponse(storeName, data) {
  try {
    const db = await openDB();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      // If data is an array, store each item
      if (Array.isArray(data)) {
        let stored = 0;
        for (const item of data) {
          const req = store.put(item);
          req.onsuccess = () => {
            stored++;
            if (stored === data.length) {
              resolve(stored);
            }
          };
          req.onerror = () => reject(new Error(`Failed to cache ${storeName}`));
        }
        if (data.length === 0) {
          resolve(0);
        }
      } else {
        const req = store.put(data);
        req.onsuccess = () => resolve(1);
        req.onerror = () => reject(new Error(`Failed to cache ${storeName}`));
      }
    });
  } catch (error) {
    console.error(`[OfflineSync] Error caching to ${storeName}:`, error);
    throw error;
  }
}

/**
 * Retrieves cached data from IndexedDB
 */
export async function getCachedData(storeName, key) {
  try {
    const db = await openDB();
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const req = key ? store.get(key) : store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(new Error(`Failed to get cached ${storeName}`));
    });
  } catch (error) {
    console.error(`[OfflineSync] Error retrieving cache from ${storeName}:`, error);
    throw error;
  }
}

export default {
  queueRequest,
  flushQueue,
  getQueueStatus,
  clearSyncedItems,
  initSyncListener,
  wrapWithOffline,
  cacheResponse,
  getCachedData
};
