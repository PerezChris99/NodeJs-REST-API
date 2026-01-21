/**
 * Centralized Error Handler Middleware
 * Catches and processes all errors consistently
 */

const logger = require('../utils/logger')
const { sendError } = require('../utils/response')
const { AppError } = require('../utils/errors')

/**
 * Handle errors and send appropriate response
 * @param {Error} error - Error object
 * @param {Object} req - HTTP request object
 * @param {Object} res - HTTP response object
 */
function handleError(error, req, res) {
    // Ensure response hasn't already been sent
    if (res.writableEnded) {
        return
    }

    // Log error details
    const errorContext = {
        method: req.method,
        url: req.url,
        ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
        userAgent: req.headers['user-agent'],
        requestId: req.headers['x-request-id']
    }

    if (error.isOperational) {
        // Operational errors (expected)
        logger.warn('Operational error', {
            ...errorContext,
            error: error.message,
            code: error.code,
            statusCode: error.statusCode
        })
    } else {
        // Programming or unknown errors (unexpected)
        logger.error('Unexpected error', {
            ...errorContext,
            error: error.message,
            stack: error.stack
        })
    }

    sendError(res, error)
}

/**
 * Wrap async route handlers to catch errors
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
function asyncHandler(fn) {
    return async (req, res, ...args) => {
        try {
            await fn(req, res, ...args)
        } catch (error) {
            handleError(error, req, res)
        }
    }
}

/**
 * Handle JSON parse errors
 * @param {Error} error - Parse error
 * @returns {AppError} Formatted error
 */
function handleJsonParseError(error) {
    return new AppError('Invalid JSON in request body', 400, 'INVALID_JSON')
}

/**
 * Handle uncaught exceptions
 */
function setupGlobalErrorHandlers() {
    process.on('uncaughtException', (error) => {
        logger.error('Uncaught Exception', {
            error: error.message,
            stack: error.stack
        })
        // Give logger time to write, then exit
        setTimeout(() => process.exit(1), 1000)
    })

    process.on('unhandledRejection', (reason, promise) => {
        logger.error('Unhandled Rejection', {
            reason: reason?.message || reason,
            stack: reason?.stack
        })
    })
}

module.exports = {
    handleError,
    asyncHandler,
    handleJsonParseError,
    setupGlobalErrorHandlers
}
