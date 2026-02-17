import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import request from 'supertest';
import express from 'express';

import debateRoutes, { getActiveDebates, getRunningProcesses } from '../../src/routes/debate.js';
import { errorHandler, notFoundHandler } from '../../src/middleware/errorHandler.js';
import { config } from '../../src/config/index.js';
import openAIValidator from '../../src/services/openAIValidator.js';

describe('Debate Lifecycle API Contract', () => {
  let app;
  let validateApiKeyStub;
  let originalStartCooldown;

  const clearDebateState = () => {
    getActiveDebates().clear();
    getRunningProcesses().clear();
  };

  beforeEach(() => {
    originalStartCooldown = config.debate.startCooldown;
    config.debate.startCooldown = 0;

    clearDebateState();

    validateApiKeyStub = sinon.stub(openAIValidator, 'validateApiKey').resolves({ valid: true });

    app = express();
    app.use(express.json());
    app.use('/api/debate', debateRoutes);
    app.use('/api/debates', debateRoutes);
    app.use(notFoundHandler);
    app.use(errorHandler);
  });

  afterEach(() => {
    config.debate.startCooldown = originalStartCooldown;
    clearDebateState();
    validateApiKeyStub.restore();
  });

  it('starts a debate and returns contract fields', async () => {
    const res = await request(app)
      .post('/api/debate/start')
      .send({
        debateId: 'contract_debate_1',
        topic: 'AI regulation strategy',
        agents: ['senatorbot', 'reformerbot']
      })
      .expect(200);

    expect(res.body.success).to.equal(true);
    expect(res.body).to.have.property('debateId', 'contract_debate_1');
    expect(res.body).to.have.property('topic', 'AI regulation strategy');
    expect(res.body).to.have.property('agents');
    expect(res.body.agents).to.deep.equal(['senatorbot', 'reformerbot']);
    expect(res.body).to.have.property('activeDebates', 1);
    expect(res.body).to.have.property('timestamp');
  });

  it('returns 409 for duplicate debate start', async () => {
    await request(app)
      .post('/api/debate/start')
      .send({
        debateId: 'duplicate_contract_debate',
        topic: 'Climate adaptation policy',
        agents: ['senatorbot', 'reformerbot']
      })
      .expect(200);

    const duplicate = await request(app)
      .post('/api/debate/start')
      .send({
        debateId: 'duplicate_contract_debate',
        topic: 'Climate adaptation policy',
        agents: ['senatorbot', 'reformerbot']
      })
      .expect(409);

    expect(duplicate.body.success).to.equal(false);
    expect(duplicate.body.error).to.match(/already running|request failed/i);
    expect(duplicate.body).to.have.property('timestamp');
  });

  it('stops an active debate and returns success contract', async () => {
    await request(app)
      .post('/api/debate/start')
      .send({
        debateId: 'stop_contract_debate',
        topic: 'Healthcare funding model',
        agents: ['senatorbot', 'reformerbot']
      })
      .expect(200);

    const stop = await request(app)
      .post('/api/debate/stop_contract_debate/stop')
      .expect(200);

    expect(stop.body.success).to.equal(true);
    expect(stop.body).to.have.property('debateId', 'stop_contract_debate');
    expect(stop.body.message).to.match(/stopped/i);
    expect(stop.body).to.have.property('timestamp');
  });

  it('returns 404 when stopping a non-existent debate', async () => {
    const res = await request(app)
      .post('/api/debate/missing_contract_debate/stop')
      .expect(404);

    expect(res.body.success).to.equal(false);
    expect(res.body.error).to.match(/no active debate|request failed/i);
    expect(res.body).to.have.property('timestamp');
  });

  it('stops all debates and returns stopped debate ids', async () => {
    await request(app)
      .post('/api/debate/start')
      .send({
        debateId: 'contract_a',
        topic: 'Housing policy reform',
        agents: ['senatorbot', 'reformerbot']
      })
      .expect(200);

    await request(app)
      .post('/api/debate/start')
      .send({
        debateId: 'contract_b',
        topic: 'Energy grid modernization',
        agents: ['senatorbot', 'reformerbot']
      })
      .expect(200);

    const stopAll = await request(app)
      .post('/api/debates/stop-all')
      .expect(200);

    expect(stopAll.body.success).to.equal(true);
    expect(stopAll.body).to.have.property('stoppedDebates');
    expect(stopAll.body.stoppedDebates).to.have.members(['contract_a', 'contract_b']);
    expect(stopAll.body.message).to.match(/debates stopped successfully/i);
  });

  it('returns current active debates list contract', async () => {
    await request(app)
      .post('/api/debate/start')
      .send({
        debateId: 'active_contract_debate',
        topic: 'Water infrastructure policy',
        agents: ['senatorbot', 'reformerbot']
      })
      .expect(200);

    const active = await request(app)
      .get('/api/debates/active')
      .expect(200);

    expect(active.body.success).to.equal(true);
    expect(active.body).to.have.property('debates');
    expect(active.body).to.have.property('totalActive', 1);
    expect(active.body.debates[0]).to.include({
      debateId: 'active_contract_debate',
      topic: 'Water infrastructure policy',
      status: 'running'
    });
  });

  it('returns 503 from start endpoint when OpenAI validation fails', async () => {
    validateApiKeyStub.restore();
    validateApiKeyStub = sinon.stub(openAIValidator, 'validateApiKey').resolves({
      valid: false,
      error: 'OpenAI key missing for test'
    });

    const res = await request(app)
      .post('/api/debate/start')
      .send({
        debateId: 'openai_unavailable_debate',
        topic: 'Public transit access',
        agents: ['senatorbot', 'reformerbot']
      })
      .expect(503);

    expect(res.body.success).to.equal(false);
    expect(res.body.error).to.equal('OpenAI service unavailable');
    expect(res.body.details).to.deep.include({ type: 'openai_error' });
  });
});
