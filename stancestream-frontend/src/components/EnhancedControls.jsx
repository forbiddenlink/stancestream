// Enhanced Controls - Single interface for both standard and multi-debate modes
import { useState } from 'react';
import api from '../services/api';
import { BASE_DEBATE_TOPICS } from '../data/debateTopics';

// Copy: addCustomTopic below pushes custom topics onto this list.
const DEBATE_TOPICS = [...BASE_DEBATE_TOPICS];

export default function EnhancedControls({ 
    viewMode, 
    activeDebates, 
    currentDebateId, 
    debateMessages = [], 
    isDebating = false,
    onMetricsUpdate, 
    onStopCurrentDebate, 
    onClearConversation,
    onDebateStarted,
    onShowMatrix,
    onShowIntro
}) {
    const [selectedTopics, setSelectedTopics] = useState(() => {
        // The home page links here with ?topic=<id>.
        const wanted = new URLSearchParams(window.location.search).get('topic');
        return [DEBATE_TOPICS.some(t => t.id === wanted) ? wanted : 'climate'];
    });
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

    const multi = viewMode === 'multi-debate';
    const startDisabled = selectedTopics.length === 0 || isStarting || (viewMode === 'standard' && isDebating);

    if (viewMode === 'analytics') {
        return (
            <p className="ctl-note">
                Analytics shows Redis metrics and debate engine statistics. Switch to Standard or
                Multi-debate to start a debate.
            </p>
        );
    }

    return (
        <div className="ctl-grid">
            <fieldset className="ctl-topics">
                <legend>{multi ? `Topics, ${selectedTopics.length} selected` : 'Choose the topic for the record'}</legend>
                <div className="topic-list">
                    {DEBATE_TOPICS.map(topic => (
                        <label key={topic.id} className={selectedTopics.includes(topic.id) ? 'is-on' : ''}>
                            <input
                                type={multi ? 'checkbox' : 'radio'}
                                name="topic"
                                checked={selectedTopics.includes(topic.id)}
                                onChange={() => handleTopicToggle(topic.id)}
                            />
                            <span>{topic.name}</span>
                        </label>
                    ))}
                </div>
            </fieldset>

            <div className="ctl-side">
                <div className="ctl-actions">
                    <button type="button" className="btn-primary" onClick={startDebates} disabled={startDisabled}>
                        {isStarting
                            ? 'Starting'
                            : viewMode === 'standard' && isDebating
                                ? 'Debate running'
                                : multi
                                    ? `Start ${selectedTopics.length} ${selectedTopics.length === 1 ? 'debate' : 'debates'}`
                                    : 'Start debate'}
                    </button>
                    {viewMode === 'standard' && currentDebateId && isDebating && (
                        <button type="button" className="btn-plain" onClick={onStopCurrentDebate}>Stop</button>
                    )}
                    {multi && activeDebates.size > 0 && (
                        <button type="button" className="btn-plain" onClick={stopAllDebates}>Stop all</button>
                    )}
                    {debateMessages.length > 0 && (viewMode === 'standard' ? currentDebateId : multi) && (
                        <button type="button" className="btn-plain" onClick={onClearConversation}>
                            {multi ? 'Clear all' : 'Clear record'}
                        </button>
                    )}
                </div>

                <details className="tools">
                    <summary>Tools</summary>
                    <div className="tools-body">
                        <button type="button" className="btn-plain" onClick={triggerCacheHitDemo}>Demo cache hit</button>
                        <button type="button" className="btn-plain" onClick={onShowMatrix}>Redis matrix</button>
                        <button type="button" className="btn-plain" onClick={onShowIntro}>Intro</button>
                        <button type="button" className="btn-plain" onClick={() => setIsAddingTopic(!isAddingTopic)}>
                            {isAddingTopic ? 'Cancel custom topic' : 'Custom topic'}
                        </button>
                        {isAddingTopic && (
                            <>
                                <input
                                    type="text"
                                    aria-label="Custom debate topic"
                                    value={customTopic}
                                    onChange={(e) => setCustomTopic(e.target.value)}
                                    placeholder="Enter a debate topic"
                                    onKeyDown={(e) => e.key === 'Enter' && addCustomTopic()}
                                />
                                <button type="button" className="btn-plain" onClick={addCustomTopic} disabled={!customTopic.trim()}>
                                    Add
                                </button>
                            </>
                        )}
                    </div>
                </details>

                {multi && activeDebates.size > 0 && (
                    <ul className="active-list" aria-label="Running debates">
                        {Array.from(activeDebates.entries()).slice(0, 4).map(([id, debate]) => (
                            <li key={id}>{debate.topic}, {debate.messageCount || 0} turns</li>
                        ))}
                        {activeDebates.size > 4 && <li>and {activeDebates.size - 4} more</li>}
                    </ul>
                )}
            </div>
        </div>
    );
}
