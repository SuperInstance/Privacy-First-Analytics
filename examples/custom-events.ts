/**
 * Custom Events Example
 *
 * Demonstrates how to create and track custom events
 */

import { Analytics } from '@superinstance/privacy-first-analytics'

async function main() {
  const analytics = new Analytics()
  await analytics.initialize()

  console.log('📊 Custom Events Example\n')

  // Custom Event 1: E-commerce actions
  await analytics.track('product_viewed', {
    type: 'product_viewed',
    productId: 'prod_123',
    category: 'electronics',
    price: 299.99,
  })

  await analytics.track('product_added_to_cart', {
    type: 'product_added_to_cart',
    productId: 'prod_123',
    quantity: 2,
    cartValue: 599.98,
  })

  // Custom Event 2: Content engagement
  await analytics.track('article_read', {
    type: 'article_read',
    articleId: 'article_456',
    category: 'tutorial',
    readTime: 180, // seconds
    completed: true,
  })

  // Custom Event 3: Social interactions
  await analytics.track('content_shared', {
    type: 'content_shared',
    contentType: 'article',
    contentId: 'article_456',
    platform: 'twitter',
  })

  // Custom Event 4: User milestones
  await analytics.track('milestone_reached', {
    type: 'milestone_reached',
    milestone: '100_logins',
    daysSinceSignup: 45,
  })

  // Custom Event 5: Custom metrics
  await analytics.track('custom_metric', {
    type: 'custom_metric',
    metricName: 'database_query_time',
    value: 23,
    unit: 'ms',
    queryType: 'SELECT',
    cacheHit: true,
  })

  console.log('✅ Custom events tracked successfully\n')

  // Query custom events
  const customEvents = await analytics.query({
    timeRange: { type: 'hours', value: 1 },
    eventTypes: ['product_viewed', 'article_read', 'milestone_reached'],
  })

  console.log(`📝 Found ${customEvents.length} custom events:`)
  customEvents.forEach(event => {
    console.log(`  - ${event.type}:`, JSON.stringify(event.data, null, 2))
  })

  // Aggregate custom event data
  const allEvents = await analytics.query({
    timeRange: { type: 'hours', value: 1 },
  })

  // Group by event type
  const eventCounts: Record<string, number> = {}
  allEvents.forEach(event => {
    eventCounts[event.type] = (eventCounts[event.type] || 0) + 1
  })

  console.log('\n📊 Event Counts:')
  Object.entries(eventCounts)
    .sort(([, a], [, b]) => b - a)
    .forEach(([type, count]) => {
      console.log(`  - ${type}: ${count}`)
    })

  await analytics.shutdown()
}

main().catch(console.error)
