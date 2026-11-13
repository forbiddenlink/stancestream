// Business view: only what the backend measured from the semantic cache.
// The backend (costCalculator.js) also derives dollar savings, annual figures and
// enterprise projections from an assumed token price and an assumed 500 tokens per
// request, and prints fixed claims ("10x faster", "technical moat"). None of that is
// measured, so none of it is shown here.
import { useState, useEffect, memo } from 'react';
import api from '../services/api';

const Stat = ({ label, value, note }) => (
    <div className="stat">
        <dt>{label}</dt>
        <dd>{value}</dd>
        {note && <p>{note}</p>}
    </div>
);

const BusinessValueDashboard = memo(function BusinessValueDashboard() {
    const [metrics, setMetrics] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [tick, setTick] = useState(0);

    useEffect(() => {
        let live = true;
        api.getBusinessSummary()
            .then((res) => {
                if (!live) return;
                if (res.success) { setMetrics(res.detailed_metrics); setError(null); }
                else setError('The server answered, but sent no cache measurements.');
            })
            .catch((e) => {
                console.error('Business metrics fetch error:', e);
                if (live) setError('The cache measurements could not be loaded. The server is not reachable or did not answer.');
            })
            .finally(() => { if (live) setIsLoading(false); });
        return () => { live = false; };
    }, [tick]);

    return (
        <section className="view-pane" aria-labelledby="biz-title">
            <h2 id="biz-title" style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 600, margin: '0 0 8px' }}>
                Cache measurements
            </h2>
            <p className="section-note">
                What the semantic cache measured on this server: how often a similar question was
                answered from the cache instead of the AI provider.
            </p>

            {isLoading && <p role="status">Loading the cache measurements.</p>}
            {error && <p role="status">{error}</p>}

            {metrics?.current_usage && (
                <dl className="stat-list">
                    <Stat label="Cache hit rate" value={metrics.current_usage.cache_efficiency} />
                    <Stat label="AI calls avoided" value={(metrics.performance_impact?.api_calls_eliminated ?? 0).toLocaleString()} note="Cache hits counted by the server." />
                </dl>
            )}

            <p className="section-note">
                Dollar savings and enterprise projections are not shown. The server computes them from an
                assumed token price and an assumed request size, so they are estimates, not measurements.
            </p>
            <button type="button" className="btn-plain" onClick={() => setTick((t) => t + 1)}>Refresh</button>
        </section>
    );
});

export default BusinessValueDashboard;
