# API Reference

Complete API documentation for Privacy-First Analytics.

## Table of Contents

- [Analytics](#analytics)
- [EventCollector](#eventcollector)
- [AnalyticsAggregator](#analyticsaggregator)
- [InsightsEngine](#insightsengine)
- [AnalyticsEventStore](#analyticseventstore)
- [Types](#types)

---

## Analytics

Main analytics orchestrator class.

### Constructor

```typescript
constructor(config?: Partial<AnalyticsConfig>)
```

**Parameters:**
- `config` - Optional partial configuration object

**Example:**
```typescript
const analytics = new Analytics({
  storageBackend: 'indexedDB',
  retentionDays: 90,
})
```

### Methods

#### initialize()

Initialize the analytics system.

```typescript
async initialize(config?: Partial<AnalyticsConfig>): Promise<void>
```

**Example:**
```typescript
await analytics.initialize()
```

#### track()

Track an analytics event.

```typescript
async track(type: EventType, data: EventData): Promise<void>
```

**Parameters:**
- `type` - Event type (e.g., 'feature_used', 'page_view')
- `data` - Event data object

**Example:**
```typescript
await analytics.track('feature_used', {
  type: 'feature_used',
  featureId: 'search',
  success: true,
})
```

#### query()

Query events with filters.

```typescript
async query(options: QueryOptions): Promise<AnalyticsEvent[]>
```

**Parameters:**
- `options` - Query options including timeRange, eventTypes, limit, etc.

**Returns:** Array of analytics events

**Example:**
```typescript
const events = await analytics.query({
  timeRange: { type: 'days', value: 7 },
  eventTypes: ['feature_used'],
  limit: 100,
})
```

#### generateInsights()

Generate insights for a time range.

```typescript
async generateInsights(timeRange?: TimeRange): Promise<Insight[]>
```

**Parameters:**
- `timeRange` - Optional time range (default: 7 days)

**Returns:** Array of insights

**Example:**
```typescript
const insights = await analytics.generateInsights({
  type: 'days',
  value: 7,
})
```

#### getFeatureUsage()

Get feature usage statistics.

```typescript
async getFeatureUsage(timeRange?: TimeRange, limit?: number): Promise<FeatureUsageStats[]>
```

**Parameters:**
- `timeRange` - Optional time range (default: 7 days)
- `limit` - Maximum number of features to return (default: 10)

**Returns:** Array of feature usage statistics

**Example:**
```typescript
const features = await analytics.getFeatureUsage(
  { type: 'days', value: 30 },
  20
)
```

#### getErrorStats()

Get error statistics.

```typescript
async getErrorStats(timeRange?: TimeRange, limit?: number): Promise<ErrorStats[]>
```

**Returns:** Array of error statistics

**Example:**
```typescript
const errors = await analytics.getErrorStats({ type: 'days', value: 7 })
```

#### getPerformanceMetrics()

Get performance metrics.

```typescript
async getPerformanceMetrics(timeRange?: TimeRange): Promise<PerformanceMetrics[]>
```

**Returns:** Array of performance metrics

**Example:**
```typescript
const perf = await analytics.getPerformanceMetrics({ type: 'days', value: 7 })
```

#### getEngagementSummary()

Get engagement summary.

```typescript
async getEngagementSummary(timeRange?: TimeRange): Promise<EngagementSummary>
```

**Returns:** Engagement summary object

**Example:**
```typescript
const engagement = await analytics.getEngagementSummary()
```

#### getDailySummary()

Get daily summary for a specific date.

```typescript
async getDailySummary(date?: Date): Promise<DailySummary>
```

**Parameters:**
- `date` - Optional date (default: today)

**Returns:** Daily summary object

**Example:**
```typescript
const summary = await analytics.getDailySummary(new Date())
```

#### exportData()

Export all analytics data.

```typescript
async exportData(timeRange?: TimeRange): Promise<AnalyticsExport>
```

**Returns:** Export object with events and summaries

**Example:**
```typescript
const data = await analytics.exportData({ type: 'days', value: 30 })
console.log(`Exported ${data.eventCount} events`)
```

#### clearAllData()

Clear all analytics data.

```typescript
async clearAllData(): Promise<void>
```

**Example:**
```typescript
await analytics.clearAllData()
```

#### applyRetentionPolicy()

Delete old data based on retention policy.

```typescript
async applyRetentionPolicy(): Promise<number>
```

**Returns:** Number of events deleted

**Example:**
```typescript
const deleted = await analytics.applyRetentionPolicy()
console.log(`Deleted ${deleted} old events`)
```

#### getStorageInfo()

Get storage information.

```typescript
async getStorageInfo(): Promise<{
  eventCount: number
  estimatedSizeBytes: number
  estimatedSizeMB: number
}>
```

**Returns:** Storage information object

**Example:**
```typescript
const info = await analytics.getStorageInfo()
console.log(`Storage: ${info.estimatedSizeMB.toFixed(2)} MB`)
```

#### updateConfig()

Update configuration.

```typescript
updateConfig(config: Partial<AnalyticsConfig>): void
```

**Example:**
```typescript
analytics.updateConfig({ enabled: false })
```

#### getConfig()

Get current configuration.

```typescript
getConfig(): AnalyticsConfig
```

**Returns:** Current configuration object

#### shutdown()

Shutdown analytics gracefully.

```typescript
async shutdown(): Promise<void>
```

**Example:**
```typescript
await analytics.shutdown()
```

---

## EventCollector

Event collection and batching.

### Constructor

```typescript
constructor(eventStore: AnalyticsEventStore, config?: Partial<AnalyticsConfig>)
```

### Methods

#### initialize()

Initialize the collector.

```typescript
async initialize(config?: Partial<AnalyticsConfig>): Promise<void>
```

#### track()

Track an event.

```typescript
async track(type: EventType, data: EventData): Promise<void>
```

#### flush()

Flush buffered events to storage.

```typescript
async flush(): Promise<void>
```

#### endSession()

End current session.

```typescript
async endSession(): Promise<void>
```

#### updateConfig()

Update configuration.

```typescript
updateConfig(config: Partial<AnalyticsConfig>): void
```

#### getConfig()

Get current configuration.

```typescript
getConfig(): AnalyticsConfig
```

#### shutdown()

Shutdown collector gracefully.

```typescript
async shutdown(): Promise<void>
```

---

## AnalyticsAggregator

Data aggregation and statistics.

### Constructor

```typescript
constructor(eventStore: AnalyticsEventStore)
```

### Methods

#### getEventCountsByType()

Get event counts by type.

```typescript
async getEventCountsByType(timeRange: TimeRange): Promise<Record<string, number>>
```

#### getEventCountsByCategory()

Get event counts by category.

```typescript
async getEventCountsByCategory(timeRange: TimeRange): Promise<Record<string, number>>
```

#### getTimeSeries()

Get time series data.

```typescript
async getTimeSeries(
  timeRange: TimeRange,
  bucket?: AggregationBucket,
  eventType?: EventType
): Promise<TimeSeriesPoint[]>
```

#### getMostUsedFeatures()

Get most used features.

```typescript
async getMostUsedFeatures(timeRange: TimeRange, limit?: number): Promise<FeatureUsageStats[]>
```

#### getErrorStats()

Get error statistics.

```typescript
async getErrorStats(timeRange: TimeRange, limit?: number): Promise<ErrorStats[]>
```

#### getPerformanceMetrics()

Get performance metrics.

```typescript
async getPerformanceMetrics(timeRange?: TimeRange, category?: string): Promise<PerformanceMetrics[]>
```

#### getEngagementSummary()

Get engagement summary.

```typescript
async getEngagementSummary(timeRange: TimeRange): Promise<EngagementSummary>
```

---

## InsightsEngine

Automated insight generation.

### Constructor

```typescript
constructor(eventStore: AnalyticsEventStore)
```

### Methods

#### generateInsights()

Generate insights.

```typescript
async generateInsights(timeRange: TimeRange, categories?: InsightCategory[]): Promise<Insight[]>
```

#### generateDailySummary()

Generate daily summary.

```typescript
async generateDailySummary(eventStore: AnalyticsEventStore, date?: Date): Promise<DailySummary>
```

---

## AnalyticsEventStore

Storage backend interface.

### Methods

#### addEvents()

Add multiple events.

```typescript
async addEvents(events: AnalyticsEvent[]): Promise<void>
```

#### addEvent()

Add a single event.

```typescript
async addEvent(event: AnalyticsEvent): Promise<void>
```

#### getEvent()

Get event by ID.

```typescript
async getEvent(id: string): Promise<AnalyticsEvent | null>
```

#### queryEvents()

Query events with filters.

```typescript
async queryEvents(options?: QueryOptions): Promise<AnalyticsEvent[]>
```

#### deleteEvents()

Delete events by IDs.

```typescript
async deleteEvents(ids: string[]): Promise<void>
```

#### deleteEventsBefore()

Delete events before a date.

```typescript
async deleteEventsBefore(date: string): Promise<number>
```

#### countEvents()

Count total events.

```typescript
async countEvents(): Promise<number>
```

#### clearAllEvents()

Clear all events.

```typescript
async clearAllEvents(): Promise<void>
```

---

## Types

### AnalyticsConfig

```typescript
interface AnalyticsConfig {
  enabled: boolean
  persist: boolean
  maxEvents: number
  batchSize: number
  batchInterval: number
  detailedPerformance: boolean
  trackErrors: boolean
  sessionTimeout: number
  retentionDays: number
  samplingRate: number
  storageBackend: 'indexedDB' | 'localStorage'
}
```

### TimeRange

```typescript
type TimeRange =
  | { type: 'hours'; value: number }
  | { type: 'days'; value: number }
  | { type: 'weeks'; value: number }
  | { type: 'months'; value: number }
  | { type: 'all' }
```

### QueryOptions

```typescript
interface QueryOptions {
  timeRange: TimeRange
  eventTypes?: EventType[]
  filters?: Record<string, unknown>
  bucket?: AggregationBucket
  limit?: number
  offset?: number
  sortOrder?: 'asc' | 'desc'
}
```

### AnalyticsEvent

```typescript
interface AnalyticsEvent {
  id: string
  type: EventType
  category: EventCategory
  timestamp: string
  sessionId: string
  data: EventData
  metadata?: {
    hardwareHash?: string
    activeFeatures?: string[]
    appVersion?: string
    platform?: string
  }
}
```

### Insight

```typescript
interface Insight {
  id: string
  category: InsightCategory
  severity: InsightSeverity
  title: string
  description: string
  timestamp: string
  data?: Record<string, unknown>
}
```

### FeatureUsageStats

```typescript
interface FeatureUsageStats {
  featureId: string
  usageCount: number
  lastUsed: string
  totalDuration?: number
  averageDuration?: number
  successRate: number
  trend: 'increasing' | 'decreasing' | 'stable'
}
```

### ErrorStats

```typescript
interface ErrorStats {
  errorType: string
  count: number
  lastOccurred: string
  recoverable: boolean
  recoveryRate: number
  avgRecoveryTime?: number
  trend: 'increasing' | 'decreasing' | 'stable'
}
```

### PerformanceMetrics

```typescript
interface PerformanceMetrics {
  category: string
  avgDuration: number
  p95Duration: number
  p99Duration: number
  successRate: number
  totalOperations: number
  trend: 'improving' | 'degrading' | 'stable'
}
```

### EngagementSummary

```typescript
interface EngagementSummary {
  totalSessions: number
  totalSessionTime: number
  avgSessionDuration: number
  avgMessagesPerSession: number
  mostActiveDay: string
  mostActiveHour: number
  retentionRate: number
  peakUsageHours: number[]
  activeDays: number
  avgSessionsPerDay: number
  totalTime: number
  peakUsageHour: number
}
```

---

For more information, see the [README](../README.md).
