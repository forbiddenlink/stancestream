import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import api from '../services/api';

const KeyMomentsPanel = ({ debateId, viewMode = 'standard' }) => {
    const [keyMoments, setKeyMoments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ total_moments: 0 });
    const [lastUpdate, setLastUpdate] = useState(null);

    // Fetch key moments based on view mode
    const fetchKeyMoments = async () => {
        try {
            setLoading(true);
            
            let response;
            if (viewMode === 'standard' && debateId) {
                // Single debate mode - get moments for specific debate
                response = await api.get(`/debate/${debateId}/key-moments?limit=10`);
                console.log('📊 Key moments API response:', response.data);
                setKeyMoments(response.data?.moments || []);
                setStats(response.data?.stats || { total_moments: 0 });
            } else if (viewMode === 'multi-debate' || viewMode === 'analytics') {
                // Multi-debate or analytics mode - get all moments
                response = await api.get('/key-moments/all?limit=15');
                console.log('📊 All key moments API response:', response.data);
                setKeyMoments(response.data?.moments || []);
                setStats({ total_moments: response.data?.total || 0 });
            } else {
                // No specific debate, clear moments
                setKeyMoments([]);
                setStats({ total_moments: 0 });
            }
            
            setLastUpdate(new Date().toISOString());
            
        } catch (error) {
            console.error('Error fetching key moments:', error);
            setKeyMoments([]);
            setStats({ total_moments: 0 });
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch and refresh on debate/mode changes with debouncing
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchKeyMoments();
        }, 100); // Small delay to batch rapid changes
        
        return () => clearTimeout(timeoutId);
    }, [debateId, viewMode]);

    // Auto-refresh every 45 seconds (reduced frequency)
    useEffect(() => {
        // Automatic polling disabled to reduce server load
        // const interval = setInterval(fetchKeyMoments, 60000);
        // return () => clearInterval(interval);
        
        // Only fetch on manual refresh or when debate changes
        return () => {}; // No cleanup needed
    }, [debateId, viewMode]);

    // Handle WebSocket key moment updates
    useEffect(() => {
        const handleKeyMomentCreated = (event) => {
            if (event.detail?.type === 'key_moment_created') {
                const { moment, debateId: eventDebateId } = event.detail;
                
                // Only add if it's relevant to current view
                if (viewMode === 'standard' && eventDebateId === debateId) {
                    setKeyMoments(prev => [moment, ...prev.slice(0, 9)]);
                    setStats(prev => ({ ...prev, total_moments: prev.total_moments + 1 }));
                } else if (viewMode !== 'standard') {
                    setKeyMoments(prev => [moment, ...prev.slice(0, 14)]);
                    setStats(prev => ({ ...prev, total_moments: prev.total_moments + 1 }));
                }
            }
        };

        window.addEventListener('websocket-message', handleKeyMomentCreated);
        return () => window.removeEventListener('websocket-message', handleKeyMomentCreated);
    }, [debateId, viewMode]);

    const getMomentIcon = (type) => {
        switch (type) {
            case 'stance_flip': return 'trending-up';
            case 'questionable_claim': return 'alert-triangle';
            case 'memory_milestone': return 'activity';
            default: return 'star';
        }
    };

    const getMomentStyle = (type, significance) => {
        const base = 'relative p-4 rounded-xl border border-green-500/20 bg-surface-card transition-all hover:shadow-lg hover:shadow-green-500/20 hover:z-30 z-10 hover:scale-[1.02] duration-150';
        
        if (type === 'stance_flip') {
            return significance === 'major' 
                ? `${base} bg-green-900/30 border-green-500/50`
                : `${base} bg-green-800/20 border-green-500/30`;
        } else if (type === 'questionable_claim') {
            return significance === 'critical'
                ? `${base} bg-green-700/30 border-green-400/50`
                : `${base} bg-green-600/30 border-green-400/30`;
        } else if (type === 'memory_milestone') {
            return significance === 'major'
                ? `${base} bg-green-600/30 border-green-300/50`
                : `${base} bg-green-500/20 border-green-300/30`;
        }
        
        return `${base} bg-green-500/30 border-green-500/30`;
    };

    const getMomentLabel = (type, significance) => {
        const labels = {
            stance_flip: significance === 'major' ? 'MAJOR STANCE SHIFT' : 'STANCE CHANGE',
            questionable_claim: significance === 'critical' ? 'CRITICAL FACT ISSUE' : 'QUESTIONABLE CLAIM',
            memory_milestone: significance === 'major' ? 'MAJOR MILESTONE' : 'MEMORY MILESTONE'
        };
        return labels[type] || 'KEY MOMENT';
    };

    const getMomentColor = (type) => {
        const colors = {
            stance_flip: 'text-green-400',
            questionable_claim: 'text-green-300',
            memory_milestone: 'text-green-200'
        };
        return colors[type] || 'text-green-400';
    };

    const formatTimeAgo = (timestamp) => {
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now - time;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'JUST NOW';
        if (diffMins < 60) return `${diffMins}M AGO`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}H AGO`;
        return `${Math.floor(diffMins / 1440)}D AGO`;
    };

    const getTitle = () => {
        if (viewMode === 'standard') {
            return debateId ? 'KEY MOMENTS' : 'KEY MOMENTS';
        } else if (viewMode === 'multi-debate') {
            return 'KEY MOMENTS - ALL ACTIVE DEBATES';
        } else {
            return 'KEY MOMENTS ANALYTICS - SYSTEM WIDE';
        }
    };

    const getSubtitle = () => {
        if (viewMode === 'standard') {
            return debateId ? `CURRENT DEBATE: ${debateId}` : 'NO ACTIVE DEBATE';
        } else if (viewMode === 'multi-debate') {
            return 'REAL-TIME MOMENTS ACROSS ALL CONCURRENT DEBATES';
        } else {
            return 'COMPREHENSIVE ANALYSIS OF ALL SIGNIFICANT DEBATE MOMENTS';
        }
    };

    return (
        <section className="relative h-full flex flex-col bg-black/95 border border-green-500/30 rounded-xl p-4 shadow-2xl shadow-green-500/10 z-20">
            {/* Matrix Header */}
            <div className="flex flex-col gap-2 mb-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-green-400 flex items-center font-mono tracking-wide">
                        <Icon name="star" size={20} className="mr-2 text-green-400" />
                        {getTitle()}
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="text-xs bg-green-500/20 border border-green-500/30 px-2 py-1 rounded-full text-green-400 font-medium font-mono">
                            {stats.total_moments} TOTAL
                        </span>
                        <button
                            onClick={fetchKeyMoments}
                            disabled={loading}
                            className="p-1 text-neutral-400 hover:text-green-400 transition-colors duration-150"
                            title="Refresh key moments"
                        >
                            <Icon name="refresh" size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>
                
                {/* Matrix Subtitle */}
                <p className="text-sm text-neutral-400 leading-relaxed font-mono">
                    {getSubtitle()}
                </p>
                
                {/* Matrix Detection Criteria Info */}
                <div className="flex flex-wrap gap-2 text-xs font-mono">
                    <span className="bg-green-500/10 text-green-400 px-2 py-1 rounded border border-green-500/20">
                        STANCE FLIPS &gt;0.3
                    </span>
                    <span className="bg-green-400/10 text-green-300 px-2 py-1 rounded border border-green-400/20">
                        FACT CONFIDENCE &lt;0.7
                    </span>
                    <span className="bg-green-300/10 text-green-200 px-2 py-1 rounded border border-green-300/20">
                        MEMORY MILESTONES
                    </span>
                </div>
            </div>

            {/* Matrix Content - Improved spacing and visibility */}
            <div className="flex-1 flex flex-col min-h-0 pb-16">
                {loading && keyMoments.length === 0 ? (
                    <div className="text-center py-6 flex-1 flex flex-col justify-center">
                        <div className="w-10 h-10 bg-black/80 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Icon name="loader" size={20} className="text-green-400 animate-spin" />
                        </div>
                        <p className="text-neutral-400 text-sm font-mono">LOADING KEY MOMENTS...</p>
                    </div>
                ) : keyMoments.length === 0 ? (
                    <div className="text-center py-6 flex-1 flex flex-col justify-center">
                        <div className="w-10 h-10 bg-black/80 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Icon name="star" size={20} className="text-green-400" />
                        </div>
                        <p className="text-neutral-400 text-sm font-mono">NO KEY MOMENTS YET</p>
                        <p className="text-neutral-500 text-xs mt-1 font-mono">
                            MAJOR STANCE FLIPS (&gt;0.3) OR QUESTIONABLE CLAIMS (&lt;0.7) WILL APPEAR HERE
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4 overflow-y-auto overflow-x-hidden flex-1 relative z-10 pr-2" style={{ maxHeight: 'calc(100vh - 20rem)' }}>
                        {keyMoments.map((moment, index) => (
                            <div key={`${moment.id}_${index}_${moment.timestamp || Date.now()}`} className={`${getMomentStyle(moment.type, moment.significance)} mb-4`}>
                                {/* Matrix Header with Enhanced Visual Hierarchy */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="p-2 rounded-lg bg-green-500/20 border border-green-500/30 flex-shrink-0">
                                            <Icon 
                                                name={getMomentIcon(moment.type)} 
                                                size={18} 
                                                className={getMomentColor(moment.type)} 
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className={`text-sm font-semibold ${getMomentColor(moment.type)} block font-mono leading-tight`}>
                                                {getMomentLabel(moment.type, moment.significance)}
                                            </span>
                                            <span className="text-xs text-neutral-400 font-mono mt-1 block">
                                                {formatTimeAgo(moment.timestamp)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Matrix Summary with Enhanced Typography */}
                                <div className="mb-4">
                                    <p className="text-green-100 text-sm leading-relaxed font-medium font-mono">
                                        {moment.summary}
                                    </p>
                                </div>

                                {/* Matrix Metadata with Enhanced Layout */}
                                <div className="space-y-3">
                                    {moment.metadata?.agentId && (
                                        <div className="flex items-center gap-2">
                                            <Icon name="user" size={14} className="text-neutral-400 flex-shrink-0" />
                                            <span className="text-xs text-green-300 capitalize font-medium font-mono">
                                                {moment.metadata.agentId.toUpperCase()}
                                            </span>
                                            {viewMode !== 'standard' && moment.metadata?.debateId && (
                                                <>
                                                    <span className="text-neutral-500">•</span>
                                                    <span className="text-xs text-neutral-400 font-mono truncate">
                                                        {moment.metadata.debateId.length > 15 ? 
                                                            moment.metadata.debateId.substring(0, 15) + '...' : 
                                                            moment.metadata.debateId
                                                        }
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {/* Matrix Specific metadata with visual indicators */}
                                    {moment.type === 'stance_flip' && moment.metadata?.change && (
                                        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-2 rounded">
                                            <Icon name="trending-up" size={14} className="text-green-400 flex-shrink-0" />
                                            <span className="text-xs text-green-300 font-medium font-mono">
                                                {(moment.metadata.change * 100).toFixed(1)}% STANCE SHIFT
                                            </span>
                                        </div>
                                    )}

                                    {moment.type === 'questionable_claim' && moment.metadata?.factCheckScore !== undefined && (
                                        <div className="flex items-center gap-2 bg-green-400/10 border border-green-400/20 px-3 py-2 rounded">
                                            <Icon name="shield" size={14} className="text-green-300 flex-shrink-0" />
                                            <span className="text-xs text-green-200 font-medium font-mono">
                                                {(moment.metadata.factCheckScore * 100).toFixed(1)}% FACT CONFIDENCE
                                            </span>
                                        </div>
                                    )}

                                    {moment.type === 'memory_milestone' && moment.metadata?.messageCount && (
                                        <div className="flex items-center gap-2 bg-green-300/10 border border-green-300/20 px-3 py-2 rounded">
                                            <Icon name="message-circle" size={14} className="text-green-200 flex-shrink-0" />
                                            <span className="text-xs text-green-100 font-medium font-mono">
                                                {moment.metadata.messageCount} MESSAGES REACHED
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Matrix AI Generated Badge */}
                                {moment.analysis?.ai_generated && (
                                    <div className="mt-4 pt-3 border-t border-green-500/30">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Icon name="activity" size={12} className="text-green-400" />
                                                <span className="text-xs text-green-400 font-medium font-mono">AI ANALYSIS</span>
                                            </div>
                                            <span className="text-xs text-neutral-500 font-mono">
                                                GPT-4 GENERATED
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Matrix Footer - Positioned absolutely at bottom */}
            {lastUpdate && (
                <div className="absolute bottom-4 left-4 right-4 pt-3 bg-gradient-to-t from-black/95 to-transparent border-t border-green-500/30">
                    <p className="text-xs text-neutral-500 flex items-center gap-1 bg-surface-card border border-green-500/20 px-2 py-1 rounded font-mono">
                        <Icon name="clock" size={10} />
                        LAST UPDATED: {formatTimeAgo(lastUpdate)}
                    </p>
                </div>
            )}
        </section>
    );
};

export default KeyMomentsPanel;
