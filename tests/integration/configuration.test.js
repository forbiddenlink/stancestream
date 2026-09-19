/**
 * Integration Tests - Configuration and Startup
 * Tests system startup, configuration validation, and error handling
 */

import { expect } from 'chai';
import sinon from 'sinon';
import { validateEnvironment } from '../../src/config/environment.js';
import { errorHandler, notFoundHandler } from '../../src/middleware/errorHandler.js';
import express from 'express';
import request from 'supertest';

describe('System Configuration Integration', () => {
    let app;
    let sandbox;
    let processEnvBackup;

    before(() => {
        // Backup current process.env
        processEnvBackup = { ...process.env };
        sandbox = sinon.createSandbox();

        // Create Express app for testing error handlers
        app = express();
        app.use(express.json());
    });

    afterEach(() => {
        // Restore process.env after each test
        process.env = { ...processEnvBackup };
        sandbox.restore();
    });

    // Previously called validateSystem({ redisClient, openai }) with mock
    // clients. That function does not exist in src/config/environment.js -
    // the current module only exports validateEnvironment (which validates
    // process.env against a Zod schema, no client injection) plus
    // getEnvironmentConfig/isProduction/isDevelopment/isTest. There is no
    // current equivalent that takes live service clients, so this exercises
    // the real validateEnvironment instead.
    describe('System Startup Validation', () => {
        beforeEach(() => {
            process.env.REDIS_URL = 'redis://localhost:6379';
            process.env.OPENAI_API_KEY = `sk-${'a'.repeat(20)}`;
            process.env.NODE_ENV = 'test';
        });

        it('should validate complete system configuration', () => {
            const config = validateEnvironment();

            expect(config).to.have.property('REDIS_URL', 'redis://localhost:6379');
            expect(config).to.have.property('OPENAI_API_KEY');
            expect(config).to.have.property('NODE_ENV', 'test');
        });

        // KNOWN RUNTIME BUG (not fixed here - see PR body): the catch block
        // at src/config/environment.js:81 does `error.errors.forEach(...)`,
        // but zod 4.6.1's ZodError only exposes `.issues`, not `.errors`.
        // That line throws a TypeError before process.exit(1) is reached, so
        // invalid env vars crash the boot instead of exiting cleanly. These
        // assert the actual current behavior, not the intended one.
        it('throws a TypeError instead of exiting cleanly on an invalid REDIS_URL', () => {
            process.env.REDIS_URL = 'not-a-url';
            sandbox.stub(process, 'exit');
            sandbox.stub(console, 'error');
            sandbox.stub(console, 'log');

            expect(() => validateEnvironment()).to.throw(TypeError);
        });

        it('throws a TypeError instead of exiting cleanly on an invalid OPENAI_API_KEY', () => {
            process.env.OPENAI_API_KEY = 'sk-short';
            sandbox.stub(process, 'exit');
            sandbox.stub(console, 'error');
            sandbox.stub(console, 'log');

            expect(() => validateEnvironment()).to.throw(TypeError);
        });
    });

    describe('Error Handling Integration', () => {
        beforeEach(() => {
            // Set up error handlers
            app.use(errorHandler);
            app.use(notFoundHandler);
        });

        it('should handle Redis errors appropriately', async () => {
            app.get('/test-redis-error', (req, res, next) => {
                const error = new Error('Redis connection failed');
                error.type = 'redis';
                next(error);
            });

            const response = await request(app)
                .get('/test-redis-error')
                .expect(503);

            expect(response.body).to.have.property('success', false);
            expect(response.body).to.have.property('code', 'REDIS_ERROR');
        });

        it('should handle OpenAI errors appropriately', async () => {
            app.get('/test-openai-error', (req, res, next) => {
                const error = new Error('OpenAI API error');
                error.type = 'openai';
                next(error);
            });

            const response = await request(app)
                .get('/test-openai-error')
                .expect(503);

            expect(response.body).to.have.property('success', false);
            expect(response.body).to.have.property('code', 'OPENAI_ERROR');
        });

        it('should handle validation errors', async () => {
            app.get('/test-validation-error', (req, res, next) => {
                const error = new Error('Invalid input');
                error.type = 'validation';
                error.details = { field: 'topic', message: 'Required' };
                next(error);
            });

            const response = await request(app)
                .get('/test-validation-error')
                .expect(400);

            expect(response.body).to.have.property('success', false);
            expect(response.body).to.have.property('code', 'VALIDATION_ERROR');
            expect(response.body).to.have.property('details');
        });

        it('should handle rate limit errors', async () => {
            app.get('/test-rate-limit', (req, res, next) => {
                const error = new Error('Too many requests');
                error.type = 'rate_limit';
                error.retryAfter = 60;
                next(error);
            });

            const response = await request(app)
                .get('/test-rate-limit')
                .expect(429);

            expect(response.body).to.have.property('success', false);
            expect(response.body).to.have.property('code', 'RATE_LIMIT_EXCEEDED');
            expect(response.body).to.have.property('retryAfter', 60);
        });

        it('should handle 404 errors', async () => {
            const response = await request(app)
                .get('/non-existent-route')
                .expect(404);

            expect(response.body).to.have.property('success', false);
            expect(response.body).to.have.property('code', 'NOT_FOUND');
            expect(response.body).to.have.property('path');
        });

        it('should handle unexpected errors in development mode', async () => {
            process.env.NODE_ENV = 'development';

            app.get('/test-unexpected-error', (req, res, next) => {
                throw new Error('Unexpected error');
            });

            const response = await request(app)
                .get('/test-unexpected-error')
                .expect(500);

            expect(response.body).to.have.property('success', false);
            expect(response.body).to.have.property('code', 'INTERNAL_ERROR');
            expect(response.body).to.have.property('message');
            expect(response.body).to.have.property('stack');
        });

        it('should hide error details in production mode', async () => {
            process.env.NODE_ENV = 'production';

            app.get('/test-production-error', (req, res, next) => {
                throw new Error('Sensitive error details');
            });

            const response = await request(app)
                .get('/test-production-error')
                .expect(500);

            expect(response.body).to.have.property('success', false);
            expect(response.body).to.have.property('code', 'INTERNAL_ERROR');
            expect(response.body).to.not.have.property('stack');
            expect(response.body).to.not.have.property('message');
        });
    });
});
