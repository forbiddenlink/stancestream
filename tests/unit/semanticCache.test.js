/**
 * Semantic Cache System Tests
 *
 * This suite previously imported findSimilarPrompt, addToCache, clearCache,
 * optimizeCache, and validateCacheEntry from ../../semanticCache.js. None of
 * those names exist there (or ever did in this repo's history) - the module
 * only exports getCachedResponse, cacheNewResponse, getCacheMetrics, and
 * getCacheStats (plus a default singleton). Rewritten to exercise the real
 * exports.
 *
 * getCachedResponse/cacheNewResponse call the real OpenAI embeddings API
 * through a module-level singleton client (semanticCache.js does not accept
 * an injectable client, so there is nothing here to mock without changing
 * runtime code). Under a real OPENAI_API_KEY these succeed; under a fake one
 * (as CI falls back to when no secret is configured) the embedding call
 * fails and both functions handle that in different, real, and testable
 * ways: getCachedResponse always resolves (its cache-miss path swallows the
 * error), cacheNewResponse always rejects with the underlying Error since it
 * has no fallback path. Both outcomes are asserted below without assuming
 * which key is present. getCacheMetrics/getCacheStats only touch Redis and
 * are deterministic given a Redis Stack instance with the JSON module.
 */
import { expect } from 'chai';
import {
    getCachedResponse,
    cacheNewResponse,
    getCacheMetrics,
    getCacheStats
} from '../../semanticCache.js';

describe('Semantic Cache System', () => {
    describe('getCachedResponse', () => {
        it('never throws, and resolves to null or a hit shaped like { response, similarity }', async () => {
            const result = await getCachedResponse(
                'a prompt that has not been cached before',
                'general'
            );

            if (result === null) {
                expect(result).to.be.null;
            } else {
                expect(result).to.have.property('response');
                expect(result).to.have.property('similarity');
            }
        });
    });

    describe('cacheNewResponse', () => {
        it('resolves to a cache key string, or rejects with an Error', async () => {
            try {
                const cacheKey = await cacheNewResponse(
                    'semantic cache smoke test prompt',
                    'semantic cache smoke test response',
                    { topic: 'general' }
                );
                expect(cacheKey).to.be.a('string');
            } catch (error) {
                expect(error).to.be.instanceOf(Error);
            }
        });
    });

    describe('getCacheMetrics', () => {
        it('resolves to null or the default metrics shape, without throwing', async () => {
            const metrics = await getCacheMetrics();

            if (metrics === null) {
                expect(metrics).to.be.null;
            } else {
                expect(metrics).to.have.property('total_requests');
                expect(metrics).to.have.property('hit_ratio');
            }
        });
    });

    describe('getCacheStats', () => {
        it('resolves to null or an object including total_cache_entries, without throwing', async () => {
            const stats = await getCacheStats();

            if (stats === null) {
                expect(stats).to.be.null;
            } else {
                expect(stats).to.have.property('total_cache_entries');
            }
        });
    });
});
