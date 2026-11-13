import React, { useState, useEffect } from 'react';
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debateId, viewMode]);

    // Auto-refresh disabled to reduce server load
    // Only fetch on manual refresh or when debate changes
    // Dependencies intentionally empty - polling is disabled

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
    const getMomentLabel = (type, significance) => {
        const labels = {
            stance_flip: significance === 'major' ? 'Major stance shift' : 'Stance change',
            questionable_claim: significance === 'critical' ? 'Critical fact issue' : 'Questionable claim',
            memory_milestone: significance === 'major' ? 'Major milestone' : 'Memory milestone'
        };
        return labels[type] || 'Key moment';
    };

    const formatTimeAgo = (timestamp) => {
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now - time;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return `${Math.floor(diffMins / 1440)}d ago`;
    };

    const subtitle = viewMode === 'standard'
        ? (debateId ? `Current debate: ${debateId}.` : 'No active debate.')
        : viewMode === 'multi-debate'
            ? 'Moments across all concurrent debates.'
            : 'All significant moments the server has recorded.';

    return (
        <div className="km">
            <p className="section-note">
                {subtitle} A moment is recorded when a stance moves by more than 0.3, a fact check scores
                below 0.7, or a memory milestone is reached.
            </p>
            <p className="km-bar">
                <span>{stats.total_moments} recorded</span>
                <button type="button" className="btn-plain" onClick={fetchKeyMoments} disabled={loading}>
                    {loading ? 'Refreshing' : 'Refresh'}
                </button>
                {lastUpdate && <span>Last updated {formatTimeAgo(lastUpdate)}</span>}
            </p>

            {loading && keyMoments.length === 0 ? (
                <p className="section-note" role="status">Loading key moments.</p>
            ) : keyMoments.length === 0 ? (
                <p className="section-note">
                    No key moments yet. Stance moves over 0.3 and fact checks under 0.7 appear here.
                </p>
            ) : (
                <ol className="km-list">
                    {keyMoments.map((moment, index) => (
                        <li key={`${moment.id}_${index}_${moment.timestamp ?? ''}`}>
                            <p className="km-label">
                                {getMomentLabel(moment.type, moment.significance)}
                                <span className="km-time">{formatTimeAgo(moment.timestamp)}</span>
                            </p>
                            <p className="km-summary">{moment.summary}</p>
                            <p className="km-meta">
                                {moment.metadata?.agentId && <span>{moment.metadata.agentId}</span>}
                                {viewMode !== 'standard' && moment.metadata?.debateId && (
                                    <span>
                                        {moment.metadata.debateId.length > 15
                                            ? moment.metadata.debateId.substring(0, 15) + '...'
                                            : moment.metadata.debateId}
                                    </span>
                                )}
                                {moment.type === 'stance_flip' && moment.metadata?.change && (
                                    <span>Stance moved {(moment.metadata.change * 100).toFixed(1)}%</span>
                                )}
                                {moment.type === 'questionable_claim' && moment.metadata?.factCheckScore !== undefined && (
                                    <span>Fact confidence {(moment.metadata.factCheckScore * 100).toFixed(1)}%</span>
                                )}
                                {moment.type === 'memory_milestone' && moment.metadata?.messageCount && (
                                    <span>{moment.metadata.messageCount} messages reached</span>
                                )}
                                {moment.analysis?.ai_generated && <span>Summary written by a model</span>}
                            </p>
                        </li>
                    ))}
                </ol>
            )}
        </div>
    );
};

export default KeyMomentsPanel;
