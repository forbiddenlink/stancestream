import React from 'react';
import Icon from './Icon';
import { Container, Flex } from './ui';

const Header = ({ connectionStatus = 'Disconnected', backendHealth = 'unknown', onShowIntro }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'Connected':
            case 'healthy':
                return 'text-green-400';
            case 'Disconnected':
            case 'error':
                return 'text-red-400';
            default:
                return 'text-green-400';
        }
    };

    const getStatusDot = (status) => {
        switch (status) {
            case 'Connected':
            case 'healthy':
                return 'bg-green-400 shadow-glow animate-pulse';
            case 'Disconnected':
            case 'error':
                return 'bg-red-400';
            default:
                return 'bg-green-400 animate-pulse';
        }
    };

    return (
        <header className="bg-surface-elevated border-b border-green-500/20 shadow-elevated sticky top-0 z-50 animate-slide-in-down backdrop-blur-sm">
            <Container maxWidth="max-w-7xl" padding="px-2 sm:px-4 lg:px-8">
                <Flex justify="between" align="center" className="min-h-[4.5rem] lg:min-h-[5.75rem] py-2">
                    {/* Matrix Logo and Title */}
                    <Flex align="center" gap="gap-2 sm:gap-3 lg:gap-4" className="min-w-0 flex-1 sm:flex-none">
                        <div className="relative flex-shrink-0" aria-hidden="true">
                            <svg viewBox="0 0 56 56" className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14" fill="none">
                                <rect x="1" y="1" width="54" height="54" rx="10" fill="#eef2ef" stroke="#17201b" strokeWidth="2" />
                                <path d="M10 20H46M10 36H46" stroke="#8a9a90" strokeWidth="2" strokeLinecap="round" />
                                <circle cx="22" cy="20" r="6" fill="#24505f" />
                                <circle cx="40" cy="20" r="6" fill="#b32f12" />
                                <circle cx="35" cy="36" r="6" fill="#24505f" />
                                <circle cx="17" cy="36" r="6" fill="#b32f12" />
                            </svg>
                        </div>
                        <div className="flex flex-col min-w-0">
                            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-50 leading-none">
                                StanceStream
                            </h1>
                            <p className="text-slate-300 text-[11px] sm:text-xs lg:text-sm font-semibold font-mono mt-1">
                                Live AI debate intelligence platform
                            </p>
</div>
                    </Flex>

                    {/* Matrix Status Indicators */}
                    <Flex align="center" gap="gap-2 sm:gap-4 lg:gap-6" className="flex-shrink-0">
                        {/* Show Intro Button */}
                        {onShowIntro && (
                            <button
                                onClick={onShowIntro}
                                className="bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 hover:border-green-500/40 text-green-400 hover:text-green-300 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold font-mono transition-all duration-150 flex items-center space-x-1 sm:space-x-2"
                                title="Show platform introduction"
                            >
                                <Icon name="play-circle" size={14} className="sm:hidden" />
                                <Icon name="play-circle" size={16} className="hidden sm:block" />
                                <span className="hidden sm:inline">Intro</span>
                            </button>
                        )}
                        
                        {/* Connection Status Grid - Hidden on small screens */}
                        <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
                            {/* WebSocket Status */}
                            <div className="flex items-center space-x-2 lg:space-x-3">
                                <div className="text-right">
                                    <div className="flex items-center space-x-1 lg:space-x-2">
                                        <span className="text-gray-400 text-xs lg:text-sm font-medium font-mono">WebSocket</span>
                                        <div className={`status-indicator ${connectionStatus === 'Connected' ? 'online' : 'offline'}`}></div>
                                    </div>
                                </div>
                                <span className={`text-xs lg:text-sm font-semibold font-mono ${getStatusColor(connectionStatus)}`}>
                                    {connectionStatus}
                                </span>
                            </div>

                            {/* Backend Status */}
                            <div className="flex items-center space-x-2 lg:space-x-3">
                                <div className="text-right">
                                    <div className="flex items-center space-x-1 lg:space-x-2">
                                        <span className="text-gray-400 text-xs lg:text-sm font-medium font-mono">Backend</span>
                                        <div className={`status-indicator ${backendHealth === 'healthy' ? 'online' : 'offline'}`}></div>
                                    </div>
                                </div>
                                <span className={`text-xs lg:text-sm font-semibold font-mono ${getStatusColor(backendHealth)}`}>
                                    {backendHealth === 'healthy' ? 'Healthy' : 'Error'}
                                </span>
                            </div>
                        </div>

                        {/* Matrix Live Indicator - Responsive sizing */}
                        <div className="flex items-center space-x-2 sm:space-x-3 bg-surface-card border border-green-500/20 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-xl hover:border-green-500/40 transition-all duration-150 backdrop-blur-sm">
                            <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${connectionStatus === 'Connected' && backendHealth === 'healthy'
                                    ? 'bg-green-400 shadow-glow animate-pulse'
                                    : 'bg-red-400'
                                }`}></div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-green-300 text-xs sm:text-sm font-semibold font-mono">
                                    Platform ready
                                </span>
                                <span className="text-gray-400 text-xs hidden sm:block font-mono">
                                    {connectionStatus === 'Connected' && backendHealth === 'healthy'
                                        ? 'All systems online'
                                        : 'System check required'
                                    }
                                </span>
                            </div>
                        </div>

                        {/* Mobile Status Indicator - Only for very small screens */}
                        <div className="hidden sm:flex md:hidden items-center space-x-1.5">
                            <div className={`w-2.5 h-2.5 rounded-full ${getStatusDot(connectionStatus)}`}></div>
                            <div className={`w-2.5 h-2.5 rounded-full ${getStatusDot(backendHealth)}`}></div>
                        </div>
                    </Flex>
                </Flex>
            </Container>

            {/* Matrix bottom gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent"></div>
        </header>
    );
};

export default Header;
