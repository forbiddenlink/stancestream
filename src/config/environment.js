/**
 * Environment Configuration and Validation
 * Validates all required environment variables on startup
 */

import { z } from 'zod';

// Define the schema for environment variables
const envSchema = z.object({
    // Redis Configuration
    REDIS_URL: z.string().url('REDIS_URL must be a valid URL'),
    
    // OpenAI Configuration
    OPENAI_API_KEY: z.string()
        .min(20, 'OPENAI_API_KEY must be at least 20 characters')
        .startsWith('sk-', 'OPENAI_API_KEY must start with sk-'),
    
    // Server Configuration
    PORT: z.string()
        .regex(/^\d+$/, 'PORT must be a number')
        .transform(Number)
        .default('3001'),
    
    NODE_ENV: z.enum(['development', 'production', 'test'])
        .default('development'),
    
    // Logging Configuration
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug', 'trace'])
        .default('info'),
    
    // Rate Limiting
    API_RATE_LIMIT: z.string()
        .regex(/^\d+$/, 'API_RATE_LIMIT must be a number')
        .transform(Number)
        .default('60'),
    
    // Redis Pool Configuration
    REDIS_POOL_SIZE: z.string()
        .regex(/^\d+$/)
        .transform(Number)
        .default('3')
        .optional(),
    
    // Cache Configuration
    CACHE_SIMILARITY_THRESHOLD: z.string()
        .regex(/^0\.\d+$/)
        .transform(Number)
        .default('0.85')
        .optional(),
    
    CACHE_TTL: z.string()
        .regex(/^\d+$/)
        .transform(Number)
        .default('3600')
        .optional()
});

/**
 * Validate environment variables
 * @throws {Error} If validation fails
 * @returns {Object} Validated and parsed environment configuration
 */
export function validateEnvironment() {
    try {
        const validated = envSchema.parse(process.env);
        
        console.log('✅ Environment validation successful');
        console.log(`📊 Configuration:`);
        console.log(`   - Environment: ${validated.NODE_ENV}`);
        console.log(`   - Port: ${validated.PORT}`);
        console.log(`   - Log Level: ${validated.LOG_LEVEL}`);
        console.log(`   - Rate Limit: ${validated.API_RATE_LIMIT} req/min`);
        console.log(`   - Redis Pool Size: ${validated.REDIS_POOL_SIZE || 3}`);
        
        return validated;
    } catch (error) {
        console.error('❌ Environment validation failed:');
        console.error('');
        
        if (error instanceof z.ZodError) {
            error.errors.forEach((err) => {
                const field = err.path.join('.');
                console.error(`   ${field}: ${err.message}`);
            });
        } else {
            console.error(error.message);
        }
        
        console.error('');
        console.error('Please check your .env file and ensure all required variables are set correctly.');
        console.error('');
        
        process.exit(1);
    }
}

/**
 * Get environment-specific configuration
 * @param {string} env - Environment name (development, production, test)
 * @returns {Object} Environment-specific configuration
 */
export function getEnvironmentConfig(env = process.env.NODE_ENV || 'development') {
    const configs = {
        development: {
            redis: {
                commandTimeout: 5000,
                reconnectDelay: 1000,
                maxRetries: 3
            },
            cache: {
                ttl: 3600,
                similarityThreshold: 0.85,
                maxSize: 1000
            },
            logging: {
                level: 'debug',
                prettyPrint: true
            },
            server: {
                corsOrigins: ['http://localhost:5173', 'http://localhost:5174']
            }
        },
        production: {
            redis: {
                commandTimeout: 10000,
                reconnectDelay: 2000,
                maxRetries: 5
            },
            cache: {
                ttl: 86400,
                similarityThreshold: 0.90, // Stricter in production
                maxSize: 5000
            },
            logging: {
                level: 'info',
                prettyPrint: false
            },
            server: {
                corsOrigins: [
                    'https://stancestream.vercel.app',
                    'https://stancestream.onrender.com'
                ]
            }
        },
        test: {
            redis: {
                commandTimeout: 3000,
                reconnectDelay: 500,
                maxRetries: 1
            },
            cache: {
                ttl: 60,
                similarityThreshold: 0.80,
                maxSize: 100
            },
            logging: {
                level: 'error',
                prettyPrint: false
            },
            server: {
                corsOrigins: ['http://localhost:5173']
            }
        }
    };

    return configs[env] || configs.development;
}

/**
 * Check if running in production
 * @returns {boolean}
 */
export function isProduction() {
    return process.env.NODE_ENV === 'production';
}

/**
 * Check if running in development
 * @returns {boolean}
 */
export function isDevelopment() {
    return process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
}

/**
 * Check if running in test mode
 * @returns {boolean}
 */
export function isTest() {
    return process.env.NODE_ENV === 'test';
}

export default {
    validateEnvironment,
    getEnvironmentConfig,
    isProduction,
    isDevelopment,
    isTest
};
