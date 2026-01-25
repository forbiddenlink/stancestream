/**
 * Optimized Debate Message Component
 * Uses React.memo to prevent unnecessary re-renders
 */

import { memo } from 'react';
import Icon from './Icon';

const DebateMessage = memo(({ message }) => {
    const {
        sender,
        agentId,
        text,
        timestamp,
        factCheck,
        sentiment
    } = message;

    return (
        <div className="message-card bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4 mb-3 hover:border-gray-600 transition-colors">
            <div className="message-header flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Icon 
                        name={agentId === 'senatorbot' ? 'gavel' : 'lightbulb'} 
                        size={20}
                        className="text-blue-400"
                    />
                    <span className="font-semibold text-white">{sender}</span>
                </div>
                <span className="text-xs text-gray-400">
                    {new Date(timestamp).toLocaleTimeString()}
                </span>
            </div>
            
            <div className="message-content text-gray-200 leading-relaxed">
                {text}
            </div>

            {factCheck && (
                <div className="fact-check mt-3 p-2 bg-green-900/20 border border-green-700/30 rounded flex items-start gap-2">
                    <Icon name="check-circle" size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                        <div className="text-xs text-green-300 font-medium">Fact Check</div>
                        <div className="text-xs text-gray-300 mt-1">{factCheck.fact}</div>
                        {factCheck.score && (
                            <div className="text-xs text-green-400 mt-1">
                                Confidence: {(factCheck.score * 100).toFixed(0)}%
                            </div>
                        )}
                    </div>
                </div>
            )}

            {sentiment && (
                <div className="sentiment mt-2 flex items-center gap-2">
                    <Icon name="activity" size={14} className="text-purple-400" />
                    <span className="text-xs text-purple-300">
                        {sentiment.sentiment} ({(sentiment.confidence * 100).toFixed(0)}% confidence)
                    </span>
                </div>
            )}
        </div>
    );
}, (prevProps, nextProps) => {
    // Custom comparison function
    // Only re-render if message ID or text changes
    return prevProps.message.id === nextProps.message.id &&
           prevProps.message.text === nextProps.message.text &&
           prevProps.message.factCheck === nextProps.message.factCheck;
});

DebateMessage.displayName = 'DebateMessage';

export default DebateMessage;
