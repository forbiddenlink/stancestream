import React from 'react';
import Icon from './Icon';
import { Card, CardHeader, CardContent, StatusBadge, Stack } from './ui';

const FactChecker = ({ factChecks = [] }) => {
    const getFactCheckConfig = (score) => {
        if (score >= 0.8) {
            return {
                variant: 'success',
                label: 'HIGH CONFIDENCE',
                icon: 'check-circle',
                cardClass: 'border-green-500/30 bg-green-900/20'
            };
        } else if (score >= 0.6) {
            return {
                variant: 'warning',
                label: 'MODERATE CONFIDENCE',
                icon: 'alert-triangle',
                cardClass: 'border-green-400/30 bg-green-800/20'
            };
        } else {
            return {
                variant: 'error',
                label: 'LOW CONFIDENCE',
                icon: 'x-circle',
                cardClass: 'border-green-300/30 bg-green-700/20'
            };
        }
    };

    return (
        <div className="h-full flex flex-col bg-surface-base border border-green-500/20 rounded-xl shadow-elevated">
            <div className="flex-shrink-0 bg-surface-elevated px-4 py-3 border-b border-green-500/20 rounded-t-xl">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shadow-glow">
                        <Icon name="shield-check" size={20} className="text-green-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-green-400 font-mono tracking-wide">FACT CHECKER</h3>
                        <p className="text-gray-400 text-sm font-mono">REAL-TIME VERIFICATION</p>
                    </div>
                    <div className="bg-surface-card border border-green-500/20 px-2 py-1 rounded-xl">
                        <span className="text-green-400 text-sm font-mono">
                            {factChecks.length} CHECKS
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden p-4 bg-surface-base">
                {factChecks.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-xl bg-surface-card border border-green-500/20 flex items-center justify-center mb-4 shadow-glow">
                            <Icon name="search" size={24} className="text-green-400" />
                        </div>
                        <h4 className="text-green-400 font-medium mb-2 font-mono">READY FOR FACT-CHECKING</h4>
                        <p className="text-gray-400 text-sm mb-1 font-mono">MONITORING AGENT STATEMENTS</p>
                        <p className="text-gray-500 text-xs font-mono">VECTOR-POWERED VERIFICATION SYSTEM ACTIVE</p>
                    </div>
                ) : (
                    <div className="space-y-3 h-full overflow-y-auto">
                        {factChecks.slice(-5).map((check) => {
                            const config = getFactCheckConfig(check.score);

                            return (
                                <div key={check.id || check.timestamp} className={`bg-surface-card border p-4 rounded-xl ${config.cardClass} hover:shadow-card-hover transition-all duration-150`}>
                                    <div className="flex items-start space-x-3">
                                        <div className="flex-shrink-0 mt-1">
                                            <Icon name={config.icon} size={18} className="text-green-400" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="bg-green-500/10 border border-green-500/30 px-2 py-1 rounded text-xs">
                                                    <span className="text-green-400 font-mono">{config.label}</span>
                                                </div>
                                                <span className="text-xs text-gray-400 font-mono">
                                                    {(check.score * 100).toFixed(1)}%
                                                </span>
                                            </div>

                                            <p className="text-sm text-green-100 leading-relaxed mb-3 font-mono">
                                                {check.fact}
                                            </p>

                                            {check.source && (
                                                <div className="flex items-center space-x-2 text-xs text-gray-400 font-mono">
                                                    <Icon name="external-link" size={12} />
                                                    <span>SOURCE VERIFIED</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FactChecker;
