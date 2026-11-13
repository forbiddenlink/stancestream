// Semantic cache measurements, shown in the Analytics view.
import { useState, useEffect, useRef, useCallback } from 'react';
import { buildApiUrl } from '../utils/url';
import { normalizePerformanceMetrics } from '../utils/performanceMetrics';

// One measurement as a labelled term and value.
const MetricDisplay = ({ label, value, unit, isLoading: metricLoading }) => (
    <div className="stat">
        <dt>{label}</dt>
        <dd>
            {metricLoading ? '-' : (
                <>
                    {typeof value === 'number' ? (
                        unit === '%' ? value.toFixed(1) :
                        unit === 's' ? value.toFixed(1) :
                        Math.floor(value).toLocaleString()
                    ) : (value ?? '-')}
                    {unit && typeof value === 'number' && <span className="stat-unit"> {unit}</span>}
                </>
            )}
        </dd>
    </div>
);

// Cache hit notice: a plain status line, announced to screen readers.
const CacheHitCelebration = ({ showCelebration, celebrationRef, lastSimilarity }) => (
    showCelebration && (
        <p ref={celebrationRef} role="status" className="conn-line">
            Cache hit. {lastSimilarity > 0 ? `${(lastSimilarity * 100).toFixed(1)}% match.` : 'Served from the cache.'}
        </p>
    )
);

async function fetchMetricResponses() {
    // Fetch cache metrics with business value
    const cacheResponse = await fetch(buildApiUrl('/cache/metrics'));
    if (!cacheResponse.ok) throw new Error("Failed to fetch cache metrics");
    const cacheData = await cacheResponse.json();

    // Fetch performance metrics
    const perfResponse = await fetch(buildApiUrl('/analytics/performance'));
    if (!perfResponse.ok) throw new Error("Failed to fetch performance metrics");
    const perfData = await perfResponse.json();

    // Fetch platform metrics
    const platformResponse = await fetch(buildApiUrl('/contest/live-metrics'));
    if (!platformResponse.ok) throw new Error("Failed to fetch platform metrics");
    const platformData = await platformResponse.json();

    return { cacheData, perfData, platformData };
}

export default function LivePerformanceOverlay({ position = 'top-right', size = 'normal', className = '' }) {
    const [metrics, setMetrics] = useState({
        cacheHitRate: null,
        costSavings: null,
        responseTime: null,
        operationsPerSec: null,
        activeDebates: null,
        totalMessages: null,
        redisOpsPerMin: null,
        systemHealth: null
    });

    const [businessMetrics, setBusinessMetrics] = useState({
        performance_impact: {
            api_calls_eliminated: null
        }
    });

    const [cacheHits, setCacheHits] = useState([]);
    const [lastSimilarity, setLastSimilarity] = useState(0);
    const [showCelebration, setShowCelebration] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [_dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
    const celebrationRef = useRef(null);
    const overlayRef = useRef(null);

    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(new Date());

    // Trigger cache hit celebration
    const triggerCelebration = useCallback((amount, similarity) => {
        const newHit = {
            id: Date.now(),
            amount,
            similarity,
            timestamp: new Date()
        };
        
        setCacheHits(prev => [...prev.slice(-4), newHit]); // Keep last 5 hits
        setLastSimilarity(similarity);
        setShowCelebration(true);
        
        setTimeout(() => setShowCelebration(false), 3000);
    }, []);

    // Fetch live metrics from API with enhanced business data
    const fetchMetrics = useCallback(() => {
        return fetchMetricResponses().then(({ cacheData, perfData, platformData }) => {
            // Update metrics with real data
            setMetrics(prev => ({
                ...prev,
                cacheHitRate: cacheData?.metrics?.hit_ratio ?? null,
                activeDebates: platformData?.contestMetrics?.debateStatistics?.activeDebates ?? null,
                totalMessages: platformData?.contestMetrics?.debateStatistics?.totalMessages ?? null,
                ...normalizePerformanceMetrics(perfData?.performance)
            }));

            // Update business metrics
            if (cacheData?.business_value) {
                setBusinessMetrics(cacheData.business_value);
            }

            setLastUpdate(new Date());
            setIsLoading(false);
        }).catch(error => {
            console.error('Failed to fetch performance metrics:', error);
            setIsLoading(false);
        });
    }, []);

    // Set up real-time updates
    useEffect(() => {
        fetchMetrics();

        // Update every 3 seconds for mission control feel
        const interval = setInterval(fetchMetrics, 3000);

        return () => clearInterval(interval);
    }, [fetchMetrics]);

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
                    ...normalizePerformanceMetrics(liveMetrics)
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
                const { similarity, cost_saved } = event.detail; // only what the event reports
                triggerCelebration(cost_saved ?? null, similarity ?? 0);
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
    }, [fetchMetrics, triggerCelebration]);

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

    // Drag functionality for repositioning (currently unused but kept for future use)
    const _handleMouseDown = (e) => {
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

    return (
        <div className={`${getContainerClasses()} relative`}>
            <CacheHitCelebration showCelebration={showCelebration} celebrationRef={celebrationRef} lastSimilarity={lastSimilarity} />
            <p className="section-note">Updated {lastUpdate.toLocaleTimeString()}.</p>
            <dl className="stat-list">
                <MetricDisplay label="Cache hit rate" value={metrics.cacheHitRate} unit="%" isLoading={isLoading} />
                {position !== 'embedded' && (
                    <>
                        <MetricDisplay label="Similarity score" value={lastSimilarity * 100} unit="%" isLoading={isLoading} />
                        <MetricDisplay label="API calls saved" value={businessMetrics.performance_impact?.api_calls_eliminated} unit="calls" isLoading={isLoading} />
                    </>
                )}
            </dl>
            {cacheHits.length > 0 && (
                <table className="ledger">
                    <caption>Recent cache hits</caption>
                    <thead><tr><th scope="col">Time</th><th scope="col">Match</th></tr></thead>
                    <tbody>
                        {cacheHits.slice(-2).map((hit) => (
                            <tr key={hit.id}>
                                <th scope="row">{hit.timestamp.toLocaleTimeString()}</th>
                                <td>{(hit.similarity * 100).toFixed(0)}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
