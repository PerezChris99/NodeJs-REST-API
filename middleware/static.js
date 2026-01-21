/**
 * Static File Server Middleware
 * Serves static files from the public directory
 */

const fs = require('fs')
const path = require('path')

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject'
}

const PUBLIC_DIR = path.join(process.cwd(), 'public')

/**
 * Serve static files from public directory
 * @param {Object} req - HTTP request
 * @param {Object} res - HTTP response
 * @returns {Promise<boolean>} True if file was served
 */
async function staticMiddleware(req, res) {
    // Only handle GET requests
    if (req.method !== 'GET') return false

    // Parse URL path
    let urlPath = req.url.split('?')[0]
    
    // Serve index.html for root
    if (urlPath === '/' || urlPath === '') {
        urlPath = '/index.html'
    }

    // Security: prevent directory traversal
    const normalizedPath = path.normalize(urlPath)
    if (normalizedPath.includes('..')) {
        return false
    }

    const filePath = path.join(PUBLIC_DIR, normalizedPath)

    // Check if path is within public directory
    if (!filePath.startsWith(PUBLIC_DIR)) {
        return false
    }

    try {
        // Check if file exists
        const stats = await fs.promises.stat(filePath)
        
        if (!stats.isFile()) {
            return false
        }

        // Get MIME type
        const ext = path.extname(filePath).toLowerCase()
        const mimeType = MIME_TYPES[ext] || 'application/octet-stream'

        // Read and serve file
        const content = await fs.promises.readFile(filePath)

        // Set caching headers for assets
        if (ext !== '.html') {
            res.setHeader('Cache-Control', 'public, max-age=31536000')
        } else {
            res.setHeader('Cache-Control', 'no-cache')
        }

        res.writeHead(200, { 'Content-Type': mimeType })
        res.end(content)
        return true

    } catch (error) {
        // File not found, let other handlers process
        return false
    }
}

module.exports = { staticMiddleware }
