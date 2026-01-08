"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultEventStore = void 0;
exports.createEventStore = createEventStore;
exports.applyRetentionPolicy = applyRetentionPolicy;
exports.getStorageSize = getStorageSize;
const types_1 = require("./types");
const DB_NAME = 'PrivacyFirstAnalytics';
const DB_VERSION = 1;
const STORE_EVENTS = 'events';
const STORE_METADATA = 'metadata';
let db = null;
async function getDB() {
    if (db)
        return db;
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(new Error('Failed to open analytics database'));
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        request.onupgradeneeded = (event) => {
            const database = event.target.result;
            if (!database.objectStoreNames.contains(STORE_EVENTS)) {
                const eventStore = database.createObjectStore(STORE_EVENTS, { keyPath: 'id' });
                eventStore.createIndex('timestamp', 'timestamp', { unique: false });
                eventStore.createIndex('type', 'type', { unique: false });
                eventStore.createIndex('category', 'category', { unique: false });
                eventStore.createIndex('sessionId', 'sessionId', { unique: false });
            }
            if (!database.objectStoreNames.contains(STORE_METADATA)) {
                database.createObjectStore(STORE_METADATA, { keyPath: 'key' });
            }
        };
    });
}
class IndexedDBAnalyticsStore {
    constructor(_config = types_1.DEFAULT_ANALYTICS_CONFIG) { }
    async addEvents(events) {
        if (events.length === 0)
            return;
        const database = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([STORE_EVENTS], 'readwrite');
            const store = transaction.objectStore(STORE_EVENTS);
            events.forEach(event => {
                store.put(event);
            });
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }
    async addEvent(event) {
        await this.addEvents([event]);
    }
    async getEvent(id) {
        const database = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([STORE_EVENTS], 'readonly');
            const store = transaction.objectStore(STORE_EVENTS);
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }
    async queryEvents(options = {}) {
        const database = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([STORE_EVENTS], 'readonly');
            const store = transaction.objectStore(STORE_EVENTS);
            const index = store.index('timestamp');
            let range = null;
            if (options.startTime && options.endTime) {
                range = IDBKeyRange.bound(options.startTime, options.endTime);
            }
            else if (options.startTime) {
                range = IDBKeyRange.lowerBound(options.startTime);
            }
            else if (options.endTime) {
                range = IDBKeyRange.upperBound(options.endTime);
            }
            const direction = options.sortOrder === 'asc' ? 'next' : 'prev';
            const request = range ? index.openCursor(range, direction) : index.openCursor(null, direction);
            const results = [];
            let skipped = 0;
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    const evt = cursor.value;
                    if (options.types && !options.types.includes(evt.type)) {
                        cursor.continue();
                        return;
                    }
                    if (options.categories && !options.categories.includes(evt.category)) {
                        cursor.continue();
                        return;
                    }
                    if (options.sessionIds && !options.sessionIds.includes(evt.sessionId)) {
                        cursor.continue();
                        return;
                    }
                    if (options.offset && skipped < options.offset) {
                        skipped++;
                        cursor.continue();
                        return;
                    }
                    if (options.limit && results.length >= options.limit) {
                        resolve(results);
                        return;
                    }
                    results.push(evt);
                    cursor.continue();
                }
                else {
                    resolve(results);
                }
            };
            request.onerror = () => reject(request.error);
        });
    }
    async deleteEvents(ids) {
        if (ids.length === 0)
            return;
        const database = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([STORE_EVENTS], 'readwrite');
            const store = transaction.objectStore(STORE_EVENTS);
            ids.forEach(id => {
                store.delete(id);
            });
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }
    async deleteEventsBefore(date) {
        const database = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([STORE_EVENTS], 'readwrite');
            const store = transaction.objectStore(STORE_EVENTS);
            const index = store.index('timestamp');
            const range = IDBKeyRange.upperBound(date, true);
            const request = index.openCursor(range);
            let count = 0;
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    count++;
                    cursor.continue();
                }
                else {
                    resolve(count);
                }
            };
            request.onerror = () => reject(request.error);
        });
    }
    async countEvents() {
        const database = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([STORE_EVENTS], 'readonly');
            const store = transaction.objectStore(STORE_EVENTS);
            const request = store.count();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    async clearAllEvents() {
        const database = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([STORE_EVENTS], 'readwrite');
            const store = transaction.objectStore(STORE_EVENTS);
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}
const LS_EVENTS_KEY = 'analytics_events';
class LocalStorageAnalyticsStore {
    constructor(config = types_1.DEFAULT_ANALYTICS_CONFIG) {
        this.cache = [];
        this.cacheDirty = true;
        this.config = config;
    }
    loadCache() {
        if (this.cacheDirty) {
            try {
                const data = localStorage.getItem(LS_EVENTS_KEY);
                this.cache = data ? JSON.parse(data) : [];
                this.cacheDirty = false;
            }
            catch (error) {
                console.error('Failed to load events from localStorage:', error);
                this.cache = [];
            }
        }
    }
    saveCache() {
        try {
            const events = this.config.maxEvents > 0
                ? this.cache.slice(-this.config.maxEvents)
                : this.cache;
            localStorage.setItem(LS_EVENTS_KEY, JSON.stringify(events));
            this.cacheDirty = false;
        }
        catch (error) {
            console.error('Failed to save events to localStorage:', error);
        }
    }
    async addEvents(events) {
        if (events.length === 0)
            return;
        this.loadCache();
        this.cache.push(...events);
        this.saveCache();
    }
    async addEvent(event) {
        await this.addEvents([event]);
    }
    async getEvent(id) {
        this.loadCache();
        return this.cache.find(e => e.id === id) || null;
    }
    async queryEvents(options = {}) {
        this.loadCache();
        let results = [...this.cache];
        if (options.startTime || options.endTime) {
            results = results.filter(event => {
                if (options.startTime && event.timestamp < options.startTime) {
                    return false;
                }
                if (options.endTime && event.timestamp > options.endTime) {
                    return false;
                }
                return true;
            });
        }
        if (options.types && options.types.length > 0) {
            results = results.filter(event => options.types.includes(event.type));
        }
        if (options.categories && options.categories.length > 0) {
            results = results.filter(event => options.categories.includes(event.category));
        }
        if (options.sessionIds && options.sessionIds.length > 0) {
            results = results.filter(event => options.sessionIds.includes(event.sessionId));
        }
        results.sort((a, b) => {
            const comparison = a.timestamp.localeCompare(b.timestamp);
            return options.sortOrder === 'asc' ? comparison : -comparison;
        });
        if (options.offset) {
            results = results.slice(options.offset);
        }
        if (options.limit) {
            results = results.slice(0, options.limit);
        }
        return results;
    }
    async deleteEvents(ids) {
        if (ids.length === 0)
            return;
        this.loadCache();
        const idSet = new Set(ids);
        this.cache = this.cache.filter(event => !idSet.has(event.id));
        this.saveCache();
    }
    async deleteEventsBefore(date) {
        this.loadCache();
        const beforeCount = this.cache.length;
        this.cache = this.cache.filter(event => event.timestamp >= date);
        const deletedCount = beforeCount - this.cache.length;
        this.saveCache();
        return deletedCount;
    }
    async countEvents() {
        this.loadCache();
        return this.cache.length;
    }
    async clearAllEvents() {
        this.cache = [];
        this.cacheDirty = true;
        try {
            localStorage.removeItem(LS_EVENTS_KEY);
        }
        catch (error) {
            console.error('Failed to clear events from localStorage:', error);
        }
    }
}
function createEventStore(backend, config) {
    const finalConfig = { ...types_1.DEFAULT_ANALYTICS_CONFIG, ...config };
    if (backend === 'indexedDB') {
        return new IndexedDBAnalyticsStore(finalConfig);
    }
    else {
        return new LocalStorageAnalyticsStore(finalConfig);
    }
}
exports.defaultEventStore = typeof indexedDB !== 'undefined'
    ? new IndexedDBAnalyticsStore()
    : new LocalStorageAnalyticsStore();
async function applyRetentionPolicy(store, retentionDays) {
    if (retentionDays === 0)
        return 0;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const cutoffISO = cutoffDate.toISOString();
    return store.deleteEventsBefore(cutoffISO);
}
async function getStorageSize(store) {
    const eventCount = await store.countEvents();
    const estimatedSizeBytes = eventCount * 500;
    return {
        eventCount,
        estimatedSizeBytes,
    };
}
//# sourceMappingURL=storage.js.map