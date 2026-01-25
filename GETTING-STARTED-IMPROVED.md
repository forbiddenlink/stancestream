# 🚀 Getting Started with Improved StanceStream

**Quick guide to using all the new improvements**

---

## ⚡ Quick Start (5 Minutes)

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Create/Update .env File
```env
# Required
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-proj-your-key-here

# Optional (with defaults)
PORT=3001
NODE_ENV=development
LOG_LEVEL=info
API_RATE_LIMIT=60
REDIS_POOL_SIZE=3
```

### 3. Start Redis (if not running)
```bash
# Using Docker
docker run -d -p 6379:6379 -p 8001:8001 redis/redis-stack:latest

# Or using Docker Compose (includes the app)
docker-compose up -d
```

### 4. Start the Server
```bash
pnpm start

# You should see:
# ✅ Environment validation successful
# ✅ Redis connection established
# 🚀 Server running on port 3001
```

### 5. Verify Everything Works
```bash
# Check health
curl http://localhost:3001/api/health/detailed

# Check metrics
curl http://localhost:3001/metrics | head -20

# Check cache status
curl http://localhost:3001/api/cache/status
```

---

## 🎯 New Features You Can Use Right Now

### 1. **Prometheus Metrics** 📊
```bash
# View all metrics
curl http://localhost:3001/metrics

# Use with Prometheus/Grafana for dashboards
```

**What you get:**
- HTTP request duration & count
- Cache hits/misses & similarity scores
- OpenAI API usage & costs
- Redis operation performance
- WebSocket connections
- Active debates & messages

### 2. **Enhanced Health Checks** 🏥
```bash
# Simple health check
curl http://localhost:3001/api/health

# Detailed health check with all services
curl http://localhost:3001/api/health/detailed

# Response includes:
# - Redis status & latency
# - OpenAI configuration
# - WebSocket status
# - Memory usage
# - System info
```

### 3. **Cache Performance Monitoring** 💰
```bash
# Get cache statistics
curl http://localhost:3001/api/cache/status

# Shows:
# - Hit rate percentage
# - Total requests & hits
# - Average similarity
# - Estimated monthly savings
# - Cache efficiency rating
```

### 4. **Input Validation** ✅
All API endpoints now automatically validate input:
- Topic length (3-200 chars)
- Agent IDs (valid format)
- Safe HTML (XSS prevention)
- Proper data types

Invalid requests get helpful error messages:
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "topic",
      "message": "Topic must be at least 3 characters"
    }
  ]
}
```

### 5. **Environment Validation** 🔒
Server validates config on startup:
```bash
node server.js

# ✅ Environment validation successful
# 📊 Configuration:
#    - Environment: development
#    - Port: 3001
#    - Log Level: info
#    - Rate Limit: 60 req/min
```

---

## 🧪 Testing

### Run Unit Tests
```bash
pnpm test:unit
```

### Run Integration Tests
```bash
pnpm test:integration
```

### Run All Tests with Coverage
```bash
pnpm test:coverage
```

### Run Load Tests
```bash
# Start server first
pnpm start

# In another terminal
pnpm test:load

# This simulates:
# - 5-50 concurrent users
# - Multiple scenarios
# - 150 seconds total duration
```

---

## 🐳 Docker Deployment

### Quick Deploy
```bash
# Start everything (Redis + App)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop everything
docker-compose down
```

### Build Only
```bash
# Build the Docker image
docker build -t stancestream .

# Run with custom Redis
docker run -p 3001:3001 \
  -e REDIS_URL=redis://your-redis:6379 \
  -e OPENAI_API_KEY=your-key \
  stancestream
```

### Production Deployment
```bash
# Set production environment
export NODE_ENV=production

# Start with restart policy
docker-compose up -d

# Monitor
docker-compose ps
docker-compose logs -f stancestream
```

---

## 📊 Monitoring Setup

### With Prometheus

1. **Add Prometheus config** (`prometheus.yml`):
```yaml
scrape_configs:
  - job_name: 'stancestream'
    static_configs:
      - targets: ['localhost:3001']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

2. **Start Prometheus**:
```bash
docker run -d -p 9090:9090 \
  -v ./prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus
```

3. **View metrics**: http://localhost:9090

### With Grafana

1. **Start Grafana**:
```bash
docker run -d -p 3000:3000 grafana/grafana
```

2. **Add Prometheus datasource**
   - URL: http://localhost:9090
   
3. **Create dashboards** for:
   - Cache hit rate over time
   - OpenAI cost tracking
   - API response times
   - Memory usage

---

## 🔧 Development Workflow

### Watch Mode (Auto-reload)
```bash
pnpm dev
# Server restarts on file changes
```

### Linting
```bash
# Check code quality
pnpm lint

# Auto-fix issues
pnpm lint:fix
```

### Before Committing
```bash
# Run tests
pnpm test:unit

# Check linting
pnpm lint

# Build frontend
cd stancestream-frontend && pnpm build
```

---

## 📈 Performance Monitoring

### Key Metrics to Watch

1. **Cache Hit Rate** (Target: >60%)
```bash
curl http://localhost:3001/api/cache/status | jq '.hit_ratio'
```

2. **API Response Time** (Target: <1s p95)
```bash
curl http://localhost:3001/metrics | grep http_request_duration
```

3. **Memory Usage** (Watch for leaks)
```bash
curl http://localhost:3001/api/health/detailed | jq '.system.memory'
```

4. **Redis Health**
```bash
curl http://localhost:3001/api/health/detailed | jq '.services.redis'
```

---

## 🆘 Troubleshooting

### Server Won't Start

**Environment validation fails:**
```bash
# Check .env file exists and has required vars
cat .env

# Verify Redis is accessible
redis-cli -h localhost ping
```

**Port already in use:**
```bash
# Change port in .env
echo "PORT=3002" >> .env

# Or kill process using port 3001
lsof -ti:3001 | xargs kill
```

### Metrics Not Showing

```bash
# Verify metrics endpoint works
curl http://localhost:3001/metrics

# Check if prom-client is installed
pnpm list prom-client
```

### Tests Failing

```bash
# Ensure Redis is running
docker ps | grep redis

# Check test environment
NODE_ENV=test pnpm test:unit
```

### Docker Issues

```bash
# Clear everything and rebuild
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d

# Check logs
docker-compose logs stancestream
```

---

## 🎓 Learn More

### Documentation
- **IMPROVEMENT-RECOMMENDATIONS.md** - Full technical details
- **QUICK-START-IMPROVEMENTS.md** - Implementation guide
- **IMPLEMENTATION-SUMMARY.md** - What was implemented
- **API-DOCUMENTATION.md** - API reference

### Key Files
- **metrics.js** - Metrics implementation
- **src/config/environment.js** - Environment validation
- **src/middleware/validation.js** - Input validation
- **src/routes/enhanced-endpoints.js** - New endpoints

---

## ✅ Checklist for Production

- [ ] Environment variables validated
- [ ] Redis connection healthy
- [ ] OpenAI API key configured
- [ ] Metrics endpoint accessible
- [ ] Health checks passing
- [ ] Tests passing
- [ ] Docker builds successfully
- [ ] Logs directory writable
- [ ] CI/CD pipeline configured
- [ ] Monitoring set up (Prometheus/Grafana)

---

## 🎉 You're All Set!

Your improved StanceStream is ready to use with:
- ✅ Production-grade monitoring
- ✅ Comprehensive validation
- ✅ Docker deployment
- ✅ Automated testing
- ✅ Performance optimization

**Start building and monitor everything in real-time!** 🚀

---

**Questions?** Check the documentation files or examine the code - everything has inline comments and examples.
