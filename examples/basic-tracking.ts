/**
 * Basic Tracking Example
 *
 * Demonstrates basic event tracking with Privacy-First Analytics
 */

import { Analytics } from '@superinstance/privacy-first-analytics'

async function main() {
  // Initialize analytics with default settings
  const analytics = new Analytics({
    storageBackend: 'indexedDB',
    retentionDays: 30,
  })

  await analytics.initialize()

  console.log('📊 Privacy-First Analytics initialized')

  // Track different types of events

  // 1. User Actions
  await analytics.track('feature_used', {
    type: 'feature_used',
    featureId: 'search',
    success: true,
    duration: 234,
  })

  await analytics.track('page_view', {
    type: 'page_view',
    page: '/dashboard',
  })

  // 2. Performance
  await analytics.track('api_response', {
    type: 'api_response',
    endpoint: '/api/users',
    method: 'GET',
    duration: 145,
    success: true,
  })

  // 3. Engagement
  await analytics.track('session_start', {
    type: 'session_start',
    source: 'direct',
  })

  // Simulate some activity
  await new Promise(resolve => setTimeout(resolve, 1000))

  await analytics.track('feature_used', {
    type: 'feature_used',
    featureId: 'export',
    success: true,
    duration: 567,
  })

  console.log('✅ Events tracked successfully')

  // Query events
  const events = await analytics.query({
    timeRange: { type: 'hours', value: 1 },
    limit: 10,
  })

  console.log(`\n📝 Found ${events.length} events in the last hour`)

  // Generate insights
  const insights = await analytics.generateInsights({
    type: 'hours',
    value: 1,
  })

  console.log(`\n💡 Generated ${insights.length} insights`)

  insights.forEach(insight => {
    console.log(`  - [${insight.severity.toUpperCase()}] ${insight.title}`)
    console.log(`    ${insight.description}`)
  })

  // Get feature usage
  const features = await analytics.getFeatureUsage({
    type: 'hours',
    value: 1,
  })

  console.log('\n🔥 Most Used Features:')
  features.slice(0, 5).forEach(feature => {
    console.log(`  - ${feature.featureId}: ${feature.usageCount} uses`)
  })

  // Get storage info
  const storageInfo = await analytics.getStorageInfo()
  console.log('\n💾 Storage Info:')
  console.log(`  - Events: ${storageInfo.eventCount}`)
  console.log(`  - Size: ${storageInfo.estimatedSizeMB.toFixed(2)} MB`)

  // Shutdown
  await analytics.shutdown()
  console.log('\n👋 Analytics shutdown complete')
}

// Run the example
main().catch(console.error)
