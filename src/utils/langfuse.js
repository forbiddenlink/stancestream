/**
 * Langfuse Instrumentation Helper (SDK v6, OpenTelemetry-based)
 *
 * Keeps the v3-shaped surface used by callers
 * (getLangfuse().trace(...).generation(...).end(...)) on top of
 * @langfuse/tracing. Returns null if environment variables are missing,
 * allowing graceful degradation. Uses an isolated tracer provider so
 * Langfuse never touches a global OpenTelemetry provider.
 */

import { createHash, randomBytes } from "node:crypto";
import { LangfuseSpanProcessor } from "@langfuse/otel";
import {
  LangfuseOtelSpanAttributes,
  setLangfuseTracerProvider,
  startObservation,
} from "@langfuse/tracing";
import { context, ROOT_CONTEXT } from "@opentelemetry/api";
import {
  AlwaysOnSampler,
  NodeTracerProvider,
} from "@opentelemetry/sdk-trace-node";

/** @type {LangfuseSpanProcessor | null} */
let processor = null;

function getProcessor() {
  if (processor) return processor;

  const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
  const secretKey = process.env.LANGFUSE_SECRET_KEY;
  if (!publicKey || !secretKey) return null;

  processor = new LangfuseSpanProcessor({
    publicKey,
    secretKey,
    baseUrl:
      process.env.LANGFUSE_BASE_URL ||
      process.env.LANGFUSE_HOST ||
      "https://cloud.langfuse.com",
    environment: process.env.NODE_ENV,
    release: process.env.VERCEL_GIT_COMMIT_SHA,
  });
  setLangfuseTracerProvider(
    new NodeTracerProvider({
      sampler: new AlwaysOnSampler(),
      spanProcessors: [processor],
    }),
  );
  return processor;
}

function safe(fn) {
  try {
    return fn();
  } catch {
    // Tracing must never break the caller.
    return undefined;
  }
}

function asString(value) {
  return typeof value === "string" ? value : JSON.stringify(value);
}

/** Map v3 usage ({promptTokens, completionTokens, input, output, total}) to usageDetails. */
function toUsageDetails(usage) {
  if (!usage) return undefined;
  const details = {};
  const input = usage.input ?? usage.promptTokens;
  const output = usage.output ?? usage.completionTokens;
  if (input !== undefined) details.input = input;
  if (output !== undefined) details.output = output;
  if (usage.total !== undefined) details.total = usage.total;
  return Object.keys(details).length > 0 ? details : undefined;
}

function defined(attrs) {
  return Object.fromEntries(
    Object.entries(attrs).filter(([, value]) => value !== undefined),
  );
}

function traceAttributes(params) {
  const attrs = {};
  if (params.name) attrs[LangfuseOtelSpanAttributes.TRACE_NAME] = params.name;
  if (params.userId)
    attrs[LangfuseOtelSpanAttributes.TRACE_USER_ID] = params.userId;
  if (params.sessionId)
    attrs[LangfuseOtelSpanAttributes.TRACE_SESSION_ID] = params.sessionId;
  if (params.tags) attrs[LangfuseOtelSpanAttributes.TRACE_TAGS] = params.tags;
  if (params.input !== undefined)
    attrs[LangfuseOtelSpanAttributes.TRACE_INPUT] = asString(params.input);
  if (params.output !== undefined)
    attrs[LangfuseOtelSpanAttributes.TRACE_OUTPUT] = asString(params.output);
  for (const [key, value] of Object.entries(params.metadata ?? {})) {
    attrs[`${LangfuseOtelSpanAttributes.TRACE_METADATA}.${key}`] =
      asString(value);
  }
  return attrs;
}

const noopGeneration = { end() {}, update() {} };
const noopTrace = {
  id: undefined,
  generation: () => noopGeneration,
  update() {},
  end() {},
};

function wrapGeneration(generation) {
  return {
    update(params = {}) {
      safe(() => generation.update(buildGenerationUpdate(params)));
    },
    end(params = {}) {
      safe(() => {
        generation.update(buildGenerationUpdate(params));
        generation.end();
      });
    },
  };
}

function buildGenerationUpdate(params) {
  return defined({
    output: params.output,
    metadata: params.metadata,
    level: params.level,
    statusMessage: params.statusMessage,
    usageDetails: toUsageDetails(params.usage),
  });
}

function startTrace(params) {
  // Start from ROOT_CONTEXT so each trace is its own trace. A caller-supplied
  // id maps deterministically to an OpenTelemetry trace id.
  const parentSpanContext = params.id
    ? {
        traceId: createHash("sha256")
          .update(String(params.id))
          .digest("hex")
          .slice(0, 32),
        spanId: randomBytes(8).toString("hex"),
        traceFlags: 1,
      }
    : undefined;
  const root = context.with(ROOT_CONTEXT, () =>
    startObservation(
      params.name,
      defined({ input: params.input, metadata: params.metadata }),
      parentSpanContext ? { parentSpanContext } : undefined,
    ),
  );
  root.otelSpan.setAttributes(traceAttributes(params));
  // A v3 trace is a point-in-time record; children attach by trace id.
  root.end();

  return {
    id: root.traceId,
    generation(gen = {}) {
      const child = safe(() =>
        root.startObservation(
          gen.name ?? "generation",
          defined({
            model: gen.model,
            modelParameters: gen.modelParameters,
            input: gen.input,
            metadata: gen.metadata,
          }),
          { asType: "generation" },
        ),
      );
      return child ? wrapGeneration(child) : noopGeneration;
    },
    /** Trace-level output update, recorded as a short child span in the same trace. */
    update(update = {}) {
      safe(() => {
        const span = root.startObservation(
          "trace-update",
          defined({ output: update.output, metadata: update.metadata }),
        );
        span.otelSpan.setAttributes(traceAttributes(update));
        span.end();
      });
    },
    // v3 traces had no end(); calls were a TypeError. Keep it a no-op.
    end() {},
  };
}

const client = {
  trace(params) {
    if (!getProcessor()) return noopTrace;
    return safe(() => startTrace(params)) ?? noopTrace;
  },
};

/**
 * Get the Langfuse client
 * @returns {typeof client | null} client, or null if unconfigured
 */
export function getLangfuse() {
  return getProcessor() ? client : null;
}

/**
 * Flush pending traces to Langfuse
 * Never throws - safe to call in finally/error blocks
 * @returns {Promise<void>}
 */
export async function flushLangfuse() {
  try {
    await processor?.forceFlush();
  } catch (error) {
    // Never fail request due to Langfuse errors
    console.error("[Langfuse] Flush error (non-fatal):", error.message);
  }
}
