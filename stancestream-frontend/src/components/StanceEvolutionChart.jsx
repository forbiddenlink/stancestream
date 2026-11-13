// src/components/StanceEvolutionChart.jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';
import Icon from './Icon';

// Custom tooltip to show actual values and time
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-black/95 backdrop-blur-sm p-3 border border-green-500/50 rounded-lg shadow-xl shadow-green-500/20">
                <p className="text-sm font-medium text-green-300 font-mono">{label}</p>
                <p className="text-xs text-gray-400 mb-2 font-mono">Turn {data.turn}</p>
                {payload.map((entry, index) => (
                    <p key={index} className="text-sm font-mono" style={{ color: entry.color }}>
                        <span className="font-medium">{entry.dataKey === 'senatorbot' ? 'SenatorBot' : 'ReformerBot'}:</span> {entry.value.toFixed(2)}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};


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

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };

    if (chartData.length === 0) {
        return (
            <div className="h-full flex flex-col bg-black/95 border border-green-500/30 rounded-xl shadow-2xl shadow-green-500/10 overflow-hidden">
                {/* Matrix Header */}
                <div className="flex-shrink-0 bg-surface-card/95 px-6 py-4 border-b border-green-500/20">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-green-500 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/30">
                            <Icon name="trending" className="w-5 h-5 text-black" />
                        </div>
                        <h3 className="text-xl font-bold text-green-400 font-mono">Stance evolution</h3>
                    </div>
                </div>

                {/* Matrix Empty State */}
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center">
                        <div className="w-12 h-12 bg-black/80 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Icon name="analytics" className="w-6 h-6 text-green-400" />
                        </div>
                        <p className="text-neutral-400 text-sm font-medium font-mono">Awaiting stance data</p>
                        <p className="text-neutral-500 text-xs mt-1 font-mono">Chart will update as debate progresses</p>
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
                        <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-green-500 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/30">
                            <Icon name="trending" className="w-5 h-5 text-black" />
                        </div>
                        <h3 className="text-xl font-bold text-green-400 font-mono">Stance evolution</h3>
                        <div className="flex items-center space-x-2 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-green-400 text-xs font-medium font-mono">Live</span>
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
                            <span className="text-sm text-green-300 font-medium font-mono">SenatorBot</span>
                            {chartData.length > 0 && (
                                <span className="text-sm font-bold text-green-400 font-mono">
                                    {chartData[chartData.length - 1].senatorbot.toFixed(2)}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-gradient-to-r from-green-300 to-green-400 rounded-full"></div>
                            <span className="text-sm text-green-200 font-medium font-mono">ReformerBot</span>
                            {chartData.length > 0 && (
                                <span className="text-sm font-bold text-green-300 font-mono">
                                    {chartData[chartData.length - 1].reformerbot.toFixed(2)}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="text-xs text-neutral-500 font-mono">
                        <span className="text-neutral-400 font-medium">{chartData.length}</span> turns
                    </div>
                </div>
            </div>

            {/* Matrix Chart */}
            <div className={`flex-1 p-6 bg-black/80 min-h-[240px] ${isExpanded ? 'min-h-96' : 'min-h-64'}`}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#8a9a90" opacity={0.6} />
                        <XAxis
                            dataKey="timeLabel"
                            stroke="#4a5a51"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: '#4a5a51', fontFamily: 'Hanken Grotesk, system-ui, sans-serif' }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            interval={0}
                        />
                        <YAxis
                            domain={['dataMin - 0.1', 'dataMax + 0.1']}
                            stroke="#4a5a51"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: '#4a5a51', fontFamily: 'Hanken Grotesk, system-ui, sans-serif' }}
                            tickFormatter={(value) => value.toFixed(2)}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                            type="monotone"
                            dataKey="senatorbot"
                            stroke="#24505f"
                            strokeWidth={3}
                            dot={{ fill: '#24505f', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: '#24505f', strokeWidth: 2, fill: '#24505f' }}
                            name="SenatorBot"
                        />
                        <Line
                            type="monotone"
                            dataKey="reformerbot"
                            stroke="#b32f12"
                            strokeWidth={3}
                            dot={{ fill: '#b32f12', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: '#b32f12', strokeWidth: 2, fill: '#b32f12' }}
                            name="ReformerBot"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Matrix Election night style footer */}
            <div className="flex-shrink-0 px-6 py-3 bg-surface-card/95 border-t border-green-500/20">
                <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-neutral-400">
                        <Icon name="Activity" className="w-3 h-3 inline mr-1" />
                        Real-time stance tracking
                    </span>
                    <span className="flex items-center space-x-1 text-green-400">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                        <span className="font-medium">Updating</span>
                    </span>
                </div>
            </div>
        </div>
    );
}
