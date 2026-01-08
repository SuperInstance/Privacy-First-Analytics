"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventCollector = void 0;
exports.createEventCollector = createEventCollector;
const types_1 = require("./types");
class SessionManager {
    constructor(sessionTimeout = 30 * 60 * 1000) {
        this.sessionTimeout = sessionTimeout;
        this.sessionId = this.generateSessionId();
        this.sessionStart = Date.now();
        this.lastActivity = this.sessionStart;
    }
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }
    getSessionId() {
        return this.sessionId;
    }
    updateActivity() {
        this.lastActivity = Date.now();
    }
    isExpired() {
        return Date.now() - this.lastActivity > this.sessionTimeout;
    }
    startNewSession() {
        this.sessionId = this.generateSessionId();
        this.sessionStart = Date.now();
        this.lastActivity = this.sessionStart;
        return this.sessionId;
    }
    getSessionDuration() {
        return Math.floor((Date.now() - this.sessionStart) / 1000);
    }
}
class EventCollector {
    constructor(eventStore, config = {}) {
        this.eventBuffer = [];
        this.batchTimer = null;
        this.isInitialized = false;
        this.samplingCounter = 0;
        this.sessionStats = {
            actionsPerformed: 0,
            messagesSent: 0,
            featuresUsed: new Set(),
            startTime: Date.now(),
        };
        this.config = { ...types_1.DEFAULT_ANALYTICS_CONFIG, ...config };
        this.eventStore = eventStore;
        this.sessionManager = new SessionManager(this.config.sessionTimeout);
    }
    async initialize(config) {
        if (this.isInitialized)
            return;
        if (config) {
            this.updateConfig(config);
        }
        if (this.sessionManager.isExpired()) {
            await this.endSession();
            this.sessionManager.startNewSession();
        }
        await this.track('session_start', {
            type: 'session_start',
            source: 'direct',
            previousSessionTime: this.sessionStats.startTime
                ? Date.now() - this.sessionStats.startTime
                : undefined,
        });
        this.startBatchTimer();
        this.isInitialized = true;
    }
    async track(type, data) {
        if (!this.config.enabled)
            return;
        if (!this.shouldSample())
            return;
        this.sessionManager.updateActivity();
        const category = this.getEventCategory(type);
        const event = {
            id: this.generateEventId(),
            type,
            category,
            timestamp: new Date().toISOString(),
            sessionId: this.sessionManager.getSessionId(),
            data,
        };
        this.updateSessionStats(type, data);
        this.eventBuffer.push(event);
        if (this.eventBuffer.length >= this.config.batchSize) {
            await this.flush();
        }
    }
    async flush() {
        if (this.eventBuffer.length === 0)
            return;
        const events = [...this.eventBuffer];
        this.eventBuffer = [];
        if (this.config.persist) {
            try {
                await this.eventStore.addEvents(events);
            }
            catch (error) {
                console.error('Failed to persist analytics events:', error);
                this.eventBuffer.unshift(...events);
            }
        }
    }
    async endSession() {
        if (!this.isInitialized)
            return;
        const duration = this.sessionManager.getSessionDuration();
        await this.track('session_end', {
            type: 'session_end',
            duration,
            actionsPerformed: this.sessionStats.actionsPerformed,
            messagesSent: this.sessionStats.messagesSent,
            featuresUsed: Array.from(this.sessionStats.featuresUsed),
        });
        await this.flush();
        this.sessionStats = {
            actionsPerformed: 0,
            messagesSent: 0,
            featuresUsed: new Set(),
            startTime: Date.now(),
        };
    }
    updateConfig(config) {
        this.config = { ...this.config, ...config };
        if (this.batchTimer !== null) {
            this.stopBatchTimer();
            this.startBatchTimer();
        }
    }
    getConfig() {
        return { ...this.config };
    }
    async shutdown() {
        this.stopBatchTimer();
        await this.flush();
        await this.endSession();
        this.isInitialized = false;
    }
    generateEventId() {
        return `event_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }
    getEventCategory(type) {
        const userActions = [
            'message_sent',
            'conversation_created',
            'conversation_archived',
            'conversation_deleted',
            'settings_changed',
            'ai_contact_created',
            'ai_contact_modified',
            'ai_contact_deleted',
            'search_performed',
            'export_triggered',
            'import_triggered',
        ];
        const performance = [
            'app_initialized',
            'api_response',
            'render_complete',
            'storage_operation',
            'memory_measurement',
        ];
        const engagement = [
            'session_start',
            'session_end',
            'feature_used',
            'feature_abandoned',
            'page_view',
            'conversation_viewed',
            'messenger_opened',
            'knowledge_viewed',
            'ai_chat_started',
        ];
        const errors = ['error_occurred', 'error_recovered'];
        const featureFlags = [
            'feature_enabled',
            'feature_disabled',
            'feature_evaluated',
        ];
        const system = [
            'hardware_detected',
            'benchmark_completed',
            'data_compacted',
            'data_exported',
        ];
        if (userActions.includes(type))
            return 'user_action';
        if (performance.includes(type))
            return 'performance';
        if (engagement.includes(type))
            return 'engagement';
        if (errors.includes(type))
            return 'error';
        if (featureFlags.includes(type))
            return 'feature_flag';
        if (system.includes(type))
            return 'system';
        return 'custom';
    }
    shouldSample() {
        this.samplingCounter++;
        return this.samplingCounter <= this.config.samplingRate * 100
            ? Math.random() < this.config.samplingRate
            : false;
    }
    updateSessionStats(type, data) {
        this.sessionStats.actionsPerformed++;
        if (type === 'message_sent') {
            this.sessionStats.messagesSent++;
        }
        if (type === 'feature_used' && 'featureId' in data) {
            this.sessionStats.featuresUsed.add(data.featureId);
        }
    }
    startBatchTimer() {
        if (this.batchTimer !== null)
            return;
        this.batchTimer = setTimeout(() => {
            this.flush().catch(error => {
                console.error('Error in batch flush:', error);
            });
            this.batchTimer = null;
            this.startBatchTimer();
        }, this.config.batchInterval);
    }
    stopBatchTimer() {
        if (this.batchTimer !== null) {
            clearTimeout(this.batchTimer);
            this.batchTimer = null;
        }
    }
}
exports.EventCollector = EventCollector;
async function createEventCollector(eventStore, config) {
    const collector = new EventCollector(eventStore, config);
    await collector.initialize();
    return collector;
}
//# sourceMappingURL=collector.js.map