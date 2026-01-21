/**
 * Test Suite for Products API
 * Run with: node --test tests/products.test.js
 * Requires Node.js 18+ for built-in test runner
 */

const { describe, it, before, after } = require('node:test')
const assert = require('node:assert')
const http = require('http')

const BASE_URL = 'http://localhost:5000'

/**
 * Helper function to make HTTP requests
 */
function request(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL)
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        }

        const req = http.request(options, (res) => {
            let data = ''
            res.on('data', chunk => data += chunk)
            res.on('end', () => {
                try {
                    const json = data ? JSON.parse(data) : null
                    resolve({ status: res.statusCode, headers: res.headers, body: json })
                } catch {
                    resolve({ status: res.statusCode, headers: res.headers, body: data })
                }
            })
        })

        req.on('error', reject)

        if (body) {
            req.write(JSON.stringify(body))
        }
        req.end()
    })
}

describe('Health Check Endpoints', () => {
    it('GET /health returns 200', async () => {
        const res = await request('GET', '/health')
        assert.strictEqual(res.status, 200)
        assert.strictEqual(res.body.status, 'healthy')
    })

    it('GET /health/live returns uptime', async () => {
        const res = await request('GET', '/health/live')
        assert.strictEqual(res.status, 200)
        assert.ok(res.body.uptime >= 0)
    })

    it('GET /health/ready returns readiness status', async () => {
        const res = await request('GET', '/health/ready')
        assert.strictEqual(res.status, 200)
        assert.ok(res.body.checks)
    })
})

describe('Products API', () => {
    let createdProductId

    describe('GET /api/products', () => {
        it('returns paginated products', async () => {
            const res = await request('GET', '/api/products')
            assert.strictEqual(res.status, 200)
            assert.strictEqual(res.body.success, true)
            assert.ok(Array.isArray(res.body.data))
            assert.ok(res.body.meta.pagination)
        })

        it('supports pagination parameters', async () => {
            const res = await request('GET', '/api/products?page=1&limit=2')
            assert.strictEqual(res.status, 200)
            assert.ok(res.body.data.length <= 2)
            assert.strictEqual(res.body.meta.pagination.limit, 2)
        })

        it('supports search parameter', async () => {
            const res = await request('GET', '/api/products?search=iphone')
            assert.strictEqual(res.status, 200)
            // All returned products should contain 'iphone' in title or description
        })
    })

    describe('POST /api/products', () => {
        it('creates a new product with valid data', async () => {
            const newProduct = {
                title: 'Test Product',
                description: 'This is a test product description that is long enough',
                price: 99.99
            }

            const res = await request('POST', '/api/products', newProduct)
            assert.strictEqual(res.status, 201)
            assert.strictEqual(res.body.success, true)
            assert.ok(res.body.data.id)
            assert.strictEqual(res.body.data.title, newProduct.title)

            createdProductId = res.body.data.id
        })

        it('returns 400 for missing required fields', async () => {
            const res = await request('POST', '/api/products', { title: 'Only Title' })
            assert.strictEqual(res.status, 400)
            assert.strictEqual(res.body.success, false)
            assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR')
        })

        it('returns 400 for invalid price', async () => {
            const res = await request('POST', '/api/products', {
                title: 'Test Product',
                description: 'This is a valid description for testing',
                price: -10
            })
            assert.strictEqual(res.status, 400)
        })

        it('returns 400 for empty body', async () => {
            const res = await request('POST', '/api/products', null)
            assert.strictEqual(res.status, 400)
        })
    })

    describe('GET /api/products/:id', () => {
        it('returns a product by ID', async () => {
            const res = await request('GET', `/api/products/${createdProductId}`)
            assert.strictEqual(res.status, 200)
            assert.strictEqual(res.body.data.id, createdProductId)
        })

        it('returns 404 for non-existent product', async () => {
            const res = await request('GET', '/api/products/non-existent-id')
            assert.strictEqual(res.status, 404)
            assert.strictEqual(res.body.error.code, 'NOT_FOUND')
        })
    })

    describe('PUT /api/products/:id', () => {
        it('updates all fields of a product', async () => {
            const updatedProduct = {
                title: 'Updated Product Title',
                description: 'This is an updated product description that is long enough',
                price: 149.99
            }

            const res = await request('PUT', `/api/products/${createdProductId}`, updatedProduct)
            assert.strictEqual(res.status, 200)
            assert.strictEqual(res.body.data.title, updatedProduct.title)
            assert.strictEqual(res.body.data.price, updatedProduct.price)
        })

        it('returns 404 for non-existent product', async () => {
            const res = await request('PUT', '/api/products/non-existent-id', {
                title: 'Test',
                description: 'Test description that is long enough',
                price: 10
            })
            assert.strictEqual(res.status, 404)
        })
    })

    describe('PATCH /api/products/:id', () => {
        it('partially updates a product', async () => {
            const res = await request('PATCH', `/api/products/${createdProductId}`, {
                price: 199.99
            })
            assert.strictEqual(res.status, 200)
            assert.strictEqual(res.body.data.price, 199.99)
            // Title should remain from previous update
            assert.strictEqual(res.body.data.title, 'Updated Product Title')
        })
    })

    describe('DELETE /api/products/:id', () => {
        it('deletes a product', async () => {
            const res = await request('DELETE', `/api/products/${createdProductId}`)
            assert.strictEqual(res.status, 204)
        })

        it('returns 404 when deleting non-existent product', async () => {
            const res = await request('DELETE', `/api/products/${createdProductId}`)
            assert.strictEqual(res.status, 404)
        })
    })
})

describe('Security Headers', () => {
    it('includes security headers in response', async () => {
        const res = await request('GET', '/api/products')
        assert.ok(res.headers['x-content-type-options'])
        assert.ok(res.headers['x-frame-options'])
        assert.ok(res.headers['x-request-id'])
    })
})

describe('Rate Limiting', () => {
    it('includes rate limit headers', async () => {
        const res = await request('GET', '/api/products')
        assert.ok(res.headers['x-ratelimit-limit'])
        assert.ok(res.headers['x-ratelimit-remaining'])
    })
})

describe('Error Handling', () => {
    it('returns 404 for unknown routes', async () => {
        const res = await request('GET', '/unknown-route')
        assert.strictEqual(res.status, 404)
        assert.strictEqual(res.body.error.code, 'NOT_FOUND')
    })

    it('handles malformed JSON gracefully', async () => {
        // This test requires the server to handle invalid JSON
        // The current implementation should return 400
    })
})

console.log(`
╔════════════════════════════════════════════════════════════╗
║                    API Test Suite                          ║
╠════════════════════════════════════════════════════════════╣
║  Make sure the server is running before executing tests:   ║
║  npm run dev                                               ║
║                                                            ║
║  Run tests with:                                           ║
║  node --test tests/products.test.js                        ║
╚════════════════════════════════════════════════════════════╝
`)
