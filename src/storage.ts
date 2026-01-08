/**
 * Privacy-First Analytics - Storage Layer
 *
 * Copyright (c) 2026 SuperInstance
 * MIT License
 *
 * Local-only storage backend for analytics events.
 * Supports both IndexedDB and localStorage.
 */

import { AnalyticsEvent, AnalyticsConfig, DEFAULT_ANALYTICS_CONFIG } from './types'

// ============================================================================
// STORAGE BACKEND INTERFACE
// ============================================================================

/**
 * Analytics event store interface
 */
export interface AnalyticsEventStore {
  addEvents(events: AnalyticsEvent[]): Promise<void>
  addEvent(event: AnalyticsEvent): Promise<void>
  getEvent(id: string): Promise<AnalyticsEvent | null>
  queryEvents(options: QueryOptions): Promise<AnalyticsEvent[]>
  deleteEvents(ids: string[]): Promise<void>
  deleteEventsBefore(date: string): Promise<number>
  countEvents(): Promise<number>
  clearAllEvents(): Promise<void>
}

/**
 * Query options for event storage
 */
export interface QueryOptions {
  startTime?: string
  endTime?: string
  types?: string[]
  categories?: string[]
  sessionIds?: string[]
  limit?: number
  offset?: number
  sortOrder?: 'asc' | 'desc'
}

// ============================================================================
// INDEXEDDB BACKEND
// ============================================================================

const DB_NAME = 'PrivacyFirstAnalytics'
const DB_VERSION = 1
const STORE_EVENTS = 'events'
const STORE_METADATA = 'metadata'

let db: IDBDatabase | null = null

async function getDB(): Promise<IDBDatabase> {
  if (db) return db

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(new Error('Failed to open analytics database'))
    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result

      // Events store
      if (!database.objectStoreNames.contains(STORE_EVENTS)) {
        const eventStore = database.createObjectStore(STORE_EVENTS, { keyPath: 'id' })
        eventStore.createIndex('timestamp', 'timestamp', { unique: false })
        eventStore.createIndex('type', 'type', { unique: false })
        eventStore.createIndex('category', 'category', { unique: false })
        eventStore.createIndex('sessionId', 'sessionId', { unique: false })
      }

      // Metadata store
      if (!database.objectStoreNames.contains(STORE_METADATA)) {
        database.createObjectStore(STORE_METADATA, { keyPath: 'key' })
      }
    }
  })
}

/**
 * IndexedDB implementation of analytics event store
 */
class IndexedDBAnalyticsStore implements AnalyticsEventStore {
  constructor(_config: AnalyticsConfig = DEFAULT_ANALYTICS_CONFIG) {}

  async addEvents(events: AnalyticsEvent[]): Promise<void> {
    if (events.length === 0) return

    const database = await getDB()

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_EVENTS], 'readwrite')
      const store = transaction.objectStore(STORE_EVENTS)

      events.forEach(event => {
        store.put(event)
      })

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }

  async addEvent(event: AnalyticsEvent): Promise<void> {
    await this.addEvents([event])
  }

  async getEvent(id: string): Promise<AnalyticsEvent | null> {
    const database = await getDB()

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_EVENTS], 'readonly')
      const store = transaction.objectStore(STORE_EVENTS)
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async queryEvents(options: QueryOptions = {}): Promise<AnalyticsEvent[]> {
    const database = await getDB()

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_EVENTS], 'readonly')
      const store = transaction.objectStore(STORE_EVENTS)
      const index = store.index('timestamp')

      // Build range
      let range: IDBKeyRange | null = null
      if (options.startTime && options.endTime) {
        range = IDBKeyRange.bound(options.startTime, options.endTime)
      } else if (options.startTime) {
        range = IDBKeyRange.lowerBound(options.startTime)
      } else if (options.endTime) {
        range = IDBKeyRange.upperBound(options.endTime)
      }

      const direction = options.sortOrder === 'asc' ? 'next' : 'prev'
      const request = range ? index.openCursor(range, direction) : index.openCursor(null, direction)

      const results: AnalyticsEvent[] = []
      let skipped = 0

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result

        if (cursor) {
          const evt = cursor.value as AnalyticsEvent

          // Apply filters
          if (options.types && !options.types.includes(evt.type)) {
            cursor.continue()
            return
          }

          if (options.categories && !options.categories.includes(evt.category)) {
            cursor.continue()
            return
          }

          if (options.sessionIds && !options.sessionIds.includes(evt.sessionId)) {
            cursor.continue()
            return
          }

          // Handle offset
          if (options.offset && skipped < options.offset) {
            skipped++
            cursor.continue()
            return
          }

          // Handle limit
          if (options.limit && results.length >= options.limit) {
            resolve(results)
            return
          }

          results.push(evt)
          cursor.continue()
        } else {
          resolve(results)
        }
      }

      request.onerror = () => reject(request.error)
    })
  }

  async deleteEvents(ids: string[]): Promise<void> {
    if (ids.length === 0) return

    const database = await getDB()

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_EVENTS], 'readwrite')
      const store = transaction.objectStore(STORE_EVENTS)

      ids.forEach(id => {
        store.delete(id)
      })

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }

  async deleteEventsBefore(date: string): Promise<number> {
    const database = await getDB()

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_EVENTS], 'readwrite')
      const store = transaction.objectStore(STORE_EVENTS)
      const index = store.index('timestamp')
      const range = IDBKeyRange.upperBound(date, true)

      const request = index.openCursor(range)
      let count = 0

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          cursor.delete()
          count++
          cursor.continue()
        } else {
          resolve(count)
        }
      }

      request.onerror = () => reject(request.error)
    })
  }

  async countEvents(): Promise<number> {
    const database = await getDB()

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_EVENTS], 'readonly')
      const store = transaction.objectStore(STORE_EVENTS)
      const request = store.count()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async clearAllEvents(): Promise<void> {
    const database = await getDB()

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_EVENTS], 'readwrite')
      const store = transaction.objectStore(STORE_EVENTS)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}

