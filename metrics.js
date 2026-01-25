/**
 * Production-Ready Metrics System
 * Prometheus-compatible metrics for monitoring StanceStream performance
 * 
 * Quick Start:
 * 1. pnpm add prom-client
 * 2. Import this file in server.js
 * 3. Add app.get('/metrics', getMetricsHandler())
 * 4. View at http://localhost:3001/metrics
 */

import { register, Counter, Histogram, Gauge, Summary } from 'prom-client';

// Enable default system metrics (CPU, memory, etc.)
import { collectDefaultMetrics } from 'prom-client';
collectDefaultMetrics({ 
    prefix: 'stancestream_',
    gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5]
});

// ============================================
// HTTP METRICS
// ============================================

export const httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10] // seconds
});

export const httpRequestTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code']
});

export const httpRequestSizeBytes = new Summary({
    name: 'http_request_size_bytes',
    help: 'HTTP request size in bytes',
    labelNames: ['method', 'route']
});

export const httpResponseSizeBytes = new Summary({
    name: 'http_response_size_bytes',
    help: 'HTTP response size in bytes',
    labelNames: ['method', 'route', 'status_code']
});

// ============================================
// SEMANTIC CACHE METRICS (PRIMARY SHOWCASE)
// ============================================

export const cacheHitsTotal = new Counter({
    name: 'semantic_cache_hits_total',
    help: 'Total number of semantic cache hits',
    labelNames: ['agent_id', 'topic']
});

export const cacheMissesTotal = new Counter({
    name: 'semantic_cache_misses_total',
    help: 'Total number of semantic cache misses',
    labelNames: ['agent_id', 'topic']
});

export const cacheHitRate = new Gauge({
    name: 'semantic_cache_hit_rate',
    help: 'Current cache hit rate percentage (0-100)'
});

export const cacheSimilarityScore = new Histogram({
    name: 'semantic_cache_similarity_score',
    help: 'Distribution of cache hit similarity scores',
    buckets: [0.85, 0.87, 0.90, 0.92, 0.95, 0.97, 0.99, 1.0]
});

export const cacheResponseTime = new Histogram({
    name: 'semantic_cache_response_time_seconds',
    help: 'Time to retrieve cached response',
    labelNames: ['hit'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5]
});

export const cacheSize = new Gauge({
    name: 'semantic_cache_entries_total',
    help: 'Total number of entries in semantic cache'
});

export const cacheCostSavings = new Counter({
    name: 'semantic_cache_cost_savings_dollars',
    help: 'Total cost savings from cache hits in USD'
});

// ============================================
// OPENAI API METRICS
// ============================================

export const openaiRequestDuration = new Histogram({
    name: 'openai_request_duration_seconds',
    help: 'Duration of OpenAI API requests',
    labelNames: ['model', 'success'],
    buckets: [0.5, 1, 2, 3, 5, 10, 15, 30, 60]
});

export const openaiRequestTotal = new Counter({
    name: 'openai_requests_total',
    help: 'Total number of OpenAI API requests',
    labelNames: ['model', 'type', 'success']
});

export const openaiTokensUsed = new Counter({
    name: 'openai_tokens_used_total',
    help: 'Total OpenAI tokens consumed',
    labelNames: ['model', 'type'] // type: input, output, embedding
});

export const openaiCostTotal = new Counter({
    name: 'openai_cost_dollars_total',
    help: 'Total OpenAI API cost in USD',
    labelNames: ['model']
});

export const openaiErrorsTotal = new Counter({
    name: 'openai_errors_total',
    help: 'Total OpenAI API errors',
    labelNames: ['model', 'error_type']
});

// ============================================
// REDIS METRICS
// ============================================

export const redisOperationDuration = new Histogram({
    name: 'redis_operation_duration_seconds',
    help: 'Duration of Redis operations',
    labelNames: ['operation', 'command', 'success'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1]
});

export const redisOperationsTotal = new Counter({
    name: 'redis_operations_total',
    help: 'Total number of Redis operations',
    labelNames: ['operation', 'command', 'success']
});

export const redisConnectionsActive = new Gauge({
    name: 'redis_connections_active',
    help: 'Number of active Redis connections'
});

