// src/components/StanceEvolutionChart.jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';
import Icon from './Icon';

export default function StanceEvolutionChart({ stanceData = [] }) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Debug logging
    useEffect(() => {
        console.log('🎯 StanceEvolutionChart received data:', stanceData);
        console.log('🎯 Data length:', stanceData.length);
        if (stanceData.length > 0) {
            console.log('🎯 Latest entry:', stanceData[stanceData.length - 1]);
        }
    }, [stanceData]);

    // Format data for Recharts
    const chartData = stanceData.map((entry, index) => {
        const timeLabel = entry.timestamp ? 
            new Date(entry.timestamp).toLocaleTimeString('en-US', {
                hour12: false,
                minute: '2-digit',
                second: '2-digit'
            }) : `Turn ${entry.turn || index + 1}`;
            
        return {
            turn: entry.turn || index + 1,
            timestamp: entry.timestamp,
            senatorbot: entry.senatorbot || 0,
            reformerbot: entry.reformerbot || 0,
            timeLabel: timeLabel
        };
    });

    // Custom tooltip to show actual values and time
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-black/95 backdrop-blur-sm p-3 border border-green-500/50 rounded-lg shadow-xl shadow-green-500/20">
                    <p className="text-sm font-medium text-green-300 font-mono">{label}</p>
                    <p className="text-xs text-gray-400 mb-2 font-mono">TURN {data.turn}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-sm font-mono" style={{ color: entry.color }}>
                            <span className="font-medium">{entry.dataKey === 'senatorbot' ? 'SENATORBOT' : 'REFORMERBOT'}:</span> {entry.value.toFixed(2)}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };

    if (chartData.length === 0) {
        return (
            <div className="h-full flex flex-col bg-black/95 border border-green-500/30 rounded-xl shadow-2xl shadow-green-500/10 overflow-hidden">
                {/* Matrix Header */}
                <div className="flex-shrink-0 bg-surface-card/95 px-6 py-4 border-b border-green-500/20">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/30">
                            <Icon name="trending" className="w-5 h-5 text-black" />
                        </div>
                        <h3 className="text-xl font-bold text-green-400 font-mono tracking-wide">STANCE EVOLUTION</h3>
                        <span className="text-xs bg-green-500/20 border border-green-500/30 px-2 py-1 rounded-full text-green-400 font-mono">
                            ELECTION NIGHT STYLE
                        </span>
                    </div>
                </div>

                {/* Matrix Empty State */}
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center">
                        <div className="w-12 h-12 bg-black/80 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Icon name="analytics" className="w-6 h-6 text-green-400" />
                        </div>
                        <p className="text-neutral-400 text-sm font-medium font-mono">AWAITING STANCE DATA</p>
                        <p className="text-neutral-500 text-xs mt-1 font-mono">CHART WILL UPDATE AS DEBATE PROGRESSES</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-black/95 border border-green-500/30 rounded-xl shadow-2xl shadow-green-500/10 overflow-hidden">
            {/* Matrix Header */}
            <div className="flex-shrink-0 bg-surface-card/95 px-6 py-4 border-b border-green-500/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/30">
                            <Icon name="trending" className="w-5 h-5 text-black" />
                        </div>
                        <h3 className="text-xl font-bold text-green-400 font-mono tracking-wide">STANCE EVOLUTION</h3>
                        <div className="flex items-center space-x-2 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-green-400 text-xs font-medium font-mono">LIVE</span>
                        </div>
                    </div>
                    <button
                        onClick={toggleExpanded}
                        className="p-2 hover:bg-green-700/50 rounded-lg transition-colors border border-green-500/30"
                        title={isExpanded ? 'Collapse chart' : 'Expand chart'}
                    >
                        <Icon
                            name={isExpanded ? "Minimize2" : "Maximize2"}
                            className="w-4 h-4 text-green-400"
                        />
                    </button>
                </div>

                {/* Matrix Agent Legend & Current Positions */}
                <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-green-500 rounded-full"></div>
                            <span className="text-sm text-green-300 font-medium font-mono">SENATORBOT</span>
                            {chartData.length > 0 && (
                                <span className="text-sm font-bold text-green-400 font-mono">
                                    {chartData[chartData.length - 1].senatorbot.toFixed(2)}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-gradient-to-r from-green-300 to-green-400 rounded-full"></div>
                            <span className="text-sm text-green-200 font-medium font-mono">REFORMERBOT</span>
                            {chartData.length > 0 && (
                                <span className="text-sm font-bold text-green-300 font-mono">
                                    {chartData[chartData.length - 1].reformerbot.toFixed(2)}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="text-xs text-neutral-500 font-mono">
                        <span className="text-neutral-400 font-medium">{chartData.length}</span> TURNS
                    </div>
                </div>
            </div>

            {/* Matrix Chart */}
            <div className={`flex-1 p-6 bg-black/80 min-h-[240px] ${isExpanded ? 'min-h-96' : 'min-h-64'}`}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#22c55e" opacity={0.2} />
                        <XAxis
                            dataKey="timeLabel"
                            stroke="#22c55e"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: '#22c55e', fontFamily: 'monospace' }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            interval={0}
                        />
                        <YAxis
                            domain={['dataMin - 0.1', 'dataMax + 0.1']}
                            stroke="#22c55e"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: '#22c55e', fontFamily: 'monospace' }}
                            tickFormatter={(value) => value.toFixed(2)}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                            type="monotone"
                            dataKey="senatorbot"
                            stroke="#22c55e"
                            strokeWidth={3}
                            dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: '#22c55e', strokeWidth: 2, fill: '#16a34a' }}
                            name="SENATORBOT"
                        />
                        <Line
                            type="monotone"
                            dataKey="reformerbot"
                            stroke="#4ade80"
                            strokeWidth={3}
                            dot={{ fill: '#4ade80', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: '#4ade80', strokeWidth: 2, fill: '#22c55e' }}
                            name="REFORMERBOT"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Matrix Election night style footer */}
            <div className="flex-shrink-0 px-6 py-3 bg-surface-card/95 border-t border-green-500/20">
                <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-neutral-400">
                        <Icon name="Activity" className="w-3 h-3 inline mr-1" />
                        REAL-TIME STANCE TRACKING
                    </span>
                    <span className="flex items-center space-x-1 text-green-400">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                        <span className="font-medium">UPDATING</span>
                    </span>
                </div>
            </div>
        </div>
    );
}
