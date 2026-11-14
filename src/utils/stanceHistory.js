// Stance history storage. Uses RedisTimeSeries when the server has it and falls
// back to a plain sorted set (score = timestamp, member = JSON {ts, value}) when
// it does not (e.g. Upstash). Reads return [{ timestamp, value }] either way.

import { disableIfUnsupported, isFeatureDisabled } from './unsupportedFeatures.js';

const TS_FEATURE = 'RedisTimeSeries (TS.*)';

async function addToSortedSet(client, key, ts, value) {
  await client.zAdd(key, { score: ts, value: JSON.stringify({ ts, value }) });
}

/** Records one stance value (0 to 1) at the current time. */
export async function addStancePoint(client, key, value, now = Date.now()) {
  const num = parseFloat(value);
  if (!isFeatureDisabled(TS_FEATURE)) {
    try {
      await client.ts.add(key, now, num.toString());
      return;
    } catch (error) {
      if (!disableIfUnsupported(TS_FEATURE, error)) throw error;
    }
  }
  await addToSortedSet(client, key, now, num);
}

/** Reads the stance history for a key, oldest first. */
export async function readStanceHistory(client, key) {
  if (!isFeatureDisabled(TS_FEATURE)) {
    try {
      const rows = await client.ts.range(key, '-', '+');
      return rows.map((row) => {
        const [timestamp, value] = Array.isArray(row) ? row : [row.timestamp, row.value];
        return { timestamp: new Date(timestamp).toISOString(), value: parseFloat(value) };
      });
    } catch (error) {
      if (!disableIfUnsupported(TS_FEATURE, error)) throw error;
    }
  }
  const members = await client.zRangeByScore(key, '-inf', '+inf');
  return members.map((member) => {
    const { ts, value } = JSON.parse(member);
    return { timestamp: new Date(ts).toISOString(), value: parseFloat(value) };
  });
}
