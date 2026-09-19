# StanceStream AI Copilot Instructions

## Project Overview
StanceStream is a **production-ready multi-agent AI debate engine** built for the Redis AI Challenge (August 10, 2025). It showcases all 4 Redis data models through real-time political debates between intelligent AI agents with persistent personalities, memory, fact-checking, and business intelligence.

**🏆 STATUS: PRODUCTION-READY CONTEST SUBMISSION**
- ✅ **Express.js + WebSocket Server** - Real-time concurrent debate support with enterprise-grade reliability
- ✅ **React 19 + Vite Frontend** - 4-mode navigation (Standard/Multi-Debate/Analytics/Contest Showcase)
- ✅ **Complete Redis Integration** - All 4 modules (JSON/Streams/TimeSeries/Vector) with advanced use cases
- ✅ **Intelligent AI Agents** - GPT-4 with emotional states, coalition analysis, memory-driven responses
- ✅ **Semantic Caching System** - Redis Vector-powered with 85% similarity threshold achieving 70%+ hit rates
- ✅ **Real-Time Performance Optimization** - Continuous Redis tuning with live metrics
- ✅ **Advanced Fact-Checking** - Multi-source verification with AI-powered cross-validation
- ✅ **Contest Metrics Engine** - Live scoring aligned with Redis Challenge judging criteria
- ✅ **Business Intelligence Dashboard** - ROI tracking, cost savings, enterprise scaling projections
- ✅ **Semantic Cache Engine Dashboard** - Embedded mission control interface with real-time Redis operations monitoring
- ✅ **Professional UI System** - 47+ Lucide React icons, responsive design, contest-ready presentation

## Redis Architecture (All 4 Modules)

### 1. RedisJSON - Complex Data Structures
```javascript
// Agent profiles with nested personality data
await client.json.get(`agent:${agentId}:profile`);
// Cache metrics with real-time statistics
await client.json.get('cache:metrics');
// Contest scoring with live evaluation
await client.json.get('contest:live_metrics');
// Key moments with AI-generated summaries
await client.json.get(`debate:${debateId}:key_moments`);
// Intelligence metrics for emotional tracking
await client.json.get(`debate:${debateId}:agent:${agentId}:intelligence`);
```

### 2. Redis Streams - Real-Time Messaging
```javascript
// Public debate messages with WebSocket broadcast
await client.xAdd(`debate:${debateId}:messages`, '*', {agent_id, message});
// Private agent memories for strategic intelligence
await client.xAdd(`debate:${debateId}:agent:${agentId}:memory`, '*', {type, content});
// Strategic insights for intelligent decision-making
await client.xAdd(`debate:${debateId}:agent:${agentId}:strategic_memory`, '*', data);
```

### 3. RedisTimeSeries - Time-Based Analytics
```javascript
// Stance evolution tracking over debate timeline
await client.ts.add(`debate:${debateId}:agent:${agentId}:stance:${topic}`, '*', newStance);
// Emotional trajectory for intelligent agent responses
await client.ts.add(`debate:${debateId}:agent:${agentId}:emotions`, '*', intensity);
// Performance metrics for optimization engine
await client.ts.add('system:performance:response_time', '*', responseTime);
```

### 4. Redis Vector - Semantic Intelligence
```javascript
// Fact-checking with COSINE similarity search (DIM=1536 for OpenAI embeddings)
const vector = Buffer.from(new Float32Array(embedding).buffer);
await client.hSet(`fact:${factId}`, {content, vector});

// Multi-source fact checking with specialized knowledge bases
const searchResults = await client.ft.search(
    'scientific-facts-index', // Also: political-facts-index, economic-facts-index
    '*=>[KNN 3 @embedding $vec]',
    {
        PARAMS: { vec: vectorBuffer },
        RETURN: ['content', '__score'],
        DIALECT: 2
    }
);

// Semantic caching with 85% similarity threshold
await client.hSet(`cache:prompt:${hash}`, {content: prompt, response, vector});

// Cross-source verification with confidence scoring
const verification = {
    confidence: avgConfidence,  // Based on vector similarity
    agreement: agreementScore,  // Based on cross-source consensus
    sources: sourceCount,       // Number of knowledge bases checked
    consensusStrength: agreementScore * avgConfidence
};
```

