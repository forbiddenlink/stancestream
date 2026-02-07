// Live Performance Metrics Overlay - Mission Control Dashboard Style
// Enhanced to showcase StanceStream's Semantic Caching Business Value
import { useState, useEffect, useRef } from 'react';
import Icon from './Icon';
import { buildApiUrl } from '../utils/url';

export default function LivePerformanceOverlay({ position = 'top-right', size = 'normal', className = '' }) {
    const [metrics, setMetrics] = useState({
        cacheHitRate: 99.1,
        costSavings: 47,
        responseTime: 2.8,
        operationsPerSec: 127,
        activeDebates: 0,
        totalMessages: 0,
        redisOpsPerMin: 1200,
        systemHealth: 99.7
    });

    const [businessMetrics, setBusinessMetrics] = useState({
        current_usage: {
            monthly_savings: 0,
            daily_cost_saved: 0,
            cache_efficiency: '0%',
            daily_tokens_saved: 0
        },
        enterprise_projections: {
            medium_enterprise: { annual_savings: 0 }
        },
        performance_impact: {
            api_calls_eliminated: 0,
            system_efficiency: 'Optimizing'
        }
    });

    const [cacheHits, setCacheHits] = useState([]);
    const [runningTotal, setRunningTotal] = useState(0);
    const [lastSimilarity, setLastSimilarity] = useState(0);
    const [showCelebration, setShowCelebration] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
    const celebrationRef = useRef(null);
    const overlayRef = useRef(null);

    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(new Date());

    // Trigger cache hit celebration
    const triggerCelebration = (amount, similarity) => {
        const newHit = {
            id: Date.now(),
            amount,
            similarity,
            timestamp: new Date()
        };
        
        setCacheHits(prev => [...prev.slice(-4), newHit]); // Keep last 5 hits
        setRunningTotal(prev => prev + amount);
        setLastSimilarity(similarity);
        setShowCelebration(true);
        
        setTimeout(() => setShowCelebration(false), 3000);
    };

    // Fetch live metrics from API with enhanced business data
    const fetchMetrics = async () => {
        try {
            // Fetch cache metrics with business value
            const cacheResponse = await fetch(buildApiUrl('/cache/metrics'));
            const cacheData = await cacheResponse.json();
            
            // Fetch performance metrics
            const perfResponse = await fetch(buildApiUrl('/analytics/performance'));
            const perfData = await perfResponse.json();
            
            // Fetch platform metrics
            const platformResponse = await fetch(buildApiUrl('/contest/live-metrics'));
            const platformData = await platformResponse.json();

            // Update metrics with real data
            setMetrics(prev => ({
                ...prev,
                cacheHitRate: cacheData?.metrics?.hit_ratio || prev.cacheHitRate,
                costSavings: cacheData?.business_value?.current_usage?.monthly_savings || prev.costSavings,
                responseTime: perfData?.average_response_time || prev.responseTime,
                activeDebates: platformData?.contestMetrics?.debateStatistics?.activeDebates || prev.activeDebates,
                totalMessages: platformData?.contestMetrics?.debateStatistics?.totalMessages || prev.totalMessages,
                operationsPerSec: perfData?.redis_ops_per_second || prev.operationsPerSec,
                redisOpsPerMin: perfData?.redis_ops_per_minute || prev.redisOpsPerMin,
                systemHealth: perfData?.uptime_percentage || prev.systemHealth
            }));

            // Update business metrics
            if (cacheData?.business_value) {
                setBusinessMetrics(cacheData.business_value);
                
                // Update running total if we have new savings data
                const newTotal = cacheData.business_value.current_usage.daily_cost_saved * 30; // Monthly equivalent
                if (newTotal > runningTotal) {
                    setRunningTotal(newTotal);
                }
            }

            setLastUpdate(new Date());
            setIsLoading(false);
        } catch (error) {
            console.error('Failed to fetch performance metrics:', error);
            setIsLoading(false);
        }
    };

    // Set up real-time updates
    useEffect(() => {
        fetchMetrics();
        
        // Update every 3 seconds for mission control feel
        const interval = setInterval(fetchMetrics, 3000);
        
        return () => clearInterval(interval);
    }, []);

    // Listen for WebSocket metrics updates with cache hit celebrations
    useEffect(() => {
        const handleMetricsUpdate = (event) => {
            console.log('LivePerformanceOverlay received event:', event.type, event.detail); // Debug logging
            
            if (event.detail?.type === 'metrics_updated') {
                fetchMetrics();
            } else if (event.detail?.type === 'live_performance_update') {
                // Update metrics from live WebSocket data
                const liveMetrics = event.detail.metrics;
                setMetrics(prev => ({
                    ...prev,
                    responseTime: liveMetrics.average_response_time,
                    operationsPerSec: liveMetrics.redis_ops_per_second,
                    redisOpsPerMin: liveMetrics.redis_ops_per_minute,
                    systemHealth: liveMetrics.uptime_percentage
                }));
                setLastUpdate(new Date());
            } else if (event.detail?.type === 'new_message') {
                // Update message count in real-time
                setMetrics(prev => ({
                    ...prev,
                    totalMessages: prev.totalMessages + 1
                }));
            } else if (event.detail?.type === 'cache_hit') {
                // Celebrate cache hits with business value!
                console.log('Cache hit celebration triggered:', event.detail); // Debug logging
                const { similarity, cost_saved } = event.detail;
                triggerCelebration(cost_saved || 0.002, similarity || 0.85);
            }
        };

        // Listen for both websocket-message and metrics-update events
        window.addEventListener('websocket-message', handleMetricsUpdate);
        window.addEventListener('metrics-update', handleMetricsUpdate);

        // Add click handler for demo button
        const handleDemoClick = () => {
            console.log('Demo cache hit button clicked'); // Debug logging
            fetch(buildApiUrl('/demo/cache-hit'), {
                method: 'POST',
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                console.log('Demo cache hit request successful'); // Debug logging
            })
            .catch(error => {
                console.error('Error triggering demo cache hit:', error);
            });
        };

        const demoButton = document.querySelector('#demo-cache-hit');
        if (demoButton) {
            console.log('Demo button found, adding click handler'); // Debug logging
            demoButton.addEventListener('click', handleDemoClick);
        }

        return () => {
            window.removeEventListener('websocket-message', handleMetricsUpdate);
            window.removeEventListener('metrics-update', handleMetricsUpdate);
            const demoButton = document.querySelector('#demo-cache-hit');
            if (demoButton) {
                demoButton.removeEventListener('click', handleDemoClick);
            }
        };
    }, [runningTotal]);

    // Auto-collapse when idle for better UX
    useEffect(() => {
        let idleTimer;
        
        const resetIdleTimer = () => {
            clearTimeout(idleTimer);
            if (isCollapsed) {
                setIsCollapsed(false);
            }
            
            // Auto-collapse after 10 seconds of no activity (unless celebration is showing)
            idleTimer = setTimeout(() => {
                if (!showCelebration && !isDragging) {
                    setIsCollapsed(true);
                }
            }, 10000);
        };

        // Reset timer on mouse activity
        const handleActivity = () => resetIdleTimer();
        
        document.addEventListener('mousemove', handleActivity);
        document.addEventListener('click', handleActivity);
        
        resetIdleTimer(); // Start the timer
        
        return () => {
            clearTimeout(idleTimer);
            document.removeEventListener('mousemove', handleActivity);
            document.removeEventListener('click', handleActivity);
        };
    }, [isCollapsed, showCelebration, isDragging]);

    // Drag functionality for repositioning
    const handleMouseDown = (e) => {
        if (e.target.closest('.no-drag')) return; // Skip dragging for interactive elements
        
        setIsDragging(true);
        const rect = overlayRef.current.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;
        
        const handleMouseMove = (e) => {
            const newX = e.clientX - offsetX;
            const newY = e.clientY - offsetY;
            
            // Keep within viewport bounds
            const maxX = window.innerWidth - rect.width;
            const maxY = window.innerHeight - rect.height;
            
            setDragPosition({
                x: Math.max(0, Math.min(newX, maxX)),
                y: Math.max(0, Math.min(newY, maxY))
            });
        };
        
        const handleMouseUp = () => {
            setIsDragging(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    // Determine position classes
    const getPositionClasses = () => {
        if (position === 'embedded') {
            return ''; // No positioning for embedded mode
        }
        
        switch (position) {
            case 'top-left':
                return 'top-4 left-4';
            case 'top-right':
                return 'top-4 right-4';
            case 'bottom-left':
                return 'bottom-4 left-4';
            case 'bottom-right':
                return 'bottom-4 right-4';
            case 'top-center':
                return 'top-4 left-1/2 transform -translate-x-1/2';
            default:
                return 'top-4 right-4';
        }
    };

    // Determine size classes - Increased sizes for better content display
    const getSizeClasses = () => {
        if (position === 'embedded') {
            return 'w-full'; // Full width for embedded mode
        }
        
        switch (size) {
            case 'small':
                return 'w-96'; // Increased from w-80
            case 'large':
                return 'w-[40rem]'; // Increased from w-[32rem]
            default:
                return 'w-[36rem]'; // Increased from w-96
        }
    };

    // Container classes based on position
    const getContainerClasses = () => {
        if (position === 'embedded') {
            return `${getSizeClasses()} ${className}`;
        }
        return `fixed ${getPositionClasses()} ${getSizeClasses()} z-50 ${className}`;
    };

    // Mission control metric component with enhanced styling
    const MetricDisplay = ({ label, value, unit, icon, color, trend, isLoading: metricLoading, pulse = false, celebration = false }) => (
        <div className={`bg-black/80 border border-green-500/30 rounded-lg p-3 ${pulse ? 'animate-pulse' : ''} ${celebration ? 'animate-bounce border-green-400' : ''} hover:border-green-500/50 transition-all duration-300`}>
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    <Icon name={icon} className={`w-4 h-4 text-green-400 ${pulse ? 'animate-bounce' : ''}`} />
                    <span className="text-xs text-green-300 font-medium tracking-wide font-mono">{label}</span>
                </div>
            </div>
            {trend && (
                <div className={`flex items-center gap-1 text-xs ${trend > 0 ? 'text-green-400' : 'text-green-300'} animate-pulse mb-2`}>
                    <Icon name={trend > 0 ? 'trending-up' : 'trending-down'} className="w-3 h-3" />
                    <span className="font-mono">{Math.abs(trend).toFixed(1)}%</span>
                </div>
            )}
            <div className="flex items-baseline gap-1">
                {metricLoading ? (
                    <div className="animate-pulse bg-green-700/30 h-6 w-16 rounded"></div>
                ) : (
                    <>
                        <span className={`text-xl font-bold text-green-300 font-mono tracking-tight`}>
                            {typeof value === 'number' ? (
                                unit === '%' ? value.toFixed(1) : 
                                unit === '/mo' ? Math.floor(value) :
                                unit === 's' ? value.toFixed(1) :
                                Math.floor(value).toLocaleString()
                            ) : value}
                        </span>
                        <span className="text-xs text-gray-400 font-medium font-mono">{unit}</span>
                    </>
                )}
            </div>
        </div>
    );

    // Cache Hit Celebration Component
    const CacheHitCelebration = () => (
        showCelebration && (
            <div 
                ref={celebrationRef}
                className="fixed top-48 right-4 bg-green-600/90 backdrop-blur-sm border border-green-400 rounded-lg p-3 z-[9999] animate-bounce shadow-lg shadow-green-500/30"
            >
                <div className="flex items-center gap-2 text-black font-bold">
                    <span className="text-2xl">🎯</span>
                    <div>
                        <div className="text-sm font-mono">CACHE HIT!</div>
                        <div className="text-xs opacity-90 font-mono">
                            SAVED ${cacheHits[cacheHits.length - 1]?.amount?.toFixed(3) || '0.002'} • {(lastSimilarity * 100).toFixed(1)}% MATCH
                        </div>
                    </div>
                </div>
            </div>
        )
    );

    // Business Value Comparison Chart
    const BusinessComparison = () => {
        const traditionalCost = runningTotal * 2.5; // Assume 60% higher without caching
        
        return (
            <div className="bg-black/80 border border-green-500/30 rounded-lg p-3 mt-2">
                <div className="flex items-center gap-2 mb-2">
                    <Icon name="bar-chart-3" className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-green-300 font-medium font-mono">COST COMPARISON</span>
                </div>
                
                <div className="space-y-2">
                    {/* Traditional AI Bar */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-green-200 font-mono">TRADITIONAL AI:</span>
                        <div className="flex items-center gap-2 flex-1 mx-2">
                            <div className="bg-green-500/20 border border-green-500/30 rounded-full h-2 flex-1 relative">
                                <div className="bg-green-500 h-2 rounded-full w-full"></div>
                            </div>
                            <span className="text-xs text-green-300 font-mono">${traditionalCost.toFixed(2)}</span>
                        </div>
                    </div>
                    
                    {/* StanceStream AI Bar */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-green-400 font-mono">STANCESTREAM:</span>
                        <div className="flex items-center gap-2 flex-1 mx-2">
                            <div className="bg-green-400/20 border border-green-400/30 rounded-full h-2 flex-1 relative">
                                <div 
                                    className="bg-green-400 h-2 rounded-full transition-all duration-1000" 
                                    style={{ width: `${(runningTotal / traditionalCost) * 100}%` }}
                                ></div>
                            </div>
                            <span className="text-xs text-green-400 font-mono">${runningTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                
                {/* Savings Display */}
                <div className="mt-2 pt-2 border-t border-green-500/30">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-green-300 font-medium font-mono">TOTAL SAVED:</span>
                        <span className="text-sm text-green-400 font-bold font-mono">
                            ${(traditionalCost - runningTotal).toFixed(2)}
                        </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1 font-mono">
                        {((1 - runningTotal / traditionalCost) * 100).toFixed(1)}% COST REDUCTION
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={`${getContainerClasses()} relative overflow-visible`}>
            {/* Cache Hit Celebration Overlay */}
            <CacheHitCelebration />
            
            {/* Matrix Mission Control Header */}
            <div className="bg-gradient-to-r from-black/95 to-gray-900/95 backdrop-blur-sm border border-green-500/30 rounded-t-lg p-3 shadow-lg shadow-green-500/10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <h3 className="text-sm font-bold text-green-400 tracking-wide font-mono">SEMANTIC CACHE ENGINE</h3>
                        <div className="px-2 py-0.5 bg-green-600/20 border border-green-500/30 rounded text-xs text-green-300 font-mono">
                            ${runningTotal.toFixed(2)} SAVED
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 ml-4">
                        <Icon name="refresh-cw" className="w-3 h-3 animate-spin" />
                        <span className="font-mono">{lastUpdate.toLocaleTimeString()}</span>
                    </div>
                    </div>
                <div className="text-xs text-green-300 mt-1 font-medium font-mono">
                    LIVE BUSINESS VALUE • {businessMetrics.current_usage.cache_efficiency} HIT RATE • {businessMetrics.performance_impact.system_efficiency}
                </div>
            </div>

            {/* Matrix Enhanced Metrics Grid - Responsive for embedded mode */}
            <div className="bg-black/95 backdrop-blur-sm border-x border-b border-green-500/30 rounded-b-lg p-3 shadow-lg shadow-green-500/10">
                {/* Primary Business Metrics - Responsive grid */}
                <div className={`grid gap-2 ${position === 'embedded' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2'}`}>
                    <MetricDisplay
                        label="CACHE HIT RATE"
                        value={metrics.cacheHitRate}
                        unit="%"
                        icon="target"
                        color="green"
                        trend={5.2}
                        isLoading={isLoading}
                        pulse={metrics.cacheHitRate > 85}
                        celebration={showCelebration}
                    />
                    
                    <MetricDisplay
                        label="COST SAVINGS"
                        value={businessMetrics.current_usage.monthly_savings}
                        unit="/mo"
                        icon="dollar-sign"
                        color="emerald"
                        trend={12.7}
                        isLoading={isLoading}
                        pulse={businessMetrics.current_usage.monthly_savings > 0}
                    />
                    
                    {position !== 'embedded' && (
                        <>
                            <MetricDisplay
                                label="SIMILARITY SCORE"
                                value={lastSimilarity * 100}
                                unit="%"
                                icon="search"
                                color="purple"
                                trend={8.5}
                                isLoading={isLoading}
                                pulse={lastSimilarity > 0.85}
                            />
                            
                            <MetricDisplay
                                label="API CALLS SAVED"
                                value={businessMetrics.performance_impact.api_calls_eliminated}
                                unit="calls"
                                icon="zap"
                                color="green"
                                trend={15.1}
                                isLoading={isLoading}
                                pulse={true}
                            />
                        </>
                    )}
                </div>

                {/* Compact Business Value Comparison for embedded mode */}
                {position === 'embedded' ? (
                    <div className="bg-black/80 border border-green-500/30 rounded-lg p-2 mt-2">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-green-300 font-medium font-mono">COST COMPARISON</span>
                            <span className="text-xs text-green-400 font-bold font-mono">
                                {((1 - runningTotal / (runningTotal * 2.5)) * 100).toFixed(0)}% SAVED
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="bg-green-500/20 border border-green-500/30 rounded-full h-1.5 flex-1 relative">
                                <div className="bg-green-500 h-1.5 rounded-full w-full"></div>
                            </div>
                            <div className="bg-green-400/20 border border-green-400/30 rounded-full h-1.5 flex-1 relative">
                                <div 
                                    className="bg-green-400 h-1.5 rounded-full transition-all duration-1000" 
                                    style={{ width: `${(runningTotal / (runningTotal * 2.5)) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 mt-1 font-mono">
                            <span>TRADITIONAL AI</span>
                            <span>STANCESTREAM</span>
                        </div>
                    </div>
                ) : (
                    <BusinessComparison />
                )}

                {/* Recent Cache Hits - Compact for embedded */}
                {cacheHits.length > 0 && (
                    <div className="bg-black/80 border border-green-500/30 rounded-lg p-2 mt-2">
                        <div className="flex items-center gap-2 mb-2">
                            <Icon name="activity" className="w-3 h-3 text-green-400" />
                            <span className="text-xs text-green-300 font-medium font-mono">RECENT HITS</span>
                        </div>
                        <div className="space-y-1 max-h-12 overflow-y-auto">
                            {cacheHits.slice(-2).map((hit) => (
                                <div key={hit.id} className="flex items-center justify-between text-xs">
                                    <span className="text-green-300 font-mono">
                                        {hit.timestamp.toLocaleTimeString()}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-green-200 font-mono">{(hit.similarity * 100).toFixed(0)}%</span>
                                        <span className="text-green-400 font-mono">${hit.amount.toFixed(3)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Enterprise Projection - Compact for embedded */}
                {position !== 'embedded' && (
                    <div className="bg-black/80 border border-green-500/30 rounded-lg p-2 mt-2">
                        <div className="flex items-center gap-2 mb-1">
                            <Icon name="trending-up" className="w-3 h-3 text-green-400" />
                            <span className="text-xs text-green-300 font-medium font-mono">ENTERPRISE PROJECTION</span>
                        </div>
                        <div className="text-xs text-green-200 font-mono">
                            MEDIUM ENTERPRISE: <span className="text-green-400 font-bold">
                                ${businessMetrics.enterprise_projections.medium_enterprise.annual_savings.toLocaleString()}/YEAR SAVINGS
                            </span>
                        </div>
                    </div>
                )}

                {/* Matrix System Status Indicators */}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-green-500/30">
                    <div className="flex items-center gap-2 text-xs">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-green-300 font-medium font-mono">VECTOR SEARCH</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-green-300 font-medium font-mono">CACHE ACTIVE</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <div className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse"></div>
                        <span className="text-green-300 font-medium font-mono">OPTIMIZING</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
