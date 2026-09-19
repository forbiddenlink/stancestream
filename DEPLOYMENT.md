# 🚀 StanceStream Deployment Guide

**Production-ready deployment instructions for the Redis AI Intelligence Platform**

## 📋 Quick Reference

| Component | Technology | Port | Purpose |
|-----------|------------|------|---------|
| Backend | Node.js + Express | 3001 | API server + WebSocket |
| Frontend | React 19 + Vite | 5173 | User interface |
| Database | Redis Stack | 6379 | All 4 Redis modules |

---

## 🔧 Prerequisites

### System Requirements
- **Node.js** 18+ with npm/pnpm
- **Redis Stack** 7.2+ (with JSON, Streams, TimeSeries, Vector modules)
- **RAM** 2GB minimum, 4GB recommended
- **Storage** 1GB for application, additional for Redis data

### Required Accounts
- **OpenAI API** account with GPT-4 access
- **Redis Cloud** (optional for production) or local Redis Stack

---

## 🏠 Local Development Setup

### 1. Clone and Install Dependencies
```bash
# Clone repository
git clone https://github.com/forbiddenlink/mindchain.git
cd stancestream

# Install backend dependencies
pnpm install

# Install frontend dependencies
cd stancestream-frontend
pnpm install
cd ..
```

### 2. Environment Configuration
```bash
# Copy environment template
copy .env.example .env

# Edit .env file with your values:
# REDIS_URL=redis://localhost:6379
# OPENAI_API_KEY=sk-proj-your_key_here
```

### 3. Redis Setup
```bash
# Start Redis Stack (if running locally)
redis-stack-server

# Initialize indices and data
node setup.js
```

### 4. Start Development Servers
```bash
# Terminal 1: Start backend
node server.js

# Terminal 2: Start frontend
cd stancestream-frontend
pnpm dev
```

### 5. Verify Installation
- Backend: http://localhost:3001/api/health
- Frontend: http://localhost:5173
- WebSocket: Check connection status in browser console

---

## 🌐 Production Deployment

### Environment Variables

#### Backend (.env)
```env
# Redis Configuration
REDIS_URL=redis://username:password@hostname:port

# AI Configuration  
OPENAI_API_KEY=sk-proj-your_production_key

# Server Configuration
PORT=3001
NODE_ENV=production

# Optional: Rate limiting
API_RATE_LIMIT=100
```

#### Frontend (.env.production)
```env
# Backend API URL (without trailing slash)
VITE_API_URL=https://your-backend-domain.com
```

### Build Process

#### 1. Build Frontend
```bash
cd stancestream-frontend
pnpm build
```

#### 2. Prepare Backend
```bash
# Install production dependencies only
pnpm install --frozen-lockfile --prod

# Initialize Redis (one-time setup)
node setup.js
```

#### 3. Start Production Server
```bash
# Using PM2 (recommended)
pnpm add -g pm2
pm2 start server.js --name stancestream-backend

# Or using Node directly
NODE_ENV=production node server.js
```

---

## ☁️ Cloud Deployment Options

### Option 1: Render.com (Recommended)

#### Backend Deployment
1. Connect GitHub repository to Render
2. Create new Web Service
3. Configure build and start commands:
   ```bash
   # Build Command
   pnpm install && node setup.js
   
   # Start Command  
   node server.js
   ```
4. Add environment variables in Render dashboard
5. Deploy with auto-deploy from GitHub

#### Frontend Deployment
1. Create new Static Site in Render
2. Set build command: `cd stancestream-frontend && pnpm build`
3. Set publish directory: `stancestream-frontend/dist`
4. Add environment variable: `VITE_API_URL=https://your-backend.onrender.com`

### Option 2: Vercel + Railway

#### Frontend (Vercel)
```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy from frontend directory
cd stancestream-frontend
vercel --prod
```

#### Backend (Railway)
1. Connect GitHub to Railway
2. Select backend deployment
3. Configure environment variables
4. Deploy with automatic builds

### Option 3: AWS/Azure/GCP

#### Backend (Container/VM)
```dockerfile
# Dockerfile
FROM node:20-alpine
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod
COPY . .
RUN node setup.js
EXPOSE 3001
CMD ["node", "server.js"]
```

#### Frontend (CDN/Static Hosting)
```bash
# Build and upload to S3/Azure Blob/GCS
pnpm build
# Upload dist/ folder to static hosting
```

---

## 🗄️ Database Configuration

### Redis Cloud (Production)
```env
# Redis Cloud connection string
REDIS_URL=rediss://username:password@hostname:port
```

