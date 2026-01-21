/**
 * Production-Ready Node.js REST API Server
 * Features: Structured logging, security headers, CORS, rate limiting,
 * graceful shutdown, health checks, and proper error handling
 */

const http = require('http')
const config = require('./config')
const logger = require('./utils/logger')
const { handleError, setupGlobalErrorHandlers } = require('./middleware/errorHandler')
const { rateLimiter } = require('./middleware/rateLimiter')
const { corsMiddleware } = require('./middleware/cors')
const { securityMiddleware } = require('./middleware/security')
const { requestLoggerMiddleware } = require('./middleware/requestLogger')
const { staticMiddleware } = require('./middleware/static')

// Routes
const productRoutes = require('./routes/productRoutes')
const healthRoutes = require('./routes/healthRoutes')

// Setup global error handlers
setupGlobalErrorHandlers()

/**
 * Main request handler
 */
async function requestHandler(req, res) {
    try {
        // Request logging (adds request ID)
        requestLoggerMiddleware(req, res)

        // Security headers
        if (!securityMiddleware(req, res)) return

        // CORS handling
        if (!corsMiddleware(req, res)) return

        // Serve static files (dashboard UI)
        if (await staticMiddleware(req, res)) return

        // Rate limiting (skip for health checks and static files)
        if (!req.url.startsWith('/health')) {
            const allowed = await rateLimiter(req, res)
            if (!allowed) return
        }

        // Health check routes (no rate limiting)
        if (await healthRoutes.handle(req, res)) return

        // Product routes
        if (await productRoutes.handle(req, res)) return

        // 404 Not Found
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
            success: false,
            error: {
                code: 'NOT_FOUND',
                message: 'Route not found',
                path: req.url
            }
        }))

    } catch (error) {
        handleError(error, req, res)
    }
}

const server = http.createServer(requestHandler)

/**
 * Graceful Shutdown Handler
 * Allows existing connections to complete before shutting down
 */
function gracefulShutdown(signal) {
    logger.info(`${signal} received, starting graceful shutdown...`)

    // Stop accepting new connections
    server.close((err) => {
        if (err) {
            logger.error('Error during shutdown', { error: err.message })
            process.exit(1)
        }

        logger.info('HTTP server closed, all connections drained')
        
        // Close other resources (database connections, etc.)
        // await db.close()
        // await redis.quit()
        
        logger.info('Graceful shutdown complete')
        process.exit(0)
    })

    // Force shutdown after 30 seconds
    setTimeout(() => {
        logger.error('Forced shutdown due to timeout')
        process.exit(1)
    }, 30000)
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Start server
server.listen(config.server.port, config.server.host, () => {
    logger.info('Server started', {
        port: config.server.port,
        host: config.server.host,
        environment: config.server.nodeEnv,
        pid: process.pid
    })

    if (config.server.nodeEnv === 'development') {
        console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   🚀 Server running at http://localhost:${config.server.port}                  ║
║                                                                ║
║   📊 Dashboard:  http://localhost:${config.server.port}/                       ║
║                                                                ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║   📚 API Endpoints:                                            ║
║      GET    /api/products          List products (paginated)   ║
║      GET    /api/products/:id      Get product by ID           ║
║      POST   /api/products          Create new product          ║
║      PUT    /api/products/:id      Update product (full)       ║
║      PATCH  /api/products/:id      Update product (partial)    ║
║      DELETE /api/products/:id      Delete product              ║
║                                                                ║
║   🏥 Health Endpoints:                                         ║
║      GET    /health                Basic health check          ║
║      GET    /health/ready          Readiness check             ║
║      GET    /health/live           Liveness check              ║
║      GET    /health/detailed       Detailed system info        ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
        `)
    }
})

// Handle server errors
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${config.server.port} is already in use`)
    } else {
        logger.error('Server error', { error: error.message })
    }
    process.exit(1)
})

module.exports = server 

