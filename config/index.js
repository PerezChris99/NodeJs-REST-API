/**
 * Application Configuration
 * Centralized configuration management with environment variable support
 */

const config = {
    // Server
    server: {
        port: parseInt(process.env.PORT, 10) || 5000,
        host: process.env.HOST || '0.0.0.0',
        nodeEnv: process.env.NODE_ENV || 'development'
    },

    // Rate Limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100
    },

    // Redis (optional)
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        enabled: process.env.REDIS_ENABLED === 'true'
    },

    // CORS
    cors: {
        allowedOrigins: process.env.CORS_ORIGINS?.split(',') || ['*'],
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
    },

    // Logging
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'json'
    },

    // API
    api: {
        version: 'v1',
        prefix: '/api'
    }
}

/**
 * Validate required configuration
 */
function validateConfig() {
    const errors = []

    if (config.server.port < 1 || config.server.port > 65535) {
        errors.push('Invalid PORT: must be between 1 and 65535')
    }

    if (config.rateLimit.maxRequests < 1) {
        errors.push('Invalid RATE_LIMIT_MAX_REQUESTS: must be at least 1')
    }

    if (errors.length > 0) {
        throw new Error(`Configuration validation failed:\n${errors.join('\n')}`)
    }
}

// Validate on load
validateConfig()

module.exports = config
