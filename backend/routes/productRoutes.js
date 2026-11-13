const express = require('express');

const router = express.Router();

const {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');

// GET all products
router.get('/', getAllProducts);

// GET one product by ID
router.get('/:id', getProductById);

// POST - Create a new product
router.post('/', createProduct);

// PUT - Update a product
router.put('/:id', updateProduct);

// DELETE - Delete a product
router.delete('/:id', deleteProduct);

module.exports = router;