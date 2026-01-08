"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InsightsEngine = void 0;
const aggregator_1 = require("./aggregator");
class InsightsEngine {
    constructor(eventStore) {
        this.aggregator = new aggregator_1.AnalyticsAggregator(eventStore);
    }
    async generateInsights(timeRange, categories) {
        const allInsights = [];
        if (!categories || categories.includes('usage')) {
            allInsights.push(...(await this.generateUsageInsights(timeRange)));
        }
        if (!categories || categories.includes('performance')) {
            allInsights.push(...(await this.generatePerformanceInsights(timeRange)));
        }
        if (!categories || categories.includes('error')) {
            allInsights.push(...(await this.generateErrorInsights(timeRange)));
        }
        if (!categories || categories.includes('engagement')) {
            allInsights.push(...(await this.generateEngagementInsights(timeRange)));
        }
        if (!categories || categories.includes('optimization')) {
            allInsights.push(...(await this.generateOptimizationInsights(timeRange)));
        }
        return allInsights.sort((a, b) => {
            const severityOrder = { critical: 0, warning: 1, info: 2, success: 3 };
            const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
            if (severityDiff !== 0)
                return severityDiff;
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });
    }
    async generateUsageInsights(timeRange) {
        const insights = [];
        const events = await this.getEventsInRange(timeRange);
        const hourCounts = new Array(24).fill(0);
        for (const event of events) {
            const hour = new Date(event.timestamp).getHours();
            hourCounts[hour]++;
        }
        const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
        const peakCount = hourCounts[peakHour];
        const avgCount = hourCounts.reduce((a, b) => a + b, 0) / 24;
        if (peakCount > avgCount * 2) {
            insights.push({
                id: `usage_peak_${Date.now()}`,
                category: 'usage',
                severity: 'info',
                title: 'Peak Usage Detected',
                description: `Your activity peaks at ${peakHour}:00 with ${peakCount} events`,
                timestamp: new Date().toISOString(),
            });
        }
        const dailyEvents = this.bucketEventsByDay(events);
        const recentDays = Object.values(dailyEvents).slice(-7);
        const earlierDays = Object.values(dailyEvents).slice(-14, -7);
        if (recentDays.length > 0 && earlierDays.length > 0) {
            const recentAvg = recentDays.reduce((a, b) => a + b, 0) / recentDays.length;
            const earlierAvg = earlierDays.reduce((a, b) => a + b, 0) / earlierDays.length;
            const change = ((recentAvg - earlierAvg) / earlierAvg) * 100;
            if (Math.abs(change) > 20) {
                insights.push({
                    id: `usage_trend_${Date.now()}`,
                    category: 'usage',
                    severity: change > 0 ? 'success' : 'warning',
                    title: `Activity ${change > 0 ? 'Increased' : 'Decreased'}`,
                    description: `Your activity ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change).toFixed(1)}% compared to last week`,
                    timestamp: new Date().toISOString(),
                });
            }
        }
        return insights;
    }
    async generatePerformanceInsights(timeRange) {
        const insights = [];
        const events = await this.getEventsInRange(timeRange, ['api_response', 'render_complete']);
        const apiEvents = events.filter(e => e.type === 'api_response');
        const apiDurations = apiEvents.map(e => e.data.duration).filter(d => d !== undefined);
        if (apiDurations.length > 10) {
            const sorted = [...apiDurations].sort((a, b) => a - b);
            const p95 = sorted[Math.floor(apiDurations.length * 0.95)];
            if (p95 > 5000) {
                insights.push({
                    id: `perf_slow_api_${Date.now()}`,
                    category: 'performance',
                    severity: p95 > 10000 ? 'critical' : 'warning',
                    title: 'Slow API Response Times',
                    description: `95th percentile response time is ${p95.toFixed(0)}ms`,
                    timestamp: new Date().toISOString(),
                });
            }
        }
        const renderEvents = events.filter(e => e.type === 'render_complete');
        const renderDurations = renderEvents.map(e => e.data.duration).filter(d => d !== undefined);
        if (renderDurations.length > 10) {
            const slowRenders = renderDurations.filter(d => d > 100).length;
            if (slowRenders > renderDurations.length * 0.1) {
                insights.push({
                    id: `perf_slow_render_${Date.now()}`,
                    category: 'performance',
                    severity: 'warning',
                    title: 'Slow Component Rendering',
                    description: `${slowRenders} renders took longer than 100ms`,
                    timestamp: new Date().toISOString(),
                });
            }
        }
        return insights;
    }
    async generateErrorInsights(timeRange) {
        const insights = [];
        const events = await this.getEventsInRange(timeRange, ['error_occurred', 'error_recovered']);
        if (events.length === 0) {
            insights.push({
                id: `error_clean_${Date.now()}`,
                category: 'error',
                severity: 'success',
                title: 'No Errors Detected',
                description: 'No errors occurred in this time period',
                timestamp: new Date().toISOString(),
            });
            return insights;
        }
        const errorCounts = new Map();
        for (const event of events) {
            if (event.type === 'error_occurred') {
                const errorType = event.data.errorType || 'unknown';
                errorCounts.set(errorType, (errorCounts.get(errorType) || 0) + 1);
            }
        }
        for (const [errorType, count] of errorCounts.entries()) {
            if (count > 10) {
                insights.push({
                    id: `error_frequent_${Date.now()}_${errorType}`,
                    category: 'error',
                    severity: count > 50 ? 'critical' : 'warning',
                    title: `Frequent Error: ${errorType}`,
                    description: `${errorType} occurred ${count} times`,
                    timestamp: new Date().toISOString(),
                });
            }
        }
        return insights;
    }
    async generateEngagementInsights(timeRange) {
        const insights = [];
        const events = await this.getEventsInRange(timeRange, ['session_start', 'session_end', 'feature_used']);
        const sessionEnds = events.filter(e => e.type === 'session_end');
        if (sessionEnds.length > 0) {
            const durations = sessionEnds.map(e => e.data.duration || 0);
            const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
            insights.push({
                id: `engagement_session_${Date.now()}`,
                category: 'engagement',
                severity: 'info',
                title: 'Average Session Duration',
                description: `Average session lasts ${Math.floor(avgDuration / 60)} minutes`,
                timestamp: new Date().toISOString(),
            });
        }
        const featureEvents = events.filter(e => e.type === 'feature_used');
        const featureCounts = new Map();
        for (const event of featureEvents) {
            const featureId = event.data.featureId || 'unknown';
            featureCounts.set(featureId, (featureCounts.get(featureId) || 0) + 1);
        }
        const topFeature = Array.from(featureCounts.entries()).sort((a, b) => b[1] - a[1])[0];
        if (topFeature) {
            insights.push({
                id: `engagement_feature_${Date.now()}`,
                category: 'engagement',
                severity: 'info',
                title: 'Most Used Feature',
                description: `${topFeature[0]} is your most used feature with ${topFeature[1]} uses`,
                timestamp: new Date().toISOString(),
            });
        }
        return insights;
    }
    async generateOptimizationInsights(timeRange) {
        const insights = [];
        const events = await this.getEventsInRange(timeRange);
        const apiEvents = events.filter(e => e.type === 'api_response');
        if (apiEvents.length > 100) {
            insights.push({
                id: `opt_batch_${Date.now()}`,
                category: 'optimization',
                severity: 'info',
                title: 'Consider Batch Operations',
                description: 'High API call frequency detected. Batching operations could improve performance.',
                timestamp: new Date().toISOString(),
            });
        }
        if (events.length > 10000) {
            insights.push({
                id: `opt_cleanup_${Date.now()}`,
                category: 'optimization',
                severity: 'warning',
                title: 'Data Cleanup Recommended',
                description: 'Large event history detected. Consider applying retention policies.',
                timestamp: new Date().toISOString(),
            });
        }
        return insights;
    }
    async generateDailySummary(eventStore, date = new Date()) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        const events = await eventStore.queryEvents({
            startTime: startOfDay.toISOString(),
            endTime: endOfDay.toISOString(),
        });
        const messages = events.filter(e => e.type === 'message_sent');
        const sessions = events.filter(e => e.type === 'session_end');
        const errors = events.filter(e => e.type === 'error_occurred');
        const features = events.filter(e => e.type === 'feature_used');
        const hourCounts = new Array(24).fill(0);
        for (const event of events) {
            const hour = new Date(event.timestamp).getHours();
            hourCounts[hour]++;
        }
        const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
        const featureCounts = new Map();
        for (const event of features) {
            const featureId = event.data.featureId || 'unknown';
            featureCounts.set(featureId, (featureCounts.get(featureId) || 0) + 1);
        }
        const mostUsedFeature = Array.from(featureCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
        return {
            date: startOfDay.toISOString().split('T')[0],
            summary: `You sent ${messages.length} messages across ${sessions.length} sessions with ${errors.length} errors.`,
            stats: {
                totalMessages: messages.length,
                totalSessions: sessions.length,
                totalErrors: errors.length,
                mostUsedFeature,
                peakUsageHour: peakHour,
            },
            patterns: [],
            issues: errors.length > 0 ? [`Encountered ${errors.length} errors`] : [],
            suggestions: [],
            trends: {
                messages: 'stable',
                errors: 'stable',
                performance: 'good',
            },
        };
    }
    async getEventsInRange(timeRange, types) {
        const { start, end } = this.getTimeRangeBoundaries(timeRange);
        const eventStore = this.aggregator.eventStore;
        return eventStore.queryEvents({
            startTime: start,
            endTime: end,
            types,
        });
    }
    getTimeRangeBoundaries(timeRange) {
        const end = new Date();
        const start = new Date();
        switch (timeRange.type) {
            case 'hours':
                start.setHours(start.getHours() - timeRange.value);
                break;
            case 'days':
                start.setDate(start.getDate() - timeRange.value);
                break;
            case 'weeks':
                start.setDate(start.getDate() - timeRange.value * 7);
                break;
            case 'months':
                start.setMonth(start.getMonth() - timeRange.value);
                break;
            case 'all':
                start.setFullYear(start.getFullYear() - 100);
                break;
        }
        return {
            start: start.toISOString(),
            end: end.toISOString(),
        };
    }
    bucketEventsByDay(events) {
        const daily = {};
        for (const event of events) {
            const day = event.timestamp.split('T')[0];
            daily[day] = (daily[day] || 0) + 1;
        }
        return daily;
    }
}
exports.InsightsEngine = InsightsEngine;
//# sourceMappingURL=insights.js.map