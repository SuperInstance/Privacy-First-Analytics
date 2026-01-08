/**
 * Event Collector Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EventCollector } from '../src/collector'
import { AnalyticsEventStore } from '../src/storage'
import { AnalyticsConfig, EventType, EventData } from '../src/types'

// Mock event store
class MockEventStore implements AnalyticsEventStore {
  private events: any[] = []

  async addEvents(events: any[]): Promise<void> {
    this.events.push(...events)
  }

  async addEvent(event: any): Promise<void> {
    this.events.push(event)
  }

  async getEvent(id: string): Promise<any> {
    return this.events.find(e => e.id === id) || null
  }

  async queryEvents(): Promise<any[]> {
    return this.events
  }

  async deleteEvents(): Promise<void> {
    this.events = []
  }

  async deleteEventsBefore(): Promise<number> {
    return 0
  }

  async countEvents(): Promise<number> {
    return this.events.length
  }

  async clearAllEvents(): Promise<void> {
    this.events = []
  }

  getEvents(): any[] {
    return this.events
  }

  clear(): void {
    this.events = []
  }
}

describe('EventCollector', () => {
  let mockStore: MockEventStore
  let collector: EventCollector

  beforeEach(() => {
    mockStore = new MockEventStore()
    collector = new EventCollector(mockStore, {
      enabled: true,
      persist: true,
      batchSize: 5,
      batchInterval: 100,
      samplingRate: 1.0,
      storageBackend: 'indexedDB',
    })
  })

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await collector.initialize()
      expect(mockStore.getEvents()).length.greaterThan(0)
    })

    it('should track session_start on initialization', async () => {
      await collector.initialize()
      const events = mockStore.getEvents()
      const sessionStart = events.find(e => e.type === 'session_start')
      expect(sessionStart).toBeDefined()
    })
  })

  describe('event tracking', () => {
    beforeEach(async () => {
      await collector.initialize()
      mockStore.clear()
    })

    it('should track a basic event', async () => {
      await collector.track('feature_used' as EventType, {
        type: 'feature_used',
        featureId: 'test',
        success: true,
      } as EventData)

      await collector.flush()

      const events = mockStore.getEvents()
      expect(events).toHaveLength(1)
      expect(events[0].type).toBe('feature_used')
    })

    it('should batch events according to batchSize', async () => {
      const batchSize = 5

      for (let i = 0; i < batchSize; i++) {
        await collector.track('feature_used' as EventType, {
          type: 'feature_used',
          featureId: `test-${i}`,
          success: true,
        } as EventData)
      }

      const events = mockStore.getEvents()
      expect(events).toHaveLength(batchSize)
    })

    it('should respect sampling rate', async () => {
      const lowRateCollector = new EventCollector(mockStore, {
        enabled: true,
        persist: true,
        batchSize: 1,
        batchInterval: 100,
        samplingRate: 0.0, // Track nothing
        storageBackend: 'indexedDB',
      })

      await lowRateCollector.initialize()
      mockStore.clear()

      await lowRateCollector.track('feature_used' as EventType, {
        type: 'feature_used',
        featureId: 'test',
        success: true,
      } as EventData)

      await lowRateCollector.flush()

      const events = mockStore.getEvents()
      expect(events).toHaveLength(0)
    })

    it('should not track events when disabled', async () => {
      const disabledCollector = new EventCollector(mockStore, {
        enabled: false,
        persist: true,
        batchSize: 1,
        batchInterval: 100,
        samplingRate: 1.0,
        storageBackend: 'indexedDB',
      })

      await disabledCollector.initialize()
      mockStore.clear()

      await disabledCollector.track('feature_used' as EventType, {
        type: 'feature_used',
        featureId: 'test',
        success: true,
      } as EventData)

      await disabledCollector.flush()

      const events = mockStore.getEvents()
      expect(events).toHaveLength(0)
    })
  })

  describe('session management', () => {
    it('should track session stats correctly', async () => {
      await collector.initialize()
      mockStore.clear()

      // Track some messages
      await collector.track('message_sent' as EventType, {
        type: 'message_sent',
        conversationId: 'conv-1',
        messageLength: 100,
        hasAttachment: false,
      } as EventData)

      await collector.track('message_sent' as EventType, {
        type: 'message_sent',
        conversationId: 'conv-1',
        messageLength: 150,
        hasAttachment: true,
      } as EventData)

      await collector.track('feature_used' as EventType, {
        type: 'feature_used',
        featureId: 'search',
        success: true,
      } as EventData)

      await collector.flush()

      const events = mockStore.getEvents()
      const sessionEnd = events.find(e => e.type === 'session_end')

      expect(sessionEnd).toBeDefined()
      expect((sessionEnd.data as any).messagesSent).toBe(2)
      expect((sessionEnd.data as any).featuresUsed).toContain('search')
    })
  })

  describe('flushing', () => {
    it('should flush buffered events', async () => {
      await collector.initialize()
      mockStore.clear()

      await collector.track('feature_used' as EventType, {
        type: 'feature_used',
        featureId: 'test',
        success: true,
      } as EventData)

      await collector.flush()

      const events = mockStore.getEvents()
      expect(events.length).toBe.greaterThan(0)
    })
  })

  describe('configuration', () => {
    it('should update configuration', () => {
      const newConfig = { enabled: false }
      collector.updateConfig(newConfig)

      const config = collector.getConfig()
      expect(config.enabled).toBe(false)
    })

    it('should get current configuration', () => {
      const config = collector.getConfig()
      expect(config).toBeDefined()
      expect(config.enabled).toBeDefined()
      expect(config.samplingRate).toBeDefined()
    })
  })

  describe('shutdown', () => {
    it('should shutdown gracefully', async () => {
      await collector.initialize()
      await collector.shutdown()

      const config = collector.getConfig()
      expect(config).toBeDefined()
    })
  })
})
