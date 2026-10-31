import test from 'node:test';
import assert from 'node:assert/strict';
import { show, toPercent, assertLiveStats } from '../src/utils/dashboardMetrics.js';

test('missing values show a dash and real zeros stay zero', () => {
    assert.equal(show(undefined), '-');
    assert.equal(show(null, 'ms'), '-');
    assert.equal(show(0, 'ms'), '0ms');
});

test('hit ratio decimal converts to percent, missing stays null', () => {
    assert.equal(toPercent(0.5), 50);
    assert.equal(toPercent(undefined), null);
});

test('backend fallback or error payloads are rejected as unavailable', () => {
    assert.throws(() => assertLiveStats({ fallback: true, operations: { json: 5 } }));
    assert.throws(() => assertLiveStats({ error: 'x' }));
    assert.throws(() => assertLiveStats(null));
    const live = { keyCount: { json: 2 } };
    assert.equal(assertLiveStats(live), live);
});
