/**
 * Security Middleware
 * Applies security headers and protections
 */

const logger = require('../utils/logger')

/**
 * Apply security headers (similar to Helmet.js)
 * @param {Object} res - HTTP response object
 */
function applySecurityHeaders(res) {
    // Prevent XSS attacks
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-XSS-Protection', '1; mode=block')

    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY')

    // Control referrer information
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')

    // Content Security Policy (basic)
    res.setHeader('Content-Security-Policy', "default-src 'self'")

    // Disable caching for API responses (security best practice)
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')

    // HSTS (only in production with HTTPS)
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    }

    // Remove X-Powered-By (not set by Node.js core, but good practice)
    // Express sets this, vanilla Node.js doesn't
}

/**
 * Validate Content-Type for POST/PUT/PATCH requests
 * @param {Object} req - HTTP request object
 * @returns {boolean} Is content type valid
 */
function validateContentType(req) {
    const methodsRequiringBody = ['POST', 'PUT', 'PATCH']
    
    if (!methodsRequiringBody.includes(req.method)) {
        return true
    }

    const contentType = req.headers['content-type']
    
    // Allow requests without body for methods that might have optional body
    if (!contentType) {
        return true
    }

    // Only accept JSON
    if (!contentType.includes('application/json')) {
        return false
    }

    return true
}

/**
 * Security middleware that applies all protections
 * @param {Object} req - HTTP request object
 * @param {Object} res - HTTP response object
 * @returns {boolean} True if request should continue
 */
function securityMiddleware(req, res) {
    // Apply security headers
    applySecurityHeaders(res)

    // Validate content type
    if (!validateContentType(req)) {
        res.writeHead(415, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
            success: false,
            error: {
                code: 'UNSUPPORTED_MEDIA_TYPE',
                message: 'Content-Type must be application/json'
            }
        }))
        return false
    }

    // Log suspicious requests
    const suspiciousPatterns = [
        /\.\.\//,           // Path traversal
        /<script>/i,        // XSS
        /union.*select/i,   // SQL injection
        /javascript:/i      // JavaScript protocol
    ]

    const urlToCheck = decodeURIComponent(req.url || '')
    for (const pattern of suspiciousPatterns) {
        if (pattern.test(urlToCheck)) {
            logger.warn('Suspicious request detected', {
                method: req.method,
                url: req.url,
                ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
                pattern: pattern.toString()
            })
            break
        }
    }

    return true
}

module.exports = {
    securityMiddleware,
    applySecurityHeaders,
    validateContentType
}
