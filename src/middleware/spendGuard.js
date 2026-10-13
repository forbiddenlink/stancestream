/**
 * Spend guard: bounds how much OpenAI money anonymous callers can burn.
 *
 * Why this exists: POST /api/debate/start was unauthenticated and only had a
 * 100ms global cooldown, so any caller could start debates that each make
 * dozens of model calls. Three layers now apply to every route that can
 * trigger a model call:
 *   1. Request validation (topic length, allowed agent ids, rounds cap).
 *   2. A per-IP counter with a TTL window (default 3 debates per hour).
 *   3. A global daily counter (default 50 debates per UTC day).
 * Counters live in Redis (INCRBY + EXPIRE NX). If Redis cannot be reached the
 * guard FAILS CLOSED with a 503, because an unmeasurable limit is no limit.
 */

const DEFAULT_AGENTS = ["senatorbot", "reformerbot"];

function positiveInt(value, fallback) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Read limits from env. Every value falls back to a safe default. */
export function readSpendConfig(env = process.env) {
  return {
    debate: {
      perIpLimit: positiveInt(env.DEBATE_START_PER_IP_LIMIT, 3),
      perIpWindowSec: positiveInt(env.DEBATE_START_PER_IP_WINDOW_SEC, 3600),
      globalDailyLimit: positiveInt(env.DEBATE_START_GLOBAL_DAILY_LIMIT, 50),
    },
    ai: {
      perIpLimit: positiveInt(env.AI_CALL_PER_IP_LIMIT, 30),
      perIpWindowSec: positiveInt(env.AI_CALL_PER_IP_WINDOW_SEC, 3600),
      globalDailyLimit: positiveInt(env.AI_CALL_GLOBAL_DAILY_LIMIT, 500),
    },
    maxRounds: positiveInt(env.DEBATE_MAX_ROUNDS, 5),
    maxMessageLength: positiveInt(env.DEBATE_MAX_MESSAGE_LENGTH, 1000),
    maxTopicLength: positiveInt(env.DEBATE_MAX_TOPIC_LENGTH, 200),
    maxAgents: positiveInt(env.DEBATE_MAX_AGENTS, 2),
    maxMultiTopics: positiveInt(env.DEBATE_MAX_MULTI_TOPICS, 3),
    maxDemoDurationSec: positiveInt(env.DEMO_MAX_DURATION_SEC, 30),
    allowedAgents: DEFAULT_AGENTS,
  };
}

/** Clamp a requested round count into [1, max]. Non-numbers become max. */
export function clampRounds(requested, max) {
  const n = Number.parseInt(requested, 10);
  if (!Number.isFinite(n)) return max;
  return Math.min(Math.max(n, 1), max);
}

const DEBATE_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
// biome-ignore lint/suspicious/noControlCharactersInRegex: rejecting control chars is the point
const CONTROL_CHARS_RE = /[\u0000-\u001f\u007f]/;

function validateTopic(topic, cfg) {
  if (typeof topic !== "string") return "topic must be a string";
  const trimmed = topic.trim();
  if (trimmed.length === 0) return "topic is required";
  if (trimmed.length > cfg.maxTopicLength) {
    return `topic must be at most ${cfg.maxTopicLength} characters`;
  }
  if (CONTROL_CHARS_RE.test(trimmed)) return "topic contains control characters";
  return null;
}

function validateAgents(agents, cfg) {
  if (!Array.isArray(agents)) return "agents must be an array";
  if (agents.length < 2 || agents.length > cfg.maxAgents) {
    return `agents must contain between 2 and ${cfg.maxAgents} ids`;
  }
  if (new Set(agents).size !== agents.length) return "agents must be distinct";
  for (const id of agents) {
    if (typeof id !== "string" || !cfg.allowedAgents.includes(id)) {
      return `unknown agent id; allowed: ${cfg.allowedAgents.join(", ")}`;
    }
  }
  return null;
}

/**
 * Validate a single-debate start body. Pure, returns {ok, value} or
 * {ok:false, error}. Rounds are clamped, never trusted.
 */
export function validateDebateStartBody(body, cfg = readSpendConfig()) {
  const b = body && typeof body === "object" && !Array.isArray(body) ? body : {};

  const topicError = validateTopic(b.topic, cfg);
  if (topicError) return { ok: false, error: topicError };

  let agents = DEFAULT_AGENTS;
  if (b.agents !== undefined) {
    const agentsError = validateAgents(b.agents, cfg);
    if (agentsError) return { ok: false, error: agentsError };
    agents = b.agents;
  }

  let debateId;
  if (b.debateId !== undefined) {
    if (typeof b.debateId !== "string" || !DEBATE_ID_RE.test(b.debateId)) {
      return {
        ok: false,
        error: "debateId must match [A-Za-z0-9_-] and be 1-64 characters",
      };
    }
    debateId = b.debateId;
  }

  return {
    ok: true,
    value: {
      debateId,
      topic: b.topic.trim(),
      agents,
      rounds: clampRounds(b.rounds, cfg.maxRounds),
    },
  };
}

