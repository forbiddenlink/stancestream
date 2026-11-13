import '../pages/home.css';

const TRACK_TICKS = [0, 0.25, 0.5, 0.75, 1];

/**
 * One stance track on a 0 to 1 scale: a dot per bot, and the gap bar between
 * them once both have a value. A bot with no value yet has no dot (nothing is
 * guessed). Used by the home page and by the arena record.
 */
export default function Track({ values }) {
    const a = values?.senatorbot;
    const b = values?.reformerbot;
    const has = a !== undefined && b !== undefined;
    // when the dots are close, print the second number under the line so the two do not overlap
    const close = has && Math.abs(a - b) < 0.14;
    return (
        <div className="track" aria-hidden="true">
            <span className="track-rule" />
            {TRACK_TICKS.map((t) => (
                <span key={t} className="track-tick" style={{ left: `${t * 100}%` }} />
            ))}
            {has && (
                <span
                    className="track-gap"
                    style={{ left: `${Math.min(a, b) * 100}%`, width: `${Math.abs(a - b) * 100}%` }}
                />
            )}
            {a !== undefined && (
                <span className="track-dot dot-a" style={{ left: `${a * 100}%` }}>
                    <span className="track-val">{a.toFixed(1)}</span>
                </span>
            )}
            {b !== undefined && (
                <span className="track-dot dot-b" style={{ left: `${b * 100}%` }}>
                    <span className={`track-val${close ? ' track-val-below' : ''}`}>{b.toFixed(1)}</span>
                </span>
            )}
        </div>
    );
}
