# Privacy-First Analytics

> Local analytics that respect user privacy - no data leaves the device

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-%3E=18.0.0-green)](https://nodejs.org/)

## What is Privacy-First Analytics?

Privacy-First Analytics is a **local-only analytics library** that helps you understand user behavior without compromising privacy. Unlike traditional analytics tools that send data to cloud servers, Privacy-First Analytics stores everything locally on the user's device.

**No cloud synchronization. No external dependencies. No data leaves the device.**

### Why Privacy-First?

- **Zero Data Transmission**: All data stays on the device
- **GDPR Compliant by Design**: No personal data is collected or transmitted
- **User-Controlled Retention**: Users can export, delete, or manage their data
- **Sub-Millisecond Performance**: Non-blocking event collection with batching
- **Offline-First**: Works perfectly without internet connection
- **Transparent**: Users can see exactly what data is collected

## Features

- ✅ **Event Collection**: Track user actions, performance, engagement, and errors
- ✅ **Local-Only Storage**: Choose between IndexedDB or localStorage
- ✅ **Automated Insights**: Generate actionable insights from your data
- ✅ **Queryable Events**: Powerful query interface for filtering events
- ✅ **Aggregation**: Time-series data, statistics, and patterns
- ✅ **Data Export**: Export data in JSON format for analysis
- ✅ **Retention Policies**: Automatic cleanup of old data
- ✅ **Privacy Controls**: Enable/disable tracking, sampling rate control
- ✅ **Zero Dependencies**: Works in any JavaScript/TypeScript project
- ✅ **TypeScript**: Full type safety and IntelliSense support

## Quick Start

### Installation

```bash
npm install @superinstance/privacy-first-analytics
# or
yarn add @superinstance/privacy-first-analytics
# or
pnpm add @superinstance/privacy-first-analytics
```

### Basic Usage

```typescript
import { Analytics } from '@superinstance/privacy-first-analytics'

// Create and initialize analytics
const analytics = new Analytics({
  storageBackend: 'indexedDB', // or 'localStorage'
  retentionDays: 90,           // Keep data for 90 days
})

await analytics.initialize()

// Track an event
await analytics.track('feature_used', {
  type: 'feature_used',
  featureId: 'search',
  success: true,
  duration: 1234,
})

// Generate insights
const insights = await analytics.generateInsights({ type: 'days', value: 7 })
console.log(insights)

// Get feature usage statistics
const features = await analytics.getFeatureUsage()
console.log('Most used features:', features)

// Export all data
const data = await analytics.exportData()
console.log('Exported', data.eventCount, 'events')
```

## Configuration

```typescript
const analytics = new Analytics({
  enabled: true,                    // Enable/disable analytics
  persist: true,                    // Persist events to storage
  maxEvents: 100000,                // Maximum events to keep (0 = unlimited)
  batchSize: 50,                    // Batch size for writing to storage
  batchInterval: 5000,              // Batch write interval (ms)
  detailedPerformance: true,        // Track detailed performance metrics
  trackErrors: true,                // Track errors
  sessionTimeout: 1800000,          // Session timeout (ms, default: 30 min)
  retentionDays: 90,                // Data retention period (0 = forever)
  samplingRate: 1.0,                // Sampling rate (0-1, 1 = track all)
  storageBackend: 'indexedDB',      // 'indexedDB' or 'localStorage'
})
```

## Event Types

### Standard Events

```typescript
// User Actions
await analytics.track('message_sent', { type: 'message_sent', conversationId: '...', messageLength: 100, hasAttachment: false })
await analytics.track('conversation_created', { type: 'conversation_created', conversationType: 'direct', hasAIContact: true })
await analytics.track('settings_changed', { type: 'settings_changed', setting: 'theme', previousValue: 'dark', newValue: 'light' })

// Performance
await analytics.track('api_response', { type: 'api_response', endpoint: '/api/users', method: 'GET', duration: 234, success: true })
await analytics.track('render_complete', { type: 'render_complete', component: 'Dashboard', duration: 45, elementCount: 150 })

// Engagement
await analytics.track('session_start', { type: 'session_start', source: 'direct' })
await analytics.track('feature_used', { type: 'feature_used', featureId: 'search', success: true, duration: 5000 })
await analytics.track('page_view', { type: 'page_view', page: '/dashboard' })

// Errors
await analytics.track('error_occurred', { type: 'error_occurred', errorType: 'NetworkError', errorMessage: 'Failed to fetch', context: '/api/users', recoverable: true })
```

### Custom Events

```typescript
// Track custom events with any data you want
await analytics.track('custom_event', {
  type: 'custom_event',
  customField: 'value',
  numericValue: 42,
  metadata: { key: 'value' },
})
```

## Querying Events

```typescript
// Query events from the last 7 days
const events = await analytics.query({
  timeRange: { type: 'days', value: 7 },
  eventTypes: ['feature_used', 'page_view'],
  limit: 100,
  sortOrder: 'desc',
})

// Query with time range
const last24Hours = await analytics.query({
  timeRange: { type: 'hours', value: 24 },
})
```

## Analytics Features

### Feature Usage

```typescript
const features = await analytics.getFeatureUsage({ type: 'days', value: 30 }, 10)
// Returns: Array of most used features with statistics
```

### Error Statistics

```typescript
const errors = await analytics.getErrorStats({ type: 'days', value: 7 }, 10)
// Returns: Array of error types with occurrence counts and recovery rates
```

### Performance Metrics

```typescript
const performance = await analytics.getPerformanceMetrics({ type: 'days', value: 7 })
// Returns: Array of performance metrics for different operations
```

### Engagement Summary

```typescript
const engagement = await analytics.getEngagementSummary({ type: 'days', value: 7 })
// Returns: Engagement metrics including session stats, peak hours, etc.
```

### Insights

```typescript
// Generate insights for the last 7 days
const insights = await analytics.generateInsights({ type: 'days', value: 7 })

// Insights include:
// - Usage patterns (peak hours, activity trends)
// - Performance issues (slow APIs, render times)
// - Error patterns (frequent errors, recovery rates)
// - Engagement metrics (session duration, feature adoption)
// - Optimization suggestions
```

## Data Management

### Export Data

```typescript
const exportData = await analytics.exportData({ type: 'days', value: 30 })

// Export contains:
// - All events in the time range
// - Aggregated statistics
// - Time series data
// - Summaries by category

// Save to file
const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
const url = URL.createObjectURL(blob)
// Trigger download...
```

### Clear Data

```typescript
// Clear all analytics data
await analytics.clearAllData()

// Apply retention policy (delete old data)
const deletedCount = await analytics.applyRetentionPolicy()
console.log('Deleted', deletedCount, 'old events')
```

### Storage Information

```typescript
const info = await analytics.getStorageInfo()
console.log('Event count:', info.eventCount)
console.log('Estimated size:', info.estimatedSizeMB, 'MB')
```

## Privacy & GDPR

### Privacy by Design

- **No Data Transmission**: All data stays on the user's device
- **No Third-Party Services**: No external dependencies or cloud services
- **User Control**: Users can export, view, and delete their data
- **Transparent**: Event schemas are visible and customizable
- **Opt-Out**: Easy to disable analytics completely

### GDPR Compliance

This library is designed to be GDPR compliant by default:

1. **Data Minimization**: Only collect data you need
2. **User Rights**: Built-in export and delete functions
3. **Consent**: Easy opt-in/opt-out mechanism
4. **Data Portability**: Export data in JSON format
5. **Right to be Forgotten**: Clear all data with one function

## Storage Backends

### IndexedDB (Default)

```typescript
const analytics = new Analytics({
  storageBackend: 'indexedDB',
  maxEvents: 100000,  // Large capacity
})
```

**Pros:**
- Large storage capacity (hundreds of MB)
- Better performance for large datasets
- Asynchronous operations

**Cons:**
- More complex API
- Not available in all environments (Node.js)

### localStorage

```typescript
const analytics = new Analytics({
  storageBackend: 'localStorage',
  maxEvents: 10000,  // Smaller capacity
})
```

**Pros:**
- Simple API
- Widely supported
- Synchronous operations

**Cons:**
- Limited capacity (~5-10MB)
- Slower for large datasets
- Blocking operations

## Architecture

```
┌─────────────────────────────────────────────┐
│              Analytics Class                │
│  (Main orchestrator & public API)          │
└─────────────────┬───────────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
┌───▼────┐   ┌───▼────┐   ┌───▼────────┐
│ Event  │   │Aggreg- │   │  Insights  │
│Collector│  │  ator  │   │   Engine   │
└───┬────┘   └───┬────┘   └───┬────────┘
    │             │             │
    └─────────────┼─────────────┘
                  │
           ┌──────▼──────┐
           │  EventStore │
           │  (Storage)  │
           └─────────────┘
                  │
      ┌───────────┴───────────┐
      │                       │
┌─────▼────────┐      ┌──────▼──────┐
│  IndexedDB   │      │ localStorage │
│   Backend    │      │   Backend   │
└──────────────┘      └─────────────┘
```

## Performance

- **Sub-millisecond overhead**: Event tracking is non-blocking
- **Batch writes**: Events are batched for efficient storage
- **Sampling**: Configurable sampling rate to reduce overhead
- **Efficient queries**: Indexed queries for fast lookups

## Use Cases

### Web Applications

Track user behavior, performance, and errors without privacy concerns:

```typescript
// Track feature usage
await analytics.track('feature_used', {
  type: 'feature_used',
  featureId: 'file-upload',
  success: true,
})

// Track performance
await analytics.track('api_response', {
  type: 'api_response',
  endpoint: '/api/upload',
  method: 'POST',
  duration: 1234,
  success: true,
})
```

### Progressive Web Apps (PWAs)

Offline-first analytics that work without internet:

```typescript
// All data stored locally
// Sync when online (optional, custom implementation)
const analytics = new Analytics({ storageBackend: 'indexedDB' })
```

### Privacy-Sensitive Applications

For applications that cannot use cloud analytics:

- Healthcare applications
- Financial applications
- Educational platforms
- Enterprise tools

## API Reference

See [docs/API.md](docs/API.md) for complete API documentation.

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Repository

https://github.com/SuperInstance/Privacy-First-Analytics

## Support

- Open an issue on GitHub
- Check existing issues and discussions
- Read the documentation

---

Made with ❤️ by [SuperInstance](https://github.com/SuperInstance)
