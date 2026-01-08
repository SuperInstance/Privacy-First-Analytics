/**
 * Privacy-First Analytics - Main Analytics Class
 *
 * Copyright (c) 2026 SuperInstance
 * MIT License
 *
 * Main entry point for the analytics system.
 * Orchestrates collection, storage, aggregation, and insights.
 */

import { EventCollector } from './collector'
import { AnalyticsAggregator } from './aggregator'
import { InsightsEngine } from './insights'
import {
  AnalyticsEventStore,
  createEventStore,
  applyRetentionPolicy,
  getStorageSize,
} from './storage'
import {
  AnalyticsEvent,
  EventType,
  EventData,
  AnalyticsConfig,
  DEFAULT_ANALYTICS_CONFIG,
  TimeRange,
  FeatureUsageStats,
  ErrorStats,
  PerformanceMetrics,
  EngagementSummary,
  AnalyticsExport,
  QueryOptions,
} from './types'
import { Insight, DailySummary } from './insights'

// ============================================================================
// MAIN ANALYTICS CLASS
// ============================================================================

/**
 * Main analytics orchestrator
 */
export class Analytics {
  private eventStore: AnalyticsEventStore
  private collector: EventCollector
  private aggregator: AnalyticsAggregator
  private insights: InsightsEngine
  private config: AnalyticsConfig
  private initialized: boolean = false

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = { ...DEFAULT_ANALYTICS_CONFIG, ...config }

    // Create event store
    this.eventStore = createEventStore(this.config.storageBackend, this.config)

    // Initialize components
    this.collector = new EventCollector(this.eventStore, this.config)
    this.aggregator = new AnalyticsAggregator(this.eventStore)
    this.insights = new InsightsEngine(this.eventStore)
  }

  /**
   * Initialize analytics
   */
  async initialize(config?: Partial<AnalyticsConfig>): Promise<void> {
    if (this.initialized) return

    if (config) {
      this.config = { ...this.config, ...config }
    }

    await this.collector.initialize(config)
    this.initialized = true
  }

  /**
   * Track an event
   */
  async track(type: EventType, data: EventData): Promise<void> {
    if (!this.initialized) {
      await this.initialize()
    }
    await this.collector.track(type, data)
  }

  /**
   * Query events
   */
  async query(options: QueryOptions): Promise<AnalyticsEvent[]> {
    const { start, end } = this.getTimeRangeBoundaries(options.timeRange)

    return this.eventStore.queryEvents({
      startTime: start,
      endTime: end,
      types: options.eventTypes,
      categories: options.filters?.category as string[] | undefined,
      limit: options.limit,
      offset: options.offset,
      sortOrder: options.sortOrder,
    })
  }

  /**
   * Generate insights
   */
  async generateInsights(
    timeRange: TimeRange = { type: 'days', value: 7 }
  ): Promise<Insight[]> {
    return this.insights.generateInsights(timeRange)
  }

  /**
   * Get feature usage statistics
   */
  async getFeatureUsage(
    timeRange: TimeRange = { type: 'days', value: 7 },
    limit: number = 10
  ): Promise<FeatureUsageStats[]> {
    return this.aggregator.getMostUsedFeatures(timeRange, limit)
  }

  /**
   * Get error statistics
   */
  async getErrorStats(
    timeRange: TimeRange = { type: 'days', value: 7 },
    limit: number = 10
  ): Promise<ErrorStats[]> {
    return this.aggregator.getErrorStats(timeRange, limit)
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(
    timeRange: TimeRange = { type: 'days', value: 7 }
  ): Promise<PerformanceMetrics[]> {
    return this.aggregator.getPerformanceMetrics(timeRange)
  }

  /**
   * Get engagement summary
   */
  async getEngagementSummary(
    timeRange: TimeRange = { type: 'days', value: 7 }
  ): Promise<EngagementSummary> {
    return this.aggregator.getEngagementSummary(timeRange)
  }

  /**
   * Get daily summary
   */
  async getDailySummary(date?: Date): Promise<DailySummary> {
    return this.insights.generateDailySummary(this.eventStore, date)
  }

  /**
   * Export all analytics data
   */
  async exportData(
    timeRange: TimeRange = { type: 'days', value: 30 }
  ): Promise<AnalyticsExport> {
    const { start, end } = this.getTimeRangeBoundaries(timeRange)

    const events = await this.eventStore.queryEvents({
      startTime: start,
      endTime: end,
    })

    const userActions = await this.aggregator.getEventCountsByCategory(timeRange)

    return {
      exportedAt: new Date().toISOString(),
      timeRange: { start, end },
      eventCount: events.length,
      events,
      summaries: {
        userActions: {
          count: (userActions.user_action || 0) as number,
        },
        performance: {
          count: (userActions.performance || 0) as number,
        },
        engagement: {
          count: (userActions.engagement || 0) as number,
        },
        errors: {
          count: (userActions.error || 0) as number,
        },
      },
    }
  }

  /**
   * Clear all analytics data
   */
  async clearAllData(): Promise<void> {
    await this.eventStore.clearAllEvents()
  }

  /**
   * Delete old data based on retention policy
   */
  async applyRetentionPolicy(): Promise<number> {
    if (this.config.retentionDays === 0) return 0
    return applyRetentionPolicy(this.eventStore, this.config.retentionDays)
  }

  /**
   * Get storage information
   */
  async getStorageInfo(): Promise<{
    eventCount: number
    estimatedSizeBytes: number
    estimatedSizeMB: number
  }> {
    const size = await getStorageSize(this.eventStore)
    return {
      ...size,
      estimatedSizeMB: size.estimatedSizeBytes / (1024 * 1024),
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...config }
    this.collector.updateConfig(config)
  }

  /**
   * Get current configuration
   */
  getConfig(): AnalyticsConfig {
    return { ...this.config }
  }

  /**
   * Shutdown analytics gracefully
   */
  async shutdown(): Promise<void> {
    await this.collector.shutdown()
    this.initialized = false
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private getTimeRangeBoundaries(timeRange: TimeRange): {
    start: string
    end: string
  } {
    const end = new Date()
    const start = new Date()

    switch (timeRange.type) {
      case 'hours':
        start.setHours(start.getHours() - timeRange.value)
        break
      case 'days':
        start.setDate(start.getDate() - timeRange.value)
        break
      case 'weeks':
        start.setDate(start.getDate() - timeRange.value * 7)
        break
      case 'months':
        start.setMonth(start.getMonth() - timeRange.value)
        break
      case 'all':
        start.setFullYear(start.getFullYear() - 100)
        break
    }

    return {
      start: start.toISOString(),
      end: end.toISOString(),
    }
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Create and initialize an analytics instance
 */
export async function createAnalytics(
  config?: Partial<AnalyticsConfig>
): Promise<Analytics> {
  const analytics = new Analytics(config)
  await analytics.initialize()
  return analytics
}

/**
 * Default global analytics instance
 */
let defaultAnalytics: Analytics | null = null

/**
 * Get or create the default analytics instance
 */
export function getAnalytics(config?: Partial<AnalyticsConfig>): Analytics {
  if (!defaultAnalytics) {
    defaultAnalytics = new Analytics(config)
  }
  return defaultAnalytics
}
