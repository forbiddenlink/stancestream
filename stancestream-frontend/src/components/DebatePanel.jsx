import React, { useEffect, useRef } from 'react';
import Icon from './Icon';
import SentimentBadge from './SentimentBadge';
import { Card, CardHeader, CardContent, Stack, Container } from './ui';

const DebatePanel = ({ messages = [] }) => {
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const lastMessageCountRef = useRef(0);

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'nearest'
                });
            }, 100);
        }
    };

    useEffect(() => {
        if (messages.length > lastMessageCountRef.current && messages.length > 0) {
            scrollToBottom();
        }
        lastMessageCountRef.current = messages.length;
    }, [messages]);

    const getAgentStyle = (agentId) => {
        switch (agentId) {
            case 'senatorbot':
                return {
                    gradient: 'from-green-600 via-green-500 to-emerald-600',
                    avatar: <Icon name="user" size={20} className="text-black" />,
                    name: 'SENATORBOT',
                    accentColor: 'green-400',
                    bgColor: 'bg-green-500/10 border-green-500/30'
                };
            case 'reformerbot':
                return {
                    gradient: 'from-green-400 via-green-500 to-green-600',
                    avatar: <Icon name="zap" size={20} className="text-black" />,
                    name: 'REFORMERBOT',
                    accentColor: 'green-300',
                    bgColor: 'bg-green-400/10 border-green-400/30'
                };
            default:
                return {
                    gradient: 'from-green-600 to-green-700',
                    avatar: <Icon name="message" size={20} className="text-black" />,
                    name: 'AGENT',
                    accentColor: 'green-400',
                    bgColor: 'bg-green-500/10 border-green-500/30'
                };
        }
    };

    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="h-full flex flex-col bg-surface-base border border-green-500/20 rounded-xl shadow-elevated animate-fade-in">
            {/* Matrix Header */}
            <div className="flex-shrink-0 bg-surface-elevated px-6 py-4 border-b border-green-500/20 rounded-t-xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="relative">
                            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
                                <Icon name="message-circle" size={20} className="text-black" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-black animate-pulse"></div>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-green-400 font-mono tracking-wide">LIVE DEBATE</h2>
                            <p className="text-gray-400 text-sm font-mono">REAL-TIME AI DISCUSSION</p>
                        </div>
                    </div>

                    {messages.length > 0 && (
                        <div className="flex items-center space-x-4">
                            <div className="bg-surface-card border border-green-500/20 px-3 py-1.5 rounded-xl">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                    <span className="text-green-400 text-sm font-medium font-mono">
                                        {messages.length} EXCHANGES
                                    </span>
                                </div>
                            </div>
                            <div className="text-gray-400 text-sm font-mono">
                                {formatTimestamp(messages[messages.length - 1]?.timestamp)}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Matrix Messages Area */}
            <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-6 min-h-0 bg-surface-base"
            >
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
                        <div className="relative mb-8">
                            <div className="w-20 h-20 bg-surface-card border border-green-500/20 rounded-xl flex items-center justify-center">
                                <Icon name="message-circle" size={40} className="text-green-400" />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-2xl blur-xl -z-10"></div>
                        </div>
                        <h3 className="text-xl font-bold text-green-400 mb-4 font-mono tracking-wide">
                            READY FOR INTELLIGENT DEBATE
                        </h3>
                        <p className="text-gray-400 max-w-md leading-relaxed font-mono">
                            SELECT A TOPIC AND START A DEBATE TO WATCH AI AGENTS ENGAGE IN SOPHISTICATED
                            DISCUSSION WITH FACT-CHECKING, MEMORY FORMATION, AND STANCE EVOLUTION.
                        </p>
                        <div className="mt-6 flex items-center space-x-6 text-gray-500 text-sm font-mono">
                            <div className="flex items-center space-x-2">
                                <Icon name="activity" size={16} />
                                <span>AI MEMORY</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Icon name="search" size={16} />
                                <span>FACT CHECKING</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Icon name="trending-up" size={16} />
                                <span>STANCE EVOLUTION</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.map((msg, index) => {
                            const agentStyle = getAgentStyle(msg.agentId);
                            const isLeft = msg.agentId === 'senatorbot';
                            const prevMessage = messages[index - 1];
                            const showAvatar = !prevMessage || prevMessage.agentId !== msg.agentId;

                            return (
                                <div
                                    key={msg.id || index}
                                    className={`flex items-start space-x-4 animate-slide-up ${isLeft ? 'flex-row' : 'flex-row-reverse space-x-reverse'
                                        }`}
                                >
                                    {/* Matrix Avatar */}
                                    <div className={`flex-shrink-0 ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
                                        <div className="relative">
                                            <div className={`w-12 h-12 bg-gradient-to-r ${agentStyle.gradient} rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30 transform hover:scale-105 transition-all duration-300`}>
                                                {agentStyle.avatar}
                                            </div>
                                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 bg-${agentStyle.accentColor} rounded-full border-2 border-black`}></div>
                                        </div>
                                    </div>

                                    {/* Matrix Message Bubble */}
                                    <div className={`flex-1 max-w-3xl ${isLeft ? 'mr-12' : 'ml-12'}`}>
                                        {showAvatar && (
                                            <div className={`flex items-center space-x-3 mb-2 ${isLeft ? 'justify-start' : 'justify-end'
                                                }`}>
                                                <span className={`text-${agentStyle.accentColor} font-semibold text-sm font-mono`}>
                                                    {agentStyle.name}
                                                </span>
                                                <span className="text-gray-500 text-xs font-mono">
                                                    {formatTimestamp(msg.timestamp)}
                                                </span>
                                                {msg.sentiment && (
                                                    <SentimentBadge 
                                                        sentiment={msg.sentiment.sentiment || msg.sentiment} 
                                                        confidence={msg.sentiment.confidence || 0}
                                                        debateId={msg.debateId}
                                                        agentId={msg.agentId}
                                                        timestamp={msg.timestamp}
                                                    />
                                                )}
                                            </div>
                                        )}

                                        <div className={`bg-surface-card border p-4 rounded-xl ${agentStyle.bgColor} ${isLeft ? 'rounded-tl-sm' : 'rounded-tr-sm'
                                            } hover:shadow-card-hover transition-all duration-150`}>
                                            <p className="text-green-100 leading-relaxed text-base font-mono">
                                                {msg.text}
                                            </p>

                                            {/* Matrix Fact Check Indicator */}
                                            {msg.factCheck && (
                                                <div className="mt-3 pt-3 border-t border-green-500/20">
                                                    <div className="flex items-center space-x-2">
                                                        <Icon name="shield-check" size={14} className="text-green-400" />
                                                        <span className="text-green-400 text-xs font-medium font-mono">
                                                            FACT CHECK: {(msg.factCheck.score * 100).toFixed(0)}% CONFIDENCE
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>
        </div>
    );
};

export default DebatePanel;
