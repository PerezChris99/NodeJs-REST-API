const Product = require('../models/productModel')

async function getProducts(req, res, id){
    try{
        const products = await Product.findAll()

        if(!products){  
            res.writeHead(404, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ message: 'Product Not Found' }))
        } else {
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify(products))
        }
    } catch (error) {
        console.log(error)
    }
}

async function getProduct(req, res, id){
    try{
        const product = await Product.findById(id)

        if(!product){  
            res.writeHead(404, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ message: 'Product Not Found' }))
        } else {
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify(product))
        }
    } catch(error){
        console.log(error)
    }
}

async function createProduct(req, res){
    try{
        const product = {
            title: 'Test Product',
            description: 'This is my product',
            price: 100
        }

        const newProduct = await Product.create(product)

        res.writeHead(201, { 'Content-Type': 'application/json' })
        return res.end(JSON.stringify(newProduct))

    } catch (error) {
        console.log(error)
    }
}

module.exports = {
    getProduct,
    getProducts,
    createProduct
}