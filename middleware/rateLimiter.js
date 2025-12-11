/**
 * Rate Limiter Middleware
 * Primary: Redis-based rate limiting (if available)
 * Failover: In-memory rate limiting
 */

// Configuration
const RATE_LIMIT_CONFIG = {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    maxRequests: 100,           // Max requests per window
    message: 'Too many requests, please try again later.'
}

// In-memory store (failover)
const inMemoryStore = new Map()

// Redis client placeholder (set via setRedisClient if Redis is available)
let redisClient = null
let useRedis = false

/**
 * Set Redis client for primary rate limiting
 * @param {Object} client - Redis client instance
 */
function setRedisClient(client) {
    redisClient = client
    useRedis = true
    console.log('Rate Limiter: Using Redis as primary store')
}

/**
 * Fallback to in-memory store
 */
function fallbackToMemory() {
    useRedis = false
    console.log('Rate Limiter: Falling back to in-memory store')
}

/**
 * Get client IP address from request
 * @param {Object} req - HTTP request object
 * @returns {string} - Client IP address
 */
function getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           'unknown'
}

/**
 * Clean up expired entries from in-memory store
 */
function cleanupInMemoryStore() {
    const now = Date.now()
    for (const [key, data] of inMemoryStore.entries()) {
        if (now > data.resetTime) {
            inMemoryStore.delete(key)
        }
    }
}

// Run cleanup every 5 minutes
setInterval(cleanupInMemoryStore, 5 * 60 * 1000)

/**
 * Check rate limit using in-memory store
 * @param {string} ip - Client IP address
 * @returns {Object} - { allowed: boolean, remaining: number, resetTime: number }
 */
function checkInMemoryLimit(ip) {
    const now = Date.now()
    const key = `ratelimit:${ip}`
    
    let record = inMemoryStore.get(key)
    
    if (!record || now > record.resetTime) {
        // Create new window
        record = {
            count: 1,
            resetTime: now + RATE_LIMIT_CONFIG.windowMs
        }
        inMemoryStore.set(key, record)
        return {
            allowed: true,
            remaining: RATE_LIMIT_CONFIG.maxRequests - 1,
            resetTime: record.resetTime
        }
    }
    
    // Increment count
    record.count++
    inMemoryStore.set(key, record)
    
    const remaining = Math.max(0, RATE_LIMIT_CONFIG.maxRequests - record.count)
    const allowed = record.count <= RATE_LIMIT_CONFIG.maxRequests
    
    return {
        allowed,
        remaining,
        resetTime: record.resetTime
    }
}

/**
 * Check rate limit using Redis
 * @param {string} ip - Client IP address
 * @returns {Promise<Object>} - { allowed: boolean, remaining: number, resetTime: number }
 */
async function checkRedisLimit(ip) {
    const key = `ratelimit:${ip}`
    
    try {
        const now = Date.now()
        
        // Get current count
        let count = await redisClient.get(key)
        
        if (count === null) {
            // First request in window
            await redisClient.set(key, 1, 'PX', RATE_LIMIT_CONFIG.windowMs)
            return {
                allowed: true,
                remaining: RATE_LIMIT_CONFIG.maxRequests - 1,
                resetTime: now + RATE_LIMIT_CONFIG.windowMs
            }
        }
        
        count = parseInt(count, 10)
        
        // Get TTL for reset time
        const ttl = await redisClient.pttl(key)
        const resetTime = now + (ttl > 0 ? ttl : RATE_LIMIT_CONFIG.windowMs)
        
        if (count >= RATE_LIMIT_CONFIG.maxRequests) {
            return {
                allowed: false,
                remaining: 0,
                resetTime
            }
        }
        
        // Increment count
        await redisClient.incr(key)
        
        return {
            allowed: true,
            remaining: RATE_LIMIT_CONFIG.maxRequests - count - 1,
            resetTime
        }
    } catch (error) {
        console.error('Redis rate limit error:', error.message)
        // Failover to in-memory
        fallbackToMemory()
        return checkInMemoryLimit(ip)
    }
}

/**
 * Rate limiter middleware
 * @param {Object} req - HTTP request object
 * @param {Object} res - HTTP response object
 * @returns {Promise<boolean>} - true if request is allowed, false if rate limited
 */
async function rateLimiter(req, res) {
    const ip = getClientIP(req)
    
    let result
    
    if (useRedis && redisClient) {
        result = await checkRedisLimit(ip)
    } else {
        result = checkInMemoryLimit(ip)
    }
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', RATE_LIMIT_CONFIG.maxRequests)
    res.setHeader('X-RateLimit-Remaining', result.remaining)
    res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000))
    
    if (!result.allowed) {
        res.writeHead(429, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
            message: RATE_LIMIT_CONFIG.message,
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
        }))
        return false
    }
    
    return true
}

/**
 * Get current rate limit configuration
 * @returns {Object} - Current configuration
 */
function getConfig() {
    return { ...RATE_LIMIT_CONFIG }
}

/**
 * Update rate limit configuration
 * @param {Object} config - New configuration values
 */
function updateConfig(config) {
    if (config.windowMs) RATE_LIMIT_CONFIG.windowMs = config.windowMs
    if (config.maxRequests) RATE_LIMIT_CONFIG.maxRequests = config.maxRequests
    if (config.message) RATE_LIMIT_CONFIG.message = config.message
}

module.exports = {
    rateLimiter,
    setRedisClient,
    fallbackToMemory,
    getConfig,
    updateConfig
}