## WebSocket Architecture

### Server-Side Broadcasting
```javascript
// Primary message types with comprehensive metadata
broadcast({
  type: 'new_message',
  debateId, agentId, agentName, message, timestamp,
  factCheck: {fact, score}, // Vector search results
  sentiment: {sentiment, confidence, model}, // AI sentiment analysis
  stance: {topic, value, change}, // Real-time position tracking
  metrics: {totalMessages, activeDebates, thisDebateMessages}
});

// Redis operation visualization for Matrix mode
broadcastRedisOperation(operationType, operation, metadata);
// Example: broadcastRedisOperation('vector', 'semantic_cache_hit', { similarity: 0.92 })

// Live performance metrics (5-second intervals)
broadcastPerformanceMetrics(); // Runs on setInterval(5000)
```

### Frontend WebSocket Integration
```javascript
// Centralized WebSocket Manager (singleton)
class WebSocketManager {
  // Auto-reconnection with exponential backoff
  scheduleReconnect() {
    const delay = reconnectDelay * Math.pow(2, connectionAttempts - 1);
    setTimeout(() => this.connect(url), delay);
  }

  // Event listener system for components
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    return () => this.removeEventListener(event, callback); // Cleanup function
  }
}

// React Hook Pattern
const { connectionStatus, lastMessage, sendMessage } = useWebSocket({
  onMessage: handleMessage,
  onError: handleError,
  reconnectDelay: 1000,
  maxReconnectAttempts: 5
});
```

### Connection Management
- Server tracks active connections in `Set<WebSocket>`
- Client auto-reconnects with exponential backoff (1s base, max 5 attempts)
- Connection status monitoring and real-time stats
- Memory management: Message history limited to last 1000 messages

## AI Generation System

### Message Generation with Semantic Caching
1. **Check semantic cache** using Redis Vector search (85% similarity threshold)
2. **Fetch agent profile** from RedisJSON for personality context
3. **Retrieve conversation history** from Redis Streams for memory
4. **Generate enhanced response** using GPT-4 with emotional context (if cache miss)
5. **Cache new response** with OpenAI embeddings for future similarity matching
6. **Fact-check message** against vector database using `findClosestFact`
7. **Update stance** in TimeSeries based on debate dynamics and emotional state
8. **Store in streams** and broadcast via WebSocket with comprehensive metadata

### Enhanced AI Features
- **Intelligent Agents**: Use `enhancedAI.js` or `intelligentAgents.js` for advanced behaviors
- **Emotional States**: 'frustrated', 'encouraged', 'analytical' tracked in TimeSeries
- **Coalition Building**: Agents form alliances based on stance similarity (±0.3 range)
- **Memory-Driven Responses**: Strategic memory streams influence future responses
- **Similarity Prevention**: Retry generation if similarity > 0.7 with temperature boost to 1.0
- **Performance Optimization**: Real-time Redis optimization affects response quality
- **Dynamic Temperature**: Base 0.7-0.8 + turn-based scaling + emotional intensity modifier
- **Turn-Aware Responses**: Opening, early, mid-debate, and later response styles
- **Conversational Cues**: Random selection from predefined contextual starters
- **Retry Strategy**: Second attempt uses previous response as context for better variation

## Essential Development Workflow

### Production Setup (REQUIRED SEQUENCE)
```bash
# 1. Install dependencies
pnpm install
cd stancestream-frontend; pnpm install; cd ..

# 2. Create Redis vector indices (MUST run first)
node vectorsearch.js       # Creates facts-index
node setupCacheIndex.js    # Creates cache-index for semantic caching

# 3. Initialize agent profiles and optimize system
node index.js              # Creates SenatorBot profile
node addReformer.js        # Creates ReformerBot profile
node presentationOptimizer.js  # Optimizes for demo performance

# 4. Start production services
node server.js             # Backend (port 3001)
cd stancestream-frontend; pnpm dev  # Frontend (port 5173)
```

### Environment Requirements
- Node.js (tested on latest LTS)
- Redis (with all modules: JSON, Streams, TimeSeries, Vector)
- Environment variables:
  ```
  REDIS_URL=redis://localhost:6379
  OPENAI_API_KEY=your_key_here
  ```

