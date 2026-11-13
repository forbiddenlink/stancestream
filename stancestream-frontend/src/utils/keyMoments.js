// api.get returns the parsed response body, so the moments sit at its top level.
// 'single' reads /api/debate/:id/key-moments ({ moments, stats });
// 'all' reads /api/key-moments/all ({ moments, total }).
export function readKeyMoments(body, scope) {
    const moments = Array.isArray(body?.moments) ? body.moments : [];
    if (scope === 'all') {
        return { moments, stats: { total_moments: body?.total || 0 } };
    }
    return { moments, stats: body?.stats || { total_moments: 0 } };
}
