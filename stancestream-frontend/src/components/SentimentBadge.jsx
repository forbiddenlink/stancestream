// A plain-words sentiment label for one turn. Only what the message carries:
// the label and its confidence. (An earlier version drew a sparkline of
// generated placeholder numbers; that is gone.)
import { confidenceLabel } from '../utils/confidence.js';

const LABELS = { positive: 'positive', negative: 'negative', neutral: 'neutral' };

export default function SentimentBadge({ sentiment, confidence }) {
    const shown = confidenceLabel(confidence);
    const key = String(sentiment || 'neutral').toLowerCase();
    // Below 0.6 the server's own classifier is not sure; say so. A missing
    // confidence is unavailable, not a measured 0.00.
    const label = shown === null || Number(shown) < 0.6 ? 'uncertain' : LABELS[key] || 'neutral';
    return (
        <span className="sentiment-label">
            Sentiment {label}, {shown === null ? 'confidence unavailable' : `confidence ${shown}`}
        </span>
    );
}
