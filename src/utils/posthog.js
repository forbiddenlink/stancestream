/**
 * PostHog server-side analytics singleton
 * Captures event telemetry for debate interactions and AI usage.
 */

import { PostHog } from "posthog-node";

let posthogInstance = null;

/**
 * @returns {PostHog|null}
 */
export function getPostHog() {
  const key =
    process.env.NEXT_PUBLIC_POSTHOG_KEY || process.env.POSTHOG_API_KEY;
  if (!key) return null;

  if (!posthogInstance) {
    posthogInstance = new PostHog(key, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      flushAt: 20,
      flushInterval: 10000,
    });
  }

  return posthogInstance;
}

/**
 * Capture a server-side event. No-ops silently if PostHog is not configured.
 * @param {string} event
 * @param {Record<string,unknown>} properties
 */
export function captureEvent(event, properties = {}) {
  const ph = getPostHog();
  if (!ph) return;
  ph.capture({
    distinctId: properties.debateId ?? "server",
    event,
    properties,
  });
}

export async function shutdownPostHog() {
  if (posthogInstance) {
    await posthogInstance.shutdown().catch(() => {});
  }
}
