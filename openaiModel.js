// Single source of truth for the OpenAI chat model id.
// Override with the OPENAI_MODEL env var (e.g. on Render) without a code change.
// Note: OpenAI lists gpt-4o-mini as deprecated (shutdown 2027-01-14), so plan to
// move to a newer model via OPENAI_MODEL before then.
export const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';
export const OPENAI_MODEL = process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL;
