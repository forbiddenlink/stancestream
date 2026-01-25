/**
 * Integration tests for health check endpoints
 */

import { describe, it, before, after } from 'mocha';
import { expect } from 'chai';
import request from 'supertest';
import express from 'express';
import enhancedEndpoints from '../../src/routes/enhanced-endpoints.js';

describe('Health Check Endpoints', () => {
    let app;

    before(() => {
        app = express();
        app.use('/', enhancedEndpoints);
    });

    describe('GET /api/health/detailed', () => {
        it('should return detailed health status', async () => {
            const res = await request(app)
                .get('/api/health/detailed')
                .expect('Content-Type', /json/);

            expect(res.status).to.be.oneOf([200, 503]);
            expect(res.body).to.have.property('status');
            expect(res.body).to.have.property('timestamp');
            expect(res.body).to.have.property('services');
            expect(res.body).to.have.property('system');
        });

        it('should include Redis health information', async () => {
            const res = await request(app)
                .get('/api/health/detailed');

            if (res.body.services && res.body.services.redis) {
                expect(res.body.services.redis).to.have.property('status');
            }
        });

        it('should include memory usage', async () => {
            const res = await request(app)
                .get('/api/health/detailed');

            expect(res.body.system).to.have.property('memory');
            expect(res.body.system.memory).to.have.property('heapUsed');
            expect(res.body.system.memory).to.have.property('rss');
        });
    });

    describe('GET /api/system/info', () => {
        it('should return system information', async () => {
            const res = await request(app)
                .get('/api/system/info')
                .expect(200)
                .expect('Content-Type', /json/);

            expect(res.body).to.have.property('version');
            expect(res.body).to.have.property('nodeVersion');
            expect(res.body).to.have.property('platform');
            expect(res.body).to.have.property('features');
        });

        it('should indicate features are enabled', async () => {
            const res = await request(app)
                .get('/api/system/info');

            expect(res.body.features.metricsEnabled).to.be.true;
            expect(res.body.features.validationEnabled).to.be.true;
            expect(res.body.features.semanticCaching).to.be.true;
        });
    });
});
