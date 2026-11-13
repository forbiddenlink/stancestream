// Enhanced Performance Dashboard - Real-Time Analytics
import { useState, useEffect } from 'react';
import api from '../services/api';
import Icon from './Icon';
import { show, toPercent, assertLiveStats } from '../utils/dashboardMetrics';
import {
    Card,
    CardHeader,
    CardContent,
    MetricCard,
    StatusCard,
    LoadingCard,
    Container,
    Grid,
    Stack,
    Spinner,
    ProgressBar,
    StatusBadge,
    DataTable
} from './ui';

async function loadEnhancedMetrics() {
    const [redisStats, cacheResponse] = await Promise.all([
        api.getRedisStats(),
        api.getCacheMetrics().catch(() => ({ metrics: null }))
    ]);

    return { metrics: assertLiveStats(redisStats), cacheMetrics: cacheResponse?.metrics };
}

// Key counts come from the backend key patterns in advancedMetrics.js countKeysByType().
const REDIS_MODULES = [
    { key: 'json', label: 'RedisJSON', unit: 'Keys', note: 'Agent profiles and key moments', dot: 'bg-blue-500' },
    { key: 'streams', label: 'Streams', unit: 'Streams', note: 'Real-time debate messaging', dot: 'bg-blue-400' },
    { key: 'timeseries', label: 'TimeSeries', unit: 'Series', note: 'Stance and sentiment tracking', dot: 'bg-blue-300' },
    { key: 'vector', label: 'Vector search', unit: 'Vectors', note: 'Facts and semantic cache', dot: 'bg-blue-600' }
];

