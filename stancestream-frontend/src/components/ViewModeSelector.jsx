// Enhanced Navigation Component - Professional Mode Switcher
import React from 'react';
import Icon from './Icon';
import { Button } from './ui/Button';

const ViewModeSelector = ({ viewMode, setViewMode, className = '' }) => {
    const modes = [
        {
            key: 'standard',
            label: 'Standard',
            icon: 'target',
            description: 'Single debate with analysis',
            gradient: 'from-blue-600 to-indigo-600'
        },
        {
            key: 'multi-debate',
            label: 'Multi-Debate',
            icon: 'layers',
            description: 'Concurrent debates',
            gradient: 'from-purple-600 to-pink-600'
        },
        {
            key: 'analytics',
            label: 'Analytics',
            icon: 'bar-chart-3',
            description: 'Performance metrics',
            gradient: 'from-emerald-600 to-green-600'
        },
        {
            key: 'business',
            label: 'Business',
            icon: 'trending-up',
            description: 'Cache hit measurements',
            gradient: 'from-cyan-600 to-blue-600'
        },
        {
            key: 'showcase',
            label: 'Showcase',
            icon: 'award',
            description: 'Platform demonstration',
            gradient: 'from-green-600 to-emerald-600'
        }
    ];

    return (
        <div className={`glass-panel rounded-2xl p-2 ${className}`}>
            <div className="grid grid-cols-5 gap-2">
                {modes.map((mode) => {
                    const isActive = viewMode === mode.key;

                    return (
                        <button
                            key={mode.key}
                            onClick={() => setViewMode(mode.key)}
                            className={`relative overflow-hidden rounded-xl p-4 transition-all duration-300 group ${isActive
                                    ? 'shadow-lg'
                                    : 'hover:shadow-md hover:scale-[1.02]'
                                }`}
                        >
                            {/* Background Gradient */}
                            <div className={`absolute inset-0 bg-gradient-to-r ${mode.gradient} ${isActive ? 'opacity-100' : 'opacity-20 group-hover:opacity-40'
                                } transition-opacity duration-300`}></div>

                            {/* Content */}
                            <div className="relative z-10 text-center">
                                <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center ${isActive
                                        ? 'bg-white/20 backdrop-blur-sm'
                                        : 'bg-white/10 group-hover:bg-white/20'
                                    } transition-all duration-300`}>
                                    <Icon
                                        name={mode.icon}
                                        size={24}
                                        className={`${isActive ? 'text-white' : 'text-white/70'} transition-colors duration-300`}
                                    />
                                </div>

                                <h3 className={`font-semibold text-sm mb-1 ${isActive ? 'text-white' : 'text-white/80'
                                    } transition-colors duration-300`}>
                                    {mode.label}
                                </h3>

                                <p className={`text-xs leading-tight ${isActive ? 'text-white/90' : 'text-white/60'
                                    } transition-colors duration-300`}>
                                    {mode.description}
                                </p>
                            </div>

                            {/* Active Indicator */}
                            {isActive && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/40 rounded-b-xl"></div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Mode Description */}
            <div className="mt-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div className="flex items-center space-x-3">
                    <Icon
                        name={modes.find(m => m.key === viewMode)?.icon || 'target'}
                        size={20}
                        className="text-green-400"
                    />
                    <div>
                        <h4 className="text-white font-medium">
                            {modes.find(m => m.key === viewMode)?.label} Mode
                        </h4>
                        <p className="text-slate-400 text-sm">
                            {modes.find(m => m.key === viewMode)?.description}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewModeSelector;
