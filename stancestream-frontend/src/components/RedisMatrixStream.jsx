// Redis Operations Matrix Stream - "The Matrix" for Redis Data
// Showcases all 4 Redis modules working together with flowing animations
import { useState, useEffect, useRef } from 'react';
import Icon from './Icon';

export default function RedisMatrixStream({ position = 'overlay', className = '' }) {
    const [operations, setOperations] = useState([]);
    const [isActive, setIsActive] = useState(true);
    const containerRef = useRef(null);
    const operationIdRef = useRef(0);

    // Redis operation types with colors and animations
    const operationTypes = {
        json: {
            icon: 'database',
            color: 'blue',
            label: 'JSON',
            description: 'Agent Updates',
            examples: [
                'agent:senatorbot:profile → updating stance',
                'debate:metrics → cache stats',
                'platform:live_metrics → scoring',
                'agent:intelligence → emotions'
            ]
        },
        streams: {
            icon: 'arrow-right',
            color: 'green', 
            label: 'STREAMS',
            description: 'Messages',
            examples: [
                'debate:messages → new statement',
                'agent:memory → strategic note',
                'debate:key_moments → highlight',
                'agent:strategic_memory → insight'
            ]
        },
        timeseries: {
            icon: 'trending-up',
            color: 'purple',
            label: 'TIMESERIES',
            description: 'Stance Changes',
            examples: [
                'stance:climate_policy → +0.3',
                'emotions:intensity → 0.8',
                'performance:response_time → 2.1s',
                'system:health → 99.7%'
            ]
        },
        vector: {
            icon: 'target',
            color: 'green',
            label: 'VECTOR',
            description: 'Cache Hits',
            examples: [
                'cache:prompt → 92.1% match',
                'facts:search → COSINE similarity',
                'knowledge:verify → fact check',
                'semantic:cache → HIT!'
            ]
        }
    };

    // Generate random Redis operation
    const generateOperation = () => {
        const types = Object.keys(operationTypes);
        const type = types[Math.floor(Math.random() * types.length)];
        const config = operationTypes[type];
        const example = config.examples[Math.floor(Math.random() * config.examples.length)];
        
        return {
            id: ++operationIdRef.current,
            type,
            config,
            operation: example,
            timestamp: new Date(),
            progress: 0,
            phase: 'starting', // starting → processing → completing → success
            similarity: type === 'vector' ? (85 + Math.random() * 15) : null,
            value: type === 'timeseries' ? ((Math.random() - 0.5) * 2).toFixed(2) : null
        };
    };

    // Add new operation to stream
    const addOperation = () => {
        if (!isActive) return;
        
        const newOp = generateOperation();
        setOperations(prev => [...prev.slice(-19), newOp]); // Keep last 20 operations
    };

    // Update operation progress and phases
    const updateOperations = () => {
        setOperations(prev => prev.map(op => {
            let newProgress = op.progress + (5 + Math.random() * 10); // Variable speed
            let newPhase = op.phase;
            
            if (newProgress > 25 && op.phase === 'starting') {
                newPhase = 'processing';
            } else if (newProgress > 75 && op.phase === 'processing') {
                newPhase = 'completing';
            } else if (newProgress >= 100) {
                newPhase = 'success';
                newProgress = 100;
            }
            
            return {
                ...op,
                progress: newProgress,
                phase: newPhase
            };
        }).filter(op => {
            // Remove completed operations after a delay
            return !(op.phase === 'success' && op.progress >= 100 && Date.now() - op.timestamp > 2000);
        }));
    };

    // Set up operation generation and updates
    useEffect(() => {
        if (!isActive) return;
        
        // Add new operations at varying intervals (Matrix feel)
        const addInterval = setInterval(() => {
            if (Math.random() > 0.3) { // 70% chance to add
                addOperation();
            }
        }, 800 + Math.random() * 1200); // 0.8-2s intervals
        
        // Update operation progress
        const updateInterval = setInterval(updateOperations, 150);

        return () => {
            clearInterval(addInterval);
            clearInterval(updateInterval);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isActive]);

    // Listen for real Redis operations from WebSocket
    useEffect(() => {
        const handleRedisOperation = (event) => {
            if (!isActive) return;
            
            const { detail } = event;
            
            // Handle direct Redis operation broadcasts
            if (detail?.type === 'redis_operation') {
                const { operation_type, operation, metadata } = detail;
                const config = operationTypes[operation_type];
                
                if (config) {
                    const realOp = {
                        id: ++operationIdRef.current,
                        type: operation_type,
                        config,
                        operation,
                        timestamp: new Date(),
                        progress: 0,
                        phase: 'starting',
                        isReal: true,
                        similarity: metadata?.similarity ? (metadata.similarity * 100) : null,
                        value: metadata?.change || metadata?.value,
                        costSaved: metadata?.costSaved
                    };
                    
                    setOperations(prev => [...prev.slice(-19), realOp]);
                }
                return;
            }
            
            // Map other WebSocket events to Redis operations
            let redisType = null;
            let customOperation = null;
            let metadata = {};
            
            if (detail?.type === 'new_message') {
                redisType = 'streams';
                customOperation = `debate:${detail.debateId}:messages → ${detail.agentName}`;
                metadata = { agentId: detail.agentId };
            } else if (detail?.type === 'stance_update') {
                redisType = 'timeseries';
                customOperation = `stance:${detail.topic} → ${detail.change > 0 ? '+' : ''}${detail.change}`;
                metadata = { change: detail.change, topic: detail.topic };
            } else if (detail?.type === 'cache_hit') {
                redisType = 'vector';
                customOperation = `cache:prompt → ${(detail.similarity * 100).toFixed(1)}% MATCH!`;
                metadata = { similarity: detail.similarity, costSaved: detail.cost_saved };
            } else if (detail?.type === 'agent_update') {
                redisType = 'json';
                customOperation = `agent:${detail.agentId}:profile → updating`;
                metadata = { agentId: detail.agentId };
            }
            
            if (redisType) {
                const config = operationTypes[redisType];
                const realOp = {
                    id: ++operationIdRef.current,
                    type: redisType,
                    config,
                    operation: customOperation,
                    timestamp: new Date(),
                    progress: 0,
                    phase: 'starting',
                    isReal: true,
                    similarity: metadata.similarity ? (metadata.similarity * 100) : null,
                    value: metadata.change || metadata.value,
                    costSaved: metadata.costSaved
                };
                
                setOperations(prev => [...prev.slice(-19), realOp]);
            }
        };

        window.addEventListener('websocket-message', handleRedisOperation);
        return () => window.removeEventListener('websocket-message', handleRedisOperation);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isActive]);

    // Get phase styling
    const getPhaseStyle = (phase, isReal = false) => {
        const baseStyle = isReal ? 'ring-2 ring-green-400/50 ' : '';
        
        switch (phase) {
            case 'starting':
                return baseStyle + 'bg-gray-800/60 border-gray-600/30';
            case 'processing':
                return baseStyle + 'bg-green-900/40 border-green-500/40 animate-pulse';
            case 'completing':
                return baseStyle + 'bg-green-900/40 border-green-500/40';
            case 'success':
                return baseStyle + 'bg-emerald-900/60 border-emerald-400/60 animate-bounce';
            default:
                return baseStyle + 'bg-gray-800/60 border-gray-600/30';
        }
    };

    // Progress bar color by type
    const getProgressColor = (type, phase) => {
        const colors = {
            json: phase === 'success' ? 'bg-green-400' : 'bg-green-500',
            streams: phase === 'success' ? 'bg-green-400' : 'bg-green-500',
            timeseries: phase === 'success' ? 'bg-purple-400' : 'bg-purple-500',
            vector: phase === 'success' ? 'bg-green-400' : 'bg-green-500'
        };
        return colors[type] || 'bg-gray-500';
    };

    // Container classes based on position
    const getContainerClasses = () => {
        if (position === 'embedded') {
            return `w-full ${className}`;
        }
        return `fixed top-4 left-4 w-96 z-40 ${className}`;
    };

    return (
        <div className={getContainerClasses()}>
            {/* Matrix Header */}
            <div className="bg-gradient-to-r from-black/95 to-green-900/80 backdrop-blur-sm border border-green-500/30 rounded-t-lg p-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <h3 className="text-sm font-bold text-green-300 tracking-wider font-mono">
                            REDIS OPERATIONS MATRIX
                        </h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsActive(!isActive)}
                            className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                                isActive 
                                    ? 'bg-green-600/20 text-green-300 border border-green-500/30' 
                                    : 'bg-red-600/20 text-red-300 border border-red-500/30'
                            }`}
                        >
                            {isActive ? 'LIVE' : 'PAUSED'}
                        </button>
                    </div>
                </div>
                
                {/* Module Status Row */}
                <div className="grid grid-cols-4 gap-2 mt-2 text-xs">
                    {Object.entries(operationTypes).map(([type, config]) => (
                        <div key={type} className="flex items-center gap-1">
                            <Icon name={config.icon} className={`w-3 h-3 text-${config.color}-400`} />
                            <span className={`text-${config.color}-300 font-mono font-bold`}>
                                {config.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Operations Stream */}
            <div 
                ref={containerRef}
                className="bg-black/95 backdrop-blur-sm border-x border-b border-green-500/30 rounded-b-lg p-3 max-h-80 overflow-y-auto scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-green-500"
            >
                <div className="space-y-2">
                    {operations.length === 0 ? (
                        <div className="text-center text-gray-500 font-mono text-xs py-4">
                            Initializing Redis Matrix...
                        </div>
                    ) : (
                        operations.map((op) => (
                            <div
                                key={op.id}
                                className={`border rounded-lg p-2 transition-all duration-300 ${getPhaseStyle(op.phase, op.isReal)}`}
                            >
                                {/* Operation Header */}
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <Icon 
                                            name={op.config.icon} 
                                            className={`w-3 h-3 text-${op.config.color}-400 ${
                                                op.phase === 'processing' ? 'animate-spin' : ''
                                            }`} 
                                        />
                                        <span className={`text-xs font-bold text-${op.config.color}-300 font-mono`}>
                                            {op.config.label}
                                        </span>
                                        {op.isReal && (
                                            <span className="px-1 py-0.5 bg-green-600/30 border border-green-500/50 rounded text-xs text-green-300 font-bold">
                                                LIVE
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        {op.similarity && (
                                            <span className="text-green-300 font-mono">
                                                {op.similarity.toFixed(1)}%
                                            </span>
                                        )}
                                        {op.value && (
                                            <span className={`font-mono ${
                                                parseFloat(op.value) > 0 ? 'text-green-300' : 'text-red-300'
                                            }`}>
                                                {op.value > 0 ? '+' : ''}{op.value}
                                            </span>
                                        )}
                                        <span className="text-gray-400 font-mono">
                                            {op.timestamp.toLocaleTimeString().split(':').slice(-2).join(':')}
                                        </span>
                                    </div>
                                </div>

                                {/* Operation Details */}
                                <div className="text-xs text-gray-300 font-mono mb-2">
                                    {op.operation}
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-gray-700/50 rounded-full h-1">
                                    <div
                                        className={`h-1 rounded-full transition-all duration-300 ${getProgressColor(op.type, op.phase)}`}
                                        style={{ width: `${op.progress}%` }}
                                    ></div>
                                </div>

                                {/* Phase Status */}
                                <div className={`text-xs mt-1 font-mono ${
                                    op.phase === 'success' ? 'text-green-300' :
                                    op.phase === 'completing' ? 'text-green-300' :
                                    op.phase === 'processing' ? 'text-green-300' :
                                    'text-gray-400'
                                }`}>
                                    {op.phase.toUpperCase()}
                                    {op.phase === 'success' && ' ✓'}
                                    {op.phase === 'processing' && ' ⟳'}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Operation Summary */}
            <div className="bg-gray-900/95 border border-green-500/30 rounded-b-lg -mt-px p-2">
                <div className="grid grid-cols-4 gap-2 text-xs">
                    {Object.entries(operationTypes).map(([type, config]) => {
                        const count = operations.filter(op => op.type === type).length;
                        return (
                            <div key={type} className="text-center">
                                <div className={`text-${config.color}-300 font-bold font-mono`}>
                                    {count}
                                </div>
                                <div className="text-gray-400 text-xs">
                                    {config.description}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
