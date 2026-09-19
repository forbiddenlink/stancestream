/**
 * Unit tests for Metrics System
 */

import { describe, it, before, after } from 'mocha';
import { expect } from 'chai';
import { 
    cacheHitsTotal,
    cacheMissesTotal,
    trackCacheOperation,
    httpRequestDuration,
    register
} from '../../metrics.js';

describe('Metrics System', () => {
    // Note: this suite used to call register.clear() in before(), which
    // deregisters every metric from prom-client's default registry
    // (cacheHitsTotal, httpRequestDuration, etc. are registered once at
    // module load). That left the registry empty for the rest of this
    // file, so the "should export metrics in Prometheus format" test
    // below always failed - the metric objects still accept .observe()/
    // .inc() calls after being cleared, but register.metrics() has
    // nothing left to serialize. This was a test-authoring bug, not a
    // runtime bug in metrics.js: the clear() was clearing state this very
    // file still needed. Only clear after this suite's assertions run.
    after(() => {
        register.clear();
    });

    describe('Cache Metrics', () => {
        it('should track cache hits', () => {
            trackCacheOperation(true, 0.95, 'testAgent', 'testTopic', 0.002);
            // Metric should be incremented
        });

        it('should track cache misses', () => {
            trackCacheOperation(false, 0, 'testAgent', 'testTopic', 0);
            // Metric should be incremented
        });

        it('should track similarity scores', () => {
            trackCacheOperation(true, 0.92, 'agent1', 'climate', 0.001);
            trackCacheOperation(true, 0.88, 'agent2', 'economy', 0.002);
            // Histogram should have observations
        });
    });

    describe('HTTP Metrics', () => {
        it('should track request duration', () => {
            httpRequestDuration.observe({
                method: 'GET',
                route: '/api/health',
                status_code: 200
            }, 0.15);
            
            // Metric should be recorded
        });

        it('should handle different status codes', () => {
            httpRequestDuration.observe({
                method: 'POST',
                route: '/api/debate/start',
                status_code: 400
            }, 0.5);
            
            // Should record error responses
        });
    });

    describe('Metrics Export', () => {
        it('should export metrics in Prometheus format', async () => {
            const metrics = await register.metrics();
            expect(metrics).to.be.a('string');
            expect(metrics).to.include('# HELP');
            expect(metrics).to.include('# TYPE');
        });
    });
});
