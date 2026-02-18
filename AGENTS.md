# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Essential commands (pnpm)

- Install deps (root + frontend)
  - `pnpm install`
  - `pnpm -C stancestream-frontend install`
- Dev servers
  - Backend (Express + WebSocket): `pnpm dev` (nodemon on port 3001)
  - Frontend (Vite React): `pnpm -C stancestream-frontend dev` (port 5173)
- Build
  - Frontend production build: `pnpm -C stancestream-frontend build`
- Lint
  - `pnpm lint`
  - `pnpm lint:fix`
- Tests (mocha/c8)
  - All tests: `pnpm test`
  - Unit only: `pnpm run test:unit`
  - Integration only: `pnpm run test:integration`
  - Coverage: `pnpm run test:coverage`
  - Run a single test file: `pnpm exec mocha tests/unit/<file>.test.js`
  - Run a single test by name: `pnpm test -- tests/unit/<file>.test.js -g "pattern"`
- Health check (backend running): `curl http://localhost:3001/api/health`
- Docker (optional, for Redis or full stack)
  - Redis only: `docker compose up -d redis`
  - Full stack (builds app image and starts API): `docker compose up -d`

Environment files
- Copy template: `cp .env.example .env`
- Required vars (validated at startup): `REDIS_URL`, `OPENAI_API_KEY`, optional `PORT` (defaults 3001)

## Architecture overview (big picture)

Backend (Node 20, ESM)
- Entrypoint: `server.js` creates an Express app and an HTTP server with a `ws` WebSocketServer bound to it.
- Middleware & hardening: `helmet`, `compression`, `morgan`, rate limiting (global `/api/*` and per-route), JSON/urlencoded parsers, and request sanitization from `src/middleware/validation.js`.
- CORS policy: dynamic allowlist for local dev (localhost:5173/5174) and production domains (`stancestream.vercel.app`, `stancestream.onrender.com`). Requests from other origins will be rejected — adjust in `server.js` if your frontend origin changes.
- Configuration & validation: `src/config/environment.js` uses Zod to validate env vars at boot. Invalid/missing values cause an immediate process exit with errors (e.g., `OPENAI_API_KEY` must start with `sk-`; `REDIS_URL` must be a valid URL).
- Redis access: centralized singleton in `src/services/redis.js` wraps `redis@5` with retry, health, JSON/Streams/TimeSeries/Vector helpers, and graceful shutdown. Most routes call through this manager.
- Real‑time debate engine:
  - In‑memory controllers track debates/connections: `activeDebates`, `runningDebateProcesses`, `currentAgentIndexPerDebate`, `lastSpeakerPerDebate`, and WebSocket `connections`.
  - Message loop alternates speakers, generates responses via enhanced AI (`generateEnhancedMessageOnly` with cache/fallback to `generateMessageOnly`), stores to Redis Streams, updates TimeSeries stances, performs vector fact‑checks, then broadcasts over WS.
- Observability: Prometheus metrics at `/metrics`; enhanced metrics endpoints; structured logs via `winston` + request logs via `morgan`.
- Health: `/api/health` reports Redis, WebSocket, and OpenAI status plus basic process metrics.

Redis data model usage (all 4 modules)
- RedisJSON: agent profiles (`agent:{id}:profile`), cache metrics (`cache:metrics`), various analytics documents
- Streams: shared debate messages (`debate:{id}:messages`), per‑agent memory (`debate:{id}:agent:{agent}:memory`)
- TimeSeries: stance evolution per topic (`debate:{id}:agent:{agent}:stance:{topic_key}`)
- Vector (RediSearch): fact store and semantic cache embeddings with COSINE similarity; indices created by scripts in repo (see below)

Frontend (React 19 + Vite)
- Location: `stancestream-frontend/`
- WebSocket integration via `src/services/websocketManager.js` and `src/hooks/useWebSocket.js`
- API client in `src/services/api.js`; base URL comes from `VITE_API_URL` (e.g., `http://localhost:3001`)
- Performance/analytics views subscribe to WS and hit `/api/*` endpoints for metrics

Key initialization scripts (run manually when you need real data)
- `node vectorsearch.js` – create vector index for facts
- `node setupCacheIndex.js` – create vector index for semantic cache
- `node index.js` and `node addReformer.js` – seed base agent profiles

Cross‑service contracts and constraints
- Topic mapping: server maps human topics to stance keys via `topicToStanceKey()` (used when writing TimeSeries and in broadcasts). Keep frontend’s topic labels consistent with backend mapping.
- WebSockets: server maintains long‑lived WS connections and background intervals; deploy the API on infrastructure that supports persistent Node processes and WS (container, VM, or compatible PaaS). Serverless request/response models are not sufficient.
- Startup dependency: API will refuse to start or will exit if env validation fails or Redis cannot be reached; `/api/health` degrades when OpenAI/Redis are down.
- CORS: only localhost:5173/5174 (HTTP) and the listed HTTPS domains are permitted by default; adjust allowlist when changing frontend origin/ports to avoid 403/CORS errors.

## Selected paths of interest
- API routes (high level): debate lifecycle (`/api/debate/*`, `/api/debates/*`), agent profile (`/api/agent/*`), stats (`/api/stats/redis`), cache metrics (`/api/cache/metrics`), health (`/api/health`), Prometheus (`/metrics`).
- Redis service: `src/services/redis.js`
- Env validation: `src/config/environment.js`
- Frontend entry/scripts: `stancestream-frontend/` (`dev`, `build`, `preview`)

## Notes from .github/copilot-instructions.md (curated)
- Always create Redis vector indices before demos that require facts/semantic cache.
- Preferred response generation: use enhanced/intelligent paths when available; fall back gracefully.
- Business metrics and cache analytics power the BI/Analytics views; cache similarity threshold typically 0.85.
