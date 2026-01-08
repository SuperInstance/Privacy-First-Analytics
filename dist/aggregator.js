"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsAggregator = void 0;
function getTimeRangeBoundaries(timeRange) {
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
function bucketTimestamp(timestamp, bucket) {
    const date = new Date(timestamp);
    switch (bucket) {
        case 'hour':
            date.setMinutes(0, 0, 0);
            break;
        case 'day':
            date.setHours(0, 0, 0, 0);
            break;
        case 'week':
            const dayOfWeek = date.getDay();
            date.setDate(date.getDate() - dayOfWeek);
            date.setHours(0, 0, 0, 0);
            break;
        case 'month':
            date.setDate(1);
            date.setHours(0, 0, 0, 0);
            break;
    }
    return date.toISOString();
}
function calculateTrend(values) {
    if (values.length < 2)
        return 'stable';
    const recent = values.slice(Math.floor(values.length / 2));
    const older = values.slice(0, Math.floor(values.length / 2));
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    const diff = recentAvg - olderAvg;
    const threshold = olderAvg * 0.1;
    if (diff > threshold)
        return 'increasing';
    if (diff < -threshold)
        return 'decreasing';
    return 'stable';
}
function trendToPerformanceTrend(trend) {
    if (trend === 'increasing')
        return 'degrading';
    if (trend === 'decreasing')
        return 'improving';
    return 'stable';
}
class AnalyticsAggregator {
    constructor(eventStore) {
        this.eventStore = eventStore;
    }
    async getEventCountsByType(timeRange) {
        const { start, end } = getTimeRangeBoundaries(timeRange);
        const events = await this.eventStore.queryEvents({
            startTime: start,
            endTime: end,
        });
        const counts = {};
        for (const event of events) {
            counts[event.type] = (counts[event.type] || 0) + 1;
        }
        return counts;
    }
    async getEventCountsByCategory(timeRange) {
        const { start, end } = getTimeRangeBoundaries(timeRange);
        const events = await this.eventStore.queryEvents({
            startTime: start,
            endTime: end,
        });
        const counts = {};
        for (const event of events) {
            counts[event.category] = (counts[event.category] || 0) + 1;
        }
        return counts;
    }
    async getTimeSeries(timeRange, bucket = 'day', eventType) {
        const { start, end } = getTimeRangeBoundaries(timeRange);
        const types = eventType ? [eventType] : undefined;
        const events = await this.eventStore.queryEvents({
            startTime: start,
            endTime: end,
            types,
        });
        const bucketed = {};
        for (const event of events) {
            const bucketKey = bucketTimestamp(event.timestamp, bucket);
            bucketed[bucketKey] = (bucketed[bucketKey] || 0) + 1;
        }
        return Object.entries(bucketed)
            .map(([timestamp, count]) => ({ timestamp, value: count, count }))
            .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    }
    async getMostUsedFeatures(timeRange, limit = 10) {
        const { start, end } = getTimeRangeBoundaries(timeRange);
        const events = await this.eventStore.queryEvents({
            startTime: start,
            endTime: end,
            types: ['feature_used'],
        });
        const featureMap = new Map();
        for (const event of events) {
            const data = event.data;
            const featureId = data.featureId || 'unknown';
            const existing = featureMap.get(featureId) || {
                count: 0,
                lastUsed: event.timestamp,
                durations: [],
                successes: 0,
                failures: 0,
            };
            existing.count++;
            if (event.timestamp > existing.lastUsed) {
                existing.lastUsed = event.timestamp;
            }
            if (data.duration)
                existing.durations.push(data.duration);
            if (data.success) {
                existing.successes++;
            }
            else {
                existing.failures++;
            }
            featureMap.set(featureId, existing);
        }
        const stats = [];
        for (const [featureId, data] of featureMap.entries()) {
            const durations = data.durations;
            stats.push({
                featureId,
                usageCount: data.count,
                lastUsed: data.lastUsed,
                totalDuration: durations.reduce((a, b) => a + b, 0),
                averageDuration: durations.length
                    ? durations.reduce((a, b) => a + b, 0) / durations.length
                    : undefined,
                successRate: data.successes / (data.successes + data.failures),
                trend: 'stable',
            });
        }
        stats.sort((a, b) => b.usageCount - a.usageCount);
        return stats.slice(0, limit);
    }
    async getErrorStats(timeRange, limit = 10) {
        const { start, end } = getTimeRangeBoundaries(timeRange);
        const events = await this.eventStore.queryEvents({
            startTime: start,
            endTime: end,
            types: ['error_occurred'],
        });
        const errorMap = new Map();
        for (const event of events) {
            const data = event.data;
            const errorType = data.errorType || 'unknown';
            const existing = errorMap.get(errorType) || {
                count: 0,
                lastOccurred: event.timestamp,
                recoverable: data.recoverable || false,
                recoveries: 0,
                recoveryTimes: [],
            };
            existing.count++;
            if (event.timestamp > existing.lastOccurred) {
                existing.lastOccurred = event.timestamp;
            }
            errorMap.set(errorType, existing);
        }
        const recoveryEvents = await this.eventStore.queryEvents({
            startTime: start,
            endTime: end,
            types: ['error_recovered'],
        });
        for (const event of recoveryEvents) {
            const data = event.data;
            const errorType = data.errorType || 'unknown';
            const existing = errorMap.get(errorType);
            if (existing) {
                existing.recoveries++;
                if (data.recoveryTime) {
                    existing.recoveryTimes.push(data.recoveryTime);
                }
            }
        }
        const stats = [];
        for (const [errorType, data] of errorMap.entries()) {
            stats.push({
                errorType,
                count: data.count,
                lastOccurred: data.lastOccurred,
                recoverable: data.recoverable,
                recoveryRate: data.recoveries / data.count,
                avgRecoveryTime: data.recoveryTimes.length
                    ? data.recoveryTimes.reduce((a, b) => a + b, 0) / data.recoveryTimes.length
                    : undefined,
                trend: 'stable',
            });
        }
        stats.sort((a, b) => b.count - a.count);
        return stats.slice(0, limit);
    }
    async getPerformanceMetrics(timeRange, category) {
        const { start, end } = getTimeRangeBoundaries(timeRange);
        const types = category
            ? []
            : ['api_response', 'render_complete', 'storage_operation', 'app_initialized'];
        const events = await this.eventStore.queryEvents({
            startTime: start,
            endTime: end,
            types: types.length ? types : undefined,
        });
        const metricsMap = new Map();
        for (const event of events) {
            const data = event.data;
            const duration = data.duration || data.initTime || 0;
            const success = data.success !== false;
            const cat = category || data.endpoint || data.component || data.operation || 'other';
            const existing = metricsMap.get(cat) || {
                durations: [],
                successes: 0,
                failures: 0,
                timestamps: [],
            };
            existing.durations.push(duration);
            if (success) {
                existing.successes++;
            }
            else {
                existing.failures++;
            }
            existing.timestamps.push(new Date(event.timestamp).getTime());
            metricsMap.set(cat, existing);
        }
        const metrics = [];
        for (const [cat, data] of metricsMap.entries()) {
            const sorted = [...data.durations].sort((a, b) => a - b);
            const total = data.successes + data.failures;
            metrics.push({
                category: cat,
                avgDuration: sorted.reduce((a, b) => a + b, 0) / sorted.length,
                p95Duration: sorted[Math.floor(sorted.length * 0.95)],
                p99Duration: sorted[Math.floor(sorted.length * 0.99)],
                successRate: data.successes / total,
                totalOperations: total,
                trend: trendToPerformanceTrend(calculateTrend(data.durations)),
            });
        }
        return metrics;
    }
    async getEngagementSummary(timeRange) {
        const { start, end } = getTimeRangeBoundaries(timeRange);
        const events = await this.eventStore.queryEvents({
            startTime: start,
            endTime: end,
        });
        let totalSessions = 0;
        let totalSessionTime = 0;
        let totalMessages = 0;
        const hourCounts = new Array(24).fill(0);
        const dayCounts = new Map();
        for (const event of events) {
            const date = new Date(event.timestamp);
            const hour = date.getHours();
            const dayKey = date.toISOString().split('T')[0];
            hourCounts[hour]++;
            dayCounts.set(dayKey, (dayCounts.get(dayKey) || 0) + 1);
            if (event.type === 'session_start') {
                totalSessions++;
            }
            if (event.type === 'session_end') {
                const data = event.data;
                totalSessionTime += data.duration || 0;
            }
            if (event.type === 'message_sent') {
                totalMessages++;
            }
        }
        const maxHourCount = Math.max(...hourCounts);
        const peakUsageHours = hourCounts
            .map((count, hour) => ({ hour, count }))
            .filter(({ count }) => count === maxHourCount)
            .map(({ hour }) => hour);
        let mostActiveDay = '';
        let maxDayCount = 0;
        for (const [day, count] of dayCounts.entries()) {
            if (count > maxDayCount) {
                maxDayCount = count;
                mostActiveDay = day;
            }
        }
        return {
            totalSessions,
            totalSessionTime,
            avgSessionDuration: totalSessions ? totalSessionTime / totalSessions : 0,
            avgMessagesPerSession: totalSessions ? totalMessages / totalSessions : 0,
            mostActiveDay,
            mostActiveHour: peakUsageHours[0] || 0,
            peakUsageHours,
            retentionRate: 0,
            activeDays: dayCounts.size,
            avgSessionsPerDay: dayCounts.size ? totalSessions / dayCounts.size : 0,
            totalTime: totalSessionTime,
            peakUsageHour: peakUsageHours[0] || 0,
        };
    }
    async getPeakUsageHours(timeRange) {
        const { start, end } = getTimeRangeBoundaries(timeRange);
        const events = await this.eventStore.queryEvents({
            startTime: start,
            endTime: end,
        });
        const hourCounts = new Array(24).fill(0);
        for (const event of events) {
            const hour = new Date(event.timestamp).getHours();
            hourCounts[hour]++;
        }
        const maxCount = Math.max(...hourCounts);
        return hourCounts
            .map((count, hour) => (count === maxCount ? hour : -1))
            .filter(hour => hour >= 0);
    }
    async getErrorRate(_context, timeRange) {
        const { start, end } = getTimeRangeBoundaries(timeRange);
        const [errorEvents, allEvents] = await Promise.all([
            this.eventStore.queryEvents({
                startTime: start,
                endTime: end,
                types: ['error_occurred'],
            }),
            this.eventStore.queryEvents({
                startTime: start,
                endTime: end,
            }),
        ]);
        const errorTypes = {};
        for (const event of errorEvents) {
            const data = event.data;
            const errorType = data.errorType || 'unknown';
            errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
        }
        return {
            totalErrors: errorEvents.length,
            totalEvents: allEvents.length,
            errorRate: allEvents.length ? errorEvents.length / allEvents.length : 0,
            errorTypes,
        };
    }
}
exports.AnalyticsAggregator = AnalyticsAggregator;
//# sourceMappingURL=aggregator.js.map