/**
 * Enhanced API Endpoints with Metrics and Validation
 * Additional endpoints for improved observability and functionality
 */

import express from 'express';
import { getMetricsHandler } from '../../metrics.js';
import redisManager from '../../redisManager.js';
import { getCachedResponse } from '../../semanticCache.js';
import { validateDebateStart, validateCacheQuery } from '../middleware/validation.js';

const router = express.Router();

/**
 * Prometheus Metrics Endpoint
 * GET /metrics
 * Returns metrics in Prometheus format
 */
router.get('/metrics', getMetricsHandler());

/**
 * Enhanced Detailed Health Check
 * GET /api/health/detailed
 * Returns comprehensive system health information
 */
router.get('/api/health/detailed', async (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {},
        system: {}
    };

    // Redis health
    try {
        const redisHealth = await redisManager.healthCheck();
        health.services.redis = {
            status: redisHealth.status,
            connected: redisHealth.connected,
            version: redisHealth.version || 'unknown',
            memory: redisHealth.memory || 'unknown'
        };
    } catch (error) {
        health.services.redis = {
            status: 'unhealthy',
            error: error.message
        };
        health.status = 'degraded';
    }

    // OpenAI connectivity
    try {
        health.services.openai = {
            status: 'healthy',
            configured: !!process.env.OPENAI_API_KEY
        };
    } catch (error) {
        health.services.openai = {
            status: 'unhealthy',
            error: error.message
        };
    }

    // Memory usage
    const memUsage = process.memoryUsage();
    health.system.memory = {
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
        external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
    };

    health.system.cpu = process.cpuUsage();
    health.system.nodeVersion = process.version;
    health.system.platform = process.platform;

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
});

/**
 * Cache Status Endpoint
 * GET /api/cache/status
 * Returns current cache performance metrics
 */
router.get('/api/cache/status', async (req, res) => {
    try {
        const metrics = await redisManager.execute(async (client) => {
            return await client.json.get('cache:metrics');
        });

        if (!metrics) {
            return res.json({
                status: 'no data',
                message: 'Cache metrics not available yet'
            });
        }

        // Calculate derived metrics
        const derived = {
            hitRatePercentage: (metrics.hit_ratio * 100).toFixed(2) + '%',
            averageSimilarityPercentage: (metrics.average_similarity * 100).toFixed(2) + '%',
            estimatedMonthlySavings: (metrics.estimated_cost_saved * 30 * 24).toFixed(2),
            cachingEfficiency: metrics.cache_hits > 0 ? 'excellent' : 
                               metrics.total_requests > 10 ? 'warming up' : 'initializing'
        };

        res.json({
            ...metrics,
            derived,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch cache status',
            message: error.message
        });
    }
});

/**
 * System Info Endpoint
 * GET /api/system/info
 * Returns system information and configuration
 */
router.get('/api/system/info', (req, res) => {
    res.json({
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
        pid: process.pid,
        memory: {
            total: Math.round(require('os').totalmem() / 1024 / 1024) + 'MB',
            free: Math.round(require('os').freemem() / 1024 / 1024) + 'MB'
        },
        cpus: require('os').cpus().length,
        features: {
            metricsEnabled: true,
            validationEnabled: true,
            semanticCaching: true,
            realTimeUpdates: true
        }
    });
});

export default router;
