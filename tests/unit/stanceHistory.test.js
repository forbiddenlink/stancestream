import { describe, it, beforeEach } from 'mocha';
import assert from 'node:assert/strict';
import { addStancePoint, readStanceHistory } from '../../src/utils/stanceHistory.js';
import { resetUnsupportedFeatures, isFeatureDisabled } from '../../src/utils/unsupportedFeatures.js';

const unsupported = () => Promise.reject(new Error("ERR Command is not available: 'TS'"));

function mockClient() {
  const zset = [];
  return {
    zset,
    ts: { add: unsupported, range: unsupported },
    zAdd: async (key, { score, value }) => { zset.push({ key, score, value }); },
    zRangeByScore: async () => zset.sort((a, b) => a.score - b.score).map((e) => e.value),
  };
}

describe('stanceHistory fallback', () => {
  beforeEach(() => resetUnsupportedFeatures());

  it('writes to a sorted set when TS is unsupported and disables TS', async () => {
    const client = mockClient();
    await addStancePoint(client, 'k', 0.7, 1000);
    assert.equal(isFeatureDisabled('RedisTimeSeries (TS.*)'), true);
    assert.equal(client.zset.length, 1);
    assert.equal(client.zset[0].score, 1000);
    assert.deepEqual(JSON.parse(client.zset[0].value), { ts: 1000, value: 0.7 });
  });

  it('reads the same shape the TS path returns', async () => {
    const client = mockClient();
    await addStancePoint(client, 'k', 0.7, 2000);
    await addStancePoint(client, 'k', 0.4, 1000);
    const rows = await readStanceHistory(client, 'k');
    assert.deepEqual(rows, [
      { timestamp: new Date(1000).toISOString(), value: 0.4 },
      { timestamp: new Date(2000).toISOString(), value: 0.7 },
    ]);
  });

  it('uses TimeSeries when available and handles object rows', async () => {
    const calls = [];
    const client = {
      ts: {
        add: async (...a) => { calls.push(a); },
        range: async () => [{ timestamp: 5, value: 0.25 }, [6, '0.5']],
      },
    };
    await addStancePoint(client, 'k', 0.3, 5);
    assert.deepEqual(calls, [['k', 5, '0.3']]);
    const rows = await readStanceHistory(client, 'k');
    assert.deepEqual(rows.map((r) => r.value), [0.25, 0.5]);
  });

  it('rethrows non-unsupported errors', async () => {
    const client = { ts: { add: () => Promise.reject(new Error('connection reset')) } };
    await assert.rejects(addStancePoint(client, 'k', 0.3), /connection reset/);
  });
});
