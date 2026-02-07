const trimTrailingSlash = (value) => value.replace(/\/+$/, '');

const getRuntimeApiUrl = () => {
    if (typeof globalThis !== 'undefined' && typeof globalThis.__STANCESTREAM_API_URL__ === 'string') {
        return globalThis.__STANCESTREAM_API_URL__.trim();
    }

    return (import.meta.env?.VITE_API_URL || '').trim();
};

const getPageProtocol = () => {
    const protocol = globalThis.location?.protocol || 'https:';
    return protocol === 'https:' ? 'wss' : 'ws';
};

export const getApiOrigin = () => {
    const rawApiUrl = getRuntimeApiUrl();
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
            const protocol = getPageProtocol();
            return `${protocol}://${sanitizedHost}`;
        }
    }

    const protocol = getPageProtocol();
    const hostname = globalThis.location?.hostname || 'localhost';
    return `${protocol}://${hostname}:3001`;
};
