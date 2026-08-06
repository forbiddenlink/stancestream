import React, { useEffect, useMemo, useRef } from 'react';
import Icon from './Icon';
import SentimentBadge from './SentimentBadge';
import TranscriptTicker from './TranscriptTicker';

/**
 * DebatePanel — Broadcast Versus-Arena
 *
 * Split-column "versus stage": each agent is pinned to the top of its own
 * column (cool "A" on the left, hot "B" on the right) over a shared near-black
 * stage, with a center spine carrying the VS badge and a live sentiment-lean
 * readout. The active speaker's column glows/pulses; new arguments reveal
 * word-by-word; a broadcast chyron scrolls the transcript along the bottom.
 */

// --- Agent / side configuration -------------------------------------------

const SIDES = {
    a: {
        key: 'a',
        icon: 'user',
        text: 'text-arena-a',
        border: 'border-arena-a/30',
        chip: 'bg-arena-a/10 border-arena-a/25',
        dot: 'bg-arena-a',
        avatar: 'from-arena-a to-arena-a-deep',
        column: 'arena-column-a',
    },
    b: {
        key: 'b',
        icon: 'zap',
        text: 'text-arena-b',
        border: 'border-arena-b/30',
        chip: 'bg-arena-b/10 border-arena-b/25',
        dot: 'bg-arena-b',
        avatar: 'from-arena-b to-arena-b-deep',
        column: 'arena-column-b',
    },
};

const sideKeyOf = (agentId) => (agentId === 'reformerbot' ? 'b' : 'a');

const displayName = (msg, agentId) =>
    (msg?.sender || agentId || 'agent').toString().toUpperCase();

const formatTimestamp = (timestamp) =>
    new Date(timestamp).toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
    });

const sentimentScore = (sentiment) => {
    if (!sentiment) return 0;
    const label = (sentiment.sentiment || sentiment || '').toString().toLowerCase();
    const conf = typeof sentiment.confidence === 'number' ? sentiment.confidence : 0.5;
    if (label.includes('pos')) return conf;
    if (label.includes('neg')) return -conf;
    return 0;
};

// --- Kinetic streaming-text reveal ----------------------------------------