### Development Commands
```bash
# Development mode
pnpm dev          # Start backend in development mode
cd stancestream-frontend && pnpm dev  # Start frontend dev server

# Production build
cd stancestream-frontend && pnpm build  # Build frontend
pnpm start       # Start production server

# Testing
node tests/production-refinement-orchestrator.js  # Run all test suites
node tests/accessibility-ux-audit.js   # Run accessibility tests
node tests/performance-profiler.js     # Run performance tests
```

### Automated Setup Scripts
- `setup.js` - Cross-platform unified setup (main setup script)
- `setup.sh` - Unix/Linux launcher for setup.js
- `setup.bat` - Windows launcher for setup.js

Setup scripts will:
1. Verify environment requirements
2. Install dependencies
3. Configure Redis indices
4. Initialize agent profiles
5. Optimize for demo performance

### Important Development Notes
- Always run vector index setup first (`vectorsearch.js`, `setupCacheIndex.js`)
- Monitor Redis memory usage with platform metrics
- Use `enhancedAI.js` for advanced agent behaviors
- Semantic cache has 85% similarity threshold
- Message history limited to last 1000 messages

### Key System Files
**Backend Core:**
- `server.js` - Main Express + WebSocket server with all API endpoints and contest features
- `generateMessage.js` - AI message generation with semantic caching integration
- `semanticCache.js` - Redis Vector-powered prompt caching system (MAJOR SHOWCASE)
- `intelligentAgents.js` - Advanced AI agents with emotional states and coalition analysis
- `redisOptimizer.js` - Real-time Redis performance optimization engine
- `advancedFactChecker.js` - Multi-source fact verification with cross-validation
- `contestMetricsEngine.js` - Live contest scoring and evaluation system
- `enhancedAI.js` - Enhanced AI with emotional context and similarity prevention

**Frontend Core:**
- `App.jsx` - Main React app with 4-mode navigation and WebSocket integration
- `ContestShowcaseDashboard.jsx` - Premium demonstration interface for contest judges
- `LivePerformanceOverlay.jsx` - Semantic Cache Engine Dashboard with embedded layout and overlay modes
- `StanceEvolutionChart.jsx` - Real-time stance visualization with Recharts
- `EnhancedPerformanceDashboard.jsx` - Advanced Redis and cache metrics dashboard
- `TrueMultiDebateViewer.jsx` - Concurrent debate management interface

### Multi-Debate System Architecture
The system supports concurrent debates via `activeDebates` Map:
```javascript
// Track multiple debates simultaneously
const activeDebates = new Map(); // debateId -> {topic, agents, startTime, messageCount}

// Frontend filters messages by debateId for proper separation
const getFilteredMessages = () => {
  if (viewMode === 'standard') {
    return debateMessages.filter(msg => msg.debateId === currentDebateId);
  }
  return debateMessages; // Show all in multi-debate mode
};
```

### Topic-to-Stance Mapping (IMPORTANT)
Topics from frontend dropdowns map to agent profile stance keys via `topicToStanceKey()`:
```javascript
'environmental regulations' → 'climate_policy'
'artificial intelligence governance' → 'ai_policy'  
'universal healthcare' → 'healthcare_policy'
// Affects agent personality and position evolution
```

## Critical Implementation Patterns

### Redis Connection Pattern (ALWAYS use this)
```javascript
import { createClient } from 'redis';
const client = createClient({ url: process.env.REDIS_URL });
await client.connect();
// Always quit client when done
await client.quit();
```

### Vector Operations (Buffer conversion required)
```javascript
const vector = Buffer.from(new Float32Array(embedding).buffer);
await client.hSet(`fact:${factId}`, {content, vector});
```

### Message Flow Pattern
1. Generate response using one of:
   - Basic: `generateMessage(agentId, debateId, topic)` 
   - Enhanced: `generateEnhancedMessage(agentId, debateId, topic)`
   - Intelligent: `generateIntelligentMessage(agentId, debateId, topic)`
   - Storage-free versions: `generateMessageOnly()`, `generateEnhancedMessageOnly()`
