import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import api from '../services/api';

const AgentConfig = ({ isVisible, onClose, agentId = 'senatorbot' }) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isVisible && agentId) {
            loadProfile();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isVisible, agentId]);

    const loadProfile = async () => {
        setLoading(true);
        try {
            console.log('📡 Loading profile for agent:', agentId);
            const agentProfile = await api.getAgentProfile(agentId);
            console.log('✅ Profile loaded:', agentProfile);
            setProfile(agentProfile);
        } catch (error) {
            console.error('❌ Failed to load profile:', error);
            // Show a more user-friendly error
            setProfile({
                name: agentId === 'senatorbot' ? 'SenatorBot' : 'ReformerBot',
                role: 'AI Agent',
                tone: 'measured',
                stance: {
                    climate_policy: 0.5,
                    economic_risk: 0.5
                },
                biases: ['analytical thinking', 'evidence-based reasoning']
            });
        } finally {
            setLoading(false);
        }
    };

    const saveProfile = async () => {
        setSaving(true);
        try {
            await api.updateAgentProfile(agentId, profile);
            alert('Agent profile updated successfully!');
        } catch (error) {
            console.error('Failed to save profile:', error);
            alert('Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    const updateProfile = (field, value) => {
        setProfile(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const updateStance = (topic, value) => {
        setProfile(prev => ({
            ...prev,
            stance: {
                ...prev.stance,
                [topic]: parseFloat(value)
            }
        }));
    };

    const updateBiases = (biases) => {
        setProfile(prev => ({
            ...prev,
            biases: biases.split(',').map(b => b.trim()).filter(b => b)
        }));
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-slate-700 shadow-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4 border-b border-slate-600">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <span className="text-white text-lg">
                                    {agentId === 'senatorbot' ? '👔' : '🔥'}
                                </span>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    {profile?.name || agentId}
                                </h2>
                                <p className="text-slate-400 text-sm">Agent Configuration</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-5rem)]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center mb-4">
                                <Icon name="loading" size={20} className="animate-spin text-slate-400" />
                            </div>
                            <p className="text-slate-400">Loading agent profile...</p>
                        </div>
                    ) : profile ? (
                        <div className="p-6 space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                                        Agent Name
                                    </label>
                                    <input
                                        type="text"
                                        value={profile.name}
                                        onChange={(e) => updateProfile('name', e.target.value)}
                                        className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                                        Role
                                    </label>
                                    <input
                                        type="text"
                                        value={profile.role}
                                        onChange={(e) => updateProfile('role', e.target.value)}
                                        className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>

                            {/* Tone */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">
                                    Communication Tone
                                </label>
                                <select
                                    value={profile.tone}
                                    onChange={(e) => updateProfile('tone', e.target.value)}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                >
                                    <option value="measured">Measured & Diplomatic</option>
                                    <option value="passionate">Passionate & Energetic</option>
                                    <option value="analytical">Analytical & Data-Driven</option>
                                    <option value="diplomatic">Diplomatic & Consensus-Building</option>
                                    <option value="aggressive">Aggressive & Confrontational</option>
                                    <option value="cautious">Cautious & Risk-Averse</option>
                                </select>
                            </div>

                            {/* Stances */}
                            <div>
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                                    <Icon name="analytics" size={18} />
                                    <span>Policy Stances</span>
                                </h3>
                                <div className="space-y-4">
                                    {Object.entries(profile.stance || {}).map(([topic, value]) => (
                                        <div key={topic} className="bg-slate-700/50 rounded-xl p-4">
                                            <div className="flex justify-between items-center mb-3">
                                                <label className="text-sm font-semibold text-slate-200">
                                                    {topic.replace('_', ' ').toUpperCase()}
                                                </label>
                                                <span className="text-lg font-bold text-blue-400">
                                                    {(value * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="1"
                                                step="0.1"
                                                value={value}
                                                onChange={(e) => updateStance(topic, e.target.value)}
                                                className="w-full h-3 bg-slate-600 rounded-lg appearance-none cursor-pointer slider"
                                            />
                                            <div className="flex justify-between text-xs text-slate-400 mt-2">
                                                <span className="flex items-center gap-1">
                                                    <Icon name="against" size={12} className="text-red-400" />
                                                    Against
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Icon name="neutral" size={12} className="text-gray-400" />
                                                    Neutral
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Icon name="support" size={12} className="text-green-400" />
                                                    Support
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Biases */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">
                                    📊 Core Beliefs & Biases
                                </label>
                                <textarea
                                    value={profile.biases?.join(', ') || ''}
                                    onChange={(e) => updateBiases(e.target.value)}
                                    rows="4"
                                    className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                    placeholder="Enter core beliefs separated by commas (e.g., fiscal responsibility, environmental protection, individual liberty)"
                                />
                                <p className="text-xs text-slate-400 mt-2">
                                    These beliefs influence how the agent approaches debates and forms arguments
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                                <Icon name="error" size={20} className="text-red-400" />
                            </div>
                            <p className="text-red-400 font-medium">Failed to load agent profile</p>
                            <p className="text-slate-400 text-sm mt-2">Check console for details</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {profile && (
                    <div className="bg-slate-700/50 px-6 py-4 border-t border-slate-600">
                        <div className="flex gap-3">
                            <button
                                onClick={saveProfile}
                                disabled={saving}
                                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg flex items-center justify-center space-x-2"
                            >
                                {saving ? (
                                    <Icon name="loading" size={16} className="animate-spin" />
                                ) : (
                                    <Icon name="save" size={16} />
                                )}
                                <span>{saving ? 'Saving Changes...' : 'Save Changes'}</span>
                            </button>
                            <button
                                onClick={onClose}
                                className="px-6 bg-slate-600 hover:bg-slate-500 text-white font-semibold py-3 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AgentConfig;
