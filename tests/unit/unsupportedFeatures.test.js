import { describe, it, beforeEach } from 'mocha';
import assert from 'node:assert/strict';
import {
  disableIfUnsupported,
  isFeatureDisabled,
  isUnsupportedCommandError,
  resetUnsupportedFeatures,
} from '../../src/utils/unsupportedFeatures.js';

describe('unsupportedFeatures', () => {
  beforeEach(() => resetUnsupportedFeatures());

  it('recognises Upstash unsupported-command errors', () => {
    assert.equal(isUnsupportedCommandError(new Error('ERR Upstash Redis does not support FT.* commands.')), true);
    assert.equal(isUnsupportedCommandError(new Error("ERR Command is not available: 'TS.ADD'")), true);
    assert.equal(isUnsupportedCommandError(new Error('connection reset')), false);
  });

  it('disables a feature once and ignores unrelated errors', () => {
    assert.equal(disableIfUnsupported('TS', new Error('boom')), false);
    assert.equal(isFeatureDisabled('TS'), false);
    assert.equal(disableIfUnsupported('TS', new Error("Command is not available: 'TS.ADD'")), true);
    assert.equal(isFeatureDisabled('TS'), true);
  });
});
