/**
 * CORS Middleware
 * Handles Cross-Origin Resource Sharing
 */

const config = require('../config')

/**
 * Check if origin is allowed
 * @param {string} origin - Request origin
 * @returns {boolean} Is origin allowed
 */
function isOriginAllowed(origin) {
    const allowedOrigins = config.cors.allowedOrigins

    // Allow all origins if '*' is configured
    if (allowedOrigins.includes('*')) {
        return true
    }

    // Check if origin matches any allowed origin
    return allowedOrigins.some(allowed => {
        if (allowed.includes('*')) {
            // Wildcard pattern matching
            const pattern = new RegExp('^' + allowed.replace(/\*/g, '.*') + '$')
            return pattern.test(origin)
        }
        return allowed === origin
    })
}

/**
 * Apply CORS headers to response
 * @param {Object} req - HTTP request object
 * @param {Object} res - HTTP response object
 * @returns {boolean} True if request should continue, false for preflight
 */
function corsMiddleware(req, res) {
    const origin = req.headers.origin

    // Set CORS headers
    if (origin && isOriginAllowed(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin)
        res.setHeader('Vary', 'Origin')
    } else if (config.cors.allowedOrigins.includes('*')) {
        res.setHeader('Access-Control-Allow-Origin', '*')
    }

    res.setHeader('Access-Control-Allow-Methods', config.cors.allowedMethods.join(', '))
    res.setHeader('Access-Control-Allow-Headers', config.cors.allowedHeaders.join(', '))
    res.setHeader('Access-Control-Max-Age', '86400') // 24 hours
    res.setHeader('Access-Control-Allow-Credentials', 'true')

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        res.writeHead(204)
        res.end()
        return false // Don't continue processing
    }

    return true // Continue processing
}

module.exports = { corsMiddleware, isOriginAllowed }
