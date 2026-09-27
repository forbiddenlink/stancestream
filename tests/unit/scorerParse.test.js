/**
 * Scorer score-parsing tests
 *
 * The scorer prompt (lib/agents/scorer.ts) tells the model to answer with
 * "PRO SCORE: <n>" / "CON SCORE: <n>". The old parser looked for "pro" followed
 * directly by optional colons/spaces and a digit, so the word SCORE in between
 * made every match fail and both sides silently fell back to 5: every round
 * was a 5-5 tie no matter what the model said.
 */
import { expect } from 'chai';
import { tsImport } from 'tsx/esm/api';

// CI runs Node 20, which cannot import .ts directly; tsx loads it on any version.
const { parseScores } = await tsImport('../../lib/agents/scorer.ts', import.meta.url);

describe('Scorer parseScores', () => {
    it('reads the exact format the scorer prompt asks for', () => {
        const out = parseScores('PRO SCORE: 8\nCON SCORE: 6\nREASONING: Pro cited evidence.');
        expect(out).to.deep.equal({ proScore: 8, conScore: 6 });
    });

    it('reads decimals and lowercase', () => {
        const out = parseScores('pro score: 7.5\ncon score: 4\nreasoning: close round.');
        expect(out).to.deep.equal({ proScore: 7.5, conScore: 4 });
    });

    it('still reads the short "PRO: n" form', () => {
        const out = parseScores('PRO: 3\nCON: 9');
        expect(out).to.deep.equal({ proScore: 3, conScore: 9 });
    });

    it('ignores numbers in the reasoning that follow words containing pro/con', () => {
        const out = parseScores('PRO SCORE: 2\nCON SCORE: 7\nREASONING: Con improved 3 points; proof 9 was weak.');
        expect(out).to.deep.equal({ proScore: 2, conScore: 7 });
    });

    it('clamps out-of-range scores to 0-10', () => {
        const out = parseScores('PRO SCORE: 14\nCON SCORE: 0');
        expect(out).to.deep.equal({ proScore: 10, conScore: 0 });
    });

    it('falls back to 5 only when a score is truly missing', () => {
        const out = parseScores('REASONING: the model forgot the scores.');
        expect(out).to.deep.equal({ proScore: 5, conScore: 5 });
    });
});
