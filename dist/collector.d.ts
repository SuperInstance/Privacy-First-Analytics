import { AnalyticsEventStore } from './storage';
import { EventType, EventData, AnalyticsConfig } from './types';
export declare class EventCollector {
    private config;
    private sessionManager;
    private eventStore;
    private eventBuffer;
    private batchTimer;
    private isInitialized;
    private samplingCounter;
    private sessionStats;
    constructor(eventStore: AnalyticsEventStore, config?: Partial<AnalyticsConfig>);
    initialize(config?: Partial<AnalyticsConfig>): Promise<void>;
    track(type: EventType, data: EventData): Promise<void>;
    flush(): Promise<void>;
    endSession(): Promise<void>;
    updateConfig(config: Partial<AnalyticsConfig>): void;
    getConfig(): AnalyticsConfig;
    shutdown(): Promise<void>;
    private generateEventId;
    private getEventCategory;
    private shouldSample;
    private updateSessionStats;
    private startBatchTimer;
    private stopBatchTimer;
}
export declare function createEventCollector(eventStore: AnalyticsEventStore, config?: Partial<AnalyticsConfig>): Promise<EventCollector>;
//# sourceMappingURL=collector.d.ts.map