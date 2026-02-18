// Business Value Dashboard - Real-time ROI and Performance Analytics
import { useState, useEffect, memo, useCallback } from 'react';
import api from '../services/api';
import Icon from './Icon';

const BusinessValueDashboard = memo(function BusinessValueDashboard() {
    const [businessData, setBusinessData] = useState(null);
    const [cacheMetrics, setCacheMetrics] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [_refreshInterval, _setRefreshInterval] = useState(null);

    const fetchBusinessMetrics = useCallback(async () => {
        try {
            setError(null);

            // Get business summary and cache metrics
            const [businessResponse, cacheResponse] = await Promise.all([
                api.getBusinessSummary(),
                api.getCacheMetrics()
            ]);

            if (businessResponse.success) {
                setBusinessData(businessResponse);
            }

            if (cacheResponse.success) {
                setCacheMetrics(cacheResponse);
            }

        } catch (error) {
            console.error('Business metrics fetch error:', error);
            setError('Failed to load business metrics');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBusinessMetrics();

        // Automatic polling disabled to reduce server load
        // const interval = setInterval(fetchBusinessMetrics, 30000);
        // setRefreshInterval(interval);

        return () => {
            // No cleanup needed since polling is disabled
        };
    }, [fetchBusinessMetrics]);

    if (isLoading) {
        return (
            <div className="bg-black/95 border border-green-500/30 rounded-xl shadow-2xl shadow-green-500/10 p-8">
                <div className="flex items-center justify-center">
                    <Icon name="loader-2" className="w-8 h-8 animate-spin text-green-400" />
                    <span className="ml-3 text-green-300 font-mono">LOADING BUSINESS ANALYTICS...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-black/80 border border-red-500/30 rounded-xl p-6">
                <div className="flex items-center">
                    <Icon name="alert-circle" className="w-6 h-6 text-red-400" />
                    <span className="ml-3 text-red-300 font-mono">{error}</span>
                </div>
            </div>
        );
    }

    const businessMetrics = businessData?.detailed_metrics;
    const executiveSummary = businessData?.executive_summary;
    const currentUsage = businessMetrics?.current_usage;
    const performance = businessMetrics?.performance_impact;
    const enterpriseProjections = businessMetrics?.enterprise_projections;

    return (
        <div className="space-y-6">
            {/* Executive Summary Header - Matrix Style */}
            {executiveSummary && (
                <div className="bg-gradient-to-r from-surface-base/95 to-surface-card/95 border border-green-500/20 rounded-xl p-6 shadow-lg shadow-green-500/10">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center justify-center">
                            <Icon name="trending-up" className="w-6 h-6 text-green-400" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-green-400 mb-2 font-mono tracking-wide">
                                BUSINESS IMPACT SUMMARY
                            </h2>
                            <p className="text-lg text-green-300 font-medium mb-3 font-mono">
                                {executiveSummary.headline}
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {executiveSummary.key_benefits?.map((benefit, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <Icon name="check-circle" className="w-4 h-4 text-green-400 flex-shrink-0" />
                                        <span className="text-green-200 text-sm font-mono">{benefit}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Current Performance Metrics */}
            {currentUsage && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-surface-card border border-green-500/20 rounded-xl shadow-lg p-6 border-l-4 border-l-green-500">
                        <div className="flex items-center justify-between mb-2">
                            <Icon name="dollar-sign" className="w-6 h-6 text-green-400" />
                            <span className="text-sm text-neutral-400 font-mono">MONTHLY SAVINGS</span>
                        </div>
                        <div className="text-2xl font-bold text-green-300 font-mono">
                            ${currentUsage.monthly_savings}
                        </div>
                        <div className="text-sm text-green-400 mt-1 font-mono">
                            ${currentUsage.annual_savings}/YEAR PROJECTED
                        </div>
                    </div>

                    <div className="bg-surface-card border border-green-500/20 rounded-xl shadow-lg p-6 border-l-4 border-l-green-400">
                        <div className="flex items-center justify-between mb-2">
                            <Icon name="zap" className="w-6 h-6 text-green-400" />
                            <span className="text-sm text-neutral-400 font-mono">CACHE EFFICIENCY</span>
                        </div>
                        <div className="text-2xl font-bold text-green-300 font-mono">
                            {currentUsage.cache_efficiency}
                        </div>
                        <div className="text-sm text-green-400 mt-1 font-mono">
                            API COST REDUCTION
                        </div>
                    </div>

                    <div className="bg-surface-card border border-green-500/20 rounded-xl shadow-lg p-6 border-l-4 border-l-green-300">
                        <div className="flex items-center justify-between mb-2">
                            <Icon name="cpu" className="w-6 h-6 text-green-300" />
                            <span className="text-sm text-neutral-400 font-mono">TOKENS SAVED</span>
                        </div>
                        <div className="text-2xl font-bold text-green-300 font-mono">
                            {currentUsage.daily_tokens_saved?.toLocaleString() || '0'}
                        </div>
                        <div className="text-sm text-green-400 mt-1 font-mono">
                            DAILY PROCESSING SAVED
                        </div>
                    </div>

                    <div className="bg-surface-card border border-green-500/20 rounded-xl shadow-lg p-6 border-l-4 border-l-green-200">
                        <div className="flex items-center justify-between mb-2">
                            <Icon name="activity" className="w-6 h-6 text-green-200" />
                            <span className="text-sm text-neutral-400 font-mono">SYSTEM STATUS</span>
                        </div>
                        <div className="text-lg font-bold text-green-300 font-mono">
                            {performance?.system_efficiency || 'Optimizing'}
                        </div>
                        <div className="text-sm text-green-400 mt-1 font-mono">
                            {performance?.production_readiness || 'SCALING'}
                        </div>
                    </div>
                </div>
            )}

            {/* Enterprise Scaling Projections - Matrix Style */}
            {enterpriseProjections && (
                <div className="bg-surface-card border border-green-500/20 rounded-xl shadow-lg shadow-green-500/10 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Icon name="building" className="w-6 h-6 text-green-400" />
                        <h3 className="text-xl font-bold text-green-300 font-mono tracking-wide">ENTERPRISE SCALING PROJECTIONS</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {Object.entries(enterpriseProjections).map(([scale, data]) => (
                            <div key={scale} className="bg-surface-elevated/50 border border-green-500/20 rounded-xl p-4">
                                <div className="text-sm font-medium text-green-300 mb-2 font-mono">
                                    {data.description}
                                </div>
                                <div className="text-lg font-bold text-green-300 mb-1 font-mono">
                                    {data.requests_per_day} REQUESTS/DAY
                                </div>
                                <div className="text-green-400 font-semibold font-mono">
                                    ${data.annual_savings?.toLocaleString()}/YEAR SAVINGS
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Real-time Performance Indicators - Matrix Style */}
            {cacheMetrics?.dashboard && (
                <div className="bg-surface-card border border-green-500/20 rounded-xl shadow-lg shadow-green-500/10 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <Icon name="monitor" className="w-6 h-6 text-green-400" />
                            <h3 className="text-xl font-bold text-green-300 font-mono tracking-wide">REAL-TIME OPERATIONS</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-sm text-green-300 font-mono">LIVE</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(cacheMetrics.dashboard.primary_kpis).map(([key, value]) => (
                            <div key={key} className="text-center bg-surface-elevated/50 border border-green-500/20 rounded-xl p-3">
                                <div className="text-lg font-bold text-green-300 font-mono">{value}</div>
                                <div className="text-sm text-green-400 font-mono">{key.toUpperCase()}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Business Case Highlight - Matrix Style */}
            {executiveSummary?.business_case && (
                <div className="bg-gradient-to-r from-surface-base/90 to-surface-card/90 border border-green-500/20 rounded-xl p-6 shadow-lg shadow-green-500/10">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center justify-center">
                            <Icon name="briefcase" className="w-6 h-6 text-green-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-green-300 mb-3 font-mono tracking-wide">BUSINESS CASE</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-semibold text-green-400 mb-2 font-mono">IMMEDIATE VALUE</h4>
                                    <p className="text-green-200 text-sm font-mono">
                                        {executiveSummary.business_case.immediate_value}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-green-400 mb-2 font-mono">SCALABILITY</h4>
                                    <p className="text-green-200 text-sm font-mono">
                                        {executiveSummary.business_case.scalability}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-green-400 mb-2 font-mono">COMPETITIVE ADVANTAGE</h4>
                                    <p className="text-green-200 text-sm font-mono">
                                        {executiveSummary.business_case.competitive_advantage}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-green-400 mb-2 font-mono">TECHNICAL MOAT</h4>
                                    <p className="text-green-200 text-sm font-mono">
                                        {executiveSummary.business_case.technical_moat}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Last Updated - Matrix Style */}
            <div className="text-center text-sm text-neutral-400 bg-surface-card border border-green-500/20 rounded-xl p-3">
                <span className="font-mono">LAST UPDATED: {new Date().toLocaleTimeString()}</span>
                <span className="mx-2 text-green-500">•</span>
                <button
                    onClick={fetchBusinessMetrics}
                    className="text-green-400 hover:text-green-300 transition-colors duration-150 font-mono"
                >
                    REFRESH
                </button>
            </div>
        </div>
    );
});

export default BusinessValueDashboard;
