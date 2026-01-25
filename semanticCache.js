// Semantic Cache System - Redis Vector Showcase Feature
// Caches AI responses based on prompt similarity using OpenAI embeddings
import 'dotenv/config';
import redisManager from './redisManager.js';
import OpenAI from 'openai';
import crypto from 'crypto';
import { CACHE_CONFIG } from './cacheConfig.js';
import {
    cacheHitsTotal,
    cacheMissesTotal,
    cacheHitRate,
    cacheSimilarityScore,
    cacheResponseTime,
    cacheSize,
    cacheCostSavings,
    trackCacheOperation,
    updateCacheHitRate
} from './metrics.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Get configuration with environment overrides
const config = CACHE_CONFIG.getConfig();

class SemanticCache {
    constructor() {
        this.metricsKey = 'cache:metrics';
        this.embeddingCache = new Map(); // In-memory embedding cache
        this.embeddingCacheSize = 0;
        this.maxEmbeddingCacheSize = 1000; // Limit memory usage
    }

    async disconnect() {
        // Clear embedding cache on disconnect
        this.embeddingCache.clear();
        this.embeddingCacheSize = 0;
        console.log('🧹 Embedding cache cleared');
    }

    // Generate embedding for prompt with caching
    async generateEmbedding(text) {
        try {
            // Create cache key from text content
            const cacheKey = crypto.createHash('sha256').update(text).digest('hex').substring(0, 16);
            
            // Check in-memory embedding cache first
            if (this.embeddingCache.has(cacheKey)) {
                console.log('🎯 Embedding cache hit - saved OpenAI API call');
                return this.embeddingCache.get(cacheKey);
            }

            const response = await openai.embeddings.create({
                model: config.EMBEDDING_MODEL,
                input: text.substring(0, config.MAX_PROMPT_LENGTH), // Use config limit
            });
            
            const embedding = response.data[0].embedding;
            
            // Cache the embedding (with size management)
            if (this.embeddingCacheSize < this.maxEmbeddingCacheSize) {
                this.embeddingCache.set(cacheKey, embedding);
                this.embeddingCacheSize++;
            } else {
                // Clean up old entries (simple LRU-like behavior)
                const firstKey = this.embeddingCache.keys().next().value;
                if (firstKey) {
                    this.embeddingCache.delete(firstKey);
                    this.embeddingCacheSize--;
                }
                this.embeddingCache.set(cacheKey, embedding);
            }
            
            console.log(`💾 Embedding cached (${this.embeddingCacheSize}/${this.maxEmbeddingCacheSize})`);
            return embedding;
        } catch (error) {
            console.error('Error generating embedding:', error);
            throw error;
        }
    }

    // Create unique cache key from prompt including topic context
    createCacheKey(prompt, topic = 'general') {
        const contextualPrompt = `${topic}::${prompt}`;
        const hash = crypto.createHash('sha256').update(contextualPrompt).digest('hex');
        return `cache:prompt:${hash.substring(0, 16)}`;
    }

    // Search for similar cached prompts with topic awareness
    async findSimilarCachedResponse(prompt, topic = 'general') {
        const start = Date.now();
        
        try {
            // Include topic in embedding generation for better context
            const contextualPrompt = `Topic: ${topic}. ${prompt}`;
            const embedding = await this.generateEmbedding(contextualPrompt);
            const vectorBuffer = Buffer.from(new Float32Array(embedding).buffer);

            // Search for similar prompts using Redis Vector Search WITH topic filtering
            const searchResults = await redisManager.execute(async (client) => {
                return await client.ft.search(
                    config.VECTOR_INDEX_NAME,
                    `@topic:{${topic.replace(/[^a-zA-Z0-9]/g, '_')}} => [KNN ${config.VECTOR_SEARCH_LIMIT} @vector $query_vector AS score]`,
                    {
                        PARAMS: {
                            query_vector: vectorBuffer,
                        },
                        SORTBY: 'score',
                        DIALECT: 2,
                        RETURN: ['content', 'response', 'created_at', 'score', 'topic'],
                    }
                );
            });

            if (searchResults.total > 0) {
                const bestMatch = searchResults.documents[0];
                const similarity = 1 - parseFloat(bestMatch.value.score); // Convert distance to similarity

                if (similarity >= config.SIMILARITY_THRESHOLD) {
                    const duration = (Date.now() - start) / 1000;
                    
                    console.log(`🎯 Cache HIT! Similarity: ${(similarity * 100).toFixed(1)}%`);
                    
                    // Track metrics
                    const metadata = bestMatch.value.metadata ? JSON.parse(bestMatch.value.metadata) : {};
                    const agentId = metadata.agentId || 'unknown';
                    
                    // Estimate cost saved (approximate GPT-4o-mini cost)
                    const estimatedTokens = Math.ceil(prompt.length / 4);
                    const costSaved = (estimatedTokens * 0.15 + estimatedTokens * 0.60) / 1000000;
                    
                    trackCacheOperation(true, similarity, agentId, topic, costSaved);
                    cacheSimilarityScore.observe(similarity);
                    cacheResponseTime.observe({ hit: 'true' }, duration);
                    
                    // Update hit metrics
                    await this.updateMetrics(true, similarity);
                    
                    return {
                        response: bestMatch.value.response,
                        similarity,
                        cached: true,
                        originalPrompt: bestMatch.value.content,
                    };
                }
            }

            const duration = (Date.now() - start) / 1000;
            console.log('❌ Cache MISS - No similar prompts found');
            
            trackCacheOperation(false, 0, 'unknown', topic, 0);
            cacheResponseTime.observe({ hit: 'false' }, duration);
            
            await this.updateMetrics(false, 0);
            return null;

        } catch (error) {
            const duration = (Date.now() - start) / 1000;
            console.error('Error searching cache:', error);
            
            cacheResponseTime.observe({ hit: 'false' }, duration);
            
            await this.updateMetrics(false, 0);
            return null;
        }
    }

