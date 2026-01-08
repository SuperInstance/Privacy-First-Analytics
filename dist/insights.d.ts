import { AnalyticsEventStore } from './storage';
import { TimeRange } from './types';
export type InsightSeverity = 'info' | 'warning' | 'critical' | 'success';
export type InsightCategory = 'usage' | 'performance' | 'error' | 'engagement' | 'optimization' | 'security';
export interface Insight {
    id: string;
    category: InsightCategory;
    severity: InsightSeverity;
    title: string;
    description: string;
    timestamp: string;
    data?: Record<string, unknown>;
}
export interface UsagePatternInsight extends Insight {
    category: 'usage';
    pattern: 'peak_hours' | 'frequent_features' | 'activity_trend';
    metrics: {
        timeRange: string;
        totalEvents: number;
        trend: 'increasing' | 'decreasing' | 'stable';
    };
}
export interface PerformanceInsight extends Insight {
    category: 'performance';
    issue: 'slow_api' | 'slow_render' | 'memory_pressure' | 'storage_bottleneck';
    metrics: {
        avgDuration: number;
        p95Duration: number;
        affectedOperations: number;
        impact: 'low' | 'medium' | 'high';
    };
}
export interface ErrorInsight extends Insight {
    category: 'error';
    errorType: string;
    metrics: {
        occurrenceCount: number;
        errorRate: number;
        recovered: boolean;
    };
}
export interface EngagementInsight extends Insight {
    category: 'engagement';
    metric: 'session_duration' | 'feature_adoption' | 'retention' | 'activity_level';
    value: number;
    comparison: 'above_average' | 'average' | 'below_average';
}
export interface OptimizationSuggestion extends Insight {
    category: 'optimization';
    type: 'configuration' | 'workflow' | 'resource';
    effort: 'low' | 'medium' | 'high';
    expectedImpact: string;
}
export interface DailySummary {
    date: string;
    summary: string;
    stats: {
        totalMessages: number;
        totalSessions: number;
        totalErrors: number;
        mostUsedFeature: string;
        peakUsageHour: number;
    };
    patterns: string[];
    issues: string[];
    suggestions: string[];
    trends: {
        messages: string;
        errors: string;
        performance: string;
    };
}
export interface WeeklySummary extends DailySummary {
    weekRange: string;
    comparison: {
        messagesChange: number;
        sessionsChange: number;
        errorsChange: number;
        performanceChange: string;
    };
    topFeatures: Array<{
        feature: string;
        usageCount: number;
    }>;
    topErrors: Array<{
        error: string;
        count: number;
    }>;
    goals: {
        achieved: string[];
        inProgress: string[];
        notAchieved: string[];
    };
}
export declare class InsightsEngine {
    private aggregator;
    constructor(eventStore: AnalyticsEventStore);
    generateInsights(timeRange: TimeRange, categories?: InsightCategory[]): Promise<Insight[]>;
    private generateUsageInsights;
    private generatePerformanceInsights;
    private generateErrorInsights;
    private generateEngagementInsights;
    private generateOptimizationInsights;
    generateDailySummary(eventStore: AnalyticsEventStore, date?: Date): Promise<DailySummary>;
    private getEventsInRange;
    private getTimeRangeBoundaries;
    private bucketEventsByDay;
}
//# sourceMappingURL=insights.d.ts.map