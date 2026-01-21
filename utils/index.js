const fs = require('fs')
const path = require('path')

/**
 * Write data to a JSON file (async with sync fallback)
 * @param {string} filename - File path
 * @param {*} content - Content to write
 */
function writeDataToFile(filename, content) {
    // Resolve to absolute path from project root
    const absolutePath = path.isAbsolute(filename) 
        ? filename 
        : path.join(process.cwd(), filename)
    
    try {
        fs.writeFileSync(absolutePath, JSON.stringify(content, null, 2), 'utf-8')
    } catch (err) {
        console.error('Error writing file:', err)
        throw err
    }
}

/**
 * Parse request body as JSON
 * @param {Object} req - HTTP request object
 * @param {number} maxSize - Maximum body size in bytes (default 1MB)
 * @returns {Promise<string>} Parsed body string
 */
function getPostData(req, maxSize = 1024 * 1024) {
    return new Promise((resolve, reject) => {
        let body = ''
        let size = 0

        req.on('data', (chunk) => {
            size += chunk.length
            
            // Prevent large payloads (DoS protection)
            if (size > maxSize) {
                req.destroy()
                reject(new Error('Request body too large'))
                return
            }
            
            body += chunk.toString()
        })

        req.on('end', () => {
            resolve(body)
        })

        req.on('error', (error) => {
            reject(error)
        })

        // Handle aborted requests
        req.on('aborted', () => {
            reject(new Error('Request aborted'))
        })
    })
}

/**
 * Parse query string from URL
 * @param {string} url - URL with query string
 * @returns {Object} Parsed query parameters
 */
function parseQueryString(url) {
    const queryIndex = url.indexOf('?')
    if (queryIndex === -1) return {}
    
    const queryString = url.slice(queryIndex + 1)
    const params = {}
    
    for (const pair of queryString.split('&')) {
        const [key, value] = pair.split('=').map(decodeURIComponent)
        if (key) {
            params[key] = value || ''
        }
    }
    
    return params
}

/**
 * Sleep for a specified duration
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry an async operation with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @returns {Promise<*>} Result of the function
 */
async function retry(fn, options = {}) {
    const { maxAttempts = 3, delay = 1000, backoff = 2 } = options
    
    let lastError
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn()
        } catch (error) {
            lastError = error
            if (attempt < maxAttempts) {
                await sleep(delay * Math.pow(backoff, attempt - 1))
            }
        }
    }
    
    throw lastError
}

module.exports = {
    writeDataToFile,
    getPostData,
    parseQueryString,
    sleep,
    retry
}
