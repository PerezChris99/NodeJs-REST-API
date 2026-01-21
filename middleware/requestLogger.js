/**
 * Request Logger Middleware
 * Logs all incoming requests with timing and details
 */

const logger = require('../utils/logger')
const { v4: uuidv4 } = require('uuid')

/**
 * Log incoming request and track response time
 * @param {Object} req - HTTP request object
 * @param {Object} res - HTTP response object
 */
function requestLoggerMiddleware(req, res) {
    const startTime = process.hrtime()
    
    // Generate request ID if not present
    const requestId = req.headers['x-request-id'] || uuidv4()
    req.requestId = requestId
    res.setHeader('X-Request-ID', requestId)

    // Store original end method
    const originalEnd = res.end

    // Override end to log response
    res.end = function(...args) {
        // Calculate duration
        const diff = process.hrtime(startTime)
        const duration = (diff[0] * 1e3 + diff[1] / 1e6).toFixed(2) // ms

        // Get response size
        const contentLength = res.getHeader('content-length') || 0

        // Log request details
        logger.http('Request completed', {
            requestId,
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            contentLength,
            ip: req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress,
            userAgent: req.headers['user-agent']
        })

        // Call original end
        return originalEnd.apply(this, args)
    }
}

module.exports = { requestLoggerMiddleware }
