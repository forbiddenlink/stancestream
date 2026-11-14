import test from 'node:test';
import assert from 'node:assert/strict';
import { readKeyMoments } from '../src/utils/keyMoments.js';

// Shapes copied from server.js: /api/debate/:id/key-moments spreads the stored
// record ({ moments, stats }) at the top level; /api/key-moments/all returns
// { moments, total }. api.get returns the parsed body as-is, with no .data wrapper.

test('single debate response reads moments and stats from the top level', () => {
    const body = {
        success: true,
        debateId: 'd1',
        moments: [{ id: 'm1' }, { id: 'm2' }],
        stats: { total_moments: 2 },
    };
    assert.deepEqual(readKeyMoments(body, 'single'), {
        moments: [{ id: 'm1' }, { id: 'm2' }],
        stats: { total_moments: 2 },
    });
});

test('all-debates response reads moments and total from the top level', () => {
    const body = { success: true, moments: [{ id: 'm1' }], total: 7 };
    assert.deepEqual(readKeyMoments(body, 'all'), {
        moments: [{ id: 'm1' }],
        stats: { total_moments: 7 },
    });
});

test('missing or empty body gives an empty list, not a crash', () => {
    assert.deepEqual(readKeyMoments(undefined, 'single'), { moments: [], stats: { total_moments: 0 } });
    assert.deepEqual(readKeyMoments({ success: true, debateId: 'd1' }, 'all'), {
        moments: [],
        stats: { total_moments: 0 },
    });
});
