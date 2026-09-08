import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePerformanceMetrics } from '../src/utils/performanceMetrics.js';

test('normalizes the real nested HTTP payload and websocket metrics identically', () => {
    const payload = { performance: { average_response_time: 0, redis_ops_per_second: 0, redis_ops_per_minute: 0, uptime_percentage: null } };
    assert.deepEqual(normalizePerformanceMetrics(payload.performance), { responseTime: 0, operationsPerSec: 0, redisOpsPerMin: 0, systemHealth: null });
    assert.deepEqual(normalizePerformanceMetrics(payload.performance), normalizePerformanceMetrics({ ...payload.performance }));
});
test('missing performance measurements remain unavailable', () => {
    assert.deepEqual(normalizePerformanceMetrics(), { responseTime: null, operationsPerSec: null, redisOpsPerMin: null, systemHealth: null });
});
