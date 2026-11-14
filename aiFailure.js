// Shared handling for failed model calls. Failures must be visible, not
// disguised as a normal debate turn (a retired model once went unnoticed for months).

export const AI_FAILURE_MESSAGE = 'The AI model failed to respond. Check server logs.';

// Log once with the OpenAI error details (never the API key) and return a flagged result.
export function buildAiFailure(context, error) {
    const status = error?.status ?? error?.response?.status ?? null;
    const code = error?.code ?? error?.error?.code ?? null;
    console.error(
        `❌ AI model failure in ${context}: status=${status ?? 'n/a'} code=${code ?? 'n/a'} message=${error?.message ?? String(error)}`
    );
    return {
        error: true,
        message: AI_FAILURE_MESSAGE,
        reason: error?.message ?? String(error),
        status,
        code,
        cacheHit: false,
        similarity: 0,
        costSaved: 0
    };
}
