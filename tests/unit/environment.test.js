/**
 * Environment Configuration and Validation Tests
 *
 * This suite previously tested requiredEnvVars, optionalEnvVars, redisConfig,
 * openAIConfig, validateSystem, and checkConfiguration - an object-based
 * validation API that src/config/environment.js stopped exporting when it
 * was rewritten to use a Zod schema. Nothing else in the codebase imports
 * those dropped names (only validateEnvironment, called from server.js).
 * Rewritten to test the current exported API: validateEnvironment,
 * getEnvironmentConfig, isProduction, isDevelopment, isTest.
 *
 * validateEnvironment does not throw on invalid input - it catches the
 * ZodError internally, logs it, and calls process.exit(1). Tests for the
 * invalid-input paths stub process.exit (and console output) so the test
 * process itself does not exit, then assert exit was called with 1.
 */
import { expect } from 'chai';
import sinon from 'sinon';
import {
    validateEnvironment,
    getEnvironmentConfig,
    isProduction,
    isDevelopment,
    isTest
} from '../../src/config/environment.js';

const VALID_OPENAI_KEY = `sk-${'a'.repeat(20)}`;

describe('Environment Configuration', () => {
    let sandbox;
    let processEnvBackup;

    before(() => {
        processEnvBackup = { ...process.env };
    });

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        process.env = { ...processEnvBackup };
        sandbox.restore();
    });

    describe('validateEnvironment', () => {
        beforeEach(() => {
            process.env.REDIS_URL = 'redis://localhost:6379';
            process.env.OPENAI_API_KEY = VALID_OPENAI_KEY;
        });

        it('returns the required vars and applies schema defaults for missing optional vars', () => {
            delete process.env.PORT;
            delete process.env.LOG_LEVEL;
            delete process.env.NODE_ENV;
            delete process.env.API_RATE_LIMIT;

            const config = validateEnvironment();

            expect(config.REDIS_URL).to.equal('redis://localhost:6379');
            expect(config.OPENAI_API_KEY).to.equal(VALID_OPENAI_KEY);
            expect(config.NODE_ENV).to.equal('development');
            expect(config.LOG_LEVEL).to.equal('info');
            // Zod applies the string .default() before .transform(Number), so
            // an unset PORT/API_RATE_LIMIT comes back as a string, not a
            // number - only explicitly-provided values get transformed
            // (covered below). This is real, current behavior of the schema.
            expect(config.PORT).to.equal('3001');
            expect(config.API_RATE_LIMIT).to.equal('60');
        });

        it('transforms explicitly-provided numeric fields to numbers', () => {
            process.env.PORT = '4000';
            process.env.API_RATE_LIMIT = '120';

            const config = validateEnvironment();

            expect(config.PORT).to.equal(4000);
            expect(config.API_RATE_LIMIT).to.equal(120);
        });

        it('accepts a TLS rediss:// REDIS_URL', () => {
            process.env.REDIS_URL = 'rediss://user:pass@example.com:6380';

            const config = validateEnvironment();

            expect(config.REDIS_URL).to.equal('rediss://user:pass@example.com:6380');
        });

        it('accepts LOG_LEVEL "trace"', () => {
            process.env.LOG_LEVEL = 'trace';

            const config = validateEnvironment();

            expect(config.LOG_LEVEL).to.equal('trace');
        });

        // validateEnvironment does not throw on invalid input: it logs each bad
        // field and calls process.exit(1). exit is stubbed here so the test
        // process survives, which means validateEnvironment returns undefined
        // and execution continues past the exit call.
        it('reports REDIS_URL and exits 1 on an invalid REDIS_URL', () => {
            process.env.REDIS_URL = 'not-a-url';
            const exit = sandbox.stub(process, 'exit');
            const error = sandbox.stub(console, 'error');
            sandbox.stub(console, 'log');

            validateEnvironment();

            expect(exit.calledWith(1)).to.equal(true);
            expect(error.args.flat().join(' ')).to.include('REDIS_URL');
        });

        it('reports OPENAI_API_KEY and exits 1 on a too-short OPENAI_API_KEY', () => {
            process.env.OPENAI_API_KEY = 'sk-short';
            const exit = sandbox.stub(process, 'exit');
            const error = sandbox.stub(console, 'error');
            sandbox.stub(console, 'log');

            validateEnvironment();

            expect(exit.calledWith(1)).to.equal(true);
            expect(error.args.flat().join(' ')).to.include('OPENAI_API_KEY');
        });

        it('reports OPENAI_API_KEY and exits 1 on an OPENAI_API_KEY missing the sk- prefix', () => {
            process.env.OPENAI_API_KEY = `xx-${'a'.repeat(20)}`;
            const exit = sandbox.stub(process, 'exit');
            const error = sandbox.stub(console, 'error');
            sandbox.stub(console, 'log');

            validateEnvironment();

            expect(exit.calledWith(1)).to.equal(true);
            expect(error.args.flat().join(' ')).to.include('OPENAI_API_KEY');
        });

        it('reports NODE_ENV and exits 1 on an invalid NODE_ENV', () => {
            process.env.NODE_ENV = 'staging';
            const exit = sandbox.stub(process, 'exit');
            const error = sandbox.stub(console, 'error');
            sandbox.stub(console, 'log');

            validateEnvironment();

            expect(exit.calledWith(1)).to.equal(true);
            expect(error.args.flat().join(' ')).to.include('NODE_ENV');
        });
    });

    describe('getEnvironmentConfig', () => {
        it('returns the development config, including for an unrecognized env name', () => {
            const config = getEnvironmentConfig('nonexistent');
            expect(config.logging.level).to.equal('debug');
            expect(config.server.corsOrigins).to.include('http://localhost:5173');
        });

        it('returns the production config with stricter cache settings', () => {
            const config = getEnvironmentConfig('production');
            expect(config.cache.similarityThreshold).to.equal(0.90);
            expect(config.server.corsOrigins).to.include('https://stancestream.vercel.app');
        });

        it('returns the test config', () => {
            const config = getEnvironmentConfig('test');
            expect(config.redis.maxRetries).to.equal(1);
            expect(config.logging.level).to.equal('error');
        });

        it('defaults to the current NODE_ENV when no argument is given', () => {
            process.env.NODE_ENV = 'production';
            const config = getEnvironmentConfig();
            expect(config.logging.level).to.equal('info');
            expect(config.cache.ttl).to.equal(86400);
        });
    });

    describe('isProduction / isDevelopment / isTest', () => {
        it('isProduction is true only when NODE_ENV is production', () => {
            process.env.NODE_ENV = 'production';
            expect(isProduction()).to.be.true;
            expect(isDevelopment()).to.be.false;
            expect(isTest()).to.be.false;
        });

        it('isDevelopment is true when NODE_ENV is development', () => {
            process.env.NODE_ENV = 'development';
            expect(isDevelopment()).to.be.true;
            expect(isProduction()).to.be.false;
        });

        it('isDevelopment is true when NODE_ENV is unset', () => {
            delete process.env.NODE_ENV;
            expect(isDevelopment()).to.be.true;
        });

        it('isTest is true only when NODE_ENV is test', () => {
            process.env.NODE_ENV = 'test';
            expect(isTest()).to.be.true;
            expect(isProduction()).to.be.false;
            expect(isDevelopment()).to.be.false;
        });
    });
});
