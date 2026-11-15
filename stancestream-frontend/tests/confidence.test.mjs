import assert from 'node:assert/strict';
import { test } from 'node:test';
import { confidenceLabel } from '../src/utils/confidence.js';

for (const value of [undefined, null, Number.NaN, Number.POSITIVE_INFINITY, -0.1, 1.1, '0.8']) {
  test(`unavailable confidence: ${String(value)}`, () => assert.equal(confidenceLabel(value), null));
}
test('measured zero is preserved', () => assert.equal(confidenceLabel(0), '0.00'));
test('valid measurements include both endpoints', () => {
  assert.equal(confidenceLabel(1), '1.00');
  assert.equal(confidenceLabel(0.8), '0.80');
});
