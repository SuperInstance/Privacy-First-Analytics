import { AnalyticsEventStore } from './storage';
import { EventType, TimeSeriesPoint, FeatureUsageStats, ErrorStats, PerformanceMetrics, EngagementSummary, TimeRange, AggregationBucket } from './types';
export declare class AnalyticsAggregator {
    private eventStore;
    constructor(eventStore: AnalyticsEventStore);
    getEventCountsByType(timeRange: TimeRange): Promise<Record<string, number>>;
    getEventCountsByCategory(timeRange: TimeRange): Promise<Record<string, number>>;
    getTimeSeries(timeRange: TimeRange, bucket?: AggregationBucket, eventType?: EventType): Promise<TimeSeriesPoint[]>;
    getMostUsedFeatures(timeRange: TimeRange, limit?: number): Promise<FeatureUsageStats[]>;
    getErrorStats(timeRange: TimeRange, limit?: number): Promise<ErrorStats[]>;
    getPerformanceMetrics(timeRange: TimeRange, category?: string): Promise<PerformanceMetrics[]>;
    getEngagementSummary(timeRange: TimeRange): Promise<EngagementSummary>;
    getPeakUsageHours(timeRange: TimeRange): Promise<number[]>;
    getErrorRate(_context: string, timeRange: TimeRange): Promise<{
        totalErrors: number;
        totalEvents: number;
        errorRate: number;
        errorTypes: Record<string, number>;
    }>;
}
//# sourceMappingURL=aggregator.d.ts.map