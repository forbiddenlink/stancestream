// Platform view: a plain reference of the four Redis data models, plus the server's own readings.
import { useState, useEffect, memo, useCallback } from 'react';

const PlatformShowcaseDashboard = memo(function PlatformShowcaseDashboard() {
    const [showcaseData, setShowcaseData] = useState(null);
    const [_systemMetrics, _setSystemMetrics] = useState(null);
    const [platformMetrics, setPlatformMetrics] = useState(null);
    const [optimizationMetrics, setOptimizationMetrics] = useState(null);
    const [demoRunning, setDemoRunning] = useState(false);
    const [demoResults, setDemoResults] = useState({});
    const [activeDemo, setActiveDemo] = useState(null);

    // Fetch showcase data every 5 seconds
    const fetchShowcaseData = useCallback(async () => {
        try {
            // Get Redis modules showcase
            const showcaseResponse = await fetch('/api/showcase/redis-modules');
            if (showcaseResponse.ok) {
                const data = await showcaseResponse.json();
                setShowcaseData(data);
            }

            // Get platform metrics
            const metricsResponse = await fetch('/api/analytics/platform-metrics');
            if (metricsResponse.ok) {
                const metrics = await metricsResponse.json();
                setPlatformMetrics(metrics);
            }

            // Get optimization metrics
            const optimizationResponse = await fetch('/api/optimization/metrics');
            if (optimizationResponse.ok) {
                const optimization = await optimizationResponse.json();
                setOptimizationMetrics(optimization);
            }

        } catch (error) {
            console.error('Failed to fetch showcase data:', error);
        }
    }, []);

    useEffect(() => {
        fetchShowcaseData();
        // Automatic polling disabled to reduce server load
        // const interval = setInterval(fetchShowcaseData, 15000);
        // return () => clearInterval(interval);

        // Only update on manual interaction
        return () => { }; // No cleanup needed
    }, [fetchShowcaseData]);

    // Run demonstration scenario
    const runDemo = useCallback(async (scenario) => {
        setDemoRunning(true);
        setActiveDemo(scenario);

        try {
            const response = await fetch(`/api/platform/demo/${scenario}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ duration: 15, agents: ['senatorbot', 'reformerbot'] })
            });

            if (response.ok) {
                const result = await response.json();
                setDemoResults(prev => ({
                    ...prev,
                    [scenario]: result
                }));
            }
        } catch (error) {
            console.error(`Demo ${scenario} failed:`, error);
            setDemoResults(prev => ({
                ...prev,
                [scenario]: { success: false, error: error.message }
            }));
        } finally {
            setDemoRunning(false);
            setActiveDemo(null);
        }
    }, []);

    const MODELS = [
        { key: 'redisJSON', count: 'json', label: 'RedisJSON', holds: 'Agent profiles and cache metrics', fallback: 'agent:{id}:profile' },
        { key: 'redisStreams', count: 'streams', label: 'Streams', holds: 'Debate messages and agent memory', fallback: 'debate:{id}:messages' },
        { key: 'redisTimeSeries', count: 'timeseries', label: 'TimeSeries', holds: 'Stance over time', fallback: 'debate:{id}:agent:{agent}:stance:{topic_key}' },
        { key: 'redisVector', count: 'vector', label: 'Vector search', holds: 'Fact store and semantic cache', fallback: null },
    ];
    const dash = (v) => (v === undefined || v === null ? '-' : v);
    const stats = platformMetrics?.platformMetrics;
    const opt = optimizationMetrics?.optimization;
    const DEMOS = [
        { id: 'multi-modal-showcase', title: 'Multi-modal showcase', description: 'Uses all 4 Redis models in sequence.' },
        { id: 'performance-stress-test', title: 'Performance stress test', description: 'A high-throughput run of Redis operations.' },
        { id: 'concurrent-debates', title: 'Concurrent debates', description: 'Several debates at once.' },
        { id: 'cache-efficiency', title: 'Cache efficiency', description: 'Exercises the semantic cache.' },
    ];

    return (
        <section className="view-pane ledger-pane" aria-labelledby="plat-title">
            <h2 id="plat-title" className="pane-title">Platform reference</h2>
            <p className="section-note">
                The four Redis data models StanceStream uses, and where each one lives. Counts and
                operations come from the server when it answers; a dash means it did not.
            </p>

            <table className="ledger">
                <caption>Redis data models</caption>
                <thead>
                    <tr><th scope="col">Model</th><th scope="col">Holds</th><th scope="col">Key pattern</th><th scope="col">Keys</th><th scope="col">Operations</th></tr>
                </thead>
                <tbody>
                    {MODELS.map((m) => {
                        const info = showcaseData?.showcase?.[m.key];
                        return (
                            <tr key={m.key}>
                                <th scope="row">{m.label}</th>
                                <td>{m.holds}</td>
                                <td><code>{info?.keyPattern ?? m.fallback ?? '-'}</code></td>
                                <td>{dash(showcaseData?.summary?.activeKeys?.[m.count])}</td>
                                <td>{info?.operations?.length ? info.operations.join(', ') : '-'}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <table className="ledger">
                <caption>Server readings</caption>
                <thead><tr><th scope="col">Measure</th><th scope="col">Value</th></tr></thead>
                <tbody>
                    <tr><th scope="row">Active debates</th><td>{dash(stats?.debateStatistics?.activeDebates)}</td></tr>
                    <tr><th scope="row">Total messages</th><td>{dash(stats?.debateStatistics?.totalMessages)}</td></tr>
                    <tr><th scope="row">Cache hit rate</th><td>{stats?.semanticCache?.hit_ratio === undefined ? '-' : `${stats.semanticCache.hit_ratio}%`}</td></tr>
                    <tr><th scope="row">Uptime</th><td>{typeof stats?.systemHealth?.uptime === 'number' ? `${Math.round(stats.systemHealth.uptime / 60)} minutes` : 'Not available'}</td></tr>
                    <tr><th scope="row">Redis models holding data</th><td>{showcaseData?.summary?.totalModules === undefined ? '-' : `${showcaseData.summary.totalModules} of 4`}</td></tr>
                    <tr><th scope="row">Optimizer status</th><td>{opt?.status ?? 'Not available'}</td></tr>
                    <tr><th scope="row">Optimizer cycles</th><td>{dash(opt?.total_optimizations)}</td></tr>
                    <tr><th scope="row">Average improvement per cycle</th><td>{typeof opt?.average_improvement === 'number' ? `${opt.average_improvement.toFixed(1)}%` : '-'}</td></tr>
                    <tr><th scope="row">Last optimization</th><td>{opt?.last_optimization ? new Date(opt.last_optimization).toLocaleTimeString() : 'Pending'}</td></tr>
                </tbody>
            </table>

            <h3 className="pane-sub">Server demo runs</h3>
            <p className="section-note">Each run asks the server to exercise Redis for a short time and reports the operation count it saw.</p>
            <ul className="demo-list">
                {DEMOS.map((demo) => (
                    <li key={demo.id}>
                        <div>
                            <p className="demo-title">{demo.title}</p>
                            <p className="demo-desc">{demo.description}</p>
                            {demoResults[demo.id] && (
                                <p role="status">
                                    {demoResults[demo.id].success
                                        ? `Finished. ${demoResults[demo.id].result?.metrics?.totalOperations || 0} operations.`
                                        : `Failed: ${demoResults[demo.id].error}`}
                                </p>
                            )}
                        </div>
                        <button type="button" className="btn-plain" onClick={() => runDemo(demo.id)} disabled={demoRunning}>
                            {demoRunning && activeDemo === demo.id ? 'Running' : 'Run demo'}
                        </button>
                    </li>
                ))}
            </ul>
        </section>
    );
});

export default PlatformShowcaseDashboard;
