/**
 * Backend Sentry init. MUST be the first import in server.js so it initializes
 * before other modules load. No-op until SENTRY_DSN is set in the environment.
 *
 * Captures uncaught exceptions and unhandled promise rejections automatically
 * (e.g. Redis connection drops), which is the crash class this server has hit.
 */
import "dotenv/config";
import * as Sentry from "@sentry/node";

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV ?? "development",
    release: process.env.RENDER_GIT_COMMIT ?? process.env.VERCEL_GIT_COMMIT_SHA,
  });
}
