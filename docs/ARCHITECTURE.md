# Architecture

Privacy-First Analytics architecture overview, design decisions, and implementation details.

## Overview

Privacy-First Analytics is designed with privacy, performance, and simplicity as core principles. The architecture follows a layered approach with clear separation of concerns.

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│                  (Your Application)                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ track(), query(), generateInsights()
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   Analytics Orchestrator                     │
│                      (Analytics Class)                       │
│  - Public API                                               │
│  - Configuration Management                                 │
│  - Component Coordination                                   │
└─────────┬─────────────┬──────────────┬──────────────────────┘
          │             │              │
┌─────────▼─────┐ ┌────▼──────┐ ┌────▼────────────────┐
│ Event         │ │Aggreg-    │ │  Insights           │
│ Collector     │ │ator       │ │  Engine             │
│               │ │           │ │                     │
│ - Batching    │ │- Stats    │ │- Pattern Detection │
│ - Sampling    │ │- Time     │ │- Anomaly Detection │
│ - Sessions    │ │  Series   │ │- Recommendations   │
└───────┬───────┘ └────┬──────┘ └────┬────────────────┘
        │              │              │
        └──────────────┼──────────────┘
                       │
            ┌──────────▼──────────┐
            │  EventStore (I/F)   │
            │  - Storage Abstraction│
            └──────────┬──────────┘
                       │
         ┌─────────────┴─────────────┐
         │                           │
┌────────▼────────┐         ┌───────▼────────┐
│  IndexedDB      │         │  localStorage  │
│  Backend        │         │  Backend       │
│                 │         │                │
│ - Large capacity│         │- Simple API    │
│ - Async ops     │         │- Sync ops      │
│- Indexed queries│         │- Limited size  │
└─────────────────┘         └────────────────┘
```

## Core Components

### 1. Analytics (Main Orchestrator)

**Purpose:** Provides the main public API and coordinates all components.

**Responsibilities:**
- Initialize and configure the analytics system
- Provide high-level API methods
- Coordinate between collector, aggregator, and insights
- Manage lifecycle (init, shutdown)

**Key Design Decisions:**
- Single entry point for simplicity
- Async initialization for non-blocking setup
- Graceful shutdown with proper cleanup

### 2. EventCollector

**Purpose:** Non-blocking event collection with batching and privacy safeguards.

**Responsibilities:**
- Receive and buffer events
- Batch writes to storage
- Manage sessions
- Apply sampling
- Enforce privacy settings

**Key Features:**
- **Batching:** Events are buffered and written in batches for performance
- **Sampling:** Configurable sampling rate reduces overhead
- **Sessions:** Automatic session tracking with timeouts
- **Privacy:** Respects enabled/disabled state and sampling

**Batching Strategy:**
```
Event → Buffer → [Batch Size or Interval] → Storage
                  ↓
              Flush on:
              - Batch size reached
              - Batch interval elapsed
              - Manual flush()
              - Shutdown
```

### 3. AnalyticsAggregator

**Purpose:** Aggregate and analyze event data.

**Responsibilities:**
- Calculate statistics (count, sum, avg, percentiles)
- Generate time series data
- Group by dimensions (type, category, feature)
- Calculate trends

**Key Algorithms:**

**Time Series Bucketing:**
```typescript
function bucketTimestamp(timestamp: string, bucket: AggregationBucket): string {
  const date = new Date(timestamp)

  switch (bucket) {
    case 'hour':
      date.setMinutes(0, 0, 0)
      break
    case 'day':
      date.setHours(0, 0, 0, 0)
      break
    case 'week':
      // Round down to start of week
      break
    case 'month':
      date.setDate(1)
      date.setHours(0, 0, 0, 0)
      break
  }

  return date.toISOString()
}
```

**Percentile Calculation:**
```typescript
function calculatePercentiles(sortedValues: number[]): Percentiles {
  const count = sortedValues.length

  return {
    p50: sortedValues[Math.floor(count * 0.5)],
    p90: sortedValues[Math.floor(count * 0.9)],
    p95: sortedValues[Math.floor(count * 0.95)],
    p99: sortedValues[Math.floor(count * 0.99)],
  }
}
```

**Trend Detection:**
```typescript
function calculateTrend(values: number[]): Trend {
  if (values.length < 2) return 'stable'

  const recent = values.slice(Math.floor(values.length / 2))
  const older = values.slice(0, Math.floor(values.length / 2))

  const recentAvg = average(recent)
  const olderAvg = average(older)
  const diff = recentAvg - olderAvg
  const threshold = olderAvg * 0.1 // 10% threshold

  if (diff > threshold) return 'increasing'
  if (diff < -threshold) return 'decreasing'
  return 'stable'
}
```

### 4. InsightsEngine

**Purpose:** Automated analysis and actionable insights.

**Responsibilities:**
- Detect patterns (peak hours, activity trends)
- Identify performance issues
- Analyze errors
- Generate optimization suggestions
- Create daily/weekly summaries

**Insight Categories:**

1. **Usage Insights**
   - Peak usage hours detection
   - Activity trends (increasing/decreasing)
   - Feature adoption patterns

2. **Performance Insights**
   - Slow API detection
   - Slow render detection
   - Memory pressure detection

3. **Error Insights**
   - Frequent error detection
   - Recovery rate analysis
   - Error clustering

4. **Engagement Insights**
   - Session duration analysis
   - Feature adoption tracking
   - Retention metrics

5. **Optimization Insights**
   - Batch operation suggestions
   - Cleanup recommendations
   - Resource optimization

### 5. EventStore (Storage Layer)

**Purpose:** Abstract storage backend interface.

**Design:**
- Interface-based design for flexibility
- Pluggable backends (IndexedDB, localStorage)
- Async operations for non-blocking I/O

**IndexedDB Backend:**
```typescript
class IndexedDBAnalyticsStore implements AnalyticsEventStore {
  // Large capacity (~hundreds of MB)
  // Indexed queries (timestamp, type, category, sessionId)
  // Async operations
  // Transaction-based writes
}
```

**localStorage Backend:**
```typescript
class LocalStorageAnalyticsStore implements AnalyticsEventStore {
  // Limited capacity (~5-10 MB)
  // Simple key-value API
  // Sync operations
  // In-memory caching for performance
}
```

**Storage Schema:**

**IndexedDB:**
```
Database: PrivacyFirstAnalytics
Version: 1

