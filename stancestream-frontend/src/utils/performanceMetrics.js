export function normalizePerformanceMetrics(performance) {
    return {
        responseTime: performance?.average_response_time ?? null,
        operationsPerSec: performance?.redis_ops_per_second ?? null,
        redisOpsPerMin: performance?.redis_ops_per_minute ?? null,
        systemHealth: performance?.uptime_percentage ?? null
    };
}
