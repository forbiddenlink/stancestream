import React, { useState } from 'react';
import Icon from './Icon';

const TopicSelector = ({ onTopicChange, currentTopic, disabled }) => {
    const [showCustom, setShowCustom] = useState(false);
    const [customTopic, setCustomTopic] = useState('');

    const predefinedTopics = [
        {
            id: 'climate_policy',
            name: 'Climate Change Policy',
            description: 'Environmental regulations vs economic growth',
            icon: 'climate'
        },
        {
            id: 'ai_regulation',
            name: 'AI Regulation & Ethics',
            description: 'Government oversight of artificial intelligence',
            icon: 'ai'
        },
        {
            id: 'healthcare_reform',
            name: 'Universal Healthcare',
            description: 'Single-payer vs private insurance systems',
            icon: 'healthcare'
        },
        {
            id: 'immigration_policy',
            name: 'Immigration & Border Security',
            description: 'Border control vs humanitarian considerations',
            icon: 'immigration'
        },
        {
            id: 'education_funding',
            name: 'Education System Reform',
            description: 'Public funding vs school choice initiatives',
            icon: 'education'
        },
        {
            id: 'tax_policy',
            name: 'Progressive Taxation',
            description: 'Wealth redistribution and income inequality',
            icon: 'taxation'
        },
        {
            id: 'social_media',
            name: 'Social Media Regulation',
            description: 'Content moderation vs free speech protections',
            icon: 'network'
        },
        {
            id: 'space_policy',
            name: 'Space Exploration Funding',
            description: 'Public NASA vs private space ventures',
            icon: 'space'
        }
    ];

    const handleTopicSelect = (topic) => {
        onTopicChange(topic.name);
        setShowCustom(false);
    };

    const handleCustomSubmit = () => {
        if (customTopic.trim()) {
            onTopicChange(customTopic.trim());
            setCustomTopic('');
            setShowCustom(false);
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-bold text-green-300 mb-3 flex items-center space-x-2 font-mono">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    <span>Select debate topic</span>
                </label>

                {/* Predefined Topics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {predefinedTopics.map((topic) => (
                        <button
                            key={topic.id}
                            onClick={() => handleTopicSelect(topic)}
                            disabled={disabled}
                            className={`p-4 rounded-xl border text-left transition-all duration-200 transform hover:scale-[1.02] shadow-lg ${currentTopic === topic.name
                                    ? 'bg-slate-100 border-slate-100 text-black'
                                    : 'bg-black/80 border-green-500/30 text-green-300 hover:bg-green-900/20 hover:border-green-400'
                                } ${disabled ? 'opacity-50 cursor-not-allowed transform-none' : ''}`}
                        >
                            <div className="flex items-center space-x-3 mb-2">
                                <Icon name={topic.icon} size={32} className={currentTopic === topic.name ? "text-black" : "text-green-400"} />
                                <span className={`font-bold text-sm font-mono ${currentTopic === topic.name ? "text-black" : "text-green-300"}`}>
                                    {topic.name}
                                </span>
                            </div>
                            <div className={`text-xs font-mono ${currentTopic === topic.name ? "text-black" : "text-slate-400"}`}>
                                {topic.description}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Custom Topic */}
                <div className="border-t border-green-500/30 pt-4">
                    {!showCustom ? (
                        <button
                            onClick={() => setShowCustom(true)}
                            disabled={disabled}
                            className="w-full p-4 bg-black/60 border-2 border-dashed border-green-500/30 rounded-xl text-green-300 text-left hover:bg-green-900/20 hover:border-green-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                            <div className="flex items-center space-x-3 mb-2">
                                <Icon name="enhance" size={20} className="text-green-400" />
                                <span className="font-bold text-sm font-mono">Custom topic</span>
                            </div>
                            <div className="text-xs text-green-200 font-mono">Enter your own debate topic for AI agents to discuss</div>
                        </button>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center space-x-3 mb-3">
                                <Icon name="enhance" size={20} className="text-green-400" />
                                <span className="font-bold text-green-300 font-mono">Create custom topic</span>
                            </div>
                            <input
                                type="text"
                                value={customTopic}
                                onChange={(e) => setCustomTopic(e.target.value)}
                                placeholder="e.g., Cryptocurrency regulation and financial innovation..."
                                className="w-full bg-black/80 border border-green-500/30 rounded-xl px-4 py-3 text-green-300 placeholder-green-400/50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-400 transition-all font-mono"
                                onKeyPress={(e) => e.key === 'Enter' && handleCustomSubmit()}
                                autoFocus
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={handleCustomSubmit}
                                    disabled={!customTopic.trim()}
                                    className="flex-1 bg-arena-b hover:bg-arena-b-deep disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-black font-bold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg shadow-green-500/30 font-mono"
                                >
                                    <Icon name="play" size={16} className="mr-2" />
                                    Start custom debate
                                </button>
                                <button
                                    onClick={() => {
                                        setShowCustom(false);
                                        setCustomTopic('');
                                    }}
                                    className="px-6 bg-black/80 border border-green-500/30 hover:bg-green-900/20 text-green-300 font-bold py-3 rounded-xl transition-colors font-mono"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TopicSelector;
