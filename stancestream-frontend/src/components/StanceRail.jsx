/**
 * StanceRail
 * The product's own output, drawn as a tape: where each agent stands on a
 * topic, on the same 0..1 scale RedisTimeSeries stores. Values and keys are the
 * seed data from the repo (index.js and addReformer.js), not live telemetry.
 */

const AGENTS = [
    { id: 'senatorbot', name: 'SenatorBot', role: 'Moderate US Senator', side: 'a' },
    { id: 'reformerbot', name: 'ReformerBot', role: 'Progressive Policy Advocate', side: 'b' },
];

// stance values from the agent:*:profile seed documents
const TOPICS = [
    { key: 'climate_policy', stance: { senatorbot: 0.4, reformerbot: 0.9 } },
    { key: 'economic_risk', stance: { senatorbot: 0.8, reformerbot: 0.3 } },
];

const TS_KEY = 'debate:climatebill2025:agent:senatorbot:stance:climate_policy';
const OPENING = 'We must balance environmental protection with economic growth.';

const TICKS = [0, 0.25, 0.5, 0.75, 1];

const fmt = (n) => n.toFixed(2);

const Marker = ({ side, value, label }) => (
    <span
        className={`stance-marker stance-marker-${side}`}
        style={{ left: `${value * 100}%` }}
        aria-hidden="true"
    >
        <span className="stance-marker-dot" />
        <span className="stance-marker-value" title={label}>
            {value.toFixed(1)}
        </span>
    </span>
);

const Row = ({ topic }) => {
    const [a, b] = [topic.stance.senatorbot, topic.stance.reformerbot];
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    return (
        <div className="stance-row">
            <div className="stance-row-head">
                <span className="font-mono text-[11px] text-slate-300">
                    {topic.key}
                </span>
                <span className="font-mono text-[11px] text-slate-400">
                    {fmt(hi - lo)} apart
                </span>
            </div>
            <div className="stance-track" aria-hidden="true">
                <span className="stance-rule" />
                {TICKS.map((t) => (
                    <span key={t} className="stance-tick" style={{ left: `${t * 100}%` }} />
                ))}
                <span
                    className="stance-gap"
                    style={{ left: `${lo * 100}%`, width: `${(hi - lo) * 100}%` }}
                />
                <Marker side="a" value={a} label={`SenatorBot ${a}`} />
                <Marker side="b" value={b} label={`ReformerBot ${b}`} />
            </div>
            <div className="stance-scale" aria-hidden="true">
                {TICKS.map((t) => (
                    <span key={t} style={{ left: `${t * 100}%` }}>
                        {t === 0 ? '0' : t === 1 ? '1' : t}
                    </span>
                ))}
            </div>
            <p className="sr-only">
                {topic.key}: SenatorBot {a}, ReformerBot {b}, {fmt(hi - lo)} apart on a scale of 0 to 1.
            </p>
        </div>
    );
};

const StanceRail = ({ compact = false, className = '' }) => {
    const topics = compact ? TOPICS.slice(0, 1) : TOPICS;
    return (
        <figure className={`stance-rail ${compact ? 'is-compact' : ''} ${className}`}>
            <figcaption className="stance-legend">
                {AGENTS.map((agent) => (
                    <span key={agent.id} className="stance-legend-item">
                        <span className={`stance-legend-dot stance-marker-${agent.side}`} aria-hidden="true">
                            <span className="stance-marker-dot" />
                        </span>
                        <span>
                            <span className="stance-legend-name">{agent.name}</span>
                            <span className="stance-legend-role">{agent.role}</span>
                        </span>
                    </span>
                ))}
            </figcaption>

            {topics.map((topic) => (
                <Row key={topic.key} topic={topic} />
            ))}

            {!compact && (
                <div className="stance-source">
                    <p className="stance-source-line">
                        <span className="stance-source-cmd">Ts.add</span>
                        <span className="stance-source-key">{TS_KEY}</span>
                        <span className="stance-source-cmd">* 0.4</span>
                    </p>
                    <p className="stance-source-quote">
                        <span className="text-slate-400">SenatorBot, first message on the shared stream:</span>{' '}
                        &ldquo;{OPENING}&rdquo;
                    </p>
                </div>
            )}
        </figure>
    );
};

export default StanceRail;
