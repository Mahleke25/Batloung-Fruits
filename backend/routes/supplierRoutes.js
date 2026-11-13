const express = require('express');

const router = express.Router();

const {
    getAllSuppliers,
    getSupplierById,
    createSupplier,
    updateSupplier,
    deleteSupplier
} = require('../controllers/supplierController');

// GET all suppliers
router.get('/', getAllSuppliers);

// GET one supplier by ID
router.get('/:id', getSupplierById);

// POST - Create a new supplier
router.post('/', createSupplier);

// PUT - Update a supplier
router.put('/:id', updateSupplier);

// DELETE - Delete a supplier
router.delete('/:id', deleteSupplier);

module.exports = router;