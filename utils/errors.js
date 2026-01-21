/**
 * Custom Error Classes
 * Standardized error handling for the API
 */

class AppError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
        super(message)
        this.statusCode = statusCode
        this.code = code
        this.isOperational = true
        Error.captureStackTrace(this, this.constructor)
    }

    toJSON() {
        return {
            error: {
                code: this.code,
                message: this.message,
                ...(process.env.NODE_ENV === 'development' && { stack: this.stack })
            }
        }
    }
}

class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404, 'NOT_FOUND')
    }
}

class ValidationError extends AppError {
    constructor(message, details = []) {
        super(message, 400, 'VALIDATION_ERROR')
        this.details = details
    }

    toJSON() {
        return {
            error: {
                code: this.code,
                message: this.message,
                details: this.details,
                ...(process.env.NODE_ENV === 'development' && { stack: this.stack })
            }
        }
    }
}

class BadRequestError extends AppError {
    constructor(message = 'Bad request') {
        super(message, 400, 'BAD_REQUEST')
    }
}

class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 401, 'UNAUTHORIZED')
    }
}

class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(message, 403, 'FORBIDDEN')
    }
}

class ConflictError extends AppError {
    constructor(message = 'Resource conflict') {
        super(message, 409, 'CONFLICT')
    }
}

class RateLimitError extends AppError {
    constructor(retryAfter = 60) {
        super('Too many requests, please try again later', 429, 'RATE_LIMIT_EXCEEDED')
        this.retryAfter = retryAfter
    }
}

module.exports = {
    AppError,
    NotFoundError,
    ValidationError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    ConflictError,
    RateLimitError
}
