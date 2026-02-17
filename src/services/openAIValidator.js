// OpenAI API Key Validator and Rate Limit Handler
import { setTimeout } from 'timers/promises';

const getFetch = () => {
    if (typeof globalThis.fetch === 'function') {
        return globalThis.fetch.bind(globalThis);
    }
    throw new Error('Fetch API is not available in this runtime');
};

class OpenAIValidator {
    constructor() {
        this.validationCache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Validate OpenAI API key
     * @returns {Promise<{valid: boolean, error?: string}>}
     */
    async validateApiKey() {
        const apiKey = process.env.OPENAI_API_KEY;
        
        if (!apiKey) {
            return { 
                valid: false, 
                error: 'OpenAI API key not found in environment variables' 
            };
        }

        // Check cache first
        const cachedResult = this.validationCache.get(apiKey);
        if (cachedResult && Date.now() - cachedResult.timestamp < this.cacheExpiry) {
            return cachedResult.result;
        }

        try {
            const result = await this.testApiKey(apiKey);
            
            // Cache the result
            this.validationCache.set(apiKey, {
                timestamp: Date.now(),
                result
            });

            return result;
        } catch (error) {
            const result = { 
                valid: false, 
                error: `API key validation failed: ${error.message}` 
            };
            
            // Cache the error result too
            this.validationCache.set(apiKey, {
                timestamp: Date.now(),
                result
            });

            return result;
        }
    }

    /**
     * Test API key by making a minimal API call with retries
     * @param {string} apiKey - OpenAI API key to test
     * @param {number} retries - Number of retry attempts
     * @param {number} delayMs - Initial delay between retries in ms
     * @returns {Promise<{valid: boolean, error?: string}>}
     */
    async testApiKey(apiKey, retries = 3, delayMs = 1000) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const response = await getFetch()('https://api.openai.com/v1/models', {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                });

                // Handle common API errors
                switch (response.status) {
                    case 401:
                    case 403:
                        return { 
                            valid: false, 
                            error: 'Invalid API key',
                            status: response.status
                        };
                    case 429:
                        if (attempt < retries) {
                            console.log(`Rate limited, attempt ${attempt}/${retries}. Waiting ${delayMs}ms...`);
                            await setTimeout(delayMs);
                            delayMs *= 2; // Exponential backoff
                            continue;
                        }
                        return {
                            valid: false,
                            error: 'Rate limit exceeded',
                            status: 429
                        };
                    case 500:
                    case 502:
                    case 503:
                    case 504:
                        if (attempt < retries) {
                            console.log(`Server error ${response.status}, attempt ${attempt}/${retries}. Retrying...`);
                            await setTimeout(delayMs);
                            delayMs *= 2;
                            continue;
                        }
                        return {
                            valid: false,
                            error: `OpenAI API server error: ${response.status}`,
                            status: response.status
                        };
                }

                if (!response.ok) {
                    return { 
                        valid: false, 
                        error: `API request failed: ${response.statusText}`,
                        status: response.status
                    };
                }

                const data = await response.json();
                if (!data.data || !Array.isArray(data.data)) {
                    return { 
                        valid: false, 
                        error: 'Unexpected API response format',
                        data
                    };
                }

                return { 
                    valid: true,
                    models: data.data.length
                };

            } catch (error) {
                if (attempt < retries) {
                    console.log(`Request failed, attempt ${attempt}/${retries}. Retrying...`);
                    await setTimeout(delayMs);
                    delayMs *= 2;
                    continue;
                }
                return { 
                    valid: false, 
                    error: `API request failed: ${error.message}` 
                };
            }
        }
        
        // If we got here after all retries, something went wrong
        return {
            valid: false,
            error: 'Maximum retry attempts reached'
        };
    }

    /**
     * Clear validation cache
     */
    clearCache() {
        this.validationCache.clear();
    }
}

// Create and export singleton instance
const openAIValidator = new OpenAIValidator();
export { openAIValidator as default, OpenAIValidator };