    // Cache new response with embedding and topic context
    async cacheResponse(prompt, response, metadata = {}) {
        try {
            const topic = metadata.topic || 'general';
            const cacheKey = this.createCacheKey(prompt, topic);
            
            // Include topic in embedding for better matching
            const contextualPrompt = `Topic: ${topic}. ${prompt}`;
            const embedding = await this.generateEmbedding(contextualPrompt);
            const vectorBuffer = Buffer.from(new Float32Array(embedding).buffer);

            // Store in Redis with both hash and vector data
            const cacheData = {
                content: contextualPrompt,
                original_prompt: prompt,
                topic: topic,
                response: response,
                vector: vectorBuffer,
                created_at: new Date().toISOString(),
                metadata: JSON.stringify(metadata),
                tokens_saved: this.estimateTokens(response),
            };

            await redisManager.execute(async (client) => {
                await client.hSet(cacheKey, cacheData);
                // Set TTL
                await client.expire(cacheKey, config.CACHE_TTL);
            });

            console.log(`💾 Response cached with key: ${cacheKey}`);
            
            return cacheKey;

        } catch (error) {
            console.error('Error caching response:', error);
            throw error;
        }
    }

    // Update cache metrics
    async updateMetrics(isHit, similarity = 0) {
        try {
            const now = new Date().toISOString();
            
            // Get current metrics or initialize
            let metrics = await redisManager.execute(async (client) => {
                return await client.json.get(this.metricsKey);
            });

            if (!metrics) {
                metrics = {
                    total_requests: 0,
                    cache_hits: 0,
                    cache_misses: 0,
                    hit_ratio: 0,
                    total_tokens_saved: 0,
                    estimated_cost_saved: 0,
                    average_similarity: 0,
                    last_updated: now,
                    created_at: now,
                };
            }

            // Update counters
            metrics.total_requests++;
            
            if (isHit) {
                metrics.cache_hits++;
                // Estimate tokens saved (rough calculation)
                const tokensSaved = config.ESTIMATED_TOKENS_PER_RESPONSE; // Use config value
                metrics.total_tokens_saved += tokensSaved;
                metrics.estimated_cost_saved = (metrics.total_tokens_saved / 1000) * config.OPENAI_COST_PER_1K_TOKENS;
                
                // Update average similarity
                metrics.average_similarity = ((metrics.average_similarity * (metrics.cache_hits - 1)) + similarity) / metrics.cache_hits;
            } else {
                metrics.cache_misses++;
            }

            // Calculate hit ratio (as decimal for consistency)
            metrics.hit_ratio = metrics.cache_hits / metrics.total_requests;
            metrics.last_updated = now;

            // Store updated metrics
            await redisManager.execute(async (client) => {
                await client.json.set(this.metricsKey, '.', metrics);
            });

            console.log(`📊 Cache metrics updated: ${metrics.cache_hits}/${metrics.total_requests} (${(metrics.hit_ratio * 100).toFixed(1)}%)`);

            // Update Prometheus metrics
            await updateCacheHitRate(metrics.total_requests, metrics.cache_hits);
            cacheHitRate.set(metrics.hit_ratio * 100); // Convert to percentage

        } catch (error) {
            console.error('Error updating cache metrics:', error);
        }
    }

    // Get current cache metrics
    async getMetrics() {
        try {
            const metrics = await redisManager.execute(async (client) => {
                return await client.json.get(this.metricsKey);
            });
            return metrics || {
                total_requests: 0,
                cache_hits: 0,
                cache_misses: 0,
                hit_ratio: 0,
                total_tokens_saved: 0,
                estimated_cost_saved: 0,
                average_similarity: 0,
                last_updated: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Error getting cache metrics:', error);
            return null;
        }
    }

    // Estimate token count (rough approximation)
    estimateTokens(text) {
        // Use config value for token estimation
        return Math.ceil(text.length / config.TOKEN_ESTIMATION_RATIO);
    }

    // Clean up old cache entries
    async cleanupCache() {
        try {
            // Find expired entries (Redis TTL handles this automatically)
            // This method can be used for additional cleanup logic
            console.log('🧹 Cache cleanup completed');
            
        } catch (error) {
            console.error('Error during cache cleanup:', error);
        }
    }

    // Get cache statistics
    async getCacheStats() {
        try {
            const metrics = await this.getMetrics();
            const totalKeys = await redisManager.execute(async (client) => {
                return await client.eval(`
                    local keys = redis.call('KEYS', 'cache:prompt:*')
                    return #keys
                `, 0);
            });

            return {
                ...metrics,
                total_cache_entries: totalKeys,
                cache_efficiency: metrics.hit_ratio,
                memory_saved_mb: (metrics.total_tokens_saved * config.TOKEN_ESTIMATION_RATIO) / config.MEMORY_EFFICIENCY_FACTOR, // Use config values
            };

        } catch (error) {
            console.error('Error getting cache stats:', error);
            return null;
        }
    }
}

// Export singleton instance
const semanticCache = new SemanticCache();

export default semanticCache;

// Helper functions for easy integration
export async function getCachedResponse(prompt, topic = 'general') {
    return await semanticCache.findSimilarCachedResponse(prompt, topic);
}

export async function cacheNewResponse(prompt, response, metadata = {}) {
    return await semanticCache.cacheResponse(prompt, response, metadata);
}

export async function getCacheMetrics() {
    return await semanticCache.getMetrics();
}

export async function getCacheStats() {
    return await semanticCache.getCacheStats();
}