export default function EnhancedPerformanceDashboard() {
    const [metrics, setMetrics] = useState(null);
    const [cacheMetrics, setCacheMetrics] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [error, setError] = useState(null);

    const fetchEnhancedMetrics = () => loadEnhancedMetrics().then(result => {
        setError(null);
        setMetrics(result.metrics);
        if (result.cacheMetrics) setCacheMetrics(result.cacheMetrics);
        setIsLoading(false);
    }).catch(() => {
        setError('The stats service did not return live data.');
        setIsLoading(false);
    });

    useEffect(() => {
        fetchEnhancedMetrics();

        let interval;
        if (autoRefresh) {
            // Contest demo mode: Faster updates for better showcase
            interval = setInterval(fetchEnhancedMetrics, 3000);
            
            // Schedule a slower refresh after 5 minutes to conserve resources
            const slowdownTimeout = setTimeout(() => {
                clearInterval(interval);
                interval = setInterval(fetchEnhancedMetrics, 10000);
            }, 5 * 60 * 1000);
            
            return () => {
                clearInterval(interval);
                clearTimeout(slowdownTimeout);
            };
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [autoRefresh]);

    if (isLoading) {
        return (
            <LoadingCard
                title="Loading Enhanced Metrics"
                subtitle="Analyzing Redis multi-modal performance..."
                icon="activity"
                className="min-h-40"
            />
        );
    }

    if (error) {
        return (
            <Card className="border-red-500/30 bg-gradient-to-br from-red-900/20 to-red-800/20">
                <CardContent className="text-center p-8">
                    <Icon name="alert-circle" size={32} className="text-red-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-red-300 mb-2">Metrics unavailable</h3>
                    <p className="text-slate-400 mb-4">{error}</p>
                    <button
                        onClick={fetchEnhancedMetrics}
                        className="btn-danger"
                    >
                        <Icon name="refresh-cw" size={16} />
                        Retry
                    </button>
                </CardContent>
            </Card>
        );
    }

    const cache = cacheMetrics ?? metrics.cache ?? null;
    const hitPercent = toPercent(cache?.hit_ratio);
    const responseMs = metrics.performance?.avgResponseTime;
    const activeModules = metrics.keyCount
        ? REDIS_MODULES.filter(({ key }) => metrics.keyCount[key] > 0).length
        : null;

    return (
        <Card className="border-green-500/30 bg-gradient-to-br from-black/90 to-gray-900/90 shadow-lg shadow-green-500/10">
            <CardHeader className="border-b border-green-500/30">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/30 flex items-center justify-center">
                            <Icon name="activity" size={24} className="text-green-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-green-300 font-mono">System analytics dashboard</h2>
                            <p className="text-green-400 text-sm font-mono">Real-time Redis multi-modal performance</p>
                        </div>
                        <StatusBadge status="success" label="Live" className="ml-auto" />
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2 text-sm text-green-400 font-mono">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span>Real-time monitoring</span>
                        </div>
                        <label className="flex items-center space-x-2 text-sm text-green-400 font-mono">
                            <input
                                type="checkbox"
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh(e.target.checked)}
                                className="w-4 h-4 rounded border-green-600 text-green-500 focus:ring-green-500/20 bg-black/60"
                            />
                            <span>Auto-refresh</span>
                        </label>
                        <button
                            onClick={fetchEnhancedMetrics}
                            className="btn-ghost w-10 h-10 p-0 border border-green-500/30 rounded hover:bg-green-900/20"
                            title="Refresh metrics"
                        >
                            <Icon name="refresh-cw" size={18} className={isLoading ? "animate-spin text-green-400" : "text-green-400"} />
                        </button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-6">
                {/* Main Metrics Grid - Enhanced with Professional Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
                    <MetricCard
                        title="Active Sessions"
                        value={show(metrics.debate?.concurrentDebates)}
                        subtitle="Concurrent debates"
                        icon="users"
                        color="purple"
                    />

                    <MetricCard
                        title="Messages"
                        value={show(metrics.debate?.messagesGenerated)}
                        subtitle="Total generated"
                        icon="message-circle"
                        color="green"
                    />

                    <MetricCard
                        title="Fact Checks"
                        value={show(metrics.debate?.factChecksPerformed)}
                        subtitle="Total performed"
                        icon="shield-check"
                        color="blue"
                    />

                    <MetricCard
                        title="Response Time"
                        value={show(responseMs, 'ms')}
                        subtitle="Redis INFO query"
                        icon="zap"
                        color="cyan"
                    />

                    <MetricCard
                        title="Memory Usage"
                        value={show(metrics.performance?.memoryUsed)}
                        subtitle={`${show(metrics.performance?.totalConnections)} connections`}
                        icon="cpu"
                        color="green"
                    />

                    <MetricCard
                        title="System Status"
                        value={metrics.system?.status ? metrics.system.status : '-'}
                        subtitle="Stats API"
                        icon="check-circle"
                        color="violet"
                    />
                </div>

                {/* Redis Multi-Modal Usage - CONTEST SHOWCASE */}
                <div className="mb-4">
                    <h3 className="text-sm font-bold text-green-300 mb-3 flex items-center gap-2 font-mono">
                        <Icon name="database" size={18} className="mr-2 text-green-400" />
                        Redis multi-modal architecture
                        <span className="text-xs bg-green-500/20 px-2 py-1 rounded-full border border-green-500/30 font-mono">
                            Contest showcase
                        </span>
                        {metrics.benchmark?.multiModalScore && (
                            <>
                                <span className={`text-xs px-2 py-1 rounded-full border font-mono ${metrics.benchmark.multiModalScore.score === 100
                                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                    : 'bg-green-400/20 text-green-300 border-green-400/30'
                                    }`}>
                                    {metrics.benchmark.multiModalScore.rating}
                                </span>
                                <span className="text-xs bg-blue-500/20 px-2 py-1 rounded-full text-blue-400 border border-blue-500/30 font-mono">
                                    Redis challenge
                                </span>
                            </>
                        )}
                    </h3>
                    {/* Contest-Focused Real-Time Metrics */}
                    <div className="mb-4 p-3 bg-blue-600/10 border border-blue-500/30 rounded-lg shadow-lg">
                        <div className="text-center">
                            <div className="text-xs text-blue-400 font-mono mb-1">Module usage</div>
                            <div className="text-2xl font-bold text-blue-300 font-mono">
                                {activeModules === null ? '-' : `${activeModules}/4`} <span className="text-xs">With data</span>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {REDIS_MODULES.map(({ key, label, unit, note, dot }) => (
                            <div key={key} className="bg-gradient-to-br from-green-600/10 to-blue-600/10 border border-blue-500/30 rounded-lg p-4 shadow-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 ${dot} rounded-full`}></div>
                                        <span className="text-sm font-bold text-blue-300 font-mono">{label}</span>
                                    </div>
                                    <span className="text-xs bg-blue-500/20 px-2 py-0.5 rounded text-blue-400 border border-blue-500/30 font-mono">
                                        {metrics.keyCount?.[key] > 0 ? 'Active' : 'No data'}
                                    </span>
                                </div>
                                <div className="text-xl font-bold text-blue-200 font-mono flex items-end gap-2">
                                    {show(metrics.keyCount?.[key])}
                                    <span className="text-xs text-blue-400">{unit}</span>
                                </div>
                                <div className="text-xs text-blue-400 font-mono mt-2">{note}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Semantic Cache Performance - SHOWCASE FEATURE */}
                {cache && (
                    <div className="mb-4">
                        <h3 className="text-sm font-bold text-green-300 mb-3 flex items-center gap-2 font-mono">
                            <Icon name="zap" size={18} className="mr-2 text-green-400" />
                            Semantic cache performance
                            <span className="text-xs bg-green-500/20 px-2 py-1 rounded-full text-green-400 border border-green-500/30 font-mono">
                                Innovation showcase
                            </span>
                            {hitPercent > 70 && (
                                <span className="text-xs bg-green-500/20 px-2 py-1 rounded-full text-green-400 border border-green-500/30 font-mono">
                                    High efficiency
                                </span>
                            )}
                        </h3>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Cache Hit Rate */}
                            <div className="bg-green-600/10 border border-green-500/30 rounded-lg p-4 shadow-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon name="target" size={16} className="text-green-400" />
                                    <span className="text-sm font-bold text-green-300 font-mono">Hit rate</span>
                                </div>
                                <div className="text-2xl font-bold text-green-200 font-mono">
                                    {show(hitPercent?.toFixed(1), '%')}
                                </div>
                                <div className="text-xs text-green-400 font-mono">
                                    {show(cache.cache_hits)}/{show(cache.total_requests)} requests
                                </div>
                                <div className="text-xs text-green-400 font-mono">AI response caching</div>
                            </div>

                            {/* Cost Savings */}
                            <div className="bg-green-600/10 border border-green-500/30 rounded-lg p-4 shadow-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon name="dollar-sign" size={16} className="text-green-400" />
                                    <span className="text-sm font-bold text-green-300 font-mono">Cost saved</span>
                                </div>
                                <div className="text-2xl font-bold text-green-200 font-mono">
                                    {typeof cache.estimated_cost_saved === 'number' ? `$${cache.estimated_cost_saved.toFixed(3)}` : '-'}
                                </div>
                                <div className="text-xs text-green-400 font-mono">
                                    {show(cache.total_tokens_saved?.toLocaleString())} tokens saved
                                </div>
                                <div className="text-xs text-green-400 font-mono">OpenAI API savings</div>
                            </div>

                            {/* Cache Efficiency */}
                            <div className="bg-green-600/10 border border-green-500/30 rounded-lg p-4 shadow-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon name="activity" size={16} className="text-green-400" />
                                    <span className="text-sm font-bold text-green-300 font-mono">Similarity</span>
                                </div>
                                <div className="text-2xl font-bold text-green-200 font-mono">
                                    {typeof cache.average_similarity === 'number' ? `${(cache.average_similarity * 100).toFixed(1)}%` : '-'}
                                </div>
                                <div className="text-xs text-green-400 font-mono">Average match quality</div>
                                <div className="text-xs text-green-400 font-mono">Vector similarity</div>
                            </div>

                            {/* Cache Entries */}
                            <div className="bg-green-600/10 border border-green-500/30 rounded-lg p-4 shadow-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon name="database" size={16} className="text-green-400" />
                                    <span className="text-sm font-bold text-green-300 font-mono">Cached</span>
                                </div>
                                <div className="text-2xl font-bold text-green-200 font-mono">
                                    {show(cache.total_cache_entries)}
                                </div>
                                <div className="text-xs text-green-400 font-mono">Responses stored</div>
                                <div className="text-xs text-green-400 font-mono">Semantic vectors</div>
                            </div>
                        </div>

                        {/* Cache Performance Indicator */}
                        <div className="mt-3 p-3 bg-green-600/10 border border-green-500/30 rounded-lg shadow-lg">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Icon name="trending-up" size={16} className="text-green-400" />
                                    <span className="text-sm font-bold text-green-300 font-mono">
                                        Cache efficiency: {show(hitPercent?.toFixed(1), '%')}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-2 flex items-center justify-between text-xs">
                                <span className="text-green-400 font-mono">
                                    Semantic caching reducing API dependencies
                                </span>
                                {hitPercent !== null && (
                                    <span className={`px-2 py-1 rounded-full border font-mono ${hitPercent > 70
                                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                        : hitPercent > 50
                                            ? 'bg-green-400/20 text-green-300 border-green-400/30'
                                            : 'bg-green-300/20 text-green-200 border-green-300/30'
                                        }`}>
                                        {hitPercent > 70 ? 'Excellent' : hitPercent > 50 ? 'Good' : 'Building'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Business Performance Indicators */}
                {metrics.benchmark && (
                    <div className="border-t border-green-500/30 pt-4">
                        <h3 className="text-sm font-bold text-green-300 mb-3 flex items-center gap-2 font-mono">
                            💼 Business performance metrics
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="bg-green-600/10 border border-green-500/30 rounded-lg p-4 shadow-lg">
                                <div className="text-lg font-bold text-green-300 font-mono">
                                    {show(metrics.benchmark.multiModalScore?.score, '%')}
                                </div>
                                <div className="text-sm text-green-200 font-mono">Architecture efficiency</div>
                                <div className="text-xs text-green-400 font-mono">
                                    {show(metrics.benchmark.multiModalScore?.activeModules)}/4 DATA MODELS ACTIVE
                                </div>
                            </div>
                            <div className="bg-green-600/10 border border-green-500/30 rounded-lg p-4 shadow-lg">
                                <div className="text-lg font-bold text-green-300 font-mono">
                                    {show(responseMs, 'MS')}
                                </div>
                                <div className="text-sm text-green-200 font-mono">Response time</div>
                                <div className="text-xs text-green-400 font-mono">Redis info query</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Active Sessions Monitor */}
                {metrics.debate?.activeDebates && Object.keys(metrics.debate.activeDebates).length > 0 && (
                    <div className="border-t border-green-500/30 pt-4 mt-4">
                        <h3 className="text-sm font-bold text-green-300 mb-3 flex items-center gap-2 font-mono">
                            <Icon name="activity" size={14} className="text-green-400" />
                            Active sessions monitor
                            <span className="text-xs bg-green-500/20 px-2 py-1 rounded-full text-green-400 border border-green-500/30 font-mono">
                                {Object.keys(metrics.debate.activeDebates).length} sessions
                            </span>
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            {Object.entries(metrics.debate.activeDebates).map(([id, info]) => (
                                <div
                                    key={id}
                                    className="bg-green-600/10 border border-green-500/30 rounded-lg p-3 shadow-lg"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-sm font-bold text-green-300 flex items-center gap-2 font-mono">
                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                            Session {id.substring(0, 8)}...
                                        </div>
                                        <span className="text-xs bg-green-500/20 px-2 py-1 rounded text-green-400 border border-green-500/30 font-mono">
                                            {info.status || 'Active'}
                                        </span>
                                    </div>
                                    <div className="text-xs text-green-400 space-y-1 font-mono">
                                        <div>📋 topic: {info.topic}</div>
                                        <div className="flex items-center justify-between">
                                            <span>💬 {info.messageCount || 0} messages</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Metric Update Info */}
                <div className="text-xs text-blue-400 text-center mt-6 font-mono">
                    Last updated: {new Date(metrics.timestamp).toLocaleTimeString()} •
                    [LIVE DATA] •
                    Redis challenge analytics 🏆
                </div>
            </CardContent>
        </Card>
    );
}
