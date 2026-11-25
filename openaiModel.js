// Single source of truth for the OpenAI chat model id.
// Override with the OPENAI_MODEL env var (e.g. on Render) without a code change.
// gpt-4o-mini shuts down 2027-01-14; OpenAI's listed replacement is gpt-6-luna.
export const DEFAULT_OPENAI_MODEL = 'gpt-6-luna';
export const OPENAI_MODEL = process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL;

// gpt-6 models reject `max_tokens`, and with reasoning on they reject any
// non-default temperature and spend part of the small token budgets used here
// on hidden reasoning. reasoning_effort 'none' turns reasoning off, which keeps
// temperature working and leaves the whole budget for the reply.
const NO_REASONING_MODEL = /^gpt-6/;

// Sampling params for a chat.completions.create call against OPENAI_MODEL.
export function chatParams({ maxTokens, temperature } = {}) {
    const params = {};
    if (maxTokens !== undefined) params.max_completion_tokens = maxTokens;
    if (temperature !== undefined) params.temperature = temperature;
    if (NO_REASONING_MODEL.test(OPENAI_MODEL)) params.reasoning_effort = 'none';
    return params;
}
