const trimTrailingSlash = (value) => value.replace(/\/+$/, '');

const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim();

export const getApiOrigin = () => {
    if (!rawApiUrl) {
        return '';
    }

    return trimTrailingSlash(rawApiUrl);
};

export const buildApiUrl = (path = '') => {
    const endpoint = path.startsWith('/') ? path : `/${path}`;
    const origin = getApiOrigin();

    if (!origin) {
        return `/api${endpoint}`;
    }

    return `${origin}/api${endpoint}`;
};

export const getWebSocketUrl = () => {
    const origin = getApiOrigin();

    if (origin) {
        const withProtocol = origin.includes('://') ? origin : `https://${origin}`;

        try {
            const parsed = new URL(withProtocol);
            let protocol = 'wss:';

            if (parsed.protocol === 'http:' || parsed.protocol === 'ws:') {
                protocol = 'ws:';
            }

            return `${protocol}//${parsed.host}`;
        } catch {
            const sanitizedHost = origin
                .replace(/^https?:\/\//, '')
                .replace(/^wss?:\/\//, '')
                .replace(/\/.*$/, '');
            const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
            return `${protocol}://${sanitizedHost}`;
        }
    }

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const hostname = window.location.hostname || 'localhost';
    return `${protocol}://${hostname}:3001`;
};
