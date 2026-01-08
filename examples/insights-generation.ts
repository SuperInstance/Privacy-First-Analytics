/**
 * Insights Generation Example
 *
 * Demonstrates how to generate and analyze insights from analytics data
 */

import { Analytics } from '@superinstance/privacy-first-analytics'

async function generateSampleData(analytics: Analytics) {
  console.log('📝 Generating sample data...')

  // Simulate a week of activity
  const now = Date.now()
  const dayInMs = 24 * 60 * 60 * 1000

  for (let day = 0; day < 7; day++) {
    const dayStart = now - (7 - day) * dayInMs

    // Track 10-20 sessions per day
    const sessionCount = 10 + Math.floor(Math.random() * 10)

    for (let session = 0; session < sessionCount; session++) {
      await analytics.track('session_start', {
        type: 'session_start',
        source: Math.random() > 0.5 ? 'direct' : 'link',
      })

      // Track 5-15 actions per session
      const actionCount = 5 + Math.floor(Math.random() * 10)

      for (let action = 0; action < actionCount; action++) {
        const features = ['search', 'export', 'import', 'settings', 'dashboard']
        const feature = features[Math.floor(Math.random() * features.length)]

        await analytics.track('feature_used', {
          type: 'feature_used',
          featureId: feature,
          success: Math.random() > 0.1, // 90% success rate
          duration: 1000 + Math.random() * 4000,
        })

        // Occasionally track API responses
        if (Math.random() > 0.7) {
          await analytics.track('api_response', {
            type: 'api_response',
            endpoint: `/api/${feature}`,
            method: 'GET',
            duration: 100 + Math.random() * 900,
            success: Math.random() > 0.05, // 95% success rate
          })
        }

        // Occasionally track errors
        if (Math.random() > 0.9) {
          await analytics.track('error_occurred', {
            type: 'error_occurred',
            errorType: 'NetworkError',
            errorMessage: 'Connection timeout',
            context: `/api/${feature}`,
            recoverable: true,
          })
        }
      }

      await analytics.track('session_end', {
        type: 'session_end',
        duration: 300 + Math.random() * 1800, // 5-35 minutes
        actionsPerformed: actionCount,
        messagesSent: Math.floor(Math.random() * 5),
        featuresUsed: ['search', 'export'],
      })
    }

    console.log(`  Day ${day + 1}: ${sessionCount} sessions`)
  }

  console.log('✅ Sample data generated\n')
}

