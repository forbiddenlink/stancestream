// Analytics ledger: plain tables of what the stats service reports.
import { useState, useEffect } from 'react';
import api from '../services/api';
import { show, toPercent, assertLiveStats } from '../utils/dashboardMetrics';

async function loadEnhancedMetrics() {
    const [redisStats, cacheResponse] = await Promise.all([
        api.getRedisStats(),
        api.getCacheMetrics().catch(() => ({ metrics: null }))
    ]);

    return { metrics: assertLiveStats(redisStats), cacheMetrics: cacheResponse?.metrics };
}

// Key counts come from the backend key patterns in advancedMetrics.js countKeysByType().
const REDIS_MODULES = [
    { key: 'json', label: 'RedisJSON', unit: 'Keys', note: 'Agent profiles and key moments' },
    { key: 'streams', label: 'Streams', unit: 'Streams', note: 'Debate messages' },
    { key: 'timeseries', label: 'TimeSeries', unit: 'Series', note: 'Stance and sentiment tracking' },
    { key: 'vector', label: 'Vector search', unit: 'Vectors', note: 'Facts and semantic cache' }
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
        return <p className="section-note" role="status">Loading system measurements.</p>;
    }

    if (error) {
        return (
            <div>
                <p className="section-note" role="status">System measurements are not available. {error}</p>
                <button type="button" className="btn-plain" onClick={fetchEnhancedMetrics}>Retry</button>
            </div>
        );
    }

    const cache = cacheMetrics ?? metrics.cache ?? null;
    const hitPercent = toPercent(cache?.hit_ratio);
    const responseMs = metrics.performance?.avgResponseTime;
    const activeModules = metrics.keyCount
        ? REDIS_MODULES.filter(({ key }) => metrics.keyCount[key] > 0).length
        : null;
    const sessions = metrics.debate?.activeDebates ? Object.entries(metrics.debate.activeDebates) : [];

    return (
        <div className="ledger-pane">
            <div className="pane-head">
                <label className="pane-check">
                    <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
                    Auto-refresh
                </label>
                <button type="button" className="btn-plain" onClick={fetchEnhancedMetrics}>Refresh now</button>
            </div>
            <p className="section-note">Read from the stats service. A dash means the server did not send that value.</p>

            <table className="ledger">
                <caption>Debates and server</caption>
                <thead><tr><th scope="col">Measure</th><th scope="col">Value</th><th scope="col">Source</th></tr></thead>
                <tbody>
                    <tr><th scope="row">Concurrent debates</th><td>{show(metrics.debate?.concurrentDebates)}</td><td>Debate engine</td></tr>
                    <tr><th scope="row">Messages generated</th><td>{show(metrics.debate?.messagesGenerated)}</td><td>Debate engine</td></tr>
                    <tr><th scope="row">Fact checks performed</th><td>{show(metrics.debate?.factChecksPerformed)}</td><td>Debate engine</td></tr>
                    <tr><th scope="row">Redis response time</th><td>{show(responseMs, 'ms')}</td><td>Redis INFO query</td></tr>
                    <tr><th scope="row">Memory used</th><td>{show(metrics.performance?.memoryUsed)}</td><td>Redis INFO</td></tr>
                    <tr><th scope="row">Connections</th><td>{show(metrics.performance?.totalConnections)}</td><td>Redis INFO</td></tr>
                    <tr><th scope="row">System status</th><td>{metrics.system?.status ? metrics.system.status : '-'}</td><td>Stats API</td></tr>
                </tbody>
            </table>

            <table className="ledger">
                <caption>Redis data models{activeModules === null ? '' : `: ${activeModules} of 4 hold data`}</caption>
                <thead><tr><th scope="col">Model</th><th scope="col">Count</th><th scope="col">Holds</th><th scope="col">State</th></tr></thead>
                <tbody>
                    {REDIS_MODULES.map(({ key, label, unit, note }) => (
                        <tr key={key}>
                            <th scope="row">{label}</th>
                            <td>{show(metrics.keyCount?.[key])} {unit.toLowerCase()}</td>
                            <td>{note}</td>
                            <td>{metrics.keyCount?.[key] > 0 ? 'Has data' : 'No data'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {cache && (
                <table className="ledger">
                    <caption>Semantic cache</caption>
                    <thead><tr><th scope="col">Measure</th><th scope="col">Value</th><th scope="col">Detail</th></tr></thead>
                    <tbody>
                        <tr><th scope="row">Hit rate</th><td>{show(hitPercent?.toFixed(1), '%')}</td><td>{show(cache.cache_hits)} of {show(cache.total_requests)} requests</td></tr>
                        <tr><th scope="row">Estimated cost saved</th><td>{typeof cache.estimated_cost_saved === 'number' ? `$${cache.estimated_cost_saved.toFixed(3)}` : '-'}</td><td>{show(cache.total_tokens_saved?.toLocaleString())} tokens, from an assumed price</td></tr>
                        <tr><th scope="row">Average similarity</th><td>{typeof cache.average_similarity === 'number' ? `${(cache.average_similarity * 100).toFixed(1)}%` : '-'}</td><td>Vector match quality</td></tr>
                        <tr><th scope="row">Responses stored</th><td>{show(cache.total_cache_entries)}</td><td>Semantic cache entries</td></tr>
                    </tbody>
                </table>
            )}

            {sessions.length > 0 && (
                <table className="ledger">
                    <caption>Active sessions ({sessions.length})</caption>
                    <thead><tr><th scope="col">Session</th><th scope="col">Topic</th><th scope="col">Messages</th><th scope="col">Status</th></tr></thead>
                    <tbody>
                        {sessions.map(([id, info]) => (
                            <tr key={id}>
                                <th scope="row">{id.substring(0, 8)}...</th>
                                <td>{info.topic}</td>
                                <td>{info.messageCount || 0}</td>
                                <td>{info.status || 'Active'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <p className="section-note">Last updated {new Date(metrics.timestamp).toLocaleTimeString()}.</p>
        </div>
    );
}
