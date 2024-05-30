const products = require('../data/products')

function findAll(){
    return new Promise((resolve, reject) => {
        resolve(product)
    })
}

function findById(id){
    return new Promise((resolve, reject) => {
        const product = product.find((p) => p.id === id)
        resolve(product)
    })
}

module.exports = {
    findAll,
    findById
}