### Self-Hosted Redis
```bash
# Install Redis Stack
curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/redis.list
sudo apt-get update
sudo apt-get install redis-stack-server

# Start and enable
sudo systemctl start redis-stack-server
sudo systemctl enable redis-stack-server
```

### Redis Configuration (redis.conf)
```conf
# Memory optimization
maxmemory 1gb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000

# Security
requirepass your_redis_password
protected-mode yes

# Modules (ensure these are loaded)
loadmodule /opt/redis-stack/lib/redisearch.so
loadmodule /opt/redis-stack/lib/redistimeseries.so
loadmodule /opt/redis-stack/lib/rejson.so
```

---

## 🔒 Security Configuration

### Backend Security
```javascript
// Production security headers (already implemented)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            connectSrc: ["'self'", "wss:", "https:"],
        },
    }
}));

// Rate limiting (configured in server.js)
const apiRateLimit = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: process.env.API_RATE_LIMIT || 60
});
```

### HTTPS Configuration
```bash
# Using Let's Encrypt with Certbot
sudo apt-get install certbot
sudo certbot --nginx -d your-domain.com

# Or using Cloudflare for SSL termination
```

### Environment Security
```bash
# Secure environment variables
chmod 600 .env

# Use secrets management in production
# AWS Secrets Manager, Azure Key Vault, etc.
```

---

## 📊 Monitoring & Logging

### Health Checks
```bash
# Backend health endpoint
curl https://your-api.com/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-08-10T...",
  "services": {
    "redis": "connected",
    "openai": "operational"
  }
}
```

### Log Configuration
```javascript
// Winston logging (already implemented)
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new DailyRotateFile({
            filename: 'logs/stancestream-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '14d'
        })
    ]
});
```

### Monitoring Tools
- **Application**: PM2 monitoring, New Relic, DataDog
- **Infrastructure**: CloudWatch, Azure Monitor, Google Cloud Monitoring
- **Redis**: RedisInsight, Redis monitoring endpoints

---

## 🔄 Maintenance

### Database Maintenance
```bash
# Redis memory optimization
redis-cli MEMORY USAGE cache:*
redis-cli FLUSHDB # Clear specific database (careful!)

# Backup Redis data
redis-cli BGSAVE
# Backup file location: /var/lib/redis/dump.rdb
```

### Application Updates
```bash
# Zero-downtime deployment with PM2
pm2 reload stancestream-backend

# Manual restart
pm2 restart stancestream-backend
```

### Performance Tuning
```bash
# Monitor Redis performance
redis-cli INFO memory
redis-cli INFO stats

# Monitor Node.js performance
node --inspect server.js # For debugging
pm2 monit # For production monitoring
```

---

## 🚨 Troubleshooting

### Common Issues

#### Redis Connection Failed
```bash
# Check Redis status
redis-cli ping
systemctl status redis-stack-server

# Check Redis logs
tail -f /var/log/redis/redis-server.log
```

#### OpenAI API Errors
```bash
# Test API key
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models

# Check rate limits in logs
grep "rate limit" logs/stancestream-*.log
```

#### WebSocket Connection Issues
```bash
# Check CORS configuration in server.js
# Verify frontend VITE_API_URL configuration
# Test WebSocket endpoint: ws://your-domain.com
```

#### Memory Issues
```bash
# Check Node.js memory usage
pm2 show stancestream-backend

# Check Redis memory
redis-cli INFO memory

# Monitor system resources
htop
free -h
```

### Performance Optimization

#### Redis Optimization
```bash
# Enable lazy freeing
redis-cli CONFIG SET lazyfree-lazy-eviction yes
redis-cli CONFIG SET lazyfree-lazy-expire yes

# Optimize memory
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

#### Node.js Optimization
```javascript
// Increase event loop limits (if needed)
process.env.UV_THREADPOOL_SIZE = 128;

// Enable cluster mode for production
import cluster from 'cluster';
import os from 'os';

if (cluster.isPrimary) {
    for (let i = 0; i < os.cpus().length; i++) {
        cluster.fork();
    }
} else {
    // Start your server
}
```

---

## 📞 Support

### Deployment Support
- **Documentation**: Check all .md files in the project
- **Health Endpoints**: `/api/health`, `/api/test/redis`
- **Logs**: Check `logs/stancestream-*.log` files

### Performance Tuning
- **Redis Metrics**: `/api/cache/metrics`
- **Performance Dashboard**: Frontend analytics mode
- **API Monitoring**: `/api/analytics/performance`

---

*StanceStream Deployment Guide - Updated August 10, 2025*  
*For deployment issues or enterprise support, refer to the project documentation or create an issue on GitHub.*
