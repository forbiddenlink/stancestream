import { describe, it } from 'mocha';
import { expect } from 'chai';
import request from 'supertest';
import express from 'express';

import {
  createConcurrencyGuard,
  createSpendGuard,
  readSpendConfig,
} from '../../src/middleware/spendGuard.js';

function app(active, max, cost) {
  const a = express();
  a.post('/start', createConcurrencyGuard({ getActiveCount: () => active.n, max, cost }), (req, res) => {
    active.n += cost ? cost(req) : 1;
    res.json({ ok: true });
  });
  return a;
}

describe('concurrencyGuard', () => {
  it('allows starts up to the cap then returns 429 concurrency_cap', async () => {
    const active = { n: 0 };
    const a = app(active, 2);
    await request(a).post('/start').expect(200);
    await request(a).post('/start').expect(200);
    const res = await request(a).post('/start').expect(429);
    expect(res.body.code).to.equal('concurrency_cap');
    expect(res.headers['retry-after']).to.equal('60');
  });

  it('counts a multi-start request by its cost', async () => {
    const active = { n: 1 };
    const a = app(active, 3, () => 3);
    await request(a).post('/start').expect(429);
    active.n = 0;
    await request(a).post('/start').expect(200);
  });

  it('defaults MAX_CONCURRENT_DEBATES to 3 and honours the env override', () => {
    expect(readSpendConfig({}).maxConcurrentDebates).to.equal(3);
    expect(readSpendConfig({ MAX_CONCURRENT_DEBATES: '7' }).maxConcurrentDebates).to.equal(7);
  });

  it('prefixes spend counter keys with the repo name', async () => {
    const keys = [];
    const client = {
      multi() {
        const chain = {
          incrBy(k) { keys.push(k); return chain; },
          expire() { return chain; },
          async exec() { return [1, 1]; },
        };
        return chain;
      },
    };
    const a = express();
    a.set('trust proxy', true);
    a.post('/x', createSpendGuard({
      getClient: async () => client, scope: 'ai', perIpLimit: 5, perIpWindowSec: 60, globalDailyLimit: 5,
    }), (req, res) => res.json({ ok: true }));
    await request(a).post('/x').expect(200);
    expect(keys.length).to.equal(2);
    for (const k of keys) expect(k.startsWith('stancestream:spend:')).to.equal(true);
  });
});
