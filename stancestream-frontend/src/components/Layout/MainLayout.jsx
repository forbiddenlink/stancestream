// Main Layout Component - Consistent layout structure across all views
import Header from '../Header';
import EnhancedControls from '../EnhancedControls';
import Icon from '../Icon';

export default function MainLayout({
    children,
    connectionStatus,
    connectionHealth,
    viewMode,
    setViewMode,
    activeDebates,
    debateMessages,
    factChecks,
    currentDebateId,
    onMetricsUpdate,
    onStopCurrentDebate,
    onDebateStarted
}) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col">
            <Header connectionStatus={connectionStatus} backendHealth={connectionHealth} />

            {/* Enhanced Controls Bar - Improved Visual Hierarchy */}
            <div className="flex-shrink-0 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-md">
                <div className="container mx-auto px-4 py-3 max-w-7xl">
                    <div className="flex flex-col gap-4">
                        {/* Top Row: Enhanced Controls */}
                        <div className="w-full">
                            <EnhancedControls
                                viewMode={viewMode}
                                activeDebates={activeDebates}
                                currentDebateId={currentDebateId}
                                onMetricsUpdate={onMetricsUpdate}
                                onStopCurrentDebate={onStopCurrentDebate}
                                onDebateStarted={onDebateStarted}
                            />
                        </div>

                        {/* Bottom Row: Mode Toggle + Enhanced Quick Stats */}
                        <div className="flex items-center justify-between">
                            {/* Left: Enhanced Quick Stats */}
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="text-center px-3 py-2 bg-green-500/10 rounded-lg border border-green-500/20">
                                        <div className="text-lg font-bold text-green-400">{activeDebates.size}</div>
                                        <div className="text-xs text-gray-400">Active Sessions</div>
                                    </div>
                                    <div className="text-center px-3 py-2 bg-green-500/10 rounded-lg border border-green-500/20">
                                        <div className="text-lg font-bold text-green-400">{debateMessages.length}</div>
                                        <div className="text-xs text-gray-400">Messages</div>
                                    </div>
                                    <div className="text-center px-3 py-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                                        <div className="text-lg font-bold text-purple-400">{factChecks.length}</div>
                                        <div className="text-xs text-gray-400">Fact Checks</div>
                                    </div>
                                </div>

                                {/* System Health Indicator */}
                                <div className="flex items-center gap-2 px-3 py-2 bg-slate-700/30 rounded-lg border border-slate-600/30">
                                    <div className={`w-2 h-2 rounded-full ${connectionStatus === 'Connected' && connectionHealth === 'healthy'
                                            ? 'bg-emerald-400 animate-pulse'
                                            : 'bg-red-400'
                                        }`}></div>
                                    <span className="text-xs text-gray-400">
                                        {connectionStatus === 'Connected' && connectionHealth === 'healthy' ? 'System Online' : 'System Issues'}
                                    </span>
                                </div>
                            </div>

                            {/* Right: Improved View Mode Toggle */}
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-400 font-medium">View Mode:</span>
                                <div className="flex items-center gap-1 p-1 bg-slate-800/50 rounded-lg border border-slate-600/30">
                                    {[
                                        { key: 'standard', label: 'Standard', icon: 'target', gradient: 'from-blue-600 to-blue-700' },
                                        { key: 'multi-debate', label: 'Multi-Debate', icon: 'multi-debate', gradient: 'from-purple-600 to-pink-600' },
                                        { key: 'analytics', label: 'Analytics', icon: 'analytics', gradient: 'from-green-600 to-emerald-600' },
                                        { key: 'business', label: 'Business Intelligence', icon: 'trending-up', gradient: 'from-blue-600 to-cyan-600' },
                                        { key: 'showcase', label: 'System Showcase', icon: 'award', gradient: 'from-green-600 to-emerald-600' }
                                    ].map(({ key, label, icon, gradient }) => (
                                        <button
                                            key={key}
                                            onClick={() => setViewMode(key)}
                                            className={`
                        px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
                        ${viewMode === key
                                                    ? `bg-gradient-to-r ${gradient} text-white shadow-lg`
                                                    : 'bg-transparent text-gray-300 hover:bg-gray-600/50'
                                                }
                      `}
                                        >
                                            <Icon name={icon} size={16} className="mr-1" />
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 container mx-auto px-4 py-4 max-w-7xl">
                {children}
            </main>
        </div>
    );
}
