import { AnalyticsEvent, AnalyticsConfig } from './types';
export interface AnalyticsEventStore {
    addEvents(events: AnalyticsEvent[]): Promise<void>;
    addEvent(event: AnalyticsEvent): Promise<void>;
    getEvent(id: string): Promise<AnalyticsEvent | null>;
    queryEvents(options: QueryOptions): Promise<AnalyticsEvent[]>;
    deleteEvents(ids: string[]): Promise<void>;
    deleteEventsBefore(date: string): Promise<number>;
    countEvents(): Promise<number>;
    clearAllEvents(): Promise<void>;
}
export interface QueryOptions {
    startTime?: string;
    endTime?: string;
    types?: string[];
    categories?: string[];
    sessionIds?: string[];
    limit?: number;
    offset?: number;
    sortOrder?: 'asc' | 'desc';
}
export declare function createEventStore(backend: 'indexedDB' | 'localStorage', config?: AnalyticsConfig): AnalyticsEventStore;
export declare const defaultEventStore: AnalyticsEventStore;
export declare function applyRetentionPolicy(store: AnalyticsEventStore, retentionDays: number): Promise<number>;
export declare function getStorageSize(store: AnalyticsEventStore): Promise<{
    eventCount: number;
    estimatedSizeBytes: number;
}>;
//# sourceMappingURL=storage.d.ts.map