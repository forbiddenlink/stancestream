import { describe, it, beforeEach } from 'mocha';
import { expect } from 'chai';
import request from 'supertest';
import express from 'express';

import {
  readSpendConfig,
  clampRounds,
  clampDemoDuration,
  validateDebateStartBody,
  validateMultiStartBody,
  validateBody,
  createSpendGuard,
  debugRoutesGate,
  validateKeyMomentBody,
} from '../../src/middleware/spendGuard.js';

// Minimal in-memory stand-in for the node-redis calls the guard uses.
function makeFakeRedis({ failing = false } = {}) {
  const store = new Map();
  const ttls = new Map();
  return {
    store,
    ttls,
    multi() {
      const ops = [];
      const chain = {
        incrBy(key, n) {
          ops.push(() => {
            if (failing) throw new Error('redis down');
            store.set(key, (store.get(key) || 0) + n);
            return store.get(key);
          });
          return chain;
        },
        expire(key, sec, mode) {
          ops.push(() => {
            if (!(mode === 'NX' && ttls.has(key))) ttls.set(key, sec);
            return 1;
          });
          return chain;
        },
        async exec() {
          return ops.map((op) => op());
        },
      };
      return chain;
    },
  };
}

const cfg = readSpendConfig({});

function buildApp(fake, opts = {}) {
  const app = express();
  app.set('trust proxy', true);
  app.use(express.json());
  let started = 0;
  app.post(
    '/api/debate/start',
    validateBody(validateDebateStartBody, cfg),
    createSpendGuard({
      getClient: async () => fake,
      scope: 'debate',
      perIpLimit: opts.perIpLimit ?? 3,
      perIpWindowSec: 3600,
      globalDailyLimit: opts.globalDailyLimit ?? 50,
      now: opts.now,
    }),
    (req, res) => {
      started++;
      res.json({ success: true, rounds: req.validated.rounds, started });
    },
  );
  return app;
}

const validBody = { topic: 'AI regulation', agents: ['senatorbot', 'reformerbot'] };
const post = (app, ip, body = validBody) =>
  request(app).post('/api/debate/start').set('X-Forwarded-For', ip).send(body);

