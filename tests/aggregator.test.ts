/**
 * Analytics Aggregator Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { AnalyticsAggregator } from '../src/aggregator'
import { AnalyticsEventStore } from '../src/storage'
import { AnalyticsEvent, TimeRange } from '../src/types'

// Mock event store with test data
class MockAggregatorStore implements AnalyticsEventStore {
  private events: AnalyticsEvent[] = []

  constructor() {
    this.generateTestData()
  }

  private generateTestData() {
    const now = Date.now()
    const dayInMs = 24 * 60 * 60 * 1000

    // Generate events for the past 7 days
    for (let day = 0; day < 7; day++) {
      const dayStart = now - (7 - day) * dayInMs
      const timestamp = new Date(dayStart).toISOString()

      // Feature used events
      this.events.push({
        id: `event-${this.events.length}`,
        type: 'feature_used',
        category: 'engagement',
        timestamp,
        sessionId: 'session-1',
        data: {
          type: 'feature_used',
          featureId: 'search',
          success: true,
          duration: 1500,
        },
      })

      this.events.push({
        id: `event-${this.events.length}`,
        type: 'feature_used',
        category: 'engagement',
        timestamp,
        sessionId: 'session-1',
        data: {
          type: 'feature_used',
          featureId: 'export',
          success: true,
          duration: 2000,
        },
      })

      // API response events
      this.events.push({
        id: `event-${this.events.length}`,
        type: 'api_response',
        category: 'performance',
        timestamp,
        sessionId: 'session-1',
        data: {
          type: 'api_response',
          endpoint: '/api/search',
          method: 'GET',
          duration: 150,
          success: true,
        },
      })

      // Session events
      this.events.push({
        id: `event-${this.events.length}`,
        type: 'session_end',
        category: 'engagement',
        timestamp,
        sessionId: 'session-1',
        data: {
          type: 'session_end',
          duration: 600,
          actionsPerformed: 10,
          messagesSent: 5,
          featuresUsed: ['search', 'export'],
        },
      })

      // Error events (fewer)
      if (day % 2 === 0) {
        this.events.push({
          id: `event-${this.events.length}`,
          type: 'error_occurred',
          category: 'error',
          timestamp,
          sessionId: 'session-1',
          data: {
            type: 'error_occurred',
            errorType: 'NetworkError',
            errorMessage: 'Connection timeout',
            context: '/api/search',
            recoverable: true,
          },
        })
      }
    }
  }

  async addEvents(): Promise<void> {}

  async addEvent(): Promise<void> {}

  async getEvent(): Promise<any> {
    return null
  }

  async queryEvents(options?: any): Promise<AnalyticsEvent[]> {
    let results = [...this.events]

    if (options?.startTime) {
      results = results.filter(e => e.timestamp >= options.startTime)
    }

    if (options?.endTime) {
      results = results.filter(e => e.timestamp <= options.endTime)
    }

    if (options?.types) {
      results = results.filter(e => options.types.includes(e.type))
    }

    return results
  }

  async deleteEvents(): Promise<void> {}

  async deleteEventsBefore(): Promise<number> {
    return 0
  }

  async countEvents(): Promise<number> {
    return this.events.length
  }

  async clearAllEvents(): Promise<void> {
    this.events = []
  }
}

describe('AnalyticsAggregator', () => {
  let store: MockAggregatorStore
  let aggregator: AnalyticsAggregator

  beforeEach(() => {
    store = new MockAggregatorStore()
    aggregator = new AnalyticsAggregator(store)
  })

  describe('getEventCountsByType', () => {
    it('should count events by type', async () => {
      const timeRange: TimeRange = { type: 'days', value: 7 }
      const counts = await aggregator.getEventCountsByType(timeRange)

      expect(counts).toBeDefined()
      expect(counts['feature_used']).toBeGreaterThan(0)
      expect(counts['api_response']).toBeGreaterThan(0)
      expect(counts['session_end']).toBeGreaterThan(0)
    })
  })

  describe('getEventCountsByCategory', () => {
    it('should count events by category', async () => {
      const timeRange: TimeRange = { type: 'days', value: 7 }
      const counts = await aggregator.getEventCountsByCategory(timeRange)

      expect(counts).toBeDefined()
      expect(counts['engagement']).toBeGreaterThan(0)
      expect(counts['performance']).toBeGreaterThan(0)
      expect(counts['error']).toBeGreaterThan(0)
    })
  })

  describe('getTimeSeries', () => {
    it('should generate time series data', async () => {
      const timeRange: TimeRange = { type: 'days', value: 7 }
      const series = await aggregator.getTimeSeries(timeRange, 'day')

      expect(series).toBeDefined()
      expect(series.length).toBeGreaterThan(0)
      expect(series[0]).toHaveProperty('timestamp')
      expect(series[0]).toHaveProperty('value')
      expect(series[0]).toHaveProperty('count')
    })
  })

  describe('getMostUsedFeatures', () => {
    it('should return feature usage statistics', async () => {
      const timeRange: TimeRange = { type: 'days', value: 7 }
      const features = await aggregator.getMostUsedFeatures(timeRange, 10)

      expect(features).toBeDefined()
      expect(features.length).toBeGreaterThan(0)
      expect(features[0]).toHaveProperty('featureId')
      expect(features[0]).toHaveProperty('usageCount')
      expect(features[0]).toHaveProperty('successRate')
    })

    it('should sort features by usage count', async () => {
      const timeRange: TimeRange = { type: 'days', value: 7 }
      const features = await aggregator.getMostUsedFeatures(timeRange, 10)

      for (let i = 1; i < features.length; i++) {
        expect(features[i - 1].usageCount).toBeGreaterThanOrEqual(
          features[i].usageCount
        )
      }
    })
  })

  describe('getErrorStats', () => {
    it('should return error statistics', async () => {
      const timeRange: TimeRange = { type: 'days', value: 7 }
      const errors = await aggregator.getErrorStats(timeRange, 10)

      expect(errors).toBeDefined()
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0]).toHaveProperty('errorType')
      expect(errors[0]).toHaveProperty('count')
      expect(errors[0]).toHaveProperty('recoverable')
    })
  })

  describe('getPerformanceMetrics', () => {
    it('should return performance metrics', async () => {
      const timeRange: TimeRange = { type: 'days', value: 7 }
      const metrics = await aggregator.getPerformanceMetrics(timeRange)

      expect(metrics).toBeDefined()
      expect(metrics.length).toBeGreaterThan(0)
      expect(metrics[0]).toHaveProperty('category')
      expect(metrics[0]).toHaveProperty('avgDuration')
      expect(metrics[0]).toHaveProperty('p95Duration')
      expect(metrics[0]).toHaveProperty('successRate')
    })
  })

  describe('getEngagementSummary', () => {
    it('should return engagement summary', async () => {
      const timeRange: TimeRange = { type: 'days', value: 7 }
      const summary = await aggregator.getEngagementSummary(timeRange)

      expect(summary).toBeDefined()
      expect(summary).toHaveProperty('totalSessions')
      expect(summary).toHaveProperty('avgSessionDuration')
      expect(summary).toHaveProperty('peakUsageHours')
      expect(summary.totalSessions).toBeGreaterThan(0)
    })
  })

  describe('getPeakUsageHours', () => {
    it('should return peak usage hours', async () => {
      const timeRange: TimeRange = { type: 'days', value: 7 }
      const hours = await aggregator.getPeakUsageHours(timeRange)

      expect(hours).toBeDefined()
      expect(Array.isArray(hours)).toBe(true)
      expect(hours.length).toBeGreaterThan(0)
      expect(hours[0]).toBeGreaterThanOrEqual(0)
      expect(hours[0]).toBeLessThanOrEqual(23)
    })
  })

  describe('getErrorRate', () => {
    it('should calculate error rate', async () => {
      const timeRange: TimeRange = { type: 'days', value: 7 }
      const errorRate = await aggregator.getErrorRate('test', timeRange)

      expect(errorRate).toBeDefined()
      expect(errorRate).toHaveProperty('totalErrors')
      expect(errorRate).toHaveProperty('totalEvents')
      expect(errorRate).toHaveProperty('errorRate')
      expect(errorRate.errorRate).toBeGreaterThanOrEqual(0)
      expect(errorRate.errorRate).toBeLessThanOrEqual(1)
    })
  })
})
