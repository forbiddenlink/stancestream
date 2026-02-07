import { buildApiUrl } from '../utils/url';

// Request timeout configuration
const REQUEST_TIMEOUT = 10000; // 10 seconds

// Helper function to create timeout promise
const withTimeout = (promise, timeoutMs = REQUEST_TIMEOUT) => {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
        )
    ]);
};

// Helper function for retry logic
const withRetry = async (fn, maxRetries = 2, delay = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            if (attempt === maxRetries) {
                throw error;
            }
            console.warn(`🔄 API call failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 1.5; // Exponential backoff
        }
    }
};

class StanceStreamAPI {
    async get(endpoint, options = {}) {
        const { timeout = REQUEST_TIMEOUT, retry = true } = options;
        
        const makeRequest = () => {
            const response = fetch(buildApiUrl(endpoint), {
                signal: AbortSignal.timeout(timeout)
            });
            
            return withTimeout(response, timeout);
        };

        try {
            const response = retry ? await withRetry(makeRequest) : await makeRequest();
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }
            return response.json();
        } catch (error) {
            if (error.name === 'TimeoutError' || error.message === 'Request timeout') {
                console.error(`⏰ API request timeout: ${endpoint}`);
                throw new Error(`Request timeout - please check your connection`);
            }
            console.error(`❌ API GET error for ${endpoint}:`, error);
            throw error;
        }
    }

    async post(endpoint, data, options = {}) {
        const { timeout = REQUEST_TIMEOUT, retry = false } = options; // POST usually shouldn't retry by default
        
        const makeRequest = () => {
            const response = fetch(buildApiUrl(endpoint), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
                signal: AbortSignal.timeout(timeout)
            });
            
            return withTimeout(response, timeout);
        };

        try {
            const response = retry ? await withRetry(makeRequest) : await makeRequest();
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }
            return response.json();
        } catch (error) {
            if (error.name === 'TimeoutError' || error.message === 'Request timeout') {
                console.error(`⏰ API request timeout: ${endpoint}`);
                throw new Error(`Request timeout - please check your connection`);
            }
            console.error(`❌ API POST error for ${endpoint}:`, error);
            throw error;
        }
    }

    // Agent methods
    async getAgentProfile(agentId) {
        return this.get(`/agent/${agentId}/profile`);
    }

    async updateAgentProfile(agentId, updates) {
        return this.post(`/agent/${agentId}/update`, updates);
    }

    async getAgentMemory(agentId, debateId, limit = 5) {
        return this.get(`/agent/${agentId}/memory/${debateId}?limit=${limit}`);
    }

    async getAgentStance(agentId, debateId, topic) {
        return this.get(`/agent/${agentId}/stance/${debateId}/${topic}`);
    }

    // Debate methods
    async startDebate(config = {}) {
        return this.post('/debate/start', config);
    }

    async stopDebate(debateId) {
        return this.post(`/debate/${debateId}/stop`, {});
    }

    async stopAllDebates() {
        return this.post('/debates/stop-all', {});
    }

    async getDebateMessages(debateId, limit = 10) {
        return this.get(`/debate/${debateId}/messages?limit=${limit}`);
    }

    // Health check with retry for critical connectivity
    async getHealth() {
        return this.get('/health', { retry: true });
    }

    // Redis performance stats with retry
    async getRedisStats() {
        return this.get('/stats/redis', { retry: true });
    }

    // 🏆 Platform Analytics
    async getContestAnalytics() {
        return this.get('/contest/analytics');
    }

    // 🏢 Platform Analytics (Professional Alias)
    async getPlatformAnalytics() {
        return this.get('/platform/analytics');
    }

    // Add fact to knowledge base
    async addFact(fact, source = 'user', category = 'general') {
        return this.post('/facts/add', { fact, source, category });
    }

    // Generate debate summary
    async generateSummary(debateId, maxMessages = 20) {
        return this.post(`/debate/${debateId}/summarize`, { maxMessages });
    }

    // 🆕 MULTI-DEBATE API METHODS

    // Get all active debates
    async getActiveDebates() {
        return this.get('/debates/active');
    }

    // Start multiple debates simultaneously
    async startMultipleDebates(topics, agents = ['senatorbot', 'reformerbot']) {
        return this.post('/debates/start-multiple', { topics, agents });
    }

    // Get enhanced metrics for performance dashboard
    async getEnhancedMetrics() {
        return this.get('/metrics/enhanced');
    }

    // Get semantic cache metrics with business value analysis
    async getCacheMetrics() {
        return this.get('/cache/metrics');
    }

    // Get business intelligence summary and ROI analysis
    async getBusinessSummary() {
        return this.get('/business/summary');
    }

    // 🔍 KEY MOMENTS API METHODS

    // Get key moments for a specific debate
    async getKeyMoments(debateId, limit = 10) {
        return this.get(`/debate/${debateId}/key-moments?limit=${limit}`);
    }

    // Get all key moments across debates
    async getAllKeyMoments(limit = 20) {
        return this.get(`/key-moments/all?limit=${limit}`);
    }

    // Manually trigger key moment detection (for testing)
    async triggerKeyMoment(data) {
        return this.post('/debug/key-moment', data);
    }
}

export default new StanceStreamAPI();
