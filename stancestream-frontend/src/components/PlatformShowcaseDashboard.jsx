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
                    <h1 className="text-4xl font-bold text-green-400 tracking-wide">
                        REDIS AI CHALLENGE SHOWCASE
                    </h1>
                </div>
                <p className="text-xl text-green-300">
                    REAL-TIME DEMONSTRATION OF STANCESTREAM'S MULTI-MODAL REDIS ARCHITECTURE
                </p>
            </div>

            {/* Platform Metrics Overview */}
            {platformMetrics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-green-600/10 border border-green-500/30 rounded-lg p-6 shadow-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <Icon name="database" className="w-6 h-6 text-green-400" />
                            <span className="text-lg font-bold text-green-300">ACTIVE DEBATES</span>
                        </div>
                        <div className="text-3xl font-bold text-green-200">
                            {platformMetrics.platformMetrics?.debateStatistics?.activeDebates || 0}
                        </div>
                        <div className="text-sm text-green-400/80">REAL-TIME CONCURRENT PROCESSING</div>
                    </div>

                    <div className="bg-green-600/10 border border-green-500/30 rounded-lg p-6 shadow-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <Icon name="message-circle" className="w-6 h-6 text-green-400" />
                            <span className="text-lg font-bold text-green-300">TOTAL MESSAGES</span>
                        </div>
                        <div className="text-3xl font-bold text-green-200">
                            {platformMetrics.platformMetrics?.debateStatistics?.totalMessages || 0}
                        </div>
                        <div className="text-sm text-green-400/80">REDIS STREAMS THROUGHPUT</div>
                    </div>

                    <div className="bg-green-600/10 border border-green-500/30 rounded-lg p-6 shadow-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <Icon name="zap" className="w-6 h-6 text-green-400" />
                            <span className="text-lg font-bold text-green-300">CACHE HIT RATE</span>
                        </div>
                        <div className="text-3xl font-bold text-green-200">
                            {platformMetrics.platformMetrics?.semanticCache?.hit_ratio || 0}%
                        </div>
                        <div className="text-sm text-green-400/80">SEMANTIC VECTOR CACHING</div>
                    </div>

                    <div className="bg-green-600/10 border border-green-500/30 rounded-lg p-6 shadow-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <Icon name="activity" className="w-6 h-6 text-green-400" />
                            <span className="text-lg font-bold text-green-300">SYSTEM HEALTH</span>
                        </div>
                        <div className="text-3xl font-bold text-green-200">
                            {Math.round((platformMetrics.platformMetrics?.systemHealth?.uptime || 0) / 60)}M
                        </div>
                        <div className="text-sm text-green-400/80">UPTIME & STABILITY</div>
                    </div>
                </div>
            )}

            {/* Redis Multi-Modal Showcase */}
            {showcaseData && (
                <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-green-400 tracking-wide">
                        <Icon name="layers" className="w-6 h-6 text-green-400" />
                        REDIS MULTI-MODAL ARCHITECTURE LIVE DEMO
                    </h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* RedisJSON */}
                        <div className="bg-green-600/10 border border-green-500/30 rounded-lg p-6 shadow-lg">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <h3 className="text-xl font-bold text-green-300">REDISJSON</h3>
                                <Icon name="file-text" className="w-5 h-5 text-green-400" />
                            </div>
                            <p className="text-sm text-green-400/80 mb-3">{showcaseData.showcase?.redisJSON?.example}</p>
                            <div className="bg-black/60 rounded-lg p-3 mb-3 border border-green-500/20">
                                <code className="text-xs text-green-400">
                                    KEYS: {showcaseData.summary?.activeKeys?.json || 0} |
                                    PATTERN: {showcaseData.showcase?.redisJSON?.keyPattern}
                                </code>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {showcaseData.showcase?.redisJSON?.operations?.map((op, i) => (
                                    <span key={i} className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded border border-green-500/30">
                                        {op.toUpperCase()}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Redis Streams */}
                        <div className="bg-green-600/10 border border-green-500/30 rounded-lg p-6 shadow-lg">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                                <h3 className="text-xl font-bold text-green-300">REDIS STREAMS</h3>
                                <Icon name="git-branch" className="w-5 h-5 text-green-400" />
                            </div>
                            <p className="text-sm text-green-400/80 mb-3">{showcaseData.showcase?.redisStreams?.example}</p>
                            <div className="bg-black/60 rounded-lg p-3 mb-3 border border-green-500/20">
                                <code className="text-xs text-green-400">
                                    KEYS: {showcaseData.summary?.activeKeys?.streams || 0} |
                                    PATTERN: {showcaseData.showcase?.redisStreams?.keyPattern}
                                </code>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {showcaseData.showcase?.redisStreams?.operations?.map((op, i) => (
                                    <span key={i} className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded border border-green-500/30">
                                        {op.toUpperCase()}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* RedisTimeSeries */}
                        <div className="bg-green-600/10 border border-green-500/30 rounded-lg p-6 shadow-lg">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-3 h-3 bg-green-300 rounded-full"></div>
                                <h3 className="text-xl font-bold text-green-300">REDISTIMESERIES</h3>
                                <Icon name="trending-up" className="w-5 h-5 text-green-400" />
                            </div>
                            <p className="text-sm text-green-400/80 mb-3">{showcaseData.showcase?.redisTimeSeries?.example}</p>
                            <div className="bg-black/60 rounded-lg p-3 mb-3 border border-green-500/20">
                                <code className="text-xs text-green-400">
                                    KEYS: {showcaseData.summary?.activeKeys?.timeseries || 0} |
                                    PATTERN: {showcaseData.showcase?.redisTimeSeries?.keyPattern}
                                </code>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {showcaseData.showcase?.redisTimeSeries?.operations?.map((op, i) => (
                                    <span key={i} className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded border border-green-500/30">
                                        {op.toUpperCase()}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Redis Vector */}
                        <div className="bg-green-600/10 border border-green-500/30 rounded-lg p-6 shadow-lg">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                                <h3 className="text-xl font-bold text-green-300">REDIS VECTOR SEARCH</h3>
                                <Icon name="search" className="w-5 h-5 text-green-400" />
                            </div>
                            <p className="text-sm text-green-400/80 mb-3">{showcaseData.showcase?.redisVector?.example}</p>
                            <div className="bg-black/60 rounded-lg p-3 mb-3 border border-green-500/20">
                                <code className="text-xs text-green-400">
                                    KEYS: {showcaseData.summary?.activeKeys?.vector || 0} |
                                    PATTERN: {showcaseData.showcase?.redisVector?.keyPattern}
                                </code>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {showcaseData.showcase?.redisVector?.operations?.map((op, i) => (
                                    <span key={i} className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded border border-green-500/30">
                                        {op.toUpperCase()}
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
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-green-400 tracking-wide">
                        <Icon name="gauge" className="w-6 h-6 text-green-400" />
                        REAL-TIME PERFORMANCE OPTIMIZATION
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-green-600/10 border border-green-500/30 rounded-lg p-6 shadow-lg">
                            <div className="flex items-center gap-3 mb-3">
                                <Icon name="cpu" className="w-5 h-5 text-green-400" />
                                <span className="font-bold text-green-300">OPTIMIZATION STATUS</span>
                            </div>
                            <div className="text-2xl font-bold text-green-200 mb-2">
                                {(optimizationMetrics.optimization?.status || 'OFFLINE').toUpperCase()}
                            </div>
                            <div className="text-sm text-green-400/80">
                                {optimizationMetrics.optimization?.total_optimizations || 0} TOTAL OPTIMIZATIONS
                            </div>
                        </div>

                        <div className="bg-green-600/10 border border-green-500/30 rounded-lg p-6 shadow-lg">
                            <div className="flex items-center gap-3 mb-3">
                                <Icon name="trending-up" className="w-5 h-5 text-green-400" />
                                <span className="font-bold text-green-300">AVG IMPROVEMENT</span>
                            </div>
                            <div className="text-2xl font-bold text-green-200 mb-2">
                                {(optimizationMetrics.optimization?.average_improvement || 0).toFixed(1)}%
                            </div>
                            <div className="text-sm text-green-400/80">
                                PERFORMANCE GAINS PER CYCLE
                            </div>
                        </div>

                        <div className="bg-green-600/10 border border-green-500/30 rounded-lg p-6 shadow-lg">
                            <div className="flex items-center gap-3 mb-3">
                                <Icon name="clock" className="w-5 h-5 text-green-400" />
                                <span className="font-bold text-green-300">LAST OPTIMIZATION</span>
                            </div>
                            <div className="text-lg font-bold text-green-200 mb-2">
                                {optimizationMetrics.optimization?.last_optimization ?
                                    new Date(optimizationMetrics.optimization.last_optimization).toLocaleTimeString() :
                                    'PENDING'
                                }
                            </div>
                            <div className="text-sm text-green-400/80">
                                CONTINUOUS MONITORING ACTIVE
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Interactive Demo Scenarios */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-green-400 tracking-wide">
                    <Icon name="play-circle" className="w-6 h-6 text-green-400" />
                    INTERACTIVE PLATFORM DEMONSTRATIONS
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        {
                            id: 'multi-modal-showcase',
                            title: 'MULTI-MODAL SHOWCASE',
                            description: 'DEMONSTRATE ALL 4 REDIS MODULES IN SEQUENCE',
                            icon: 'layers',
                            color: 'green'
                        },
                        {
                            id: 'performance-stress-test',
                            title: 'PERFORMANCE STRESS TEST',
                            description: 'HIGH-THROUGHPUT OPERATIONS BENCHMARK',
                            icon: 'zap',
                            color: 'green'
                        },
                        {
                            id: 'concurrent-debates',
                            title: 'CONCURRENT DEBATES',
                            description: 'MULTIPLE SIMULTANEOUS AI DEBATES',
                            icon: 'users',
                            color: 'green'
                        },
                        {
                            id: 'cache-efficiency',
                            title: 'CACHE EFFICIENCY',
                            description: 'SEMANTIC CACHE HIT RATE OPTIMIZATION',
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
                            <p className="text-sm text-green-400/80 mb-4">{demo.description}</p>

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
                                        RUNNING...
                                    </span>
                                ) : (
                                    'RUN DEMO'
                                )}
                            </button>

                            {/* Demo Results */}
                            {demoResults[demo.id] && (
                                <div className="mt-4 p-3 bg-black/60 rounded-lg border border-green-500/20">
                                    <div className="text-xs text-green-400/80 mb-2 font-mono">LATEST RESULT:</div>
                                    {demoResults[demo.id].success ? (
                                        <div className="text-xs text-green-400 font-mono">
                                            ✅ SUCCESS - {demoResults[demo.id].result?.metrics?.totalOperations || 0} OPERATIONS
                                        </div>
                                    ) : (
                                        <div className="text-xs text-green-300 font-mono">
                                            ❌ ERROR: {demoResults[demo.id].error}
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
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-green-400 tracking-wide">
                    <Icon name="activity" className="w-6 h-6 text-green-400" />
                    LIVE SYSTEM ACTIVITY
                </h2>

                <div className="bg-green-600/10 border border-green-500/30 rounded-lg p-6 shadow-lg">
                    <div className="space-y-3">
                        {showcaseData && (
                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-green-300 font-mono">
                                    REDIS MODULES ACTIVE: {showcaseData.summary?.totalModules || 0}/4
                                </span>
                                <span className="text-green-500/60 font-mono">
                                    {new Date().toLocaleTimeString()}
                                </span>
                            </div>
                        )}

                        {platformMetrics && (
                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span className="text-green-300 font-mono">
                                    PROCESSING {platformMetrics.platformMetrics?.debateStatistics?.activeDebates || 0} CONCURRENT DEBATES
                                </span>
                                <span className="text-green-500/60 font-mono">
                                    {new Date().toLocaleTimeString()}
                                </span>
                            </div>
                        )}

                        {optimizationMetrics?.optimization?.status === 'active' && (
                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                                <span className="text-green-300 font-mono">
                                    PERFORMANCE OPTIMIZER RUNNING ({optimizationMetrics.optimization.total_optimizations} CYCLES COMPLETED)
                                </span>
                                <span className="text-green-500/60 font-mono">
                                    {new Date().toLocaleTimeString()}
                                </span>
                            </div>
                        )}

                        <div className="flex items-center gap-3 text-sm">
                            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                            <span className="text-green-300 font-mono">
                                SEMANTIC CACHE HIT RATE: {platformMetrics?.platformMetrics?.semanticCache?.hit_ratio || 0}%
                            </span>
                            <span className="text-green-500/60 font-mono">
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
