// Centralized Cache Configuration
// Single source of truth for all semantic cache settings

export const CACHE_CONFIG = {
    // Cosine similarity required for a cache hit. text-embedding-ada-002 scores
    // unrelated English text around 0.7, so anything lower serves cached replies
    // to different prompts on the same topic. 0.85 matches the documented default.
    SIMILARITY_THRESHOLD: 0.85,
    
    // OpenAI settings
    EMBEDDING_MODEL: 'text-embedding-ada-002',
    OPENAI_COST_PER_1K_TOKENS: 0.002, // Approximate GPT-4 cost
    
    // Cache management
    CACHE_TTL: 86400, // 24 hours in seconds
    MAX_CACHE_ENTRIES: 10000,
    MAX_PROMPT_LENGTH: 8000, // Limit to avoid token limits
    
    // Redis Vector Search settings
    VECTOR_INDEX_NAME: 'cache-index',
    VECTOR_SEARCH_LIMIT: 5, // Number of similar prompts to check
    
    // Performance settings
    TOKEN_ESTIMATION_RATIO: 4, // 1 token ≈ 4 characters for English
    CACHE_CLEANUP_INTERVAL: 3600000, // 1 hour in milliseconds
    
    // Business metrics
    ESTIMATED_TOKENS_PER_RESPONSE: 100, // Conservative estimate
    MEMORY_EFFICIENCY_FACTOR: 1024 * 1024, // Bytes to MB conversion
    
    // Environment-specific overrides
    getConfig() {
        return {
            ...this,
            // Allow environment variable overrides
            SIMILARITY_THRESHOLD: parseFloat(process.env.CACHE_SIMILARITY_THRESHOLD) || this.SIMILARITY_THRESHOLD,
            CACHE_TTL: parseInt(process.env.CACHE_TTL) || this.CACHE_TTL,
            MAX_CACHE_ENTRIES: parseInt(process.env.MAX_CACHE_ENTRIES) || this.MAX_CACHE_ENTRIES,
        };
    }
};

export default CACHE_CONFIG;
