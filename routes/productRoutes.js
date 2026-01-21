/**
 * Product Routes
 * Defines all product-related API endpoints
 */

const Router = require('./router')
const productController = require('../controllers/productController')

const router = new Router()

// GET /api/products - Get all products with pagination
router.get('/api/products', productController.getProducts)

// GET /api/products/:id - Get single product by ID
router.get('/api/products/:id', productController.getProduct)

// POST /api/products - Create new product
router.post('/api/products', productController.createProduct)

// PUT /api/products/:id - Full update of product
router.put('/api/products/:id', productController.updateProduct)

// PATCH /api/products/:id - Partial update of product
router.patch('/api/products/:id', productController.patchProduct)

// DELETE /api/products/:id - Delete product
router.delete('/api/products/:id', productController.deleteProduct)

module.exports = router
