"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Analytics = void 0;
exports.createAnalytics = createAnalytics;
exports.getAnalytics = getAnalytics;
const collector_1 = require("./collector");
const aggregator_1 = require("./aggregator");
const insights_1 = require("./insights");
const storage_1 = require("./storage");
const types_1 = require("./types");
class Analytics {
    constructor(config = {}) {
        this.initialized = false;
        this.config = { ...types_1.DEFAULT_ANALYTICS_CONFIG, ...config };
        this.eventStore = (0, storage_1.createEventStore)(this.config.storageBackend, this.config);
        this.collector = new collector_1.EventCollector(this.eventStore, this.config);
        this.aggregator = new aggregator_1.AnalyticsAggregator(this.eventStore);
        this.insights = new insights_1.InsightsEngine(this.eventStore);
    }
    async initialize(config) {
        if (this.initialized)
            return;
        if (config) {
            this.config = { ...this.config, ...config };
        }
        await this.collector.initialize(config);
        this.initialized = true;
    }
    async track(type, data) {
        if (!this.initialized) {
            await this.initialize();
        }
        await this.collector.track(type, data);
    }
    async query(options) {
        const { start, end } = this.getTimeRangeBoundaries(options.timeRange);
        return this.eventStore.queryEvents({
            startTime: start,
            endTime: end,
            types: options.eventTypes,
            categories: options.filters?.category,
            limit: options.limit,
            offset: options.offset,
            sortOrder: options.sortOrder,
        });
    }
    async generateInsights(timeRange = { type: 'days', value: 7 }) {
        return this.insights.generateInsights(timeRange);
    }
    async getFeatureUsage(timeRange = { type: 'days', value: 7 }, limit = 10) {
        return this.aggregator.getMostUsedFeatures(timeRange, limit);
    }
    async getErrorStats(timeRange = { type: 'days', value: 7 }, limit = 10) {
        return this.aggregator.getErrorStats(timeRange, limit);
    }
    async getPerformanceMetrics(timeRange = { type: 'days', value: 7 }) {
        return this.aggregator.getPerformanceMetrics(timeRange);
    }
    async getEngagementSummary(timeRange = { type: 'days', value: 7 }) {
        return this.aggregator.getEngagementSummary(timeRange);
    }
    async getDailySummary(date) {
        return this.insights.generateDailySummary(this.eventStore, date);
    }
    async exportData(timeRange = { type: 'days', value: 30 }) {
        const { start, end } = this.getTimeRangeBoundaries(timeRange);
        const events = await this.eventStore.queryEvents({
            startTime: start,
            endTime: end,
        });
        const userActions = await this.aggregator.getEventCountsByCategory(timeRange);
        return {
            exportedAt: new Date().toISOString(),
            timeRange: { start, end },
            eventCount: events.length,
            events,
            summaries: {
                userActions: {
                    count: (userActions.user_action || 0),
                },
                performance: {
                    count: (userActions.performance || 0),
                },
                engagement: {
                    count: (userActions.engagement || 0),
                },
                errors: {
                    count: (userActions.error || 0),
                },
            },
        };
    }
    async clearAllData() {
        await this.eventStore.clearAllEvents();
    }
    async applyRetentionPolicy() {
        if (this.config.retentionDays === 0)
            return 0;
        return (0, storage_1.applyRetentionPolicy)(this.eventStore, this.config.retentionDays);
    }
    async getStorageInfo() {
        const size = await (0, storage_1.getStorageSize)(this.eventStore);
        return {
            ...size,
            estimatedSizeMB: size.estimatedSizeBytes / (1024 * 1024),
        };
    }
    updateConfig(config) {
        this.config = { ...this.config, ...config };
        this.collector.updateConfig(config);
    }
    getConfig() {
        return { ...this.config };
    }
    async shutdown() {
        await this.collector.shutdown();
        this.initialized = false;
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
}
exports.Analytics = Analytics;
async function createAnalytics(config) {
    const analytics = new Analytics(config);
    await analytics.initialize();
    return analytics;
}
let defaultAnalytics = null;
function getAnalytics(config) {
    if (!defaultAnalytics) {
        defaultAnalytics = new Analytics(config);
    }
    return defaultAnalytics;
}
//# sourceMappingURL=analytics.js.map