/**
 * Product Controller
 * Handles all product-related HTTP requests with validation and error handling
 */

const Product = require('../models/productModel')
const { getPostData } = require('../utils')
const { sendSuccess, sendCreated, sendNoContent, sendPaginated } = require('../utils/response')
const { NotFoundError, BadRequestError } = require('../utils/errors')
const { validate, productSchema, validatePagination } = require('../utils/validator')
const { asyncHandler } = require('../middleware/errorHandler')
const logger = require('../utils/logger')

/**
 * GET /api/products
 * Get all products with pagination and search
 */
const getProducts = asyncHandler(async (req, res) => {
    const { page, limit, offset } = validatePagination(req.query || {})
    const search = req.query?.search?.toLowerCase()

    let products = await Product.findAll()
    
    // Apply search filter if provided
    if (search) {
        products = products.filter(p => 
            p.title.toLowerCase().includes(search) || 
            p.description.toLowerCase().includes(search)
        )
    }

    // Apply sorting if provided
    const sortBy = req.query?.sortBy || 'title'
    const sortOrder = req.query?.sortOrder === 'desc' ? -1 : 1
    
    if (['title', 'price', 'createdAt'].includes(sortBy)) {
        products.sort((a, b) => {
            if (a[sortBy] < b[sortBy]) return -1 * sortOrder
            if (a[sortBy] > b[sortBy]) return 1 * sortOrder
            return 0
        })
    }

    const total = products.length
    
    // Apply pagination
    const paginatedProducts = products.slice(offset, offset + limit)

    sendPaginated(res, paginatedProducts, { page, limit, total })
})

/**
 * GET /api/products/:id
 * Get single product by ID
 */
const getProduct = asyncHandler(async (req, res) => {
    const id = req.params?.id

    if (!id || id.trim() === '') {
        throw new BadRequestError('Product ID is required')
    }

    const product = await Product.findById(id)

    if (!product) {
        throw new NotFoundError('Product')
    }

    sendSuccess(res, product)
})

/**
 * POST /api/products
 * Create a new product
 */
const createProduct = asyncHandler(async (req, res) => {
    const body = await getPostData(req)
    
    if (!body || body.trim() === '') {
        throw new BadRequestError('Request body is required')
    }

    let data
    try {
        data = JSON.parse(body)
    } catch (e) {
        throw new BadRequestError('Invalid JSON in request body')
    }

    // Validate input
    const validatedData = validate(data, productSchema)

    // Create product
    const newProduct = await Product.create(validatedData)

    logger.info('Product created', { productId: newProduct.id, title: newProduct.title })

    sendCreated(res, newProduct)
})

/**
 * PUT /api/products/:id
 * Full update of a product (all fields required)
 */
const updateProduct = asyncHandler(async (req, res) => {
    const id = req.params?.id

    const product = await Product.findById(id)
    if (!product) {
        throw new NotFoundError('Product')
    }

    const body = await getPostData(req)
    
    if (!body || body.trim() === '') {
        throw new BadRequestError('Request body is required')
    }

    let data
    try {
        data = JSON.parse(body)
    } catch (e) {
        throw new BadRequestError('Invalid JSON in request body')
    }

    // Full validation (all fields required)
    const validatedData = validate(data, productSchema)

    const updatedProduct = await Product.update(id, validatedData)

    logger.info('Product updated', { productId: id })

    sendSuccess(res, updatedProduct)
})

/**
 * PATCH /api/products/:id
 * Partial update of a product (only provided fields)
 */
const patchProduct = asyncHandler(async (req, res) => {
    const id = req.params?.id

    const product = await Product.findById(id)
    if (!product) {
        throw new NotFoundError('Product')
    }

    const body = await getPostData(req)
    
    if (!body || body.trim() === '') {
        throw new BadRequestError('Request body is required')
    }

    let data
    try {
        data = JSON.parse(body)
    } catch (e) {
        throw new BadRequestError('Invalid JSON in request body')
    }

    // Partial validation (only validate provided fields)
    const validatedData = validate(data, productSchema, { partial: true })

    if (Object.keys(validatedData).length === 0) {
        throw new BadRequestError('At least one field must be provided for update')
    }

    // Merge with existing data
    const mergedData = {
        title: validatedData.title ?? product.title,
        description: validatedData.description ?? product.description,
        price: validatedData.price ?? product.price
    }

    const updatedProduct = await Product.update(id, mergedData)

    logger.info('Product patched', { productId: id, fields: Object.keys(validatedData) })

    sendSuccess(res, updatedProduct)
})

/**
 * DELETE /api/products/:id
 * Delete a product
 */
const deleteProduct = asyncHandler(async (req, res) => {
    const id = req.params?.id

    const product = await Product.findById(id)
    if (!product) {
        throw new NotFoundError('Product')
    }

    await Product.remove(id)

    logger.info('Product deleted', { productId: id })

    sendNoContent(res)
})

module.exports = {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    patchProduct,
    deleteProduct
}