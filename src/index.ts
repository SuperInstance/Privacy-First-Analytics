/**
 * Privacy-First Analytics
 *
 * Copyright (c) 2026 SuperInstance
 * MIT License
 *
 * A privacy-first, local-only analytics library.
 * All data stays on the device - no cloud synchronization, no external dependencies.
 *
 * @example
 * ```ts
 * import { Analytics } from '@superinstance/privacy-first-analytics'
 *
 * const analytics = new Analytics()
 * await analytics.initialize()
 *
 * // Track events
 * await analytics.track('feature_used', {
 *   type: 'feature_used',
 *   featureId: 'search',
 *   success: true,
 * })
 *
 * // Generate insights
 * const insights = await analytics.generateInsights()
 *
 * // Export data
 * const data = await analytics.exportData()
 * ```
 */

// Main analytics class
export { Analytics, createAnalytics, getAnalytics } from './analytics'

// Core components
export { EventCollector, createEventCollector } from './collector'
export { AnalyticsAggregator } from './aggregator'
export { InsightsEngine } from './insights'

// Storage
export {
  AnalyticsEventStore,
  createEventStore,
  defaultEventStore,
  applyRetentionPolicy,
  getStorageSize,
} from './storage'

// Types
export type {
  // Event types
  EventType,
  EventCategory,
  AnalyticsEvent,
  EventData,

  // Specific event data types
  MessageSentData,
  ConversationCreatedData,
  ConversationArchivedData,
  SettingsChangedData,
  AIContactCreatedData,
  SearchPerformedData,
  AppInitializedData,
  APIResponseData,
  RenderCompleteData,
  SessionStartData,
  SessionEndData,
  FeatureUsedData,
  PageViewData,
  ErrorOccurredData,
  ErrorRecoveredData,
  FeatureEnabledData,
  FeatureDisabledData,
  FeatureEvaluatedData,
  BenchmarkCompletedData,
  DataCompactedData,
  GenericEventData,

  // Aggregation types
  TimeRange,
  AggregationBucket,
  AggregatedStats,
  TimeSeriesPoint,
  FeatureUsageStats,
  ErrorStats,
  PerformanceMetrics,
  EngagementSummary,

  // Configuration
  AnalyticsConfig,
  QueryOptions,
  PrivacySettings,
  AnalyticsExport,
} from './types'

export { DEFAULT_ANALYTICS_CONFIG } from './types'

// Insights types
export type {
  Insight,
  InsightSeverity,
  InsightCategory,
  UsagePatternInsight,
  PerformanceInsight,
  ErrorInsight,
  EngagementInsight,
  OptimizationSuggestion,
  DailySummary,
  WeeklySummary,
} from './insights'
