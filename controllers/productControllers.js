const Product = require('../models/productModel')

//gets all products
//the route is GET api/product/:id

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
    getProduct
}