// Redis operations modal: a plain reference of the four models and a list of operations.
import { useEffect, useRef } from 'react';
import RedisMatrixStream from './RedisMatrixStream';

const MODELS = [
    ['RedisJSON', 'Agent profiles, cache metrics, platform scoring.'],
    ['Streams', 'Debate messages, agent memory, key moments.'],
    ['TimeSeries', 'Stance over time, plus other measurements recorded over time.'],
    ['Vector search', 'The fact store for fact checks and the semantic cache (cosine similarity).'],
];

export default function RedisMatrixModal({ isOpen, onClose }) {
    const closeRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return undefined;
        closeRef.current?.focus();
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="arena-modal" role="dialog" aria-modal="true" aria-labelledby="matrix-title">
            <div className="arena-modal-body">
                <div className="pane-head">
                    <h2 id="matrix-title" className="pane-title">Redis operations</h2>
                    <button type="button" className="btn-plain" onClick={onClose} ref={closeRef}>Close</button>
                </div>
                <p className="section-note">
                    How the four Redis data models work together. Agent profiles sit in JSON, messages flow
                    through Streams, stance is recorded in TimeSeries, and Vector search backs fact checks and the cache.
                </p>

                <table className="ledger">
                    <caption>The four models</caption>
                    <thead><tr><th scope="col">Model</th><th scope="col">Holds</th></tr></thead>
                    <tbody>
                        {MODELS.map(([name, holds]) => (
                            <tr key={name}><th scope="row">{name}</th><td>{holds}</td></tr>
                        ))}
                    </tbody>
                </table>

                <RedisMatrixStream position="embedded" />
            </div>
        </div>
    );
}
