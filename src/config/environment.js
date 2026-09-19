/**
 * Environment Configuration and Validation
 * Handles validation of required environment variables and configuration settings
 */

// Required environment variables with validation rules
const requiredEnvVars = {
    REDIS_URL: {
        validate: (value) => value.startsWith('redis://'),
        message: 'REDIS_URL must start with redis://'
    },
    OPENAI_API_KEY: {
        validate: (value) => !value || value.startsWith('sk-'), // Allow empty in development
        message: 'OPENAI_API_KEY must be a valid OpenAI key starting with sk-'
    },
    NODE_ENV: {
        validate: (value) => ['development', 'production', 'test'].includes(value),
        message: 'NODE_ENV must be development, production, or test',
        optional: true // Mark as optional to use default
    }
};

// Optional environment variables with default values
const optionalEnvVars = {
    PORT: {
        default: 3001,
        validate: (value) => !isNaN(value) && parseInt(value) > 0,
        message: 'PORT must be a positive number'
    },
    LOG_LEVEL: {
        default: 'info',
        validate: (value) => ['error', 'warn', 'info', 'debug'].includes(value),
        message: 'LOG_LEVEL must be error, warn, info, or debug'
    },
    RATE_LIMIT_WINDOW: {
        default: 60000, // 1 minute
        validate: (value) => !isNaN(value) && parseInt(value) > 0,
        message: 'RATE_LIMIT_WINDOW must be a positive number'
    },
    RATE_LIMIT_MAX: {
        default: 200,
        validate: (value) => !isNaN(value) && parseInt(value) > 0,
        message: 'RATE_LIMIT_MAX must be a positive number'
    }
};

// Redis-specific configuration validation
const redisConfig = {
    validateConnection: async (client) => {
        try {
            await client.ping();
            const info = await client.info();

            // Only skip strict module checking in development; test and
            // production both need real validation to catch real problems.
            const nodeEnv = process.env.NODE_ENV || 'development';
            if (nodeEnv === 'development') {
                return {
                    success: true,
                    warnings: ['Redis modules will be checked when vectorsearch.js and setupCacheIndex.js are run']
                };
            }

            // In test/production, check for required Redis modules
            const requiredModules = ['JSON', 'search', 'timeseries'];
            const loadedModules = info
                .split('\n')
                .filter(line => line.startsWith('module:name='))
                .map(line => line.split('=')[1]);

            const missingModules = requiredModules.filter(
                module => !loadedModules.includes(module)
            );

            if (missingModules.length > 0) {
                throw new Error(
                    `Required Redis modules missing: ${missingModules.join(', ')}`
                );
            }

            return {
                success: true,
                warnings: []
            };
        } catch (error) {
            throw new Error(`Redis connection validation failed: ${error.message}`);
        }
    }
};

// OpenAI configuration validation
const openAIConfig = {
    validateConnection: async (openai) => {
        try {
            // Test API key with a minimal request
            await openai.embeddings.create({
                model: 'text-embedding-ada-002',
                input: 'test',
            });
            return { success: true };
        } catch (error) {
            throw new Error(`OpenAI API validation failed: ${error.message}`);
        }
    }
};

/**
 * Validate all required environment variables
 * @returns {Object} Validated environment configuration
 * @throws {Error} If any required variables are missing or invalid
 */
function validateEnvironment() {
    const config = {};
    const errors = [];

    // Set NODE_ENV default first
    process.env.NODE_ENV = process.env.NODE_ENV || 'development';

    // Validate required variables
    for (const [key, rules] of Object.entries(requiredEnvVars)) {
        let value = process.env[key];

        // Skip NODE_ENV validation if it's using the default value
        if (key === 'NODE_ENV' && value === 'development') {
            config[key] = value;
            continue;
        }

        if (!value) {
            // Only add error if it's not NODE_ENV (which has a default)
            if (key !== 'NODE_ENV') {
                errors.push(`Missing required environment variable: ${key}`);
            }
            continue;
        }

        if (!rules.validate(value)) {
            errors.push(rules.message);
            continue;
        }

        config[key] = value;
    }

    // Set and validate optional variables
    for (const [key, rules] of Object.entries(optionalEnvVars)) {
        const value = process.env[key] || rules.default;

        if (!rules.validate(value)) {
            errors.push(rules.message);
            continue;
        }

        config[key] = value;
    }

    if (errors.length > 0) {
        throw new Error(
            'Environment validation failed:\n' + errors.join('\n')
        );
    }

    return config;
}

/**
 * Full system configuration validation
 * @param {Object} services Service instances to validate
 * @returns {Promise<Object>} Validation results
 */
async function validateSystem(services = {}) {
    const results = {
        environment: { success: false, error: null },
        redis: { success: false, error: null },
        openai: { success: false, error: null }
    };

    try {
        // Validate environment variables
        const config = validateEnvironment();
        results.environment.success = true;
        results.config = config;
    } catch (error) {
        results.environment.error = error.message;
        throw error; // Stop if environment validation fails
    }

    // Validate Redis if client provided
    if (services.redisClient) {
        try {
            await redisConfig.validateConnection(services.redisClient);
            results.redis.success = true;
        } catch (error) {
            results.redis.error = error.message;
            throw error; // Redis is required, so stop if validation fails
        }
    }

    // Validate OpenAI if client provided
    if (services.openai) {
        try {
            await openAIConfig.validateConnection(services.openai);
            results.openai.success = true;
        } catch (error) {
            results.openai.error = error.message;
            throw error; // OpenAI is required, so stop if validation fails
        }
    }

    return results;
}

// Development helper to check configuration
async function checkConfiguration(services = {}) {
    console.log('🔍 Checking system configuration...');

    try {
        const results = await validateSystem(services);
        console.log('✅ Configuration validation successful:', results);
        return results;
    } catch (error) {
        console.error('❌ Configuration validation failed:', error.message);
        throw error;
    }
}

export {
    validateEnvironment,
    validateSystem,
    checkConfiguration,
    requiredEnvVars,
    optionalEnvVars,
    redisConfig,
    openAIConfig
};
