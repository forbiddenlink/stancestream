import React, { useEffect, useMemo, useRef } from 'react';
import SentimentBadge from './SentimentBadge';
import StanceRail from './StanceRail';
import Track from './Track';
import { AGENTS, AGENT_ORDER, SHIFT_THRESHOLD, buildRows } from '../utils/record';
import { BASE_DEBATE_TOPICS } from '../data/debateTopics';
import '../pages/arena.css';

/**
 * DebatePanel: the debate record.
 * One row per turn, oldest first, numbered, speaker in the margin, and a stance
 * track on every row on a single 0 to 1 scale (the per-message stance.value).
 * A diamond sits in the margin only when that bot's own stance moved by more
 * than SHIFT_THRESHOLD since its previous turn (the rule in keyMoments.js).
 */

const formatTimestamp = (timestamp) => {
    const d = new Date(timestamp);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
};

const reducedMotion = () =>
    typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const StreamingText = ({ text = '', animate = false }) => {
    if (!animate || reducedMotion()) return text;
    let wordIndex = 0;
    return text.split(/(\s+)/).map((token, i) => {
        if (token.trim() === '') return <React.Fragment key={i}>{token}</React.Fragment>;
        const delay = Math.min(wordIndex * 26, 1400);
        wordIndex += 1;
        return (
            <span key={i} className="arena-word" style={{ animationDelay: `${delay}ms` }}>
                {token}
            </span>
        );
    });
};

const fmt = (v) => (v === undefined ? 'not yet on record' : v.toFixed(2));

const Turn = ({ row, newest }) => {
    const agent = AGENTS[row.agentId] || { role: '', side: row.agentId === 'reformerbot' ? 'b' : 'a' };
    const first = row.n % AGENT_ORDER.length === 1;
    return (
        <li className="turn" data-testid="turn" data-n={row.n} data-agent={row.agentId}>
            {first && (
                <p className="round" role="presentation">
                    Round {row.round}
                </p>
            )}
            <div className="who">
                <span className={`who-name side-${agent.side}`} data-testid="speaker">{row.speaker}</span>
                {agent.role && <span className="who-role">{agent.role}</span>}
            </div>
            <div className="mark">
                {row.moved && (
                    <>
                        <span className="shift-mark" data-testid="shift-mark" aria-hidden="true" />
                        <span className="sr-only">
                            Stance moved by {row.change.toFixed(2)}, more than {SHIFT_THRESHOLD}.
                        </span>
                    </>
                )}
            </div>
            <div className="para">
                <span className="para-n" data-testid="turn-n">{row.n}.</span>
                <p className="para-text" data-testid="turn-text">
                    <StreamingText text={row.text} animate={newest} />
                </p>
                <p className="para-meta">
                    {formatTimestamp(row.timestamp) && <span>{formatTimestamp(row.timestamp)}</span>}
                    {row.factCheck && typeof row.factCheck.score === 'number' && (
                        <span>Fact check {(row.factCheck.score * 100).toFixed(0)}%</span>
                    )}
                    {row.sentiment && (
                        <SentimentBadge
                            sentiment={row.sentiment.sentiment || row.sentiment}
                            confidence={row.sentiment.confidence || 0}
                            debateId={row.debateId}
                            agentId={row.agentId}
                            timestamp={row.timestamp}
                        />
                    )}
                </p>
                <p className="sr-only">
                    {row.stance === null
                        ? 'This turn carries no stance value.'
                        : `Stance after this turn on a scale of 0 to 1: SenatorBot ${fmt(row.values.senatorbot)}, ReformerBot ${fmt(row.values.reformerbot)}.`}
                </p>
            </div>
            <div className="meter" data-testid="meter" data-stance={row.stance ?? ''}>
                <Track values={row.stance === null ? undefined : row.values} />
                {row.stance === null && <span className="meter-none">No stance value on this turn.</span>}
            </div>
        </li>
    );
};

