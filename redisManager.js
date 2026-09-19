// Centralized Redis Connection Manager - Production Ready
import 'dotenv/config';
import { createClient } from 'redis';
import healthMonitor from './src/services/healthMonitor.js';

/**
 * Singleton Redis Connection Manager
 * Centralized, robust connection handling for the entire application
 */
class RedisConnectionManager {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.connectionPromise = null;
        this.connectionAttempts = 0;
        this.maxRetries = 5;
        this.retryDelay = 1000;
        this.reconnectStrategy = this.exponentialBackoff.bind(this);
        this.lastPingTime = Date.now();
        this.healthCheckInterval = null;
        // Set while disconnect() is intentionally tearing the client down, so
        // the 'end'/'disconnect' event handlers below don't treat a deliberate
        // client.quit() as a dropped connection and schedule an auto-recovery
        // reconnect for it.
        this.isShuttingDown = false;
    }

    /**
     * Get Redis client with automatic connection management
     */
    async getClient() {
        if (this.client && this.client.isReady) {
            return this.client;
        }

        // Avoid multiple concurrent connection attempts
        if (this.connectionPromise) {
            return this.connectionPromise;
        }

        this.connectionPromise = this.connect();
        return this.connectionPromise;
    }

    /**
     * Connect to Redis with comprehensive error handling
     */
    async connect() {
        try {
            // Clean up any existing client
            if (this.client) {
                try {
                    await this.client.quit();
                } catch (error) {
                    // Ignore cleanup errors
                }
                this.client = null;
            }

            this.client = createClient({
                url: process.env.REDIS_URL,
                socket: {
                    reconnectStrategy: this.reconnectStrategy,
                    connectTimeout: 10000,
                    commandTimeout: 5000,
                    keepAlive: true,
                    lazyConnect: false
                },
                // Enable command retries
                commandsQueueMaxLength: 100,
                // Memory optimization
                legacyMode: false
            });

            // Set up comprehensive event handlers
            this.setupEventHandlers();

            await this.client.connect();
            
            this.isConnected = true;
            this.connectionAttempts = 0;
            this.connectionPromise = null;
            this.startHealthCheck();

            console.log('✅ Redis connection established successfully');
            return this.client;

        } catch (error) {
            this.connectionAttempts++;
            this.connectionPromise = null;
            
            console.error(`❌ Redis connection failed (attempt ${this.connectionAttempts}):`, error.message);
            
            if (this.connectionAttempts >= this.maxRetries) {
                throw new Error(`Redis connection failed after ${this.maxRetries} attempts: ${error.message}`);
            }

            // Exponential backoff retry
            const delay = this.retryDelay * Math.pow(2, this.connectionAttempts - 1);
            console.log(`🔄 Retrying Redis connection in ${delay}ms...`);
            
            await new Promise(resolve => setTimeout(resolve, delay));
            return this.connect();
        }
    }

    /**
     * Set up Redis client event handlers
     */
    setupEventHandlers() {
        this.client.on('error', (error) => {
            console.error('🔴 Redis client error:', error.message);
            this.isConnected = false;
            
            if (error.code === 'CONNECTION_BROKEN' || error.code === 'ECONNRESET') {
                this.handleDisconnection(error);
            }
        });

        this.client.on('connect', () => {
            console.log('🔗 Redis client connected');
            this.isConnected = true;
            this.connectionAttempts = 0;
            this.lastPingTime = Date.now();
        });

        this.client.on('ready', () => {
            console.log('✅ Redis client ready for operations');
            this.isConnected = true;
            this.lastPingTime = Date.now();
        });

        this.client.on('reconnecting', () => {
            console.log('🔄 Redis client reconnecting...');
            this.notifyHealthStatus('reconnecting');
        });

        this.client.on('disconnect', () => {
            console.log('🔌 Redis client disconnected');
            this.isConnected = false;
            this.handleDisconnection();
        });

        this.client.on('end', () => {
            console.log('📤 Redis connection ended');
            this.isConnected = false;
            this.client = null;
            this.handleDisconnection();
        });
    }

    handleDisconnection(error = null) {
        this.isConnected = false;
        this.notifyHealthStatus('disconnected', error);

        // A deliberate disconnect() still fires the client's 'end'/'disconnect'
        // events (this is normal client.quit() behavior), which would otherwise
        // land here and schedule a reconnect for a shutdown nobody asked to
        // recover from. Skip auto-recovery while shutting down intentionally.
        if (this.isShuttingDown) {
            return;
        }

        // Attempt recovery after a delay
        setTimeout(() => {
            if (!this.isConnected && !this.isShuttingDown) {
                this.getClient().catch(err => {
                    console.error('❌ Redis auto-recovery failed:', err.message);
                });
            }
        }, 5000);
    }

    notifyHealthStatus(status, error = null) {
        const healthStatus = {
            type: 'redis',
            status,
            timestamp: new Date().toISOString(),
            error: error?.message
        };
        
        // Notify health monitor
        if (healthMonitor) {
            healthMonitor.notifyListeners(healthStatus);
        }
    }

    startHealthCheck() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }

        this.healthCheckInterval = setInterval(async () => {
            try {
                if (this.client?.isReady) {
                    const ping = await this.client.ping();
                    if (ping === 'PONG') {
                        this.lastPingTime = Date.now();
                        this.notifyHealthStatus('connected');
                    }
                }
            } catch (error) {
                console.error('❌ Redis health check failed:', error.message);
                this.handleDisconnection(error);
            }
        }, 5000);
    }

    /**
     * Exponential backoff strategy for reconnection
     */
    exponentialBackoff(retries) {
        if (retries >= this.maxRetries) {
            console.error('❌ Redis reconnection attempts exhausted');
            return false;
        }
        
        const delay = Math.min(this.retryDelay * Math.pow(2, retries), 30000); // Max 30 seconds
        console.log(`⏳ Redis reconnection attempt ${retries + 1} in ${delay}ms`);
        return delay;
    }

    /**
     * Execute Redis operation with error handling and retries
     */
    async execute(operation, fallback = null) {
        try {
            const client = await this.getClient();
            return await operation(client);
        } catch (error) {
            console.error('❌ Redis operation failed:', error.message);
            
            if (fallback !== null) {
                console.warn('⚠️ Using fallback value for Redis operation');
                return fallback;
            }
            
            throw new Error(`Redis operation failed: ${error.message}`);
        }
    }

    /**
     * Health check for monitoring
     */
    async healthCheck() {
        try {
            const client = await this.getClient();
            if (!client?.isReady) {
                throw new Error('Redis client not ready');
            }

            const ping = await client.ping();
            const info = await client.info('server');
            const timeSinceLastPing = Date.now() - this.lastPingTime;
            
            const status = {
                status: ping === 'PONG' && timeSinceLastPing < 30000 ? 'healthy' : 'degraded',
                connected: this.isConnected,
                ping,
                lastPingAge: timeSinceLastPing,
                uptime: this.parseInfoValue(info, 'uptime_in_seconds'),
                version: this.parseInfoValue(info, 'redis_version'),
                memory: this.parseInfoValue(info, 'used_memory_human'),
                timestamp: new Date().toISOString()
            };

            // Update health monitor
            this.notifyHealthStatus(status.status);
            return status;

        } catch (error) {
            const unhealthyStatus = {
                status: 'unhealthy',
                connected: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
            
            this.notifyHealthStatus('unhealthy', error);
            return unhealthyStatus;
        }
    }

    /**
     * Graceful shutdown with enhanced cleanup and connection state verification
     */
    async disconnect() {
        // Suppress the 'end'/'disconnect' event handlers' auto-recovery for the
        // quit() this method is about to perform - see handleDisconnection().
        this.isShuttingDown = true;

        // Stop health check immediately
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
            console.log('✅ Health check stopped');
        }

        // Early return if already fully disconnected
        if (!this.client) {
            console.log('ℹ️ Redis already disconnected');
            this.isShuttingDown = false;
            return;
        }

        try {
            // Mark as disconnecting to prevent new operations
            this.isConnected = false;
            this.connectionPromise = null;

            if (!this.client.isOpen) {
                console.log('ℹ️ Redis connection already closed');
                this.client = null;
                return;
            }

            // Clean shutdown sequence
            try {
                console.log('🔌 Attempting graceful Redis disconnect...');
                
                // Try quit first with timeout
                const quitPromise = this.client.quit();
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Quit timeout')), 3000)
                );
                
                await Promise.race([quitPromise, timeoutPromise]);
                console.log('✅ Redis quit successful');
                
            } catch (quitError) {
                console.warn('⚠️ Graceful quit failed:', quitError.message);
                
                try {
                    // Force disconnect if quit fails
                    console.log('🔌 Attempting force disconnect...');
                    await this.client.disconnect(false);
                    console.log('✅ Force disconnect successful');
                } catch (disconnectError) {
                    // Last resort: Destroy client
                    console.warn('⚠️ Force disconnect failed:', disconnectError.message);
                    try {
                        console.log('🔌 Destroying client...');
                        await this.client.destroy();
                        console.log('✅ Client destroyed');
                    } catch (destroyError) {
                        throw new Error(`Complete disconnect failure: ${destroyError.message}`);
                    }
                }
            }
        } catch (error) {
            console.error('❌ Redis disconnect error:', error.message);
            throw error; // Let caller handle final error
        } finally {
            // Ensure complete cleanup of internal state
            this.client = null;
            this.isConnected = false;
            this.connectionPromise = null;
            this.connectionAttempts = 0;
            this.lastPingTime = 0;
            this.isShuttingDown = false;
            console.log('✅ Redis manager state reset');
        }
    }

    /**
     * Get connection status
     */
    getStatus() {
        const timeSinceLastPing = Date.now() - this.lastPingTime;
        return {
            connected: this.isConnected,
            client: !!this.client,
            ready: this.client?.isReady || false,
            attempts: this.connectionAttempts,
            lastPingAge: timeSinceLastPing,
            healthy: timeSinceLastPing < 30000
        };
    }

    /**
     * Parse Redis INFO command values
     */
    parseInfoValue(info, key) {
        const regex = new RegExp(`${key}:(.+)`);
        const match = info.match(regex);
        return match ? match[1].trim() : null;
    }

    /**
     * Initialize required Redis data structures
     */
    async initializeStructures() {
        const client = await this.getClient();
        
        try {
            // Initialize basic key-value pairs for system state
            await client.set('system:initialized', 'true');
            await client.set('system:last_init', new Date().toISOString());
            
            // Create Redis Streams if they don't exist
            const streams = [
                'debate:events',
                'system:metrics',
                'cache:operations'
            ];

            // Initialize streams with proper error handling
            for (const stream of streams) {
                try {
                    // First ensure streams exist with a dummy message
                    const streamExists = await client.exists(stream);
                    if (!streamExists) {
                        await client.xAdd(stream, '*', {
                            event: 'stream_created',
                            timestamp: new Date().toISOString()
                        });
                    }
                    
                    // Attempt to create consumer group
                    try {
                        await client.xGroupCreate(stream, 'stancestream-group', '0', {
                            MKSTREAM: true
                        });
                        console.log(`✅ Consumer group created for ${stream}`);
                    } catch (groupError) {
                        // Group might already exist (BUSYGROUP), which is fine
                        if (!groupError.message.includes('BUSYGROUP')) {
                            console.warn(`⚠️ Group creation warning for ${stream}:`, groupError.message);
                        }
                    }
                } catch (error) {
                    console.warn(`⚠️ Stream initialization warning for ${stream}:`, error.message);
                }
            }
            
            // Initialize TimeSeries if module available
            try {
                await client.ts.create('metrics:response_times', {
                    RETENTION: 24 * 60 * 60 * 1000, // 24 hours
                    DUPLICATE_POLICY: 'LAST'
                });
                await client.ts.create('metrics:cache_hits', {
                    RETENTION: 24 * 60 * 60 * 1000
                });
            } catch (error) {
                // TimeSeries might already exist or module might not be loaded
                if (error.message.includes('already exists')) {
                    console.log('ℹ️ TimeSeries metrics already exist, continuing...');
                } else {
                    console.warn('⚠️ TimeSeries initialization warning:', error.message);
                }
            }

            // Initialize JSON document for system config if it doesn't exist
            try {
                await client.json.set('system:config', '$', {
                    initialized: true,
                    timestamp: new Date().toISOString(),
                    features: {
                        caching: true,
                        factChecking: true,
                        sentiment: true
                    }
                }, { NX: true });
            } catch (error) {
                // JSON document might already exist or module might not be loaded
                console.warn('⚠️ JSON initialization warning:', error.message);
            }

            // Set basic Hash for cache configuration
            await client.hSet('cache:config', {
                'hit_threshold': '0.85',
                'ttl': '3600',
                'max_size': '1000'
            });

            console.log('💾 Redis structures initialized successfully');
            return true;

        } catch (error) {
            console.error('❌ Failed to initialize Redis structures:', error.message);
            throw error;
        }
    }
}

// Export singleton instance
const redisManager = new RedisConnectionManager();

// Enhanced error handling for Redis-specific issues
process.on('unhandledRejection', (reason, promise) => {
    if (reason?.message?.includes('Redis')) {
        console.error('🚨 Unhandled Redis promise rejection:', reason);
    }
});

export default redisManager;
