/**
 * Standardized API Response Utilities
 * Consistent response format across all endpoints
 */

/**
 * Send a successful response
 * @param {Object} res - HTTP response object
 * @param {*} data - Response data
 * @param {number} statusCode - HTTP status code
 * @param {Object} meta - Additional metadata (pagination, etc.)
 */
function sendSuccess(res, data, statusCode = 200, meta = null) {
    const response = {
        success: true,
        data
    }

    if (meta) {
        response.meta = meta
    }

    res.writeHead(statusCode, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(response))
}

/**
 * Send an error response
 * @param {Object} res - HTTP response object
 * @param {Error} error - Error object
 */
function sendError(res, error) {
    const statusCode = error.statusCode || 500
    const isOperational = error.isOperational || false

    const response = {
        success: false,
        error: {
            code: error.code || 'INTERNAL_ERROR',
            message: isOperational ? error.message : 'An unexpected error occurred'
        }
    }

    // Add validation details if present
    if (error.details) {
        response.error.details = error.details
    }

    // Add retry info for rate limiting
    if (error.retryAfter) {
        response.error.retryAfter = error.retryAfter
    }

    // Add stack trace in development
    if (process.env.NODE_ENV === 'development' && error.stack) {
        response.error.stack = error.stack
    }

    res.writeHead(statusCode, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(response))
}

/**
 * Send paginated response
 * @param {Object} res - HTTP response object
 * @param {Array} data - Array of items
 * @param {Object} pagination - Pagination info { page, limit, total }
 */
function sendPaginated(res, data, pagination) {
    const { page, limit, total } = pagination
    const totalPages = Math.ceil(total / limit)

    sendSuccess(res, data, 200, {
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
        }
    })
}

/**
 * Send created response (201)
 */
function sendCreated(res, data) {
    sendSuccess(res, data, 201)
}

/**
 * Send no content response (204)
 */
function sendNoContent(res) {
    res.writeHead(204)
    res.end()
}

module.exports = {
    sendSuccess,
    sendError,
    sendCreated,
    sendPaginated,
    sendNoContent
}
