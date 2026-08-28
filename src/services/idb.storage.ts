/**
 * IndexedDB Storage Adapter for large datasets (Cards with images)
 * Provides a much higher quota than localStorage (50MB+ vs 5MB).
 */

const DB_NAME = 'uply_db';
const DB_VERSION = 1;
const CARD_STORE = 'cards';

export interface IDBStoredCard {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  front_image?: string;
  back_image?: string;
  front_audio?: boolean;
  back_audio?: boolean;
  created_at: string;
  [key: string]: any;
}

export async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(CARD_STORE)) {
        const store = db.createObjectStore(CARD_STORE, { keyPath: 'id' });
        store.createIndex('deck_id', 'deck_id', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const cardIDB = {
  async getAll(): Promise<IDBStoredCard[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(CARD_STORE, 'readonly');
      const store = transaction.objectStore(CARD_STORE);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async getByDeck(deckId: string): Promise<IDBStoredCard[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(CARD_STORE, 'readonly');
      const store = transaction.objectStore(CARD_STORE);
      const index = store.index('deck_id');
      const request = index.getAll(deckId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async save(card: IDBStoredCard): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(CARD_STORE, 'readwrite');
      const store = transaction.objectStore(CARD_STORE);
      const request = store.put(card);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async saveBulk(cards: IDBStoredCard[]): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(CARD_STORE, 'readwrite');
      const store = transaction.objectStore(CARD_STORE);
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);

      cards.forEach(card => store.put(card));
    });
  },

  async delete(id: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(CARD_STORE, 'readwrite');
      const store = transaction.objectStore(CARD_STORE);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async deleteByDeck(deckId: string): Promise<void> {
    const db = await openDB();
    const cards = await this.getByDeck(deckId);
    if (cards.length === 0) return;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(CARD_STORE, 'readwrite');
      const store = transaction.objectStore(CARD_STORE);
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);

      cards.forEach(card => store.delete(card.id));
    });
  }
};
