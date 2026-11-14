import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRows, toUnit, toSigned, readStance, SHIFT_THRESHOLD, messageFromEvent, connectionSentence } from '../src/utils/record.js';

const msg = (id, agentId, value, extra = {}) => ({
    id, agentId, sender: agentId === 'senatorbot' ? 'SenatorBot' : 'ReformerBot',
    text: `turn ${id}`, timestamp: '2026-01-01T14:02:00.000Z',
    stance: value === undefined ? undefined : { topic: 'climate', value }, ...extra,
});

test('scale: new_message 0..1 converts to stance_update -1..1 and back', () => {
    assert.equal(toSigned(0), -1);
    assert.equal(toSigned(0.5), 0);
    assert.equal(toSigned(1), 1);
    assert.equal(toUnit(-1), 0);
    assert.equal(toUnit(0), 0.5);
    assert.equal(toUnit(1), 1);
    assert.ok(Math.abs(toUnit(toSigned(0.37)) - 0.37) < 1e-12);
});

test('scale: stance_update -0.3 (test endpoint) reads as 0.35 on the record scale', () => {
    assert.equal(toUnit(-0.3), 0.35);
    assert.equal(toUnit(0.6), 0.8);
});

test('readStance rejects missing and out-of-range values', () => {
    assert.equal(readStance(undefined), null);
    assert.equal(readStance({ value: -0.3 }), null);
    assert.equal(readStance({ value: 1.2 }), null);
    assert.equal(readStance({ value: 'x' }), null);
    assert.deepEqual(readStance({ value: 0.4, topic: 't' }), { value: 0.4, topic: 't' });
});

test('rows keep order, numbering, speaker and raw stance value', () => {
    const rows = buildRows([msg(1, 'senatorbot', 0.4), msg(2, 'reformerbot', 0.9), msg(3, 'senatorbot', 0.45)]);
    assert.deepEqual(rows.map((r) => r.n), [1, 2, 3]);
    assert.deepEqual(rows.map((r) => r.round), [1, 1, 2]);
    assert.deepEqual(rows.map((r) => r.speaker), ['SenatorBot', 'ReformerBot', 'SenatorBot']);
    assert.deepEqual(rows.map((r) => r.stance), [0.4, 0.9, 0.45]);
    assert.deepEqual(rows[1].values, { senatorbot: 0.4, reformerbot: 0.9 });
    assert.deepEqual(rows[0].values, { senatorbot: 0.4, reformerbot: undefined });
});

test('mark only when a bot moves more than 0.3 from its own previous value', () => {
    const rows = buildRows([
        msg(1, 'senatorbot', 0.4), msg(2, 'reformerbot', 0.9),
        msg(3, 'senatorbot', 0.8),   // +0.4 : mark
        msg(4, 'reformerbot', 0.6),  // -0.3 : exactly the threshold, no mark
        msg(5, 'senatorbot', 0.45),  // -0.35 : mark
    ]);
    assert.equal(SHIFT_THRESHOLD, 0.3);
    assert.deepEqual(rows.map((r) => r.moved), [false, false, true, false, true]);
    assert.equal(rows[0].change, null); // first value is never a flip
});

test('a mark never comes from the other bot moving', () => {
    const rows = buildRows([msg(1, 'senatorbot', 0.1), msg(2, 'reformerbot', 0.9), msg(3, 'senatorbot', 0.12)]);
    assert.deepEqual(rows.map((r) => r.moved), [false, false, false]);
});

test('a message without stance gets an empty track and no mark, and does not reset history', () => {
    const rows = buildRows([msg(1, 'senatorbot', 0.4), msg(2, 'senatorbot', undefined), msg(3, 'senatorbot', 0.9)]);
    assert.equal(rows[1].stance, null);
    assert.equal(rows[1].moved, false);
    assert.deepEqual(rows[1].values, { senatorbot: 0.4, reformerbot: undefined });
    assert.equal(rows[2].moved, true);
});

// FIXTURE events in the shape server.js broadcasts for new_message (stance.change is absent on the normal path).
const fixtureEvents = [
    ['senatorbot', 'SenatorBot', 0.4], ['reformerbot', 'ReformerBot', 0.9],
    ['senatorbot', 'SenatorBot', 0.45], ['reformerbot', 'ReformerBot', 0.88],
    ['senatorbot', 'SenatorBot', 0.8], ['reformerbot', 'ReformerBot', 0.52],
].map(([agentId, agentName, value], i) => ({
    type: 'new_message', debateId: 'd1', agentId, agentName, message: `argument ${i + 1}`,
    timestamp: `2026-11-13T14:02:0${i}.000Z`, factCheck: null,
    sentiment: { sentiment: 'neutral', confidence: 0.8, model: 'fixture' },
    stance: { topic: 'Environmental regulations and green energy', value },
}));

test('emitted new_message events -> rows: turns, speakers, raw stance values and marks match', () => {
    const rows = buildRows(fixtureEvents.map((e, i) => messageFromEvent(e, `id${i}`)));
    assert.deepEqual(rows.map((r) => r.n), [1, 2, 3, 4, 5, 6]);
    assert.deepEqual(rows.map((r) => r.speaker), fixtureEvents.map((e) => e.agentName));
    assert.deepEqual(rows.map((r) => r.text), fixtureEvents.map((e) => e.message));
    assert.deepEqual(rows.map((r) => r.stance), fixtureEvents.map((e) => e.stance.value)); // raw 0..1, not converted
    assert.deepEqual(rows.map((r) => r.moved), [false, false, false, false, true, true]);
});

test('messageFromEvent keeps stance exactly as sent and invents none', () => {
    assert.deepEqual(messageFromEvent(fixtureEvents[0], 'x').stance, fixtureEvents[0].stance);
    assert.equal(messageFromEvent({ ...fixtureEvents[0], stance: undefined }, 'x').stance, undefined);
});

test('connection sentence says what is true', () => {
    assert.match(connectionSentence('Disconnected', 'unhealthy'), /Not connected.*Nothing is being recorded/);
    assert.match(connectionSentence('Error', 'error'), /failed/);
    assert.equal(connectionSentence('Connected', 'healthy'), 'Connected to the debate server.');
    assert.match(connectionSentence('Connected', 'checking'), /health check has not passed/);
});
