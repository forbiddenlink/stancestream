/**
 * Input Validation Middleware
 * Validates request bodies, params, and queries using Zod schemas
 */

import { z } from 'zod';

// ============================================
// VALIDATION SCHEMAS
// ============================================

export const debateStartSchema = z.object({
    topic: z.string()
        .min(3, 'Topic must be at least 3 characters')
        .max(200, 'Topic must be less than 200 characters')
        .trim(),
    agents: z.array(z.string())
        .min(2, 'At least 2 agents required')
        .max(10, 'Maximum 10 agents allowed'),
    duration: z.number()
        .int()
        .positive()
        .max(7200, 'Duration cannot exceed 2 hours')
        .optional()
        .default(300)
});

export const messageGenerationSchema = z.object({
    agentId: z.string()
        .min(1, 'Agent ID is required')
        .regex(/^[a-z0-9_-]+$/, 'Agent ID must be lowercase alphanumeric with dashes/underscores'),
    debateId: z.string()
        .min(1, 'Debate ID is required'),
    topic: z.string()
        .min(1, 'Topic is required')
        .max(500, 'Topic too long')
        .optional()
        .default('general policy')
});

export const factCheckSchema = z.object({
    statement: z.string()
        .min(5, 'Statement must be at least 5 characters')
        .max(1000, 'Statement must be less than 1000 characters'),
    context: z.string()
        .max(500, 'Context must be less than 500 characters')
        .optional(),
    sources: z.array(z.string())
        .optional()
        .default(['scientific', 'governmental'])
});

export const agentProfileSchema = z.object({
    id: z.string()
        .min(1)
        .regex(/^[a-z0-9_-]+$/),
    name: z.string()
        .min(1)
        .max(100),
    role: z.string()
        .min(1)
        .max(200),
    tone: z.enum(['measured', 'passionate', 'analytical', 'diplomatic'])
        .optional()
        .default('measured'),
    stance: z.record(z.string(), z.number().min(-1).max(1))
        .optional()
        .default({}),
    biases: z.array(z.string())
        .optional()
        .default([])
});

export const cacheQuerySchema = z.object({
    prompt: z.string()
        .min(1, 'Prompt is required')
        .max(5000, 'Prompt too long'),
    threshold: z.number()
        .min(0)
        .max(1)
        .optional()
        .default(0.85)
});

// ============================================
// VALIDATION MIDDLEWARE FACTORY
// ============================================

/**
 * Create validation middleware for request body
 * @param {z.ZodSchema} schema - Zod validation schema
 * @returns {Function} Express middleware
 */
export function validateBody(schema) {
    return (req, res, next) => {
        try {
            req.validatedBody = schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                });
            }
            return res.status(400).json({
                error: 'Invalid request body',
                message: error.message
            });
        }
    };
}

/**
 * Create validation middleware for query parameters
 * @param {z.ZodSchema} schema - Zod validation schema
 * @returns {Function} Express middleware
 */
export function validateQuery(schema) {
    return (req, res, next) => {
        try {
            req.validatedQuery = schema.parse(req.query);
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    error: 'Invalid query parameters',
                    details: error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                });
            }
            return res.status(400).json({
                error: 'Invalid query parameters',
                message: error.message
            });
        }
    };
}

/**
 * Create validation middleware for URL parameters
 * @param {z.ZodSchema} schema - Zod validation schema
 * @returns {Function} Express middleware
 */
export function validateParams(schema) {
    return (req, res, next) => {
        try {
            req.validatedParams = schema.parse(req.params);
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    error: 'Invalid URL parameters',
                    details: error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                });
            }
            return res.status(400).json({
                error: 'Invalid URL parameters',
                message: error.message
            });
        }
    };
}

// ============================================
// SPECIFIC VALIDATION MIDDLEWARE
// ============================================

/**
 * Validate debate start request
 */
export const validateDebateStart = validateBody(debateStartSchema);

/**
 * Validate message generation request
 */
export const validateMessageGeneration = validateBody(messageGenerationSchema);

/**
 * Validate fact check request
 */
export const validateFactCheck = validateBody(factCheckSchema);

/**
 * Validate agent profile
 */
export const validateAgentProfile = validateBody(agentProfileSchema);

/**
 * Validate cache query
 */
export const validateCacheQuery = validateBody(cacheQuerySchema);

// ============================================
// SANITIZATION HELPERS
// ============================================

/**
 * Sanitize HTML entities to prevent XSS
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
export function sanitizeHtml(text) {
    if (typeof text !== 'string') return text;
    
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize input to prevent injection attacks
 * @param {any} input - Input to sanitize
 * @returns {any} Sanitized input
 */
export function sanitizeInput(input) {
    if (typeof input === 'string') {
        return sanitizeHtml(input);
    }
    
    if (Array.isArray(input)) {
        return input.map(sanitizeInput);
    }
    
    if (input && typeof input === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(input)) {
            sanitized[key] = sanitizeInput(value);
        }
        return sanitized;
    }
    
    return input;
}

/**
 * Middleware to sanitize all request inputs
 */
export function sanitizeRequest(req, res, next) {
    if (req.body) {
        req.body = sanitizeInput(req.body);
    }
    
    if (req.query) {
        req.query = sanitizeInput(req.query);
    }
    
    if (req.params) {
        req.params = sanitizeInput(req.params);
    }
    
    next();
}

// ============================================
// COMMON PARAMETER VALIDATION
// ============================================

export const debateIdSchema = z.object({
    id: z.string().min(1, 'Debate ID is required')
});

export const agentIdSchema = z.object({
    id: z.string()
        .min(1)
        .regex(/^[a-z0-9_-]+$/, 'Invalid agent ID format')
});

export const paginationSchema = z.object({
    limit: z.string()
        .regex(/^\d+$/)
        .transform(Number)
        .refine(n => n > 0 && n <= 100, 'Limit must be between 1 and 100')
        .optional()
        .default('50'),
    offset: z.string()
        .regex(/^\d+$/)
        .transform(Number)
        .refine(n => n >= 0, 'Offset must be non-negative')
        .optional()
        .default('0')
});

export default {
    validateBody,
    validateQuery,
    validateParams,
    validateDebateStart,
    validateMessageGeneration,
    validateFactCheck,
    validateAgentProfile,
    validateCacheQuery,
    sanitizeHtml,
    sanitizeInput,
    sanitizeRequest,
    // Schemas
    debateStartSchema,
    messageGenerationSchema,
    factCheckSchema,
    agentProfileSchema,
    cacheQuerySchema,
    debateIdSchema,
    agentIdSchema,
    paginationSchema
};
