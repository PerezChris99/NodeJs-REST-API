/**
 * Input Validation Utilities
 * Validates and sanitizes user input
 */

const { ValidationError } = require('./errors')

/**
 * Validation rules for product
 */
const productSchema = {
    title: {
        type: 'string',
        required: true,
        minLength: 3,
        maxLength: 200,
        message: 'Title must be between 3 and 200 characters'
    },
    description: {
        type: 'string',
        required: true,
        minLength: 10,
        maxLength: 2000,
        message: 'Description must be between 10 and 2000 characters'
    },
    price: {
        type: 'number',
        required: true,
        min: 0,
        max: 999999.99,
        message: 'Price must be a positive number up to 999999.99'
    }
}

/**
 * Sanitize string input
 * @param {string} str - Input string
 * @returns {string} Sanitized string
 */
function sanitizeString(str) {
    if (typeof str !== 'string') return str
    return str
        .trim()
        .replace(/[<>]/g, '') // Remove HTML brackets
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .substring(0, 10000) // Limit length
}

/**
 * Validate a value against a rule
 * @param {*} value - Value to validate
 * @param {Object} rule - Validation rule
 * @param {string} field - Field name
 * @returns {string|null} Error message or null
 */
function validateField(value, rule, field) {
    // Check required
    if (rule.required && (value === undefined || value === null || value === '')) {
        return `${field} is required`
    }

    // Skip validation if value is empty and not required
    if (value === undefined || value === null || value === '') {
        return null
    }

    // Type check
    if (rule.type === 'string') {
        if (typeof value !== 'string') {
            return `${field} must be a string`
        }
        if (rule.minLength && value.length < rule.minLength) {
            return rule.message || `${field} must be at least ${rule.minLength} characters`
        }
        if (rule.maxLength && value.length > rule.maxLength) {
            return rule.message || `${field} must be at most ${rule.maxLength} characters`
        }
        if (rule.pattern && !rule.pattern.test(value)) {
            return rule.message || `${field} format is invalid`
        }
    }

    if (rule.type === 'number') {
        const num = typeof value === 'number' ? value : parseFloat(value)
        if (isNaN(num)) {
            return `${field} must be a valid number`
        }
        if (rule.min !== undefined && num < rule.min) {
            return rule.message || `${field} must be at least ${rule.min}`
        }
        if (rule.max !== undefined && num > rule.max) {
            return rule.message || `${field} must be at most ${rule.max}`
        }
    }

    if (rule.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) {
            return `${field} must be a valid email address`
        }
    }

    return null
}

/**
 * Validate an object against a schema
 * @param {Object} data - Data to validate
 * @param {Object} schema - Validation schema
 * @param {Object} options - Validation options
 * @returns {Object} Validated and sanitized data
 * @throws {ValidationError} If validation fails
 */
function validate(data, schema, options = { partial: false }) {
    const errors = []
    const validated = {}

    for (const [field, rule] of Object.entries(schema)) {
        let value = data[field]

        // Skip fields not in data for partial updates
        if (options.partial && value === undefined) {
            continue
        }

        // Sanitize strings
        if (typeof value === 'string') {
            value = sanitizeString(value)
        }

        // Validate
        const error = validateField(value, rule, field)
        if (error) {
            errors.push({ field, message: error })
        } else if (value !== undefined) {
            // Convert number strings to numbers
            if (rule.type === 'number' && typeof value === 'string') {
                value = parseFloat(value)
            }
            validated[field] = value
        }
    }

    if (errors.length > 0) {
        throw new ValidationError('Validation failed', errors)
    }

    return validated
}

/**
 * Validate UUID format
 * @param {string} id - UUID to validate
 * @returns {boolean} Is valid UUID
 */
function isValidUUID(id) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(id)
}

/**
 * Validate and parse pagination parameters
 * @param {Object} query - Query parameters
 * @returns {Object} Pagination params { page, limit, offset }
 */
function validatePagination(query) {
    let page = parseInt(query.page, 10) || 1
    let limit = parseInt(query.limit, 10) || 10

    // Enforce limits
    page = Math.max(1, page)
    limit = Math.min(Math.max(1, limit), 100) // Max 100 items per page

    return {
        page,
        limit,
        offset: (page - 1) * limit
    }
}

module.exports = {
    productSchema,
    validate,
    sanitizeString,
    isValidUUID,
    validatePagination
}