const StreamingText = ({ text = '', animate = false }) => {
    if (!animate) return text;
    const tokens = text.split(/(\s+)/);
    let wordIndex = 0;
    return tokens.map((token, i) => {
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

// --- Single agent column ---------------------------------------------------

const AgentColumn = ({ sideKey, name, messages, isActive, newestId, align }) => {
    const side = SIDES[sideKey];
    const endRef = useRef(null);
    const countRef = useRef(0);

    useEffect(() => {
        if (messages.length > countRef.current) {
            const t = setTimeout(() => {
                endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 80);
            countRef.current = messages.length;
            return () => clearTimeout(t);
        }
        countRef.current = messages.length;
    }, [messages.length]);

    return (
        <div
            className={`arena-column ${side.column} ${isActive ? 'is-speaking' : ''} flex flex-col min-h-0 bg-stage-raised/60 rounded-xl border ${
                isActive ? side.border : 'border-stage-line'
            }`}
        >
            {/* Pinned agent header */}
            <div
                className={`flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-stage-line rounded-t-xl bg-stage/70 ${
                    align === 'right' ? 'flex-row-reverse text-right' : ''
                }`}
            >
                <div className="relative flex-shrink-0">
                    <div
                        className={`w-11 h-11 rounded-xl bg-gradient-to-br ${side.avatar} flex items-center justify-center shadow-lg`}
                    >
                        <Icon name={side.icon} size={20} className="text-stage" />
                    </div>
                    {isActive && (
                        <span
                            className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full ${side.dot} border-2 border-stage animate-pulse`}
                            aria-hidden="true"
                        />
                    )}
                </div>
                <div className={align === 'right' ? 'items-end' : ''}>
                    <div className={`font-display font-bold tracking-wide ${side.text}`}>{name}</div>
                    <div className="font-mono text-[10px] tracking-[0.18em] text-slate-500">
                        {isActive ? 'ON AIR' : 'STANDBY'} · {messages.length} ARG
                    </div>
                </div>
            </div>

            {/* Column message stream */}
            <div className="flex-1 overflow-y-auto scrollbar-thin min-h-0 px-3 py-4 space-y-3">
                {messages.length === 0 ? (
                    <div className="h-full min-h-[140px] flex items-center justify-center text-center px-4">
                        <p className="font-mono text-[11px] tracking-widest text-slate-600">
                            AWAITING OPENING STATEMENT
                        </p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`animate-slide-up rounded-xl border ${side.chip} p-3.5`}
                        >
                            <div
                                className={`flex items-center gap-2 mb-1.5 ${
                                    align === 'right' ? 'flex-row-reverse' : ''
                                }`}
                            >
                                <span className="font-mono text-[10px] text-slate-500">
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

                            <p className="font-sans text-[15px] leading-relaxed text-slate-100">
                                <StreamingText text={msg.text} animate={msg.id === newestId} />
                            </p>

                            {msg.factCheck && (
                                <div className="mt-2.5 pt-2.5 border-t border-stage-line flex items-center gap-2">
                                    <Icon name="shield-check" size={13} className={side.text} />
                                    <span className={`font-mono text-[10px] font-medium ${side.text}`}>
                                        FACT CHECK: {(msg.factCheck.score * 100).toFixed(0)}%
                                    </span>
                                </div>
                            )}
                        </div>
                    ))
                )}
                <div ref={endRef} />
            </div>
        </div>
    );
};

// --- Center spine: VS badge + live sentiment lean -------------------------

const CenterSpine = ({ scoreA, scoreB, hasData }) => {
    // Map -1..1 signed sentiment to a 0..100 bar height per side.
    const heightA = Math.round(((scoreA + 1) / 2) * 100);
    const heightB = Math.round(((scoreB + 1) / 2) * 100);
    const delta = (scoreA - scoreB).toFixed(2);

    return (
        <div className="hidden md:flex flex-col items-center justify-between py-2 px-1 select-none">
            <div className="font-display font-black text-slate-600 text-sm tracking-widest">VS</div>

            {hasData ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 w-14">
                    <div className="flex items-end gap-1.5 h-24">
                        <div className="w-2.5 h-full bg-stage-line/60 rounded-full flex flex-col justify-end overflow-hidden">
                            <div
                                className="w-full bg-arena-a rounded-full transition-all duration-500"
                                style={{ height: `${heightA}%` }}
                            />
                        </div>
                        <div className="w-2.5 h-full bg-stage-line/60 rounded-full flex flex-col justify-end overflow-hidden">
                            <div
                                className="w-full bg-arena-b rounded-full transition-all duration-500"
                                style={{ height: `${heightB}%` }}
                            />
                        </div>
                    </div>
                    <div className="font-mono text-[9px] tracking-widest text-slate-500 text-center leading-tight">
                        SENTIMENT
                        <br />
                        Δ {delta}
                    </div>
                </div>
            ) : (
                <div className="flex-1" />
            )}

            <div className="w-px flex-shrink-0 bg-stage-line" style={{ height: 0 }} />
        </div>
    );
};

// --- Panel -----------------------------------------------------------------

const DebatePanel = ({ messages = [] }) => {
    const activeAgentId = messages[messages.length - 1]?.agentId;
    const activeSide = messages.length ? sideKeyOf(activeAgentId) : null;
    const newestId = messages[messages.length - 1]?.id;

    const { colA, colB, nameA, nameB, scoreA, scoreB, hasSentiment } = useMemo(() => {
        const a = [];
        const b = [];
        let nA = 'SENATORBOT';
        let nB = 'REFORMERBOT';
        let sA = 0;
        let sB = 0;
        let sentimentSeen = false;
        for (const msg of messages) {
            if (sideKeyOf(msg.agentId) === 'b') {
                b.push(msg);
                nB = displayName(msg, msg.agentId);
                if (msg.sentiment) { sB = sentimentScore(msg.sentiment); sentimentSeen = true; }
            } else {
                a.push(msg);
                nA = displayName(msg, msg.agentId);
                if (msg.sentiment) { sA = sentimentScore(msg.sentiment); sentimentSeen = true; }
            }
        }
        return { colA: a, colB: b, nameA: nA, nameB: nB, scoreA: sA, scoreB: sB, hasSentiment: sentimentSeen };
    }, [messages]);

    return (
        <div className="h-full flex flex-col bg-stage border border-stage-line rounded-xl shadow-elevated overflow-hidden animate-fade-in">
            {/* Broadcast header */}
            <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 bg-stage-raised border-b border-stage-line">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-arena-b animate-pulse" aria-hidden="true" />
                        <span className="font-mono text-[10px] font-bold tracking-[0.22em] text-arena-b">
                            LIVE
                        </span>
                    </div>
                    <div className="h-4 w-px bg-stage-line" aria-hidden="true" />
                    <h2 className="font-display text-lg font-bold tracking-wide text-slate-100">
                        Debate Arena
                    </h2>
                </div>

                {messages.length > 0 && (
                    <div className="flex items-center gap-4">
                        <span className="font-mono text-[11px] text-slate-400">
                            {messages.length} EXCHANGES
                        </span>
                        <span className="font-mono text-[11px] text-slate-500">
                            {formatTimestamp(messages[messages.length - 1]?.timestamp)}
                        </span>
                    </div>
                )}
            </div>

            {/* Versus stage */}
            {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-5">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-arena-a to-arena-a-deep flex items-center justify-center shadow-glow">
                            <Icon name="user" size={28} className="text-stage" />
                        </div>
                        <span className="font-display font-black text-2xl text-slate-600">VS</span>
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-arena-b to-arena-b-deep flex items-center justify-center shadow-glow-strong">
                            <Icon name="zap" size={28} className="text-stage" />
                        </div>
                    </div>
                    <h3 className="font-display text-xl font-bold text-slate-200">Ready for the Arena</h3>
                    <p className="font-sans text-slate-400 max-w-md leading-relaxed">
                        Select a topic and start a debate. Two AI agents take opposite corners with
                        live fact-checking, memory, and stance evolution.
                    </p>
                </div>
            ) : (
                <div className="flex-1 min-h-0 grid grid-cols-2 md:grid-cols-[1fr_auto_1fr] gap-2 p-2">
                    <AgentColumn
                        sideKey="a"
                        name={nameA}
                        messages={colA}
                        isActive={activeSide === 'a'}
                        newestId={newestId}
                        align="left"
                    />
                    <CenterSpine scoreA={scoreA} scoreB={scoreB} hasData={hasSentiment} />
                    <AgentColumn
                        sideKey="b"
                        name={nameB}
                        messages={colB}
                        isActive={activeSide === 'b'}
                        newestId={newestId}
                        align="right"
                    />
                </div>
            )}

            {/* Broadcast chyron */}
            <TranscriptTicker messages={messages} />
        </div>
    );
};

export default DebatePanel;
