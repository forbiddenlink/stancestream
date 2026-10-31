// Missing values render as "-" instead of a made-up number.
export const show = (value, suffix = '') => (value === null || value === undefined ? '-' : `${value}${suffix}`);

// The backend stores the cache hit ratio as a 0-1 decimal.
export const toPercent = (ratio) => (typeof ratio === 'number' ? ratio * 100 : null);

// A backend response flagged `fallback` carries fixed placeholder counts, not measurements.
export function assertLiveStats(stats) {
    if (!stats || stats.fallback || stats.error) {
        throw new Error('Stats unavailable');
    }
    return stats;
}
