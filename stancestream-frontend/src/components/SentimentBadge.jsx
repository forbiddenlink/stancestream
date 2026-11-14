// A plain-words sentiment label for one turn. Only what the message carries:
// the label and its confidence. (An earlier version drew a sparkline of
// generated placeholder numbers; that is gone.)

const LABELS = { positive: 'positive', negative: 'negative', neutral: 'neutral' };

export default function SentimentBadge({ sentiment, confidence }) {
    const conf = typeof confidence === 'number' ? confidence : 0;
    const key = String(sentiment || 'neutral').toLowerCase();
    // Below 0.6 the server's own classifier is not sure; say so.
    const label = conf < 0.6 ? 'uncertain' : LABELS[key] || 'neutral';
    return (
        <span className="sentiment-label">
            Sentiment {label}, confidence {conf.toFixed(2)}
        </span>
    );
}