2. Store in shared stream: `client.xAdd('debate:{id}:messages', '*', {agent_id, message})`
3. Store in private memory: `client.xAdd('debate:{id}:agent:{id}:memory', '*', {type, content})`
4. Fact-check with `findClosestFact(message)` or `advancedFactChecker.checkFactAdvanced()`
5. Broadcast via WebSocket: `broadcast({type: 'new_message', ...})`

### Generation Function Selection Guide
- `generateMessage`: Basic responses with caching
- `generateEnhancedMessage`: Emotional context + similarity prevention
- `generateIntelligentMessage`: Full strategic intelligence + coalition awareness
- `*Only` versions: For server-controlled storage (recommended)

### Frontend Architecture

#### Component System
```javascript
// Professional UI Component Library (src/components/ui/*)
export {
  // Core Layouts
  Container, Section, Grid, Flex, Stack, Hero, CardGrid,
  // Interactive Elements
  Button, Input, Select, Toggle, RadioGroup,
  // Data Display
  Card, MetricCard, StatusCard, DataTable,
  // Feedback
  Modal, Toast, Loading, ProgressBar
} from './ui';

// Common Variants & Configurations
const componentVariants = {
  button: {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost'
  },
  card: {
    default: 'glass-panel',
    elevated: 'glass-card',
    feature: 'feature-card'
  }
};

// Enterprise Layout System
<DashboardLayout
  header={<Header />}
  sidebar={<SidebarNav />}
>
  <Container maxWidth="max-w-7xl">
    <Grid columns={3} gap="gap-6" responsive>
      {children}
    </Grid>
  </Container>
</DashboardLayout>
```

#### Navigation Modes
```javascript
// 4-Mode System with Lazy Loading
const EnhancedPerformanceDashboard = lazy(() => import('./EnhancedPerformanceDashboard'));
const TrueMultiDebateViewer = lazy(() => import('./TrueMultiDebateViewer'));

// Mode Configuration
const modes = [
  { key: 'standard', label: 'Standard', icon: 'target' },  // Single debate
  { key: 'multi-debate', label: 'Multi-Debate', icon: 'layers' },  // Concurrent
  { key: 'analytics', label: 'Analytics', icon: 'bar-chart-3' },  // Metrics
  { key: 'business', label: 'Business', icon: 'trending-up' }  // ROI
];
```

#### Data Management
```javascript
// Message filtering by debate ID
const getFilteredMessages = () => {
  if (viewMode === 'standard') {
    return debateMessages.filter(msg => msg.debateId === currentDebateId);
  }
  return debateMessages; // All messages for multi-debate
};

// Stance data normalization (0-1 to -1 to 1 scale)
const stanceValue = (data.stance.value - 0.5) * 2;

// Memory-efficient message history
const [messages, setMessages] = useState([]);
useEffect(() => {
  // Keep last 1000 messages only
  const newMessages = [...prev, data];
  return newMessages.length > 1000 ? newMessages.slice(-1000) : newMessages;
}, []);
```
```

### Enhanced AI Features (use `enhancedAI.js`)
- Similarity checking prevents repetitive responses
- Emotional state determination: 'frustrated', 'encouraged', 'analytical'
- Coalition building based on stance similarity within 0.3 range
- Dynamic stance evolution with personality resistance factors

## Critical Dependencies & Environment
- `redis@5.6.1` with all modules (JSON, Streams, TimeSeries, Vector) enabled
- `openai@5.10.2` for GPT-4 completions and text-embedding-ada-002
- `@langchain/openai@0.6.3` for embeddings abstraction
- `lucide-react@0.263.1` for professional icon system (47+ icons)
- `recharts@3.1.0` for stance evolution chart visualization
- React 19 with Vite 7 for frontend development
- Environment variables: `REDIS_URL`, `OPENAI_API_KEY`

## Advanced Testing & Error Handling

### Test Suite Architecture
The system uses comprehensive test suites with categories:

1. **Failure Modes** (`testFailureModes`)
   ```javascript
   // Test Redis connection failures
   await testRedisConnectionFailure();
   // Test OpenAI API failures
   await testOpenAIAPIFailure();
   // Test WebSocket disconnections
   await testWebSocketDisconnection();
   ```

2. **Security Vulnerabilities** (`testSecurityVulnerabilities`)
   ```javascript
   // XSS Prevention Tests
   await testXSSPrevention();
   // SQL Injection Prevention
   await testSQLInjectionPrevention();
   // Rate Limiting Tests
   await testRateLimiting();
   // CORS Policy Validation
   await testCORSPolicy();
   ```

3. **Input Validation** (`testInputValidation`)
   ```javascript
   // Long Input Tests (10KB, 100KB)
   await testLongInputHandling();
   // Special Character Tests (Unicode, Control Chars)
   await testSpecialCharacterHandling();
   // UTF-8 Support: 🚀💥🔥, 表情符号测试, मराठी
   ```

4. **Performance Edge Cases** (`testPerformanceEdgeCases`)
   ```javascript
   // High Concurrency Testing
   await testHighConcurrency();
   // Memory Pressure Testing
   await testMemoryPressure();
   // Network Latency Testing
   await testNetworkLatency();
   ```

### Error Recovery Patterns

#### WebSocket Connection Recovery
```javascript
// WebSocket auto-reconnection with exponential backoff
scheduleReconnect() {
  const delay = reconnectDelay * Math.pow(2, connectionAttempts - 1);
  setTimeout(() => this.connect(url), delay);
}

