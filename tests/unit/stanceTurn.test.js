/**
 * Each completed turn must produce its own stance_update with a 1-based turn
 * number. runDebateRounds used an undeclared `turn`, which threw inside a
 * try/catch and silently dropped every per-turn broadcast.
 */
import { expect } from 'chai';
import { stanceTurnInfo } from '../../src/utils/stanceTurn.js';

describe('stanceTurnInfo', () => {
    it('numbers turns from 1 and tracks round and speaker', () => {
        expect(stanceTurnInfo(0, 2)).to.deep.equal({ currentTurn: 1, currentRound: 1, agentIndex: 0 });
        expect(stanceTurnInfo(1, 2)).to.deep.equal({ currentTurn: 2, currentRound: 1, agentIndex: 1 });
        expect(stanceTurnInfo(2, 2)).to.deep.equal({ currentTurn: 3, currentRound: 2, agentIndex: 0 });
        expect(stanceTurnInfo(9, 2)).to.deep.equal({ currentTurn: 10, currentRound: 5, agentIndex: 1 });
    });
});
