/**
 * Langfuse Instrumentation Helper
 *
 * Provides singleton Langfuse instance and safe async flushing.
 * Returns null if environment variables missing, allowing graceful degradation.
 */

import { Langfuse } from "langfuse";

let langfuseInstance = null;

/**
 * Get or create Langfuse singleton
 * @returns {Langfuse|null} Langfuse instance or null if unconfigured
 */
export function getLangfuse() {
  const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
  const secretKey = process.env.LANGFUSE_SECRET_KEY;

  if (!publicKey || !secretKey) {
    return null;
  }

  if (!langfuseInstance) {
    langfuseInstance = new Langfuse({
      publicKey,
      secretKey,
      baseUrl: process.env.LANGFUSE_HOST || "https://cloud.langfuse.com",
    });
  }

  return langfuseInstance;
}

/**
 * Flush pending traces to Langfuse
 * Never throws - safe to call in finally/error blocks
 * @returns {Promise<void>}
 */
export async function flushLangfuse() {
  const langfuse = getLangfuse();
  if (!langfuse) return;

  try {
    await langfuse.flushAsync();
  } catch (error) {
    // Never fail request due to Langfuse errors
    console.error("[Langfuse] Flush error (non-fatal):", error.message);
  }
}