export const redisCommandQueueSize = new Gauge({
    name: 'redis_command_queue_size',
    help: 'Number of commands waiting in Redis queue'
});

// ============================================
// WEBSOCKET METRICS
// ============================================

export const websocketConnectionsActive = new Gauge({
    name: 'websocket_connections_active',
    help: 'Number of active WebSocket connections'
});

export const websocketMessagesTotal = new Counter({
    name: 'websocket_messages_total',
    help: 'Total WebSocket messages sent',
    labelNames: ['type']
});

export const websocketConnectionDuration = new Histogram({
    name: 'websocket_connection_duration_seconds',
    help: 'Duration of WebSocket connections',
    buckets: [10, 30, 60, 300, 600, 1800, 3600]
});

export const websocketErrorsTotal = new Counter({
    name: 'websocket_errors_total',
    help: 'Total WebSocket errors',
    labelNames: ['error_type']
});

// ============================================
// DEBATE METRICS
// ============================================

export const activeDebatesGauge = new Gauge({
    name: 'active_debates_total',
    help: 'Number of currently active debates'
});

export const debateMessagesTotal = new Counter({
    name: 'debate_messages_total',
    help: 'Total debate messages generated',
    labelNames: ['agent_id', 'debate_id']
});

export const debateDuration = new Histogram({
    name: 'debate_duration_seconds',
    help: 'Duration of completed debates',
    labelNames: ['topic'],
    buckets: [60, 120, 300, 600, 900, 1800, 3600]
});

export const debateStanceShifts = new Counter({
    name: 'debate_stance_shifts_total',
    help: 'Total number of stance position changes',
    labelNames: ['agent_id', 'topic']
});

// ============================================
// FACT CHECKING METRICS
// ============================================

export const factChecksTotal = new Counter({
    name: 'fact_checks_total',
    help: 'Total number of fact checks performed',
    labelNames: ['agent_id', 'verified']
});

export const factCheckScore = new Histogram({
    name: 'fact_check_score',
    help: 'Distribution of fact check scores',
    buckets: [0.1, 0.3, 0.5, 0.7, 0.8, 0.9, 0.95, 1.0]
});

export const factCheckDuration = new Histogram({
    name: 'fact_check_duration_seconds',
    help: 'Time to complete fact check',
    buckets: [0.1, 0.5, 1, 2, 5, 10]
});

// ============================================
// APPLICATION METRICS
// ============================================

export const applicationErrors = new Counter({
    name: 'application_errors_total',
    help: 'Total application errors',
    labelNames: ['type', 'severity']
});

