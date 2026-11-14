// True Multi-Debate Viewer - Shows multiple debates simultaneously
import { useState, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import api from '../services/api';

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

function DebateColumn({ debate, messages, onTopicChange, onStop }) {
    const [isChangingTopic, setIsChangingTopic] = useState(false);
    const [selectedTopic, setSelectedTopic] = useState('climate');

    const debateMessages = messages.filter(msg => msg.debateId === debate.id);
    const recentMessages = debateMessages.slice(-10); // Show last 10 messages

    const handleTopicChange = async () => {
        const newTopic = DEBATE_TOPICS.find(t => t.id === selectedTopic)?.description;
        if (newTopic && onTopicChange) {
            await onTopicChange(debate.id, newTopic);
            setIsChangingTopic(false);
        }
    };
    return (
        <article className="md-col" aria-label={`Debate: ${debate.topic}`}>
            <header className="md-head">
                <div>
                    <h3>{debate.topic}</h3>
                    <p>{debateMessages.length} turns recorded. Status: {debate.status}.</p>
                </div>
                <div className="md-actions">
                    <button type="button" className="btn-plain" onClick={() => setIsChangingTopic(!isChangingTopic)} aria-expanded={isChangingTopic}>
                        Change topic
                    </button>
                    <button type="button" className="btn-plain" onClick={() => onStop && onStop(debate.id)}>
                        Stop
                    </button>
                </div>
            </header>

            {isChangingTopic && (
                <div className="md-change">
                    <label>
                        Topic
                        <select
                            aria-label="Debate topic"
                            value={selectedTopic}
                            onChange={(e) => setSelectedTopic(e.target.value)}
                        >
                            {DEBATE_TOPICS.map(topic => (
                                <option key={topic.id} value={topic.id}>{topic.name}</option>
                            ))}
                        </select>
                    </label>
                    <button type="button" className="btn-primary" onClick={handleTopicChange}>Change</button>
                    <button type="button" className="btn-plain" onClick={() => setIsChangingTopic(false)}>Cancel</button>
                </div>
            )}

            {recentMessages.length === 0 ? (
                <p className="section-note">Empty record. Turns appear here as this debate runs.</p>
            ) : (
                <ol className="md-turns">
                    {recentMessages.map((msg, msgIndex) => (
                        <li key={`${msg.id}-${msgIndex}`}>
                            <p className={`md-who ${msg.agentId === 'reformerbot' ? 'side-b' : 'side-a'}`}>
                                {msg.sender}
                                <span className="md-time">
                                    {msg.timestamp ? formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true }) : ''}
                                </span>
                            </p>
                            <p className="md-text">{msg.text || msg.message}</p>
                            {msg.factCheck && (
                                <p className="md-fact">Fact check: {msg.factCheck.fact}</p>
                            )}
                        </li>
                    ))}
                </ol>
            )}
        </article>
    );
}

export default function TrueMultiDebateViewer({ messages, activeDebates, onMetricsUpdate }) {
    const [maxDebates, setMaxDebates] = useState(4);

    // Convert activeDebates Map to array
    const activeDebatesArray = useMemo(() => {
        return Array.from(activeDebates.entries())
            .map(([id, data]) => ({ id, ...data }))
            .slice(0, maxDebates);
    }, [activeDebates, maxDebates]);

    const handleTopicChange = async (debateId, newTopic) => {
        try {
            console.log(`🔄 Changing topic for debate ${debateId} to: ${newTopic}`);

            // Stop the old debate
            await api.stopDebate(debateId);

            // Wait a moment for the stop to process
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Start a new debate with the new topic
            await api.startDebate({
                topic: newTopic,
                debateId: `changed_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
            });

            if (onMetricsUpdate) {
                onMetricsUpdate();
            }
        } catch (error) {
            console.error('Failed to change topic:', error);
            alert('Failed to change topic. Please try again.');
        }
    };

    const handleStopDebate = async (debateId) => {
        try {
            await api.stopDebate(debateId);
            if (onMetricsUpdate) {
                onMetricsUpdate();
            }
        } catch (error) {
            console.error('Failed to stop debate:', error);
        }
    };

    const startNewDebate = async () => {
        try {
            // Use the first available topic instead of hardcoding
            const defaultTopic = DEBATE_TOPICS[0]?.description || 'General Policy Discussion';
            await api.startDebate({
                topic: defaultTopic,
                debateId: `new_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
            });
            if (onMetricsUpdate) {
                onMetricsUpdate();
            }
        } catch (error) {
            console.error('Failed to start new debate:', error);
        }
    };
    return (
        <section className="view-pane" aria-labelledby="md-title">
            <div className="md-top">
                <div>
                    <h2 id="md-title">Multi-debate</h2>
                    <p className="section-note">{activeDebatesArray.length} {activeDebatesArray.length === 1 ? 'debate' : 'debates'} shown.</p>
                </div>
                <div className="md-actions">
                    <label>
                        Show
                        <select
                            aria-label="Number of debates"
                            value={maxDebates}
                            onChange={(e) => setMaxDebates(Number(e.target.value))}
                        >
                            <option value={2}>2 debates</option>
                            <option value={3}>3 debates</option>
                            <option value={4}>4 debates</option>
                            <option value={6}>6 debates</option>
                        </select>
                    </label>
                    <button type="button" className="btn-plain" onClick={startNewDebate}>New debate</button>
                </div>
            </div>

            {activeDebatesArray.length === 0 ? (
                <div>
                    <p className="section-note">No debates are running. Start one and its record appears here.</p>
                    <button type="button" className="btn-primary" onClick={startNewDebate}>Start first debate</button>
                </div>
            ) : (
                <div className="md-grid">
                    {activeDebatesArray.map((debate) => (
                        <DebateColumn
                            key={debate.id}
                            debate={debate}
                            messages={messages}
                            onTopicChange={handleTopicChange}
                            onStop={handleStopDebate}
                        />
                    ))}
                </div>
            )}
            {activeDebatesArray.length > 0 && (
                <p className="section-note">{messages.length} turns recorded across all debates.</p>
            )}
        </section>
    );
}
