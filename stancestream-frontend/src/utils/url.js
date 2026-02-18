const trimTrailingSlash = (value) => value.replace(/\/+$/, '');

// Production backend URL - used as fallback when VITE_API_URL is not set
const PRODUCTION_API_URL = 'https://stancestream.onrender.com';

// Optional flag: when true, buildApiUrl will use same-origin (i.e., "/api") for HTTP
// while getWebSocketUrl will continue to use VITE_API_URL for WS connections.
const HTTP_SAME_ORIGIN = (import.meta?.env?.VITE_HTTP_SAME_ORIGIN || '').toString() === 'true';

const getRuntimeApiUrl = () => {
    if (typeof globalThis !== 'undefined' && typeof globalThis.__STANCESTREAM_API_URL__ === 'string') {
        return globalThis.__STANCESTREAM_API_URL__.trim();
    }

    const envUrl = (import.meta.env?.VITE_API_URL || '').trim();
    if (envUrl) {
        return envUrl;
    }

    // In production (HTTPS), use the production backend URL as fallback
    if (typeof globalThis !== 'undefined' && globalThis.location?.protocol === 'https:') {
        return PRODUCTION_API_URL;
    }

    return '';
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

    // If same-origin mode is enabled, always call "/api" on the current origin
    if (HTTP_SAME_ORIGIN) {
        return `/api${endpoint}`;
    }

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