const EmptySlots = () => (
    <ol className="turns" aria-label="Empty record">
        {Array.from({ length: 4 }, (_, i) => {
            const agent = AGENTS[AGENT_ORDER[i % AGENT_ORDER.length]];
            const n = i + 1;
            return (
                <li key={n} className="turn">
                    {n % 2 === 1 && <p className="round" role="presentation">Round {Math.ceil(n / 2)}</p>}
                    <div className="who">
                        <span className={`who-name side-${agent.side}`}>{agent.name}</span>
                        <span className="who-role">{agent.role}</span>
                    </div>
                    <div className="mark"><span className="shift-slot" aria-hidden="true" /></div>
                    <div className="para">
                        <span className="para-n">{n}.</span>
                        <p className="para-text is-empty">
                            Empty slot. {agent.name}&rsquo;s turn {n} is recorded here when a debate runs.
                        </p>
                    </div>
                    <div className="meter"><Track values={undefined} /></div>
                </li>
            );
        })}
    </ol>
);

const DebatePanel = ({ messages = [], topicText, roundMeta, factCheckCount = 0 }) => {
    const rows = useMemo(() => buildRows(messages), [messages]);
    const newestId = messages[messages.length - 1]?.id;
    const endRef = useRef(null);
    const countRef = useRef(0);

    useEffect(() => {
        if (rows.length > countRef.current && countRef.current > 0) {
            endRef.current?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'nearest' });
        }
        countRef.current = rows.length;
    }, [rows.length]);

    const topic = BASE_DEBATE_TOPICS.find((t) => t.description === topicText);
    const title = topic?.name || topicText || 'Debate record';

    if (rows.length === 0) {
        return (
            <section className="record arena-record" aria-labelledby="record-title">
                <div className="record-head">
                    <h2 id="record-title">The record is empty</h2>
                    <p>
                        Select a topic and start a debate. Two AI bots argue it in turns; each turn and
                        each stance is recorded here.
                    </p>
                    <p className="key">
                        <span className="shift-mark" aria-hidden="true" />
                        <span>
                            A mark in the margin means a bot&rsquo;s stance moved by more than {SHIFT_THRESHOLD}{' '}
                            between its turns. Stance runs from 0 to 1.
                        </span>
                    </p>
                </div>
                <div className="arena-rail"><StanceRail /></div>
                <EmptySlots />
                <p className="record-foot">A debate runs 5 rounds by default, one turn per bot in each round.</p>
            </section>
        );
    }

    return (
        <section className="record arena-record" aria-labelledby="record-title">
            <div className="record-head">
                <h2 id="record-title">{title}</h2>
                <p>
                    {topic ? `${topic.description}. ` : ''}
                    {rows.length} {rows.length === 1 ? 'turn' : 'turns'} recorded, {factCheckCount}{' '}
                    {factCheckCount === 1 ? 'fact check' : 'fact checks'}.
                    {roundMeta?.round ? ` Round ${roundMeta.round}${roundMeta.totalRounds ? ` of ${roundMeta.totalRounds}` : ''}.` : ''}
                </p>
                <p className="key">
                    <span className="shift-mark" aria-hidden="true" />
                    <span>
                        A mark in the margin means a bot&rsquo;s stance moved by more than {SHIFT_THRESHOLD}{' '}
                        between its turns. Stance runs from 0 to 1.
                    </span>
                </p>
            </div>

            <div className="meter-head" aria-hidden="true">
                <div className="meter-legend">
                    <span className="lg lg-a">{AGENTS.senatorbot.name}</span>
                    <span className="lg lg-b">{AGENTS.reformerbot.name}</span>
                </div>
                <div className="meter-scale">
                    <span style={{ left: '0%' }}>0</span>
                    <span style={{ left: '50%' }}>0.5</span>
                    <span style={{ left: '100%' }}>1</span>
                </div>
            </div>

            <ol className="turns" data-testid="turns">
                {rows.map((row) => (
                    <Turn key={row.id} row={row} newest={row.id === newestId} />
                ))}
            </ol>
            <div ref={endRef} />
        </section>
    );
};

export default DebatePanel;
