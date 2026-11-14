// Setup Redis Vector Index for Semantic Cache
// Run this once to create the cache index for prompt similarity search
import 'dotenv/config';
import { createClient } from 'redis';

async function createCacheIndex() {
    console.log('🚀 Starting cache index setup...');
    
    if (!process.env.REDIS_URL) {
        console.error('❌ REDIS_URL environment variable not set');
        process.exit(1);
    }

    const client = createClient({ 
        url: process.env.REDIS_URL,
        socket: {
            reconnectStrategy: (retries) => {
                if (retries > 20) {
                    console.error('❌ Max reconnection attempts reached');
                    process.exit(1);
                }
                return Math.min(retries * 100, 3000);
            }
        }
    });

    // Handle Redis errors
    client.on('error', (err) => {
        console.error('❌ Redis Error:', err);
    });

    client.on('reconnecting', () => {
        console.log('🔄 Reconnecting to Redis...');
    });
    
    try {
        console.log('🔌 Connecting to Redis...');
        await client.connect();
        console.log('✅ Connected to Redis');

        // Verify Redis modules
        const modules = await client.moduleList();
        const hasSearch = modules.some(m => m.name === 'search');
        const hasJson = modules.some(m => m.name === 'ReJSON');

        if (!hasSearch || !hasJson) {
            console.error('❌ Required Redis modules not found:');
            console.error(`   - RediSearch: ${hasSearch ? '✅' : '❌'}`);
            console.error(`   - RedisJSON: ${hasJson ? '✅' : '❌'}`);
            process.exit(1);
        }
        console.log('✅ Required Redis modules verified');

        // Drop existing index if it exists
        try {
            await client.ft.dropIndex('cache-index');
            console.log('🗑️ Dropped existing cache-index');
        } catch (error) {
            console.log('ℹ️ No existing cache-index to drop');
        }

        // Create vector index for semantic cache
        await client.ft.create(
            'cache-index',
            {
                content: {
                    type: 'TEXT',
                    SORTABLE: true
                },
                response: {
                    type: 'TEXT'
                },
                topic: {
                    type: 'TAG',
                    SORTABLE: true
                },
                vector: {
                    type: 'VECTOR',
                    ALGORITHM: 'HNSW',
                    TYPE: 'FLOAT32',
                    DIM: 1536,
                    DISTANCE_METRIC: 'COSINE',
                    INITIAL_CAP: 100,
                    M: 16,
                    EF_CONSTRUCTION: 200
                },
                created_at: {
                    type: 'TEXT'
                },
                tokens_saved: {
                    type: 'NUMERIC'
                }
            },
            {
                ON: 'HASH',
                PREFIX: 'cache:prompt:'
            }
        );

        console.log('✅ Cache vector index created successfully!');
        console.log('📊 Index details:');
        console.log('   - Name: cache-index');
        console.log('   - Vector dimensions: 1536 (OpenAI embeddings)');
        console.log('   - Distance metric: COSINE');
        console.log('   - Algorithm: HNSW (fast similarity search)');
        console.log('   - Prefix: cache:prompt:*');
        console.log('');
        console.log('🎯 Semantic caching is now ready!');
        console.log('   - Similarity threshold: 85%');
        console.log('   - Cache TTL: 24 hours');
        console.log('   - Max entries: 10,000');

        // Initialize cache metrics
        const metricsKey = 'cache:metrics';
        const existingMetrics = await client.json.get(metricsKey);
        
        if (!existingMetrics) {
            const initialMetrics = {
                total_requests: 0,
                cache_hits: 0,
                cache_misses: 0,
                hit_ratio: 0,
                total_tokens_saved: 0,
                estimated_cost_saved: 0,
                average_similarity: 0,
                last_updated: new Date().toISOString(),
                created_at: new Date().toISOString(),
            };

            await client.json.set(metricsKey, '$', initialMetrics);
            console.log('📈 Cache metrics initialized');
        } else {
            console.log('📈 Existing cache metrics found');
        }

    } catch (error) {
        console.error('❌ Error creating cache index:', error);
        process.exit(1);
    } finally {
        await client.quit();
        console.log('🔌 Disconnected from Redis');
    }
}

// Run the setup
createCacheIndex();
