# StanceStream

Real-time multi-agent AI debate platform showcasing Redis (JSON, Streams, TimeSeries, Vector)
for live intelligent applications. Node/Express + WebSocket backend, React 19/Vite frontend.
AI agents with persistent personalities and memory debate policy topics, fact-check each
other in real time, and track stance evolution over the course of a debate.

## Documentation

| Document | Purpose |
|----------|---------|
| [Deployment guide](DEPLOYMENT.md) | Production deployment instructions |
| [API documentation](API-DOCUMENTATION.md) | Complete API reference |
| [Technical docs](TECHNICAL-DOCS.md) | Architecture and implementation |
| [Frontend README](stancestream-frontend/README.md) | React frontend setup |
| [Developer guide](.github/copilot-instructions.md) | Development workflow and patterns |

## Quick start

### Automated setup

```bash
node setup.js
```

### Manual setup

```bash
# 1. Install dependencies
pnpm install
cd stancestream-frontend && pnpm install && cd ..

# 2. Configure environment
cp .env.example .env
# edit .env with your REDIS_URL and OPENAI_API_KEY

# 3. Initialize Redis indices and seed agent data
node vectorsearch.js      # create the facts vector index
node setupCacheIndex.js   # create the semantic-cache vector index
node index.js             # create the SenatorBot profile
node addReformer.js       # create the ReformerBot profile

# 4. Start the system
pnpm dev                              # backend, port 3001
cd stancestream-frontend && pnpm dev  # frontend, port 5173
```

Verify: backend at `http://localhost:3001/api/health`, frontend at `http://localhost:5173`.

## Technology stack

**Backend:**
- Node.js + Express, `ws` WebSocketServer on the same HTTP server
- Redis Stack, all 4 modules: JSON (agent profiles), Streams (debate messages + agent memory),
  TimeSeries (stance evolution), Vector/RediSearch (fact store + semantic cache)
- OpenAI GPT-4 for debate generation, `text-embedding-ada-002` for embeddings

**Frontend:**
- React 19 + Vite, Tailwind CSS, Lucide React icons

## Core features

### Agent profiles (RedisJSON)

```json
{
  "name": "SenatorBot",
  "role": "Moderate US Senator",
  "tone": "measured",
  "stance": {
    "climate_policy": 0.4,
    "economic_risk": 0.8
  },
  "biases": ["fiscal responsibility", "bipartisan compromise"]
}
```

### Real-time debate messages (Redis Streams)

- Shared stream: `debate:{debate_id}:messages` for the public conversation
- Private memory: `debate:{debate_id}:agent:{agent_id}:memory` for AI context
- WebSocket broadcasting for instant frontend updates

### Stance evolution (RedisTimeSeries)

```bash
TS.ADD debate:live_debate:agent:senatorbot:stance:climate_policy * 0.6
```

### Fact-checking and semantic cache (Redis Vector Search)

- Fact embeddings stored as `fact:{hash}` with an HNSW index for similarity search
- AI response cache keyed by prompt embedding, COSINE similarity threshold configurable via
  `CACHE_SIMILARITY_THRESHOLD` (default 0.85)

## Redis key summary

| Key pattern | Purpose | Redis module |
|-------------|---------|---------------|
| `agent:{id}:profile` | Agent personality and beliefs | JSON |
| `debate:{id}:messages` | Public debate messages | Streams |
| `debate:{id}:agent:{agent}:memory` | Private agent memory | Streams |
| `debate:{id}:agent:{agent}:stance:{topic}` | Stance evolution | TimeSeries |
| `fact:{hash}` | Fact with vector embedding | Vector + Hash |
| `cache:prompt:{hash}` | Cached AI response with embedding | Vector + Hash |

## Environment variables

Required: `REDIS_URL` (valid URL), `OPENAI_API_KEY` (starts with `sk-`, at least 20 chars).
See `.env.example` for the full set with defaults, and `CLAUDE.md` for the complete list.

## License

See [LICENSE](LICENSE).
