// Clear semantic cache for fresh start with topic-aware caching
import 'dotenv/config';
import { createClient } from 'redis';

async function clearCache() {
    const client = createClient({ url: process.env.REDIS_URL });
    
    try {
        await client.connect();
        console.log('🔌 Connected to Redis');

        // Get all cache keys
        const keys = await client.keys('cache:prompt:*');
        console.log(`Found ${keys.length} cache entries`);

        if (keys.length > 0) {
            await client.del(keys);
            console.log('🗑️ Cache cleared');
        } else {
            console.log('✅ Cache already empty');
        }

        // Reset cache metrics
        await client.json.set('cache:metrics', '$', {
            total_requests: 0,
            cache_hits: 0,
            cache_misses: 0,
            hit_ratio: 0,
            total_tokens_saved: 0,
            estimated_cost_saved: 0,
            average_similarity: 0,
            last_updated: new Date().toISOString(),
            created_at: new Date().toISOString(),
        });
        console.log('📊 Cache metrics reset');

    } catch (error) {
        console.error('❌ Error clearing cache:', error);
    } finally {
        await client.quit();
        console.log('🔌 Disconnected');
    }
}

clearCache();
