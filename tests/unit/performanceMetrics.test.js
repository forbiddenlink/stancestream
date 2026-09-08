import { describe, it } from 'mocha';
import assert from 'node:assert/strict';
import { Histogram } from 'prom-client';
import { collectPerformanceMetrics } from '../../src/services/performanceMetrics.js';

describe('live performance measurements', () => {
  it('reads Redis operations and the observed HTTP duration average', async () => {
    const metrics = await collectPerformanceMetrics({
      isReady: true,
      info: async (section) => { assert.equal(section, 'stats'); return '# Stats\r\ninstantaneous_ops_per_sec:12\r\n'; },
    }, { get: async () => ({ values: [
      { metricName: 'http_request_duration_seconds_sum', value: 4 },
      { metricName: 'http_request_duration_seconds_count', value: 2 },
      { metricName: 'http_request_duration_seconds_sum', value: 2 },
      { metricName: 'http_request_duration_seconds_count', value: 1 },
    ] }) });
    assert.equal(metrics.redis_ops_per_second, 12);
    assert.equal(metrics.redis_ops_per_minute, 720);
    assert.equal(metrics.average_response_time, 2);
    assert.equal(metrics.uptime_percentage, null);
    assert.equal(metrics.system_load, null);
    assert.equal(metrics.memory_usage, null);
  });
  it('preserves measured zero and unavailable measurements', async () => {
    const metrics = await collectPerformanceMetrics({ isReady: true, info: async () => 'instantaneous_ops_per_sec:0\r\n' }, { get: async () => ({ values: [] }) });
    assert.equal(metrics.redis_ops_per_second, 0);
    assert.equal(metrics.average_response_time, null);
    const missing = await collectPerformanceMetrics({ isReady: false, info: async () => '' }, { get: async () => ({ values: [] }) });
    assert.equal(missing.redis_ops_per_second, null);
    assert.equal(missing.redis_ops_per_minute, null);
  });
  it('uses the actual Prometheus histogram result including zero-duration observations', async () => {
    const histogram = new Histogram({ name: 'isolated_duration_seconds', help: 'Synthetic duration', registers: [] });
    histogram.observe(0);
    histogram.observe(2);
    const metrics = await collectPerformanceMetrics({ isReady: true, info: async () => 'instantaneous_ops_per_sec:0' }, histogram);
    assert.equal(metrics.average_response_time, 1);
  });
  it('propagates collection failure rather than fabricating healthy metrics', async () => {
    await assert.rejects(collectPerformanceMetrics({ info: async () => { throw new Error('offline'); } }, { get: async () => ({ values: [] }) }), /offline/);
  });
});
