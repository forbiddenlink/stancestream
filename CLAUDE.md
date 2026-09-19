# stancestream

Real-time multi-agent AI debate platform showcasing Redis (JSON, Streams, TimeSeries, Vector)
for live intelligent applications. Node/Express + WebSocket backend, React 19/Vite frontend.

## Stack

- Backend: Node 20 (ESM), Express 5, `ws` WebSocketServer bound to the same HTTP server,
  `ioredis`/`redis` v6, Socket.IO, Zod env validation, Winston + Pino logging, Prometheus
  (`prom-client`), Sentry, Langfuse, PostHog, Trigger.dev.
- AI: OpenAI SDK, `@ai-sdk/google`, LangChain/LangGraph.
- Frontend: `stancestream-frontend/` - React 19 + Vite, own `pnpm` scripts.
- Tests: Mocha + Chai + Sinon + Supertest, `c8` for coverage, Artillery for load tests.
- TypeScript is present (`tsconfig.json`, `lib/`, `src/`) alongside plain JS; `build:ts`/
  `typecheck` compile/check the TS portions only.
- Package manager: pnpm (`packageManager` pin + `pnpm-lock.yaml`).

## Commands

```bash
pnpm install && pnpm -C stancestream-frontend install   # backend + frontend deps
pnpm dev                          # nodemon server.js (backend, port 3001)
pnpm -C stancestream-frontend dev # Vite dev server (port 5173)
pnpm build                        # frontend production build (cd + pnpm build)
pnpm build:ts / build:ts:watch    # compile lib/**/*.ts, src/**/*.ts
pnpm typecheck                    # tsc --noEmit
pnpm biome:check / biome:fix      # lint + format (has a working biome.json config)
pnpm test                         # mocha, all tests/**/*.test.js
pnpm test:unit / test:integration / test:coverage (c8)
pnpm exec mocha tests/unit/<file>.test.js         # single file
pnpm test -- tests/unit/<file>.test.js -g "name"  # single test by name
pnpm setup                        # node vectorsearch.js && node index.js && node addReformer.js
curl http://localhost:3001/api/health
docker compose up -d redis        # Redis Stack only
docker compose up -d              # full stack
```

`pnpm lint` (eslint) is defined in package.json but there is no `eslint.config.js` in the repo;
ESLint 10 requires flat config, so `pnpm lint` currently has no config to run against. Use
`pnpm biome:check`/`biome:fix`, which has a real `biome.json` and is enforced.

## Architecture

- `server.js` - Express app + HTTP server + `ws` WebSocketServer; helmet/compression/morgan,
  rate limiting (global `/api/*` and per-route), request sanitization
  (`src/middleware/validation.js`).
- CORS allowlist (hardcoded in `server.js`): `localhost:5173`/`5174` for dev, plus
  `stancestream.vercel.app` and `stancestream.onrender.com` in production. Update the allowlist
  if the frontend origin changes.
- `src/config/environment.js` - Zod schema validated at boot; process exits on invalid/missing
  vars (`OPENAI_API_KEY` must start with `sk-` and be >=20 chars; `REDIS_URL` must be a URL).
- `src/services/redis.js` - singleton wrapping `redis` v6 with retry, health checks,
  JSON/Streams/TimeSeries/Vector helpers; most routes go through this.
- Debate engine (in-memory + Redis): `activeDebates`, `runningDebateProcesses`,
  `currentAgentIndexPerDebate`, `lastSpeakerPerDebate` track live debates; the message loop
  alternates speakers, generates responses (enhanced path with cache, falling back to a plain
  path), writes to Redis Streams, updates TimeSeries stances, runs vector fact-checks, then
  broadcasts over WebSocket.
- Redis data model: JSON for agent profiles (`agent:{id}:profile`) and cache metrics;
  Streams for debate messages (`debate:{id}:messages`) and per-agent memory; TimeSeries for
  stance evolution (`debate:{id}:agent:{agent}:stance:{topic_key}`); Vector/RediSearch for the
  fact store and semantic cache (COSINE similarity, default threshold 0.85).
- Observability: Prometheus metrics at `/metrics`; `/api/health` reports Redis, WebSocket, and
  OpenAI status.
- Frontend: `stancestream-frontend/src/services/websocketManager.js` +
  `src/hooks/useWebSocket.js` for WS; `src/services/api.js` for REST, base URL from
  `VITE_API_URL`.
- Init scripts (run manually for real data): `node vectorsearch.js` (fact vector index),
  `node setupCacheIndex.js` (semantic cache vector index), `node index.js` /
  `node addReformer.js` (seed base agent profiles).

## Constraints

- WebSockets + background intervals mean the API needs a persistent Node process (container,
  VM, or compatible PaaS) - not a serverless request/response platform.
- Keep frontend topic labels consistent with the backend's `topicToStanceKey()` mapping used
  for TimeSeries keys and broadcasts.

## Env vars

Required: `REDIS_URL` (valid URL), `OPENAI_API_KEY` (starts with `sk-`, >=20 chars).
Optional (validated with defaults): `PORT` (3001), `NODE_ENV`, `LOG_LEVEL`, `API_RATE_LIMIT`
(60), `REDIS_POOL_SIZE` (3), `CACHE_SIMILARITY_THRESHOLD` (0.85), `CACHE_TTL` (3600).
Frontend: `VITE_API_URL`.

## Gotchas

- `.env.example` covers the two required vars plus a few optional integrations
  (LangGraph, LangSmith, GNews); copy to `.env` before first run. It does not list
  every var read from `process.env` in the codebase (e.g. `SENTRY_DSN`,
  `LANGFUSE_*`, `RESEND_*`, `CORS_ALLOWLIST`).
- `docker-compose.yml` runs `redis/redis-stack:latest` (RedisInsight on 8001) - plain Redis
  without the Stack modules will not support the JSON/TimeSeries/Vector calls above.
