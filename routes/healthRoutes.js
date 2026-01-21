/**
 * Health Check Routes
 * Endpoints for monitoring and load balancer health checks
 */

const Router = require('./router')
const os = require('os')

const router = new Router()

// Track server start time
const startTime = Date.now()

/**
 * GET /health - Basic health check
 * Used by load balancers and monitoring systems
 */
router.get('/health', (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString()
    }))
})

/**
 * GET /health/ready - Readiness check
 * Indicates if the application is ready to accept traffic
 */
router.get('/health/ready', async (req, res) => {
    // Add checks for dependencies (database, cache, etc.)
    const checks = {
        server: true,
        // Add more checks as needed:
        // database: await checkDatabase(),
        // redis: await checkRedis()
    }

    const allHealthy = Object.values(checks).every(v => v === true)

    res.writeHead(allHealthy ? 200 : 503, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
        status: allHealthy ? 'ready' : 'not_ready',
        checks,
        timestamp: new Date().toISOString()
    }))
})

/**
 * GET /health/live - Liveness check
 * Indicates if the application is running (not deadlocked)
 */
router.get('/health/live', (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
        status: 'alive',
        uptime: Math.floor((Date.now() - startTime) / 1000),
        timestamp: new Date().toISOString()
    }))
})

/**
 * GET /health/detailed - Detailed health information
 * For internal monitoring (should be protected in production)
 */
router.get('/health/detailed', (req, res) => {
    const memUsage = process.memoryUsage()
    
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
        status: 'healthy',
        env: process.env.NODE_ENV || 'development',
        pid: process.pid,
        version: process.env.npm_package_version || '1.0.0',
        node: process.version,
        uptime: {
            process: Math.floor(process.uptime()),
            system: Math.floor(os.uptime())
        },
        memory: {
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
            rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
            external: Math.round(memUsage.external / 1024 / 1024) + ' MB'
        },
        cpu: {
            cores: os.cpus().length,
            loadAvg: os.loadavg()
        },
        timestamp: new Date().toISOString()
    }))
})

module.exports = router