// Monitor connection health
setInterval(() => {
  checkConnectionHealth();
  attemptReconnectionIfNeeded();
}, 5000);
```

#### Redis Failure Handling
```javascript
// Graceful Redis failure handling
try {
  await client.connect();
} catch (error) {
  handleRedisFailure(error);
  reportHealthStatus('redis_disconnected');
}

// Redis operation retry with exponential backoff
async function retryRedisOperation(operation, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      await delay(Math.pow(2, attempt - 1) * 1000);
    }
  }
}
```

#### Memory Management
```javascript
// Memory leak prevention
const connections = new Set();
// Cleanup on disconnect
ws.on('close', () => {
  connections.delete(ws);
  cleanupResources(ws);
});

// Message history truncation
const MAX_MESSAGES = 1000;
if (messages.length > MAX_MESSAGES) {
  messages = messages.slice(-MAX_MESSAGES);
}
```

### Security Validations

#### XSS Prevention Testing
```javascript
const maliciousInputs = [
  '<script>alert("XSS")</script>',
  'javascript:alert("XSS")',
  '<img src=x onerror=alert("XSS")>',
  '<svg onload=alert("XSS")>'
];
```

#### SQL Injection Testing
```javascript
const injectionInputs = [
  "'; DROP TABLE users; --",
  "' OR '1'='1",
  '{"$ne": null}',
  '{"$where": "function() { return true; }"}'
];
```

### Production Readiness Assessment
```javascript
const criticalScore = Math.max(0, 100 - (criticalIssues.length * 25));
const warningScore = Math.max(0, 100 - (warnings.length * 10));
const testScore = (totalPassed / totalTestsRun) * 100;
const overallScore = (criticalScore * 0.5 + warningScore * 0.3 + testScore * 0.2);

// Production readiness thresholds
if (overallScore >= 90) {
  console.log('✅ PRODUCTION READY');
} else if (overallScore >= 75) {
  console.log('⚠️ PRODUCTION ACCEPTABLE');
} else {
  console.log('❌ NOT PRODUCTION READY');
}
```

## Testing & Debugging
- Use `node index.js` to verify Redis connectivity and create SenatorBot
- Test individual modules: `node factChecker.js "climate change"`
- Vector search setup: `node vectorsearch.js` (creates `facts-index`)
- Check Redis keys with RedisInsight or CLI
- Frontend WebSocket: Connect to `ws://localhost:3001` or `ws://127.0.0.1:3001`

## Redis Challenge Contest Focus
Built for Redis AI Challenge demonstrating all 4 Redis data models in a single application:
- **Real-Time AI Innovation**: Multi-agent debates with memory and fact-checking
- **Beyond the Cache**: Complex data modeling, vector search, time-series tracking
- **Live Demo Ready**: Professional UI, concurrent debates, performance analytics
- **Contest Deadline**: August 10, 2025 - Production-ready system
