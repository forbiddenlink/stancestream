import React, { useState } from 'react';
import api from '../services/api';
import AgentConfig from './AgentConfig';
import PerformanceDashboard from './PerformanceDashboard';
import DebateHistoryBrowser from './DebateHistoryBrowser';
import Icon from './Icon';

const Controls = () => {
    const [topic, setTopic] = useState('climate change policy');
    const [isDebating, setIsDebating] = useState(false);
    const [currentDebateId, setCurrentDebateId] = useState(null);
    const [showAgentConfig, setShowAgentConfig] = useState(false);
    const [showPerformanceDashboard, setShowPerformanceDashboard] = useState(false);
    const [showDebateHistory, setShowDebateHistory] = useState(false);
    const [showAdvancedTools, setShowAdvancedTools] = useState(false);
    const [showCustomTopic, setShowCustomTopic] = useState(false);
    const [customTopicInput, setCustomTopicInput] = useState('');
    const [selectedAgent, setSelectedAgent] = useState('senatorbot');
    const [loading, setLoading] = useState({
        start: false,
        stop: false,
        addFact: false,
        summarize: false
    });

    const agents = [
        { id: 'senatorbot', name: 'SenatorBot', color: 'bg-blue-600' },
        { id: 'reformerbot', name: 'ReformerBot', color: 'bg-green-500' }
    ];

    const handleStartDebate = async () => {
        console.log('🎯 Start Debate clicked!');
        setLoading(prev => ({ ...prev, start: true }));
        try {
            // Stop any existing debate first
            if (currentDebateId) {
                console.log('🛑 Stopping existing debate before starting new one...');
                try {
                    await api.stopDebate(currentDebateId);
                    console.log('✅ Previous debate stopped successfully');
                } catch (stopError) {
                    console.warn('⚠️ Failed to stop previous debate:', stopError);
                }
            }

            console.log('🚀 Calling API to start debate...');
            const debateId = `debate_${Date.now()}`;
            const result = await api.startDebate({
                debateId: debateId,
                topic,
                agents: ['senatorbot', 'reformerbot']
            });
            console.log('✅ Debate started successfully:', result);
            setCurrentDebateId(debateId);
            setIsDebating(true);
        } catch (error) {
            console.error('❌ Failed to start debate:', error);
            alert('Failed to start debate. Check console for details.');
        } finally {
            setLoading(prev => ({ ...prev, start: false }));
        }
    };

    const handleStopDebate = async () => {
        if (!currentDebateId) {
            console.warn('⚠️ No active debate to stop');
            setIsDebating(false);
            return;
        }

        console.log('🛑 Stop Debate clicked!');
        setLoading(prev => ({ ...prev, stop: true }));
        try {
            console.log(`🚀 Calling API to stop debate: ${currentDebateId}...`);
            const result = await api.stopDebate(currentDebateId);
            console.log('✅ Debate stopped successfully:', result);
            setIsDebating(false);
            // Don't clear currentDebateId - keep it so messages remain visible
            // setCurrentDebateId(null); // Commented out to preserve conversation
        } catch (error) {
            console.error('❌ Failed to stop debate:', error);
            alert('Failed to stop debate. Check console for details.');
            // Still set to false in case of API error to prevent UI getting stuck
            setIsDebating(false);
        } finally {
            setLoading(prev => ({ ...prev, stop: false }));
        }
    };

    const handleClearConversation = () => {
        console.log('🧹 Clear Conversation clicked!');
        // Note: This component doesn't manage debateMessages directly
        // The parent App.jsx component handles this via onClearConversation callback
        console.log('✅ Clear conversation requested - parent will handle');
    };

    const handleAddFact = async () => {
        setLoading(prev => ({ ...prev, addFact: true }));
        try {
            const fact = prompt('Enter a new fact to add to the knowledge base:');
            if (fact && fact.trim()) {
                console.log('📝 Adding fact to knowledge base...');
                const result = await api.addFact(fact.trim());
                console.log('✅ Fact added successfully:', result);
                alert(`Fact added successfully! ID: ${result.factId}`);
            }
        } catch (error) {
            console.error('❌ Failed to add fact:', error);
            alert('Failed to add fact. Check console for details.');
        } finally {
            setLoading(prev => ({ ...prev, addFact: false }));
        }
    };

    // The summary is model output and the popup shares our origin, so it must be text, not markup.
    const escapeHtml = (value) => String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const handleSummarize = async () => {
        setLoading(prev => ({ ...prev, summarize: true }));
        try {
            console.log('📊 Generating debate summary...');
            const result = await api.generateSummary('live_debate', 20);
            console.log('✅ Summary generated:', result);

            if (result.success) {
                // Create a simple modal to show the summary
                const summaryWindow = window.open('', '_blank', 'width=800,height=600');
                summaryWindow.document.write(`
                    <html>
                        <head><title>Debate Summary</title></head>
                        <body style="font-family: Arial, sans-serif; padding: 20px; background: #1e293b; color: white;">
                            <h1>📊 StanceStream Debate Summary</h1>
                            <div style="background: #334155; padding: 20px; border-radius: 10px; margin: 20px 0;">
                                <h2>Key Points</h2>
                                <pre style="white-space: pre-wrap; background: #475569; padding: 15px; border-radius: 5px;">${escapeHtml(result.summary ?? '')}</pre>
                            </div>
                            <div style="background: #334155; padding: 20px; border-radius: 10px;">
                                <h2>Metadata</h2>
                                <p><strong>Messages Analyzed:</strong> ${escapeHtml(result.metadata?.messageCount || 'N/A')}</p>
                                <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
                            </div>
                        </body>
                    </html>
                `);
                summaryWindow.document.close();
            } else {
                alert('Failed to generate summary: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('❌ Failed to generate summary:', error);
            alert('Failed to generate summary. Check console for details.');
        } finally {
            setLoading(prev => ({ ...prev, summarize: false }));
        }
    };

    const openAgentConfig = (agentId) => {
        console.log('🔧 Opening config for agent:', agentId);
        setSelectedAgent(agentId);
        setShowAgentConfig(true);
    };

    return (
        <>
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 shadow-sm">
                {/* Main Control Bar - Single Row */}
                <div className="p-3">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        
                        {/* Left: Topic Dropdown */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full lg:w-auto">
                            <label className="text-sm font-medium text-slate-300 whitespace-nowrap">Topic:</label>
                            {!showCustomTopic ? (
                                <div className="flex items-center gap-2">
                                    <select
                                        value={topic}
                                        onChange={(e) => {
                                            if (e.target.value === 'custom') {
                                                setShowCustomTopic(true);
                                                setCustomTopicInput('');
                                            } else {
                                                setTopic(e.target.value);
                                            }
                                        }}
                                        disabled={isDebating}
                                        className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto sm:min-w-[200px]"
                                    >
                                        <option value="climate change policy">Climate Change Policy</option>
                                        <option value="AI Regulation & Ethics">AI Regulation & Ethics</option>
                                        <option value="Universal Healthcare">Universal Healthcare</option>
                                        <option value="Immigration & Border Security">Immigration & Border Security</option>
                                        <option value="Education System Reform">Education System Reform</option>
                                        <option value="Progressive Taxation">Progressive Taxation</option>
                                        <option value="Social Media Regulation">Social Media Regulation</option>
                                        <option value="Space Exploration Funding">Space Exploration Funding</option>
                                        <option value="custom">Custom Topic...</option>
                                    </select>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={customTopicInput}
                                        onChange={(e) => setCustomTopicInput(e.target.value)}
                                        placeholder="Enter custom debate topic..."
                                        className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent w-full sm:w-auto sm:min-w-[250px]"
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && customTopicInput.trim()) {
                                                setTopic(customTopicInput.trim());
                                                setShowCustomTopic(false);
                                            }
                                        }}
                                        autoFocus
                                    />
                                    <button
                                        onClick={() => {
                                            if (customTopicInput.trim()) {
                                                setTopic(customTopicInput.trim());
                                                setShowCustomTopic(false);
                                            }
                                        }}
                                        disabled={!customTopicInput.trim()}
                                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg text-sm transition-colors"
                                        title="Set Custom Topic"
                                    >
                                        ✓
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowCustomTopic(false);
                                            setCustomTopicInput('');
                                        }}
                                        className="bg-slate-600 hover:bg-slate-500 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                                        title="Cancel"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Center: Main Actions */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                            <button
                                onClick={handleStartDebate}
                                disabled={isDebating || loading.start}
                                className="flex items-center justify-center space-x-1 sm:space-x-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold py-2 px-3 sm:px-4 md:px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-md w-full sm:w-auto min-w-0"
                            >
                                <span className="flex-shrink-0">
                                    {loading.start ? (
                                        <svg className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </span>
                                <span className="truncate text-xs sm:text-sm">{loading.start ? 'Starting...' : 'Start Debate'}</span>
                            </button>
                            
                            <button
                                onClick={handleStopDebate}
                                disabled={!isDebating || loading.stop}
                                className="flex items-center justify-center space-x-1 sm:space-x-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold py-2 px-3 sm:px-4 md:px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-md w-full sm:w-auto min-w-0"
                            >
                                <span className="flex-shrink-0">
                                    {loading.stop ? (
                                        <svg className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 012 0v4a1 1 0 11-2 0V7zM12 9a1 1 0 000 2v2a1 1 0 002 0V9a1 1 0 00-2 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </span>
                                <span className="truncate text-xs sm:text-sm">{loading.stop ? 'Stopping...' : 'Stop Debate'}</span>
                            </button>

                            <button
                                onClick={handleClearConversation}
                                disabled={false} // Always allow clearing
                                className="flex items-center justify-center space-x-1 sm:space-x-2 bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 disabled:from-slate-700 disabled:to-slate-800 disabled:cursor-not-allowed text-white font-semibold py-2 px-3 sm:px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-md w-full sm:w-auto min-w-0"
                            >
                                <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 102 0V7z" clipRule="evenodd" />
                                </svg>
                                <span className="truncate text-xs sm:text-sm">Clear</span>
                            </button>
                        </div>

                        {/* Right: Status + More Tools Dropdown */}
                        <div className="flex items-center gap-3">
                            {/* Status Indicator */}
                            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${isDebating
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-slate-600/50 text-slate-400'
                                }`}>
                                <div className={`w-2 h-2 rounded-full ${isDebating ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
                                    }`}></div>
                                <span>{isDebating ? 'Live' : 'Idle'}</span>
                            </div>

                            {/* More Tools Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowAdvancedTools(!showAdvancedTools)}
                                    className={`p-2 ${showAdvancedTools ? 'bg-blue-600' : 'bg-slate-700'} hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-2`}
                                    title="More Tools"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-sm">Tools</span>
                                    <svg className={`w-4 h-4 transition-transform ${showAdvancedTools ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Expandable Advanced Tools Section */}
                {showAdvancedTools && (
                    <div className="border-t border-slate-700/50 p-3 bg-slate-800/30">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            
                            {/* Analytics & Monitoring */}
                            <div>
                                <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                                    </svg>
                                    Analytics
                                </h4>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => {
                                            setShowPerformanceDashboard(true);
                                            setShowAdvancedTools(false);
                                        }}
                                        className="w-full flex items-center space-x-2 p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                                        </svg>
                                        <span>Performance Dashboard</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowDebateHistory(true);
                                            setShowAdvancedTools(false);
                                        }}
                                        className="w-full flex items-center space-x-2 p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                        </svg>
                                        <span>Debate History</span>
                                    </button>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div>
                                <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Quick Actions
                                </h4>
                                <div className="space-y-2">
                                    <button
                                        onClick={handleAddFact}
                                        disabled={loading.addFact}
                                        className="w-full flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-medium py-2 px-3 rounded-lg transition-all duration-200 text-sm"
                                    >
                                        <span>
                                            {loading.addFact ? (
                                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                                                </svg>
                                            )}
                                        </span>
                                        <span>{loading.addFact ? 'Adding...' : 'Add Fact'}</span>
                                    </button>
                                    <button
                                        onClick={handleSummarize}
                                        disabled={loading.summarize}
                                        className="w-full flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-medium py-2 px-3 rounded-lg transition-all duration-200 text-sm"
                                    >
                                        <span>
                                            {loading.summarize ? (
                                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3h2v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm2.5 5a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0zm5-1.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </span>
                                        <span>{loading.summarize ? 'Generating...' : 'Summary'}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Agent Configuration */}
                            <div>
                                <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                                    </svg>
                                    Agent Setup
                                </h4>
                                <div className="space-y-2">
                                    {agents.map((agent) => (
                                        <button
                                            key={agent.id}
                                            onClick={() => {
                                                openAgentConfig(agent.id);
                                                setShowAdvancedTools(false);
                                            }}
                                            disabled={isDebating}
                                            className={`w-full flex items-center justify-between p-2 ${agent.color} hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200`}
                                        >
                                            <div className="flex items-center space-x-2">
                                                <div className="w-4 h-4 flex items-center justify-center">
                                                    {agent.id === 'senatorbot' ? (
                                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <span className="text-sm">{agent.name}</span>
                                            </div>
                                            <svg className="w-4 h-4 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Agent Configuration Modal */}
            < AgentConfig
                isVisible={showAgentConfig}
                onClose={() => setShowAgentConfig(false)}
                agentId={selectedAgent}
            />

            {/* Performance Dashboard Modal */}
            < PerformanceDashboard
                isVisible={showPerformanceDashboard}
                onClose={() => setShowPerformanceDashboard(false)}
            />

            {/* Debate History Browser Modal */}
            <DebateHistoryBrowser
                isVisible={showDebateHistory}
                onClose={() => setShowDebateHistory(false)}
            />
        </>
    );
};

export default Controls;
