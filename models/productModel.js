/**
 * Product Model
 * Data access layer for products with timestamps and validation
 */

let products = require('../data/products.json')
const { v4: uuidv4 } = require('uuid')
const { writeDataToFile } = require('../utils')
const logger = require('../utils/logger')

/**
 * Find all products
 * @returns {Promise<Array>} All products
 */
function findAll() {
    return new Promise((resolve) => {
        resolve([...products]) // Return copy to prevent mutation
    })
}

/**
 * Find product by ID
 * @param {string} id - Product ID
 * @returns {Promise<Object|undefined>} Product or undefined
 */
function findById(id) {
    return new Promise((resolve) => {
        const product = products.find((p) => p.id === id)
        resolve(product ? { ...product } : undefined)
    })
}

/**
 * Create a new product
 * @param {Object} product - Product data
 * @returns {Promise<Object>} Created product
 */
function create(product) {
    return new Promise((resolve, reject) => {
        try {
            const now = new Date().toISOString()
            const newProduct = {
                id: uuidv4(),
                ...product,
                createdAt: now,
                updatedAt: now
            }
            
            products.push(newProduct)
            writeDataToFile('./data/products.json', products)
            
            resolve({ ...newProduct })
        } catch (error) {
            logger.error('Failed to create product', { error: error.message })
            reject(error)
        }
    })
}

/**
 * Update a product
 * @param {string} id - Product ID
 * @param {Object} product - Updated product data
 * @returns {Promise<Object>} Updated product
 */
function update(id, product) {
    return new Promise((resolve, reject) => {
        try {
            const index = products.findIndex((p) => p.id === id)
            
            if (index === -1) {
                resolve(undefined)
                return
            }

            const existingProduct = products[index]
            const updatedProduct = {
                ...existingProduct,
                ...product,
                id, // Ensure ID doesn't change
                createdAt: existingProduct.createdAt, // Preserve creation timestamp
                updatedAt: new Date().toISOString()
            }
            
            products[index] = updatedProduct
            writeDataToFile('./data/products.json', products)
            
            resolve({ ...updatedProduct })
        } catch (error) {
            logger.error('Failed to update product', { error: error.message, productId: id })
            reject(error)
        }
    })
}

/**
 * Remove a product
 * @param {string} id - Product ID
 * @returns {Promise<boolean>} True if deleted
 */
function remove(id) {
    return new Promise((resolve, reject) => {
        try {
            const initialLength = products.length
            products = products.filter((p) => p.id !== id)
            
            if (products.length < initialLength) {
                writeDataToFile('./data/products.json', products)
                resolve(true)
            } else {
                resolve(false)
            }
        } catch (error) {
            logger.error('Failed to remove product', { error: error.message, productId: id })
            reject(error)
        }
    })
}

/**
 * Count total products
 * @returns {Promise<number>} Product count
 */
function count() {
    return new Promise((resolve) => {
        resolve(products.length)
    })
}

/**
 * Check if product exists
 * @param {string} id - Product ID
 * @returns {Promise<boolean>} Exists
 */
function exists(id) {
    return new Promise((resolve) => {
        resolve(products.some((p) => p.id === id))
    })
}

module.exports = {
    findAll,
    findById,
    create,
    update,
    remove,
    count,
    exists
}