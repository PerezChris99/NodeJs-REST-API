const Product = require('../models/productModel')

// @description   gets all products
// @specific route  the route is GET api/products

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

// @description   gets a single product
// @specific route  the route is GET api/products/:id


async function getProduct(req, res, id){
    try{
        const product = await Product.findById(id)

        if(!product){  
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ message: 'Product Not Found' }))
        } else {
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify(product))
        }
    } catch(error){
        console.log(error)
    }
}

module.exports = {
    getProduct,
    getProducts
}