export const agentResponseQuality = new Histogram({
    name: 'agent_response_quality_score',
    help: 'Quality score of agent responses',
    labelNames: ['agent_id'],
    buckets: [0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 1.0]
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Track HTTP request metrics
 * Usage: const end = trackHttpRequest(req); res.on('finish', () => end(res));
 */
export function trackHttpRequest(req) {
    const start = Date.now();
    
    return (res) => {
        const duration = (Date.now() - start) / 1000;
        const route = req.route?.path || req.path;
        
        httpRequestDuration.observe({
            method: req.method,
            route: route,
            status_code: res.statusCode
        }, duration);
        
        httpRequestTotal.inc({
            method: req.method,
            route: route,
            status_code: res.statusCode
        });
        
        // Track request/response sizes if available
        if (req.headers['content-length']) {
            httpRequestSizeBytes.observe({
                method: req.method,
                route: route
            }, parseInt(req.headers['content-length']));
        }
        
        if (res.get('content-length')) {
            httpResponseSizeBytes.observe({
                method: req.method,
                route: route,
                status_code: res.statusCode
            }, parseInt(res.get('content-length')));
        }
    };
}

/**
 * Track OpenAI API call
 * Usage: await trackOpenAICall('gpt-4o-mini', async () => { ... })
 */
export async function trackOpenAICall(model, operation, type = 'completion') {
    const start = Date.now();
    let success = false;
    
    try {
        const result = await operation();
        success = true;
        
        const duration = (Date.now() - start) / 1000;
        
        openaiRequestDuration.observe({
            model,
            success: 'true'
        }, duration);
        
        openaiRequestTotal.inc({
            model,
            type,
            success: 'true'
        });
        
        // Track token usage if available
        if (result.usage) {
            openaiTokensUsed.inc({
                model,
                type: 'input'
            }, result.usage.prompt_tokens || 0);
            
            openaiTokensUsed.inc({
                model,
                type: 'output'
            }, result.usage.completion_tokens || 0);
            
            // Estimate cost (update rates as needed)
            const inputCost = (result.usage.prompt_tokens || 0) * 0.15 / 1000000;
            const outputCost = (result.usage.completion_tokens || 0) * 0.60 / 1000000;
            const totalCost = inputCost + outputCost;
            
            openaiCostTotal.inc({ model }, totalCost);
        }
        
        return result;
    } catch (error) {
        openaiRequestTotal.inc({
            model,
            type,
            success: 'false'
        });
        
        openaiErrorsTotal.inc({
            model,
            error_type: error.code || 'unknown'
        });
        
        throw error;
    }
}

/**
 * Track Redis operation
 * Usage: await trackRedisOperation('get', 'key', async () => { ... })
 */
export async function trackRedisOperation(operation, command, fn) {
    const start = Date.now();
    let success = false;
    
    try {
        const result = await fn();
        success = true;
        
        const duration = (Date.now() - start) / 1000;
        
        redisOperationDuration.observe({
            operation,
            command,
            success: 'true'
        }, duration);
        
        redisOperationsTotal.inc({
            operation,
            command,
            success: 'true'
        });
        
        return result;
    } catch (error) {
        redisOperationsTotal.inc({
            operation,
            command,
            success: 'false'
        });
        
        throw error;
    }
}

/**
 * Track cache operation
 * Usage: trackCacheOperation(true, 0.92, 'senatorbot', 'climate_policy', 0.002)
 */
export function trackCacheOperation(hit, similarity = null, agentId = null, topic = null, costSaved = 0) {
    const labels = {
        agent_id: agentId || 'unknown',
        topic: topic || 'general'
    };
    
    if (hit) {
        cacheHitsTotal.inc(labels);
        
        if (similarity !== null) {
            cacheSimilarityScore.observe(similarity);
        }
        
        if (costSaved > 0) {
            cacheCostSavings.inc(costSaved);
        }
    } else {
        cacheMissesTotal.inc(labels);
    }
}

/**
 * Update cache hit rate
 * Should be called periodically (e.g., after each cache check)
 */
export async function updateCacheHitRate(totalRequests, cacheHits) {
    if (totalRequests > 0) {
        const hitRate = (cacheHits / totalRequests) * 100;
        cacheHitRate.set(hitRate);
    }
}

/**
 * Track application error
 * Usage: trackError(error, 'redis_connection', 'critical')
 */
export function trackError(error, type = 'unknown', severity = 'error') {
    applicationErrors.inc({
        type,
        severity
    });
}

/**
 * Metrics endpoint handler
 * Usage: app.get('/metrics', getMetricsHandler())
 */
export function getMetricsHandler() {
    return async (req, res) => {
        try {
            res.set('Content-Type', register.contentType);
            const metrics = await register.metrics();
            res.end(metrics);
        } catch (error) {
            res.status(500).end(error.message);
        }
    };
}

/**
 * Reset all metrics (useful for testing)
 */
export function resetMetrics() {
    register.clear();
}

/**
 * Get current metric values (for debugging)
 */
export async function getMetricsSummary() {
    const metrics = await register.getMetricsAsJSON();
    return metrics.reduce((acc, metric) => {
        acc[metric.name] = metric.values;
        return acc;
    }, {});
}

// Export register for advanced usage
export { register };

export default {
    // HTTP
    httpRequestDuration,
    httpRequestTotal,
    trackHttpRequest,
    
    // Cache
    cacheHitsTotal,
    cacheMissesTotal,
    cacheHitRate,
    trackCacheOperation,
    updateCacheHitRate,
    
    // OpenAI
    openaiRequestDuration,
    openaiTokensUsed,
    openaiCostTotal,
    trackOpenAICall,
    
    // Redis
    redisOperationDuration,
    trackRedisOperation,
    
    // WebSocket
    websocketConnectionsActive,
    websocketMessagesTotal,
    
    // Debate
    activeDebatesGauge,
    debateMessagesTotal,
    
    // Utilities
    getMetricsHandler,
    trackError,
    getMetricsSummary
};