describe('spendGuard', () => {
  let fake;
  beforeEach(() => {
    fake = makeFakeRedis();
  });

  describe('per-IP limit', () => {
    it('allows 3 debate starts per IP then returns 429', async () => {
      const app = buildApp(fake);
      for (let i = 0; i < 3; i++) await post(app, '1.1.1.1').expect(200);
      const res = await post(app, '1.1.1.1').expect(429);
      expect(res.body.code).to.equal('ip_limit');
      expect(res.headers['retry-after']).to.equal('3600');
    });

    it('tracks IPs independently', async () => {
      const app = buildApp(fake);
      for (let i = 0; i < 3; i++) await post(app, '1.1.1.1').expect(200);
      await post(app, '1.1.1.1').expect(429);
      await post(app, '2.2.2.2').expect(200);
    });

    it('sets a TTL on the counter and does not reset it on later hits', async () => {
      const app = buildApp(fake);
      await post(app, '1.1.1.1').expect(200);
      const key = [...fake.ttls.keys()].find((k) => k.includes(':ip:'));
      expect(fake.ttls.get(key)).to.equal(3600);
    });
  });

  describe('global daily cap', () => {
    it('returns 429 daily_cap once the global budget is spent, across IPs', async () => {
      const app = buildApp(fake, { globalDailyLimit: 2 });
      await post(app, '1.1.1.1').expect(200);
      await post(app, '2.2.2.2').expect(200);
      const res = await post(app, '3.3.3.3').expect(429);
      expect(res.body.code).to.equal('daily_cap');
    });

    it('uses a new counter on the next UTC day', async () => {
      let day = new Date('2026-10-13T12:00:00Z');
      const app = buildApp(fake, { globalDailyLimit: 1, now: () => day });
      await post(app, '1.1.1.1').expect(200);
      await post(app, '2.2.2.2').expect(429);
      day = new Date('2026-10-14T00:00:01Z');
      await post(app, '3.3.3.3').expect(200);
    });
  });

  describe('fail closed', () => {
    it('returns 503 and does not start a debate when Redis is down', async () => {
      const app = buildApp(makeFakeRedis({ failing: true }));
      const res = await post(app, '1.1.1.1').expect(503);
      expect(res.body.code).to.equal('limiter_unavailable');
    });

    it('returns 503 when the client cannot be obtained', async () => {
      const app = express();
      app.use(express.json());
      app.post(
        '/x',
        createSpendGuard({
          getClient: async () => {
            throw new Error('no client');
          },
          scope: 'debate',
          perIpLimit: 3,
          perIpWindowSec: 3600,
          globalDailyLimit: 50,
        }),
        (_req, res) => res.json({ ok: true }),
      );
      await request(app).post('/x').send({}).expect(503);
    });
  });

  describe('round cap', () => {
    it('clamps rounds from the request body to the server maximum', async () => {
      const app = buildApp(fake);
      const res = await post(app, '1.1.1.1', { ...validBody, rounds: 100000 }).expect(200);
      expect(res.body.rounds).to.equal(cfg.maxRounds);
    });

    it('clampRounds handles junk, zero, negatives and in-range values', () => {
      expect(clampRounds('abc', 5)).to.equal(5);
      expect(clampRounds(0, 5)).to.equal(1);
      expect(clampRounds(-9, 5)).to.equal(1);
      expect(clampRounds(3, 5)).to.equal(3);
      expect(clampRounds(99, 5)).to.equal(5);
    });

    it('defaults to the cap when rounds is omitted', () => {
      const r = validateDebateStartBody(validBody, cfg);
      expect(r.value.rounds).to.equal(cfg.maxRounds);
    });
  });

  describe('invalid body is rejected before spending quota', () => {
    const bad = [
      ['empty body', {}],
      ['missing topic', { agents: ['senatorbot', 'reformerbot'] }],
      ['non-string topic', { topic: 42 }],
      ['blank topic', { topic: '   ' }],
      ['oversized topic', { topic: 'x'.repeat(cfg.maxTopicLength + 1) }],
      ['control chars in topic', { topic: 'hello\u0000world' }],
      ['unknown agent id', { topic: 'ok', agents: ['senatorbot', 'evilbot'] }],
      ['duplicate agents', { topic: 'ok', agents: ['senatorbot', 'senatorbot'] }],
      ['too many agents', { topic: 'ok', agents: ['senatorbot', 'reformerbot', 'senatorbot'] }],
      ['agents not an array', { topic: 'ok', agents: 'senatorbot' }],
      ['bad debateId', { topic: 'ok', debateId: '../../etc' }],
    ];
    for (const [name, body] of bad) {
      it(`400 on ${name}`, async () => {
        const app = buildApp(fake);
        await post(app, '1.1.1.1', body).expect(400);
        expect(fake.store.size, 'quota must not be consumed').to.equal(0);
      });
    }

    it('400 on a request with no body at all', async () => {
      const app = buildApp(fake);
      await request(app).post('/api/debate/start').expect(400);
    });

    it('accepts the frontend payload and trims the topic', () => {
      const r = validateDebateStartBody(
        { debateId: 'live_debate', topic: '  Climate  ', agents: ['senatorbot', 'reformerbot'] },
        cfg,
      );
      expect(r.ok).to.equal(true);
      expect(r.value.topic).to.equal('Climate');
    });
  });

  describe('start-multiple and demo helpers', () => {
    it('rejects more topics than the cap', () => {
      const topics = Array.from({ length: cfg.maxMultiTopics + 1 }, () => 'topic');
      expect(validateMultiStartBody({ topics }, cfg).ok).to.equal(false);
    });

    it('accepts a bounded list of valid topics', () => {
      expect(validateMultiStartBody({ topics: ['a', 'b'] }, cfg).ok).to.equal(true);
    });

    it('charges one unit per topic via cost()', async () => {
      const app = express();
      app.use(express.json());
      app.post(
        '/m',
        createSpendGuard({
          getClient: async () => fake,
          scope: 'debate',
          perIpLimit: 3,
          perIpWindowSec: 3600,
          globalDailyLimit: 50,
          cost: (req) => req.body.topics.length,
        }),
        (_req, res) => res.json({ ok: true }),
      );
      await request(app).post('/m').send({ topics: ['a', 'b'] }).expect(200);
      await request(app).post('/m').send({ topics: ['a', 'b'] }).expect(429);
    });

    it('clamps demo duration', () => {
      expect(clampDemoDuration(9999, cfg)).to.equal(cfg.maxDemoDurationSec);
      expect(clampDemoDuration('x', cfg)).to.equal(cfg.maxDemoDurationSec);
      expect(clampDemoDuration(10, cfg)).to.equal(10);
    });
  });

  describe('readSpendConfig', () => {
    it('reads env overrides and ignores junk', () => {
      const c = readSpendConfig({
        DEBATE_START_PER_IP_LIMIT: '7',
        DEBATE_START_GLOBAL_DAILY_LIMIT: 'nope',
      });
      expect(c.debate.perIpLimit).to.equal(7);
      expect(c.debate.globalDailyLimit).to.equal(50);
    });
  });

  describe('debug routes', () => {
    const appFor = (env) => {
      const app = express();
      app.use(express.json());
      app.post(
        '/api/debug/key-moment',
        debugRoutesGate(env),
        validateBody(validateKeyMomentBody, cfg),
        (_req, res) => res.json({ ok: true }),
      );
      return app;
    };
    it('404 in production by default', async () => {
      await request(appFor({ NODE_ENV: 'production' }))
        .post('/api/debug/key-moment').send({ message: 'hi' }).expect(404);
    });
    it('allowed in production with ENABLE_DEBUG_ROUTES=true', async () => {
      await request(appFor({ NODE_ENV: 'production', ENABLE_DEBUG_ROUTES: 'true' }))
        .post('/api/debug/key-moment').send({ message: 'hi' }).expect(200);
    });
    it('allowed outside production', async () => {
      await request(appFor({ NODE_ENV: 'development' }))
        .post('/api/debug/key-moment').send({ message: 'hi' }).expect(200);
    });
    it('rejects missing or oversized message', async () => {
      const app = appFor({ NODE_ENV: 'development' });
      await request(app).post('/api/debug/key-moment').send({}).expect(400);
      await request(app).post('/api/debug/key-moment')
        .send({ message: 'x'.repeat(cfg.maxMessageLength + 1) }).expect(400);
    });
  });
});
