// System Showcase Dashboard - Premium Analytics and Demonstrations
import { useState, useEffect, memo, useCallback } from 'react';
import Icon from './Icon';

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

    return (
        <div className="min-h-screen bg-black text-green-300 p-6 relative font-mono">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <Icon name="award" className="w-8 h-8 text-green-400" />
                    <h1 className="text-4xl font-bold text-green-400">
                        Redis AI challenge showcase
                    </h1>
                </div>
                <p className="text-xl text-green-300">
                    Real-time demonstration of StanceStream's multi-modal Redis architecture
                </p>
            </div>

            {/* Platform Metrics Overview */}
            {platformMetrics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-green-600/10 border border-green-500/30 rounded-lg p-6 shadow-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <Icon name="database" className="w-6 h-6 text-green-400" />
                            <span className="text-lg font-bold text-green-300">Active debates</span>
                        </div>
                        <div className="text-3xl font-bold text-green-200">
                            {platformMetrics.platformMetrics?.debateStatistics?.activeDebates || 0}
                        </div>
                        <div className="text-sm text-green-400">Real-time concurrent processing</div>
                    </div>

                    <div className="bg-green-600/10 border border-green-500/30 rounded-lg p-6 shadow-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <Icon name="message-circle" className="w-6 h-6 text-green-400" />
                            <span className="text-lg font-bold text-green-300">Total messages</span>
                        </div>
                        <div className="text-3xl font-bold text-green-200">
                            {platformMetrics.platformMetrics?.debateStatistics?.totalMessages || 0}
                        </div>
                        <div className="text-sm text-green-400">Redis streams throughput</div>
                    </div>

                    <div className="bg-green-600/10 border border-green-500/30 rounded-lg p-6 shadow-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <Icon name="zap" className="w-6 h-6 text-green-400" />
                            <span className="text-lg font-bold text-green-300">Cache hit rate</span>
                        </div>
                        <div className="text-3xl font-bold text-green-200">
                            {platformMetrics.platformMetrics?.semanticCache?.hit_ratio || 0}%
                        </div>
                        <div className="text-sm text-green-400">Semantic vector caching</div>
                    </div>

                    <div className="bg-green-600/10 border border-green-500/30 rounded-lg p-6 shadow-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <Icon name="activity" className="w-6 h-6 text-green-400" />
                            <span className="text-lg font-bold text-green-300">System health</span>
                        </div>
                        <div className="text-3xl font-bold text-green-200">
                            {Math.round((platformMetrics.platformMetrics?.systemHealth?.uptime || 0) / 60)}M
                        </div>
                        <div className="text-sm text-green-400">Uptime & stability</div>
                    </div>
                </div>
            )}

            {/* Redis Multi-Modal Showcase */}
            {showcaseData && (
                <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-green-400">
                        <Icon name="layers" className="w-6 h-6 text-green-400" />
                        Redis multi-modal architecture live demo
                    </h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* RedisJSON */}
                        <div className="bg-green-600/10 border border-green-500/30 rounded-lg p-6 shadow-lg">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <h3 className="text-xl font-bold text-green-300">RedisJSON</h3>
                                <Icon name="file-text" className="w-5 h-5 text-green-400" />
                            </div>
                            <p className="text-sm text-green-400 mb-3">{showcaseData.showcase?.redisJSON?.example}</p>
                            <div className="bg-black/60 rounded-lg p-3 mb-3 border border-green-500/20">
                                <code className="text-xs text-green-400">
                                    Keys: {showcaseData.summary?.activeKeys?.json || 0} |
                                    Pattern: {showcaseData.showcase?.redisJSON?.keyPattern}
                                </code>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {showcaseData.showcase?.redisJSON?.operations?.map((op, i) => (
                                    <span key={i} className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded border border-green-500/30">
                                        {op}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Redis Streams */}
                        <div className="bg-green-600/10 border border-green-500/30 rounded-lg p-6 shadow-lg">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                                <h3 className="text-xl font-bold text-green-300">Redis streams</h3>
                                <Icon name="git-branch" className="w-5 h-5 text-green-400" />
                            </div>
                            <p className="text-sm text-green-400 mb-3">{showcaseData.showcase?.redisStreams?.example}</p>
                            <div className="bg-black/60 rounded-lg p-3 mb-3 border border-green-500/20">
                                <code className="text-xs text-green-400">
                                    Keys: {showcaseData.summary?.activeKeys?.streams || 0} |
                                    Pattern: {showcaseData.showcase?.redisStreams?.keyPattern}
                                </code>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {showcaseData.showcase?.redisStreams?.operations?.map((op, i) => (
                                    <span key={i} className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded border border-green-500/30">
                                        {op}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* RedisTimeSeries */}
                        <div className="bg-green-600/10 border border-green-500/30 rounded-lg p-6 shadow-lg">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-3 h-3 bg-green-300 rounded-full"></div>
                                <h3 className="text-xl font-bold text-green-300">Redistimeseries</h3>
                                <Icon name="trending-up" className="w-5 h-5 text-green-400" />
                            </div>
                            <p className="text-sm text-green-400 mb-3">{showcaseData.showcase?.redisTimeSeries?.example}</p>
                            <div className="bg-black/60 rounded-lg p-3 mb-3 border border-green-500/20">
                                <code className="text-xs text-green-400">
                                    Keys: {showcaseData.summary?.activeKeys?.timeseries || 0} |
                                    Pattern: {showcaseData.showcase?.redisTimeSeries?.keyPattern}
                                </code>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {showcaseData.showcase?.redisTimeSeries?.operations?.map((op, i) => (
                                    <span key={i} className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded border border-green-500/30">
                                        {op}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Redis Vector */}
                        <div className="bg-green-600/10 border border-green-500/30 rounded-lg p-6 shadow-lg">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                                <h3 className="text-xl font-bold text-green-300">Redis vector search</h3>
                                <Icon name="search" className="w-5 h-5 text-green-400" />
                            </div>
                            <p className="text-sm text-green-400 mb-3">{showcaseData.showcase?.redisVector?.example}</p>
                            <div className="bg-black/60 rounded-lg p-3 mb-3 border border-green-500/20">
                                <code className="text-xs text-green-400">
                                    Keys: {showcaseData.summary?.activeKeys?.vector || 0} |
                                    Pattern: {showcaseData.showcase?.redisVector?.keyPattern}
                                </code>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {showcaseData.showcase?.redisVector?.operations?.map((op, i) => (
                                    <span key={i} className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded border border-green-500/30">
                                        {op}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Performance Optimization Dashboard */}
            {optimizationMetrics && (
                <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-green-400">
                        <Icon name="gauge" className="w-6 h-6 text-green-400" />
                        Real-time performance optimization
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-green-600/10 border border-green-500/30 rounded-lg p-6 shadow-lg">
                            <div className="flex items-center gap-3 mb-3">
                                <Icon name="cpu" className="w-5 h-5 text-green-400" />
                                <span className="font-bold text-green-300">Optimization status</span>
                            </div>
                            <div className="text-2xl font-bold text-green-200 mb-2">
                                {(optimizationMetrics.optimization?.status || 'Offline')}
                            </div>
                            <div className="text-sm text-green-400">
                                {optimizationMetrics.optimization?.total_optimizations || 0} total optimizations
                            </div>
                        </div>

                        <div className="bg-green-600/10 border border-green-500/30 rounded-lg p-6 shadow-lg">
                            <div className="flex items-center gap-3 mb-3">
                                <Icon name="trending-up" className="w-5 h-5 text-green-400" />
                                <span className="font-bold text-green-300">Avg improvement</span>
                            </div>
                            <div className="text-2xl font-bold text-green-200 mb-2">
                                {(optimizationMetrics.optimization?.average_improvement || 0).toFixed(1)}%
                            </div>
                            <div className="text-sm text-green-400">
                                Performance gains per cycle
                            </div>
                        </div>

                        <div className="bg-green-600/10 border border-green-500/30 rounded-lg p-6 shadow-lg">
                            <div className="flex items-center gap-3 mb-3">
                                <Icon name="clock" className="w-5 h-5 text-green-400" />
                                <span className="font-bold text-green-300">Last optimization</span>
                            </div>
                            <div className="text-lg font-bold text-green-200 mb-2">
                                {optimizationMetrics.optimization?.last_optimization ?
                                    new Date(optimizationMetrics.optimization.last_optimization).toLocaleTimeString() :
                                    'Pending'
                                }
                            </div>
                            <div className="text-sm text-green-400">
                                Continuous monitoring active
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Interactive Demo Scenarios */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-green-400">
                    <Icon name="play-circle" className="w-6 h-6 text-green-400" />
                    Interactive platform demonstrations
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        {
                            id: 'multi-modal-showcase',
                            title: 'Multi-modal showcase',
                            description: 'Demonstrate all 4 Redis modules in sequence',
                            icon: 'layers',
                            color: 'green'
                        },
                        {
                            id: 'performance-stress-test',
                            title: 'Performance stress test',
                            description: 'High-throughput operations benchmark',
                            icon: 'zap',
                            color: 'green'
                        },
                        {
                            id: 'concurrent-debates',
                            title: 'Concurrent debates',
                            description: 'Multiple simultaneous AI debates',
                            icon: 'users',
                            color: 'green'
                        },
                        {
                            id: 'cache-efficiency',
                            title: 'Cache efficiency',
                            description: 'Semantic cache hit rate optimization',
                            icon: 'database',
                            color: 'green'
                        }
                    ].map((demo) => (
                        <div key={demo.id} className="bg-green-600/10 border border-green-500/30 rounded-lg p-6 shadow-lg">
                            <div className="flex items-center gap-3 mb-3">
                                <Icon
                                    name={demo.icon}
                                    className="w-5 h-5 text-green-400"
                                />
                                <span className="font-bold text-green-300">{demo.title}</span>
                            </div>
                            <p className="text-sm text-green-400 mb-4">{demo.description}</p>

                            <button
                                onClick={() => runDemo(demo.id)}
                                disabled={demoRunning}
                                className={`w-full px-4 py-2 rounded-lg font-bold transition-all border font-mono ${demoRunning && activeDemo === demo.id
                                    ? 'bg-green-800/50 text-green-600 cursor-not-allowed border-green-800/50'
                                    : 'bg-green-500/20 hover:bg-green-500/30 text-green-300 border-green-500/30 hover:border-green-500/50'
                                    }`}
                            >
                                {demoRunning && activeDemo === demo.id ? (
                                    <span className="flex items-center gap-2 justify-center">
                                        <Icon name="loader-2" className="w-4 h-4 animate-spin" />
                                        Running...
                                    </span>
                                ) : (
                                    'Run demo'
                                )}
                            </button>

                            {/* Demo Results */}
                            {demoResults[demo.id] && (
                                <div className="mt-4 p-3 bg-black/60 rounded-lg border border-green-500/20">
                                    <div className="text-xs text-green-400 mb-2 font-mono">Latest result:</div>
                                    {demoResults[demo.id].success ? (
                                        <div className="text-xs text-green-400 font-mono">
                                            ✅ success - {demoResults[demo.id].result?.metrics?.totalOperations || 0} operations
                                        </div>
                                    ) : (
                                        <div className="text-xs text-green-300 font-mono">
                                            ❌ error: {demoResults[demo.id].error}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Real-time Activity Feed */}
            <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-green-400">
                    <Icon name="activity" className="w-6 h-6 text-green-400" />
                    Live system activity
                </h2>

                <div className="bg-green-600/10 border border-green-500/30 rounded-lg p-6 shadow-lg">
                    <div className="space-y-3">
                        {showcaseData && (
                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-green-300 font-mono">
                                    Redis modules active: {showcaseData.summary?.totalModules || 0}/4
                                </span>
                                <span className="text-slate-500 font-mono">
                                    {new Date().toLocaleTimeString()}
                                </span>
                            </div>
                        )}

                        {platformMetrics && (
                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span className="text-green-300 font-mono">
                                    Processing {platformMetrics.platformMetrics?.debateStatistics?.activeDebates || 0} concurrent debates
                                </span>
                                <span className="text-slate-500 font-mono">
                                    {new Date().toLocaleTimeString()}
                                </span>
                            </div>
                        )}

                        {optimizationMetrics?.optimization?.status === 'active' && (
                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                                <span className="text-green-300 font-mono">
                                    Performance optimizer running ({optimizationMetrics.optimization.total_optimizations} cycles completed)
                                </span>
                                <span className="text-slate-500 font-mono">
                                    {new Date().toLocaleTimeString()}
                                </span>
                            </div>
                        )}

                        <div className="flex items-center gap-3 text-sm">
                            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                            <span className="text-green-300 font-mono">
                                Semantic cache hit rate: {platformMetrics?.platformMetrics?.semanticCache?.hit_ratio || 0}%
                            </span>
                            <span className="text-slate-500 font-mono">
                                {new Date().toLocaleTimeString()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default PlatformShowcaseDashboard;
