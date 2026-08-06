/**
 * TranscriptTicker
 * Broadcast-style chyron fed from the live debate message stream.
 * Scrolls the latest exchanges as a CSS marquee (mono font, "data" feel).
 * Motion is gated: under prefers-reduced-motion it renders a single static
 * row (latest snippet) with no marquee so nothing scrolls off-screen.
 */

import { useEffect, useMemo, useState } from 'react';

function usePrefersReducedMotion() {
    const [reduced, setReduced] = useState(() =>
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    );

    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const onChange = (e) => setReduced(e.matches);
        mq.addEventListener?.('change', onChange);
        return () => mq.removeEventListener?.('change', onChange);
    }, []);

    return reduced;
}

const sideOf = (agentId) => (agentId === 'reformerbot' ? 'b' : 'a');

const TranscriptTicker = ({ messages = [] }) => {
    const reduced = usePrefersReducedMotion();

    const items = useMemo(() => {
        return messages.slice(-14).map((m, i) => ({
            key: m.id ?? i,
            side: sideOf(m.agentId),
            name: (m.sender || m.agentId || 'agent').toString().toUpperCase(),
            text: (m.text || '').replace(/\s+/g, ' ').trim(),
        }));
    }, [messages]);

    const hasItems = items.length > 0;

    const Item = ({ item }) => (
        <span className="inline-flex items-center gap-2 px-5">
            <span
                className={`font-mono text-[11px] font-semibold tracking-widest ${
                    item.side === 'b' ? 'text-arena-b' : 'text-arena-a'
                }`}
            >
                {item.name}
            </span>
            <span className="text-stage-line" aria-hidden="true">
                ▸
            </span>
            <span className="font-mono text-[12px] text-slate-300/90">{item.text}</span>
        </span>
    );

    const Divider = () => (
        <span className="px-2 text-slate-600 select-none" aria-hidden="true">
            //
        </span>
    );

    return (
        <div
            className="arena-ticker flex-shrink-0 flex items-center gap-3 border-t border-stage-line bg-stage-raised/90 px-4 py-2 overflow-hidden rounded-b-xl"
            role="log"
            aria-label="Live debate transcript ticker"
        >
            <span className="flex-shrink-0 flex items-center gap-2 pr-3 border-r border-stage-line">
                <span className="w-2 h-2 rounded-full bg-arena-b animate-pulse" aria-hidden="true" />
                <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-slate-400">
                    LIVE
                </span>
            </span>

            {!hasItems ? (
                <span className="font-mono text-[12px] text-slate-500 tracking-wide">
                    AWAITING TRANSCRIPT…
                </span>
            ) : reduced ? (
                // Static fallback: newest snippet only, no marquee.
                <div className="min-w-0 flex-1 overflow-hidden whitespace-nowrap text-ellipsis">
                    <Item item={items[items.length - 1]} />
                </div>
            ) : (
                <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="arena-ticker-track">
                        {/* Two identical runs so the -50% loop is seamless */}
                        {[0, 1].map((run) => (
                            <span key={run} className="inline-flex items-center" aria-hidden={run === 1}>
                                {items.map((item) => (
                                    <span key={`${run}-${item.key}`} className="inline-flex items-center">
                                        <Item item={item} />
                                        <Divider />
                                    </span>
                                ))}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TranscriptTicker;
