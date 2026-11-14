/**
 * A failed model call must be flagged and logged, never returned as a polite
 * fallback turn that gets stored and broadcast as a normal debate message.
 */
import { expect } from 'chai';
import { buildAiFailure, AI_FAILURE_MESSAGE } from '../../aiFailure.js';

describe('buildAiFailure', () => {
    let errors;
    let original;

    beforeEach(() => {
        errors = [];
        original = console.error;
        console.error = (...args) => errors.push(args.join(' '));
    });

    afterEach(() => {
        console.error = original;
    });

    it('flags the result and carries a short user-facing message', () => {
        const result = buildAiFailure('test', Object.assign(new Error('model gpt-4 has been retired'), { status: 404, code: 'model_not_found' }));
        expect(result.error).to.equal(true);
        expect(result.message).to.equal(AI_FAILURE_MESSAGE);
        expect(result.message).to.not.match(/apologize/i);
        expect(result.status).to.equal(404);
        expect(result.code).to.equal('model_not_found');
    });

    it('logs exactly once with status, code and message', () => {
        buildAiFailure('test', Object.assign(new Error('boom'), { status: 401, code: 'invalid_api_key' }));
        expect(errors).to.have.length(1);
        expect(errors[0]).to.include('status=401').and.include('code=invalid_api_key').and.include('boom');
    });

    it('never logs the API key', () => {
        process.env.OPENAI_API_KEY = `sk-${'b'.repeat(24)}`;
        try {
            const result = buildAiFailure('test', new Error('Incorrect API key provided'));
            expect(JSON.stringify(result) + errors.join('')).to.not.include(process.env.OPENAI_API_KEY);
        } finally {
            delete process.env.OPENAI_API_KEY;
        }
    });

    it('handles non-Error throwables', () => {
        const result = buildAiFailure('test', 'plain string');
        expect(result.error).to.equal(true);
        expect(result.reason).to.equal('plain string');
    });
});
