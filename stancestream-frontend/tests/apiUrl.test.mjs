import test from 'node:test';
import assert from 'node:assert/strict';
import { buildApiUrl, getApiOrigin, getWebSocketUrl } from '../src/utils/url.js';
import { StanceStreamAPI } from '../src/services/api.js';

const makeResponse = (payload, status = 200, statusText = 'OK') => ({
  ok: status >= 200 && status < 300,
  status,
  statusText,
  json: async () => payload
});

test.afterEach(() => {
  delete globalThis.__STANCESTREAM_API_URL__;
});

test('buildApiUrl defaults to relative /api path when no configured origin', () => {
  assert.equal(getApiOrigin(), '');
  assert.equal(buildApiUrl('/health'), '/api/health');
  assert.equal(buildApiUrl('health'), '/api/health');
});

test('buildApiUrl and getWebSocketUrl honor configured api origin', () => {
  globalThis.__STANCESTREAM_API_URL__ = 'https://example.com/';

  assert.equal(getApiOrigin(), 'https://example.com');
  assert.equal(buildApiUrl('/health'), 'https://example.com/api/health');
  assert.equal(getWebSocketUrl(), 'wss://example.com');
});

test('api client retries failed get requests and succeeds', async () => {
  let calls = 0;
  const requestedUrls = [];

  const fetchImpl = async (url) => {
    calls += 1;
    requestedUrls.push(url);

    if (calls === 1) {
      throw new Error('temporary network failure');
    }

    return makeResponse({ ok: true });
  };

  const api = new StanceStreamAPI({
    fetchImpl,
    abortSignalImpl: { timeout: () => undefined }
  });

  const result = await api.get('/health', {
    retry: true,
    maxRetries: 2,
    retryDelay: 1
  });

  assert.deepEqual(result, { ok: true });
  assert.equal(calls, 2);
  assert.deepEqual(requestedUrls, ['/api/health', '/api/health']);
});

test('api client surfaces timeout errors with user friendly message', async () => {
  const fetchImpl = () => new Promise(() => {});
  const api = new StanceStreamAPI({
    fetchImpl,
    abortSignalImpl: { timeout: () => undefined }
  });

  await assert.rejects(
    () => api.get('/slow', { retry: false, timeout: 5 }),
    /Request timeout - please check your connection/
  );
});

test('api client does not retry post requests by default', async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    throw new Error('server unavailable');
  };

  const api = new StanceStreamAPI({
    fetchImpl,
    abortSignalImpl: { timeout: () => undefined }
  });

  await assert.rejects(
    () => api.post('/debate/start', { topic: 'x' }),
    /server unavailable/
  );

  assert.equal(calls, 1);
});

test('api client includes payload and endpoint on post success', async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    return makeResponse({ debateId: 'abc123' });
  };

  const api = new StanceStreamAPI({
    fetchImpl,
    abortSignalImpl: { timeout: () => undefined }
  });

  const result = await api.post('/debate/start', { topic: 'Climate Policy' });

  assert.equal(result.debateId, 'abc123');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, '/api/debate/start');
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[0].options.headers['Content-Type'], 'application/json');
  assert.equal(calls[0].options.body, JSON.stringify({ topic: 'Climate Policy' }));
});