Object Stores:
  - events
    - Index: timestamp
    - Index: type
    - Index: category
    - Index: sessionId

  - metadata
    - Key-value pairs for metadata
```

**localStorage:**
```
Key: analytics_events
Value: JSON array of events

Key: analytics_metadata
Value: JSON object with metadata
```

## Data Flow

### Event Tracking Flow

```
User calls analytics.track()
         ↓
EventCollector.track()
         ↓
Check: enabled?
  No → Return
  Yes → Continue
         ↓
Check: sampling?
  No → Return
  Yes → Continue
         ↓
Create AnalyticsEvent
  - Generate ID
  - Set timestamp
  - Assign session ID
  - Determine category
         ↓
Update session stats
         ↓
Add to buffer
         ↓
Check: buffer full?
  Yes → flush()
  No → Return
         ↓
EventStore.addEvents()
         ↓
IndexedDB or localStorage
```

### Query Flow

```
User calls analytics.query()
         ↓
Calculate time range boundaries
         ↓
EventStore.queryEvents()
         ↓
Query by timestamp range
         ↓
Apply filters:
  - Event types
  - Categories
  - Session IDs
         ↓
Apply pagination:
  - Offset
  - Limit
  - Sort order
         ↓
Return filtered events
```

### Insights Generation Flow

```
User calls analytics.generateInsights()
         ↓
InsightsEngine.generateInsights()
         ↓
For each category:
  - Generate usage insights
  - Generate performance insights
  - Generate error insights
  - Generate engagement insights
  - Generate optimization insights
         ↓
Aggregate all insights
         ↓
Sort by severity and timestamp
         ↓
Return insights array
```

## Performance Characteristics

### Sub-Millisecond Overhead

Event tracking is designed to be non-blocking and fast:

```
Event Creation: ~0.1ms
  - Generate ID: 0.02ms
  - Get timestamp: 0.01ms
  - Set metadata: 0.05ms
  - Update stats: 0.02ms

Buffer Add: ~0.01ms
  - Array push: O(1)

Batch Write: ~5-50ms (async, non-blocking)
  - IndexedDB transaction
  - Batch size: 50 events
  - Amortized per event: 0.1-1ms
```

### Memory Usage

```
Event Size: ~500 bytes average
Buffer Size: batchSize * eventSize
  = 50 * 500 bytes = 25 KB

Session Stats: ~1 KB

Total Memory: ~26 KB (negligible)
```

### Storage Usage

```
Events per Day (heavy usage): 10,000
Storage per Day: 10,000 * 500 bytes = 5 MB

90-Day Retention: 450 MB
```

## Privacy Design

### Privacy by Default

1. **No Data Transmission:** All data stays on device
2. **No Third-Party Services:** Zero external dependencies
3. **User Control:** Export and delete capabilities
4. **Transparent:** All event schemas are visible
5. **Opt-Out:** Simple disable flag

### GDPR Compliance

The library supports GDPR rights:

1. **Right to Access:** `exportData()` method
2. **Right to Erasure:** `clearAllData()` method
3. **Right to Portability:** JSON export format
4. **Right to be Informed:** Transparent event schemas
5. **Right to Object:** `enabled = false` setting

### Data Minimization

- Collect only necessary data
- Configurable retention policies
- Sampling to reduce data volume
- No PII collection (by design)

## Extension Points

### Custom Event Types

```typescript
// Define custom event
await analytics.track('my_custom_event', {
  type: 'my_custom_event',
  customField: 'value',
  metrics: { count: 42 },
})
```

### Custom Storage Backend

```typescript
class CustomEventStore implements AnalyticsEventStore {
  // Implement all interface methods
}

const analytics = new Analytics({
  storageBackend: 'custom', // Would need to extend type
})

// Use custom store
analytics.eventStore = new CustomEventStore()
```

### Custom Insights

```typescript
// Extend InsightsEngine
class CustomInsightsEngine extends InsightsEngine {
  async generateCustomInsights(timeRange: TimeRange): Promise<Insight[]> {
    // Custom logic here
    return insights
  }
}
```

## Testing Strategy

### Unit Tests

- Mock event store for isolation
- Test each component independently
- Cover edge cases and error handling

### Integration Tests

- Test with real storage backends
- Test component interactions
- Test with large datasets

### Performance Tests

- Measure event tracking overhead
- Test with high event volumes
- Verify batch timing

## Future Enhancements

### Potential Features

1. **Data Compression:** Compress old events
2. **Aggregation Cache:** Cache computed statistics
3. **Real-time Monitoring:** Live dashboard updates
4. **Export Formats:** CSV, XML exports
5. **Cloud Sync (Opt-in):** Optional encrypted sync
6. **Advanced Queries:** Query language support
7. **Data Visualization:** Built-in charts
8. **Anomaly Detection:** ML-based anomaly detection

### Backward Compatibility

- Semantic versioning
- Deprecated method warnings
- Migration guides for breaking changes

---

For implementation details, see the [source code](../src).
