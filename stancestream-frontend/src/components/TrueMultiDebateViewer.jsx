// True Multi-Debate Viewer - Shows multiple debates simultaneously
import { useState, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
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

function DebateColumn({ debate, messages, onTopicChange, onStop, index }) {
    const [isChangingTopic, setIsChangingTopic] = useState(false);
    const [selectedTopic, setSelectedTopic] = useState('climate');

    const debateMessages = messages.filter(msg => msg.debateId === debate.id);
    const recentMessages = debateMessages.slice(-10); // Show last 10 messages

    const getAgentColor = (agentId) => {
        return agentId === 'senatorbot' ? 'text-green-200' : 'text-green-400';
    };

    const getDebateColor = () => {
        const colors = [
            'border-green-500/30 bg-green-900/10',
            'border-green-400/30 bg-green-800/10', 
            'border-green-600/30 bg-green-900/15',
            'border-green-300/30 bg-green-700/10',
            'border-green-500/20 bg-green-800/15',
            'border-green-400/20 bg-green-900/10'
        ];
        return colors[index % colors.length];
    };

    const handleTopicChange = async () => {
        const newTopic = DEBATE_TOPICS.find(t => t.id === selectedTopic)?.description;
        if (newTopic && onTopicChange) {
            await onTopicChange(debate.id, newTopic);
            setIsChangingTopic(false);
        }
    };

    return (
        <div className={`flex flex-col h-full border rounded-xl p-2 sm:p-3 ${getDebateColor()} min-h-0 overflow-hidden shadow-lg`}>
            {/* Debate Header */}
            <div className="flex items-center justify-between mb-2 sm:mb-3 pb-2 border-b border-green-500/30 flex-shrink-0">
                <div className="min-w-0 flex-1 pr-2">
                    <h3 className="font-bold text-green-300 text-xs sm:text-sm truncate font-mono">{debate.topic}</h3>
                    <div className="text-xs text-green-400 font-mono">
                        {debateMessages.length} messages • {debate.status}
                    </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                    <button
                        onClick={() => setIsChangingTopic(!isChangingTopic)}
                        className="text-xs bg-green-600/20 px-1.5 sm:px-2 py-1 rounded border border-green-500/30 text-green-300 hover:bg-green-600/30 transition-colors flex items-center font-mono"
                    >
                        <Icon name="settings" size={12} />
                    </button>
                    <button
                        onClick={() => onStop && onStop(debate.id)}
                        className="text-xs bg-red-600/20 px-1.5 sm:px-2 py-1 rounded border border-red-500/30 text-red-300 hover:bg-red-600/30 transition-colors flex items-center font-mono"
                    >
                        <Icon name="stop" size={12} />
                    </button>
                </div>
            </div>

            {/* Topic Change Interface */}
            {isChangingTopic && (
                <div className="mb-2 p-2 bg-black/60 rounded border border-green-500/30 flex-shrink-0 shadow-lg">
                    <div className="text-xs text-green-300 mb-2 font-mono">Change topic:</div>
                    <select
                        aria-label="Debate topic"
                        value={selectedTopic}
                        onChange={(e) => setSelectedTopic(e.target.value)}
                        className="w-full px-2 py-1 bg-black/80 border border-green-500/30 rounded text-xs text-green-300 mb-2 font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        {DEBATE_TOPICS.map(topic => (
                            <option key={topic.id} value={topic.id}>
                                {topic.name}
                            </option>
                        ))}
                    </select>
                    <div className="flex flex-col sm:flex-row gap-1">
                        <button
                            onClick={handleTopicChange}
                            className="flex-1 px-2 py-1 bg-green-500 text-black text-xs rounded hover:bg-green-400 transition-colors font-mono font-bold"
                        >
                            Change
                        </button>
                        <button
                            onClick={() => setIsChangingTopic(false)}
                            className="px-2 py-1 bg-black/80 border border-green-500/30 text-green-300 text-xs rounded hover:bg-green-900/20 transition-colors font-mono font-bold"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto space-y-1 sm:space-y-2 min-h-0">
                {recentMessages.length === 0 ? (
                    <div className="text-center text-green-400 py-4 sm:py-8">
                        <div className="w-8 h-8 sm:w-12 sm:h-12 bg-green-700/20 border border-green-500/30 rounded-full flex items-center justify-center mb-2 sm:mb-3 mx-auto">
                            <Icon name="message" size={16} className="sm:hidden text-green-500" />
                            <Icon name="message" size={24} className="hidden sm:block text-green-500" />
                        </div>
                        <div className="text-xs font-mono">No messages yet</div>
                    </div>
                ) : (
                    recentMessages.map((msg, msgIndex) => (
                        <div
                            key={`${msg.id}-${msgIndex}`}
                            className="p-1.5 sm:p-2 rounded-lg bg-black/40 border border-green-500/20 shadow-lg"
                        >
                            {/* Message Header */}
                            <div className="flex items-center justify-between mb-1">
                                <span className={`text-xs font-bold ${getAgentColor(msg.agentId)} truncate flex-1 pr-2 font-mono`}>
                                    {msg.sender}
                                </span>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    {msg.factCheck && (
                                        <span className="text-xs bg-green-600/20 px-1 py-0.5 rounded text-green-400 flex items-center gap-1 border border-green-500/30">
                                            <Icon name="success" size={8} />
                                        </span>
                                    )}
                                    <span className="text-xs text-green-400 hidden sm:inline font-mono">
                                        {msg.timestamp ? formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true }) : 'NOW'}
                                    </span>
                                </div>
                            </div>

                            {/* Message Content */}
                            <div className="text-green-200 text-xs leading-relaxed break-words font-mono">
                                {msg.text || msg.message}
                            </div>

                            {/* Fact Check */}
                            {msg.factCheck && (
                                <div className="mt-1 p-1 bg-green-900/20 border border-green-500/30 rounded text-xs shadow-lg">
                                    <div className="text-green-400 font-bold text-xs font-mono">Fact:</div>
                                    <div className="text-green-200 text-xs break-words font-mono">{msg.factCheck.fact}</div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Status Footer */}
            <div className="mt-2 pt-2 border-t border-green-500/30 text-center flex-shrink-0">
                <div className="flex items-center justify-center gap-2 text-xs text-green-400 font-mono">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    Live • {debate.messageCount || 0} total
                </div>
            </div>
        </div>
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
        <div className="h-full flex flex-col max-w-full overflow-hidden bg-gradient-to-br from-black/90 to-gray-900/90 backdrop-blur-sm rounded-xl p-2 sm:p-4 border border-green-500/30 shadow-lg shadow-green-500/10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-2 sm:gap-0 flex-shrink-0">
                <h2 className="text-lg sm:text-xl font-bold text-green-300 flex items-center gap-2 font-mono">
                    <Icon name="multi-debate" size={20} className="mr-2 text-green-400" />
                    <span className="hidden sm:inline">Multi-debate arena</span>
                    <span className="sm:hidden">Multi-debate</span>
                    <span className="text-xs bg-green-500/20 px-2 py-1 rounded-full text-green-400 border border-green-500/30 font-mono">
                        {activeDebatesArray.length} active
                    </span>
                </h2>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                        aria-label="Number of debates"
                        value={maxDebates}
                        onChange={(e) => setMaxDebates(Number(e.target.value))}
                        className="px-2 py-1 bg-black/80 border border-green-500/30 rounded text-xs text-green-300 flex-1 sm:flex-none font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        <option value={2}>2 debates</option>
                        <option value={3}>3 debates</option>
                        <option value={4}>4 debates</option>
                        <option value={6}>6 debates</option>
                    </select>
                    <button
                        onClick={startNewDebate}
                        className="px-2 sm:px-3 py-1 bg-green-600/20 border border-green-500/30 rounded text-green-300 text-xs hover:bg-green-600/30 transition-colors flex items-center gap-1 flex-shrink-0 font-mono font-bold"
                    >
                        <Icon name="add" size={14} />
                        <span className="hidden sm:inline">New debate</span>
                        <span className="sm:hidden">New</span>
                    </button>
                </div>
            </div>

            {/* Multi-Debate Grid */}
            <div className="flex-1 min-h-0 overflow-hidden">
                {activeDebatesArray.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-green-400">
                        <div className="text-center max-w-md mx-auto">
                            <div className="w-16 h-16 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center mb-4 mx-auto shadow-lg">
                                <Icon name="multi-debate" size={32} className="text-green-400" />
                            </div>
                            <div className="text-lg mb-2 font-mono font-bold">No active debates</div>
                            <div className="text-sm font-mono text-green-300">Start multiple debates to see them here simultaneously</div>
                            <button
                                onClick={startNewDebate}
                                className="mt-4 px-4 py-2 bg-green-500 text-black rounded hover:bg-green-400 transition-colors flex items-center gap-2 mx-auto font-mono font-bold shadow-lg shadow-green-500/30"
                            >
                                <Icon name="play" size={16} />
                                Start first debate
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className={`
            grid gap-2 sm:gap-3 h-full overflow-hidden
            ${activeDebatesArray.length === 1 ? 'grid-cols-1' :
                            activeDebatesArray.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
                                activeDebatesArray.length <= 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2' :
                                    'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3'}
          `}>
                        {activeDebatesArray.map((debate, index) => (
                            <DebateColumn
                                key={debate.id}
                                debate={debate}
                                messages={messages}
                                onTopicChange={handleTopicChange}
                                onStop={handleStopDebate}
                                index={index}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Summary Footer */}
            {activeDebatesArray.length > 0 && (
                <div className="mt-4 p-3 bg-black/60 rounded-lg border border-green-500/30 shadow-lg">
                    <div className="flex justify-between items-center text-sm">
                        <div className="text-green-300 font-mono">
                            <span className="font-bold">{activeDebatesArray.length}</span> concurrent debates •{' '}
                            <span className="font-bold">
                                {messages.length}
                            </span> total messages
                        </div>
                        <div className="flex items-center gap-2 text-xs text-green-400 font-mono">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            Real-time updates
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
