import 'dotenv/config';
import { OPENAI_MODEL } from '../../openaiModel.js';

/**
 * Server Configuration
 * Centralized configuration management for the application
 */

export const config = {
  // Server settings
  server: {
    port: process.env.PORT || 3001,
    host: process.env.HOST || 'localhost',
    env: process.env.NODE_ENV || 'development',
    gracefulShutdownTimeout: 10000, // 10 seconds
  },

  // Redis configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    maxRetries: 3,
    retryDelay: 1000,
    connectionTimeout: 5000,
  },

  // OpenAI configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: OPENAI_MODEL,
    maxTokens: 300,
    temperature: 0.7,
    timeout: 30000, // 30 seconds
    maxRetries: 3,
  },

  // WebSocket configuration
  websocket: {
    allowedOrigins: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5174'
    ],
    pingInterval: 30000, // 30 seconds
    pongTimeout: 5000,   // 5 seconds
  },

  // Rate limiting
  rateLimit: {
    general: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100
    },
    api: {
      windowMs: 5 * 60 * 1000,  // 5 minutes
      max: 50
    },
    ai: {
      windowMs: 10 * 60 * 1000, // 10 minutes
      max: 20
    }
  },

  // Semantic cache configuration
  cache: {
    similarityThreshold: 0.85,
    embeddingModel: 'text-embedding-ada-002',
    ttl: 86400, // 24 hours
    maxEntries: 10000,
  },

  // Debate configuration
  debate: {
    maxConcurrentDebates: 10,
    maxRounds: 10,
    maxAgents: 5,
    messageCooldown: 1200, // ms between messages
    startCooldown: 1000,   // ms between debate starts
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json',
    enableConsole: true,
    enableFile: process.env.NODE_ENV === 'production',
    maxFiles: 5,
    maxSize: '10m',
  },

  // Security configuration
  security: {
    enableHelmet: true,
    enableRateLimit: true,
    corsOrigins: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5174'
    ],
    maxRequestSize: '10mb',
  },

  // Feature flags
  features: {
    enableContestMetrics: true,
    enableOptimization: false, // Disabled by default
    enableAdvancedFactCheck: true,
    enableSemanticCache: true,
    enableIntelligentAgents: true,
  },

  // Contest demo configuration
  contest: {
    demoMode: false,
    simulateMetrics: false,
    showcaseFeatures: [
      'redis-multi-modal',
      'semantic-caching',
      'real-time-debates',
      'intelligent-agents',
      'performance-optimization'
    ]
  }
};

/**
 * Validate required configuration
 */
export function validateConfig() {
  const required = [
    'REDIS_URL',
    'OPENAI_API_KEY'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate OpenAI API key format
  if (!config.openai.apiKey?.startsWith('sk-')) {
    throw new Error('Invalid OpenAI API key format');
  }

  console.log('✅ Configuration validated successfully');
}

/**
 * Get configuration for specific module
 */
export function getConfig(module) {
  return config[module] || {};
}

/**
 * Check if feature is enabled
 */
export function isFeatureEnabled(feature) {
  return config.features[feature] || false;
}

/**
 * Environment helpers
 */
export const isDevelopment = () => config.server.env === 'development';
export const isProduction = () => config.server.env === 'production';
export const isTest = () => config.server.env === 'test';
