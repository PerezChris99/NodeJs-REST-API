/**
 * Router
 * Clean, Express-like routing system for vanilla Node.js
 */

const { parse: parseUrl } = require('url')

class Router {
    constructor() {
        this.routes = {
            GET: [],
            POST: [],
            PUT: [],
            PATCH: [],
            DELETE: []
        }
    }

    /**
     * Register a route
     * @param {string} method - HTTP method
     * @param {string} path - Route path with optional params (:id)
     * @param {Function} handler - Route handler
     */
    addRoute(method, path, handler) {
        // Convert path to regex pattern
        const paramNames = []
        const pattern = path.replace(/:([^/]+)/g, (_, name) => {
            paramNames.push(name)
            return '([^/]+)'
        })
        
        const regex = new RegExp(`^${pattern}$`)
        
        this.routes[method].push({
            regex,
            paramNames,
            handler,
            path
        })
    }

    // Convenience methods
    get(path, handler) { this.addRoute('GET', path, handler) }
    post(path, handler) { this.addRoute('POST', path, handler) }
    put(path, handler) { this.addRoute('PUT', path, handler) }
    patch(path, handler) { this.addRoute('PATCH', path, handler) }
    delete(path, handler) { this.addRoute('DELETE', path, handler) }

    /**
     * Match request to route
     * @param {Object} req - HTTP request
     * @returns {Object|null} Matched route with params
     */
    match(req) {
        const { pathname } = parseUrl(req.url, true)
        const routes = this.routes[req.method] || []

        for (const route of routes) {
            const match = pathname.match(route.regex)
            if (match) {
                // Extract params
                const params = {}
                route.paramNames.forEach((name, index) => {
                    params[name] = match[index + 1]
                })
                return { handler: route.handler, params }
            }
        }

        return null
    }

    /**
     * Handle request
     * @param {Object} req - HTTP request
     * @param {Object} res - HTTP response
     * @returns {Promise<boolean>} True if route was handled
     */
    async handle(req, res) {
        // Parse query string
        const { query } = parseUrl(req.url, true)
        req.query = query

        const matched = this.match(req)
        
        if (matched) {
            req.params = matched.params
            await matched.handler(req, res)
            return true
        }

        return false
    }
}

module.exports = Router
