export type EventCategory = 'user_action' | 'performance' | 'engagement' | 'error' | 'feature_flag' | 'system' | 'custom';
export type EventType = 'message_sent' | 'conversation_created' | 'conversation_archived' | 'conversation_deleted' | 'settings_changed' | 'ai_contact_created' | 'ai_contact_modified' | 'ai_contact_deleted' | 'search_performed' | 'export_triggered' | 'import_triggered' | 'app_initialized' | 'api_response' | 'render_complete' | 'storage_operation' | 'memory_measurement' | 'session_start' | 'session_end' | 'feature_used' | 'feature_abandoned' | 'page_view' | 'conversation_viewed' | 'messenger_opened' | 'knowledge_viewed' | 'ai_chat_started' | 'error_occurred' | 'error_recovered' | 'feature_enabled' | 'feature_disabled' | 'feature_evaluated' | 'hardware_detected' | 'benchmark_completed' | 'data_compacted' | 'data_exported' | string;
export interface AnalyticsEvent {
    id: string;
    type: EventType;
    category: EventCategory;
    timestamp: string;
    sessionId: string;
    data: EventData;
    metadata?: {
        hardwareHash?: string;
        activeFeatures?: string[];
        appVersion?: string;
        platform?: string;
    };
}
export type EventData = MessageSentData | ConversationCreatedData | ConversationArchivedData | SettingsChangedData | AIContactCreatedData | SearchPerformedData | AppInitializedData | APIResponseData | RenderCompleteData | SessionStartData | SessionEndData | FeatureUsedData | ErrorOccurredData | FeatureEnabledData | BenchmarkCompletedData | GenericEventData;
export interface MessageSentData {
    type: 'message_sent';
    conversationId: string;
    messageLength: number;
    hasAttachment: boolean;
    attachmentTypes?: string[];
    replyToMessage?: boolean;
    responseTime?: number;
}
export interface ConversationCreatedData {
    type: 'conversation_created';
    conversationType: string;
    hasAIContact: boolean;
}
export interface ConversationArchivedData {
    type: 'conversation_archived';
    messageCount: number;
    conversationAge: number;
}
export interface SettingsChangedData {
    type: 'settings_changed';
    setting: string;
    previousValue: string | boolean | number;
    newValue: string | boolean | number;
}
export interface AIContactCreatedData {
    type: 'ai_contact_created';
    provider: string;
    model: string;
    customPrompt: boolean;
}
export interface SearchPerformedData {
    type: 'search_performed';
    queryLength: number;
    resultCount: number;
    searchType: 'conversations' | 'messages' | 'global';
}
export interface AppInitializedData {
    type: 'app_initialized';
    initTime: number;
    componentsLoaded: string[];
    failedComponents?: string[];
}
export interface APIResponseData {
    type: 'api_response';
    endpoint: string;
    method: string;
    duration: number;
    success: boolean;
    statusCode?: number;
    errorType?: string;
}
export interface RenderCompleteData {
    type: 'render_complete';
    component: string;
    duration: number;
    elementCount: number;
}
export interface StorageOperationData {
    type: 'storage_operation';
    operation: 'read' | 'write' | 'delete' | 'query';
    store: string;
    duration: number;
    recordCount?: number;
    success: boolean;
}
export interface SessionStartData {
    type: 'session_start';
    source: 'direct' | 'notification' | 'link';
    previousSessionTime?: number;
}
export interface SessionEndData {
    type: 'session_end';
    duration: number;
    actionsPerformed: number;
    messagesSent: number;
    featuresUsed: string[];
}
export interface FeatureUsedData {
    type: 'feature_used';
    featureId: string;
    duration?: number;
    success: boolean;
    context?: Record<string, unknown>;
}
export interface PageViewData {
    type: 'page_view';
    page: string;
    referrer?: string;
    loadTime?: number;
}
export interface ErrorOccurredData {
    type: 'error_occurred';
    errorType: string;
    errorMessage: string;
    context: string;
    recoverable: boolean;
    stack?: string;
}
export interface ErrorRecoveredData {
    type: 'error_recovered';
    errorType: string;
    recoveryStrategy: string;
    recoveryTime: number;
}
export interface FeatureEnabledData {
    type: 'feature_enabled';
    featureId: string;
    reason: string;
    userInitiated: boolean;
    previousState: string;
}
export interface FeatureDisabledData {
    type: 'feature_disabled';
    featureId: string;
    reason: string;
    userInitiated: boolean;
    previousState: string;
}
export interface FeatureEvaluatedData {
    type: 'feature_evaluated';
    featureId: string;
    enabled: boolean;
    reason: string;
    hardwareScore: number;
}
export interface BenchmarkCompletedData {
    type: 'benchmark_completed';
    category: string;
    overallScore: number;
    duration: number;
    testCount: number;
}
export interface DataCompactedData {
    type: 'data_compacted';
    recordsRemoved: number;
    spaceRecovered: number;
    duration: number;
}
export interface GenericEventData {
    type: string;
    [key: string]: unknown;
}
export type TimeRange = {
    type: 'hours';
    value: number;
} | {
    type: 'days';
    value: number;
} | {
    type: 'weeks';
    value: number;
} | {
    type: 'months';
    value: number;
} | {
    type: 'all';
};
export type AggregationBucket = 'hour' | 'day' | 'week' | 'month';
export interface AggregatedStats {
    count: number;
    sum?: number;
    average?: number;
    min?: number;
    max?: number;
    percentiles?: {
        p50: number;
        p90: number;
        p95: number;
        p99: number;
    };
}
export interface TimeSeriesPoint {
    timestamp: string;
    value: number;
    count: number;
}
export interface FeatureUsageStats {
    featureId: string;
    usageCount: number;
    lastUsed: string;
    totalDuration?: number;
    averageDuration?: number;
    successRate: number;
    trend: 'increasing' | 'decreasing' | 'stable';
}
export interface ErrorStats {
    errorType: string;
    count: number;
    lastOccurred: string;
    recoverable: boolean;
    recoveryRate: number;
    avgRecoveryTime?: number;
    trend: 'increasing' | 'decreasing' | 'stable';
}
export interface PerformanceMetrics {
    category: string;
    avgDuration: number;
    p95Duration: number;
    p99Duration: number;
    successRate: number;
    totalOperations: number;
    trend: 'improving' | 'degrading' | 'stable';
}
export interface EngagementSummary {
    totalSessions: number;
    totalSessionTime: number;
    avgSessionDuration: number;
    avgMessagesPerSession: number;
    mostActiveDay: string;
    mostActiveHour: number;
    retentionRate: number;
    peakUsageHours: number[];
    activeDays: number;
    avgSessionsPerDay: number;
    totalTime: number;
    peakUsageHour: number;
}
export interface AnalyticsConfig {
    enabled: boolean;
    persist: boolean;
    maxEvents: number;
    batchSize: number;
    batchInterval: number;
    detailedPerformance: boolean;
    trackErrors: boolean;
    sessionTimeout: number;
    retentionDays: number;
    samplingRate: number;
    storageBackend: 'indexedDB' | 'localStorage';
}
export declare const DEFAULT_ANALYTICS_CONFIG: AnalyticsConfig;
export interface QueryOptions {
    timeRange: TimeRange;
    eventTypes?: EventType[];
    filters?: Record<string, unknown>;
    bucket?: AggregationBucket;
    limit?: number;
    offset?: number;
    sortOrder?: 'asc' | 'desc';
}
export interface PrivacySettings {
    enabled: boolean;
    allowExport: boolean;
    allowDeletion: boolean;
    excludedCategories: EventCategory[];
    anonymize: boolean;
}
export interface AnalyticsExport {
    exportedAt: string;
    timeRange: {
        start: string;
        end: string;
    };
    eventCount: number;
    events: AnalyticsEvent[];
    summaries: {
        userActions: AggregatedStats;
        performance: AggregatedStats;
        engagement: AggregatedStats;
        errors: AggregatedStats;
    };
}
//# sourceMappingURL=types.d.ts.map