async function main() {
  const analytics = new Analytics({
    storageBackend: 'indexedDB',
    retentionDays: 30,
  })

  await analytics.initialize()

  // Generate sample data
  await generateSampleData(analytics)

  console.log('🔍 Generating Insights\n')
  console.log('═'.repeat(60))

  // 1. Generate comprehensive insights
  const insights = await analytics.generateInsights({
    type: 'days',
    value: 7,
  })

  console.log('\n📊 All Insights:')
  insights.forEach((insight, index) => {
    const icon =
      insight.severity === 'critical' ? '🚨'
      : insight.severity === 'warning' ? '⚠️'
      : insight.severity === 'success' ? '✅'
      : 'ℹ️'

    console.log(`\n${index + 1}. ${icon} [${insight.category}] ${insight.title}`)
    console.log(`   ${insight.description}`)

    if (insight.data) {
      console.log(`   Data: ${JSON.stringify(insight.data, null, 2)}`)
    }
  })

  // 2. Feature Usage Analysis
  console.log('\n\n' + '═'.repeat(60))
  console.log('\n🔥 Feature Usage Analysis')

  const features = await analytics.getFeatureUsage(
    { type: 'days', value: 7 },
    10
  )

  console.log('\nTop Features:')
  features.forEach((feature, index) => {
    const bar = '█'.repeat(Math.min(50, Math.floor(feature.usageCount / 2)))
    console.log(
      `\n${index + 1}. ${feature.featureId}`
    )
    console.log(`   Usage: ${feature.usageCount} ${bar}`)
    console.log(`   Success Rate: ${(feature.successRate * 100).toFixed(1)}%`)
    if (feature.averageDuration) {
      console.log(`   Avg Duration: ${feature.averageDuration.toFixed(0)}ms`)
    }
    console.log(`   Trend: ${feature.trend}`)
  })

  // 3. Error Analysis
  console.log('\n\n' + '═'.repeat(60))
  console.log('\n❌ Error Analysis')

  const errors = await analytics.getErrorStats({ type: 'days', value: 7 }, 10)

  if (errors.length === 0) {
    console.log('\n✅ No errors detected in the past 7 days!')
  } else {
    console.log(`\nFound ${errors.length} error types:\n`)
    errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.errorType}`)
      console.log(`   Count: ${error.count}`)
      console.log(`   Recoverable: ${error.recoverable ? 'Yes' : 'No'}`)
      console.log(`   Recovery Rate: ${(error.recoveryRate * 100).toFixed(1)}%`)
      if (error.avgRecoveryTime) {
        console.log(`   Avg Recovery Time: ${error.avgRecoveryTime.toFixed(0)}ms`)
      }
      console.log(`   Trend: ${error.trend}`)
      console.log('')
    })
  }

  // 4. Performance Metrics
  console.log('═'.repeat(60))
  console.log('\n⚡ Performance Metrics')

  const performance = await analytics.getPerformanceMetrics({
    type: 'days',
    value: 7,
  })

  console.log('\nPerformance by Category:')
  performance.forEach((metric) => {
    const status =
      metric.trend === 'improving' ? '✅ Improving'
      : metric.trend === 'degrading' ? '⚠️ Degrading'
      : '➡️ Stable'

    console.log(`\n${metric.category}:`)
    console.log(`   Avg: ${metric.avgDuration.toFixed(0)}ms`)
    console.log(`   P95: ${metric.p95Duration.toFixed(0)}ms`)
    console.log(`   P99: ${metric.p99Duration.toFixed(0)}ms`)
    console.log(`   Success Rate: ${(metric.successRate * 100).toFixed(1)}%`)
    console.log(`   Total Ops: ${metric.totalOperations}`)
    console.log(`   Status: ${status}`)
  })

  // 5. Engagement Summary
  console.log('\n\n' + '═'.repeat(60))
  console.log('\n📈 Engagement Summary')

  const engagement = await analytics.getEngagementSummary({
    type: 'days',
    value: 7,
  })

  console.log('\nWeekly Engagement:')
  console.log(`  Total Sessions: ${engagement.totalSessions}`)
  console.log(`  Avg Session Duration: ${Math.floor(engagement.avgSessionDuration / 60)} minutes`)
  console.log(`  Avg Messages/Session: ${engagement.avgMessagesPerSession.toFixed(1)}`)
  console.log(`  Active Days: ${engagement.activeDays}`)
  console.log(`  Avg Sessions/Day: ${engagement.avgSessionsPerDay.toFixed(1)}`)
  console.log(`  Most Active Day: ${engagement.mostActiveDay}`)
  console.log(`  Peak Usage Hour: ${engagement.peakUsageHour}:00`)

  if (engagement.peakUsageHours.length > 1) {
    console.log(`  All Peak Hours: ${engagement.peakUsageHours.join(', ')}:00`)
  }

  // 6. Storage Information
  console.log('\n\n' + '═'.repeat(60))
  console.log('\n💾 Storage Information')

  const storageInfo = await analytics.getStorageInfo()

  console.log(`\n  Total Events: ${storageInfo.eventCount}`)
  console.log(`  Estimated Size: ${storageInfo.estimatedSizeMB.toFixed(2)} MB`)

  // Cleanup
  await analytics.shutdown()

  console.log('\n\n' + '═'.repeat(60))
  console.log('\n✅ Insights generation complete!')
}

main().catch(console.error)
