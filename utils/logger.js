/**
 * Structured Logger
 * Production-ready logging with levels, timestamps, and context
 */

const config = require('../config')

const LOG_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
}

const currentLevel = LOG_LEVELS[config.logging.level] ?? LOG_LEVELS.info

/**
 * Format log entry
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} meta - Additional metadata
 * @returns {string} Formatted log entry
 */
function formatLog(level, message, meta = {}) {
    const timestamp = new Date().toISOString()
    const entry = {
        timestamp,
        level: level.toUpperCase(),
        message,
        ...meta,
        pid: process.pid,
        env: config.server.nodeEnv
    }

    if (config.logging.format === 'json') {
        return JSON.stringify(entry)
    }

    // Pretty format for development
    const metaStr = Object.keys(meta).length > 0 
        ? ` ${JSON.stringify(meta)}` 
        : ''
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`
}

/**
 * Create a log function for a specific level
 */
function createLogFn(level) {
    return function(message, meta = {}) {
        if (LOG_LEVELS[level] <= currentLevel) {
            const output = formatLog(level, message, meta)
            if (level === 'error') {
                console.error(output)
            } else if (level === 'warn') {
                console.warn(output)
            } else {
                console.log(output)
            }
        }
    }
}

const logger = {
    error: createLogFn('error'),
    warn: createLogFn('warn'),
    info: createLogFn('info'),
    http: createLogFn('http'),
    debug: createLogFn('debug'),

    /**
     * Create a child logger with persistent context
     * @param {Object} context - Context to include in all logs
     * @returns {Object} Child logger
     */
    child(context) {
        return {
            error: (msg, meta = {}) => logger.error(msg, { ...context, ...meta }),
            warn: (msg, meta = {}) => logger.warn(msg, { ...context, ...meta }),
            info: (msg, meta = {}) => logger.info(msg, { ...context, ...meta }),
            http: (msg, meta = {}) => logger.http(msg, { ...context, ...meta }),
            debug: (msg, meta = {}) => logger.debug(msg, { ...context, ...meta })
        }
    }
}

module.exports = logger
