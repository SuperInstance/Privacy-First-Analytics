import { AnalyticsEvent, EventType, EventData, AnalyticsConfig, TimeRange, FeatureUsageStats, ErrorStats, PerformanceMetrics, EngagementSummary, AnalyticsExport, QueryOptions } from './types';
import { Insight, DailySummary } from './insights';
export declare class Analytics {
    private eventStore;
    private collector;
    private aggregator;
    private insights;
    private config;
    private initialized;
    constructor(config?: Partial<AnalyticsConfig>);
    initialize(config?: Partial<AnalyticsConfig>): Promise<void>;
    track(type: EventType, data: EventData): Promise<void>;
    query(options: QueryOptions): Promise<AnalyticsEvent[]>;
    generateInsights(timeRange?: TimeRange): Promise<Insight[]>;
    getFeatureUsage(timeRange?: TimeRange, limit?: number): Promise<FeatureUsageStats[]>;
    getErrorStats(timeRange?: TimeRange, limit?: number): Promise<ErrorStats[]>;
    getPerformanceMetrics(timeRange?: TimeRange): Promise<PerformanceMetrics[]>;
    getEngagementSummary(timeRange?: TimeRange): Promise<EngagementSummary>;
    getDailySummary(date?: Date): Promise<DailySummary>;
    exportData(timeRange?: TimeRange): Promise<AnalyticsExport>;
    clearAllData(): Promise<void>;
    applyRetentionPolicy(): Promise<number>;
    getStorageInfo(): Promise<{
        eventCount: number;
        estimatedSizeBytes: number;
        estimatedSizeMB: number;
    }>;
    updateConfig(config: Partial<AnalyticsConfig>): void;
    getConfig(): AnalyticsConfig;
    shutdown(): Promise<void>;
    private getTimeRangeBoundaries;
}
export declare function createAnalytics(config?: Partial<AnalyticsConfig>): Promise<Analytics>;
export declare function getAnalytics(config?: Partial<AnalyticsConfig>): Analytics;
//# sourceMappingURL=analytics.d.ts.map