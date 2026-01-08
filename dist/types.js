"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_ANALYTICS_CONFIG = void 0;
exports.DEFAULT_ANALYTICS_CONFIG = {
    enabled: true,
    persist: true,
    maxEvents: 100000,
    batchSize: 50,
    batchInterval: 5000,
    detailedPerformance: true,
    trackErrors: true,
    sessionTimeout: 30 * 60 * 1000,
    retentionDays: 90,
    samplingRate: 1.0,
    storageBackend: 'indexedDB',
};
//# sourceMappingURL=types.js.map