// Redis Matrix Modal - Full Screen "Matrix" View for Judges
import RedisMatrixStream from './RedisMatrixStream';
import Icon from './Icon';

export default function RedisMatrixModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[100] overflow-y-auto">
            {/* Navigation Bar */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-50">
                {/* Home Button */}
                <button
                    onClick={onClose}
                    className="bg-green-600/20 hover:bg-green-600/40 border border-green-500/30 rounded-lg p-2 text-green-300 hover:text-green-200 transition-all flex items-center gap-2"
                >
                    <Icon name="home" className="w-5 h-5" />
                    <span className="text-sm font-medium">Back to Home</span>
                </button>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    aria-label="Close"
                    className="bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 rounded-lg p-2 text-red-300 hover:text-red-200 transition-all"
                >
                    <Icon name="x" className="w-6 h-6" />
                </button>
            </div>

            {/* Main Content Container */}
            <div className="min-h-screen p-6 pt-20">
                {/* Header Section */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-green-300 font-mono mb-3">
                        Redis operations matrix
                    </h1>
                    <p className="text-lg text-gray-300 mb-2">
                        Live visualization of all 4 Redis modules working together in real-time
                    </p>
                    <p className="text-sm text-green-400 font-mono">
                        Real-time data flowing from active debate sessions
                    </p>
                </div>

                {/* How It Works Section */}
                <div className="mb-8">
                    <div className="bg-gradient-to-r from-gray-900/90 to-green-900/70 border border-green-500/30 rounded-xl p-6">
                        <h2 className="text-2xl font-bold text-green-300 mb-4 text-center font-mono">
                            🔄 How all 4 Redis modules work together
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            {/* JSON Module */}
                            <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4">
                                <div className="text-center mb-3">
                                    <Icon name="database" className="w-8 h-8 text-green-400 mx-auto mb-2" />
                                    <h3 className="font-bold text-green-300 text-lg">RedisJSON</h3>
                                    <div className="text-xs text-green-400 font-mono">Complex data</div>
                                </div>
                                <ul className="text-xs text-gray-300 space-y-1">
                                    <li>• Agent profiles & personalities</li>
                                    <li>• Cache metrics & statistics</li>
                                    <li>• Platform scoring data</li>
                                    <li>• Intelligence tracking</li>
                                </ul>
                            </div>

                            {/* Streams Module */}
                            <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4">
                                <div className="text-center mb-3">
                                    <Icon name="arrow-right" className="w-8 h-8 text-green-400 mx-auto mb-2" />
                                    <h3 className="font-bold text-green-300 text-lg">Redis Streams</h3>
                                    <div className="text-xs text-green-400 font-mono">Message flow</div>
                                </div>
                                <ul className="text-xs text-gray-300 space-y-1">
                                    <li>• Real-time debate messages</li>
                                    <li>• Agent memory systems</li>
                                    <li>• Strategic insights</li>
                                    <li>• Key moment highlights</li>
                                </ul>
                            </div>

                            {/* TimeSeries Module */}
                            <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-4">
                                <div className="text-center mb-3">
                                    <Icon name="trending-up" className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                                    <h3 className="font-bold text-purple-300 text-lg">TimeSeries</h3>
                                    <div className="text-xs text-purple-400 font-mono">Evolution</div>
                                </div>
                                <ul className="text-xs text-gray-300 space-y-1">
                                    <li>• Stance evolution tracking</li>
                                    <li>• Emotional intensity</li>
                                    <li>• Performance metrics</li>
                                    <li>• Temporal analysis</li>
                                </ul>
                            </div>

                            {/* Vector Module */}
                            <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4">
                                <div className="text-center mb-3">
                                    <Icon name="target" className="w-8 h-8 text-green-400 mx-auto mb-2" />
                                    <h3 className="font-bold text-green-300 text-lg">Vector Search</h3>
                                    <div className="text-xs text-green-400 font-mono">Similarity</div>
                                </div>
                                <ul className="text-xs text-gray-300 space-y-1">
                                    <li>• Semantic caching</li>
                                    <li>• Fact-checking & verification</li>
                                    <li>• cosine similarity matching</li>
                                    <li>• Cost optimization</li>
                                </ul>
                            </div>
                        </div>

                        {/* Integration Flow */}
                        <div className="bg-black/40 rounded-lg p-4 border border-green-500/20">
                            <h3 className="text-center text-green-300 font-bold mb-3 font-mono">
                                🔗 Integration flow
                            </h3>
                            <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
                                <span className="bg-green-600/20 text-green-300 px-2 py-1 rounded border border-green-500/30 font-mono">
                                    JSON stores agent profiles
                                </span>
                                <Icon name="arrow-right" className="w-4 h-4 text-gray-400" />
                                <span className="bg-green-600/20 text-green-300 px-2 py-1 rounded border border-green-500/30 font-mono">
                                    Streams flow messages
                                </span>
                                <Icon name="arrow-right" className="w-4 h-4 text-gray-400" />
                                <span className="bg-purple-600/20 text-purple-300 px-2 py-1 rounded border border-purple-500/30 font-mono">
                                    TimeSeries tracks evolution
                                </span>
                                <Icon name="arrow-right" className="w-4 h-4 text-gray-400" />
                                <span className="bg-green-600/20 text-green-300 px-2 py-1 rounded border border-green-500/30 font-mono">
                                    Vector optimizes responses
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Matrix Display */}
                <RedisMatrixStream position="embedded" />
            </div>
        </div>
    );
}
