/**
 * Professional Offline Manager
 * Manages the persistent queue for bookings made while offline.
 * Modernized TypeScript implementation for Kambata Travel Field-Resilience.
 */

export interface BookingDraft {
  id?: number;
  tourId: string;
  scheduleId: string;
  partySize: number;
  totalPrice: number;
  createdAt: string;
  status: 'draft' | 'syncing' | 'failed';
  error?: string;
}

class OfflineManager {
  private dbName = 'KambataTravelOffineDB';
  private storeName = 'bookings-queue';
  private db: IDBDatabase | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private async init(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('IndexedDB Error:', (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  /**
   * Saves a booking attempt to the local queue.
   */
  async saveBookingDraft(booking: Omit<BookingDraft, 'createdAt' | 'status'>): Promise<boolean> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) return reject("DB not initialized");
      
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const draft: BookingDraft = {
        ...booking,
        createdAt: new Date().toISOString(),
        status: 'draft'
      };

      const request = store.add(draft);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Retrieves all pending drafts.
   */
  async getPendingBookings(): Promise<BookingDraft[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) return reject("DB not initialized");

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Automates synchronization of offline drafts to the server.
   */
  async syncDrafts(apiClient: any): Promise<{ success: number; failed: number }> {
    const drafts = await this.getPendingBookings();
    let successCount = 0;
    let failedCount = 0;

    for (const draft of drafts) {
      try {
        await apiClient.post("/bookings", {
          tour: draft.tourId,
          scheduleId: draft.scheduleId,
          partySize: draft.partySize,
        });

        // If successful, remove from local store
        if (draft.id) await this.removeDraft(draft.id);
        successCount++;
      } catch (err: any) {
        console.error(`Sync failed for booking ${draft.id}:`, err.message);
        failedCount++;
      }
    }

    return { success: successCount, failed: failedCount };
  }

  async removeDraft(id: number): Promise<boolean> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) return reject("DB not initialized");

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }
}

export const offlineManager = new OfflineManager();
