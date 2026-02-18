// Enhanced Controls - Single interface for both standard and multi-debate modes
import { useState } from 'react';
import api from '../services/api';
import Icon from './Icon';

const DEBATE_TOPICS = [
    { id: 'climate', name: 'Climate Policy', description: 'Environmental regulations and green energy', icon: 'climate' },
    { id: 'ai', name: 'AI Regulation', description: 'Artificial intelligence governance and ethics', icon: 'ai' },
    { id: 'healthcare', name: 'Healthcare Reform', description: 'Universal healthcare and medical access', icon: 'healthcare' },
    { id: 'immigration', name: 'Immigration Policy', description: 'Border security and refugee assistance', icon: 'immigration' },
    { id: 'education', name: 'Education Reform', description: 'Public education and student debt', icon: 'education' },
    { id: 'taxation', name: 'Tax Policy', description: 'Progressive taxation and wealth redistribution', icon: 'taxation' },
    { id: 'privacy', name: 'Digital Privacy', description: 'Data protection and surveillance', icon: 'privacy' },
    { id: 'space', name: 'Space Exploration', description: 'Space colonization and research funding', icon: 'space' }
];

export default function EnhancedControls({ 
    viewMode, 
    activeDebates, 
    currentDebateId, 
    debateMessages = [], 
    isDebating = false,
    onMetricsUpdate, 
    onStopCurrentDebate, 
    onClearConversation,
    onDebateStarted 
}) {
    const [selectedTopics, setSelectedTopics] = useState(['climate']);
    const [customTopic, setCustomTopic] = useState('');
    const [isStarting, setIsStarting] = useState(false);
    const [isAddingTopic, setIsAddingTopic] = useState(false);
    const [lastStartTime, setLastStartTime] = useState(0); // Prevent rapid clicking

    const handleTopicToggle = (topicId) => {
        if (viewMode === 'standard') {
            // Standard mode: single selection
            setSelectedTopics([topicId]);
        } else {
            // Multi-debate mode: multiple selection
            setSelectedTopics(prev =>
                prev.includes(topicId)
                    ? prev.filter(id => id !== topicId)
                    : [...prev, topicId]
            );
        }
    };

    const addCustomTopic = () => {
        if (customTopic.trim()) {
            const customTopicObj = {
                id: `custom_${Date.now()}`,
                name: customTopic,
                description: customTopic.trim(),
                icon: 'idea'
            };

            DEBATE_TOPICS.push(customTopicObj);
            setSelectedTopics(prev => [...prev, customTopicObj.id]);
            setCustomTopic('');
            setIsAddingTopic(false);
        }
    };

    // Demo cache hit celebration for showcasing semantic caching business value
    const triggerCacheHitDemo = async () => {
        try {
            const scenarios = [
                { similarity: 0.95, cost_saved: 0.003 },
                { similarity: 0.87, cost_saved: 0.002 },
                { similarity: 0.92, cost_saved: 0.0025 }
            ];
            
            const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
            
            // Use the platform demo endpoint (will be proxied through /api)
            await api.post('/platform/demo/cache-efficiency', {
                similarity: randomScenario.similarity,
                cost_saved: randomScenario.cost_saved
            });
            
            console.log(`🎯 Cache hit demo triggered: ${(randomScenario.similarity * 100).toFixed(1)}% similarity`);
            // Dispatch event for LivePerformanceOverlay to show the cache hit
            window.dispatchEvent(new CustomEvent('websocket-message', {
                detail: {
                    type: 'cache_hit',
                    similarity: randomScenario.similarity,
                    cost_saved: randomScenario.cost_saved
                }
            }));
        } catch (error) {
            console.error('Failed to trigger cache hit demo:', error);
        }
    };

    const startDebates = async () => {
        if (selectedTopics.length === 0) {
            alert('Please select at least one topic');
            return;
        }

        // Prevent multiple simultaneous starts and rapid clicking
        const now = Date.now();
        if (isStarting || (now - lastStartTime < 2000)) {
            console.log('⚠️ Debate start already in progress or too soon, ignoring duplicate request');
            return;
        }

        setIsStarting(true);
        setLastStartTime(now);
        try {
            if (viewMode === 'multi-debate' && selectedTopics.length > 1) {
                // Multi-debate mode: start multiple debates
                const topics = selectedTopics.map(id =>
                    DEBATE_TOPICS.find(t => t.id === id)?.description || id
                );

                try {
                    await api.startMultipleDebates(topics);
                    console.log(`🚀 Started ${topics.length} concurrent debates!`);
                } catch {
                    // Fallback: start individually
                    for (const topic of topics) {
                        try {
                            await api.startDebate({
                                topic,
                                debateId: `multi_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
                            });
                        } catch (singleError) {
                            console.error(`Failed to start debate for: ${topic}`, singleError);
                        }
                    }
                }
            } else {
                // Standard mode: single debate
                // Stop current debate first if one is running (use isDebating for consistency)
                if (isDebating && onStopCurrentDebate) {
                    console.log('🛑 Stopping current debate before starting new one...');
                    try {
                        await onStopCurrentDebate();
                        // Wait for stop to be processed before starting new debate
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    } catch (stopError) {
                        console.error('Failed to stop current debate:', stopError);
                        // Continue anyway, but log the error
                    }
                }
                
                const topic = DEBATE_TOPICS.find(t => t.id === selectedTopics[0])?.description || selectedTopics[0];
                const response = await api.startDebate({ 
                    topic,
                    debateId: `standard_${Date.now()}_${Math.random().toString(36).substring(2, 8)}` // Use unique ID to prevent conflicts
                });
                console.log(`🎯 Started single debate: ${topic}`);
                
                // Notify parent of the new debate ID
                if (onDebateStarted && response.debateId) {
                    onDebateStarted(response.debateId);
                }
            }

            if (onMetricsUpdate) {
                onMetricsUpdate();
            }

        } catch (error) {
            console.error('Failed to start debates:', error);
            alert('Failed to start debates. Please try again.');
        } finally {
            setIsStarting(false);
        }
    };

    const stopAllDebates = async () => {
        try {
            console.log(`🛑 Stopping all ${activeDebates.size} active debates...`);
            
            // Use the new stop-all API endpoint
            const result = await api.stopAllDebates();
            console.log('✅ Stop all debates result:', result);
            
            if (onMetricsUpdate) {
                onMetricsUpdate();
            }
        } catch (error) {
            console.error('Failed to stop all debates:', error);
            // Fallback: try to stop each debate individually
            for (const [debateId] of activeDebates) {
                try {
                    await api.stopDebate(debateId);
                    console.log(`✅ Stopped debate: ${debateId}`);
                } catch (stopError) {
                    console.error(`Failed to stop debate ${debateId}:`, stopError);
                }
            }
        }
    };

    return (
        <div className="bg-surface-elevated backdrop-blur-sm border border-green-500/20 rounded-xl p-4 shadow-card">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

                {/* Column 1: Mode & Status */}
                <div className="lg:col-span-1">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-lg font-bold text-green-300 flex items-center gap-2 font-mono tracking-wide">
                            {viewMode === 'multi-debate' ? (
                                <>
                                    <Icon name="multi-debate" size={20} className="text-green-400" />
                                    MULTI-DEBATE
                                </>
                            ) : viewMode === 'analytics' ? (
                                <>
                                    <Icon name="analytics" size={20} className="text-green-400" />
                                    ANALYTICS DASHBOARD
                                </>
                            ) : (
                                <>
                                    <Icon name="target" size={20} className="text-green-400" />
                                    SINGLE DEBATE
                                </>
                            )}
                        </h2>
                        {viewMode === 'standard' && currentDebateId ? (
                            <div className="flex items-center gap-2">
                                <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-sm border border-green-500/30 font-mono">
                                    ACTIVE
                                </span>
                                <button
                                    onClick={onStopCurrentDebate}
                                    className="px-2 py-1 bg-red-600/20 border border-red-500/30 rounded-xl text-red-300 hover:bg-red-600/30 transition-all duration-150 text-sm flex items-center gap-1 font-mono"
                                >
                                    <Icon name="stop" size={14} />
                                    STOP
                                </button>
                                {debateMessages.length > 0 && (
                                    <button
                                        onClick={onClearConversation}
                                        className="px-2 py-1 bg-surface-card border border-green-500/20 rounded-xl text-green-300 hover:bg-green-500/10 transition-all duration-150 text-sm flex items-center gap-1 font-mono"
                                    >
                                        <Icon name="trash" size={14} />
                                        CLEAR
                                    </button>
                                )}
                            </div>
                        ) : viewMode === 'multi-debate' && activeDebates.size > 0 ? (
                            <div className="flex items-center gap-2">
                                <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-sm border border-green-500/30 font-mono">
                                    {activeDebates.size} ACTIVE
                                </span>
                                <button
                                    onClick={stopAllDebates}
                                    className="px-2 py-1 bg-red-600/20 border border-red-500/30 rounded-xl text-red-300 hover:bg-red-600/30 transition-all duration-150 text-sm flex items-center gap-1 font-mono"
                                >
                                    <Icon name="stop" size={14} />
                                    STOP ALL
                                </button>
                                {debateMessages.length > 0 && (
                                    <button
                                        onClick={onClearConversation}
                                        className="px-2 py-1 bg-black/60 border border-green-500/30 rounded text-green-300 hover:bg-green-900/20 transition-colors text-sm flex items-center gap-1 font-mono"
                                    >
                                        <Icon name="trash" size={14} />
                                        CLEAR ALL
                                    </button>
                                )}
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* Column 2-3: Topic Selection Grid - Hide in analytics mode */}
                {viewMode !== 'analytics' && (
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold text-green-300 font-mono tracking-wide">
                            {viewMode === 'multi-debate'
                                ? `TOPICS (${selectedTopics.length} SELECTED):`
                                : 'SELECT TOPIC:'
                            }
                        </h3>
                        <button
                            onClick={() => setIsAddingTopic(!isAddingTopic)}
                            className="text-xs bg-green-600/20 px-2 py-1 rounded border border-green-500/30 text-green-300 hover:bg-green-600/30 transition-colors flex items-center gap-1 font-mono tracking-wide"
                        >
                            {isAddingTopic ? (
                                <>
                                    <Icon name="remove" size={12} />
                                    CANCEL
                                </>
                            ) : (
                                <>
                                    <Icon name="add" size={12} />
                                    CUSTOM
                                </>
                            )}
                        </button>
                    </div>

                    {/* Custom Topic Input */}
                    {isAddingTopic && (
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={customTopic}
                                onChange={(e) => setCustomTopic(e.target.value)}
                                placeholder="Enter custom debate topic..."
                                className="flex-1 px-3 py-2 bg-surface-card border border-green-500/20 rounded-xl text-green-300 text-sm placeholder-green-500/40 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/40 font-mono transition-all duration-150"
                                onKeyPress={(e) => e.key === 'Enter' && addCustomTopic()}
                            />
                            <button
                                onClick={addCustomTopic}
                                disabled={!customTopic.trim()}
                                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 font-mono tracking-wide ${customTopic.trim()
                                        ? 'bg-green-500/20 border border-green-500/30 text-green-300 hover:bg-green-500/30 hover:border-green-500/50'
                                        : 'bg-surface-card border border-green-500/10 text-neutral-500 cursor-not-allowed'
                                    }`}
                            >
                                ADD
                            </button>
                        </div>
                    )}

                    {/* Topic Grid - Responsive layout */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                        {DEBATE_TOPICS.map(topic => (
                            <label
                                key={topic.id}
                                className={`
                  flex items-center justify-center p-2 sm:p-3 rounded-xl border cursor-pointer transition-all duration-150 text-xs sm:text-sm font-mono tracking-wide
                  ${selectedTopics.includes(topic.id)
                                        ? 'bg-green-500/20 border-green-500/50 text-green-300 shadow-glow'
                                        : 'bg-surface-card border-green-500/20 text-green-300 hover:border-green-500/40 hover:bg-green-500/10'
                                    }
                `}
                            >
                                <input
                                    type={viewMode === 'multi-debate' ? 'checkbox' : 'radio'}
                                    name="topic"
                                    checked={selectedTopics.includes(topic.id)}
                                    onChange={() => handleTopicToggle(topic.id)}
                                    className="sr-only"
                                />
                                <span className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 font-bold text-center min-w-0">
                                    <Icon name={topic.icon} size={14} className="flex-shrink-0 sm:size-4 text-green-400" />
                                    <span className="truncate text-xs sm:text-sm leading-tight">{topic.name.toUpperCase()}</span>
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
                )}

                {/* Analytics Mode Info Panel */}
                {viewMode === 'analytics' && (
                <div className="lg:col-span-2">
                    <div className="bg-surface-card border border-green-500/20 rounded-xl p-3 shadow-card">
                        <h3 className="text-sm font-bold text-green-300 mb-2 font-mono tracking-wide">PERFORMANCE MONITORING</h3>
                        <div className="text-xs text-green-200/80 space-y-1 font-mono">
                            <div>• REAL-TIME REDIS METRICS AND OPERATIONS</div>
                            <div>• MULTI-MODEL DATABASE PERFORMANCE (JSON, STREAMS, TIMESERIES, VECTOR)</div>
                            <div>• DEBATE ENGINE STATISTICS AND AGENT INTERACTIONS</div>
                            <div>• SYSTEM HEALTH AND CONNECTION MONITORING</div>
                        </div>
                        <div className="mt-2 text-xs text-green-400 flex items-center gap-1 font-mono">
                            <Icon name="idea" size={14} />
                            SWITCH TO STANDARD OR MULTI-DEBATE MODE TO START NEW DEBATES
                        </div>
                    </div>
                </div>
                )}

                {/* Column 4: Action Buttons & Active Debates */}
                <div className="lg:col-span-1">
                    <div className="flex flex-col gap-2">
                        {viewMode !== 'analytics' ? (
                            <button
                                onClick={startDebates}
                                disabled={selectedTopics.length === 0 || isStarting || (viewMode === 'standard' && isDebating)}
                                className={`
                    w-full px-3 py-2 rounded-xl font-bold transition-all duration-150 text-sm flex items-center justify-center font-mono tracking-wide
                    ${selectedTopics.length > 0 && !isStarting && !(viewMode === 'standard' && isDebating)
                                        ? 'bg-green-500/20 border border-green-500/30 text-green-300 hover:bg-green-500/30 hover:border-green-500/50 shadow-glow'
                                        : 'bg-surface-card border border-green-500/10 text-neutral-500 cursor-not-allowed'
                                    }
                  `}
                            >
                                {isStarting ? (
                                    <>
                                        <Icon name="loading" size={16} className="animate-spin mr-2" />
                                        STARTING...
                                    </>
                                ) : viewMode === 'standard' && isDebating ? (
                                    <>
                                        <Icon name="pause" size={16} className="mr-2" />
                                        DEBATE ACTIVE
                                    </>
                                ) : viewMode === 'multi-debate' ? (
                                    <>
                                        <Icon name="play" size={16} className="mr-2" />
                                        START {selectedTopics.length}
                                    </>
                                ) : (
                                    <>
                                        <Icon name="target" size={16} className="mr-2" />
                                        START DEBATE
                                    </>
                                )}
                            </button>
                        ) : (
                            <div className="w-full px-3 py-2 rounded-xl bg-surface-card border border-green-500/20 text-center text-sm text-green-400 flex items-center justify-center gap-2 font-mono tracking-wide">
                                <Icon name="analytics" size={16} />
                                ANALYTICS VIEW ACTIVE
                            </div>
                        )}

                        {/* Cache Hit Demo Button - Showcase Semantic Caching Business Value */}
                        <button
                            onClick={triggerCacheHitDemo}
                            className="w-full px-3 py-2 rounded-xl font-bold transition-all duration-150 text-sm flex items-center justify-center bg-green-500/20 border border-green-500/30 text-green-300 hover:bg-green-500/30 hover:border-green-500/50 shadow-glow font-mono tracking-wide"
                        >
                            <Icon name="zap" size={16} className="mr-2" />
                            DEMO CACHE HIT
                        </button>

                        {/* Active Debates Compact View */}
                        {activeDebates.size > 0 && (
                            <div className="mt-2">
                                <div className="text-xs text-green-400 mb-1 font-mono tracking-wide">ACTIVE:</div>
                                <div className="space-y-1 max-h-24 overflow-y-auto scrollbar-thin">
                                    {Array.from(activeDebates.entries()).slice(0, 4).map(([id, debate]) => (
                                        <div
                                            key={id}
                                            className="text-xs bg-surface-card px-2 py-1 rounded-xl border border-green-500/20 text-green-300 font-mono"
                                        >
                                            <div className="font-bold truncate">{debate.topic.toUpperCase()}</div>
                                            <div className="text-green-500">{debate.messageCount || 0} MSGS</div>
                                        </div>
                                    ))}
                                    {activeDebates.size > 4 && (
                                        <div className="text-xs text-green-400 text-center font-mono">
                                            +{activeDebates.size - 4} MORE...
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
