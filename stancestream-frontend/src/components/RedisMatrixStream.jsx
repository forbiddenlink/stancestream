// Redis operations list. Rows marked Sample are canned lines played by this component;
// rows marked From the debate server come from real events.
import { useState, useEffect, useRef } from 'react';

export default function RedisMatrixStream({ position = 'overlay', className = '' }) {
    const [operations, setOperations] = useState([]);
    const [isActive, setIsActive] = useState(true);
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
            label: 'Streams',
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
            label: 'TimeSeries',
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
            label: 'Vector',
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
                customOperation = `cache:prompt → ${(detail.similarity * 100).toFixed(1)}% match!`;
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

    const containerClasses = position === 'embedded' ? `w-full ${className}` : `w-full ${className}`;

    return (
        <section className={`matrix-list ${containerClasses}`} aria-labelledby="matrix-list-title">
            <div className="pane-head">
                <h3 id="matrix-list-title" className="pane-title">Operations</h3>
                <button type="button" className="btn-plain" onClick={() => setIsActive(!isActive)} aria-pressed={!isActive}>
                    {isActive ? 'Pause' : 'Resume'}
                </button>
            </div>
            <p className="section-note">
                Rows marked Sample are made-up lines this page plays to show the shape of each Redis
                model. Rows marked From the debate server come from events the server sent.
            </p>

            <table className="ledger">
                <caption>Operation count by model, last 20 rows</caption>
                <thead>
                    <tr>{Object.entries(operationTypes).map(([type, config]) => <th scope="col" key={type}>{config.label}</th>)}</tr>
                </thead>
                <tbody>
                    <tr>
                        {Object.keys(operationTypes).map((type) => (
                            <td key={type}>{operations.filter(op => op.type === type).length}</td>
                        ))}
                    </tr>
                </tbody>
            </table>

            {operations.length === 0 ? (
                <p className="section-note" role="status">No operations yet.</p>
            ) : (
                <table className="ledger">
                    <caption>Operations</caption>
                    <thead>
                        <tr><th scope="col">Time</th><th scope="col">Model</th><th scope="col">Operation</th><th scope="col">Value</th><th scope="col">Origin</th></tr>
                    </thead>
                    <tbody>
                        {operations.map((op) => (
                            <tr key={op.id}>
                                <th scope="row">{op.timestamp.toLocaleTimeString()}</th>
                                <td>{op.config.label}</td>
                                <td><code>{op.operation}</code></td>
                                <td>
                                    {op.similarity ? `${op.similarity.toFixed(1)}% match` : ''}
                                    {op.value ? `${op.value > 0 ? '+' : ''}${op.value}` : ''}
                                </td>
                                <td>{op.isReal ? 'From the debate server' : 'Sample'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </section>
    );
}
