/**
 * Quick verification script to test basic functionality
 */

import { Analytics, createAnalytics } from '../src/index'

async function verify() {
  console.log('🔍 Verifying Privacy-First Analytics...\n')

  try {
    // Test 1: Create analytics instance
    console.log('Test 1: Creating analytics instance...')
    const analytics = new Analytics({
      storageBackend: 'localStorage',
      retentionDays: 7,
      enabled: true,
    })
    console.log('✅ Instance created\n')

    // Test 2: Initialize
    console.log('Test 2: Initializing...')
    await analytics.initialize()
    console.log('✅ Initialized\n')

    // Test 3: Track events
    console.log('Test 3: Tracking events...')
    await analytics.track('feature_used' as any, {
      type: 'feature_used',
      featureId: 'test',
      success: true,
    })
    await analytics.track('page_view' as any, {
      type: 'page_view',
      page: '/test',
    })
    console.log('✅ Events tracked\n')

    // Test 4: Query events
    console.log('Test 4: Querying events...')
    const events = await analytics.query({
      timeRange: { type: 'hours', value: 1 },
    })
    console.log(`✅ Found ${events.length} events\n`)

    // Test 5: Get storage info
    console.log('Test 5: Getting storage info...')
    const info = await analytics.getStorageInfo()
    console.log(`✅ ${info.eventCount} events, ${info.estimatedSizeMB.toFixed(2)} MB\n`)

    // Test 6: Clear data
    console.log('Test 6: Clearing data...')
    await analytics.clearAllData()
    console.log('✅ Data cleared\n')

    // Test 7: Shutdown
    console.log('Test 7: Shutting down...')
    await analytics.shutdown()
    console.log('✅ Shutdown complete\n')

    console.log('═'.repeat(60))
    console.log('✅ All verification tests passed!')
    console.log('═'.repeat(60))
  } catch (error) {
    console.error('❌ Verification failed:', error)
    process.exit(1)
  }
}

verify()
