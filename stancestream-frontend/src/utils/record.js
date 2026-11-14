// Pure helpers for the debate record on /arena.
//
// One scale end to end: stance is 0 to 1.
//  - `new_message` carries stance.value on 0..1 (server.js new_message broadcast).
//  - `debate:stance_update` carries senatorbot / reformerbot on -1..1
//    (server.js maps (v - 0.5) * 2 before broadcasting).
// The record rows read only the per-message 0..1 value. The chart stores -1..1
// and converts back with toUnit() at render.

// Same rule as keyMoments.js detectStanceFlip: |new - previous| > 0.3, where
// previous is that bot's last value in the same debate (the first value is
// never a flip).
export const SHIFT_THRESHOLD = 0.3;

export const AGENTS = {
    senatorbot: { name: 'SenatorBot', role: 'Moderate US Senator', side: 'a' },
    reformerbot: { name: 'ReformerBot', role: 'Progressive Policy Advocate', side: 'b' },
};
export const AGENT_ORDER = ['senatorbot', 'reformerbot'];

/** -1..1 (stance_update, chart store) to 0..1. */
export const toUnit = (v) => (v + 1) / 2;
/** 0..1 (new_message) to -1..1. */
export const toSigned = (v) => (v - 0.5) * 2;

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

/** Keep a stance only if it carries a usable 0..1 value. */
export function readStance(raw) {
    if (!raw || !isNum(raw.value) || raw.value < 0 || raw.value > 1) return null;
    return { value: raw.value, topic: raw.topic };
}

/**
 * messages -> record rows, oldest first.
 * Each row holds the stance of both bots as of that turn (the other bot's value
 * is carried forward from its last turn; undefined until it has spoken).
 * `moved` is true only when this bot's own value moved by more than the
 * threshold since its previous turn.
 */
export function buildRows(messages) {
    const last = {};
    return messages.map((msg, i) => {
        const stance = readStance(msg.stance);
        const prev = last[msg.agentId];
        let change = null;
        if (stance) {
            // round to 1e-6 so a move of exactly 0.3 (0.9 - 0.6 = 0.30000000000000004) is not a mark
            if (prev !== undefined) change = Math.round(Math.abs(stance.value - prev) * 1e6) / 1e6;
            last[msg.agentId] = stance.value;
        }
        const n = i + 1;
        return {
            id: msg.id,
            n,
            round: Math.floor(i / AGENT_ORDER.length) + 1,
            agentId: msg.agentId,
            debateId: msg.debateId,
            speaker: msg.sender || AGENTS[msg.agentId]?.name || msg.agentId,
            text: msg.text,
            timestamp: msg.timestamp,
            factCheck: msg.factCheck || null,
            sentiment: msg.sentiment || null,
            stance: stance ? stance.value : null,
            change,
            moved: change !== null && change > SHIFT_THRESHOLD,
            values: { senatorbot: last.senatorbot, reformerbot: last.reformerbot },
        };
    });
}

/** One plain sentence for the connection line. */
export function connectionSentence(status, health) {
    if (status === 'Connected' && health === 'healthy') return 'Connected to the debate server.';
    if (status === 'Connected') return 'Connected to the debate server, but its health check has not passed.';
    if (status === 'Error') return 'The connection to the debate server failed. Nothing is being recorded.';
    return 'Not connected to the debate server. Nothing is being recorded.';
}

/**
 * `new_message` WebSocket event -> the message object the record renders.
 * `stance` is kept exactly as sent (0..1); nothing is filled in when absent.
 */
export function messageFromEvent(event, id) {
    return {
        id,
        sender: event.agentName,
        agentId: event.agentId,
        text: event.message,
        timestamp: event.timestamp,
        debateId: event.debateId,
        factCheck: event.factCheck,
        sentiment: event.sentiment,
        stance: event.stance,
    };
}
