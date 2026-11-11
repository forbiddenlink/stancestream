// Single implementation lives in src/utils/langfuse.js so the process has one
// Langfuse tracer provider (the v6 SDK registers its provider globally per module).
export { getLangfuse, flushLangfuse } from "../src/utils/langfuse.js";

export function isLangfuseConfigured(): boolean {
  return Boolean(
    process.env.LANGFUSE_SECRET_KEY && process.env.LANGFUSE_PUBLIC_KEY,
  );
}