// ============================================================================
// LOCALSTORAGE BACKEND
// ============================================================================

const LS_EVENTS_KEY = 'analytics_events'

/**
 * localStorage implementation of analytics event store
 * Suitable for small datasets and simpler use cases
 */
class LocalStorageAnalyticsStore implements AnalyticsEventStore {
  private config: AnalyticsConfig
  private cache: AnalyticsEvent[] = []
  private cacheDirty: boolean = true

  constructor(config: AnalyticsConfig = DEFAULT_ANALYTICS_CONFIG) {
    this.config = config
  }

  private loadCache(): void {
    if (this.cacheDirty) {
      try {
        const data = localStorage.getItem(LS_EVENTS_KEY)
        this.cache = data ? JSON.parse(data) : []
        this.cacheDirty = false
      } catch (error) {
        console.error('Failed to load events from localStorage:', error)
        this.cache = []
      }
    }
  }

  private saveCache(): void {
    try {
      // Apply max events limit
      const events = this.config.maxEvents > 0
        ? this.cache.slice(-this.config.maxEvents)
        : this.cache

      localStorage.setItem(LS_EVENTS_KEY, JSON.stringify(events))
      this.cacheDirty = false
    } catch (error) {
      console.error('Failed to save events to localStorage:', error)
    }
  }

  async addEvents(events: AnalyticsEvent[]): Promise<void> {
    if (events.length === 0) return

    this.loadCache()
    this.cache.push(...events)
    this.saveCache()
  }

  async addEvent(event: AnalyticsEvent): Promise<void> {
    await this.addEvents([event])
  }

  async getEvent(id: string): Promise<AnalyticsEvent | null> {
    this.loadCache()
    return this.cache.find(e => e.id === id) || null
  }

  async queryEvents(options: QueryOptions = {}): Promise<AnalyticsEvent[]> {
    this.loadCache()

    let results = [...this.cache]

    // Apply time range filter
    if (options.startTime || options.endTime) {
      results = results.filter(event => {
        if (options.startTime && event.timestamp < options.startTime) {
          return false
        }
        if (options.endTime && event.timestamp > options.endTime) {
          return false
        }
        return true
      })
    }

    // Apply type filter
    if (options.types && options.types.length > 0) {
      results = results.filter(event => options.types!.includes(event.type))
    }

    // Apply category filter
    if (options.categories && options.categories.length > 0) {
      results = results.filter(event => options.categories!.includes(event.category))
    }

    // Apply session filter
    if (options.sessionIds && options.sessionIds.length > 0) {
      results = results.filter(event => options.sessionIds!.includes(event.sessionId))
    }

    // Sort
    results.sort((a, b) => {
      const comparison = a.timestamp.localeCompare(b.timestamp)
      return options.sortOrder === 'asc' ? comparison : -comparison
    })

    // Apply offset
    if (options.offset) {
      results = results.slice(options.offset)
    }

    // Apply limit
    if (options.limit) {
      results = results.slice(0, options.limit)
    }

    return results
  }

  async deleteEvents(ids: string[]): Promise<void> {
    if (ids.length === 0) return

    this.loadCache()
    const idSet = new Set(ids)
    this.cache = this.cache.filter(event => !idSet.has(event.id))
    this.saveCache()
  }

  async deleteEventsBefore(date: string): Promise<number> {
    this.loadCache()
    const beforeCount = this.cache.length
    this.cache = this.cache.filter(event => event.timestamp >= date)
    const deletedCount = beforeCount - this.cache.length
    this.saveCache()
    return deletedCount
  }

  async countEvents(): Promise<number> {
    this.loadCache()
    return this.cache.length
  }

  async clearAllEvents(): Promise<void> {
    this.cache = []
    this.cacheDirty = true
    try {
      localStorage.removeItem(LS_EVENTS_KEY)
    } catch (error) {
      console.error('Failed to clear events from localStorage:', error)
    }
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create an analytics event store with the specified backend
 */
export function createEventStore(
  backend: 'indexedDB' | 'localStorage',
  config?: AnalyticsConfig
): AnalyticsEventStore {
  const finalConfig = { ...DEFAULT_ANALYTICS_CONFIG, ...config }

  if (backend === 'indexedDB') {
    return new IndexedDBAnalyticsStore(finalConfig)
  } else {
    return new LocalStorageAnalyticsStore(finalConfig)
  }
}

/**
 * Default event store (uses IndexedDB if available, falls back to localStorage)
 */
export const defaultEventStore: AnalyticsEventStore = typeof indexedDB !== 'undefined'
  ? new IndexedDBAnalyticsStore()
  : new LocalStorageAnalyticsStore()

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Apply retention policy to old events
 */
export async function applyRetentionPolicy(
  store: AnalyticsEventStore,
  retentionDays: number
): Promise<number> {
  if (retentionDays === 0) return 0

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays)
  const cutoffISO = cutoffDate.toISOString()

  return store.deleteEventsBefore(cutoffISO)
}

/**
 * Get storage size estimate
 */
export async function getStorageSize(
  store: AnalyticsEventStore
): Promise<{
  eventCount: number
  estimatedSizeBytes: number
}> {
  const eventCount = await store.countEvents()

  // Rough estimation: average event ~500 bytes
  const estimatedSizeBytes = eventCount * 500

  return {
    eventCount,
    estimatedSizeBytes,
  }
}