/** Validate the start-multiple body: a bounded list of valid topics. */
export function validateMultiStartBody(body, cfg = readSpendConfig()) {
  const b = body && typeof body === "object" && !Array.isArray(body) ? body : {};
  if (!Array.isArray(b.topics) || b.topics.length === 0) {
    return { ok: false, error: "topics must be a non-empty array" };
  }
  if (b.topics.length > cfg.maxMultiTopics) {
    return {
      ok: false,
      error: `at most ${cfg.maxMultiTopics} topics per request`,
    };
  }
  for (const t of b.topics) {
    const topicError = validateTopic(t, cfg);
    if (topicError) return { ok: false, error: topicError };
  }
  let agents = DEFAULT_AGENTS;
  if (b.agents !== undefined) {
    const agentsError = validateAgents(b.agents, cfg);
    if (agentsError) return { ok: false, error: agentsError };
    agents = b.agents;
  }
  return {
    ok: true,
    value: { topics: b.topics.map((t) => t.trim()), agents },
  };
}

/** Clamp a demo duration (seconds) so a caller cannot run a long model loop. */
export function clampDemoDuration(requested, cfg = readSpendConfig()) {
  const n = Number(requested);
  if (!Number.isFinite(n) || n <= 0) return cfg.maxDemoDurationSec;
  return Math.min(n, cfg.maxDemoDurationSec);
}

function safeKeyPart(value) {
  return String(value || "unknown").replace(/[^A-Za-z0-9:._-]/g, "_");
}

function utcDay(date) {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

async function bump(client, key, amount, ttlSec) {
  const results = await client
    .multi()
    .incrBy(key, amount)
    .expire(key, ttlSec, "NX")
    .exec();
  const count = Number(results[0]);
  if (!Number.isFinite(count)) throw new Error("unexpected INCRBY reply");
  return count;
}

/**
 * Build an Express middleware enforcing a per-IP window and a global daily cap.
 *
 * @param {object} opts
 * @param {() => Promise<object>} opts.getClient  resolves the Redis client
 * @param {string} opts.scope  counter namespace, e.g. "debate" or "ai"
 * @param {number} opts.perIpLimit
 * @param {number} opts.perIpWindowSec
 * @param {number} opts.globalDailyLimit
 * @param {(req) => number} [opts.cost]  units this request consumes (default 1)
 * @param {() => Date} [opts.now]
 */
export function createSpendGuard({
  getClient,
  scope,
  perIpLimit,
  perIpWindowSec,
  globalDailyLimit,
  cost = () => 1,
  now = () => new Date(),
}) {
  return async function spendGuard(req, res, next) {
    const units = cost(req);
    const ipKey = `spend:${scope}:ip:${safeKeyPart(req.ip)}`;
    const globalKey = `spend:${scope}:global:${utcDay(now())}`;

    let ipCount;
    let globalCount;
    try {
      const client = await getClient();
      ipCount = await bump(client, ipKey, units, perIpWindowSec);
      if (ipCount > perIpLimit) {
        res.set("Retry-After", String(perIpWindowSec));
        return res.status(429).json({
          error: "Rate limit exceeded",
          code: "ip_limit",
          message: `Limit of ${perIpLimit} per ${Math.round(perIpWindowSec / 60)} minutes reached for your address. Try again later.`,
        });
      }
      globalCount = await bump(client, globalKey, units, 172800);
    } catch (error) {
      // Fail closed: if the counter cannot be read or written, refuse.
      console.error(
        `spendGuard(${scope}) counter unavailable, failing closed:`,
        error.message,
      );
      return res.status(503).json({
        error: "Service temporarily unavailable",
        code: "limiter_unavailable",
      });
    }

    if (globalCount > globalDailyLimit) {
      res.set("Retry-After", "3600");
      return res.status(429).json({
        error: "Daily capacity reached",
        code: "daily_cap",
        message: "The demo has reached its daily usage cap. Try again tomorrow.",
      });
    }
    return next();
  };
}

/** Express middleware factory: validate then stash the result on the request. */
export function validateBody(validator, cfg) {
  return (req, res, next) => {
    const result = validator(req.body, cfg);
    if (!result.ok) {
      return res.status(400).json({ error: "Invalid request", message: result.error });
    }
    req.validated = result.value;
    return next();
  };
}

/**
 * Debug routes are off in production unless ENABLE_DEBUG_ROUTES=true.
 * Reads env per request so it can be tested and flipped without a reload.
 */
export function debugRoutesGate(env = process.env) {
  return (_req, res, next) => {
    const enabled =
      env.ENABLE_DEBUG_ROUTES === "true" || env.NODE_ENV !== "production";
    if (!enabled) return res.status(404).json({ error: "Not found" });
    return next();
  };
}

/** Validate the manual key-moment body: strings only, message length capped. */
export function validateKeyMomentBody(body, cfg = readSpendConfig()) {
  const b = body && typeof body === "object" && !Array.isArray(body) ? body : {};
  if (typeof b.message !== "string" || b.message.trim().length === 0) {
    return { ok: false, error: "message is required" };
  }
  if (b.message.length > cfg.maxMessageLength) {
    return {
      ok: false,
      error: `message must be at most ${cfg.maxMessageLength} characters`,
    };
  }
  for (const k of ["debateId", "agentId"]) {
    if (b[k] !== undefined && (typeof b[k] !== "string" || b[k].length > 64)) {
      return { ok: false, error: `${k} must be a string up to 64 characters` };
    }
  }
  return { ok: true, value: b };
}
