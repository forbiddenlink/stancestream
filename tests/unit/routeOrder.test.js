/**
 * Express runs handlers in registration order. A route registered after the
 * catch-all 404 handler can never be reached, which is how 13 endpoints
 * (/api/optimization/metrics, /api/showcase/redis-modules and others)
 * silently returned 404 in production.
 */
import { expect } from 'chai';
import { readFileSync } from 'node:fs';

describe('server.js route order', () => {
  it('registers no route after the 404 fallback', () => {
    const lines = readFileSync(new URL('../../server.js', import.meta.url), 'utf8').split('\n');
    const fallback = lines.findIndex((l) => /^app\.use\(\(req, res\) => \{/.test(l));
    expect(fallback, '404 fallback handler not found').to.be.greaterThan(-1);
    const late = lines
      .slice(fallback + 1)
      .filter((l) => /^app\.(get|post|put|patch|delete|all|use)\(/.test(l));
    expect(late, 'routes registered after the 404 fallback').to.deep.equal([]);
  });
});
