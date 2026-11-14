// Stance over time, one scale: 0 to 1.
// The chart's stored data is on -1 to 1 (stance_update events and App's
// conversion), so values are converted back with toUnit() at render. The stored
// data is not changed.
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toUnit } from '../utils/record';

const NAMES = { senatorbot: 'SenatorBot', reformerbot: 'ReformerBot' };

const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: '#f3f6f4', border: '1px solid #17201b', padding: '8px 12px', fontSize: 14 }}>
            <p style={{ margin: 0, fontWeight: 600 }}>Turn {payload[0].payload.turn}</p>
            {payload.map((entry) => (
                <p key={entry.dataKey} style={{ margin: 0 }}>
                    {NAMES[entry.dataKey]} {entry.value.toFixed(2)}
                </p>
            ))}
        </div>
    );
};

export default function StanceEvolutionChart({ stanceData = [] }) {
    const chartData = stanceData.map((entry, index) => ({
        turn: index + 1,
        senatorbot: toUnit(entry.senatorbot || 0),
        reformerbot: toUnit(entry.reformerbot || 0),
    }));

    if (chartData.length === 0) {
        return <p className="section-note">No stance values yet. The chart fills in as turns are recorded.</p>;
    }

    const last = chartData[chartData.length - 1];
    return (
        <>
            <p className="chart-legend">
                <span className="lg lg-a">SenatorBot {last.senatorbot.toFixed(2)}</span>
                <span className="lg lg-b">ReformerBot {last.reformerbot.toFixed(2)}</span>
                <span>Scale of 0 to 1, one point per stance event received.</span>
            </p>
            <div className="chart-wrap" role="img" aria-label={`Stance over time on a scale of 0 to 1. Latest: SenatorBot ${last.senatorbot.toFixed(2)}, ReformerBot ${last.reformerbot.toFixed(2)}.`}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                        <CartesianGrid stroke="#8a9a90" strokeDasharray="2 4" opacity={0.6} />
                        <XAxis dataKey="turn" tick={{ fill: '#4a5a51', fontSize: 13 }} tickLine={false} />
                        <YAxis
                            domain={[0, 1]}
                            ticks={[0, 0.25, 0.5, 0.75, 1]}
                            tick={{ fill: '#4a5a51', fontSize: 13 }}
                            tickLine={false}
                            width={40}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="linear" dataKey="senatorbot" stroke="#24505f" strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} name="SenatorBot" />
                        <Line type="linear" dataKey="reformerbot" stroke="#b32f12" strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} name="ReformerBot" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </>
    );
}
